import { eventDAO } from "../dao/event.dao.js";

export class EventRepository {
    async findPaginated({ filter = {}, skip = 0, limit = 10, sort = { date: 1 } }) {
        return await eventDAO.find({ filter, skip, limit, sort });
    }

    async findPublishedEvents({ skip = 0, limit = 10, sort = { date: 1 } } = {}) {
        return await eventDAO.find({
            filter: { status: "published" },
            skip,
            limit,
            sort
        });
    }

    async count(filter = {}) {
        return await eventDAO.count(filter);
    }

    async findById(id) {
        return await eventDAO.findById(id);
    }

    async create(eventData) {
        return await eventDAO.create(eventData);
    }

    async updateById(id, updateData) {
        return await eventDAO.updateById(id, updateData);
    }
}

export const eventRepository = new EventRepository();
