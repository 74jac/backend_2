import { Schema, model, Types } from "mongoose";

const eventSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        date: { type: Date, required: true },
        location: { type: String, required: true, trim: true },
        capacity: {
            type: Number,
            required: true,
            min: [1, "La capacidad debe ser mayor a 0"]
        },
        price: {
            type: Number,
            required: true,
            min: [0, "El precio debe ser mayor o igual a 0"]
        },
        status: {
            type: String,
            enum: ["draft", "published", "cancelled", "finished"],
            default: "draft"
        },
        organizer: {
            type: Types.ObjectId,
            ref: "Users",
            required: true
        }
    },
    { timestamps: true }
);

export const eventModel = model("Events", eventSchema);
