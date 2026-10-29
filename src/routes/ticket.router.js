import { Router } from "express";
import {
    createTicket,
    getMyTickets,
    cancelTicket
} from "../controllers/ticket.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();


router.use(authMiddleware);


router.get("/my-tickets", getMyTickets);


router.patch("/:tid/cancel", cancelTicket);


router.post("/:eid", createTicket);

export default router;
