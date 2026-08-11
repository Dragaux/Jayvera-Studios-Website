const STATUS_LABELS = {
  live: '● Live',
  in_progress: '● In progress',
  archived: '● Archived'
};

async function loadServices() {
  const grid = document.getElementById('serviceGrid');
  try {
    const res = await fetch('/api/services');
    const services = await res.json();
    grid.innerHTML = services
      .map(
        (s, i) => `
        <div class="service">
          <span class="idx mono">${String(i + 1).padStart(2, '0')}</span>
          <h3>${escapeHtml(s.title)}</h3>
          <p>${escapeHtml(s.description)}</p>
        </div>`
      )
      .join('');
  } catch (e) {
    grid.innerHTML = '<p class="mono">Services are temporarily unavailable.</p>';
  }
}

async function loadProjects() {
  const grid = document.getElementById('workGrid');
  try {
    const res = await fetch('/api/projects');
    const projects = await res.json();
    grid.innerHTML = projects
      .map(
        (p) => `
        <div class="card">
          <span class="status mono">${STATUS_LABELS[p.status] || p.status}</span>
          <h3>${p.url ? `<a href="${escapeAttr(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.name)}</a>` : escapeHtml(p.name)}</h3>
          <p>${escapeHtml(p.summary)}</p>
          <div class="tags">${p.stack.map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>
        </div>`
      )
      .join('');
  } catch (e) {
    grid.innerHTML = '<p class="mono">Work is temporarily unavailable.</p>';
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

function setupContactForm() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const btn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = 'Sending…';
    status.textContent = '';
    status.className = 'form-status';

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      business: form.business.value.trim(),
      budget: form.budget.value,
      message: form.message.value.trim(),
      source_page: window.location.pathname
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      status.textContent = "Message sent — we'll follow up soon.";
      status.classList.add('success');
      form.reset();
    } catch (err) {
      status.textContent = err.message || 'Something went wrong. Try emailing us directly.';
      status.classList.add('error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send message';
    }
  });
}

function setupNav() {
  const navToggle = document.getElementById('navToggle');
  const navlinks = document.getElementById('navlinks');
  navToggle.addEventListener('click', () => navlinks.classList.toggle('open'));
  navlinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => navlinks.classList.remove('open')));
}

loadServices();
loadProjects();
setupContactForm();
setupNav();
