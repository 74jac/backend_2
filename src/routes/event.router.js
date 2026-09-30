import { Router } from "express";
import { getAll, createEvent, getById, updateEvent, deleteEvent } from "../controllers/event.controller.js";
import passport from "passport";
import { rolesPermition } from "../middlewares/session.middleware.js";

const router = Router();

router.use(passport.authenticate("current", { session: false }), rolesPermition );

router.get ("/",  getAll);
router.get ("/:eid", getById);

router.use(rolesPermition(["organizar", "admin"]));


router.post ("/", createEvent);
router.put ("/:eid", updateEvent);
router.delete ("/:eid", deleteEvent);


export default router;
