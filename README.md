# Backend II - Proyecto Final

Este es el proyecto backend del curso Backend II de CoderHouse. Consiste en una API RESTful desarrollada en Node.js y Express, con base de datos en MongoDB, enfocada en la implementación de un sistema de autenticación y autorización por roles robusto, modular y escalable.

## 🛠 Tecnologías Utilizadas

- **Node.js** y **Express.js** (Servidor web y ruteo)
- **MongoDB** y **Mongoose** (Base de datos y modelado de datos)
- **Bcrypt** (Hasheo de contraseñas)
- **JSON Web Tokens (JWT)** y **Cookie-Parser** (Manejo de tokens de sesión en cookies firmadas)
- **Passport.js** (`passport-local` y `passport-jwt` para estrategias de autenticación)
- **Dotenv** (Variables de entorno)

## 🔐 Estrategias de Autenticación Implementadas

El sistema de autenticación está delegado a **Passport.js** (`src/config/passport.config.js`), separando la lógica de autenticación de los controladores:

1. **`register` (LocalStrategy)**: Valida que todos los campos requeridos (`first_name`, `last_name`, `email`, `password`) existan, verifica formato de email y longitud mínima de contraseña, comprueba que el correo no esté registrado, hashea la contraseña con Bcrypt y crea el usuario con rol por defecto `user`.
2. **`login` (LocalStrategy)**: Verifica las credenciales del usuario (email y contraseña comparada con Bcrypt). Si son válidas, el controlador genera un JWT y lo envía en una cookie firmada y `httpOnly`.
3. **`current` (JWTStrategy)**: Extrae el token JWT desde la cookie firmada mediante `cookieExtractor`, verifica su firma y vigencia con `JWT_SECRET`, y carga al usuario autenticado en `req.user`.

> **💡 Preparado para Providers Externos (Google / GitHub):** Gracias a la arquitectura modular en `src/config/passport.config.js`, el sistema queda **totalmente preparado para integrar proveedores OAuth externos (como Google o GitHub)**. Las nuevas estrategias se agregan directamente en `passport.config.js` y sus rutas en `sessions.router.js`, **sin necesidad de tocar ni modificar `app.js`**.

---

## 🛡️ Autorización: Matriz de Permisos por Rol

El sistema maneja tres roles de usuario: **`user`**, **`organizer`** y **`admin`**.

| Recurso / Acción | Endpoint | `user` | `organizer` | `admin` |
| :--- | :--- | :---: | :---: | :---: |
| **Sesiones** | | | | |
| Registro e inicio de sesión | `POST /api/sessions/register` / `login` | ✅ | ✅ | ✅ |
| Ver sesión actual | `GET /api/sessions/current` | ✅ | ✅ | ✅ |
| Cerrar sesión | `DELETE /api/sessions/logout` | ✅ | ✅ | ✅ |
| **Eventos** | | | | |
| Listar todos los eventos | `GET /api/event` | ✅ | ✅ | ✅ |
| Ver detalle de un evento | `GET /api/event/:eid` | ✅ | ✅ | ✅ |
| Crear un evento | `POST /api/event` | ❌ (`403`) | ✅ | ✅ |
| Actualizar un evento | `PUT /api/event/:eid` | ❌ (`403`) | ✅ *(propios)* | ✅ |
| Eliminar un evento | `DELETE /api/event/:eid` | ❌ (`403`) | ✅ *(propios)* | ✅ |
| **Tickets** | | | | |
| Listar tickets | `GET /api/tickets` | ✅ | ✅ | ✅ |
| Ver ticket por ID | `GET /api/tickets/:tid` | ✅ | ✅ | ✅ |
| Comprar ticket de un evento | `POST /api/tickets/:uid/:eid` | ✅ | ⚠️ *(No de su propio evento -> `403`)* | ⚠️ *(No de su propio evento -> `403`)* |
| **Usuarios** | | | | |
| Listar todos los usuarios | `GET /api/users` | ❌ (`403`) | ❌ (`403`) | ✅ |
| Buscar usuario por email | `GET /api/users/:email` | ❌ (`403`) | ❌ (`403`) | ✅ |
| Actualizar usuario | `PUT /api/users/:email` | ❌ (`403`) | ❌ (`403`) | ✅ |

---

