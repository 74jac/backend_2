import express from "express";
import rootRouter from "./routes/root.router.js";
import { connectDB } from "./config/db.js";
import userRouter from "./routes/user.router.js"
import eventRouter from "./routes/event.router.js"
import ticketRouter from "./routes/ticket.router.js"
import sessionRouter from "./routes/sessions.router.js"
import { env } from "./config/env.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));

app.use("/", rootRouter);
app.use("/api/users", userRouter);
app.use("/api/event", eventRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/sessions", sessionRouter);

// Manejo de errores globales (ej: JSON mal formado)
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ status: "error", message: "Formato de JSON inválido en la petición" });
    }
    next();
});

app.listen(env.PORT, () => {
    console.log("sever en el puerto " + env.PORT);
 connectDB()
    .then (() => console.log("concetado a DB"))
    .catch (e => console.log(e));   
});


