const Setting = require('../models/Setting');

/*
  The recap videos on the Motorsport page, one per series: GT World,
  Formula 1 and NASCAR.

  Each should always be the newest proper video on that series' YouTube
  channel, not a Short. YouTube gives every channel an RSS feed that needs no
  api key, newest first, but the feed does not say which entries are Shorts.
  YouTube itself does though: youtube.com/shorts/<id> answers 200 for a Short
  and redirects to /watch for a normal video. So I walk the feed from the top
  and take the first entry that redirects.

  Asking YouTube on every page view would be silly, so each video id is saved
  in the settings collection and only checked again once it is more than
  three days old.

  If YouTube cannot be reached (no internet, or they block us) the page keeps
  whatever was saved last time. For GT World it can also fall back to
  RECAP_YOUTUBE_ID from .env.
*/

// Formula 1 blocks its videos from playing inside other websites, even though
// YouTube still reports them as embeddable, so that one is shown as a
// thumbnail that opens the video on YouTube instead of an embedded player
const SERIES = [
  { key: 'recapVideo', name: 'GT World', channelId: 'UC-yHapH6mW1ceZ_5PDUf1_g', handle: 'GTWorld', embed: true },
  { key: 'recapVideo:f1', name: 'Formula 1', channelId: 'UCB_qr75-ydFVKSF9Dmo6izg', handle: 'Formula1', embed: false },
  { key: 'recapVideo:nascar', name: 'NASCAR', channelId: 'UCuN9hYw2RpoAW8rZ3VK3isA', handle: 'NASCAR', embed: true },
];
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

// pulls every video id and title out of the feed xml, newest first. the feed
// is small and always the same shape, so a regex does the job without an xml
// parser. each <entry> holds one video
function parseFeed(xml) {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  return entries.map((entry) => {
    const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const title = entry.match(/<title>([^<]+)<\/title>/);
    return { id: id ? id[1] : '', title: title ? decode(title[1]) : '' };
  }).filter((v) => v.id);
}

// the feed escapes quotes and ampersands in titles
function decode(text) {
  return text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// true when youtube keeps the shorts url as it is instead of sending us to
// the normal watch page
async function isShort(id) {
  const res = await fetch('https://www.youtube.com/shorts/' + id, {
    method: 'HEAD',
    redirect: 'manual',
  });
  return res.status === 200;
}

async function fetchLatest(channelId) {
  const res = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId);
  if (!res.ok) throw new Error('feed answered ' + res.status);
  const videos = parseFeed(await res.text());
  if (!videos.length) throw new Error('no video in the feed');

  for (const video of videos) {
    if (!(await isShort(video.id))) return video;
  }
  throw new Error('only shorts in the feed');
}

// asks YouTube for the newest video and saves it. returns null if it failed
async function refresh(series) {
  try {
    const latest = await fetchLatest(series.channelId);
    await Setting.findOneAndUpdate(
      { key: series.key },
      { value: JSON.stringify(latest) },
      { upsert: true }
    );
    console.log('[recap] latest ' + series.name + ' video is ' + latest.id + ' (' + latest.title + ')');
    return latest;
  } catch (err) {
    console.log('[recap] could not check YouTube for ' + series.name + ': ' + err.message);
    return null;
  }
}

// returns { id, title } for one series
async function latestFor(series) {
  const saved = await Setting.findOne({ key: series.key });
  const fresh = saved && Date.now() - saved.updatedAt.getTime() < THREE_DAYS;

  if (!fresh) {
    // checking YouTube takes a few seconds. if there is a saved video, show
    // that one straight away and look for a newer one in the background, so
    // nobody has to wait for YouTube. only the very first visit has to wait
    if (saved && saved.value) {
      refresh(series);
    } else {
      const latest = await refresh(series);
      if (latest) return latest;
    }
  }

  if (saved && saved.value) return JSON.parse(saved.value);
  if (series.key === 'recapVideo') return { id: process.env.RECAP_YOUTUBE_ID || '', title: '' };
  return { id: '', title: '' };
}

// the newest video from every series, checked in parallel
async function latestRecaps() {
  return Promise.all(SERIES.map(async (series) => Object.assign(
    { series: series.name, embed: series.embed, channelUrl: 'https://www.youtube.com/@' + series.handle + '/videos' },
    await latestFor(series)
  )));
}

module.exports = { latestRecaps };
