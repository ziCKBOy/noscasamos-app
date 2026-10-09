/* Countdown to Feb 13 2027 18:00 Chile time */
const wedding = new Date('2027-02-13T18:00:00-03:00');

const cdTexto = document.getElementById('cd-texto');

function pad(n) { return String(n).padStart(2, '0'); }

function tick() {
  const diff = wedding - new Date();
  if (diff <= 0) {
    ['cd-days','cd-hours','cd-min','cd-sec'].forEach(id =>
      (document.getElementById(id).textContent = '🎉')
    );
    document.querySelectorAll('.cd-sep').forEach(sep => (sep.hidden = true));
    cdTexto.textContent = '¡Llegó el gran día!';
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (s === 59 || !cdTexto.dataset.listo) {
    cdTexto.dataset.listo = '1';
    cdTexto.textContent = 'Faltan ' + d + ' días, ' + h + (h === 1 ? ' hora' : ' horas') +
      ' y ' + m + (m === 1 ? ' minuto' : ' minutos') + ' para la boda.';
  }
  document.getElementById('cd-days').textContent  = d;
  document.getElementById('cd-hours').textContent = pad(h);
  document.getElementById('cd-min').textContent   = pad(m);
  document.getElementById('cd-sec').textContent   = pad(s);
}

tick();
setInterval(tick, 1000);

/* Casete: toca para reproducir o pausar nuestra canción */
const wrap    = document.getElementById('cassette');
const cancion = document.getElementById('cancion');
const hint    = document.getElementById('cassette-hint');
const botonMusica = document.getElementById('menu-musica');
let   timer   = null;

// Animación corta de siempre (también si no hay archivo de música)
function animarCasete() {
  wrap.classList.remove('playing');
  void wrap.offsetWidth;
  wrap.classList.add('playing');
  clearTimeout(timer);
  timer = setTimeout(() => wrap.classList.remove('playing'), 4000);
}

function marcarSonando(sonando) {
  wrap.classList.toggle('sonando', sonando);
  document.documentElement.classList.toggle('musica-sonando', sonando);
  wrap.setAttribute('aria-pressed', String(sonando));
  hint.textContent = sonando ? '♪ sonando\n' + cancion.dataset.titulo : '♪ toca el casete';
  botonMusica.setAttribute('aria-pressed', String(sonando));
}

async function alternarCancion() {
  if (!cancion.paused) {
    cancion.pause();
    return;
  }
  // El contexto de audio se activa aquí, dentro del toque: Safari en iPhone
  // solo lo permite así, y sin él la canción sonaría muda.
  prepararAnalizador();
  if (audioCtx && audioCtx.state !== 'running') audioCtx.resume();
  try {
    await cancion.play();
  } catch {
    animarCasete(); // sin archivo o el navegador no pudo reproducirlo
  }
}

cancion.addEventListener('play',  () => { marcarSonando(true); iniciarRitmo(); });
cancion.addEventListener('pause', () => marcarSonando(false));

/* Parlantes al ritmo de la canción: el analizador de audio del navegador mide
   graves y agudos en cada fotograma. Si no está disponible, queda el latido CSS. */
const radio = document.querySelector('.radio');
const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let audioCtx = null;
let analizador = null;
let espectro = null;

function prepararAnalizador() {
  if (audioCtx || movimientoReducido) return;
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!Contexto) return;
  try {
    audioCtx = new Contexto();
    const fuente = audioCtx.createMediaElementSource(cancion);
    analizador = audioCtx.createAnalyser();
    analizador.fftSize = 512;
    analizador.smoothingTimeConstant = 0.55;
    fuente.connect(analizador);
    analizador.connect(audioCtx.destination);
    espectro = new Uint8Array(analizador.frequencyBinCount);
  } catch {
    audioCtx = null;
    analizador = null;
  }
}

// Promedio de un rango de bandas, de 0 a 1
function nivel(desde, hasta) {
  let suma = 0;
  for (let i = desde; i < hasta; i++) suma += espectro[i];
  return suma / ((hasta - desde) * 255);
}

