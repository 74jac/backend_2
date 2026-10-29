import { Types } from "mongoose";
import { eventModel } from "../models/event.model.js";


export function rolesPermition(...rolesArgs) {
    const allowedRoles = Array.isArray(rolesArgs[0]) ? rolesArgs[0] : rolesArgs;

    return function (req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                status: "error",
                message: "No autenticado"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: "error",
                message: "No tenés permisos para realizar esta acción"
            });
        }

        next();
    };
}


export async function ensureEventOwnerOrAdmin(req, res, next) {
    try {
        const eventId = req.params.id || req.params.eid;

        if (!Types.ObjectId.isValid(eventId)) {
            return res.status(404).json({
                status: "error",
                message: "Evento no encontrado"
            });
        }

        const event = await eventModel.findById(eventId);

        if (!event) {
            return res.status(404).json({
                status: "error",
                message: "Evento no encontrado"
            });
        }

        if (req.user.role === "admin") {
            return next();
        }

        if (
            req.user.role === "organizer" &&
            event.organizer &&
            event.organizer.toString() === req.user._id.toString()
        ) {
            return next();
        }

        return res.status(403).json({
            status: "error",
            message: "No tenés permisos para modificar un evento ajeno"
        });
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message
        });
    }
}


export async function ticketPermition(req, res, next) {
    try {
        const eventId = req.params.eid || req.params.id;
        if (!Types.ObjectId.isValid(eventId)) {
            return res.status(404).json({
                status: "error",
                message: "Evento no encontrado"
            });
        }

        const event = await eventModel.findById(eventId);

        if (!event) {
            return res.status(404).json({
                status: "error",
                message: "Evento no encontrado"
            });
        }

        if (event.status === "cancelled") {
            return res.status(400).json({
                status: "error",
                message: "No se pueden comprar tickets de un evento cancelado"
            });
        }

        if (req.user.role === "admin" || req.user.role === "organizer") {
            if (event.organizer && event.organizer.toString() === req.user._id.toString()) {
                return res.status(403).json({
                    status: "error",
                    message: "No podés comprar un ticket de tu propio evento"
                });
            }
        }

        next();
    } catch (error) {
        return res.status(403).json({
            status: "error",
            message: error.message
        });
    }
}
