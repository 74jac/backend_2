import { Schema, model, Types } from "mongoose";

const eventSchema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        category: { type: String, required: true },
        date: { type: Date, required: true },
        location: { type: String, required: true },
        capacity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ["draft", "published", "cancelled", "finished"],
            default: "published"
        },
        organizer: { type: Types.ObjectId, ref: "Users", required: true }
    },
    { timestamps: true }
);

export const eventModel = model("Events", eventSchema);