function iniciarRitmo() {
  prepararAnalizador();
  if (!analizador) return;
  audioCtx.resume();
  document.documentElement.classList.add('ritmo-real');
  let promedioGraves = null;  // parte desde la primera medición
  let promedioAgudos = null;
  let anterior = performance.now();

  const cuadro = (ahora) => {
    if (cancion.paused) {
      radio.style.setProperty('--golpe', 1);
      radio.style.setProperty('--graves', 0);
      radio.style.setProperty('--agudos', 0);
      return;
    }
    analizador.getByteFrequencyData(espectro);
    // Con fftSize 512 cada banda mide ~94 Hz (a 48 kHz): 1–11 ≈ bajo y cuerpo
    // de la guitarra; 40–120 ≈ agudos
    const graves = nivel(1, 12);
    const agudos = nivel(40, 120);
    // El golpe es lo que el sonido sube sobre su promedio reciente: así el
    // parlante late con cada ataque (rasgueo, nota fuerte, bombo) y no queda
    // inflado cuando la canción simplemente suena fuerte.
    // Promedio por tiempo (~0,25 s), igual a 60 o a 20 cuadros por segundo
    if (promedioGraves === null) { promedioGraves = graves; promedioAgudos = agudos; }
    const peso = 1 - Math.exp(-Math.min(0.5, (ahora - anterior) / 1000) / 0.25);
    anterior = ahora;
    promedioGraves += (graves - promedioGraves) * peso;
    promedioAgudos += (agudos - promedioAgudos) * peso;
    const golpe = Math.min(1, Math.max(0, graves - promedioGraves) * 9);
    const brillo = Math.min(1, Math.max(0, agudos - promedioAgudos) * 12);
    radio.style.setProperty('--golpe', (1 + golpe * 0.08).toFixed(3));
    radio.style.setProperty('--graves', golpe.toFixed(2));
    radio.style.setProperty('--agudos', brillo.toFixed(2));
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
}

wrap.addEventListener('click', alternarCancion);
botonMusica.addEventListener('click', alternarCancion);
wrap.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    alternarCancion();
  }
});

// Nombre del invitado (vacío si la invitación no es personalizada)
let invitadoActual = '';

