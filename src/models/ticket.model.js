import { Schema, model, Types } from "mongoose";

const ticketSchema = new Schema(
    {
        user: {
            type: Types.ObjectId,
            ref: "Users",
            required: true
        },
        event: {
            type: Types.ObjectId,
            ref: "Events",
            required: true
        },
        status: {
            type: String,
            enum: ["confirmed", "pending", "cancelled"],
            default: "confirmed"
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
            min: [1, "La cantidad de tickets debe ser mayor a 0"]
        },
        reservationCode: {
            type: String,
            unique: true,
            required: true
        },
        cancelledAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

export const ticketModel = model("Tickets", ticketSchema);
