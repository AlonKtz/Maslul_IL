const { useState, useRef, useEffect } = React;
function formatTime(seconds) {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ":" + String(s).padStart(2, "0");
}
function VideoShowcase({ videos = [], showClips = true }) {
  const videoRef = useRef(null);
  const [clips, setClips] = useState([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [tab, setTab] = useState(videos.length || !showClips ? "youtube" : "local");
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    window.jQuery.getJSON("/video/clips.json").done((data) => setClips(Array.isArray(data) ? data : [])).fail(() => setClips([]));
  }, []);
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);
  useEffect(() => {
    setTime(0);
    setPlaying(false);
    setLoadError(false);
  }, [current]);
  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      const started = video.play();
      if (started && started.catch) started.catch(() => setLoadError(true));
    } else {
      video.pause();
    }
  }
  function seek(evt) {
    const video = videoRef.current;
    if (!video || !isFinite(video.duration)) return;
    video.currentTime = Number(evt.target.value) / 100 * video.duration;
  }
  const clip = clips[current];
  const progress = duration ? time / duration * 100 : 0;
  return /* @__PURE__ */ React.createElement("div", { className: "video-showcase" }, /* @__PURE__ */ React.createElement("div", { className: "tabs" }, showClips && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "tab" + (tab === "local" ? " is-active" : ""),
      onClick: () => setTab("local")
    },
    "Our recaps"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "tab" + (tab === "youtube" ? " is-active" : ""),
      onClick: () => setTab("youtube")
    },
    "Latest race videos"
  )), tab === "local" ? /* @__PURE__ */ React.createElement("div", { className: "video-panel" }, clips.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "empty" }, "No clips yet. Put .mp4 files in ", /* @__PURE__ */ React.createElement("code", null, "/public/video"), " and list them in ", /* @__PURE__ */ React.createElement("code", null, "/public/video/clips.json"), ".") : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
    "video",
    {
      ref: videoRef,
      className: "video-player",
      src: clip ? clip.src : void 0,
      poster: clip && clip.poster ? clip.poster : void 0,
      preload: "metadata",
      onPlay: () => setPlaying(true),
      onPause: () => setPlaying(false),
      onTimeUpdate: (e) => setTime(e.target.currentTime),
      onLoadedMetadata: (e) => setDuration(e.target.duration),
      onError: () => setLoadError(true),
      onEnded: () => {
        if (current < clips.length - 1) setCurrent(current + 1);
        else setPlaying(false);
      }
    }
  ), loadError ? /* @__PURE__ */ React.createElement("p", { className: "form-error", style: { display: "block" } }, "That clip could not be played. Check the file exists in /public/video.") : null, /* @__PURE__ */ React.createElement("div", { className: "video-controls" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", type: "button", onClick: togglePlay }, playing ? "Pause" : "Play"), /* @__PURE__ */ React.createElement("span", { className: "small muted" }, formatTime(time), " / ", formatTime(duration)), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "range",
      min: "0",
      max: "100",
      value: progress,
      onChange: seek,
      className: "video-seek",
      "aria-label": "Seek"
    }
  ), /* @__PURE__ */ React.createElement("label", { className: "small muted", style: { margin: 0, display: "flex", gap: ".4rem", alignItems: "center" } }, "Vol", /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "range",
      min: "0",
      max: "1",
      step: "0.05",
      value: volume,
      onChange: (e) => setVolume(Number(e.target.value)),
      style: { width: 80 },
      "aria-label": "Volume"
    }
  ))), /* @__PURE__ */ React.createElement("h4", { className: "small", style: { marginBottom: ".5rem" } }, clip ? clip.title : ""), /* @__PURE__ */ React.createElement("div", { className: "playlist" }, clips.map((c, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: c.src,
      type: "button",
      className: "playlist-item" + (i === current ? " is-active" : ""),
      onClick: () => setCurrent(i)
    },
    c.title
  ))))) : /* @__PURE__ */ React.createElement("div", { className: "video-panel" }, /* @__PURE__ */ React.createElement("div", { className: "video-grid" }, videos.map((v) => /* @__PURE__ */ React.createElement("div", { className: "video-card", key: v.series }, /* @__PURE__ */ React.createElement("div", { className: "video-card-head" }, /* @__PURE__ */ React.createElement("span", { className: "badge badge-race" }, v.series), /* @__PURE__ */ React.createElement("a", { className: "small", href: v.channelUrl, target: "_blank", rel: "noopener" }, "More videos")), v.id && v.embed === false ? (
    /* this channel does not allow its videos inside other sites,
       so show the thumbnail and open the video on YouTube */
    /* @__PURE__ */ React.createElement(
      "a",
      {
        className: "video-embed video-thumb",
        href: "https://www.youtube.com/watch?v=" + v.id,
        target: "_blank",
        rel: "noopener",
        title: v.title
      },
      /* @__PURE__ */ React.createElement("img", { src: "https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg", alt: v.title || v.series }),
      /* @__PURE__ */ React.createElement("span", { className: "video-play", "aria-hidden": "true" }, "\u25B6"),
      /* @__PURE__ */ React.createElement("span", { className: "video-thumb-note" }, "Watch on YouTube")
    )
  ) : v.id ? /* @__PURE__ */ React.createElement("div", { className: "video-embed" }, /* @__PURE__ */ React.createElement(
    "iframe",
    {
      src: "https://www.youtube.com/embed/" + v.id,
      title: v.title || v.series + " recap",
      loading: "lazy",
      allow: "accelerometer; clipboard-write; encrypted-media; picture-in-picture",
      allowFullScreen: true
    }
  )) : /* @__PURE__ */ React.createElement("p", { className: "empty" }, "Could not reach YouTube to find the newest ", v.series, " video. Try again when you are online."), v.id && v.title && /* @__PURE__ */ React.createElement("p", { className: "video-title" }, v.title)))), /* @__PURE__ */ React.createElement("p", { className: "hint" }, "The embed needs an internet connection. The player in the other tab plays from your own machine.")));
}
window.VideoShowcase = VideoShowcase;
