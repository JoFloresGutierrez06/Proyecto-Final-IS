# Informe de análisis de seguridad y calidad de código

| | |
|---|---|
| **Proyecto** | Gestión de Donaciones — MVP (Ingeniería de Software) |
| **Fecha** | 27 de septiembre de 2026 |
| **Objetivo** | Ejecutar pruebas de seguridad (OWASP ZAP) y análisis de calidad (SonarQube), documentar métricas y hallazgos |
| **Aplicación analizada** | Versión local `http://localhost:3000` (misma API desplegada en Render) |

---

## Resumen ejecutivo

| Herramienta | Resultado principal |
|---|---|
| **OWASP ZAP** (2 escaneos, activos) | **0 fallos críticos.** No se detectaron vulnerabilidades XSS ni SQLi. 8 + 4 advertencias, todas sobre **cabeceras HTTP de seguridad** (fáciles de corregir) |
| **SonarQube** | **Quality Gate: OK.** 0 bugs, 0 vulnerabilidades, 0 code smells, **deuda técnica = 0** (calificación A). 2 *security hotspots* revisados manualmente (ver §2.4) |
| **Acción correctiva** | El primer análisis detectó **2 bugs** en `seedService.js`; se corrigieron y el re-análisis quedó en 0 bugs (fiabilidad A) |

Archivos de este informe:

```
docs/analisis/
├── informe.md              ← este documento
├── openapi.yaml            ← especificación usada para escanear la API
└── zap/
    ├── zap-web.html        ← reporte visual del escaneo web (abrir en navegador)
    ├── zap-web.json        ← mismo reporte en JSON
    ├── zap-api.html        ← reporte visual del escaneo de API
    └── zap-api.json        ← mismo reporte en JSON
```

---

## 1. OWASP ZAP — pruebas de seguridad

### 1.1 ¿Qué es?

**OWASP ZAP** (Zed Attack Proxy) es una herramienta gratuita de la fundación OWASP. Simula a un atacante: rastrea la aplicación, envía payloads (inyecciones SQL, scripts XSS, etc.) y reporta lo que consigue explotar.

- **Versión:** OWASP ZAP 2.17.0 (imagen oficial `ghcr.io/zaproxy/zaproxy:stable` en Docker)
- **Modo:** escaneo **pasivo** (observa el tráfico) + **activo** (ataca con payloads de las reglas de XSS, SQLi, etc.)

### 1.2 Metodología (cómo se ejecutó)

Se realizaron **2 escaneos** contra la aplicación local:

**Escaneo 1 — Web completo** (`zap-full-scan.py`)

```bash
docker run --rm -v "<proyecto>/docs/analisis:/zap/wrk" ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py -t http://host.docker.internal:3000 -r zap/zap-web.html -J zap/zap-web.json -m 8 -I
```

- Rastrea las páginas (`/`, `/donantes.html`, estáticos) y ejecuta el escaneo activo con todas las reglas (incluidas XSS y SQLi).
- Reporte: `zap/zap-web.html` y `zap/zap-web.json`.

**Escaneo 2 — API REST** (`zap-api-scan.py` + OpenAPI)

```bash
docker run --rm -v "<proyecto>/docs/analisis:/zap/wrk" ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py -t /zap/wrk/openapi.yaml -f openapi -r zap/zap-api.html -J zap/zap-api.json -I -T 5
```

- A partir de la especificación `openapi.yaml` genera peticiones a los **10 endpoints** de la API (salud, registro, login, perfil, donantes CRUD) y ejecuta **escaneo activo sobre sus parámetros**.
- Reporte: `zap/zap-api.html` y `zap/zap-api.json`.

**Alcance / limitación:** el escaneo es **sin autenticación** (no se le entrega un JWT al escáner). Los endpoints protegidos responden 401/403 — lo cual también valida el control de acceso —, pero sus parámetros internos no se prueban activamente. Cubrirlos requeriría un *contexto autenticado* de ZAP (mejora futura).

### 1.3 Resultados — escaneo web

```
FAIL-NEW: 0   FAIL-INPROG: 0   WARN-NEW: 8   INFO: 0   PASS: 133
```

- ✅ **0 fallos (FAIL):** ninguna regla crítica ni de riesgo alto encontró vulnerabilidad.
- **No se detectó XSS ni SQLi:** todas las reglas activas de inyección pasaron.
- ⚠️ **8 advertencias (WARN)** + 4 informativas, todas de configuración de cabeceras HTTP:

