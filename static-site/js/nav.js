document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const navlinks = document.getElementById('navlinks');
  if (!navToggle || !navlinks) return;
  navToggle.addEventListener('click', () => navlinks.classList.toggle('open'));
  navlinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => navlinks.classList.remove('open')));
});
