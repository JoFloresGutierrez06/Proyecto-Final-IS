const panelLogin = document.getElementById('panel-login');
const panelRegistro = document.getElementById('panel-registro');
const panelUsuario = document.getElementById('panel-usuario');
const msgLogin = document.getElementById('msg-login');
const msgRegistro = document.getElementById('msg-registro');

function mostrar(mensaje, elemento, esError) {
  elemento.textContent = mensaje;
  elemento.hidden = false;
  elemento.className = esError ? 'mensaje error' : 'mensaje ok';
}

function mostrarPanelLogin(e) {
  if (e) e.preventDefault();
  panelLogin.hidden = false;
  panelRegistro.hidden = true;
}

function mostrarPanelRegistro(e) {
  if (e) e.preventDefault();
  panelLogin.hidden = true;
  panelRegistro.hidden = false;
}

function pintarUsuario(usuario) {
  document.getElementById('u-nombre').textContent = usuario.nombre;
  document.getElementById('u-correo').textContent = usuario.correo;
  const rol = document.getElementById('u-rol');
  rol.textContent = usuario.rol;
  rol.className = usuario.rol === 'administrador' ? 'etiqueta-rol admin' : 'etiqueta-rol usuario';
  panelUsuario.hidden = false;
  panelLogin.hidden = true;
  panelRegistro.hidden = true;
}

document.getElementById('mostrar-registro').addEventListener('click', mostrarPanelRegistro);
document.getElementById('mostrar-login').addEventListener('click', mostrarPanelLogin);

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  msgLogin.hidden = true;
  try {
    const datos = await API.post('/api/auth/login', {
      correo: document.getElementById('login-correo').value,
      contrasena: document.getElementById('login-clave').value,
    });
    API.guardarSesion(datos.token, datos.usuario);
    pintarUsuario(datos.usuario);
  } catch (err) {
    mostrar(err.message, msgLogin, true);
  }
});

document.getElementById('form-registro').addEventListener('submit', async (e) => {
  e.preventDefault();
  msgRegistro.hidden = true;
  try {
    await API.post('/api/auth/registro', {
      nombre: document.getElementById('reg-nombre').value,
      correo: document.getElementById('reg-correo').value,
      contrasena: document.getElementById('reg-clave').value,
    });
    mostrar('Usuario registrado. Ahora inicia sesión.', msgRegistro, false);
    mostrarPanelLogin();
  } catch (err) {
    mostrar(err.message, msgRegistro, true);
  }
});

document.getElementById('btn-salir').addEventListener('click', () => {
  API.cerrarSesion();
  window.location.href = '/';
});

// Si ya hay sesión, mostrar panel de usuario
const usuarioActual = API.usuario();
if (usuarioActual && API.token()) {
  pintarUsuario(usuarioActual);
}
