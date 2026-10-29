import { Router } from "express";
import { getAll, getById, purchaseTicket } from "../controllers/ticket.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { ticketPermition } from "../middlewares/authorize.middleware.js";

const router = Router();


router.use(authMiddleware);

router.get("/", getAll);
router.get("/:tid", getById);
router.post("/:uid/:eid", ticketPermition, purchaseTicket);

export default router;
