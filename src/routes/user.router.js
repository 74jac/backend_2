import { Router } from "express";
import { getAll, getByEmail, updateUser } from "../controllers/user.controller.js";
import passport from "passport";
import { rolesPermition } from "../middlewares/session.middleware.js";
const router = Router();

router.use(passport.authenticate("current", { session: false }), rolesPermition(["admin"]));

router.get ("/",  getAll);
router.get ("/:email", getByEmail);


router.put ("/:email", updateUser);



export default router;
