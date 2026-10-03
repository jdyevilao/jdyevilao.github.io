// VENTUS Tecnología — comportamiento de la página.

// Datos de contacto visibles en la página.
// El correo de destino NO va aquí: queda guardado en Web3Forms, asociado a la clave de acceso.
const CONFIG = {
  telefono: '+56 9 6441 9004',
  ciudad: 'Contulmo, Chile',
  // Clave de acceso de Web3Forms (https://web3forms.com). Es pública por diseño y no revela el correo.
  web3formsKey: 'a85816bd-d56e-4c20-a768-3520c347ec51'
};

// Rellena los datos de contacto marcados con data-config.
document.querySelectorAll('[data-config]').forEach((el) => {
  const key = el.dataset.config;
  const value = CONFIG[key];
  if (!value) return;
  el.textContent = value;
  if (key === 'telefono') el.href = `tel:${value.replace(/\s+/g, '')}`;
});

document.getElementById('anio').textContent = new Date().getFullYear();

// Tema claro / oscuro. El tema inicial lo aplica el script del <head>.
const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
  themeColorMeta.setAttribute('content', theme === 'dark' ? '#0E1116' : '#F6F8FA');
}

applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('ventus-tema', next); } catch (e) { /* sin almacenamiento: solo dura esta visita */ }
});

// Menú en celular.
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('menu-principal');

function setMenu(open) {
  nav.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
}

toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

// Los botones de los planes preseleccionan el servicio en el formulario.
const form = document.getElementById('form-contacto');
const servicio = form.elements.servicio;

document.querySelectorAll('[data-servicio]').forEach((btn) => {
  btn.addEventListener('click', () => { servicio.value = btn.dataset.servicio; });
});

// Formulario: valida y envía el mensaje a la casilla de VENTUS a través de Web3Forms.
const status = form.querySelector('.form-status');
const submitButton = form.querySelector('button[type="submit"]');

function showStatus(message, isError) {
  status.textContent = message;
  status.classList.toggle('is-error', isError);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  let firstInvalid = null;
  form.querySelectorAll('[required]').forEach((field) => {
    const invalid = !field.value.trim();
    field.setAttribute('aria-invalid', String(invalid));
    if (invalid && !firstInvalid) firstInvalid = field;
  });

  if (firstInvalid) {
    showStatus('Completa los campos marcados para enviar tu mensaje.', true);
    firstInvalid.focus();
    return;
  }

  const data = new FormData(form);
  const payload = {
    access_key: CONFIG.web3formsKey,
    subject: `Consulta web VENTUS: ${data.get('servicio')}`,
    from_name: 'Sitio web VENTUS Tecnología',
    botcheck: form.elements.botcheck.checked,
    nombre: data.get('nombre'),
    contacto: data.get('contacto'),
    servicio: data.get('servicio'),
    mensaje: data.get('mensaje')
  };

  submitButton.disabled = true;
  showStatus('Enviando…', false);

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `HTTP ${response.status}`);
    }

    showStatus('¡Mensaje enviado! Te respondemos en menos de 24 horas.', false);
    form.reset();
  } catch (error) {
    console.error('Error al enviar el formulario:', error);
    showStatus(`No pudimos enviar tu mensaje. Inténtalo de nuevo o llámanos al ${CONFIG.telefono}.`, true);
  } finally {
    submitButton.disabled = false;
  }
});
