/*
  The map. A React component that draws Israel onto a canvas and lets you
  click points to outline the area you care about.

  The shape gets sent to the server, which sends back the meets, races or
  items for sale that sit inside it. Mongo does the actual work with
  $geoWithin.

  The border, the neighbouring land and the two lakes come from Natural Earth,
  which is public domain map data, and live in mapData.js next to this file.
  Nothing is fetched off the internet while the page runs, so the map still
  works with no connection. I went this way instead of using a map library
  because the project is only allowed to use what we covered in class, and it
  also means nothing breaks if the wifi in the lab is down.

  This is the component that covers the Canvas part of the React requirement.
*/

const { useState, useRef, useEffect, useCallback } = React;

const DATA = window.MAP_DATA;

const WIDTH = 420;
const HEIGHT = 720;

/* Longitude gets squashed by cos(latitude), otherwise the country comes out
   too wide. This keeps it roughly the right proportions. */
const MEAN_LAT_RAD = (31.4 * Math.PI) / 180;
const LNG_SCALE = Math.cos(MEAN_LAT_RAD);

/* The projection is fixed to the window in mapData.view, so the whole region
   always fits the canvas the same way no matter what is drawn on it. */
function computeProjection([minLng, minLat, maxLng, maxLat]) {
  const minX = minLng * LNG_SCALE;
  const maxX = maxLng * LNG_SCALE;
  const minY = minLat;
  const maxY = maxLat;

  const scale = Math.min(WIDTH / (maxX - minX), HEIGHT / (maxY - minY));
  const offsetX = (WIDTH - (maxX - minX) * scale) / 2;
  const offsetY = (HEIGHT - (maxY - minY) * scale) / 2;

  return {
    // turns real coordinates into pixels on the canvas
    toCanvas([lng, lat]) {
      return [
        (lng * LNG_SCALE - minX) * scale + offsetX,
        // canvas y counts downwards but latitude counts upwards, so flip it
        (maxY - lat) * scale + offsetY,
      ];
    },
    // and the other way round, pixels back into real coordinates
    toGeo(x, y) {
      return [
        ((x - offsetX) / scale + minX) / LNG_SCALE,
        maxY - (y - offsetY) / scale,
      ];
    },
  };
}

const PROJECTION = computeProjection(DATA.view);

