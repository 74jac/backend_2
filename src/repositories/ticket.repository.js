import { Types } from "mongoose";
import { ticketModel } from "../models/ticket.model.js";

export class TicketRepository {
    async create(ticketData) {
        return await ticketModel.create(ticketData);
    }

    async findById(id) {
        return await ticketModel.findById(id);
    }

    async findActiveByUserAndEvent(userId, eventId) {
        return await ticketModel.findOne({
            user: userId,
            event: eventId,
            status: { $in: ["confirmed", "pending"] }
        });
    }

    async getOccupiedSeatsByEvent(eventId) {
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

    async findByUser(userId) {
        return await ticketModel
            .find({ user: userId })
            .populate("event", "title date location price status")
            .sort({ createdAt: -1 });
    }

    async findByEvent(eventId) {
        return await ticketModel
            .find({ event: eventId })
            .populate("user", "first_name last_name email")
            .populate("event", "title date location capacity status")
            .sort({ createdAt: -1 });
    }

    async cancelById(id) {
        return await ticketModel.findByIdAndUpdate(
            id,
            {
                status: "cancelled",
                cancelledAt: new Date()
            },
            { new: true, runValidators: true }
        );
    }
}

export const ticketRepository = new TicketRepository();

