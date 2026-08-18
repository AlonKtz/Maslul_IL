/*
  The map. A React component that draws Israel onto a canvas and lets you
  click points to outline the area you care about.

  The shape gets sent to the server, which sends back the meets, races or
  items for sale that sit inside it. Mongo does the actual work with
  $geoWithin.

  Nothing here comes off the internet. The outline is just the list of
  coordinates below, drawn by hand, so the map still works with no connection.
  I went this way instead of using a map library because the project is only
  allowed to use what we covered in class, and it also means nothing breaks if
  the wifi in the lab is down.

  This is the component that covers the Canvas part of the React requirement.
*/

const { useState, useRef, useEffect, useCallback } = React;

/* A rough outline of Israel as [longitude, latitude] pairs. It is a
   rough shape, just enough to recognise the country and place the cities. */
const ISRAEL_OUTLINE = [
  [35.10, 33.09], [35.55, 33.25], [35.60, 32.95], [35.55, 32.70],
  [35.57, 32.38], [35.55, 32.10], [35.22, 31.90], [35.45, 31.50],
  [35.40, 31.10], [35.20, 30.60], [35.15, 30.10], [34.97, 29.55],
  [34.90, 29.49], [34.88, 30.10], [34.55, 30.65], [34.42, 31.10],
  [34.49, 31.59], [34.65, 31.85], [34.75, 32.05], [34.85, 32.30],
  [34.92, 32.55], [35.00, 32.83],
];

const WIDTH = 340;
const HEIGHT = 660;
const PADDING = 16;

/* Longitude gets squashed by cos(latitude), otherwise the country comes out
   too wide. This keeps it roughly the right
   proportions instead of looking too wide. */
const MEAN_LAT_RAD = (31.3 * Math.PI) / 180;
const LNG_SCALE = Math.cos(MEAN_LAT_RAD);

function computeProjection(points) {
  const xs = points.map((p) => p[0] * LNG_SCALE);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const scale = Math.min(
    (WIDTH - PADDING * 2) / (maxX - minX),
    (HEIGHT - PADDING * 2) / (maxY - minY)
  );

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

const PROJECTION = computeProjection(ISRAEL_OUTLINE);

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

    // the country itself
    ctx.beginPath();
    ISRAEL_OUTLINE.forEach((point, i) => {
      const [x, y] = PROJECTION.toCanvas(point);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = '#1f262e';
    ctx.fill();
    ctx.strokeStyle = '#3b4653';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // a dot and a label for each city
    cities.forEach((city) => {
      const [x, y] = PROJECTION.toCanvas(city.coordinates);
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#97a3b0';
      ctx.fill();
      ctx.fillStyle = '#6f7c89';
      ctx.font = '9px Segoe UI, sans-serif';
      ctx.fillText(city.name, x + 5, y + 3);
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
