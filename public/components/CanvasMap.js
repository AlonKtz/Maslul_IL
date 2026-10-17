const { useState, useRef, useEffect, useCallback } = React;
const DATA = window.MAP_DATA;
const WIDTH = 420;
const HEIGHT = 720;
const MEAN_LAT_RAD = 31.4 * Math.PI / 180;
const LNG_SCALE = Math.cos(MEAN_LAT_RAD);
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
        (maxY - lat) * scale + offsetY
      ];
    },
    // and the other way round, pixels back into real coordinates
    toGeo(x, y) {
      return [
        ((x - offsetX) / scale + minX) / LNG_SCALE,
        maxY - (y - offsetY) / scale
      ];
    }
  };
}
const PROJECTION = computeProjection(DATA.view);
const TILE_ZOOM = 9;
const TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/";
const lngToTileX = (lng, n) => Math.floor((lng + 180) / 360 * n);
const latToTileY = (lat, n) => {
  const r = lat * Math.PI / 180;
  return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n);
};
const tileXToLng = (x, n) => x / n * 360 - 180;
const tileYToLat = (y, n) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
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
  const [polygon, setPolygon] = useState([]);
  const [hover, setHover] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [satellite, setSatellite] = useState(null);
  const [lang, setLang] = useState(window.I18N ? window.I18N.lang : "en");
  useEffect(() => {
    const onChange = (e) => setLang(e.detail.lang);
    document.addEventListener("i18n:change", onChange);
    return () => document.removeEventListener("i18n:change", onChange);
  }, []);
  useEffect(() => {
    const tiles = satelliteTiles();
    let alive = true;
    Promise.all(tiles.map((t) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(Object.assign({ img }, t));
      img.onerror = reject;
      img.src = t.src;
    }))).then((loaded) => {
      if (alive) setSatellite(loaded);
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, []);
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#0d1b26";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (satellite) {
      satellite.forEach((t) => ctx.drawImage(t.img, t.x0, t.y0, t.w, t.h));
      DATA.surroundings.forEach((ring) => {
        tracePath(ctx, ring);
        ctx.fillStyle = "rgba(8, 10, 14, 0.5)";
        ctx.fill();
      });
      tracePath(ctx, DATA.israel);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      DATA.surroundings.forEach((ring) => {
        tracePath(ctx, ring);
        ctx.fillStyle = "#1b2129";
        ctx.fill();
        ctx.strokeStyle = "#242c35";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
      tracePath(ctx, DATA.israel);
      ctx.fillStyle = "#1f262e";
      ctx.fill();
      ctx.strokeStyle = "#4a5663";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      DATA.lakes.forEach((lake) => {
        tracePath(ctx, lake.ring);
        ctx.fillStyle = "#0d1b26";
        ctx.fill();
        ctx.strokeStyle = "#2b3a48";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
    cities.forEach((city) => {
      const [x, y] = PROJECTION.toCanvas(city.coordinates);
      ctx.beginPath();
      ctx.arc(x, y, city.major ? 3 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = city.major ? "#ffffff" : "#c5ced8";
      ctx.fill();
      if (satellite) {
        ctx.strokeStyle = "#0f1216";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (city.major) {
        const label = window.I18N ? window.I18N.t(city.name) : city.name;
        ctx.font = "600 11px Segoe UI, sans-serif";
        if (satellite) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
          ctx.strokeText(label, x + 5, y + 4);
        }
        ctx.fillStyle = satellite ? "#ffffff" : "#8b98a6";
        ctx.fillText(label, x + 5, y + 4);
      }
    });
    if (satellite) {
      ctx.font = "9px Segoe UI, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillText("Imagery \xA9 Esri", WIDTH - 72, HEIGHT - 6);
    }
    if (results && results.points) {
      results.points.forEach((p) => {
        const [x, y] = PROJECTION.toCanvas(p.coordinates);
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(244, 162, 97, 0.9)";
        ctx.fill();
        ctx.strokeStyle = "#0f1216";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
    if (polygon.length) {
      const pts = polygon.map((p) => PROJECTION.toCanvas(p));
      ctx.beginPath();
      pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
      if (hover && polygon.length >= 1) ctx.lineTo(hover[0], hover[1]);
      if (polygon.length >= 3) {
        ctx.closePath();
        ctx.fillStyle = "rgba(230, 57, 70, 0.18)";
        ctx.fill();
      }
      ctx.strokeStyle = "#e63946";
      ctx.lineWidth = 2;
      ctx.stroke();
      pts.forEach(([x, y], i) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? "#f4a261" : "#e63946";
        ctx.fill();
      });
    }
  }, [polygon, hover, results, cities, satellite, lang]);
  useEffect(() => {
    draw();
  }, [draw]);
  function canvasPoint(evt) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (evt.clientX - rect.left) * (WIDTH / rect.width);
    const y = (evt.clientY - rect.top) * (HEIGHT / rect.height);
    return [x, y];
  }
  function handleClick(evt) {
    const [x, y] = canvasPoint(evt);
    setPolygon((prev) => prev.concat([PROJECTION.toGeo(x, y)]));
    setError("");
  }
  function handleMove(evt) {
    if (!polygon.length) return;
    setHover(canvasPoint(evt));
  }
  function handleLeave() {
    setHover(null);
  }
  function undo() {
    setPolygon((prev) => prev.slice(0, -1));
  }
  function clear() {
    setPolygon([]);
    setResults(null);
    setError("");
  }
  function search() {
    if (polygon.length < 3) {
      setError("Click at least three points on the map to outline an area.");
      return;
    }
    setLoading(true);
    setError("");
    const url = mode === "listings" ? "/api/listings/area" : "/api/events/area";
    window.jQuery.ajax({
      url,
      type: "POST",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify({ polygon })
    }).done((res) => {
      const items = mode === "listings" ? res.listings : res.events;
      setResults({
        items,
        points: items.map((it) => ({ coordinates: it.location.coordinates }))
      });
    }).fail((jq) => {
      setError(window.API ? window.API.errorMessage(jq) : "Search failed.");
      setResults(null);
    }).always(() => setLoading(false));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "map-wrap" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
    "canvas",
    {
      ref: canvasRef,
      width: WIDTH,
      height: HEIGHT,
      className: "area-canvas",
      onClick: handleClick,
      onMouseMove: handleMove,
      onMouseLeave: handleLeave
    }
  ), /* @__PURE__ */ React.createElement("p", { className: "hint", style: { marginTop: ".5rem" } }, "Click on the map to drop points around the area you care about. Three points or more make a shape."), /* @__PURE__ */ React.createElement("div", { className: "form-actions" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", type: "button", onClick: search, disabled: loading }, loading ? "Searching\u2026" : "Search this area"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", type: "button", onClick: undo, disabled: !polygon.length }, "Undo point"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", type: "button", onClick: clear }, "Clear")), error ? /* @__PURE__ */ React.createElement("p", { className: "form-error", style: { display: "block" } }, error) : null), /* @__PURE__ */ React.createElement("div", { className: "map-results" }, /* @__PURE__ */ React.createElement("h3", { className: "small" }, results ? `${results.items.length} found in this area` : "Nothing searched yet"), results && results.items.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "empty" }, "Nothing inside that shape. Try a wider area.") : null, results ? results.items.map(
    (item) => mode === "listings" ? /* @__PURE__ */ React.createElement("div", { className: "card", key: item._id, style: { margin: ".75rem 0", padding: "1rem" } }, /* @__PURE__ */ React.createElement("a", { href: `/market/${item._id}` }, /* @__PURE__ */ React.createElement("strong", null, item.title)), /* @__PURE__ */ React.createElement("p", { className: "price", style: { margin: ".25rem 0" } }, "\u20AA ", Number(item.price).toLocaleString("en-US")), /* @__PURE__ */ React.createElement("p", { className: "item-meta" }, item.category, " \xB7 ", item.city)) : /* @__PURE__ */ React.createElement("div", { className: "card", key: item._id, style: { margin: ".75rem 0", padding: "1rem" } }, /* @__PURE__ */ React.createElement("span", { className: "badge " + (item.type === "race" ? "badge-race" : "badge-meet") }, item.type === "race" ? item.raceType || "Race" : "Meet"), /* @__PURE__ */ React.createElement("p", { style: { margin: ".4rem 0 .2rem" } }, /* @__PURE__ */ React.createElement("a", { href: `/events/${item._id}` }, /* @__PURE__ */ React.createElement("strong", null, item.title))), /* @__PURE__ */ React.createElement("p", { className: "item-meta" }, item.city), /* @__PURE__ */ React.createElement("p", { className: "item-meta" }, window.UI ? window.UI.formatDateTime(item.startsAt) : item.startsAt))
  ) : null));
}
window.CanvasMap = CanvasMap;
