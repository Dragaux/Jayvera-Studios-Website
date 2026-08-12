document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const btn = document.getElementById('submitBtn');
  if (!form) return;

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
});
