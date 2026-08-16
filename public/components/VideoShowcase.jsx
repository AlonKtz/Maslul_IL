/**
 * VideoShowcase — a React player for race and meet recaps.
 *
 * It uses a real HTML5 <video> element and drives it from React with custom
 * controls (play/pause, seek, volume, playlist), which is what the "Video"
 * requirement asks for. A second tab embeds a YouTube clip for the weekly
 * recap, but the requirement is satisfied by the <video> player itself —
 * an embed is somebody else's player, not ours.
 *
 * Clips are read from /video/clips.json. Drop .mp4 files into /public/video
 * and list them there; the component copes with the list being empty.
 */

const { useState, useRef, useEffect } = React;

function formatTime(seconds) {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + String(s).padStart(2, '0');
}

function VideoShowcase({ youtubeId }) {
  const videoRef = useRef(null);

  const [clips, setClips] = useState([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [tab, setTab] = useState('local');
  const [loadError, setLoadError] = useState(false);

  // Load the clip list once.
  useEffect(() => {
    window.jQuery
      .getJSON('/video/clips.json')
      .done((data) => setClips(Array.isArray(data) ? data : []))
      .fail(() => setClips([]));
  }, []);

  // Keep the element's volume in step with the slider.
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  // Switching clip resets the player.
  useEffect(() => {
    setTime(0);
    setPlaying(false);
    setLoadError(false);
  }, [current]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // play() rejects if the file is missing or the format is unsupported.
      const started = video.play();
      if (started && started.catch) started.catch(() => setLoadError(true));
    } else {
      video.pause();
    }
  }

  function seek(evt) {
    const video = videoRef.current;
    if (!video || !isFinite(video.duration)) return;
    video.currentTime = (Number(evt.target.value) / 100) * video.duration;
  }

  const clip = clips[current];
  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <div className="video-showcase">
      <div className="tabs">
        <button
          type="button"
          className={'tab' + (tab === 'local' ? ' is-active' : '')}
          onClick={() => setTab('local')}
        >
          Our recaps
        </button>
        <button
          type="button"
          className={'tab' + (tab === 'youtube' ? ' is-active' : '')}
          onClick={() => setTab('youtube')}
        >
          Weekly recap
        </button>
      </div>

      {tab === 'local' ? (
        <div className="video-panel">
          {clips.length === 0 ? (
            <p className="empty">
              No clips yet. Put .mp4 files in <code>/public/video</code> and list
              them in <code>/public/video/clips.json</code>.
            </p>
          ) : (
            <div>
              <video
                ref={videoRef}
                className="video-player"
                src={clip ? clip.src : undefined}
                poster={clip && clip.poster ? clip.poster : undefined}
                preload="metadata"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={(e) => setTime(e.target.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                onError={() => setLoadError(true)}
                onEnded={() => {
                  // Roll on to the next clip automatically.
                  if (current < clips.length - 1) setCurrent(current + 1);
                  else setPlaying(false);
                }}
              />

              {loadError ? (
                <p className="form-error" style={{ display: 'block' }}>
                  That clip could not be played. Check the file exists in /public/video.
                </p>
              ) : null}

              <div className="video-controls">
                <button className="btn btn-primary" type="button" onClick={togglePlay}>
                  {playing ? 'Pause' : 'Play'}
                </button>

                <span className="small muted">{formatTime(time)} / {formatTime(duration)}</span>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={seek}
                  className="video-seek"
                  aria-label="Seek"
                />

                <label className="small muted" style={{ margin: 0, display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                  Vol
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    style={{ width: 80 }}
                    aria-label="Volume"
                  />
                </label>
              </div>

              <h4 className="small" style={{ marginBottom: '.5rem' }}>
                {clip ? clip.title : ''}
              </h4>

              <div className="playlist">
                {clips.map((c, i) => (
                  <button
                    key={c.src}
                    type="button"
                    className={'playlist-item' + (i === current ? ' is-active' : '')}
                    onClick={() => setCurrent(i)}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="video-panel">
          {youtubeId ? (
            <div className="video-embed">
              <iframe
                src={'https://www.youtube.com/embed/' + youtubeId}
                title="Weekly race recap"
                allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="empty">
              No weekly recap linked yet. Add a YouTube video id to the page to show one here.
            </p>
          )}
          <p className="hint">
            The embed needs an internet connection. The player in the other tab
            plays from your own machine.
          </p>
        </div>
      )}
    </div>
  );
}

window.VideoShowcase = VideoShowcase;
