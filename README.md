# Backend II - Proyecto Final (Pre-entrega 5: Roles y Autorización)

Este es el proyecto backend del curso Backend II de CoderHouse. Consiste en una API RESTful para una **Plataforma de Eventos e Inscripciones** desarrollada en Node.js y Express, con base de datos en MongoDB, enfocada en la implementación de un sistema de autenticación (Passport + JWT en cookies firmadas) y **autorización profesional basada en roles y propiedad de recursos**, diferenciando explícitamente los códigos HTTP **`401 Unauthorized`** y **`403 Forbidden`**.

## 🛠 Tecnologías Utilizadas

- **Node.js** y **Express.js** (Servidor web y ruteo)
- **MongoDB** y **Mongoose** (Base de datos y modelado de datos)
- **Bcrypt** (Hasheo de contraseñas)
- **JSON Web Tokens (JWT)** y **Cookie-Parser** (Manejo de tokens de sesión en cookies firmadas)
- **Passport.js** (`passport-local` y `passport-jwt` para estrategias de autenticación)
- **Dotenv** (Variables de entorno)

## 🔐 Estrategias de Autenticación Implementadas

El sistema de autenticación está delegado a **Passport.js** (`src/config/passport.config.js`), separando la lógica de autenticación de los controladores:

1. **`register` (LocalStrategy)**: Valida que todos los campos requeridos (`first_name`, `last_name`, `email`, `password`) existan, verifica formato de email y longitud mínima de contraseña, comprueba que el correo no esté registrado, hashea la contraseña con Bcrypt y crea el usuario forzando siempre el rol por defecto **`user`** (no permite asignar `admin` u `organizer` desde el body en el registro público).
2. **`login` (LocalStrategy)**: Verifica las credenciales del usuario (email y contraseña comparada con Bcrypt). Si son válidas, el controlador genera un JWT y lo envía en una cookie firmada y `httpOnly`.
3. **`current` (JWTStrategy)**: Extrae el token JWT desde la cookie firmada mediante `cookieExtractor`, verifica su firma y vigencia con `JWT_SECRET`, y carga al usuario autenticado en `req.user`.

> **💡 Preparado para Providers Externos (Google / GitHub):** Gracias a la arquitectura modular en `src/config/passport.config.js`, el sistema queda **totalmente preparado para integrar proveedores OAuth externos (como Google o GitHub)**. Las nuevas estrategias se agregan directamente en `passport.config.js` y sus rutas en `sessions.router.js`, **sin necesidad de tocar ni modificar `app.js`**.

---

## 🛡️ Autorización: Roles y Matriz de Permisos

El modelo `Users` (`src/models/user.model.js`) define tres roles: **`user`** (por defecto), **`organizer`** y **`admin`**.

| Acción / Recurso | Endpoint | `user` | `organizer` | `admin` |
| :--- | :--- | :---: | :---: | :---: |
| **Sesiones** | | | | |
| Registro e inicio de sesión | `POST /api/sessions/register` / `login` | ✅ | ✅ | ✅ |
| Ver sesión actual | `GET /api/sessions/current` | ✅ | ✅ | ✅ |
| Cerrar sesión | `DELETE /api/sessions/logout` | ✅ | ✅ | ✅ |
| **Eventos** | | | | |
| Consultar eventos publicados | `GET /api/events` y `GET /api/events/:eid` | ✅ | ✅ | ✅ |
| Crear eventos | `POST /api/events` | ❌ (`403`) | ✅ | ✅ |
| Modificar / eliminar eventos propios | `PUT /api/events/:eid` / `DELETE /api/events/:eid` | ❌ (`403`) | ✅ *(solo propios)* | ✅ |
| Modificar / eliminar cualquier evento | `PUT /api/events/:eid` / `DELETE /api/events/:eid` | ❌ (`403`) | ❌ (`403`) | ✅ |
| **Tickets** | | | | |
| Consultar tickets | `GET /api/tickets` y `GET /api/tickets/:tid` | ✅ | ✅ | ✅ |
| Comprar ticket de un evento | `POST /api/tickets/:uid/:eid` | ✅ | ⚠️ *(No de su propio evento -> `403`)* | ⚠️ *(No de su propio evento -> `403`)* |
| **Usuarios (Administración)** | | | | |
| Ver todos los usuarios | `GET /api/users` | ❌ (`403`) | ❌ (`403`) | ✅ |
| Buscar / actualizar usuario | `GET /api/users/:email` / `PUT /api/users/:email` | ❌ (`403`) | ❌ (`403`) | ✅ |

---

## 🚨 Diferencia Explícita entre `401 Unauthorized` y `403 Forbidden`

