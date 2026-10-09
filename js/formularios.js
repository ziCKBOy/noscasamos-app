/* ── FORMULARIOS PROPIOS ──────────────────────────────────────────
 * Confirmación de asistencia y aviso de regalo con el diseño de la
 * invitación. Las respuestas se envían a los mismos formularios de Google
 * (llegan a las mismas hojas y disparan el aviso por correo).
 *
 * Google no permite leer su respuesta desde otra página (modo "no-cors"),
 * así que el envío se da por bueno si la conexión no falla. Si falla, se
 * ofrece el formulario de Google como alternativa.
 */

const RSVP = {
  accion: 'https://docs.google.com/forms/d/e/1FAIpQLSdjreQ2p3MVo6-uI8GwZqybt-bWuwGaxEt7Gwr0wpt1rWeUwA/formResponse',
  google: 'https://docs.google.com/forms/d/e/1FAIpQLSdjreQ2p3MVo6-uI8GwZqybt-bWuwGaxEt7Gwr0wpt1rWeUwA/viewform',
  nombre: 'entry.424204634',
  asistencia: 'entry.337974926',
  personas: 'entry.708663206',
  restricciones: 'entry.38640855',
  cancion: 'entry.1261374720',
  mensaje: 'entry.1643187202',
  // Deben coincidir exactamente con las opciones del formulario de Google
  si: 'Sí, ¡ahí estaré!',
  no: 'No podré asistir 😢',
};

const AVISO = {
  accion: 'https://docs.google.com/forms/d/e/1FAIpQLSec_GYirpFokBr4Axic97u8SnxmepcCcS62v51o5aP7ZCtQkQ/formResponse',
  google: 'https://docs.google.com/forms/d/e/1FAIpQLSec_GYirpFokBr4Axic97u8SnxmepcCcS62v51o5aP7ZCtQkQ/viewform',
  nombre: 'entry.1251987638',
  tipo: 'entry.989907467',
  cual: 'entry.790538611',
  mensaje: 'entry.105488238',
  lista: 'Un regalo de la lista 🎁',
  transferencia: 'Transferencia 💌',
};

// Nombre del invitado si la invitación es personalizada (?para= o #para=)
const nombreInvitado = (
  new URLSearchParams(location.search).get('para') ||
  new URLSearchParams(location.hash.slice(1)).get('para') || ''
).trim();

async function enviarAGoogle(accion, campos) {
  const datos = new URLSearchParams(campos);
  // Sin esto, Google ignora las páginas que el invitado "no visitó"
  if (!datos.has('pageHistory')) datos.set('pageHistory', '0');
  await fetch(accion, { method: 'POST', mode: 'no-cors', body: datos });
}

function crearVentana(id, html) {
  const ventana = document.createElement('dialog');
  ventana.className = 'gift-modal form-modal';
  ventana.id = id;
  ventana.setAttribute('aria-labelledby', id + '-titulo');
  ventana.innerHTML = html;
  document.body.append(ventana);

  ventana.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', () => ventana.close()));
  ventana.addEventListener('click', e => {
    if (e.target !== ventana) return;
    const r = ventana.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) ventana.close();
  });
  return ventana;
}

// Pasa la ventana a "¡Gracias!" o muestra el error con el plan B
function mostrarResultado(ventana, ok, titulo, texto) {
  const form = ventana.querySelector('form');
  const error = ventana.querySelector('.form-error');
  const boton = form.querySelector('[type="submit"]');
  boton.disabled = false;
  boton.textContent = boton.dataset.texto;
  if (!ok) {
    error.hidden = false;
    return;
  }
  form.hidden = true;
  const gracias = ventana.querySelector('.form-gracias');
  gracias.querySelector('h2').textContent = titulo;
  gracias.querySelector('p').textContent = texto;
  gracias.hidden = false;
  gracias.querySelector('h2').focus();
}