// ── PERSONALIZACIÓN POR URL (#para=Nombre o ?para=Nombre) ──
(function() {
  // Intenta hash primero (#para=...), luego query string (?para=...)
  var hash = window.location.hash.replace(/^#/, '');
  var search = window.location.search.replace(/^\?/, '');
  var nombre = new URLSearchParams(hash).get('para')
            || new URLSearchParams(search).get('para');
  if (nombre && nombre.trim()) {
    invitadoActual = nombre.trim();
    var el = document.getElementById('para-label');
    // textContent (no innerHTML) para que el nombre de la URL no pueda inyectar HTML
    var strong = document.createElement('strong');
    strong.textContent = nombre.trim();
    const corazon = document.createElement('span');
    corazon.setAttribute('aria-hidden', 'true');
    corazon.textContent = ' ♡';
    el.replaceChildren('Para ', strong, corazon);
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

// La ventana tiene dos pasos: tarjetas de opciones y el detalle de transferencia
function mostrarVistaRegalo(nombre, enfocar) {
  giftModal.querySelectorAll('.regalo-vista').forEach(v => { v.hidden = v.dataset.vista !== nombre; });
  const titulo = giftModal.querySelector('.regalo-vista:not([hidden]) .gift-title');
  giftModal.setAttribute('aria-labelledby', titulo.id);
  if (enfocar) titulo.focus();
}
giftModal.querySelectorAll('[data-ir]').forEach(b =>
  b.addEventListener('click', () => mostrarVistaRegalo(b.dataset.ir, true)));

document.getElementById('gift-open').addEventListener('click', () => {
  obtenerElegidos(); // adelanta la consulta para que la lista abra ya marcada
  mostrarVistaRegalo('inicio');
  giftModal.showModal();
});
document.getElementById('gift-close').addEventListener('click', () => giftModal.close());

// Cerrar una ventana al tocar fuera de ella (el fondo oscuro)
function cerrarAlTocarFuera(dialogo) {
  dialogo.addEventListener('click', e => {
    if (e.target !== dialogo) return;
    const r = dialogo.getBoundingClientRect();
    const fuera = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (fuera) dialogo.close();
  });
}
cerrarAlTocarFuera(giftModal);

// Copia al portapapeles; si la API moderna no está disponible o falla,
// usa el método clásico con un campo de texto temporal.
async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return;
  } catch { /* se intenta el método clásico */ }
  const campo = document.createElement('textarea');
  campo.value = texto;
  campo.setAttribute('readonly', '');
  campo.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  (giftModal.open ? giftModal : document.body).append(campo);
  campo.select();
  const ok = document.execCommand('copy');
  campo.remove();
  if (!ok) throw new Error('No se pudo copiar');
}

giftCopy.addEventListener('click', async () => {
  const texto = [...document.querySelectorAll('#bank-data > div')]
    .map(row => row.querySelector('dt').textContent + ': ' + row.querySelector('dd').textContent)
    .join('\n');
  try {
    await copiarTexto(texto);
    giftCopy.textContent = '¡Copiado! ✓';
    avisarLector('Datos bancarios copiados. Ya puedes pegarlos en la app de tu banco.');
  } catch {
    giftCopy.textContent = 'No se pudo copiar';
    avisarLector('No se pudieron copiar los datos.');
  }
  giftCopy.classList.add('copied');
  setTimeout(() => {
    giftCopy.textContent = 'Copiar datos';
    giftCopy.classList.remove('copied');
  }, 2500);
});

/* Lista de regalos en una ventana (lista.html queda para links directos) */
const listaModal = document.getElementById('lista-modal');

document.getElementById('gift-list-link').addEventListener('click', e => {
  e.preventDefault();
  renderLista(document.getElementById('lista-modal-grid'), invitadoActual);
  giftModal.close();
  listaModal.showModal();
  listaModal.scrollTop = 0;
});

document.getElementById('lista-close').addEventListener('click', () => listaModal.close());
document.getElementById('lista-volver').addEventListener('click', () => {
  listaModal.close();
  mostrarVistaRegalo('inicio');
  giftModal.showModal();
});
cerrarAlTocarFuera(listaModal);

/* Galería de fotos: alterna cada 6 s; se detiene si el invitado elige una foto
   o si el teléfono pide reducir el movimiento. */
const galeria = (function () {
  const fotos = [...document.querySelectorAll('#galeria .foto')];
  const contenedorPuntos = document.getElementById('galeria-puntos');
  const puntos = fotos.map((_, i) => {
    const punto = document.createElement('button');
    punto.type = 'button';
    punto.className = 'galeria-punto';
    punto.setAttribute('aria-label', 'Ver foto ' + (i + 1) + ' de ' + fotos.length);
    if (i === 0) punto.setAttribute('aria-current', 'true');
    contenedorPuntos.append(punto);
    return punto;
  });
  let actual = 0;
  let intervalo = null;

  // Precarga la foto siguiente para que el fundido nunca muestre un hueco
  const precargar = i => { fotos[(i + 1) % fotos.length].loading = 'eager'; };
  precargar(0);

  function mostrar(i) {
    fotos[actual].classList.remove('activa');
    puntos[actual].removeAttribute('aria-current');
    actual = i;
    fotos[actual].loading = 'eager';
    fotos[actual].classList.add('activa');
    puntos[actual].setAttribute('aria-current', 'true');
    precargar(actual);
  }

  puntos.forEach((punto, i) => punto.addEventListener('click', () => {
    clearInterval(intervalo); // si eligen una foto, se queda en ella
    mostrar(i);
  }));

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    intervalo = setInterval(() => {
      if (!document.hidden) mostrar((actual + 1) % fotos.length);
    }, 6000);
  }

  // Para las teclas ◀◀ / ▶▶ de la radio
  function mover(paso) {
    clearInterval(intervalo);
    mostrar((actual + paso + fotos.length) % fotos.length);
    return actual + 1;
  }
  return { anterior: () => mover(-1), siguiente: () => mover(1), total: fotos.length };
})();

/* Teclas de la radio */
(function () {
  const cuerpo = document.querySelector('.radio-cuerpo');
  const dial = document.querySelector('.dial');
  const escala = document.querySelector('.dial-escala');
  const escalaOriginal = escala.innerHTML;
  let grabando = null;

  document.getElementById('tecla-play').addEventListener('click', () => {
    if (cancion.paused) alternarCancion();
  });
  document.getElementById('tecla-stop').addEventListener('click', () => {
    cancion.pause();
    cancion.currentTime = 0; // rebobinar
  });
  document.getElementById('tecla-anterior').addEventListener('click', () => {
    avisarLector('Foto ' + galeria.anterior() + ' de ' + galeria.total);
  });
  document.getElementById('tecla-siguiente').addEventListener('click', () => {
    avisarLector('Foto ' + galeria.siguiente() + ' de ' + galeria.total);
  });
  document.getElementById('tecla-rec').addEventListener('click', () => {
    clearTimeout(grabando);
    escala.textContent = '♥ GRABANDO RECUERDOS ♥';
    dial.classList.add('grabando');
    cuerpo.classList.add('grabando');
    avisarLector('Grabando recuerdos ♥');
    grabando = setTimeout(() => {
      escala.innerHTML = escalaOriginal;
      dial.classList.remove('grabando');
      cuerpo.classList.remove('grabando');
    }, 2600);
  });
})();