La API separa la **autenticación** (`src/middlewares/auth.middleware.js`) de la **autorización** (`src/middlewares/authorize.middleware.js`) y nunca utiliza `500` para errores de sesión o permisos:

| Código HTTP | Significado | ¿Cuándo ocurre en el sistema? | Middleware y Respuesta JSON |
| :--- | :--- | :--- | :--- |
| **`401 Unauthorized`** *(Sin sesión / No autenticado)* | **"No sé quién sos"**. El cliente intenta acceder a una ruta protegida sin una sesión válida. | • No se envió la cookie con el JWT.<br>• El token JWT expiró o su firma es inválida.<br>• El usuario del token ya no existe en la base de datos. | **`authMiddleware`** (`src/middlewares/auth.middleware.js`):<br>`{ "status": "error", "message": "No autenticado" }` |
| **`403 Forbidden`** *(Sin permiso / No autorizado)* | **"Sé quién sos, pero no tenés permiso"**. El cliente tiene sesión válida (`req.user` existe), pero su rol o la propiedad del recurso no le permiten realizar la acción. | • Un `user` intenta crear, modificar o eliminar un evento.<br>• Un `organizer` intenta modificar o eliminar un evento creado por otro organizador.<br>• Un `user` u `organizer` intenta acceder a `/api/users`.<br>• Un `organizer` intenta comprar un ticket de su propio evento. | **`rolesPermition`**, **`ensureEventOwnerOrAdmin`** y **`ticketPermition`** (`src/middlewares/authorize.middleware.js`):<br>`{ "status": "error", "message": "No tenés permisos para realizar esta acción" }` |

---

## 🛣️ Rutas Protegidas del Sistema (Endpoints)

### 1. Rutas de Sesión (`/api/sessions`)
- `POST /api/sessions/register` — *(Pública)* Registra un nuevo usuario con rol `user`.
- `POST /api/sessions/login` — *(Pública)* Inicia sesión validando credenciales y emite la cookie firmada con el JWT.
- `GET /api/sessions/current` — *(Protegida: `authMiddleware`)* Retorna los datos del usuario autenticado (`401` si no hay sesión).
- `DELETE /api/sessions/logout` — Elimina la cookie de sesión.

### 2. Rutas de Eventos (`/api/events`) — *Todas protegidas con `authMiddleware` (`401` sin sesión)*
- `GET /api/events/` — *(Roles: `user`, `organizer`, `admin`)* Lista los eventos disponibles.
- `GET /api/events/:eid` — *(Roles: `user`, `organizer`, `admin`)* Obtiene el detalle de un evento por ID.
- `POST /api/events/` — *(Protegida: `rolesPermition(["organizer", "admin"])`)* Crea un evento asignando `organizer: req.user._id` (`403` si el rol es `user`).
- `PUT /api/events/:eid` — *(Protegida: `rolesPermition(["organizer", "admin"])` + `ensureEventOwnerOrAdmin`)* Modifica un evento. Si es `organizer`, valida que sea el creador del evento; si es `admin`, puede modificar cualquiera (`403` en caso contrario).
- `DELETE /api/events/:eid` — *(Protegida: `rolesPermition(["organizer", "admin"])` + `ensureEventOwnerOrAdmin`)* Elimina un evento propio (si es `organizer`) o cualquier evento (si es `admin`).

### 3. Rutas de Tickets (`/api/tickets`) — *Todas protegidas con `authMiddleware` (`401` sin sesión)*
- `GET /api/tickets/` — *(Roles: `user`, `organizer`, `admin`)* Lista los tickets.
- `GET /api/tickets/:tid` — *(Roles: `user`, `organizer`, `admin`)* Obtiene un ticket por ID.
- `POST /api/tickets/:uid/:eid` — *(Protegida con `ticketPermition`)* Compra un ticket para el evento `:eid`. Rechaza con `403` si el organizador intenta comprar un ticket de su propio evento.

### 4. Rutas Administrativas de Usuarios (`/api/users`) — *Protegidas con `authMiddleware` + `rolesPermition(["admin"])`*
- `GET /api/users/` — *(Solo `admin`)* Lista todos los usuarios (`401` sin sesión / `403` para `user` u `organizer`).
- `GET /api/users/:email` — *(Solo `admin`)* Busca un usuario por email.
- `PUT /api/users/:email` — *(Solo `admin`)* Actualiza un usuario.

---

## ⚙️ Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto (puedes guiarte con `.env.example`):

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
3. Configurar el archivo `.env` a partir de `.env.example`.
4. Ejecutar la aplicación:
   - **Modo Estándar**: `npm start`
   - **Modo Desarrollo** (auto-recarga con `node --watch`): `npm run dev`

---
**Autor:** José Agustín Cordero
