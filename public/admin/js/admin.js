const KEY_STORAGE = 'jayvera_admin_key';
let adminKey = localStorage.getItem(KEY_STORAGE) || '';
let trafficChart, statusChart;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
async function verifyKey(key) {
  const res = await fetch('/api/admin/verify', {
    method: 'POST',
    headers: { 'x-admin-key': key }
  });
  return res.ok;
}

async function tryAutoLogin() {
  if (!adminKey) return;
  const ok = await verifyKey(adminKey);
  if (ok) showApp();
  else {
    localStorage.removeItem(KEY_STORAGE);
    adminKey = '';
  }
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  loadOverview();
}

function showLogin(message) {
  document.getElementById('app').classList.remove('visible');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginError').textContent = message || '';
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const input = document.getElementById('adminKeyInput');
  const key = input.value.trim();
  if (!key) return;
  const ok = await verifyKey(key);
  if (ok) {
    adminKey = key;
    localStorage.setItem(KEY_STORAGE, key);
    showApp();
  } else {
    document.getElementById('loginError').textContent = 'Incorrect key. Try again.';
  }
});
document.getElementById('adminKeyInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem(KEY_STORAGE);
  adminKey = '';
  showLogin('');
});

// Wrapper for all authenticated calls — bounces to login on 401.
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), 'x-admin-key': adminKey, 'Content-Type': 'application/json' }
  });
  if (res.status === 401) {
    showLogin('Session expired — enter your admin key again.');
    throw new Error('Unauthorized');
  }
  return res;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`view-${btn.dataset.view}`).classList.add('active');
    if (btn.dataset.view === 'overview') loadOverview();
    if (btn.dataset.view === 'leads') loadLeads();
    if (btn.dataset.view === 'projects') loadProjects();
    if (btn.dataset.view === 'services') loadServices();
  });
});

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
async function loadOverview() {
  const res = await apiFetch('/api/admin/analytics');
  const data = await res.json();

  document.getElementById('statViews').textContent = data.totalViews.toLocaleString();
  document.getElementById('statVisitors').textContent = data.uniqueVisitors.toLocaleString();
  document.getElementById('statLeads').textContent = data.totalLeads.toLocaleString();
  document.getElementById('statConv').textContent = `${data.conversionRate}%`;

  renderTrafficChart(data.viewsByDay, data.leadsByDay);
  renderStatusChart(data.leadsByStatus);

  const topPagesBody = document.getElementById('topPagesBody');
  topPagesBody.innerHTML = data.topPages.length
    ? data.topPages.map((p) => `<tr><td class="mono">${escapeHtml(p.path)}</td><td>${p.views}</td></tr>`).join('')
    : '<tr><td colspan="2" class="empty-state">No traffic recorded yet.</td></tr>';

  const topRefBody = document.getElementById('topRefBody');
  topRefBody.innerHTML = data.topReferrers.length
    ? data.topReferrers.map((r) => `<tr><td class="mono">${escapeHtml(r.referrer)}</td><td>${r.views}</td></tr>`).join('')
    : '<tr><td colspan="2" class="empty-state">No referrer data yet.</td></tr>';
}
document.getElementById('refreshOverview').addEventListener('click', loadOverview);

function renderTrafficChart(viewsByDay, leadsByDay) {
  const days = [...new Set([...viewsByDay.map((d) => d.day), ...leadsByDay.map((d) => d.day)])].sort();
  const viewsMap = Object.fromEntries(viewsByDay.map((d) => [d.day, d.views]));
  const leadsMap = Object.fromEntries(leadsByDay.map((d) => [d.day, d.leads]));

  const ctx = document.getElementById('trafficChart');
  if (trafficChart) trafficChart.destroy();
  trafficChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days.length ? days : ['No data yet'],
      datasets: [
        {
          label: 'Pageviews',
          data: days.map((d) => viewsMap[d] || 0),
          borderColor: '#0B2545',
          backgroundColor: 'rgba(11,37,69,0.08)',
          tension: 0.25,
          fill: true
        },
        {
          label: 'Leads',
          data: days.map((d) => leadsMap[d] || 0),
          borderColor: '#E09E00',
          backgroundColor: 'rgba(224,158,0,0.1)',
          tension: 0.25,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } } }
    }
  });
}

