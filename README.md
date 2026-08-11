# Jayvera Studios

Full-stack site for Jayvera Studios: a public marketing site plus a real admin
backend — leads, projects, services, and analytics — all backed by SQLite,
in the same style as the Evergray donor-management setup.

## What's included

- **Public site** (`/`) — hero, services, work, about, FAQ, and a contact
  form that writes straight into the database. Services and projects are
  loaded from the API, not hardcoded, so editing them in the admin panel
  updates the live site immediately.
- **Admin dashboard** (`/admin`) — key-protected panel with:
  - **Overview** — total pageviews, unique visitors, total leads, and
    view-to-lead conversion rate, plus a 30-day traffic/leads chart, a
    leads-by-status breakdown, and top pages / top referrers tables.
  - **Leads** — every contact-form submission, with inline status changes
    (new → contacted → quoted → won/lost) and delete.
  - **Projects** — full CRUD for the "Selected work" cards (name, slug,
    summary, status, stack, year, URL, visibility, sort order).
  - **Services** — full CRUD for the "What we do" section.
- **Built-in analytics** — a lightweight pageview tracker (no third-party
  script) logs every page load with path, referrer, and an anonymous
  cookie-based visitor id, so the Overview dashboard has real numbers.
- **Optional email notifications** — if you add a Resend API key, every new
  lead also emails you a copy. Leave it blank and leads still save fine;
  you'll just check the dashboard instead of your inbox.

## Setup

```bash
npm install
cp .env.example .env
```

Open `.env` and set `ADMIN_KEY` to a long random string — this is the only
credential protecting `/admin` and everything under `/api/admin/*`. Anyone
with this key has full read/write access to leads and site content, so treat
it like a password (don't commit it, don't share it in plaintext).

```bash
npm start
```

- Public site: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin (enter your `ADMIN_KEY` to unlock)

The database (`jayvera.db`) is created automatically on first run and seeded
with the current three projects (Evergray, Durga Mandir volunteer platform,
Vestista) and the three services already on the site, so the dashboard isn't
empty on day one.

## Deploying

This is a plain Node/Express app with a file-based SQLite database, so it
deploys the same way Evergray does — e.g. on Railway:

1. Push this project to a GitHub repo.
2. Create a new Railway project from that repo.
3. Set the `ADMIN_KEY` environment variable (and optionally `RESEND_API_KEY`,
   `NOTIFY_FROM_EMAIL`, `NOTIFY_TO_EMAIL`) in Railway's dashboard.
4. Railway will run `npm install` and `npm start` automatically.

Because SQLite is a single file on disk, make sure your host has a
persistent volume attached (Railway's default volumes work fine) — without
one, the database resets on every redeploy.

## Project structure

```
server.js              Express app entry point
db/index.js             SQLite schema, migrations-on-boot, and seed data
middleware/adminAuth.js Checks the x-admin-key header against ADMIN_KEY
middleware/trackVisit.js Logs pageviews for analytics
routes/contact.js       POST /api/contact — public lead capture
routes/projects.js      GET  /api/projects — public, visible projects only
routes/services.js      GET  /api/services — public, visible services only
routes/admin.js         All /api/admin/* routes — leads, projects, services, analytics
public/index.html       Public site (fetches services/projects, posts the form)
public/admin/index.html Admin dashboard (login gate + 4 views)
```

## Notes

- Payments, billing accounts, and legal contracts still require parental
  involvement — this backend only handles leads and content, not invoicing.
- The admin key is stored in the browser's `localStorage` after a successful
  login so you don't have to retype it every visit. "Lock dashboard" clears it.
