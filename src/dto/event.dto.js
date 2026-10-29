import { UserDTO } from "./user.dto.js";

export class EventDTO {
    constructor(event) {
        this.id = event._id || event.id;
        this.title = event.title;
        this.description = event.description;
        this.category = event.category;
        this.date = event.date;
        this.location = event.location;
        this.capacity = event.capacity;
        this.price = event.price;
        this.status = event.status;

        
        if (event.organizer && typeof event.organizer === "object" && event.organizer.email) {
            this.organizer = UserDTO.fromUser(event.organizer);
        } else {
            this.organizer = event.organizer;
        }

        if (event.createdAt) this.createdAt = event.createdAt;
        if (event.updatedAt) this.updatedAt = event.updatedAt;
    }

    static fromEvent(event) {
        if (!event) return null;
        return new EventDTO(event);
    }

    static fromEvents(events = []) {
        return events.map((e) => new EventDTO(e));
    }
}

