# Backend II - Proyecto Final (Plataforma de Eventos e Inscripciones)

Este es el proyecto backend del curso Backend II de CoderHouse. Consiste en una API RESTful para una **Plataforma de Eventos e Inscripciones** desarrollada en Node.js y Express, con base de datos en MongoDB, diseñada con arquitectura en capas (`routes` → `controllers` → `services` → `repositories` → `models`), autenticación con Passport + JWT en cookies firmadas, autorización por roles y propiedad de recursos, gestión de eventos, control de cupos e inscripciones con notificaciones por email mediante **Nodemailer**.

---

## 🛠 Tecnologías y Arquitectura

- **Node.js** y **Express.js** (Servidor web y ruteo)
- **MongoDB** y **Mongoose** (Base de datos y modelado de datos)
- **Passport.js** (`passport-local` y `passport-jwt`) + **Cookie-Parser** + **JWT** + **Bcrypt**
- **Nodemailer** (Envío de notificaciones por correo electrónico al confirmar una inscripción)
- **Dotenv** (Variables de entorno)

### Arquitectura en Capas
- **`src/routes/`**: Definición de endpoints y aplicación de middlewares de autenticación y autorización.
- **`src/controllers/`**: Manejo exclusivo de `req` y `res` (códigos de estado HTTP y formato de respuesta).
- **`src/services/`**: Lógica y validaciones de negocio (fechas, capacidades, precios, control de cupos, duplicados, estados y envío de emails).
- **`src/repositories/`**: Acceso a datos (consultas Mongoose y agregaciones desacopladas de la lógica de negocio).
- **`src/models/`**: Esquemas de Mongoose (`Users`, `Events`, `Tickets`) basados únicamente en referencias `ObjectId`.

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
| **Tickets e Inscripciones** | | | | | |
| Inscribirse a un evento | `POST /api/events/:eid/tickets` | ❌ (`401`) | ✅ | ✅ *(no al propio -> `403`)* | ✅ *(no al propio -> `403`)* |
| Ver mis tickets | `GET /api/tickets/my-tickets` | ❌ (`401`) | ✅ *(propios)* | ✅ *(propios)* | ✅ *(propios)* |
| Ver inscriptos de un evento | `GET /api/events/:eid/tickets` | ❌ (`401`) | ❌ (`403`) | ✅ *(solo evento propio)* | ✅ *(cualquiera)* |
| Cancelar un ticket | `PATCH /api/tickets/:tid/cancel` | ❌ (`401`) | ✅ *(solo propio)* | ✅ *(solo propio)* | ✅ *(cualquiera)* |
| **Usuarios (Administración)** | | | | | |
| Ver / buscar / actualizar usuarios | `GET` / `PUT /api/users` | ❌ (`401`) | ❌ (`403`) | ❌ (`403`) | ✅ |

---

## 🚨 Diferencia Explícita entre `401 Unauthorized` y `403 Forbidden`

| Código HTTP | Significado | ¿Cuándo ocurre en el sistema? | Middleware y Respuesta JSON |
| :--- | :--- | :--- | :--- |
| **`401 Unauthorized`** *(Sin sesión / No autenticado)* | **"No sé quién sos"**. El cliente intenta acceder a una ruta protegida sin una sesión válida. | • No se envió la cookie con el JWT.<br>• El token JWT expiró o su firma es inválida.<br>• El usuario del token no existe. | **`authMiddleware`** (`src/middlewares/auth.middleware.js`):<br>`{ "status": "error", "message": "No autenticado" }` |
| **`403 Forbidden`** *(Sin permiso / No autorizado)* | **"Sé quién sos, pero no tenés permiso"**. El cliente tiene sesión válida (`req.user`), pero su rol o la propiedad del recurso no le permiten realizar la acción. | • Un `user` intenta crear un evento o ver inscriptos de un evento.<br>• Un `organizer` intenta modificar o ver tickets de un evento ajeno.<br>• Un usuario intenta cancelar un ticket ajeno. | **`rolesPermition`** y **`ensureEventOwnerOrAdmin`** (`src/middlewares/authorize.middleware.js`):<br>`{ "status": "error", "message": "No tenés permisos para realizar esta acción" }` |

---

## 📅 Entidad `Events` y Reglas de Negocio

### Modelo `Event` (`src/models/event.model.js`)
- `title`, `description`, `category`, `location`: `String` (obligatorios).
- `date`: `Date` (obligatorio).
- `capacity`: `Number` (`> 0`).
- `price`: `Number` (`>= 0`).
- `status`: `draft`, `published`, `cancelled`, `finished` (por defecto `draft`).
- `organizer`: `ObjectId` (`ref: "Users"`).

