import crypto from "crypto";
import { Types } from "mongoose";
import { ticketRepository } from "../repositories/ticket.repository.js";
import { eventRepository } from "../repositories/event.repository.js";
import { sendTicketConfirmationEmail } from "../utils/mailer.js";

function createHttpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

export class TicketService {
    async createTicket({ eventId, user, quantity = 1 }) {
        // 1. Validar que el evento exista
        if (!Types.ObjectId.isValid(eventId)) {
            throw createHttpError(404, "Evento no encontrado");
        }

        const event = await eventRepository.findById(eventId);
        if (!event) {
            throw createHttpError(404, "Evento no encontrado");
        }

        
        if (event.status === "cancelled") {
            throw createHttpError(400, "No es posible inscribirse a un evento cancelado");
        }

        if (event.status === "finished") {
            throw createHttpError(400, "No es posible inscribirse a un evento finalizado");
        }

        if (event.status !== "published") {
            throw createHttpError(400, "Solo es posible inscribirse a eventos en estado 'published'");
        }

        
        if (event.organizer && event.organizer.toString() === user._id.toString()) {
            throw createHttpError(403, "No podés inscribirte a tu propio evento");
        }

        
        const parsedQuantity = Number(quantity);
        if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
            throw createHttpError(400, "La cantidad de entradas (quantity) debe ser un entero mayor a 0");
        }

        
        const existingActiveTicket = await ticketRepository.findActiveByUserAndEvent(
            user._id,
            eventId
        );
        if (existingActiveTicket) {
            throw createHttpError(400, "Ya tenés una inscripción activa para este evento");
        }

        
        const occupiedSeats = await ticketRepository.getOccupiedSeatsByEvent(eventId);
        const availableSeats = event.capacity - occupiedSeats;

        if (availableSeats < parsedQuantity) {
            throw createHttpError(
                400,
                `No hay cupos suficientes disponibles. Cupos disponibles: ${availableSeats}, solicitados: ${parsedQuantity}`
            );
        }

        
        const reservationCode = `RES-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

        const newTicket = await ticketRepository.create({
            user: user._id,
            event: event._id,
            status: "confirmed",
            quantity: parsedQuantity,
            reservationCode
        });

        
        let emailSent = false;
        try {
            emailSent = await sendTicketConfirmationEmail({
                user,
                event,
                ticket: newTicket
            });
        } catch (mailError) {
            console.error("[Mailer Error] No se pudo enviar el email de confirmación:", mailError.message);
        }

        return {
            ticket: newTicket,
            availableSeatsAfterBooking: availableSeats - parsedQuantity,
            emailSent
        };
    }

    async getMyTickets(user) {
        return await ticketRepository.findByUser(user._id);
    }

    async getTicketsByEvent(eventId) {
        if (!Types.ObjectId.isValid(eventId)) {
            throw createHttpError(404, "Evento no encontrado");
        }

        const event = await eventRepository.findById(eventId);
        if (!event) {
            throw createHttpError(404, "Evento no encontrado");
        }

        const [tickets, occupiedSeats] = await Promise.all([
            ticketRepository.findByEvent(eventId),
            ticketRepository.getOccupiedSeatsByEvent(eventId)
        ]);

        return {
            event: {
                id: event._id,
                title: event.title,
                capacity: event.capacity,
                occupiedSeats,
                availableSeats: event.capacity - occupiedSeats
            },
            tickets
        };
    }

    async cancelTicket(tid, user) {
        if (!Types.ObjectId.isValid(tid)) {
            throw createHttpError(404, "Ticket no encontrado");
        }

        const ticket = await ticketRepository.findById(tid);
        if (!ticket) {
            throw createHttpError(404, "Ticket no encontrado");
        }

        
        if (user.role !== "admin" && ticket.user.toString() !== user._id.toString()) {
            throw createHttpError(403, "No tenés permisos para cancelar un ticket ajeno");
        }

       
        if (ticket.status === "cancelled") {
            throw createHttpError(400, "El ticket ya se encuentra cancelado");
        }

        
        const cancelledTicket = await ticketRepository.cancelById(tid);
        return cancelledTicket;
    }
}

export const ticketService = new TicketService();

