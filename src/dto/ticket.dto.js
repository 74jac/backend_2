import { UserDTO } from "./user.dto.js";

export class TicketDTO {
    constructor(ticket) {
        this.id = ticket._id || ticket.id;
        this.reservationCode = ticket.reservationCode;
        this.status = ticket.status;
        this.quantity = ticket.quantity;

        
        if (ticket.user && typeof ticket.user === "object" && ticket.user.email) {
            this.user = UserDTO.fromUser(ticket.user);
        } else {
            this.user = ticket.user;
        }

        
        if (ticket.event && typeof ticket.event === "object" && ticket.event.title) {
            this.event = {
                id: ticket.event._id || ticket.event.id,
                title: ticket.event.title,
                date: ticket.event.date,
                location: ticket.event.location,
                price: ticket.event.price,
                status: ticket.event.status
            };
        } else {
            this.event = ticket.event;
        }

        this.createdAt = ticket.createdAt;
        this.cancelledAt = ticket.cancelledAt || null;
    }

    static fromTicket(ticket) {
        if (!ticket) return null;
        return new TicketDTO(ticket);
    }

    static fromTickets(tickets = []) {
        return tickets.map((t) => new TicketDTO(t));
    }
}