function renderStatusChart(leadsByStatus) {
  const order = ['new', 'contacted', 'quoted', 'won', 'lost'];
  const colors = { new: '#0B2545', contacted: '#E09E00', quoted: '#4746C9', won: '#2E9E5B', lost: '#D64545' };
  const map = Object.fromEntries(leadsByStatus.map((s) => [s.status, s.c]));
  const labels = order.filter((s) => map[s]);
  const values = labels.map((s) => map[s]);

  const ctx = document.getElementById('statusChart');
  if (statusChart) statusChart.destroy();
  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.length ? labels : ['No leads yet'],
      datasets: [{ data: values.length ? values : [1], backgroundColor: labels.length ? labels.map((s) => colors[s]) : ['#ddd'] }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } }
  });
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
async function loadLeads() {
  const res = await apiFetch('/api/admin/leads');
  const leads = await res.json();
  const body = document.getElementById('leadsBody');
  const empty = document.getElementById('leadsEmpty');

  if (!leads.length) {
    body.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  body.innerHTML = leads
    .map(
      (l) => `
      <tr>
        <td class="mono">${formatDate(l.created_at)}</td>
        <td><strong>${escapeHtml(l.name)}</strong><br><span class="mono" style="color:var(--slate);">${escapeHtml(l.email)}</span></td>
        <td>${escapeHtml(l.business || '—')}</td>
        <td>${escapeHtml(l.budget || '—')}</td>
        <td style="max-width:260px;">${escapeHtml(l.message)}</td>
        <td>
          <select class="status-select" data-id="${l.id}">
            ${['new', 'contacted', 'quoted', 'won', 'lost']
              .map((s) => `<option value="${s}" ${s === l.status ? 'selected' : ''}>${s}</option>`)
              .join('')}
          </select>
        </td>
        <td><button class="icon-btn danger" data-delete-lead="${l.id}">Delete</button></td>
      </tr>`
    )
    .join('');

  body.querySelectorAll('.status-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      await apiFetch(`/api/admin/leads/${sel.dataset.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: sel.value })
      });
      loadOverview();
    });
  });

  body.querySelectorAll('[data-delete-lead]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this lead permanently?')) return;
      await apiFetch(`/api/admin/leads/${btn.dataset.deleteLead}`, { method: 'DELETE' });
      loadLeads();
    });
  });
}
document.getElementById('refreshLeads').addEventListener('click', loadLeads);

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
async function loadProjects() {
  const res = await apiFetch('/api/admin/projects');
  const projects = await res.json();
  const body = document.getElementById('projectsBody');
  body.innerHTML = projects.length
    ? projects
        .map(
          (p) => `
      <tr>
        <td><strong>${escapeHtml(p.name)}</strong><br><span class="mono" style="color:var(--slate);">${escapeHtml(p.slug)}</span></td>
        <td><span class="badge badge-${p.status}">${p.status.replace('_', ' ')}</span></td>
        <td class="mono">${escapeHtml(p.stack || '—')}</td>
        <td>${escapeHtml(p.year || '—')}</td>
        <td>${p.visible ? 'Yes' : 'Hidden'}</td>
        <td>
          <button class="icon-btn" data-edit-project="${p.id}">Edit</button>
          <button class="icon-btn danger" data-delete-project="${p.id}">Delete</button>
        </td>
      </tr>`
        )
        .join('')
    : '<tr><td colspan="6" class="empty-state">No projects yet.</td></tr>';

  body.querySelectorAll('[data-edit-project]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = projects.find((x) => x.id == btn.dataset.editProject);
      openProjectForm(p);
    });
  });
  body.querySelectorAll('[data-delete-project]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this project permanently?')) return;
      await apiFetch(`/api/admin/projects/${btn.dataset.deleteProject}`, { method: 'DELETE' });
      loadProjects();
    });
  });
}

function openProjectForm(p) {
  document.getElementById('projectForm').style.display = 'block';
  document.getElementById('projectFormTitle').textContent = p ? 'Edit project' : 'New project';
  document.getElementById('projectId').value = p ? p.id : '';
  document.getElementById('pName').value = p ? p.name : '';
  document.getElementById('pSlug').value = p ? p.slug : '';
  document.getElementById('pSummary').value = p ? p.summary : '';
  document.getElementById('pStatus').value = p ? p.status : 'in_progress';
  document.getElementById('pYear').value = p ? p.year || '' : '';
  document.getElementById('pStack').value = p ? p.stack || '' : '';
  document.getElementById('pUrl').value = p ? p.url || '' : '';
  document.getElementById('pSort').value = p ? p.sort_order : 0;
  document.getElementById('pVisible').checked = p ? Boolean(p.visible) : true;
}

