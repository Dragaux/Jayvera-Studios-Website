# Jayvera Studios

Full-stack site for Jayvera Studios: a real multi-page public site — not a
single scrolling HTML file — plus an admin backend for leads, projects,
services, and analytics, all backed by SQLite, in the same style as the
Evergray donor-management setup.

This repo produces the site **two ways** from the same templates:

1. **Live server** (`npm start`) — real Express routes, working contact form
   that saves to a database, and the `/admin` dashboard.
2. **Static export** (`npm run build:static`) — the same pages baked into
   plain `.html` files in `static-site/`, already committed to this repo, so
   they work immediately on GitHub Pages, Netlify, or just opened locally —
   no server, no database, no install.

## Quick options

**Just want to see the site right now, no setup?**
Open `static-site/index.html` in a browser. Every nav link is a real page load.

**Want it live on the web for free, straight from this repo?**
Turn on GitHub Pages (see below) — it serves `static-site/` as-is.

**Want the working contact form + admin dashboard?**
Run the live server (see "Full backend setup" below) and deploy that to
Railway or similar — the static export can't save leads anywhere, since
there's no server behind it.

## Hosting the static site on GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under "Build and deployment," set **Source** to "Deploy from a branch."
4. Set **Branch** to `main` (or whichever you use) and the folder to
   `/static-site`.
5. Save — GitHub gives you a `https://<username>.github.io/<repo>/` URL a
   minute or two later.

If you edit projects or services later (see "Full backend setup" below),
regenerate the static files and push again:

```bash
npm run build:static
git add static-site
git commit -m "Update static site"
git push
```

## Full backend setup

```bash
npm install
cp .env.example .env
```

Open `.env` and set `ADMIN_KEY` to a long random string — this is the only
credential protecting `/admin` and everything under `/api/admin/*`. Anyone
with this key has full read/write access to leads and site content, so treat
it like a password (don't commit it, don't share it in plaintext — `.env` is
already in `.gitignore`).

```bash
npm start
```

- Public site: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin (enter your `ADMIN_KEY` to unlock)

The database (`jayvera.db`) is created automatically on first run and seeded
with all six current projects (Clarivo, Evergray, Durga Mandir volunteer
platform, Vestista, Skyward Dispatch, Stockalytica) and the three services
already on the site, so the dashboard and every project page have real
content on day one. It's also git-ignored, so it won't get committed.

## Deploying the live server

This is a plain Node/Express app with a file-based SQLite database, so it
deploys the same way Evergray does — e.g. on Railway:

1. Push this project to a GitHub repo (this same one is fine).
2. Create a new Railway project from that repo.
3. Set the `ADMIN_KEY` environment variable (and optionally `RESEND_API_KEY`,
   `NOTIFY_FROM_EMAIL`, `NOTIFY_TO_EMAIL`) in Railway's dashboard.
4. Railway will run `npm install` and `npm start` automatically.

Because SQLite is a single file on disk, make sure your host has a
persistent volume attached (Railway's default volumes work fine) — without
one, the database resets on every redeploy.

## What's included

- **A real multi-page public site**, each with its own URL (or its own
  `.html` file in the static export):
  - Home — hero, and previews of services and featured work
  - About — the studio's story, values, technology stack, and a timeline
  - Work — every project, and a detail page per project (problem → build →
    where it stands, plus a prev/next pager)
  - Services — each service explained in full, not just a card
  - Contact — the contact form, on its own page
  - A proper 404 page for anything else

  In the live server, projects and services are pulled from the database on
  every request, so editing them in the admin panel updates the live pages
  immediately — none of it is hardcoded into the HTML.

- **Admin dashboard** (`/admin`, live server only) — key-protected panel with:
  - **Overview** — total pageviews, unique visitors, total leads, and
    view-to-lead conversion rate, plus a 30-day traffic/leads chart, a
    leads-by-status breakdown, and top pages / top referrers tables.
  - **Leads** — every contact-form submission, with inline status changes
    (new → contacted → quoted → won/lost) and delete.
  - **Projects** — full CRUD for every project, including the problem /
    solution / results copy that powers each project's own detail page
    (name, slug, summary, status, stack, year, URL, visibility, sort order).
  - **Services** — full CRUD for the services shown on the Services page.
- **Built-in analytics** (live server only) — a lightweight pageview tracker
  (no third-party script) logs every page load with path, referrer, and an
  anonymous cookie-based visitor id, so the Overview dashboard has real
  numbers.
- **Optional email notifications** (live server only) — if you add a Resend
  API key, every new lead also emails you a copy. Leave it blank and leads
  still save fine; you'll just check the dashboard instead of your inbox.
- **Static contact form fallback** — on the static export, submitting the
  form opens a pre-filled `mailto:` link instead of saving to a database,
  since there's no server to POST to.

## Project structure

```
server.js                Express app — page routes (EJS) + JSON API (live server)
build-static.js           Renders the same views/ templates into static-site/
site-config.js             Link/asset config shared by both server.js and build-static.js
db/index.js                SQLite schema, migrations-on-boot, and seed data
middleware/adminAuth.js    Checks the x-admin-key header against ADMIN_KEY
middleware/trackVisit.js   Logs pageviews for analytics
routes/contact.js          POST /api/contact — public lead capture
routes/projects.js         GET  /api/projects — public, visible projects only
routes/services.js         GET  /api/services — public, visible services only
routes/admin.js            All /api/admin/* routes — leads, projects, services, analytics
views/partials/            Shared head, header/nav, footer, and page-hero banner
views/pages/                home, about, work, project, services, contact, 404
public/css/style.css       Shared stylesheet for every public page
public/js/nav.js            Mobile nav toggle, shared across all pages
public/js/contact.js        Contact form submission for the live server (/contact)
public/js/contact-static.js Contact form fallback (mailto:) for the static export
public/admin/                Admin dashboard (login gate + 4 views) — live server only
static-site/                  Generated static export — committed, ready for GitHub Pages
```

## Notes

- Payments, billing accounts, and legal contracts still require parental
  involvement — this backend only handles leads and content, not invoicing.
- The admin key is stored in the browser's `localStorage` after a successful
  login so you don't have to retype it every visit. "Lock dashboard" clears it.
- `node_modules/`, `.env`, and the SQLite database file are all git-ignored —
  only source files and the static export get committed.

