import { Router } from "express";
import { getAll, getByEmail, updateUser } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { rolesPermition } from "../middlewares/authorize.middleware.js";

const router = Router();

// Rutas administrativas: requieren sesión (401) y rol admin (403)
router.use(authMiddleware, rolesPermition(["admin"]));

router.get("/", getAll);
router.get("/:email", getByEmail);
router.put("/:email", updateUser);

export default router;
