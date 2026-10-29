# Backend II - Proyecto Final (Plataforma de Eventos e Inscripciones)

Este es el proyecto backend del curso Backend II de CoderHouse. Consiste en una API RESTful para una **Plataforma de Eventos e Inscripciones** desarrollada en Node.js y Express, con base de datos en MongoDB, diseñada con arquitectura en capas (`routes` → `controllers` → `services` → `repositories` → `models`), autenticación con Passport + JWT en cookies firmadas y autorización por roles y propiedad de recursos.

---

## 🛠 Tecnologías y Arquitectura

- **Node.js** y **Express.js** (Servidor web y ruteo)
- **MongoDB** y **Mongoose** (Base de datos y modelado de datos)
- **Passport.js** (`passport-local` y `passport-jwt`) + **Cookie-Parser** + **JWT** + **Bcrypt**
- **Dotenv** (Variables de entorno)

### Arquitectura en Capas
- **`src/routes/`**: Definición de endpoints y aplicación de middlewares de autenticación y autorización.
- **`src/controllers/`**: Manejo exclusivo de `req` y `res` (códigos de estado HTTP y formato de respuesta).
- **`src/services/`**: Lógica y validaciones de negocio (fechas, capacidades, precios, transiciones de estado, filtros y paginación).
- **`src/repositories/`**: Acceso a datos (consultas Mongoose desacopladas de la lógica de negocio).
- **`src/models/`**: Esquemas de Mongoose (`Users`, `Events`, `Tickets`).

---

## 🔐 Estrategias de Autenticación Implementadas

El sistema de autenticación está delegado a **Passport.js** (`src/config/passport.config.js`):

1. **`register` (LocalStrategy)**: Valida campos obligatorios (`first_name`, `last_name`, `email`, `password`), formato de email, longitud mínima de contraseña, unicidad del correo, hashea la contraseña con Bcrypt y asigna siempre el rol por defecto **`user`** (impidiendo crear `admin` u `organizer` desde el body).
2. **`login` (LocalStrategy)**: Verifica las credenciales del usuario y emite un JWT dentro de una cookie firmada y `httpOnly`.
3. **`current` (JWTStrategy)**: Extrae el token JWT desde la cookie firmada mediante `cookieExtractor`, valida su vigencia y carga al usuario en `req.user`.

> **💡 Preparado para Providers Externos (Google / GitHub):** Gracias a la arquitectura modular en `src/config/passport.config.js`, el sistema está **listo para integrar proveedores OAuth externos (Google/GitHub)** sin necesidad de tocar ni modificar `app.js`.

---

## 🛡️ Autorización: Roles y Matriz de Permisos

El modelo `Users` (`src/models/user.model.js`) define tres roles: **`user`** (por defecto), **`organizer`** y **`admin`**.

| Acción / Recurso | Endpoint | Público | `user` | `organizer` | `admin` |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Sesiones** | | | | | |
| Registro e inicio de sesión | `POST /api/sessions/register` / `login` | ✅ | ✅ | ✅ | ✅ |
| Ver sesión actual | `GET /api/sessions/current` | ❌ (`401`) | ✅ | ✅ | ✅ |
| Cerrar sesión | `DELETE /api/sessions/logout` | ✅ | ✅ | ✅ | ✅ |
| **Eventos** | | | | | |
| Listar eventos (con filtros y paginación) | `GET /api/events` | ✅ | ✅ | ✅ | ✅ |
| Consultar evento por ID | `GET /api/events/:id` | ✅ | ✅ | ✅ | ✅ |
| Crear evento | `POST /api/events` | ❌ (`401`) | ❌ (`403`) | ✅ | ✅ |
| Modificar evento propio | `PUT /api/events/:id` | ❌ (`401`) | ❌ (`403`) | ✅ *(solo propio)* | ✅ |
| Modificar evento ajeno | `PUT /api/events/:id` | ❌ (`401`) | ❌ (`403`) | ❌ (`403`) | ✅ |
| Cambiar estado / cancelar evento | `PATCH /api/events/:id/status` | ❌ (`401`) | ❌ (`403`) | ✅ *(solo propio)* | ✅ *(cualquiera)* |
| **Tickets** | | | | | |
| Consultar tickets | `GET /api/tickets` y `GET /api/tickets/:tid` | ❌ (`401`) | ✅ | ✅ | ✅ |
| Comprar ticket de un evento | `POST /api/tickets/:uid/:eid` | ❌ (`401`) | ✅ | ⚠️ *(No de su propio evento -> `403`)* | ⚠️ *(No de su propio evento -> `403`)* |
| **Usuarios (Administración)** | | | | | |
| Ver / buscar / actualizar usuarios | `GET` / `PUT /api/users` | ❌ (`401`) | ❌ (`403`) | ❌ (`403`) | ✅ |

---

## 🚨 Diferencia Explícita entre `401 Unauthorized` y `403 Forbidden`

