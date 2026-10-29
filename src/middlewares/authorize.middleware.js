import { eventModel } from "../models/event.model.js";

// Middleware de autorización por roles: recibe roles permitidos (array o argumentos)
// Compara contra req.user.role y responde 403 si no coincide
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

// Middleware de propiedad de recurso:
// organizer solo puede modificar/eliminar sus propios eventos; admin puede modificar cualquiera
export async function ensureEventOwnerOrAdmin(req, res, next) {
    try {
        const { eid } = req.params;
        const event = await eventModel.findById(eid);

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
            message: "No tenés permisos para modificar o eliminar un evento ajeno"
        });
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: "ID de evento inválido o error al verificar permisos"
        });
    }
}

// Middleware para compra de tickets:
// No permite comprar tickets de eventos cancelados ni que el organizador compre de su propio evento
export async function ticketPermition(req, res, next) {
    try {
        const event = await eventModel.findById(req.params.eid);

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
