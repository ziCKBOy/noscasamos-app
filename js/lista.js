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

// Nombre del invitado si llegó desde una invitación personalizada (?para=Nombre)
const invitado = (new URLSearchParams(location.search).get('para') || '').trim();
if (invitado) {
  document.getElementById('lista-back').href = 'index.html?para=' + encodeURIComponent(invitado);
}

const grid = document.getElementById('lista-grid');

for (const r of REGALOS) {
  const li = document.createElement('li');
  li.className = 'lista-card';
  li.dataset.regalo = normalizar(r.nombre);
  li.dataset.cantidad = r.cantidad || 1;

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
  btn.href = linkFormulario(r.nombre, invitado);
  btn.target = '_blank';
  btn.rel = 'noopener';
  btn.textContent = 'Lo regalo yo ♡';
  li.append(btn);

  grid.append(li);
}

/* ── Marcar los regalos ya elegidos ── */
async function marcarElegidos() {
  if (!ESTADO_URL.startsWith('https://')) return;

  let regalos;
  try {
    const resp = await fetch(ESTADO_URL);
    regalos = (await resp.json()).regalos;
  } catch {
    return; // si falla, la lista se muestra completa como antes
  }
  if (!Array.isArray(regalos)) return;

  const conteo = new Map();
  for (const nombre of regalos) {
    const n = normalizar(nombre);
    conteo.set(n, (conteo.get(n) || 0) + 1);
  }

  for (const card of grid.querySelectorAll('.lista-card')) {
    if ((conteo.get(card.dataset.regalo) || 0) < Number(card.dataset.cantidad)) continue;
    card.classList.add('elegido');
    const btn = card.querySelector('.lista-btn');
    btn.textContent = 'Ya regalado ✓';
    btn.removeAttribute('href');
    btn.setAttribute('aria-disabled', 'true');
  }

  // Los ya elegidos van al final
  const cards = [...grid.children];
  cards.sort((a, b) => a.classList.contains('elegido') - b.classList.contains('elegido'));
  grid.append(...cards);
}

marcarElegidos();
