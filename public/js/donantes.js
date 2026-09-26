const tbody = document.querySelector('#tabla-donantes tbody');
const msgLista = document.getElementById('msg-lista');
const msgDonante = document.getElementById('msg-donante');
const vacio = document.getElementById('vacio');
const panelCrear = document.getElementById('panel-crear');
const sesionInfo = document.getElementById('sesion-info');
const formDonante = document.getElementById('form-donante');
const panelTitulo = document.getElementById('panel-titulo');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');

let editandoId = null;
let esAdmin = false;

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
  esAdmin = usuario.rol === 'administrador';
  if (esAdmin) {
    panelCrear.hidden = false;
    document.getElementById('th-acciones').hidden = false;
  }
  return usuario;
}

function entrarModoEdicion(d) {
  editandoId = d.id;
  panelTitulo.textContent = 'Editar donante';
  btnGuardar.textContent = 'Guardar cambios';
  btnCancelar.hidden = false;
  document.getElementById('d-nombre').value = d.nombre;
  document.getElementById('d-tipo').value = d.tipo;
  document.getElementById('d-email').value = d.contacto_email || '';
  document.getElementById('d-tel').value = d.contacto_telefono || '';
  msgDonante.hidden = true;
  panelCrear.scrollIntoView({ behavior: 'smooth' });
}

function salirModoEdicion() {
  editandoId = null;
  formDonante.reset();
  panelTitulo.textContent = 'Registrar donante';
  btnGuardar.textContent = 'Guardar donante';
  btnCancelar.hidden = true;
  msgDonante.hidden = true;
}

async function eliminarDonante(d) {
  const confirmar = window.confirm(
    `¿Eliminar a "${d.nombre}"? Esta acción no se puede deshacer.`
  );
  if (!confirmar) return;

  try {
    const res = await API.del(`/api/donantes/${d.id}`);
    mostrarMensaje(res.mensaje, msgLista, false);
    if (editandoId === d.id) salirModoEdicion();
    await cargarDonantes();
  } catch (err) {
    if (err.status === 401) {
      API.cerrarSesion();
      window.location.href = '/';
      return;
    }
    mostrarMensaje(err.message, msgLista, true);
  }
}

function crearCeldaAcciones(d) {
  const celda = document.createElement('td');
  celda.className = 'acciones';

  const btnEditar = document.createElement('button');
  btnEditar.type = 'button';
  btnEditar.className = 'boton';
  btnEditar.textContent = 'Editar';
  btnEditar.addEventListener('click', () => entrarModoEdicion(d));

  const btnEliminar = document.createElement('button');
  btnEliminar.type = 'button';
  btnEliminar.className = 'boton boton-peligro';
  btnEliminar.textContent = 'Eliminar';
  btnEliminar.addEventListener('click', () => eliminarDonante(d));

  celda.append(btnEditar, btnEliminar);
  return celda;
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
      if (esAdmin) {
        fila.appendChild(crearCeldaAcciones(d));
      }
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

formDonante.addEventListener('submit', async (e) => {
  e.preventDefault();
  msgDonante.hidden = true;

  const cuerpo = {
    nombre: document.getElementById('d-nombre').value,
    tipo: document.getElementById('d-tipo').value,
    contacto_email: document.getElementById('d-email').value || undefined,
    contacto_telefono: document.getElementById('d-tel').value || undefined,
  };

  try {
    if (editandoId !== null) {
      await API.put(`/api/donantes/${editandoId}`, cuerpo);
      mostrarMensaje('Donante actualizado correctamente.', msgDonante, false);
    } else {
      await API.post('/api/donantes', cuerpo);
      mostrarMensaje('Donante registrado correctamente.', msgDonante, false);
    }
    salirModoEdicion();
    await cargarDonantes();
  } catch (err) {
    mostrarMensaje(err.message, msgDonante, true);
  }
});

btnCancelar.addEventListener('click', salirModoEdicion);
document.getElementById('btn-recargar').addEventListener('click', cargarDonantes);

protegerPagina();
cargarDonantes();
