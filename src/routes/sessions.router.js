import { Router } from "express";
import { registerController, loginController, logoutController,  currentController } from "../controllers/sessions.controller.js";
import passport from "passport";

const router = Router();

router.post("/register", passport.authenticate("register", { session: false }), registerController);
router.post("/login", passport.authenticate("login", { session: false }), loginController);

router.get("/current", passport.authenticate("current", { session: false }), currentController);

router.delete("/logout", logoutController);

export default router;