function reiniciar(ventana) {
  const form = ventana.querySelector('form');
  form.reset();
  form.hidden = false;
  ventana.querySelector('.form-gracias').hidden = true;
  ventana.querySelector('.form-error').hidden = true;
}

function enviando(form) {
  const boton = form.querySelector('[type="submit"]');
  boton.dataset.texto = boton.dataset.texto || boton.textContent;
  boton.disabled = true;
  boton.textContent = 'Enviando…';
}

const FIN_VENTANA = (google) => `
    <p class="form-error" role="alert" hidden>
      No pudimos enviar tu respuesta. Revisa tu conexión e inténtalo de nuevo,
      o usa <a href="${google}" target="_blank" rel="noopener">el formulario de Google<span class="sr-only"> (se abre en otra pestaña)</span></a>.
    </p>`;

const GRACIAS = `
  <div class="form-gracias" hidden>
    <div class="form-gracias-icono" aria-hidden="true">♡</div>
    <h2 class="gift-title" tabindex="-1"></h2>
    <p class="gift-intro"></p>
    <button type="button" class="btn btn-primary" data-cerrar>Cerrar</button>
  </div>`;

/* ── Confirmación de asistencia ── */
const ventanaRsvp = document.getElementById('rsvp-link') && crearVentana('rsvp-modal', `
  <button type="button" class="gift-close" data-cerrar aria-label="Cerrar">×</button>
  <form novalidate>
    <p class="eyebrow">Pista 4 · Confirmación</p>
    <h2 class="gift-title" id="rsvp-modal-titulo">¿Vas a venir?</h2>
    <p class="gift-intro">Confírmanos antes del <strong>30 de noviembre de 2026</strong> ♡</p>

    <label class="campo">
      <span class="campo-etiqueta">Nombre y apellido</span>
      <input name="nombre" required autocomplete="name">
      <span class="campo-error">Escribe tu nombre.</span>
    </label>

    <fieldset class="campo opciones" data-requerido>
      <legend class="campo-etiqueta">¿Vas a venir?</legend>
      <label class="opcion"><input type="radio" name="asistencia" value="si"><span>Sí, ¡ahí estaré! <span aria-hidden="true">🎉</span></span></label>
      <label class="opcion"><input type="radio" name="asistencia" value="no"><span>No podré asistir</span></label>
      <span class="campo-error">Elige una opción.</span>
    </fieldset>

    <div class="solo-si" hidden>
      <label class="campo">
        <span class="campo-etiqueta">¿Alguna restricción alimentaria o alergia? <small>(opcional)</small></span>
        <textarea name="restricciones" rows="2" placeholder="Vegetariano, celíaco, alergias…"></textarea>
      </label>
      <label class="campo">
        <span class="campo-etiqueta">Una canción que no puede faltar <small>(opcional)</small></span>
        <input name="cancion" placeholder="Canción y artista">
      </label>
    </div>

    <label class="campo">
      <span class="campo-etiqueta">¿Quieres dejarnos un mensaje? <small>(opcional)</small></span>
      <textarea name="mensaje" rows="3"></textarea>
    </label>

    <button type="submit" class="btn btn-primary form-enviar">Enviar confirmación</button>
    ${FIN_VENTANA(RSVP.google)}
  </form>
  ${GRACIAS}`);

