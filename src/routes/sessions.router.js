import { Router } from "express";
import { registerController, loginController, logoutController, currentController } from "../controllers/sessions.controller.js";
import { ensureSession } from "../middlewares/session.midlewars.js";
const router = Router();

router.post("/register", registerController);
router.post("/login", loginController);


router.get("/current", ensureSession, currentController);
router.delete("/logout", logoutController);
export default router;