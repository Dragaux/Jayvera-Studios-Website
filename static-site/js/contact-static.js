document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const business = form.business.value.trim();
    const budget = form.budget.value;
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      status.textContent = 'Please fill in your name, email, and message.';
      status.className = 'form-status error';
      return;
    }

    const subject = `New project inquiry from ${name}`;
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      business ? `Business: ${business}` : null,
      budget ? `Budget: ${budget}` : null,
      '',
      message
    ].filter((line) => line !== null);

    const mailto = `mailto:teamjayvera@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    status.textContent = 'Opening your email app with this filled in — just hit send.';
    status.className = 'form-status success';
    window.location.href = mailto;
  });
});