if (ventanaRsvp) {
  const form = ventanaRsvp.querySelector('form');
  const soloSi = form.querySelector('.solo-si');

  form.addEventListener('change', e => {
    if (e.target.name === 'asistencia') soloSi.hidden = e.target.value !== 'si';
    marcarErrores(form, false);
  });

  // El link sigue apuntando al formulario de Google por si este archivo no carga
  document.getElementById('rsvp-link').addEventListener('click', e => {
    e.preventDefault();
    if (form.hidden) reiniciar(ventanaRsvp); // ya había confirmado: formulario nuevo
    if (!form.elements.nombre.value) form.elements.nombre.value = nombreInvitado;
    ventanaRsvp.showModal();
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!marcarErrores(form, true)) return;
    const f = form.elements;
    const viene = f.asistencia.value === 'si';
    const campos = {
      [RSVP.nombre]: f.nombre.value.trim(),
      [RSVP.asistencia]: viene ? RSVP.si : RSVP.no,
      [RSVP.mensaje]: f.mensaje.value.trim(),
      pageHistory: viene ? '0,1,2' : '0,2',
    };
    if (viene) {
      // La invitación es individual: la pregunta no se muestra, pero en Google
      // es obligatoria, así que se envía siempre 1 (si no, Google descarta la respuesta)
      campos[RSVP.personas] = '1';
      campos[RSVP.restricciones] = f.restricciones.value.trim();
      campos[RSVP.cancion] = f.cancion.value.trim();
    }
    enviando(form);
    const nombre = f.nombre.value.trim().replace(/\s+/g, ' ');
    try {
      await enviarAGoogle(RSVP.accion, campos);
      mostrarResultado(ventanaRsvp, true,
        '¡Gracias, ' + nombre + '!',
        viene ? 'Recibimos tu confirmación. ¡Nos vemos el 13 de febrero! ♡'
              : 'Te vamos a extrañar. Gracias por avisarnos ♡');
      if (typeof avisarLector === 'function') avisarLector('Confirmación enviada. ¡Gracias!');
    } catch {
      mostrarResultado(ventanaRsvp, false);
    }
  });
}

/* ── Aviso de regalo ── */
const ventanaAviso = crearVentana('aviso-modal', `
  <button type="button" class="gift-close" data-cerrar aria-label="Cerrar">×</button>
  <button type="button" class="lista-back regalo-volver" data-volver><span aria-hidden="true">←</span> Volver</button>
  <form novalidate class="con-volver">
    <p class="eyebrow">Lado B · Regalos</p>
    <h2 class="gift-title" id="aviso-modal-titulo">Avisar mi regalo</h2>
    <p class="gift-intro">Cuéntanos qué nos regalaste para poder agradecerte ♡</p>

    <label class="campo">
      <span class="campo-etiqueta">Tu nombre (o los de quienes regalan)</span>
      <input name="nombre" required autocomplete="name">
      <span class="campo-error">Escribe tu nombre.</span>
    </label>

    <fieldset class="campo opciones" data-requerido>
      <legend class="campo-etiqueta">¿Qué nos regalaste?</legend>
      <label class="opcion"><input type="radio" name="tipo" value="lista"><span>Un regalo de la lista <span aria-hidden="true">🎁</span></span></label>
      <label class="opcion"><input type="radio" name="tipo" value="transferencia"><span>Transferencia <span aria-hidden="true">💌</span></span></label>
      <label class="opcion"><input type="radio" name="tipo" value="otro"><span>Otra cosa</span></label>
      <span class="campo-error">Elige una opción.</span>
    </fieldset>

    <label class="campo solo-lista" hidden>
      <span class="campo-etiqueta">¿Cuál regalo de la lista?</span>
      <input name="cual">
    </label>
    <label class="campo solo-otro" hidden>
      <span class="campo-etiqueta">¿Qué nos regalaste?</span>
      <input name="otro">
      <span class="campo-error">Cuéntanos qué fue.</span>
    </label>

    <label class="campo">
      <span class="campo-etiqueta">¿Quieres dejarnos un mensaje? <small>(opcional)</small></span>
      <textarea name="mensaje" rows="3"></textarea>
    </label>

    <button type="submit" class="btn btn-primary form-enviar">Enviar aviso</button>
    ${FIN_VENTANA(AVISO.google)}
  </form>
  ${GRACIAS}`);

