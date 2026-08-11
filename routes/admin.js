const express = require('express');
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// A lightweight check route the admin login page can call before storing
// the key in the browser, so a wrong key fails fast with a clear message.
router.post('/verify', adminAuth, (req, res) => res.json({ ok: true }));

router.use(adminAuth);

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
router.get('/leads', (req, res) => {
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  res.json(leads);
});

router.patch('/leads/:id', (req, res) => {
  const { status } = req.body || {};
  const allowed = ['new', 'contacted', 'quoted', 'won', 'lost'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }
  const result = db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Lead not found.' });
  res.json({ ok: true });
});

router.delete('/leads/:id', (req, res) => {
  const result = db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Lead not found.' });
  res.json({ ok: true });
});

router.get('/leads/:id/notes', (req, res) => {
  const notes = db
    .prepare('SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC')
    .all(req.params.id);
  res.json(notes);
});

router.post('/leads/:id/notes', (req, res) => {
  const { note } = req.body || {};
  if (!note || !note.trim()) return res.status(400).json({ error: 'note is required.' });
  const result = db
    .prepare('INSERT INTO lead_notes (lead_id, note) VALUES (?, ?)')
    .run(req.params.id, note.trim().slice(0, 2000));
  res.status(201).json({ ok: true, id: result.lastInsertRowid });
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
router.get('/projects', (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, id ASC').all();
  res.json(rows);
});

router.post('/projects', (req, res) => {
  const p = req.body || {};
  if (!p.slug || !p.name || !p.summary) {
    return res.status(400).json({ error: 'slug, name, and summary are required.' });
  }
  try {
    const result = db
      .prepare(`
        INSERT INTO projects (slug, name, summary, status, stack, year, url, featured, visible, sort_order)
        VALUES (@slug, @name, @summary, @status, @stack, @year, @url, @featured, @visible, @sort_order)
      `)
      .run({
        slug: p.slug,
        name: p.name,
        summary: p.summary,
        status: p.status || 'in_progress',
        stack: p.stack || '',
        year: p.year || '',
        url: p.url || '',
        featured: p.featured ? 1 : 0,
        visible: p.visible === false ? 0 : 1,
        sort_order: p.sort_order || 0
      });
    res.status(201).json({ ok: true, id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message.includes('UNIQUE') ? 'That slug is already in use.' : e.message });
  }
});

router.put('/projects/:id', (req, res) => {
  const p = req.body || {};
  const result = db
    .prepare(`
      UPDATE projects SET
        slug = @slug, name = @name, summary = @summary, status = @status,
        stack = @stack, year = @year, url = @url, featured = @featured,
        visible = @visible, sort_order = @sort_order, updated_at = datetime('now')
      WHERE id = @id
    `)
    .run({
      id: req.params.id,
      slug: p.slug,
      name: p.name,
      summary: p.summary,
      status: p.status || 'in_progress',
      stack: p.stack || '',
      year: p.year || '',
      url: p.url || '',
      featured: p.featured ? 1 : 0,
      visible: p.visible === false ? 0 : 1,
      sort_order: p.sort_order || 0
    });
  if (result.changes === 0) return res.status(404).json({ error: 'Project not found.' });
  res.json({ ok: true });
});

router.delete('/projects/:id', (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Project not found.' });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
router.get('/services', (req, res) => {
  res.json(db.prepare('SELECT * FROM services ORDER BY sort_order ASC, id ASC').all());
});

router.post('/services', (req, res) => {
  const s = req.body || {};
  if (!s.title || !s.description) {
    return res.status(400).json({ error: 'title and description are required.' });
  }
  const result = db
    .prepare('INSERT INTO services (title, description, sort_order, visible) VALUES (?, ?, ?, ?)')
    .run(s.title, s.description, s.sort_order || 0, s.visible === false ? 0 : 1);
  res.status(201).json({ ok: true, id: result.lastInsertRowid });
});

router.put('/services/:id', (req, res) => {
  const s = req.body || {};
  const result = db
    .prepare('UPDATE services SET title = ?, description = ?, sort_order = ?, visible = ? WHERE id = ?')
    .run(s.title, s.description, s.sort_order || 0, s.visible === false ? 0 : 1, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Service not found.' });
  res.json({ ok: true });
});

router.delete('/services/:id', (req, res) => {
  const result = db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Service not found.' });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
router.get('/analytics', (req, res) => {
  const totalViews = db.prepare('SELECT COUNT(*) AS c FROM pageviews').get().c;
  const uniqueVisitors = db.prepare('SELECT COUNT(DISTINCT visitor_id) AS c FROM pageviews').get().c;

  const viewsByDay = db
    .prepare(`
      SELECT date(created_at) AS day, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
      FROM pageviews
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY day ORDER BY day ASC
    `)
    .all();

  const topPages = db
    .prepare(`
      SELECT path, COUNT(*) AS views
      FROM pageviews
      GROUP BY path ORDER BY views DESC LIMIT 10
    `)
    .all();

  const topReferrers = db
    .prepare(`
      SELECT COALESCE(NULLIF(referrer, ''), 'Direct') AS referrer, COUNT(*) AS views
      FROM pageviews
      GROUP BY referrer ORDER BY views DESC LIMIT 10
    `)
    .all();

  const totalLeads = db.prepare('SELECT COUNT(*) AS c FROM leads').get().c;
  const leadsByStatus = db
    .prepare('SELECT status, COUNT(*) AS c FROM leads GROUP BY status')
    .all();
  const leadsByDay = db
    .prepare(`
      SELECT date(created_at) AS day, COUNT(*) AS leads
      FROM leads
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY day ORDER BY day ASC
    `)
    .all();

  const conversionRate = totalViews > 0 ? Number(((totalLeads / totalViews) * 100).toFixed(2)) : 0;

  res.json({
    totalViews,
    uniqueVisitors,
    totalLeads,
    conversionRate,
    viewsByDay,
    topPages,
    topReferrers,
    leadsByStatus,
    leadsByDay
  });
});

module.exports = router;
