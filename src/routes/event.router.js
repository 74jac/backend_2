import { Router } from "express";
import {
    getAll,
    createEvent,
    getById,
    updateEvent,
    updateEventStatus,
    deleteEvent
} from "../controllers/event.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { rolesPermition, ensureEventOwnerOrAdmin } from "../middlewares/authorize.middleware.js";

const router = Router();


router.get("/", getAll);
router.get("/:id", getById);


router.post("/", authMiddleware, rolesPermition(["organizer", "admin"]), createEvent);


router.put(
    "/:id",
    authMiddleware,
    rolesPermition(["organizer", "admin"]),
    ensureEventOwnerOrAdmin,
    updateEvent
);

router.patch(
    "/:id/status",
    authMiddleware,
    rolesPermition(["organizer", "admin"]),
    ensureEventOwnerOrAdmin,
    updateEventStatus
);


router.delete(
    "/:id",
    authMiddleware,
    rolesPermition(["organizer", "admin"]),
    ensureEventOwnerOrAdmin,
    deleteEvent
);

export default router;