{
  const form = ventanaAviso.querySelector('form');
  const soloLista = form.querySelector('.solo-lista');
  const soloOtro = form.querySelector('.solo-otro');

  const ajustarCampos = () => {
    const tipo = form.elements.tipo.value;
    soloLista.hidden = tipo !== 'lista';
    soloOtro.hidden = tipo !== 'otro';
    form.elements.otro.required = tipo === 'otro';
  };
  form.addEventListener('change', () => { ajustarCampos(); marcarErrores(form, false); });

  // "Volver" lleva a donde se abrió el aviso; si no se indica, solo cierra
  // (por ejemplo, desde la lista, que queda abierta debajo)
  let volverA = null;
  ventanaAviso.querySelector('[data-volver]').addEventListener('click', () => {
    ventanaAviso.close();
    if (volverA) volverA();
  });

  // Abre el aviso; con `regalo` llega marcado como regalo de la lista, y con
  // tipo 'transferencia', como transferencia
  window.abrirAviso = function (regalo, tipo, volver) {
    volverA = volver || null;
    reiniciar(ventanaAviso);
    form.elements.nombre.value = nombreInvitado;
    if (regalo) {
      form.elements.tipo.value = 'lista';
      form.elements.cual.value = regalo;
    } else if (tipo === 'transferencia') {
      form.elements.tipo.value = 'transferencia';
    }
    ajustarCampos();
    ventanaAviso.showModal();
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!marcarErrores(form, true)) return;
    const f = form.elements;
    const campos = {
      [AVISO.nombre]: f.nombre.value.trim(),
      [AVISO.mensaje]: f.mensaje.value.trim(),
    };
    if (f.tipo.value === 'lista') {
      campos[AVISO.tipo] = AVISO.lista;
      campos[AVISO.cual] = f.cual.value.trim();
    } else if (f.tipo.value === 'transferencia') {
      campos[AVISO.tipo] = AVISO.transferencia;
    } else {
      campos[AVISO.tipo] = '__other_option__';
      campos[AVISO.tipo + '.other_option_response'] = f.otro.value.trim();
    }
    enviando(form);
    try {
      await enviarAGoogle(AVISO.accion, campos);
      if (f.tipo.value === 'lista' && f.cual.value.trim() && typeof marcarRegaladoLocal === 'function') {
        marcarRegaladoLocal(f.cual.value.trim());
      }
      mostrarResultado(ventanaAviso, true,
        '¡Muchas gracias!',
        'Recibimos tu aviso. ¡Nos vemos el 13 de febrero! ♡');
      if (typeof avisarLector === 'function') avisarLector('Aviso de regalo enviado. ¡Gracias!');
    } catch {
      mostrarResultado(ventanaAviso, false);
    }
  });
}

// Tarjeta "Avisar mi regalo" y "¿Ya transferiste?" (solo en la invitación)
const linkAviso = document.getElementById('gift-notify-link');
if (linkAviso) {
  const regalos = document.getElementById('gift-modal');
  const volverARegalos = vista => () => {
    mostrarVistaRegalo(vista);
    regalos.showModal();
  };
  linkAviso.addEventListener('click', e => {
    e.preventDefault();
    regalos.close();
    abrirAviso(null, null, volverARegalos('inicio'));
  });
  document.getElementById('gift-transfer-aviso').addEventListener('click', () => {
    regalos.close();
    abrirAviso(null, 'transferencia', volverARegalos('transferencia'));
  });
}

/* Validación con mensajes propios (más claros que los del navegador) */
function marcarErrores(form, mostrar) {
  let primero = null;
  const revisar = (elemento, valido) => {
    elemento.classList.toggle('con-error', mostrar && !valido);
    if (!valido && !primero) primero = elemento;
  };
  form.querySelectorAll('.campo').forEach(campo => {
    if (campo.closest('[hidden]')) return campo.classList.remove('con-error');
    if (campo.matches('fieldset[data-requerido]')) {
      revisar(campo, !!campo.querySelector('input:checked'));
    } else {
      const control = campo.querySelector('input[required], textarea[required]');
      if (control) revisar(campo, control.value.trim() !== '');
    }
  });
  if (primero && mostrar) {
    (primero.querySelector('input, textarea') || primero).focus();
    return false;
  }
  return !primero;
}
