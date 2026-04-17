// Smooth scroll with navbar offset
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    
    e.preventDefault();
    const offset = 80; // Approximate navbar height + margin
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  });
});

// Reveal on scroll animation
const revealElements = () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Add hide class and observe
  const targets = document.querySelectorAll('.feature-card, .section-header, .hero-text, .hero-img');
  targets.forEach(el => {
    el.classList.add('reveal-item');
    observer.observe(el);
  });
};

document.addEventListener('DOMContentLoaded', revealElements);
