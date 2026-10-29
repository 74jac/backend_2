import { eventService } from "../services/event.services.js";

export async function getAll(req, res) {
    try {
        const result = await eventService.getEvents(req.query);
        res.status(200).json({
            status: "success",
            ...result
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "error",
            message: error.message
        });
    }
}

export async function getById(req, res) {
    try {
        const eventId = req.params.id || req.params.eid;
        const event = await eventService.getEventById(eventId);
        res.status(200).json({
            status: "success",
            payload: event
        });
    } catch (error) {
        res.status(error.statusCode || 400).json({
            status: "error",
            message: error.message
        });
    }
}

export async function createEvent(req, res) {
    try {
        const eventCreated = await eventService.createEvent(req.body, req.user);
        res.status(201).json({
            status: "success",
            message: "Evento creado con éxito",
            payload: eventCreated
        });
    } catch (error) {
        res.status(error.statusCode || 400).json({
            status: "error",
            message: error.message
        });
    }
}

export async function updateEvent(req, res) {
    try {
        const eventId = req.params.id || req.params.eid;
        const eventUpdated = await eventService.updateEvent(eventId, req.body);
        res.status(200).json({
            status: "success",
            message: "Evento actualizado con éxito",
            payload: eventUpdated
        });
    } catch (error) {
        res.status(error.statusCode || 400).json({
            status: "error",
            message: error.message
        });
    }
}

export async function updateEventStatus(req, res) {
    try {
        const eventId = req.params.id || req.params.eid;
        const { status } = req.body;
        const eventUpdated = await eventService.updateEventStatus(eventId, status);
        res.status(200).json({
            status: "success",
            message: `Estado del evento actualizado a '${status}'`,
            payload: eventUpdated
        });
    } catch (error) {
        res.status(error.statusCode || 400).json({
            status: "error",
            message: error.message
        });
    }
}

export async function deleteEvent(req, res) {
    try {
        const eventId = req.params.id || req.params.eid;
        // Cancelar = cambiar status a cancelled; no se eliminan físicamente
        const eventCancelled = await eventService.updateEventStatus(eventId, "cancelled");
        res.status(200).json({
            status: "success",
            message: "Evento cancelado con éxito (baja lógica)",
            payload: eventCancelled
        });
    } catch (error) {
        res.status(error.statusCode || 400).json({
            status: "error",
            message: error.message
        });
    }
}
