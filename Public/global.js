// ── Jack's Jerky · Global JS ──

document.addEventListener('DOMContentLoaded', () => {

  // Active nav link
  const links = document.querySelectorAll('.nav-links a');
  const currentPath = window.location.pathname.replace(/\/$/, '/index.html');
  links.forEach(link => {
    const linkPath = new URL(link.getAttribute('href'), window.location.href).pathname.replace(/\/$/, '/index.html');
    if (linkPath === currentPath) link.classList.add('active');
  });

  // Mobile hamburger toggle
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    // close on link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

});
