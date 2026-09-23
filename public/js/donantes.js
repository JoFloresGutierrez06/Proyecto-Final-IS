const tbody = document.querySelector('#tabla-donantes tbody');
const msgLista = document.getElementById('msg-lista');
const msgDonante = document.getElementById('msg-donante');
const vacio = document.getElementById('vacio');
const panelCrear = document.getElementById('panel-crear');
const sesionInfo = document.getElementById('sesion-info');

function mostrarMensaje(texto, elemento, esError) {
  elemento.textContent = texto;
  elemento.hidden = false;
  elemento.className = esError ? 'mensaje error' : 'mensaje ok';
}

function protegerPagina() {
  const usuario = API.usuario();
  if (!API.token() || !usuario) {
    window.location.href = '/';
    return null;
  }
  sesionInfo.textContent = `${usuario.nombre} (${usuario.rol})`;
  if (usuario.rol === 'administrador') {
    panelCrear.hidden = false;
  }
  return usuario;
}

async function cargarDonantes() {
  msgLista.hidden = true;
  try {
    const datos = await API.get('/api/donantes');
    tbody.innerHTML = '';
    vacio.hidden = datos.donantes.length > 0;

    datos.donantes.forEach((d) => {
      const fila = document.createElement('tr');
      const contacto = [d.contacto_email, d.contacto_telefono].filter(Boolean).join(' · ') || '—';
      fila.innerHTML = `
        <td>${d.id}</td>
        <td>${d.nombre}</td>
        <td><span class="etiqueta-tipo ${d.tipo}">${d.tipo}</span></td>
        <td>${contacto}</td>
        <td>${(d.fecha_registro || '').slice(0, 10)}</td>
      `;
      tbody.appendChild(fila);
    });
  } catch (err) {
    if (err.status === 401) {
      API.cerrarSesion();
      window.location.href = '/';
      return;
    }
    mostrarMensaje(err.message, msgLista, true);
  }
}

document.getElementById('form-donante').addEventListener('submit', async (e) => {
  e.preventDefault();
  msgDonante.hidden = true;
  try {
    await API.post('/api/donantes', {
      nombre: document.getElementById('d-nombre').value,
      tipo: document.getElementById('d-tipo').value,
      contacto_email: document.getElementById('d-email').value || undefined,
      contacto_telefono: document.getElementById('d-tel').value || undefined,
    });
    mostrarMensaje('Donante registrado correctamente.', msgDonante, false);
    e.target.reset();
    await cargarDonantes();
  } catch (err) {
    mostrarMensaje(err.message, msgDonante, true);
  }
});

document.getElementById('btn-recargar').addEventListener('click', cargarDonantes);

protegerPagina();
cargarDonantes();
