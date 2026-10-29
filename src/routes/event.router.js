import { Router } from "express";
import { getAll, createEvent, getById, updateEvent, deleteEvent } from "../controllers/event.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { rolesPermition, ensureEventOwnerOrAdmin } from "../middlewares/authorize.middleware.js";

const router = Router();

// Todas las rutas de eventos requieren sesión válida (401 si no hay sesión)
router.use(authMiddleware);

// Consultar eventos: permitido para user, organizer y admin
router.get("/", getAll);
router.get("/:eid", getById);

// Crear evento: solo organizer o admin (403 si es user)
router.post("/", rolesPermition(["organizer", "admin"]), createEvent);

// Modificar o eliminar evento: solo organizer (dueño del evento) o admin (cualquier evento)
router.put("/:eid", rolesPermition(["organizer", "admin"]), ensureEventOwnerOrAdmin, updateEvent);
router.delete("/:eid", rolesPermition(["organizer", "admin"]), ensureEventOwnerOrAdmin, deleteEvent);

export default router;