| # | Hallazgo | Riesgo | Zonas afectadas |
|---|---|---|---|
| 1 | Falta cabecera **Content-Security-Policy** (CSP) | Medio | `/`, `/donantes.html` |
| 2 | CSP no define directivas sin *fallback* | Medio | 2 instancias |
| 3 | **X-Frame-Options** / `frame-ancestors` ausente (clickjacking) | Medio | 3 instancias |
| 4 | Sitio servido solo por **HTTP** (no HTTPS) | Medio | raíz *(en Render sí es HTTPS)* |
| 5 | Falta **Cross-Origin-Resource-Policy** | Bajo | 5 instancias |
| 6 | Falta **Cross-Origin-Opener-Policy** | Bajo | 3 instancias |
| 7 | Falta **Cross-Origin-Embedder-Policy** | Bajo | 3 instancias |
| 8 | Falta **Permissions-Policy** | Bajo | 5 instancias |
| 9 | **X-Powered-By** filtra que el servidor es Express | Bajo | 5 instancias |
| 10 | Falta **X-Content-Type-Options: nosniff** | Bajo | 5 instancias |

Informativos (sin acción): *Modern Web Application*, contenido cacheable, *User Agent Fuzzer*.

### 1.4 Resultados — escaneo de API

```
FAIL-NEW: 0   WARN-NEW: 4   PASS: 115
```

- ✅ **0 fallos.** Las reglas activas de **SQLi, XSS, etc. no encontraron nada explotable** en los 10 endpoints.
- Comprobaciones destacadas del escáner: `POST /api/auth/login` y `POST /api/auth/registro` respondieron correctamente ante payloads; los endpoints de donantes devolvieron `401 Unauthorized` (control de acceso funcionando).
- ⚠️ 4 advertencias (todas las mismas de cabeceras del listado anterior: CORP, X-Powered-Options, X-Content-Type-Options, *Unexpected Content-Type*).

### 1.5 Recomendaciones derivadas de ZAP

1. **Añadir cabeceras de seguridad** en `src/app.js` (manualmente o con el middleware `helmet`):
   `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`, `Referrer-Policy`, `Cross-Origin-Resource-Policy`.
