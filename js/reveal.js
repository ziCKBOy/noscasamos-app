/* Aparición suave de los bloques al bajar por la página.
 * Sin JavaScript, o si el teléfono pide reducir el movimiento, todo se ve
 * normal desde el principio: la clase .reveal solo se agrega aquí. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Bloques que aparecen enteros
  const bloques = document.querySelectorAll(
    '.photo-frame, .countdown-grid, .section-title, .rsvp-note, .gifts-text, ' +
    '.dresscode-body, .footer-names'
  );
  // Grupos cuyos elementos aparecen uno tras otro
  const grupos = document.querySelectorAll('.detail-list, .timeline, .chips, .lista-grid');

  const observador = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('visible');
      observador.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  for (const el of bloques) {
    el.classList.add('reveal');
    observador.observe(el);
  }
  for (const grupo of grupos) {
    [...grupo.children].forEach((el, i) => {
      el.classList.add('reveal');
      el.style.setProperty('--reveal-delay', Math.min(i, 5) * 90 + 'ms');
      observador.observe(el);
    });
  }
})();
