// Two "modes" of link/asset generation, so the exact same EJS templates can
// produce either a live Express-backed site (clean URLs, working contact
// form and admin) or a fully static, no-server-required set of .html files
// (double-click to open, real page-to-page navigation, no scrolling anchors).

const SERVER_SITE = {
  css: '/css/style.css',
  navJs: '/js/nav.js',
  contactJs: '/js/contact.js',
  hasBackend: true,
  links: {
    home: '/',
    about: '/about',
    work: '/work',
    services: '/services',
    contact: '/contact',
    project: (slug) => `/work/${slug}`
  }
};

const STATIC_SITE = {
  css: 'css/style.css',
  navJs: 'js/nav.js',
  contactJs: 'js/contact-static.js',
  hasBackend: false,
  links: {
    home: 'index.html',
    about: 'about.html',
    work: 'work.html',
    services: 'services.html',
    contact: 'contact.html',
    project: (slug) => `work-${slug}.html`
  }
};

module.exports = { SERVER_SITE, STATIC_SITE };