### Endpoints de Eventos (`/api/events`)
- **`GET /api/events`** *(Público)*: Listado con filtros (`status`, `category`, `location`, `dateFrom`, `dateTo`), paginación (`page`, `limit`) y ordenamiento (`sort=date`, `sort=-date`, `sort=price`). Devuelve `{ data, page, limit, total, totalPages }`.
- **`GET /api/events/:id`** *(Público)*: Detalle de un evento (`404` si no existe).
- **`POST /api/events`** *(`organizer`, `admin`)*: Crea evento asignando automáticamente `organizer: req.user._id`, validando fecha futura, `capacity > 0` y `price >= 0`.
- **`PUT /api/events/:id`** *(Dueño del evento o `admin`)*: Actualiza un evento (prohibido si ya está `cancelled`).
- **`PATCH /api/events/:id/status`** *(Dueño del evento o `admin`)*: Cambia el estado o cancela el evento (baja lógica a `cancelled` sin eliminar físicamente). Prohibido publicar eventos `finished` o `cancelled`.

---

## 🎟️ Entidad `Tickets`, Flujo de Inscripción y Control de Cupos

### Modelo `Ticket` (`src/models/ticket.model.js`)
- `user`: `ObjectId` (`ref: "Users"`), solo referencia (sin objetos embebidos).
- `event`: `ObjectId` (`ref: "Events"`), solo referencia (sin objetos embebidos).
- `status`: `confirmed`, `pending`, `cancelled` (por defecto `confirmed`).
- `quantity`: `Number` (`> 0`, por defecto `1`).
- `reservationCode`: `String` único autogenerado (`RES-XXXXXXXX`).
- `createdAt`: Fecha de creación (`timestamps: true`).
- `cancelledAt`: Fecha de cancelación (`null` mientras está activo).

### Flujo de Inscripción y Regla de Cupos (`src/services/ticket.services.js`)
1. **Validación del evento**: Verifica que el evento exista (`404` si no existe) y que su estado sea **`published`** (rechaza eventos `draft`, `cancelled` o `finished`).
2. **Validación de cantidad**: Verifica que `quantity` sea un entero `> 0`.
3. **Prevención de duplicados**: Verifica que el usuario no tenga ya un ticket activo (`confirmed` o `pending`) para el mismo evento.
4. **Cálculo dinámico de cupos disponibles**:
   - Se suman las cantidades (`quantity`) únicamente de los tickets con estado activo (`confirmed` o `pending`).
   - **Los tickets `cancelled` no ocupan cupo**.
   - Se verifica que `event.capacity - occupiedSeats >= quantity`.
5. **Confirmación y notificación por email**: Se guarda el ticket con código `reservationCode` único y se envía un correo de confirmación al usuario mediante **Nodemailer** (`src/utils/mailer.js`).
6. **Cancelación y liberación de cupo (`PATCH /api/tickets/:tid/cancel`)**:
   - Valida que el ticket exista, que pertenezca al usuario solicitante (o sea `admin`) y que no esté ya cancelado.
   - Cambia `status` a `"cancelled"` y registra `cancelledAt` (sin eliminar el documento de la base de datos).
   - Al pasar a `"cancelled"`, el cupo queda **disponible automáticamente** para nuevas inscripciones.

### Endpoints de Tickets
- **`POST /api/events/:eid/tickets`** *(Autenticado)*: Inscribe al usuario en el evento `:eid` (recibe `{ "quantity": 1 }` opcional en el body) y envía el email de confirmación.
- **`GET /api/tickets/my-tickets`** *(Autenticado)*: Lista los tickets del usuario actual incluyendo `title`, `date` y `location` del evento vía `populate`, sin exponer datos de otros usuarios.
- **`GET /api/events/:eid/tickets`** *(`organizer` dueño del evento o `admin`)*: Lista todas las inscripciones del evento `:eid` junto con el resumen de cupos (`capacity`, `occupiedSeats`, `availableSeats`).
- **`PATCH /api/tickets/:tid/cancel`** *(Dueño del ticket o `admin`)*: Cancela el ticket registrando `cancelledAt` y liberando el cupo.

---

## ⚙️ Variables de Entorno e Instalación

1. Clonar el repositorio e instalar dependencias:
   ```bash
   npm install
   ```
2. Crear un archivo `.env` en la raíz guiándose por `.env.example` (nunca hardcodear credenciales en el código):
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/95160
   COOKIE_SECRET=tu_secreto_de_cookies
   JWT_SECRET=tu_secreto_de_jwt
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USER=tu_correo@gmail.com
   MAIL_PASS=tu_app_password
   MAIL_FROM="Plataforma de Eventos <tu_correo@gmail.com>"
   ```
3. Ejecutar el servidor:
   - **Modo Desarrollo:** `npm run dev`
   - **Modo Producción:** `npm start`

---
**Autor:** José Agustín Cordero
