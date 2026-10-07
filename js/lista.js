/* ── LISTA DE REGALOS ─────────────────────────────────────────────
 * Para agregar, quitar o cambiar regalos, edita este arreglo.
 *   emoji:       ícono de la tarjeta
 *   nombre:      nombre del regalo (es lo que llega al formulario)
 *   descripcion: detalle opcional (color, modelo, medida…)
 *   referencia:  link opcional a un ejemplo del producto
 *   cantidad:    opcional, cuántas veces se puede regalar (por defecto 1)
 *
 * Un regalo se marca como "Ya regalado" automáticamente cuando el
 * formulario "Avisar mi regalo" registra ese nombre tantas veces como
 * su cantidad. Para liberarlo, borra la fila en la hoja de respuestas.
 */
const REGALOS = [
  // EJEMPLOS: reemplazar por la lista real
  { emoji: '☕', nombre: 'Cafetera',              descripcion: 'De filtro o italiana' },
  { emoji: '🍳', nombre: 'Juego de sartenes',     descripcion: 'Antiadherentes' },
  { emoji: '🛏️', nombre: 'Juego de sábanas',      descripcion: '2 plazas' },
  { emoji: '🍷', nombre: 'Copas de vino',         descripcion: 'Set de 6' },
];

/* Formulario "Avisar mi regalo" (links del registro del script de Google) */
const FORM_URL      = 'https://docs.google.com/forms/d/e/1FAIpQLSec_GYirpFokBr4Axic97u8SnxmepcCcS62v51o5aP7ZCtQkQ/viewform';
const ENTRY_NOMBRE  = 'entry.1251987638';
const ENTRY_REGALO  = 'entry.790538611';
const ENTRY_TIPO    = 'entry.989907467';   // "¿Qué nos regalaste?"

/* Aplicación web del script de Google que entrega los regalos ya elegidos */
const ESTADO_URL    = 'https://script.google.com/macros/s/AKfycbyHiS5B9xLQ11tchwnMQPwLCskduJx8ExC79hCaSMsBlyA0mBs7nJF1tCISvJkGmqDo/exec';

// "Copas de Vino " y "copas de vino" cuentan como el mismo regalo
function normalizar(texto) {
  return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function linkFormulario(regalo, invitado) {
  const params = new URLSearchParams({ usp: 'pp_url' });
  params.set(ENTRY_TIPO, 'Un regalo de la lista 🎁');
  params.set(ENTRY_REGALO, regalo);
  if (invitado) params.set(ENTRY_NOMBRE, invitado);
  return FORM_URL + '?' + params.toString();
}

/* ── Regalos ya elegidos (aplicación web de Google) ──
 * Se consulta una sola vez y se reutiliza por un minuto. Si Google tarda más
 * de 6 s o falla, se responde null y la lista se muestra completa. */
const ESPERA_MAXIMA_MS = 6000;
let consultaElegidos = null;
let consultaHecha = 0;

function obtenerElegidos() {
  if (consultaElegidos && Date.now() - consultaHecha < 60000) return consultaElegidos;
  consultaHecha = Date.now();

  const consulta = ESTADO_URL.startsWith('https://')
    ? fetch(ESTADO_URL)
        .then(resp => resp.json())
        .then(datos => (Array.isArray(datos.regalos) ? datos.regalos : null))
        .catch(() => null)
    : Promise.resolve(null);
  const limite = new Promise(resolver => setTimeout(() => resolver(null), ESPERA_MAXIMA_MS));

  consultaElegidos = Promise.race([consulta, limite]);
  return consultaElegidos;
}

/* Dibuja las tarjetas en `grid` (un <ul class="lista-grid">). Mientras llega
 * el estado muestra "Cargando lista…", y luego dibuja todo de una vez, ya
 * marcado, para que los regalos elegidos no cambien frente al invitado. */
async function renderLista(grid, invitado) {
  const turno = String(Date.now() + Math.random());
  grid.dataset.turno = turno;

  const cargando = document.createElement('li');
  cargando.className = 'lista-cargando';
  cargando.textContent = 'Cargando lista…';
  grid.replaceChildren(cargando);
  grid.setAttribute('aria-busy', 'true');

  const elegidos = await obtenerElegidos();
  if (grid.dataset.turno !== turno) return; // se volvió a abrir mientras cargaba

  const conteo = new Map();
  for (const nombre of elegidos || []) {
    const n = normalizar(nombre);
    conteo.set(n, (conteo.get(n) || 0) + 1);
  }

  const tarjetas = REGALOS.map(r => {
    const yaRegalado = (conteo.get(normalizar(r.nombre)) || 0) >= (r.cantidad || 1);
    return crearTarjeta(r, invitado, yaRegalado);
  });
  // Los ya elegidos van al final
  tarjetas.sort((a, b) => a.classList.contains('elegido') - b.classList.contains('elegido'));

  grid.replaceChildren(...tarjetas);
  grid.removeAttribute('aria-busy');
}

function crearTarjeta(r, invitado, yaRegalado) {
  const li = document.createElement('li');
  li.className = 'lista-card' + (yaRegalado ? ' elegido' : '');

  const emoji = document.createElement('div');
  emoji.className = 'lista-emoji';
  emoji.textContent = r.emoji || '🎁';

  const nombre = document.createElement('h2');
  nombre.className = 'lista-nombre';
  nombre.textContent = r.nombre;

  li.append(emoji, nombre);

  if (r.descripcion) {
    const desc = document.createElement('p');
    desc.className = 'lista-desc';
    desc.textContent = r.descripcion;
    li.append(desc);
  }

  if (r.referencia) {
    const ref = document.createElement('a');
    ref.className = 'map-link';
    ref.href = r.referencia;
    ref.target = '_blank';
    ref.rel = 'noopener';
    ref.textContent = 'Ver ejemplo →';
    li.append(ref);
  }

  const btn = document.createElement('a');
  btn.className = 'btn btn-outline lista-btn';
  if (yaRegalado) {
    btn.textContent = 'Ya regalado ✓';
    btn.setAttribute('aria-disabled', 'true');
  } else {
    // Se abre en otra pestaña: la invitación (y su música) sigue abierta
    btn.href = linkFormulario(r.nombre, invitado);
    btn.target = '_blank';
    btn.rel = 'noopener';
    btn.textContent = 'Lo regalo yo ♡';
  }
  li.append(btn);

  return li;
}

/* ── Página lista.html ── */
const paginaGrid = document.getElementById('lista-grid');
if (paginaGrid) {
  // Nombre del invitado si llegó desde una invitación personalizada (?para=Nombre)
  const invitado = (new URLSearchParams(location.search).get('para') || '').trim();
  if (invitado) {
    document.getElementById('lista-back').href = 'index.html?para=' + encodeURIComponent(invitado);
  }
  renderLista(paginaGrid, invitado);
}
