# Backend II - Proyecto Final (Plataforma de Eventos e Inscripciones)

Este es el proyecto backend del curso Backend II de CoderHouse. Consiste en una API RESTful para una **Plataforma de Eventos e Inscripciones** desarrollada en Node.js y Express, con base de datos en MongoDB, estructurada bajo una **arquitectura profesional en capas (`Routes` → `Controllers` → `Services` → `Repositories` → `DAOs` → `Models`) + `DTOs`**, autenticación con Passport + JWT en cookies firmadas, autorización por roles y propiedad de recursos, gestión de eventos, control de cupos e inscripciones con notificaciones por email mediante **Nodemailer**.

---

## 🏗️ Arquitectura en Capas (DAO, Repository, Service, Controller y DTO)

El proyecto separa estrictamente las responsabilidades en capas formales:

```text
src/
├── config/          # Configuración de DB, variables de entorno y estrategias Passport
├── routes/          # Definición de endpoints y aplicación de middlewares
├── middlewares/     # Autenticación (401), autorización por roles/propiedad (403) y errores globales
├── controllers/     # Coordinación exclusiva de request/response (sin lógica de negocio ni modelos)
├── services/        # Lógica de negocio (cupos, estados, duplicados, fechas, envío de emails)
├── repositories/    # Métodos orientados al dominio consumiendo DAOs (sin importar modelos Mongoose)
├── dao/             # Única capa que importa y consulta los modelos de Mongoose directamente
├── dto/             # Transformación y filtrado de respuestas (oculta password y filtra populates)
├── models/          # Esquemas de Mongoose (Users, Events, Tickets)
└── utils/           # Utilidades transversales (JWT, Bcrypt, Nodemailer)
```

### Responsabilidad de cada capa
1. **DAO (`src/dao/user.dao.js`, `event.dao.js`, `ticket.dao.js`)**:
   - **Son los únicos archivos del proyecto que importan los modelos de Mongoose directamente** (`userModel`, `eventModel`, `ticketModel`).
   - Exponen métodos puros de acceso a datos (`find`, `findOne`, `findById`, `create`, `updateById`, `count`, `sumOccupiedSeatsByEvent`).
2. **Repository (`src/repositories/user.repository.js`, `event.repository.js`, `ticket.repository.js`)**:
   - Consumen el DAO correspondiente sin acoplarse a los modelos de Mongoose.
   - Exponen métodos orientados al dominio (`findByEmail`, `findPublishedEvents`, `countActiveTickets`, `cancelTicket`, etc.).
3. **Services (`src/services/user.services.js`, `sessions.services.js`, `event.services.js`, `ticket.services.js`)**:
   - Consumen únicamente Repositories y DTOs (nunca DAOs ni modelos).
   - Concentran toda la lógica de negocio: validación de fechas, capacidades, precios, cupos disponibles, prevención de inscripciones duplicadas, inmutabilidad de eventos/tickets cancelados y disparo de emails con Nodemailer.
4. **Controllers (`src/controllers/`)**:
   - Solo extraen datos de `req.body`, `req.params` y `req.query`, invocan al Service correspondiente y devuelven la respuesta HTTP o delegan el error a `next(error)`.
5. **DTO (`src/dto/user.dto.js`, `event.dto.js`, `ticket.dto.js`)**:
   - Filtran y dan forma a los datos salientes de usuario autenticado (`UserDTO`), eventos (`EventDTO`) y tickets (`TicketDTO`).
   - **Garantizan que ninguna respuesta exponga el campo `password`** (ni siquiera hasheado), incluyendo cuando se utiliza `.populate()` sobre `user`, `organizer` o `event`.
6. **Manejo Centralizado de Errores (`src/middlewares/error.middleware.js`)**:
   - Unifica todas las respuestas de error bajo el formato `{ "status": "error", "message": "..." }` y distingue explícitamente:
     - **`400 Bad Request`**: Datos de entrada inválidos (ej. fecha pasada al crear, `capacity <= 0`, `price < 0`, JSON mal formado).
     - **`401 Unauthorized`**: Sin sesión activa o token JWT inválido/expirado.
     - **`403 Forbidden`**: Sesión válida pero sin permisos de rol o intentando operar sobre un recurso ajeno.
     - **`404 Not Found`**: Recurso inexistente (evento, ticket o usuario no encontrado).
     - **`409 Conflict`**: Conflicto con el estado actual del recurso (ej. inscripción activa duplicada, sin cupos disponibles, intento de modificar un evento o ticket ya cancelado, email ya registrado).
     - **`500 Internal Server Error`**: Error inesperado del servidor.

---

## 🔐 Estrategias de Autenticación Implementadas

El sistema de autenticación está delegado a **Passport.js** (`src/config/passport.config.js`):

