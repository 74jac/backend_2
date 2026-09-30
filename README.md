# Backend II - Proyecto Final

Este es el proyecto backend del curso Backend II de CoderHouse. Consiste en una API RESTful desarrollada en Node.js y Express, con base de datos en MongoDB, enfocada en la implementación de un sistema de autenticación robusto, modular y escalable.

## 🛠 Tecnologías Utilizadas

- **Node.js** y **Express.js** (Servidor web y ruteo)
- **MongoDB** y **Mongoose** (Base de datos y modelado de datos)
- **Bcrypt** (Hasheo de contraseñas)
- **JSON Web Tokens (JWT)** y **Cookie-Parser** (Manejo de tokens de sesión)
- **Passport.js** (Core de estrategias de autenticación)
- **Dotenv** (Variables de entorno)

## 🔐 Estrategias Implementadas

El sistema de autenticación ha sido delegado a **Passport.js**, separando la lógica de negocio y logrando un código más limpio. Las estrategias locales y de token implementadas son:

1. **Register**: Se encarga de validar que todos los campos requeridos existan, que el email no esté en uso, de encriptar la contraseña del usuario (Bcrypt) y guardarlo en la base de datos MongoDB de forma segura.
2. **Login**: Verifica las credenciales del usuario (email y contraseña desencriptada comparada). Si son válidas, emite un JWT que viaja seguro hacia el cliente mediante una cookie firmada.
3. **Current**: Una estrategia/middleware que extrae el token JWT de las cookies firmadas, lo verifica y determina si el usuario tiene acceso a los recursos protegidos o si la sesión es inválida/expirada.

> **💡 Listo para Providers Externos:** Gracias a la arquitectura modular elegida y la configuración de passport.config.js, el sistema queda **totalmente preparado para la integración con providers externos (como Google o GitHub)**. Las nuevas estrategias (OAuth) se pueden agregar directamente en el archivo de configuración de Passport y en el router, **sin necesidad de tocar ni modificar app.js**, manteniendo limpio el punto de entrada principal.

## ⚙️ Variables de Entorno

Para que la aplicación funcione en tu entorno local, debes crear un archivo llamado .env en la raíz del proyecto. Este archivo debe contener las siguientes variables:

PORT=3000
MONGO_URI=mongodb://localhost:27017/95160
COOKIE_SECRET=elsecretodecookies
JWT_SECRET=elsecretodelajwt

## 🚀 Instalación y Ejecución

1. Clonar el repositorio.
2. Instalar las dependencias con el comando:
   npm install
3. Configurar el archivo .env como se detalla en el punto anterior.
4. Para ejecutar la aplicación:
   - **Modo Estándar**: npm start
   - **Modo Desarrollo** (auto-recarga con node --watch): npm run dev
5. La consola indicará si la conexión a la base de datos fue exitosa y en qué puerto corre el servidor.

## 🛣️ Rutas de Sesión (Endpoints)

Todas las rutas de autenticación comienzan con el prefijo /api/sessions/:

- **POST /api/sessions/register**  
  Registra un nuevo usuario en la base de datos. Requiere enviar firstName, lastName, email y password en el Body (JSON).
- **POST /api/sessions/login**  
  Inicia sesión validando email y password. Retorna al cliente una cookie firmada que contiene el JWT.
- **GET /api/sessions/current**  
  Ruta protegida que valida la existencia y vigencia del JWT. Si el token es válido, retorna la información desencriptada del usuario actual.
- **POST /api/sessions/logout**  
  Destruye la sesión del usuario eliminando la cookie de autorización.


---
**Autor:** José Agustín Cordero