// traces a ring of [lng, lat] points as a path on the canvas
function tracePath(ctx, ring) {
  ctx.beginPath();
  ring.forEach((point, i) => {
    const [x, y] = PROJECTION.toCanvas(point);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function CanvasMap({ cities, mode }) {
  const canvasRef = useRef(null);
  const [polygon, setPolygon] = useState([]);   // geographic points the user clicked
  const [hover, setHover] = useState(null);     // canvas point under the cursor
  const [results, setResults] = useState(null); // what the server sent back
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ------------------------------------------------------------------ drawing
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // the background, which is the sea
    ctx.fillStyle = '#0d1b26';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // the neighbouring land, one flat tone, no labels. it is only here so the
    // country reads as a country instead of a shape floating in the water
    DATA.surroundings.forEach((ring) => {
      tracePath(ctx, ring);
      ctx.fillStyle = '#1b2129';
      ctx.fill();
      ctx.strokeStyle = '#242c35';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // the country itself, at full detail from the real border data
    tracePath(ctx, DATA.israel);
    ctx.fillStyle = '#1f262e';
    ctx.fill();
    ctx.strokeStyle = '#4a5663';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // the Sea of Galilee and the Dead Sea, drawn in the sea colour on top
    DATA.lakes.forEach((lake) => {
      tracePath(ctx, lake.ring);
      ctx.fillStyle = '#0d1b26';
      ctx.fill();
      ctx.strokeStyle = '#2b3a48';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // a dot and a label for each city
    cities.forEach((city) => {
      const [x, y] = PROJECTION.toCanvas(city.coordinates);
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = city.major ? '#c5ced8' : '#6f7c89';
      ctx.fill();
      // only the bigger cities get a name, otherwise the centre of the
      // country turns into a pile of overlapping labels
      if (city.major) {
        ctx.fillStyle = '#8b98a6';
        ctx.font = '10px Segoe UI, sans-serif';
        ctx.fillText(city.name, x + 5, y + 3);
      }
    });

    // the things the search found, drawn as bigger markers
    if (results && results.points) {
      results.points.forEach((p) => {
        const [x, y] = PROJECTION.toCanvas(p.coordinates);
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 162, 97, 0.9)';
        ctx.fill();
        ctx.strokeStyle = '#0f1216';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // the shape the user is drawing right now
    if (polygon.length) {
      const pts = polygon.map((p) => PROJECTION.toCanvas(p));

      ctx.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));

      // a line follows the mouse so you can see where the next side would go
      if (hover && polygon.length >= 1) ctx.lineTo(hover[0], hover[1]);

      if (polygon.length >= 3) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(230, 57, 70, 0.18)';
        ctx.fill();
      }

      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 2;
      ctx.stroke();

      // the little circles on each corner
      pts.forEach(([x, y], i) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#f4a261' : '#e63946';
        ctx.fill();
      });
    }
  }, [polygon, hover, results, cities]);

  useEffect(() => { draw(); }, [draw]);

  // ------------------------------------------------------------------ input
  function canvasPoint(evt) {
    const rect = canvasRef.current.getBoundingClientRect();
    // the canvas is stretched by css, so a click at 300px on screen is not
    // 300px on the canvas. this scales it back.
    const x = (evt.clientX - rect.left) * (WIDTH / rect.width);
    const y = (evt.clientY - rect.top) * (HEIGHT / rect.height);
    return [x, y];
  }

  function handleClick(evt) {
    const [x, y] = canvasPoint(evt);
    setPolygon((prev) => prev.concat([PROJECTION.toGeo(x, y)]));
    setError('');
  }

  function handleMove(evt) {
    if (!polygon.length) return;
    setHover(canvasPoint(evt));
  }

  function handleLeave() { setHover(null); }

  function undo() {
    setPolygon((prev) => prev.slice(0, -1));
  }

  function clear() {
    setPolygon([]);
    setResults(null);
    setError('');
  }

  // ------------------------------------------------------------------ search
  function search() {
    if (polygon.length < 3) {
      setError('Click at least three points on the map to outline an area.');
      return;
    }

    setLoading(true);
    setError('');

    const url = mode === 'listings' ? '/api/listings/area' : '/api/events/area';

    // jQuery ajax, same as everywhere else in the project
    window.jQuery
      .ajax({
        url,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({ polygon }),
      })
      .done((res) => {
        const items = mode === 'listings' ? res.listings : res.events;
        setResults({
          items,
          points: items.map((it) => ({ coordinates: it.location.coordinates })),
        });
      })
      .fail((jq) => {
        setError(window.API ? window.API.errorMessage(jq) : 'Search failed.');
        setResults(null);
      })
      .always(() => setLoading(false));
  }

  // ------------------------------------------------------------------ render
  return (
    <div className="map-wrap">
      <div>
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="area-canvas"
          onClick={handleClick}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        />
        <p className="hint" style={{ marginTop: '.5rem' }}>
          Click on the map to drop points around the area you care about.
          Three points or more make a shape.
        </p>
        <div className="form-actions">
          <button className="btn btn-primary" type="button" onClick={search} disabled={loading}>
            {loading ? 'Searching…' : 'Search this area'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={undo} disabled={!polygon.length}>
            Undo point
          </button>
          <button className="btn btn-ghost" type="button" onClick={clear}>Clear</button>
        </div>
        {error ? <p className="form-error" style={{ display: 'block' }}>{error}</p> : null}
      </div>

      <div className="map-results">
        <h3 className="small">
          {results
            ? `${results.items.length} found in this area`
            : 'Nothing searched yet'}
        </h3>

        {results && results.items.length === 0 ? (
          <p className="empty">Nothing inside that shape. Try a wider area.</p>
        ) : null}

        {results
          ? results.items.map((item) =>
              mode === 'listings' ? (
                <div className="card" key={item._id} style={{ margin: '.75rem 0', padding: '1rem' }}>
                  <a href={`/market/${item._id}`}><strong>{item.title}</strong></a>
                  <p className="price" style={{ margin: '.25rem 0' }}>
                    {'₪ '}{Number(item.price).toLocaleString('en-US')}
                  </p>
                  <p className="item-meta">{item.category} · {item.city}</p>
                </div>
              ) : (
                <div className="card" key={item._id} style={{ margin: '.75rem 0', padding: '1rem' }}>
                  <span className={'badge ' + (item.type === 'race' ? 'badge-race' : 'badge-meet')}>
                    {item.type === 'race' ? (item.raceType || 'Race') : 'Meet'}
                  </span>
                  <p style={{ margin: '.4rem 0 .2rem' }}>
                    <a href={`/events/${item._id}`}><strong>{item.title}</strong></a>
                  </p>
                  <p className="item-meta">{item.city}</p>
                  <p className="item-meta">
                    {window.UI ? window.UI.formatDateTime(item.startsAt) : item.startsAt}
                  </p>
                </div>
              )
            )
          : null}
      </div>
    </div>
  );
}

window.CanvasMap = CanvasMap;
