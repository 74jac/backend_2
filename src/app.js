import express from "express";
import rootRouter from "./routes/root.router.js";
import { connectDB } from "./config/db.js";
import userRouter from "./routes/user.router.js"
import eventRouter from "./routes/event.router.js"
import ticketRouter from "./routes/ticket.router.js"
import sessionRouter from "./routes/sessions.router.js"
import { env } from "./config/env.js";
import cookieParser from "cookie-parser";

// Inicialización de la passaport

import passport from "passport";
import "./config/passport.config.js"

const app = express();

app.use(express.json());
app.use(cookieParser(env.COOKIE_SECRET));
app.use(passport.initialize());

app.use("/", rootRouter);
app.use("/api/users", userRouter);
app.use("/api/event", eventRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/sessions", sessionRouter);

// Manejo de errores globales (ej: JSON mal formado)
app.listen(env.PORT, () => {
    console.log("Server en el puerto " + env.PORT);
    connectDB()
        .then(() => console.log("Conectado a DB"))
        .catch((e) => console.log(e));
});