1. **`register` (LocalStrategy)**: Valida campos obligatorios (`first_name`, `last_name`, `email`, `password`), formato de email, longitud mínima de contraseña, unicidad del correo mediante `UserRepository`, hashea la contraseña con Bcrypt y asigna siempre el rol por defecto **`user`**.
2. **`login` (LocalStrategy)**: Verifica las credenciales del usuario y emite un JWT dentro de una cookie firmada y `httpOnly`.
3. **`current` (JWTStrategy)**: Extrae el token JWT desde la cookie firmada mediante `cookieExtractor`, valida su vigencia y carga al usuario en `req.user`. La respuesta pasa por `UserDTO` para no exponer jamás `password`.

> **💡 Preparado para Providers Externos (Google / GitHub):** Gracias a la arquitectura modular en `src/config/passport.config.js`, el sistema está **listo para integrar proveedores OAuth externos (Google/GitHub)** sin necesidad de tocar ni modificar `app.js`.

---

## 🛡️ Autorización: Roles y Matriz de Permisos

El modelo `Users` (`src/models/user.model.js`) define tres roles: **`user`** (por defecto), **`organizer`** y **`admin`**.

| Acción / Recurso | Endpoint | Público | `user` | `organizer` | `admin` |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Sesiones** | | | | | |
| Registro e inicio de sesión | `POST /api/sessions/register` / `login` | ✅ | ✅ | ✅ | ✅ |
| Ver sesión actual (DTO sin password) | `GET /api/sessions/current` | ❌ (`401`) | ✅ | ✅ | ✅ |
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

## 📅 Entidad `Events` y Reglas de Negocio

- **`GET /api/events`** *(Público)*: Soporta filtros (`status`, `category`, `location`, `dateFrom`, `dateTo`), paginación (`page`, `limit`) y ordenamiento (`sort=date`, `sort=-date`, `sort=price`). Devuelve `{ data, page, limit, total, totalPages }` con cada evento transformado por `EventDTO`.
- **`GET /api/events/:id`** *(Público)*: Detalle de un evento (`404` si no existe).
- **`POST /api/events`** *(`organizer`, `admin`)*: Asigna automáticamente `organizer: req.user._id`, valida fecha futura, `capacity > 0` y `price >= 0`.
- **`PUT /api/events/:id`** *(Dueño del evento o `admin`)*: Actualiza un evento (rechaza con `409` si ya está `cancelled`).
- **`PATCH /api/events/:id/status`** *(Dueño del evento o `admin`)*: Cambia el estado o cancela el evento (baja lógica a `cancelled` sin eliminar físicamente).

---

## 🎟️ Entidad `Tickets`, Flujo de Inscripción y Control de Cupos

- **`POST /api/events/:eid/tickets`** *(Autenticado)*:
  - Valida que el evento exista (`404`), esté `published` (`409` si está `cancelled`/`finished`/`draft`), que `quantity > 0` (`400`), que el usuario no tenga ya un ticket activo para ese evento (`409`) y que haya cupos disponibles (`capacity - countActiveTickets >= quantity`, donde los `cancelled` no ocupan cupo).
  - Crea el ticket con `reservationCode` único, envía email de confirmación con **Nodemailer** (`src/utils/mailer.js`) y devuelve el resultado filtrado por `TicketDTO`.
- **`GET /api/tickets/my-tickets`** *(Autenticado)*: Lista los tickets del usuario actual poblando `title`, `date` y `location` del evento a través de `TicketDTO`.
- **`GET /api/events/:eid/tickets`** *(`organizer` dueño del evento o `admin`)*: Lista las inscripciones del evento filtrando los datos del usuario con `UserDTO` (sin exponer `password`).
- **`PATCH /api/tickets/:tid/cancel`** *(Dueño del ticket o `admin`)*: Cambia `status` a `cancelled`, registra `cancelledAt` y libera el cupo automáticamente.

---

## ⚙️ Variables de Entorno e Instalación

1. Clonar el repositorio e instalar dependencias:
   ```bash
   npm install
   ```
2. Crear un archivo `.env` en la raíz guiándose por `.env.example`:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/95160
   COOKIE_SECRET=tu_secreto_de_cookies
   JWT_SECRET=tu_secreto_de_jwt
   MAIL_HOST=smtp-mail.outlook.com
   MAIL_PORT=587
   MAIL_USER=tu_correo@outlook.com
   MAIL_PASS=tu_app_password
   MAIL_FROM="Plataforma de Eventos <tu_correo@outlook.com>"
   ```
3. Ejecutar el servidor:
   - **Modo Desarrollo:** `npm run dev`
   - **Modo Producción:** `npm start`

---
**Autor:** José Agustín Cordero
