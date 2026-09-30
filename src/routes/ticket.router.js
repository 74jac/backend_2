import { Router } from "express";
import { getAll, getById, purchaseTicket } from "../controllers/ticket.controller.js";
import passport from "passport";
import { ticketPermition } from "../middlewares/session.middleware.js";
const router = Router();

router.use(passport.authenticate("current", {session: false})); 


router.get ("/",  getAll);
router.get ("/:tid", getById);



router.post ("/:uid/:eid", ticketPermition, purchaseTicket);



export default router;
