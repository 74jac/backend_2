import { Router } from "express";
import { getAll, createEvent, getById, updateEvent, deleteEvent } from "../controllers/event.controller.js";
import passport from "passport";
import { rolesPermition } from "../middlewares/session.middleware.js";

const router = Router();

router.use(passport.authenticate("current", { session: false }));

router.get ("/",  getAll);
router.get ("/:eid", getById);

router.use(rolesPermition(["organizer", "admin"]));
//usar validacion de fecha para que no se pueda crear un evento con fecha pasada
//vaidación de organizador no pueda editar o eliminar un evento que no sea suyo


router.post ("/", createEvent);
router.put ("/:eid", updateEvent);
router.delete ("/:eid", deleteEvent);


export default router;
