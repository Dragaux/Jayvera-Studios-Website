// Renders the exact same views/ templates used by the live server into a
// flat set of plain .html files — no Node, no server, no npm install
// required to view it. Open static-site/index.html directly in a browser
// and every nav link loads a real separate page.
//
// Run with: node build-static.js

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const db = require('./db');
const { STATIC_SITE } = require('./site-config');

const OUT_DIR = path.join(__dirname, 'static-site');
const VIEWS_DIR = path.join(__dirname, 'views', 'pages');

const getVisibleProjects = db.prepare('SELECT * FROM projects WHERE visible = 1 ORDER BY sort_order ASC, id ASC');
const getVisibleServices = db.prepare('SELECT * FROM services WHERE visible = 1 ORDER BY sort_order ASC, id ASC');

function render(templateName, locals, outFile) {
  const templatePath = path.join(VIEWS_DIR, `${templateName}.ejs`);
  const html = ejs.render(fs.readFileSync(templatePath, 'utf8'), locals, {
    filename: templatePath // needed so relative include() calls resolve
  });
  fs.writeFileSync(path.join(OUT_DIR, outFile), html);
  console.log(`  wrote ${outFile}`);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

console.log('Building static site...');
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

// Assets — css and the two client scripts every static page needs
copyDir(path.join(__dirname, 'public', 'css'), path.join(OUT_DIR, 'css'));
fs.mkdirSync(path.join(OUT_DIR, 'js'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'public', 'js', 'nav.js'), path.join(OUT_DIR, 'js', 'nav.js'));
fs.copyFileSync(path.join(__dirname, 'public', 'js', 'contact-static.js'), path.join(OUT_DIR, 'js', 'contact-static.js'));

const projects = getVisibleProjects.all();
const services = getVisibleServices.all();

render('home', { site: STATIC_SITE, projects, services }, 'index.html');
render('about', { site: STATIC_SITE, projectCount: projects.length }, 'about.html');
render('work', { site: STATIC_SITE, projects }, 'work.html');
render('services', { site: STATIC_SITE, services }, 'services.html');
render('contact', { site: STATIC_SITE }, 'contact.html');
render('404', { site: STATIC_SITE }, '404.html');

projects.forEach((project, index) => {
  render(
    'project',
    {
      site: STATIC_SITE,
      project,
      prevProject: index > 0 ? projects[index - 1] : null,
      nextProject: index < projects.length - 1 ? projects[index + 1] : null
    },
    `work-${project.slug}.html`
  );
});

console.log(`\nDone. Open ${path.join(OUT_DIR, 'index.html')} in a browser.`);
