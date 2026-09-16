const Setting = require('../models/Setting');

/*
  The recap video on the Motorsport page.

  It should always be the newest proper video on the GT World channel, not a
  Short. YouTube gives every channel an RSS feed that needs no api key, newest
  first, but the feed does not say which entries are Shorts. YouTube itself
  does though: youtube.com/shorts/<id> answers 200 for a Short and redirects
  to /watch for a normal video. So I walk the feed from the top and take the
  first entry that redirects.

  Asking YouTube on every page view would be silly, so the video id is saved
  in the settings collection and only checked again once it is more than
  three days old.

  If YouTube cannot be reached (no internet, or they block us) the page keeps
  whatever was saved last time, or falls back to RECAP_YOUTUBE_ID from .env.
*/

const CHANNEL_ID = 'UC-yHapH6mW1ceZ_5PDUf1_g';   // youtube.com/@GTWorld
const FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID;
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

// pulls every video id and title out of the feed xml, newest first. the feed
// is small and always the same shape, so a regex does the job without an xml
// parser. each <entry> holds one video
function parseFeed(xml) {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  return entries.map((entry) => {
    const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const title = entry.match(/<title>([^<]+)<\/title>/);
    return { id: id ? id[1] : '', title: title ? title[1] : '' };
  }).filter((v) => v.id);
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

async function fetchLatest() {
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error('feed answered ' + res.status);
  const videos = parseFeed(await res.text());
  if (!videos.length) throw new Error('no video in the feed');

  for (const video of videos) {
    if (!(await isShort(video.id))) return video;
  }
  throw new Error('only shorts in the feed');
}

// returns { id, title } for the video the page should show
async function latestRecap() {
  const saved = await Setting.findOne({ key: 'recapVideo' });
  const fresh = saved && Date.now() - saved.updatedAt.getTime() < THREE_DAYS;

  if (!fresh) {
    try {
      const latest = await fetchLatest();
      await Setting.findOneAndUpdate(
        { key: 'recapVideo' },
        { value: JSON.stringify(latest) },
        { upsert: true }
      );
      console.log('[recap] latest GT World video is ' + latest.id + ' (' + latest.title + ')');
      return latest;
    } catch (err) {
      console.log('[recap] could not check YouTube: ' + err.message);
    }
  }

  if (saved && saved.value) return JSON.parse(saved.value);
  return { id: process.env.RECAP_YOUTUBE_ID || '', title: '' };
}

module.exports = { latestRecap };
