const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '..', 'jayvera.db'));
db.pragma('journal_mode = WAL');

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  business TEXT,
  budget TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',        -- new | contacted | quoted | won | lost
  source_page TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lead_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  problem TEXT,
  solution TEXT,
  results TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress', -- live | in_progress | archived
  stack TEXT,                                  -- comma-separated tags
  year TEXT,
  url TEXT,
  featured INTEGER NOT NULL DEFAULT 1,
  visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  visitor_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_logins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  success INTEGER NOT NULL,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pageviews_created ON pageviews(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
`);

// ---------------------------------------------------------------------------
// Migration — add columns to a projects table created before problem/
// solution/results existed, without touching any data already in it.
// ---------------------------------------------------------------------------
const existingCols = db.prepare("PRAGMA table_info(projects)").all().map((c) => c.name);
['problem', 'solution', 'results'].forEach((col) => {
  if (!existingCols.includes(col)) {
    db.exec(`ALTER TABLE projects ADD COLUMN ${col} TEXT`);
  }
});

// ---------------------------------------------------------------------------
// Seed data — only runs the first time (tables empty)
// ---------------------------------------------------------------------------
const projectCount = db.prepare('SELECT COUNT(*) AS c FROM projects').get().c;
if (projectCount === 0) {
  const insertProject = db.prepare(`
    INSERT INTO projects (slug, name, summary, problem, solution, results, status, stack, year, url, featured, visible, sort_order)
    VALUES (@slug, @name, @summary, @problem, @solution, @results, @status, @stack, @year, @url, @featured, @visible, @sort_order)
  `);
  const seedProjects = [
    {
      slug: 'clarivo',
      name: 'Clarivo',
      summary: 'An AI-powered decision intelligence SaaS — decision-analysis tools, achievement badges, and a weekly digest, on Pro/Elite subscription tiers.',
      problem: 'People making significant decisions rarely have a structured way to reason through them — most end up going with gut instinct and hoping for the best.',
      solution: 'Clarivo gives people a guided, AI-assisted process for working through a decision: laying out options, weighing tradeoffs, and tracking the reasoning behind the final call. It runs on Pro and Elite subscription tiers with Stripe billing, Google OAuth sign-in, a referral system, and 17 achievement badges to keep people engaged with their own decision history.',
      results: 'Originally launched as DecisionVault, then rebranded to Clarivo after a trademark conflict — the rebrand touched the domain, billing, and every reference across the codebase. Live at myclarivo.com.',
      status: 'live',
      stack: 'Node.js,Express,SQLite,Stripe,OpenAI,Resend',
      year: '2026',
      url: 'https://myclarivo.com',
      featured: 1,
      visible: 1,
      sort_order: 1
    },
    {
      slug: 'evergray',
      name: 'Evergray',
      summary: 'An awareness and donor site for senior shelter-pet adoption, built to connect visitors with The Grey Muzzle Organization.',
      problem: 'Senior shelter pets are consistently the hardest animals to get adopted, and awareness for the organizations that support them is limited.',
      solution: 'Evergray is a focused awareness and donor site built around senior pet adoption, with a donor management system, an admin dashboard, and a GoFundMe fundraiser linked directly to The Grey Muzzle Organization. Resend handles email so donors and site admins both stay in the loop.',
      results: 'Deployed and live at evergray.up.railway.app, running on Node.js/Express with a SQLite backend on Railway.',
      status: 'live',
      stack: 'Node.js,Express,SQLite,Resend',
      year: '2026',
      url: 'https://evergray.up.railway.app',
      featured: 1,
      visible: 1,
      sort_order: 2
    },
    {
      slug: 'durga-mandir-volunteer-platform',
      name: 'Durga Mandir volunteer platform',
      summary: 'Sign-ups, scheduling, and hour tracking for temple volunteers, architected to scale to nonprofits and schools.',
      problem: 'Durga Mandir coordinates volunteers by hand — sign-ups, scheduling, and hour tracking all live in scattered spreadsheets and group chats.',
      solution: 'A full volunteer management platform: a public events page, a volunteer dashboard and profile, QR-code hour tracking, a certificate generator, and an admin side for managing volunteers, events, and communication. Built on Next.js and Supabase so it can later extend to other temples, nonprofits, and schools without a rebuild.',
      results: 'In active development, designed from the start as an MVP that scales to multi-organization support.',
      status: 'in_progress',
      stack: 'Next.js,Supabase,TypeScript,Tailwind',
      year: '2026',
      url: '',
      featured: 1,
      visible: 1,
      sort_order: 3
    },
    {
      slug: 'vestista',
      name: 'Vestista',
      summary: 'A lead-capture chat widget and dashboard built for Carbuyus, so no inquiry gets missed after hours.',
      problem: 'Carbuyus, like a lot of small businesses, was missing website inquiries that came in outside business hours — no one there to catch them in the moment.',
      solution: 'Vestista is an embeddable chat widget that captures leads directly on the Carbuyus site, backed by an Express server and a leads dashboard protected by a private key.',
      results: 'Originally built and named "Assistly," then renamed to Vestista across the entire codebase — branding, config, and package files — once the studio settled on the final name.',
      status: 'in_progress',
      stack: 'Express,Chat widget,Dashboard',
      year: '2026',
      url: '',
      featured: 1,
      visible: 1,
      sort_order: 4
    },
    {
      slug: 'skyward-dispatch',
      name: 'Skyward Dispatch',
      summary: 'A 3D bush-pilot search-and-rescue flight sim, in development for the browser — missions, hazard systems, and progression modes.',
      problem: 'Most browser-based flight games trade away depth for simplicity — there is not much room for a full mission, hazard, and progression system.',
      solution: 'Skyward Dispatch is a 3D bush-pilot search-and-rescue flight simulator built as a browser/web app, with a hazard system and multiple progression modes designed around a full multi-month scope rather than a quick prototype.',
      results: 'In active development, planned as a complete game rather than a proof of concept.',
      status: 'in_progress',
      stack: '3D,Web app,Game design',
      year: '2026',
      url: '',
      featured: 1,
      visible: 1,
      sort_order: 5
    },
    {
      slug: 'stockalytica',
      name: 'Stockalytica',
      summary: 'A stock-market education platform with AI-personalized learning and an evidence-and-reasoning dashboard — built to teach, not to predict trades.',
      problem: 'Most stock-market tools aimed at beginners either oversimplify the material or edge into buy/sell advice that is not appropriate for an education product.',
      solution: 'Stockalytica focuses on teaching: AI-personalized lessons, a "Company Pulse" section for following real companies, and an Evidence & Reasoning Dashboard that shows the reasoning behind an idea instead of a prediction. Deliberately reframed away from trade calls for legal and accuracy reasons.',
      results: 'In development, with a teal-and-gold design system built around Space Grotesk and IBM Plex typography.',
      status: 'in_progress',
      stack: 'React,Express,SQLite',
      year: '2026',
      url: '',
      featured: 1,
      visible: 1,
      sort_order: 6
    }
  ];
  const insertMany = db.transaction((rows) => rows.forEach((r) => insertProject.run(r)));
  insertMany(seedProjects);
}

const serviceCount = db.prepare('SELECT COUNT(*) AS c FROM services').get().c;
if (serviceCount === 0) {
  const insertService = db.prepare(`
    INSERT INTO services (title, description, sort_order, visible)
    VALUES (@title, @description, @sort_order, @visible)
  `);
  const seedServices = [
    {
      title: 'Web design & development',
      description: 'Full websites built from scratch — homepage through contact form — designed around what the business actually sells and who it is trying to reach.',
      sort_order: 1,
      visible: 1
    },
    {
      title: 'Custom tools & automation',
      description: 'Lead-response systems, dashboards, and small internal tools that save a business time instead of adding another thing to manage.',
      sort_order: 2,
      visible: 1
    },
    {
      title: 'Nonprofit & community platforms',
      description: 'Volunteer sign-ups, donor tools, and awareness sites for organizations that need to look credible on a small budget.',
      sort_order: 3,
      visible: 1
    }
  ];
  const insertMany = db.transaction((rows) => rows.forEach((r) => insertService.run(r)));
  insertMany(seedServices);
}

module.exports = db;
