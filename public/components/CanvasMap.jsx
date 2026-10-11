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

/* Satellite background. The photos are Esri World Imagery tiles, the usual
   256px squares in the web mercator grid. Each tile is drawn into the
   rectangle its corners land on in our projection, which is close enough
   at this zoom that the coast lines up with the border data. If the tiles
   cannot load (no internet) the map just keeps its plain drawn look. */
const TILE_ZOOM = 9;
const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/';

const lngToTileX = (lng, n) => Math.floor(((lng + 180) / 360) * n);
const latToTileY = (lat, n) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
};
const tileXToLng = (x, n) => (x / n) * 360 - 180;
const tileYToLat = (y, n) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;

// every tile that covers the map window, with where it goes on the canvas
function satelliteTiles() {
  const n = 2 ** TILE_ZOOM;
  const [minLng, minLat, maxLng, maxLat] = DATA.view;
  const tiles = [];
  for (let x = lngToTileX(minLng, n); x <= lngToTileX(maxLng, n); x++) {
    for (let y = latToTileY(maxLat, n); y <= latToTileY(minLat, n); y++) {
      const [x0, y0] = PROJECTION.toCanvas([tileXToLng(x, n), tileYToLat(y, n)]);
      const [x1, y1] = PROJECTION.toCanvas([tileXToLng(x + 1, n), tileYToLat(y + 1, n)]);
      tiles.push({ src: `${TILE_URL}${TILE_ZOOM}/${y}/${x}`, x0, y0, w: x1 - x0, h: y1 - y0 });
    }
  }
  return tiles;
}

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
  const [satellite, setSatellite] = useState(null); // loaded tiles, null until all are in

  // load the satellite tiles once. the map draws without them until they are ready
  useEffect(() => {
    const tiles = satelliteTiles();
    let alive = true;
    Promise.all(tiles.map((t) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(Object.assign({ img }, t));
      img.onerror = reject;
      img.src = t.src;
    })))
      .then((loaded) => { if (alive) setSatellite(loaded); })
      .catch(() => { /* offline, stay with the drawn map */ });
    return () => { alive = false; };
  }, []);

  // ------------------------------------------------------------------ drawing
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // the background, which is the sea
    ctx.fillStyle = '#0d1b26';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (satellite) {
      // the satellite photos, then the neighbours dimmed so Israel stands out
      satellite.forEach((t) => ctx.drawImage(t.img, t.x0, t.y0, t.w, t.h));
      DATA.surroundings.forEach((ring) => {
        tracePath(ctx, ring);
        ctx.fillStyle = 'rgba(8, 10, 14, 0.5)';
        ctx.fill();
      });
      tracePath(ctx, DATA.israel);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
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
    }

    // a dot and a label for each city. on the photo they get a dark outline
    // so they stay readable over sand and sea alike
    cities.forEach((city) => {
      const [x, y] = PROJECTION.toCanvas(city.coordinates);
      ctx.beginPath();
      ctx.arc(x, y, city.major ? 3 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = city.major ? '#ffffff' : '#c5ced8';
      ctx.fill();
      if (satellite) {
        ctx.strokeStyle = '#0f1216';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // only the bigger cities get a name, otherwise the centre of the
      // country turns into a pile of overlapping labels
      if (city.major) {
        // the canvas is not part of the page text, so ask i18n.js directly
        const label = window.I18N ? window.I18N.t(city.name) : city.name;
        ctx.font = '600 11px Segoe UI, sans-serif';
        if (satellite) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.strokeText(label, x + 5, y + 4);
        }
        ctx.fillStyle = satellite ? '#ffffff' : '#8b98a6';
        ctx.fillText(label, x + 5, y + 4);
      }
    });

    if (satellite) {
      // the imagery licence asks for credit on the map itself
      ctx.font = '9px Segoe UI, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Imagery © Esri', WIDTH - 72, HEIGHT - 6);
    }

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
  }, [polygon, hover, results, cities, satellite]);

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