| Código HTTP | Significado | ¿Cuándo ocurre en el sistema? | Middleware y Respuesta JSON |
| :--- | :--- | :--- | :--- |
| **`401 Unauthorized`** *(Sin sesión / No autenticado)* | **"No sé quién sos"**. El cliente intenta acceder a una ruta protegida sin una sesión válida. | • No se envió la cookie con el JWT.<br>• El token JWT expiró o su firma es inválida.<br>• El usuario del token no existe. | **`authMiddleware`** (`src/middlewares/auth.middleware.js`):<br>`{ "status": "error", "message": "No autenticado" }` |
| **`403 Forbidden`** *(Sin permiso / No autorizado)* | **"Sé quién sos, pero no tenés permiso"**. El cliente tiene sesión válida (`req.user`), pero su rol o la propiedad del recurso no le permiten realizar la acción. | • Un `user` intenta crear o editar un evento.<br>• Un `organizer` intenta modificar un evento ajeno.<br>• Un `user` u `organizer` intenta acceder a `/api/users`. | **`rolesPermition`**, **`ensureEventOwnerOrAdmin`** y **`ticketPermition`** (`src/middlewares/authorize.middleware.js`):<br>`{ "status": "error", "message": "No tenés permisos para realizar esta acción" }` |

---

## 📅 Entidad `Events` y Reglas de Negocio

### Modelo `Event` (`src/models/event.model.js`)
- `title`, `description`, `category`, `location`: `String` (obligatorios).
- `date`: `Date` (obligatorio).
- `capacity`: `Number` (obligatorio, `> 0`).
- `price`: `Number` (obligatorio, `>= 0`).
- `status`: `String`, valores permitidos: `draft`, `published`, `cancelled`, `finished` (por defecto `draft`).
- `organizer`: `ObjectId` con referencia (`ref: "Users"`) al usuario creador.

### Reglas de Negocio (en `src/services/event.services.js`)
1. **Asignación automática de `organizer`**: Al crear un evento, `organizer` se toma siempre de `req.user._id`, ignorando cualquier valor enviado en el `body`.
2. **Validación de fecha futura**: No se permite crear ni actualizar un evento con una fecha pasada (`date <= ahora`).
3. **Validación de capacidad y precio**: Se rechaza cualquier evento con `capacity <= 0` o `price < 0`.
4. **Inmutabilidad de eventos cancelados**: Un evento en estado `cancelled` **no puede modificarse ni volver a cambiar de estado**.
5. **Restricción de publicación**: No se permite pasar a `published` un evento que ya esté `finished` o `cancelled`.
6. **Cancelación por baja lógica**: Los eventos no se eliminan físicamente de la base de datos; cancelar un evento consiste en cambiar su `status` a `cancelled` mediante `PATCH /api/events/:id/status` (o `DELETE /api/events/:id`).

---

## 🛣️ Endpoints de Eventos (`/api/events`)

### 1. Listar eventos con filtros, paginación y ordenamiento
- **Ruta:** `GET /api/events` *(Público)*
- **Query params disponibles:**
  - `status`: Filtra por estado (`draft`, `published`, `cancelled`, `finished`).
  - `category`: Filtra por categoría (insensible a mayúsculas/minúsculas).
  - `location`: Filtra por coincidencia en ubicación.
  - `dateFrom` y `dateTo`: Filtra por rango de fechas (`ISO 8601`, ej. `2026-11-01`).
  - `page`: Número de página (por defecto `1`).
  - `limit`: Cantidad de resultados por página (por defecto `10`).
  - `sort`: Campo de ordenamiento (ej. `sort=date`, `sort=-date`, `sort=date:desc`, `sort=price`).
- **Ejemplo:** `GET /api/events?status=published&category=workshop&page=2&limit=5&sort=date`
- **Respuesta (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": [...],
    "page": 2,
    "limit": 5,
    "total": 12,
    "totalPages": 3
  }
  ```

### 2. Obtener detalle de un evento
- **Ruta:** `GET /api/events/:id` *(Público)*
- Retorna `200 OK` con el evento o `404 Not Found` si el ID no existe o es inválido.

### 3. Crear un evento
- **Ruta:** `POST /api/events` *(Protegida: solo `organizer` o `admin`)*
- Asigna automáticamente `organizer: req.user._id` y valida fecha futura, `capacity > 0` y `price >= 0`.

### 4. Modificar un evento
- **Ruta:** `PUT /api/events/:id` *(Protegida: dueño del evento o `admin`)*
- Rechaza con `403` si un `organizer` intenta modificar un evento ajeno, y con `400` si el evento ya está `cancelled`.

### 5. Cambiar estado / Cancelar un evento
- **Ruta:** `PATCH /api/events/:id/status` *(Protegida: dueño del evento o `admin`)*
- **Body:** `{ "status": "published" | "cancelled" | "finished" | "draft" }`
- No permite modificar un evento ya `cancelled` ni publicar un evento `finished` o `cancelled`.

---

## ⚙️ Variables de Entorno e Instalación

1. Clonar el repositorio e instalar dependencias:
   ```bash
   npm install
   ```
2. Crear un archivo `.env` en la raíz basado en `.env.example`:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/95160
   COOKIE_SECRET=elsecretodecookies
   JWT_SECRET=elsecretodelajwt
   ```
3. Ejecutar el servidor:
   - **Modo Desarrollo:** `npm run dev`
   - **Modo Producción:** `npm start`

---
**Autor:** José Agustín Cordero
