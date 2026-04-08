// Smooth scroll avec offset navbar
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-h')) || 62;
    window.scrollTo({
      top: target.offsetTop - offset - 10,
      behavior: 'smooth'
    });
  });
});
