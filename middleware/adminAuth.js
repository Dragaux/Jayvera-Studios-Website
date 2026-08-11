const db = require('../db');

// Every admin route requires the key in an 'x-admin-key' header (or ?key= for
// convenience in the browser). This mirrors the DASHBOARD_KEY pattern used on
// the Vestista dashboard — one shared secret, no user accounts to manage.
function adminAuth(req, res, next) {
  const provided = req.headers['x-admin-key'] || req.query.key;
  const expected = process.env.ADMIN_KEY;

  const ok = Boolean(expected) && provided === expected;

  try {
    db.prepare('INSERT INTO admin_logins (success, ip) VALUES (?, ?)').run(
      ok ? 1 : 0,
      req.ip
    );
  } catch (e) {
    // logging failures should never block the request
  }

  if (!ok) {
    return res.status(401).json({ error: 'Invalid or missing admin key.' });
  }
  next();
}

module.exports = adminAuth;
