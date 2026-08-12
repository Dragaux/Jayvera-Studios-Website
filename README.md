# Jayvera Studios

Full-stack site for Jayvera Studios: a real multi-page public site — not a
single scrolling HTML file — plus an admin backend for leads, projects,
services, and analytics, all backed by SQLite, in the same style as the
Evergray donor-management setup.

## What's included

- **A real multi-page public site**, server-rendered with EJS, each with its
  own URL:
  - `/` — home, with a hero and previews of services and featured work
  - `/about` — the studio's story, values, technology stack, and a timeline
  - `/work` — every project, and `/work/:slug` for each one's own detail
    page (problem → build → where it stands, plus a prev/next pager)
  - `/services` — each service explained in full, not just a card
  - `/contact` — the contact form, on its own page
  - `/*` (anything else) — a proper 404 page

  Projects and services are pulled from the database on every request, so
  editing them in the admin panel updates the live pages immediately — none
  of it is hardcoded into the HTML.

- **Admin dashboard** (`/admin`) — key-protected panel with:
  - **Overview** — total pageviews, unique visitors, total leads, and
    view-to-lead conversion rate, plus a 30-day traffic/leads chart, a
    leads-by-status breakdown, and top pages / top referrers tables.
  - **Leads** — every contact-form submission, with inline status changes
    (new → contacted → quoted → won/lost) and delete.
  - **Projects** — full CRUD for every project, including the problem /
    solution / results copy that powers each project's own detail page
    (name, slug, summary, status, stack, year, URL, visibility, sort order).
  - **Services** — full CRUD for the services shown on `/services`.
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
with all six current projects (Clarivo, Evergray, Durga Mandir volunteer
platform, Vestista, Skyward Dispatch, Stockalytica) and the three services
already on the site, so the dashboard and every project page have real
content on day one.

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
server.js               Express app — page routes (EJS) + JSON API
db/index.js              SQLite schema, migrations-on-boot, and seed data
middleware/adminAuth.js  Checks the x-admin-key header against ADMIN_KEY
middleware/trackVisit.js Logs pageviews for analytics
routes/contact.js        POST /api/contact — public lead capture
routes/projects.js       GET  /api/projects — public, visible projects only
routes/services.js       GET  /api/services — public, visible services only
routes/admin.js          All /api/admin/* routes — leads, projects, services, analytics
views/partials/          Shared head, header/nav, footer, and page-hero banner
views/pages/             home, about, work, project, services, contact, 404
public/css/style.css     Shared stylesheet for every public page
public/js/nav.js         Mobile nav toggle, shared across all pages
public/js/contact.js     Contact form submission (used on /contact)
public/admin/            Admin dashboard (login gate + 4 views) — unchanged SPA
```

## Notes

- Payments, billing accounts, and legal contracts still require parental
  involvement — this backend only handles leads and content, not invoicing.
- The admin key is stored in the browser's `localStorage` after a successful
  login so you don't have to retype it every visit. "Lock dashboard" clears it.