## 🚨 Diferencia Explícita entre `401 Unauthorized` y `403 Forbidden`

La API distingue claramente entre **fallos de autenticación (401)** y **fallos de autorización (403)**:

| Código HTTP | Significado | ¿Cuándo ocurre en el sistema? | Middleware responsable |
| :--- | :--- | :--- | :--- |
| **`401 Unauthorized`** *(Sin sesión / No autenticado)* | **"No sé quién sos"**. El cliente no tiene una sesión activa o válida. | • No se envió la cookie con el JWT.<br>• El token JWT expiró o fue adulterado.<br>• El usuario del token ya no existe en la base de datos. | `passport.authenticate("current", { session: false })` y validación `!req.user` en `auth.middleware.js`. |
| **`403 Forbidden`** *(Sin permiso / No autorizado)* | **"Sé quién sos, pero no tenés permiso"**. El cliente tiene sesión válida (`req.user` existe), pero su rol o regla de negocio le impide realizar la acción. | • Un `user` intenta crear/editar/borrar un evento.<br>• Un `user` u `organizer` intenta acceder a `/api/users`.<br>• Un `organizer` o `admin` intenta comprar un ticket de un evento organizado por él mismo. | `rolesPermition(...)`, `ticketPermition` (`authorize.middleware.js`) y `authorizeRoles(...)` (`auth.middleware.js`). |

---

## 🛣️ Rutas del Sistema (Endpoints)

### 1. Rutas de Sesión (`/api/sessions`)
- `POST /api/sessions/register` — *(Pública)* Registra un nuevo usuario (`first_name`, `last_name`, `email`, `password`).
- `POST /api/sessions/login` — *(Pública)* Inicia sesión validando credenciales y emite la cookie firmada con el JWT.
- `GET /api/sessions/current` — *(Protegida: requiere sesión `current`)* Retorna los datos del usuario autenticado actualmente.
- `DELETE /api/sessions/logout` — Limpia la cookie que almacena el token JWT.

### 2. Rutas de Eventos (`/api/event`) — *Todas requieren sesión activa (`401` si no hay sesión)*
- `GET /api/event/` — *(Roles: `user`, `organizer`, `admin`)* Obtiene el listado de eventos.
- `GET /api/event/:eid` — *(Roles: `user`, `organizer`, `admin`)* Obtiene un evento por su ID.
- `POST /api/event/` — *(Protegida: solo `organizer` y `admin`)* Crea un nuevo evento asignando al usuario autenticado como organizador.
- `PUT /api/event/:eid` — *(Protegida: solo `organizer` y `admin`)* Actualiza los datos de un evento.
- `DELETE /api/event/:eid` — *(Protegida: solo `organizer` y `admin`)* Elimina un evento.

### 3. Rutas de Tickets (`/api/tickets`) — *Todas requieren sesión activa (`401` si no hay sesión)*
- `GET /api/tickets/` — *(Roles: `user`, `organizer`, `admin`)* Lista los tickets.
- `GET /api/tickets/:tid` — *(Roles: `user`, `organizer`, `admin`)* Obtiene el detalle de un ticket por ID.
- `POST /api/tickets/:uid/:eid` — *(Protegida con `ticketPermition`)* Genera la compra de un ticket para el evento `:eid`. Si el usuario es `organizer` o `admin` y es el creador de dicho evento, rechaza la operación con **`403 Forbidden`**.

### 4. Rutas de Usuarios (`/api/users`) — *Exclusivas para `admin` (`401` sin sesión / `403` si no es `admin`)*
- `GET /api/users/` — Lista todos los usuarios registrados.
- `GET /api/users/:email` — Obtiene un usuario por su correo electrónico.
- `PUT /api/users/:email` — Actualiza la información de un usuario.

---

## ⚙️ Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/95160
COOKIE_SECRET=elsecretodecookies
JWT_SECRET=elsecretodelajwt
```

## 🚀 Instalación y Ejecución

1. Clonar el repositorio.
2. Instalar las dependencias:
   ```bash
   npm install
   ```
3. Configurar el archivo `.env` como se detalla en el punto anterior.
4. Ejecutar la aplicación:
   - **Modo Estándar**: `npm start`
   - **Modo Desarrollo** (auto-recarga con `node --watch`): `npm run dev`

---
**Autor:** José Agustín Cordero
