/* Menú de secciones: aparece al bajar de la portada y marca la sección actual. */
(function () {
  const menu = document.getElementById('menu');
  const hero = document.getElementById('inicio');
  const links = [...menu.querySelectorAll('.menu-links a')];

  if (!('IntersectionObserver' in window)) {
    menu.classList.add('visible');
    return;
  }

  // Visible solo cuando la portada ya salió de la pantalla
  new IntersectionObserver(([e]) => {
    menu.classList.toggle('visible', !e.isIntersecting);
  }, { threshold: 0.15 }).observe(hero);

  // Sección actual: la que cruza la franja central de la pantalla
  const marcarActual = id => {
    for (const a of links) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  };

  const observador = new IntersectionObserver(entradas => {
    for (const e of entradas) {
      if (e.isIntersecting) marcarActual(e.target.id);
    }
  }, { rootMargin: '-45% 0px -50% 0px' });

  for (const a of links) {
    const seccion = document.querySelector(a.getAttribute('href'));
    if (seccion) observador.observe(seccion);
  }

  // Links directos (p. ej. …/?para=Ana#confirmar): asegurar el salto cuando la
  // página termina de cargar, por si las fuentes o la foto movieron el contenido.
  const destino = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (destino && destino.tagName === 'SECTION') {
    const saltar = () => destino.scrollIntoView({ behavior: 'instant', block: 'start' });
    if (document.readyState === 'complete') saltar();
    else window.addEventListener('load', saltar, { once: true });
  }
})();
