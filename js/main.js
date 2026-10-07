/* Countdown to Feb 13 2027 18:00 Chile time */
const wedding = new Date('2027-02-13T18:00:00-03:00');

function pad(n) { return String(n).padStart(2, '0'); }

function tick() {
  const diff = wedding - new Date();
  if (diff <= 0) {
    ['cd-days','cd-hours','cd-min','cd-sec'].forEach(id =>
      (document.getElementById(id).textContent = '🎉')
    );
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  document.getElementById('cd-days').textContent  = d;
  document.getElementById('cd-hours').textContent = pad(h);
  document.getElementById('cd-min').textContent   = pad(m);
  document.getElementById('cd-sec').textContent   = pad(s);
}

tick();
setInterval(tick, 1000);

/* Cassette tap */
const wrap  = document.getElementById('cassette');
let   timer = null;

wrap.addEventListener('click', () => {
  wrap.classList.remove('playing');
  void wrap.offsetWidth;
  wrap.classList.add('playing');
  clearTimeout(timer);
  timer = setTimeout(() => wrap.classList.remove('playing'), 4000);
});

// ── PERSONALIZACIÓN POR URL (#para=Nombre o ?para=Nombre) ──
(function() {
  // Intenta hash primero (#para=...), luego query string (?para=...)
  var hash = window.location.hash.replace(/^#/, '');
  var search = window.location.search.replace(/^\?/, '');
  var nombre = new URLSearchParams(hash).get('para')
            || new URLSearchParams(search).get('para');
  if (nombre && nombre.trim()) {
    var el = document.getElementById('para-label');
    // textContent (no innerHTML) para que el nombre de la URL no pueda inyectar HTML
    var strong = document.createElement('strong');
    strong.textContent = nombre.trim();
    el.replaceChildren('Para ', strong, ' ♡');
    el.removeAttribute('hidden');

    // El formulario de confirmación se abre con el nombre ya escrito
    var rsvp = document.getElementById('rsvp-link');
    rsvp.href = rsvp.href + '?usp=pp_url&entry.424204634=' + encodeURIComponent(nombre.trim());

    // La lista de regalos también recibe el nombre
    document.getElementById('gift-list-link').href = 'lista.html?para=' + encodeURIComponent(nombre.trim());

    // Y el formulario "Avisar mi regalo"
    var aviso = document.getElementById('gift-notify-link');
    aviso.href = aviso.href + '?usp=pp_url&entry.1251987638=' + encodeURIComponent(nombre.trim());
  }
})();

/* Regalos: ventana con datos de transferencia y lista de novios */
const giftModal = document.getElementById('gift-modal');
const giftCopy  = document.getElementById('gift-copy');

document.getElementById('gift-open').addEventListener('click', () => giftModal.showModal());
document.getElementById('gift-close').addEventListener('click', () => giftModal.close());

// Cerrar al tocar fuera de la ventana
giftModal.addEventListener('click', e => {
  if (e.target !== giftModal) return;
  const r = giftModal.getBoundingClientRect();
  const fuera = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  if (fuera) giftModal.close();
});

giftCopy.addEventListener('click', async () => {
  const texto = [...document.querySelectorAll('#bank-data > div')]
    .map(row => row.querySelector('dt').textContent + ': ' + row.querySelector('dd').textContent)
    .join('\n');
  try {
    await navigator.clipboard.writeText(texto);
    giftCopy.textContent = '¡Copiado! ✓';
  } catch {
    giftCopy.textContent = 'No se pudo copiar';
  }
  giftCopy.classList.add('copied');
  setTimeout(() => {
    giftCopy.textContent = 'Copiar datos';
    giftCopy.classList.remove('copied');
  }, 2500);
});
