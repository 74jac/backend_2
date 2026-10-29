import { Types } from "mongoose";
import { ticketModel } from "../models/ticket.model.js";

export class TicketDAO {
    async create(ticketData) {
        return await ticketModel.create(ticketData);
    }

    async findById(id) {
        return await ticketModel.findById(id);
    }

    async findOne(filter = {}) {
        return await ticketModel.findOne(filter);
    }

    async findByUserPopulated(userId) {
        return await ticketModel
            .find({ user: userId })
            .populate("event", "title date location price status")
            .sort({ createdAt: -1 });
    }

    async findByEventPopulated(eventId) {
        return await ticketModel
            .find({ event: eventId })
            .populate("user", "first_name last_name email role")
            .populate("event", "title date location capacity price status")
            .sort({ createdAt: -1 });
    }

    async updateById(id, updateData) {
        return await ticketModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });
    }

    async sumOccupiedSeatsByEvent(eventId) {
        const result = await ticketModel.aggregate([
            {
                $match: {
                    event: new Types.ObjectId(eventId),
                    status: { $in: ["confirmed", "pending"] }
                }
            },
            {
                $group: {
                    _id: "$event",
                    occupiedSeats: { $sum: "$quantity" }
                }
            }
        ]);

        return result.length > 0 ? result[0].occupiedSeats : 0;
    }
}

export const ticketDAO = new TicketDAO();

