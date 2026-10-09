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
  { emoji: '☕', nombre: 'Juego de tazones' },
  { emoji: '🍽️', nombre: 'Vajilla' },
  { emoji: '🍲', nombre: 'Ollas recubiertas en cerámica', descripcion: 'Una o un juego' },
  { emoji: '🥃', nombre: 'Vasos' },
  { emoji: '🍷', nombre: 'Copas' },
  { emoji: '🧺', nombre: 'Mantel cuadrado' },
  { emoji: '🥡', nombre: 'Contenedores para el refrigerador', descripcion: 'De distintos tamaños, para guardar comida' },
  { emoji: '🪴', nombre: 'Planta de interior' },
  { emoji: '🛁', nombre: 'Toallas de mano' },
  { emoji: '🪑', nombre: 'Dos sillas para terraza', descripcion: 'No reclinables' },
  { emoji: '🥛', nombre: 'Espumador de leche', descripcion: 'Para el café' },
  { emoji: '🍞', nombre: 'Tostador eléctrico' },
  { emoji: '🥪', nombre: 'Sandwichera' },
  { emoji: '🍊', nombre: 'Juguera', descripcion: 'De 1,5 litros o más' },
  { emoji: '🥫', nombre: 'Abrelatas eléctrico' },
  { emoji: '🥄', nombre: 'Set de cucharón, espumadero y espátula' },
];

/* Formulario "Avisar mi regalo" (links del registro del script de Google) */
const FORM_URL      = 'https://docs.google.com/forms/d/e/1FAIpQLSec_GYirpFokBr4Axic97u8SnxmepcCcS62v51o5aP7ZCtQkQ/viewform';
const ENTRY_NOMBRE  = 'entry.1251987638';
const ENTRY_REGALO  = 'entry.790538611';
const ENTRY_TIPO    = 'entry.989907467';   // "¿Qué nos regalaste?"

/* Aplicación web del script de Google que entrega los regalos ya elegidos */
const ESTADO_URL    = 'https://script.google.com/macros/s/AKfycbyHiS5B9xLQ11tchwnMQPwLCskduJx8ExC79hCaSMsBlyA0mBs7nJF1tCISvJkGmqDo/exec';

// Mensaje para lectores de pantalla (región role="status" de la página)
function avisarLector(mensaje) {
  const region = document.getElementById('aviso-lector');
  if (!region) return;
  region.textContent = '';
  setTimeout(() => { region.textContent = mensaje; }, 100);
}

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

/* Regalos avisados desde este teléfono en esta visita: se marcan al tiro,
 * aunque la hoja de Google tarde hasta un minuto en reflejarlos. */
function regaladosLocal() {
  try { return JSON.parse(sessionStorage.getItem('regalados') || '[]'); } catch { return []; }
}
function marcarRegaladoLocal(nombre) {
  try {
    sessionStorage.setItem('regalados', JSON.stringify([...regaladosLocal(), nombre]));
  } catch { /* sin almacenamiento: se verá al recargar */ }
  // Redibuja las listas visibles para que el regalo aparezca como ya regalado
  for (const grid of document.querySelectorAll('.lista-grid')) {
    if (grid.children.length && grid.dataset.invitado !== undefined) renderLista(grid, grid.dataset.invitado);
  }
}

/* Dibuja las tarjetas en `grid` (un <ul class="lista-grid">). Mientras llega
 * el estado muestra una barra de progreso, y luego dibuja todo de una vez, ya
 * marcado, para que los regalos elegidos no cambien frente al invitado. */
async function renderLista(grid, invitado) {
  grid.dataset.invitado = invitado || '';
  const turno = String(Date.now() + Math.random());
  grid.dataset.turno = turno;

  // Barra de progreso indeterminada mientras llega el estado desde Google
  const cargando = document.createElement('li');
  cargando.className = 'lista-cargando';
  const barra = document.createElement('div');
  barra.className = 'barra-progreso';
  barra.setAttribute('role', 'progressbar');
  barra.setAttribute('aria-label', 'Cargando lista de regalos');
  barra.append(document.createElement('span'));
  cargando.append(barra);
  grid.replaceChildren(cargando);
  grid.setAttribute('aria-busy', 'true');

  const elegidos = await obtenerElegidos();
  if (grid.dataset.turno !== turno) return; // se volvió a abrir mientras cargaba

  const conteo = new Map();
  for (const nombre of [...(elegidos || []), ...regaladosLocal()]) {
    const n = normalizar(nombre);
    conteo.set(n, (conteo.get(n) || 0) + 1);
  }

  const tarjetas = REGALOS.map(r => {
    const yaRegalado = (conteo.get(normalizar(r.nombre)) || 0) >= (r.cantidad || 1);
    return crearTarjeta(r, invitado, yaRegalado, grid);
  });
  // Los ya elegidos van al final
  tarjetas.sort((a, b) => a.classList.contains('elegido') - b.classList.contains('elegido'));

  grid.replaceChildren(...tarjetas);
  grid.removeAttribute('aria-busy');

  const disponibles = tarjetas.filter(t => !t.classList.contains('elegido')).length;
  avisarLector('Lista de regalos cargada: ' + disponibles + ' de ' + tarjetas.length +
    (tarjetas.length === 1 ? ' regalo disponible.' : ' regalos disponibles.'));
}

function crearTarjeta(r, invitado, yaRegalado, grid) {
  const li = document.createElement('li');
  li.className = 'lista-card' + (yaRegalado ? ' elegido' : '');

  const emoji = document.createElement('div');
  emoji.className = 'lista-emoji';
  emoji.setAttribute('aria-hidden', 'true');
  emoji.textContent = r.emoji || '🎁';

  // Dentro de la ventana el título es <h2>, así que cada regalo va como <h3>
  const nombre = document.createElement(grid.closest('dialog') ? 'h3' : 'h2');
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
    ref.setAttribute('aria-label', 'Ver ejemplo de ' + r.nombre + ' (se abre en otra pestaña)');
    li.append(ref);
  }

  let btn;
  if (yaRegalado) {
    btn = document.createElement('span');
    btn.className = 'btn btn-outline lista-btn';
    btn.innerHTML = 'Ya regalado <span aria-hidden="true">✓</span>';
  } else {
    btn = document.createElement('a');
    btn.className = 'btn btn-outline lista-btn';
    // Se abre en otra pestaña: la invitación (y su música) sigue abierta
    btn.href = linkFormulario(r.nombre, invitado);
    btn.target = '_blank';
    btn.rel = 'noopener';
    btn.textContent = 'Lo regalo yo ♡';
    btn.setAttribute('aria-label', 'Lo regalo yo: ' + r.nombre);
    // Abre el aviso dentro de la página; el link a Google queda como respaldo
    btn.addEventListener('click', e => {
      if (typeof abrirAviso !== 'function') return;
      e.preventDefault();
      abrirAviso(r.nombre);
    });
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