2. **Ocultar la firma del servidor:** `app.disable('x-powered-by')`.
3. **HTTPS:** ya lo aporta Render en producción (el hallazgo #4 no aplica allí).
4. Futuro: escaneo con **contexto autenticado** para cubrir parámetros tras el JWT.

---

## 2. SonarQube — análisis de calidad de código

### 2.1 ¿Qué es?

**SonarQube** analiza el código estático (lo lee sin ejecutarlo) y mide: *code smells* (malos olores), *bugs*, *vulnerabilities*, *security hotspots*, duplicación, cobertura y **deuda técnica** (esfuerzo estimado en minutos para dejar el código "limpio").

- **Versión:** SonarQube 9.9.8 LTS (Community) en Docker + **SonarScanner CLI**
- **Configuración:** `sonar-project.properties` (fuentes `src/` y `public/js/`, pruebas `tests/`, cobertura de Jest vía `coverage/lcov.info`)
- **Dashboard local:** `http://localhost:9000/dashboard?id=gestion-donaciones-mvp`

### 2.2 Metodología

```
1. docker run sonarqube:lts-community              → servidor de análisis
2. npm run test:coverage                            → genera coverage/lcov.info
3. sonar-scanner (contenedor)                       → sube el análisis al servidor
4. API de SonarQube                                 → extracción de métricas
5. Primer análisis → hallazgos → corrección → re-análisis → métricas finales
```

### 2.3 Métricas finales (tras corrección)

**Quality Gate: ✅ OK**

| Métrica | Valor | Lectura en palabras simples |
|---|---|---|
| **Líneas de código (ncloc)** | 924 | Tamaño del código analizado |
| **Bugs** | **0** *(inicial: 2, corregidos)* | Errores reales detectados en la lógica |
| **Vulnerabilities** | 0 | Debilidades de seguridad (p. ej. inyecciones) |
| **Code smells** | 0 | Malos olores de diseño (código difícil de mantener) |
| **Security hotspots** | 2 *(revisados, ver §2.4)* | Zonas sensibles que exigen revisión humana |
| **Deuda técnica (`sqale_index`)** | **0 minutos** | Trabajo pendiente para dejar el código limpio |
| **Deuda / ratio (`sqale_debt_ratio`)** | 0.0 % | Deuda sobre el esfuerzo total estimado |
| **Esfuerzo hasta mantenibilidad A** | 0 min | Coste de corregir todo lo pendiente |
| **Duplicación de líneas** | 0.0 % | Nada de código copiado y pegado |
| **Cobertura de tests (global)** | 66.1 % | *Backend: ~96 % según Jest; baja por `public/js` que no tiene tests (ver nota)* |
| **Mantenibilidad (`sqale_rating`)** | **A** | Calidad de diseño: excelente |
| **Fiabilidad (`reliability_rating`)** | **A** | Riesgo de fallos: excelente |
| **Seguridad (`security_rating`)** | **A** | Riesgo de vulnerabilidades: excelente |
| **Security review (`security_review_rating`)** | E → pendiente de marcar 2/2 hotspots *como revisados* en SonarQube (la revisión se documenta en §2.4) |

> **Nota sobre la cobertura:** Jest mide ~96 % sobre el backend (`src/`), que es donde están las pruebas. SonarQube agrega `public/js` (frontend sin tests automatizados) y el número global baja a 66,1 %. Ambos datos son correctos: 66,1 % es la cifra *global* del proyecto.

### 2.4 Hallazgos y acciones correctivas

**Primer análisis — 2 bugs (corregidos ✅)**

| Regla | Archivo | Descripción |
|---|---|---|
| `javascript:S6324` (MAJOR) ×2 | `src/services/seedService.js:10` | El regex usaba caracteres de control (`\u0000`, `\u001F`) — difícil de leer y riesgo de comportamiento confuso |

- **Corrección:** el regex se reemplazó por propiedades Unicode: `/[\p{Cc}\p{Cf}]/gu` (misma función `limpiarValor`, más legible y sin caracteres de control).
- **Verificación:** 74 pruebas pasan; **re-análisis de SonarQube → 0 bugs, fiabilidad A**.

**Security hotspots — 2, revisión manual documentada (§2.4)**

| Regla | Archivo | Mensaje |
|---|---|---|
| Regex con posible *backtracking* | `src/services/authService.js:13` | Posible denegación de servicio por regex lenta |
| Regex con posible *backtracking* | `src/services/donanteService.js:20` | Ídem (misma validación de correo) |

**Revisión manual:** ambas usan `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` para validar correos. El riesgo es **teórico**: con una entrada artificialmente larga el motor de regex podría consumir CPU (DoS). En la práctica el cuerpo JSON es pequeño y la validación ocurre tras el *body parser*. **Decisión: riesgo aceptado para el MVP**; como mejora futura, limitar la longitud del correo antes de validar. En el dashboard de SonarQube aparecen como *TO_REVIEW*; esta revisión queda asentada aquí.

### 2.5 Deuda técnica y code smells

- **Code smells: 0** → no hay funciones gigantes, duplicación, nombres confusos ni otras señales de "código sucio".
- **Deuda técnica: 0 minutos (0,0 %)** → según la calificación de SonarQube, no queda trabajo de refactoring pendiente; calificación de mantenibilidad **A**.

---

## 3. Conclusiones

1. **Seguridad (ZAP):** la aplicación **no muestra XSS ni SQLi** en dos escaneos activos (web + API con 115 y 133 comprobaciones). Los únicos hallazgos son **cabeceras HTTP de seguridad ausentes** — configuración recomendada, no vulnerabilidades explotadas.
2. **Calidad (SonarQube):** **Quality Gate OK**, sin deuda técnica, sin code smells, sin vulnerabilidades. El análisis encontró 2 bugs reales que **se corrigieron**, demostrando el ciclo *analizar → corregir → verificar*.
3. **Ciclo de mejora aplicado:** hallazgos → acción correctiva → re-análisis → métricas finales en verde.

---

## Anexo — cómo reproducir los análisis

```bash
# 1. Aplicación local
npm start                                   # http://localhost:3000

# 2. Escaneo ZAP (web)
docker run --rm -v "<proyecto>/docs/analisis:/zap/wrk" ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py -t http://host.docker.internal:3000 -r zap/zap-web.html -J zap/zap-web.json -I

# 3. Escaneo ZAP (API, desde openapi.yaml)
docker run --rm -v "<proyecto>/docs/analisis:/zap/wrk" ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py -t /zap/wrk/openapi.yaml -f openapi -r zap/zap-api.html -J zap/zap-api.json -I

# 4. SonarQube
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
npm run test:coverage
docker run --rm -e SONAR_HOST_URL=http://host.docker.internal:9000 -e SONAR_TOKEN=<token> \
  -v "<proyecto>:/usr/src" -w /usr/src sonarsource/sonar-scanner-cli

# 5. Métricas por API
curl -u admin:<password> "http://localhost:9000/api/measures/component?component=gestion-donaciones-mvp&metricKeys=bugs,code_smells,vulnerabilities,sqale_index,coverage"
```

- El token de análisis y las credenciales son locales a este entorno Docker; **no** se suben a Git.
- Para detener SonarQube: `docker stop sonarqube` (los datos persisten; para reiniciar: `docker start sonarqube`).
