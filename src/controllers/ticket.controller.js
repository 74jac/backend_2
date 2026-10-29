import { ticketService } from "../services/ticket.services.js";


export async function createTicket(req, res, next) {
    try {
        const eventId = req.params.eid || req.params.id;
        const { quantity = 1 } = req.body || {};

        const result = await ticketService.createTicket({
            eventId,
            user: req.user,
            quantity
        });

        res.status(201).json({
            status: "success",
            message: "Inscripción confirmada con éxito",
            payload: result.ticket,
            availableSeatsAfterBooking: result.availableSeatsAfterBooking,
            emailSent: result.emailSent
        });
    } catch (error) {
        next(error);
    }
}


export async function getMyTickets(req, res, next) {
    try {
        const tickets = await ticketService.getMyTickets(req.user);
        res.status(200).json({
            status: "success",
            payload: tickets
        });
    } catch (error) {
        next(error);
    }
}


export async function getEventTickets(req, res, next) {
    try {
        const eventId = req.params.eid || req.params.id;
        const result = await ticketService.getTicketsByEvent(eventId);
        res.status(200).json({
            status: "success",
            ...result
        });
    } catch (error) {
        next(error);
    }
}


export async function cancelTicket(req, res, next) {
    try {
        const { tid } = req.params;
        const cancelledTicket = await ticketService.cancelTicket(tid, req.user);
        res.status(200).json({
            status: "success",
            message: "Ticket cancelado con éxito. El cupo ha sido liberado.",
            payload: cancelledTicket
        });
    } catch (error) {
        next(error);
    }
}