document.getElementById('newProjectBtn').addEventListener('click', () => openProjectForm(null));
document.getElementById('cancelProjectBtn').addEventListener('click', () => {
  document.getElementById('projectForm').style.display = 'none';
});
document.getElementById('saveProjectBtn').addEventListener('click', async () => {
  const id = document.getElementById('projectId').value;
  const payload = {
    name: document.getElementById('pName').value.trim(),
    slug: document.getElementById('pSlug').value.trim(),
    summary: document.getElementById('pSummary').value.trim(),
    status: document.getElementById('pStatus').value,
    year: document.getElementById('pYear').value.trim(),
    stack: document.getElementById('pStack').value.trim(),
    url: document.getElementById('pUrl').value.trim(),
    sort_order: Number(document.getElementById('pSort').value) || 0,
    visible: document.getElementById('pVisible').checked
  };
  if (!payload.name || !payload.slug || !payload.summary) {
    alert('Name, slug, and summary are required.');
    return;
  }
  const url = id ? `/api/admin/projects/${id}` : '/api/admin/projects';
  const method = id ? 'PUT' : 'POST';
  const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Could not save project.');
    return;
  }
  document.getElementById('projectForm').style.display = 'none';
  loadProjects();
});

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
async function loadServices() {
  const res = await apiFetch('/api/admin/services');
  const services = await res.json();
  const body = document.getElementById('servicesBody');
  body.innerHTML = services.length
    ? services
        .map(
          (s) => `
      <tr>
        <td><strong>${escapeHtml(s.title)}</strong></td>
        <td style="max-width:420px;">${escapeHtml(s.description)}</td>
        <td>${s.visible ? 'Yes' : 'Hidden'}</td>
        <td>
          <button class="icon-btn" data-edit-service="${s.id}">Edit</button>
          <button class="icon-btn danger" data-delete-service="${s.id}">Delete</button>
        </td>
      </tr>`
        )
        .join('')
    : '<tr><td colspan="4" class="empty-state">No services yet.</td></tr>';

  body.querySelectorAll('[data-edit-service]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const s = services.find((x) => x.id == btn.dataset.editService);
      openServiceForm(s);
    });
  });
  body.querySelectorAll('[data-delete-service]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this service permanently?')) return;
      await apiFetch(`/api/admin/services/${btn.dataset.deleteService}`, { method: 'DELETE' });
      loadServices();
    });
  });
}

function openServiceForm(s) {
  document.getElementById('serviceForm').style.display = 'block';
  document.getElementById('serviceFormTitle').textContent = s ? 'Edit service' : 'New service';
  document.getElementById('serviceId').value = s ? s.id : '';
  document.getElementById('sTitle').value = s ? s.title : '';
  document.getElementById('sDescription').value = s ? s.description : '';
  document.getElementById('sSort').value = s ? s.sort_order : 0;
  document.getElementById('sVisible').checked = s ? Boolean(s.visible) : true;
}

document.getElementById('newServiceBtn').addEventListener('click', () => openServiceForm(null));
document.getElementById('cancelServiceBtn').addEventListener('click', () => {
  document.getElementById('serviceForm').style.display = 'none';
});
document.getElementById('saveServiceBtn').addEventListener('click', async () => {
  const id = document.getElementById('serviceId').value;
  const payload = {
    title: document.getElementById('sTitle').value.trim(),
    description: document.getElementById('sDescription').value.trim(),
    sort_order: Number(document.getElementById('sSort').value) || 0,
    visible: document.getElementById('sVisible').checked
  };
  if (!payload.title || !payload.description) {
    alert('Title and description are required.');
    return;
  }
  const url = id ? `/api/admin/services/${id}` : '/api/admin/services';
  const method = id ? 'PUT' : 'POST';
  const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Could not save service.');
    return;
  }
  document.getElementById('serviceForm').style.display = 'none';
  loadServices();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function formatDate(iso) {
  const d = new Date(iso + 'Z');
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

tryAutoLogin();
