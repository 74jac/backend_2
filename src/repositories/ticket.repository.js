import { ticketDAO } from "../dao/ticket.dao.js";

export class TicketRepository {
    async create(ticketData) {
        return await ticketDAO.create(ticketData);
    }

    async findById(id) {
        return await ticketDAO.findById(id);
    }

    async findActiveByUserAndEvent(userId, eventId) {
        return await ticketDAO.findOne({
            user: userId,
            event: eventId,
            status: { $in: ["confirmed", "pending"] }
        });
    }

    async countActiveTickets(eventId) {
        return await ticketDAO.sumOccupiedSeatsByEvent(eventId);
    }

    async getOccupiedSeatsByEvent(eventId) {
        return await this.countActiveTickets(eventId);
    }

    async findByUser(userId) {
        return await ticketDAO.findByUserPopulated(userId);
    }

    async findByEvent(eventId) {
        return await ticketDAO.findByEventPopulated(eventId);
    }

    async cancelTicket(id) {
        return await ticketDAO.updateById(id, {
            status: "cancelled",
            cancelledAt: new Date()
        });
    }

    async cancelById(id) {
        return await this.cancelTicket(id);
    }
}

export const ticketRepository = new TicketRepository();
