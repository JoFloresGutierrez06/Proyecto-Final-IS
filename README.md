# Gestión de Donaciones — MVP

Sistema web para gestionar donaciones de alimentos y recursos entre empresas y organizaciones sociales.

**Etapa actual:** MVP de la materia de Ingeniería de Software. Incluye autenticación JWT con roles, módulo de donantes, pruebas con cobertura ≥80%, pipeline CI con GitHub Actions y frontend básico. El despliegue automático (CD) se activará cuando el CI esté verde.

---

## Índice

1. [Objetivo](#1-objetivo)
2. [Tecnologías](#2-tecnologías)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Instalación](#4-instalación)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Ejecución local](#6-ejecución-local)
7. [Autenticación JWT](#7-autenticación-jwt)
8. [Roles y permisos](#8-roles-y-permisos)
9. [Endpoints](#9-endpoints)
10. [Módulo de donantes](#10-módulo-de-donantes)
11. [Persistencia de datos](#11-persistencia-de-datos)
12. [Pruebas y cobertura](#12-pruebas-y-cobertura)
13. [Frontend](#13-frontend)
14. [GitHub Actions (CI)](#14-github-actions-ci)
15. [Despliegue (CD) — pendiente hasta CI verde](#15-despliegue-cd--pendiente-hasta-ci-verde)
16. [Configuración manual necesaria](#16-configuración-manual-necesaria)
17. [Funcionalidades futuras](#17-funcionalidades-futuras)

---

## 1. Objetivo

Demostrar los requisitos mínimos del proyecto:

- Backend con **Node.js** y **Express**
- Autenticación con **JWT**
- Dos roles: **administrador** y **usuario**
- Módulo para **registrar y consultar donantes**
- Pruebas unitarias con **Jest** y cobertura **≥80%**
- Pipeline **CI/CD** con **GitHub Actions**
- Preparado para ampliarse (inventario, entregas, notificaciones, PostgreSQL/Supabase)

---

## 2. Tecnologías

| Tecnología | Para qué se usa |
|---|---|
| **Node.js** (≥22) | Runtime de JavaScript en el servidor |
| **Express 5** | Framework web: rutas, middleware, JSON, estáticos |
| **jsonwebtoken** | Crear y verificar tokens JWT |
| **bcryptjs** | Hash de contraseñas (nunca se guarda texto plano) |
| **dotenv** | Cargar variables de entorno desde `.env` |
| **node:sqlite** | Base de datos local en archivo (incluida en Node, sin dependencia extra) |
| **Jest** | Framework de pruebas + reporte de cobertura |
| **Supertest** | Probar endpoints HTTP sin levantar el servidor |
| **HTML/CSS/JS vanilla** | Frontend básico servido por Express |

> No se usan ORM, frameworks de frontend ni librerías de validación: la lógica es intencionalmente simple y legible para fines académicos.

---

## 3. Estructura del proyecto

```
├── .github/workflows/ci.yml      # Pipeline CI (pruebas + cobertura)
├── public/                       # Frontend estático
│   ├── index.html                # Login / registro / sesión
│   ├── donantes.html             # Lista y alta de donantes
│   ├── styles.css
│   └── js/
│       ├── api.js                # Cliente fetch + token en localStorage
│       ├── auth.js               # Lógica de login/registro
│       └── donantes.js           # Lógica del módulo de donantes
├── src/
│   ├── app.js                    # Crea la app Express (exportable → testeable)
│   ├── server.js                 # Punto de entrada: listen()
│   ├── bootstrap.js              # Monta rutas + middleware de errores
│   ├── seed.js                   # Crea el administrador inicial
│   ├── config/env.js             # Lectura de variables de entorno
│   ├── db/
│   │   ├── connection.js         # Conexión SQLite (archivo o :memory:)
│   │   └── schema.js             # CREATE TABLE users, donantes
│   ├── repositories/             # Acceso a datos (patrón repositorio)
│   │   ├── userRepository.js
│   │   └── donanteRepository.js
│   ├── services/                 # Lógica de negocio y validaciones
│   │   ├── authService.js
│   │   └── donanteService.js
│   ├── controllers/              # Reciben HTTP → llaman a services
│   │   ├── authController.js
│   │   └── donantesController.js
│   ├── routes/                   # Definición de endpoints y middlewares
│   │   ├── auth.routes.js
│   │   └── donantes.routes.js
│   └── middleware/
│       ├── auth.js               # verificarToken (JWT)
│       ├── roles.js              # requireRole(...)
│       └── errorHandler.js       # Manejador global de errores
├── tests/
│   ├── setup.js                  # Fija JWT_SECRET y BD en memoria
│   ├── helpers.js                # Utilidades compartidas de tests
│   ├── auth.test.js
│   ├── donantes.test.js
│   ├── roles.test.js
│   ├── errorHandler.test.js
│   └── integration.test.js
├── .env.example                  # Plantilla de variables de entorno
├── .gitignore
├── jest.config.js                # Cobertura y threshold ≥80%
├── package.json
└── README.md
```

**Patrón de capas:** `routes → controllers → services → repositories → SQLite`. Los services no conocen SQLite: solo los repositories. Para migrar a PostgreSQL/Supabase basta con reimplementar los dos archivos de `repositories/`.

---

## 4. Instalación

Requisitos: [Node.js](https://nodejs.org/) 22 o superior.

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd Proyecto-Final-IS

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de variables de entorno
cp .env.example .env
# Edita .env y pon un JWT_SECRET fuerte y único

# 4. Crear el administrador inicial
npm run seed
```

---

## 5. Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores. **Nunca subas `.env` a Git** (está en `.gitignore`).

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `JWT_SECRET` | Secreto para firmar/verificar JWT | cadena larga aleatoria |
| `JWT_EXPIRES_IN` | Duración del token | `1h` |
| `DATABASE_PATH` | Ruta del archivo SQLite | `data/app.db` |
| `ADMIN_EMAIL` | Correo del admin creado por `npm run seed` | `admin@donaciones.com` |
| `ADMIN_PASSWORD` | Contraseña del admin del seed | `Admin1234!` |
| `ADMIN_NAME` | Nombre del admin del seed | `Administrador` |
| `NODE_ENV` | Entorno | `development` / `production` |

---

## 6. Ejecución local

```bash
# Arrancar el servidor
npm start

# O con recarga automática al guardar cambios
npm run dev

# Abrir en el navegador
# http://localhost:3000
```

Comprobación rápida:

```bash
curl http://localhost:3000/api/salud
# → {"estado":"ok","mensaje":"API de gestión de donaciones funcionando"}
```

---

## 7. Autenticación JWT

### Flujo

1. **Registro** `POST /api/auth/registro` → la contraseña se hashea con bcrypt (10 rondas) y se guarda el usuario con rol `usuario`.
2. **Login** `POST /api/auth/login` → se compara el hash; si coincide, se firma un JWT con payload `{ sub, correo, rol, nombre }`, `JWT_SECRET` y expiración `JWT_EXPIRES_IN`.
3. **Peticiones autenticadas** → cabecera `Authorization: Bearer <token>`.
4. El middleware `verificarToken` valida firma y expiración; si falla responde `401`.
5. El middleware `requireRole(...)` comprueba el rol del payload; si no corresponde responde `403`.

### Ejemplo con curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@donaciones.com","contrasena":"Admin1234!"}'
# → { "token": "eyJhbGciOi...", "usuario": { ... } }

# Usar el token
curl http://localhost:3000/api/auth/perfil \
  -H "Authorization: Bearer EY_JWT_AQUI"
```

### Seguridad

- Contraseñas **nunca** en texto plano (bcrypt).
- `JWT_SECRET` solo en variables de entorno; ausente en el repositorio.
- Sin token → `401`. Token inválido/expirado → `401`. Rol insuficiente → `403`.
- Errores 500 no exponen detalles internos.

---

## 8. Roles y permisos

| Acción | administrador | usuario | sin sesión |
|---|:---:|:---:|:---:|
| Registrarse | ✅ | ✅ | ✅ |
| Iniciar sesión | ✅ | ✅ | ✅ |
| Ver su perfil (`GET /api/auth/perfil`) | ✅ | ✅ | ❌ 401 |
| **Crear** donante (`POST /api/donantes`) | ✅ | ❌ 403 | ❌ 401 |
| **Listar** donantes (`GET /api/donantes`) | ✅ | ✅ | ❌ 401 |
| **Consultar** donante por id (`GET /api/donantes/:id`) | ✅ | ✅ | ❌ 401 |

- El registro normal **siempre** crea rol `usuario`.
- El administrador se crea con `npm run seed` (usa `ADMIN_*` del `.env`).
- Implementado en `src/middleware/roles.js` → `requireRole('administrador')`.

---

## 9. Endpoints

| Método | Ruta | Auth | Rol | Descripción |
|---|---|---|---|---|
| GET | `/api/salud` | No | — | Health check |
| POST | `/api/auth/registro` | No | — | Registrar usuario |
| POST | `/api/auth/login` | No | — | Iniciar sesión → JWT |
| GET | `/api/auth/perfil` | JWT | Cualquiera | Datos del usuario actual |
| POST | `/api/donantes` | JWT | administrador | Crear donante |
| GET | `/api/donantes` | JWT | Cualquiera | Listar donantes |
| GET | `/api/donantes/:id` | JWT | Cualquiera | Consultar por id |

### Ejemplos

**Registrar usuario**

```bash
curl -X POST http://localhost:3000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana Pérez","correo":"ana@ejemplo.com","contrasena":"secret123"}'
# 201 → usuario creado (rol "usuario", sin contraseña en la respuesta)
```

**Crear donante (solo administrador)**

```bash
curl -X POST http://localhost:3000/api/donantes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -d '{
    "nombre": "Alimentos del Sur S.A.",
    "tipo": "empresa",
    "contacto_email": "contacto@sur.com",
    "contacto_telefono": "555-1234"
  }'
# 201 → donante creado
# 400 → validación fallida
# 401 → sin token
# 403 → token de usuario sin rol administrador
```

**Listar donantes**

```bash
curl http://localhost:3000/api/donantes \
  -H "Authorization: Bearer <TOKEN>"
# 200 → { "total": 1, "donantes": [ ... ] }
```

**Consultar por id**

```bash
curl http://localhost:3000/api/donantes/1 \
  -H "Authorization: Bearer <TOKEN>"
# 200 → donante
# 400 → id no numérico
# 404 → id inexistente
```

---

## 10. Módulo de donantes

Campos de un donante:

| Campo | Tipo | Obligatorio | Observaciones |
|---|---|---|---|
| `id` | entero | auto | PK |
| `nombre` | texto | ✅ | no vacío |
| `tipo` | texto | ✅ | `empresa` \| `organizacion` |
| `contacto_email` | texto | opcional | formato email si se envía |
| `contacto_telefono` | texto | opcional | libre |
| `fecha_registro` | fecha | automática | `datetime('now')` |

Validaciones en `src/services/donanteService.js`. Respuestas: `201` creado, `200` consulta, `400` validación, `401` sin token, `403` rol insuficiente, `404` no encontrado.

---

## 11. Persistencia de datos

- **Motor:** SQLite mediante el módulo nativo `node:sqlite` de Node (sin dependencias extra).
- **Archivo:** `data/app.db` (carpeta `data/` y `*.db` están en `.gitignore`). En pruebas se usa `:memory:`.
- **Capas:** `repositories/` es el único punto que habla SQL. Los `services/` no dependen de SQLite.

**Migración futura a PostgreSQL/Supabase:** crear nuevos repositories (`userRepositorySupabase.js`, etc.) con la misma interfaz pública (`encontrarPorCorreo`, `crear`, `listar`…) y cambiar el `require` en los services/controllers. No hay que reescribir rutas, controllers, middlewares ni frontend.

---

## 12. Pruebas y cobertura

```bash
# Ejecutar pruebas
npm test

# Ejecutar con reporte de cobertura
npm run test:coverage
```

- **Framework:** Jest + Supertest.
- **Aislamiento:** cada test usa BD SQLite en memoria (`:memory:`) y `JWT_SECRET` fijo en `tests/setup.js`.
- **Umbral:** `jest.config.js` → `coverageThreshold.global = 80%` en ramas, funciones, líneas y sentencias. Si baja de 80%, **`npm test` devuelve error** y el workflow de CI falla.

**Cobertura actual (local):**

| Métrica | Valor |
|---|---|
| Statements | **~94.6%** |
| Branches | **~88.9%** |
| Functions | **~92.8%** |
| Lines | **~95.8%** |
| Pruebas | **48** (5 suites) |

> Los archivos excluidos son solo los entry points (`server.js`, `seed.js`), que no contienen lógica testeable. El resto del código fuente sí se mide.

Qué se prueba:

- Registro (válido, validaciones, correo duplicado)
- Login (ok, credenciales inválidas, incompletas)
- Generación y verificación de JWT (payload, token falso, expirado/manipulado)
- Perfil con/sin/esquema incorrecto de token; usuario borrado
- Autorización por roles (403/401, unidades del middleware)
- Creación/lista/consulta de donantes + validaciones + 404/400
- Manejador de errores (500 genérico, statusCode personalizado, headersSent)
- Flujo integral registro → login → crear → consultar

---

## 13. Frontend

Interfaz estática servida por Express (`public/`):

- **`/`** → login, registro y panel de sesión (nombre, correo, **rol**).
- **`/donantes.html`** → lista de donantes; formulario de alta **solo visible para administrador**.

Flujo de prueba en navegador:

1. `npm run seed && npm start` → `http://localhost:3000`
2. Login con el admin → ves rol *administrador* → “Ir a donantes”
3. Registrar un donante → aparece en la tabla
4. Cerrar sesión → registrar un usuario normal → login → el formulario de donantes **no aparece** (y la API devolvería 403 si se llamara a POST)

El token se guarda en `localStorage` y se envía en cada petición (`public/js/api.js`).

---

## 14. GitHub Actions (CI)

Archivo: `.github/workflows/ci.yml`

| Disparador | `push` y `pull_request` |
|---|---|
| Runner | `ubuntu-latest` |
| Node.js | matriz `22.x` y `24.x` |
| Pasos | checkout → `npm ci` → `npm run test:coverage` |
| Fallo | si falla una prueba **o** la cobertura <80% |
| Artifact | reporte de cobertura (`coverage/`) conservado 7 días |

El umbral de 80% está en `jest.config.js`; Jest sale con código distinto de cero si no se cumple, y Actions marca el job como fallido.

Verificación: tras hacer **push** desde GitHub Desktop → pestaña **Actions** en GitHub → workflow *CI - Pruebas y cobertura* → ✅ verde.

---

## 15. Despliegue (CD) — pendiente hasta CI verde

**Plataforma propuesta: [Render](https://render.com)** — free tier para Node.js, conexión directa con GitHub y deploy hooks para disparar el despliegue desde Actions.

Estado: **ETAPA 7 pendiente** a petición del autor: se configurará cuando el workflow de CI esté verde en GitHub.

### Flujo previsto (cuando se active)

```
Código local
  → push a GitHub (GitHub Desktop)
  → GitHub Actions (instalar → test → cobertura ≥80%)
  → job "deploy" (solo en push a main, solo si test pasó)
  → Render Deploy Hook
  → Render instala dependencias y arranca npm start
  → Aplicación disponible en la URL de prueba de Render
```

### Configuración que deberá hacerse en Render

1. Crear cuenta en Render → **New → Web Service** → conectar el repositorio de GitHub.
2. Configuración:
   - **Environment:** Node
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
3. **Environment** (variables) en Render:

   | Variable | Valor |
   |---|---|
   | `JWT_SECRET` | cadena aleatoria larga (generar con `openssl rand -hex 32`) |
   | `JWT_EXPIRES_IN` | `1h` |
   | `NODE_ENV` | `production` |
   | `PORT` | lo inyecta Render (no hace falta fijarlo) |

4. Copiar la **Deploy Hook URL** (Settings → Build & Deploy → Deploy hooks) y añadirla como secreto en GitHub:

   | Dónde | Secreto | Valor |
   |---|---|---|
   | GitHub → Settings → Secrets and variables → Actions | `RENDER_DEPLOY_HOOK_URL` | URL del deploy hook |

> Los secretos **nunca** se escriben en el código ni en el workflow; solo en GitHub Secrets y en el panel de Render.

**Limitación conocida (free tier):** el disco de Render es efímero; la BD SQLite se regenera en cada redeploy. Aceptable para un entorno de prueba. En producción se migrará a Supabase/PostgreSQL usando la capa de repositories.

---

## 16. Configuración manual necesaria

| # | Qué | Dónde | Cuándo |
|---|---|---|---|
| 1 | Editar `.env` con `JWT_SECRET` fuerte | Local | Antes de usar la app |
| 2 | Ejecutar `npm run seed` | Local | Primera vez |
| 3 | Push del código | GitHub Desktop | Para que corra CI |
| 4 | Verificar workflow verde | GitHub → Actions | Tras el push |
| 5 | Crear Web Service en Render | render.com | Cuando CI esté verde (ETAPA 7) |
| 6 | Definir `JWT_SECRET` y `NODE_ENV` en Render | Panel de Render | Al crear el servicio |
| 7 | Añadir `RENDER_DEPLOY_HOOK_URL` | GitHub Secrets | Al activar el CD |
| 8 | (Opcional) Cambiar `ADMIN_PASSWORD` del seed | `.env` local | Recomendado |

---

## 17. Funcionalidades futuras

Para convertir este MVP en el sistema completo de gestión de donaciones:

- **Inventario:** stock de alimentos/recursos por donante y ubicación
- **Donaciones y lotes:** artículos, cantidades, caducidad
- **Organizaciones y beneficiarios:** alta, perfil, necesidades
- **Entregas/asignaciones:** vincular donaciones con organizaciones, estados (pendiente/aceptada/entregada)
- **Notificaciones:** email o in-app al registrar/aceptar donaciones
- **Reporting/dashboard:** métricas por rol, exportación CSV/PDF
- **Auditoría:** quién creó/modificó cada registro
- **Refresh tokens / expiración configurable** por perfil
- **Paginación y filtros** en `GET /api/donantes`
- **Migración a PostgreSQL/Supabase** mediante la capa de repositories ya preparada
- **Frontend SPA** (React/Vite) si crece la interfaz
- **Endtoend** con Playwright y nuevos permisos (ej. usuario puede proponer donaciones)

---

## Licencia

MIT — proyecto académico final de Ingeniería de Software.
