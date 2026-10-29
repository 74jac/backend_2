import { eventModel } from "../models/event.model.js";

export async function getAll(req, res) {
    try {
        const events = await eventModel.find();
        res.status(200).json({ status: "success", payload: events });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

export async function getById(req, res) {
    try {
        const { eid } = req.params;
        const event = await eventModel.findById(eid);

        if (!event) {
            return res.status(404).json({ status: "error", message: "Evento no encontrado" });
        }

        res.status(200).json({ status: "success", payload: event });
    } catch (error) {
        res.status(400).json({ status: "error", message: error.message });
    }
}

export async function createEvent(req, res) {
    try {
        const { date } = req.body;

        if (date && new Date(date) < new Date()) {
            return res.status(400).json({
                status: "error",
                message: "No se puede crear un evento con una fecha pasada"
            });
        }

        const eventCreated = await eventModel.create({
            ...req.body,
            organizer: req.user._id
        });

        res.status(201).json({
            status: "success",
            message: "Evento creado con éxito",
            payload: eventCreated
        });
    } catch (error) {
        res.status(400).json({ status: "error", message: error.message });
    }
}

export async function updateEvent(req, res) {
    try {
        const { eid } = req.params;
        const eventUpdated = await eventModel.findByIdAndUpdate(eid, req.body, {
            new: true,
            runValidators: true
        });

        if (!eventUpdated) {
            return res.status(404).json({ status: "error", message: "Evento no encontrado" });
        }

        res.status(200).json({
            status: "success",
            message: "Evento actualizado con éxito",
            payload: eventUpdated
        });
    } catch (error) {
        res.status(400).json({ status: "error", message: error.message });
    }
}

export async function deleteEvent(req, res) {
    try {
        const { eid } = req.params;
        const eventDeleted = await eventModel.findByIdAndDelete(eid);

        if (!eventDeleted) {
            return res.status(404).json({ status: "error", message: "Evento no encontrado" });
        }

        res.status(200).json({
            status: "success",
            message: "Evento eliminado con éxito",
            payload: eventDeleted
        });
    } catch (error) {
        res.status(400).json({ status: "error", message: error.message });
    }
}
