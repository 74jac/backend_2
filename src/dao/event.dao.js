import { eventModel } from "../models/event.model.js";

export class EventDAO {
    async find({ filter = {}, skip = 0, limit = 10, sort = { date: 1 } }) {
        return await eventModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);
    }

    async count(filter = {}) {
        return await eventModel.countDocuments(filter);
    }

    async findById(id) {
        return await eventModel.findById(id);
    }

    async create(eventData) {
        return await eventModel.create(eventData);
    }

    async updateById(id, updateData) {
        return await eventModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });
    }
}

export const eventDAO = new EventDAO();

