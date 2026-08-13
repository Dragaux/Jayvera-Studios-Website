require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const db = require('./db'); // initializes schema + seed data on first run
const { SERVER_SITE } = require('./site-config');

const trackVisit = require('./middleware/trackVisit');
const contactRoute = require('./routes/contact');
const projectsRoute = require('./routes/projects');
const servicesRoute = require('./routes/services');
const adminRoute = require('./routes/admin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(trackVisit);

// ---------------------------------------------------------------------------
// JSON API — used by the admin dashboard (fetch/CRUD) and the contact form
// ---------------------------------------------------------------------------
app.use('/api/contact', contactRoute);
app.use('/api/projects', projectsRoute);
app.use('/api/services', servicesRoute);
app.use('/api/admin', adminRoute);

app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Server-rendered pages — real routes (/about, /work/:slug, ...), each a
// full page load, not an anchor jump on one long page.
// ---------------------------------------------------------------------------
const getVisibleProjects = db.prepare('SELECT * FROM projects WHERE visible = 1 ORDER BY sort_order ASC, id ASC');
const getVisibleServices = db.prepare('SELECT * FROM services WHERE visible = 1 ORDER BY sort_order ASC, id ASC');

app.get('/', (req, res) => {
  res.render('pages/home', {
    site: SERVER_SITE,
    projects: getVisibleProjects.all(),
    services: getVisibleServices.all()
  });
});

app.get('/about', (req, res) => {
  res.render('pages/about', {
    site: SERVER_SITE,
    projectCount: getVisibleProjects.all().length
  });
});

app.get('/work', (req, res) => {
  res.render('pages/work', {
    site: SERVER_SITE,
    projects: getVisibleProjects.all()
  });
});

app.get('/work/:slug', (req, res) => {
  const projects = getVisibleProjects.all();
  const index = projects.findIndex((p) => p.slug === req.params.slug);
  if (index === -1) return res.status(404).render('pages/404', { site: SERVER_SITE });

  res.render('pages/project', {
    site: SERVER_SITE,
    project: projects[index],
    prevProject: index > 0 ? projects[index - 1] : null,
    nextProject: index < projects.length - 1 ? projects[index + 1] : null
  });
});

app.get('/services', (req, res) => {
  res.render('pages/services', {
    site: SERVER_SITE,
    services: getVisibleServices.all()
  });
});

app.get('/contact', (req, res) => {
  res.render('pages/contact', { site: SERVER_SITE });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.use((req, res) => {
  res.status(404).render('pages/404', { site: SERVER_SITE });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Jayvera Studios running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at        http://localhost:${PORT}/admin`);
});
