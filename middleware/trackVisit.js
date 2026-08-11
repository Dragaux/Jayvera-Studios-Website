const { nanoid } = require('nanoid');
const db = require('../db');

const insertView = db.prepare(`
  INSERT INTO pageviews (path, referrer, user_agent, visitor_id)
  VALUES (?, ?, ?, ?)
`);

// Lightweight, cookie-based visit tracking — no external analytics, no
// third-party script, everything stays in the same SQLite file as leads
// and projects. Skips API calls and static assets so it only logs real
// page loads.
function trackVisit(req, res, next) {
  const isPage = req.method === 'GET' && !req.path.startsWith('/api');
  const isAsset = /\.(css|js|png|jpg|jpeg|svg|ico|webp|map)$/.test(req.path);

  if (isPage && !isAsset) {
    let visitorId = req.cookies && req.cookies.jv_vid;
    if (!visitorId) {
      visitorId = nanoid(12);
      res.cookie('jv_vid', visitorId, {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: 'lax'
      });
    }
    try {
      insertView.run(req.path, req.get('referer') || null, req.get('user-agent') || null, visitorId);
    } catch (e) {
      // tracking should never break the page
    }
  }
  next();
}

module.exports = trackVisit;
