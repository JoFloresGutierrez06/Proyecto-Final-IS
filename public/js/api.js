/* Cliente HTTP mínimo: maneja token JWT en localStorage */
const API = {
  token() {
    return localStorage.getItem('token');
  },

  usuario() {
    const crudo = localStorage.getItem('usuario');
    return crudo ? JSON.parse(crudo) : null;
  },

  guardarSesion(token, usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  },

  cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },

  async solicitar(metodo, ruta, cuerpo) {
    const encabezados = { 'Content-Type': 'application/json' };
    const token = this.token();
    if (token) {
      encabezados.Authorization = `Bearer ${token}`;
    }

    const opciones = { method: metodo, headers: encabezados };
    if (cuerpo !== undefined) {
      opciones.body = JSON.stringify(cuerpo);
    }

    const respuesta = await fetch(ruta, opciones);
    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      const error = new Error(datos.mensaje || 'Error en la petición');
      error.status = respuesta.status;
      throw error;
    }

    return datos;
  },

  get(ruta) {
    return this.solicitar('GET', ruta);
  },

  post(ruta, cuerpo) {
    return this.solicitar('POST', ruta, cuerpo);
  },
};
