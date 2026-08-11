const express = require('express');
const db = require('../db');

const router = express.Router();

const insertLead = db.prepare(`
  INSERT INTO leads (name, email, business, budget, message, source_page)
  VALUES (@name, @email, @business, @budget, @message, @source_page)
`);

async function notifyByEmail(lead) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // email notifications are optional — leads are already saved

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM_EMAIL || 'leads@jayvera.studio',
        to: process.env.NOTIFY_TO_EMAIL || 'teamjayvera@gmail.com',
        subject: `New lead: ${lead.name}${lead.business ? ' (' + lead.business + ')' : ''}`,
        text: [
          `Name: ${lead.name}`,
          `Email: ${lead.email}`,
          `Business: ${lead.business || '—'}`,
          `Budget: ${lead.budget || '—'}`,
          `Page: ${lead.source_page || '—'}`,
          '',
          lead.message
        ].join('\n')
      })
    });
  } catch (e) {
    console.error('Email notification failed:', e.message);
  }
}

router.post('/', async (req, res) => {
  const { name, email, business, budget, message, source_page } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'That email address does not look right.' });
  }

  const lead = {
    name: String(name).slice(0, 200),
    email: String(email).slice(0, 200),
    business: business ? String(business).slice(0, 200) : null,
    budget: budget ? String(budget).slice(0, 100) : null,
    message: String(message).slice(0, 4000),
    source_page: source_page ? String(source_page).slice(0, 200) : null
  };

  const result = insertLead.run(lead);
  notifyByEmail(lead); // fire and forget — don't block the response on email

  res.status(201).json({ ok: true, id: result.lastInsertRowid });
});

module.exports = router;
