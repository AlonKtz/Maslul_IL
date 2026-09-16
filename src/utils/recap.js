const Setting = require('../models/Setting');

/*
  The recap video on the Motorsport page.

  It should always be the newest upload on the GT World channel. YouTube gives
  every channel an RSS feed that needs no api key, and the newest video is the
  first entry in it. Asking YouTube on every page view would be silly, so the
  video id is saved in the settings collection and only checked again once it
  is more than three days old.

  If YouTube cannot be reached (no internet, or they block us) the page keeps
  whatever was saved last time, or falls back to RECAP_YOUTUBE_ID from .env.
*/

const CHANNEL_ID = 'UC-yHapH6mW1ceZ_5PDUf1_g';   // youtube.com/@GTWorld
const FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID;
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

// pulls the first video id and title out of the feed xml. the feed is small
// and always the same shape, so two regexes do the job without an xml parser
function parseFeed(xml) {
  const id = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  // the first <title> in the feed is the channel name, the second is the video
  const titles = xml.match(/<title>([^<]+)<\/title>/g) || [];
  return {
    id: id ? id[1] : '',
    title: titles[1] ? titles[1].replace(/<\/?title>/g, '') : '',
  };
}

async function fetchLatest() {
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error('feed answered ' + res.status);
  const latest = parseFeed(await res.text());
  if (!latest.id) throw new Error('no video in the feed');
  return latest;
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
      console.log('[recap] latest GT World video is ' + latest.id);
      return latest;
    } catch (err) {
      console.log('[recap] could not check YouTube: ' + err.message);
    }
  }

  if (saved && saved.value) return JSON.parse(saved.value);
  return { id: process.env.RECAP_YOUTUBE_ID || '', title: '' };
}

module.exports = { latestRecap };
