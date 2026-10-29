import { Types } from "mongoose";
import { eventRepository } from "../repositories/event.repository.js";

const VALID_STATUSES = ["draft", "published", "cancelled", "finished"];

function createHttpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

export class EventService {
    async getEvents(query = {}) {
        const {
            status,
            category,
            location,
            dateFrom,
            dateTo,
            page = 1,
            limit = 10,
            sort = "date"
        } = query;

        const filter = {};

        if (status) {
            if (!VALID_STATUSES.includes(status)) {
                throw createHttpError(
                    400,
                    `Estado inválido. Valores permitidos: ${VALID_STATUSES.join(", ")}`
                );
            }
            filter.status = status;
        }

        if (category) {
            filter.category = { $regex: `^${category.trim()}$`, $options: "i" };
        }

        if (location) {
            filter.location = { $regex: location.trim(), $options: "i" };
        }

        if (dateFrom || dateTo) {
            filter.date = {};
            if (dateFrom) {
                const parsedFrom = new Date(dateFrom);
                if (isNaN(parsedFrom.getTime())) {
                    throw createHttpError(400, "Formato inválido en dateFrom");
                }
                filter.date.$gte = parsedFrom;
            }
            if (dateTo) {
                const parsedTo = new Date(dateTo);
                if (isNaN(parsedTo.getTime())) {
                    throw createHttpError(400, "Formato inválido en dateTo");
                }
                filter.date.$lte = parsedTo;
            }
        }

        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
        const skip = (parsedPage - 1) * parsedLimit;

        // Parseo de ordenamiento: soporta "date", "-date", "date:desc", "date:asc", "price", etc.
        let sortOption = { date: 1 };
        if (typeof sort === "string" && sort.trim() !== "") {
            const rawSort = sort.trim();
            if (rawSort.includes(":")) {
                const [field, direction] = rawSort.split(":");
                sortOption = { [field]: direction.toLowerCase() === "desc" ? -1 : 1 };
            } else if (rawSort.startsWith("-")) {
                sortOption = { [rawSort.slice(1)]: -1 };
            } else {
                sortOption = { [rawSort]: 1 };
            }
        }

        const [data, total] = await Promise.all([
            eventRepository.findPaginated({
                filter,
                skip,
                limit: parsedLimit,
                sort: sortOption
            }),
            eventRepository.count(filter)
        ]);

        const totalPages = Math.ceil(total / parsedLimit) || 1;

        return {
            data,
            page: parsedPage,
            limit: parsedLimit,
            total,
            totalPages
        };
    }

    async getEventById(id) {
        if (!Types.ObjectId.isValid(id)) {
            throw createHttpError(404, "Evento no encontrado");
        }

        const event = await eventRepository.findById(id);
        if (!event) {
            throw createHttpError(404, "Evento no encontrado");
        }

        return event;
    }

    async createEvent(eventData, user) {
        const {
            title,
            description,
            category,
            date,
            location,
            capacity,
            price,
            status = "draft"
        } = eventData;

        if (
            !title ||
            !description ||
            !category ||
            !date ||
            !location ||
            capacity === undefined ||
            price === undefined
        ) {
            throw createHttpError(
                400,
                "Todos los campos obligatorios deben ser completados (title, description, category, date, location, capacity, price)"
            );
        }

        const numericCapacity = Number(capacity);
        if (isNaN(numericCapacity) || numericCapacity <= 0) {
            throw createHttpError(400, "La capacidad (capacity) debe ser mayor a 0");
        }

        const numericPrice = Number(price);
        if (isNaN(numericPrice) || numericPrice < 0) {
            throw createHttpError(400, "El precio (price) debe ser mayor o igual a 0");
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            throw createHttpError(400, "La fecha del evento no tiene un formato válido");
        }

        if (parsedDate <= new Date()) {
            throw createHttpError(400, "No se puede crear un evento con una fecha pasada");
        }

        if (!VALID_STATUSES.includes(status)) {
            throw createHttpError(
                400,
                `Estado inválido. Valores permitidos: ${VALID_STATUSES.join(", ")}`
            );
        }

        if (status === "cancelled" || status === "finished") {
            throw createHttpError(
                400,
                "No se puede crear un evento directamente con estado cancelado o finalizado"
            );
        }

        // El organizer se asigna siempre desde req.user, nunca desde el body
        const newEvent = await eventRepository.create({
            title,
            description,
            category,
            date: parsedDate,
            location,
            capacity: numericCapacity,
            price: numericPrice,
            status,
            organizer: user._id
        });

        return newEvent;
    }

    async updateEvent(id, updateData) {
        const existingEvent = await this.getEventById(id);

        if (existingEvent.status === "cancelled") {
            throw createHttpError(400, "No se puede modificar un evento que se encuentra cancelado");
        }

        const sanitizedUpdate = { ...updateData };
        // Impedir que se modifique el organizer desde el body
        delete sanitizedUpdate.organizer;

        if (sanitizedUpdate.capacity !== undefined) {
            const numericCapacity = Number(sanitizedUpdate.capacity);
            if (isNaN(numericCapacity) || numericCapacity <= 0) {
                throw createHttpError(400, "La capacidad (capacity) debe ser mayor a 0");
            }
            sanitizedUpdate.capacity = numericCapacity;
        }

        if (sanitizedUpdate.price !== undefined) {
            const numericPrice = Number(sanitizedUpdate.price);
            if (isNaN(numericPrice) || numericPrice < 0) {
                throw createHttpError(400, "El precio (price) debe ser mayor o igual a 0");
            }
            sanitizedUpdate.price = numericPrice;
        }

        if (sanitizedUpdate.date !== undefined) {
            const parsedDate = new Date(sanitizedUpdate.date);
            if (isNaN(parsedDate.getTime())) {
                throw createHttpError(400, "La fecha del evento no tiene un formato válido");
            }
            if (parsedDate <= new Date()) {
                throw createHttpError(400, "No se puede asignar una fecha pasada al evento");
            }
            sanitizedUpdate.date = parsedDate;
        }

        if (sanitizedUpdate.status !== undefined) {
            if (!VALID_STATUSES.includes(sanitizedUpdate.status)) {
                throw createHttpError(
                    400,
                    `Estado inválido. Valores permitidos: ${VALID_STATUSES.join(", ")}`
                );
            }
            if (existingEvent.status === "finished" && sanitizedUpdate.status === "published") {
                throw createHttpError(
                    400,
                    "No se puede publicar un evento que ya ha finalizado"
                );
            }
        }

        return await eventRepository.updateById(id, sanitizedUpdate);
    }

    async updateEventStatus(id, newStatus) {
        if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
            throw createHttpError(
                400,
                `Debe proporcionar un estado válido (${VALID_STATUSES.join(", ")})`
            );
        }

        const existingEvent = await this.getEventById(id);

        if (existingEvent.status === "cancelled") {
            throw createHttpError(
                400,
                "Un evento cancelado no puede modificarse ni cambiar de estado"
            );
        }

        if (existingEvent.status === "finished" && newStatus === "published") {
            throw createHttpError(
                400,
                "No se puede publicar un evento que ya se encuentra finalizado"
            );
        }

        return await eventRepository.updateById(id, { status: newStatus });
    }
}

export const eventService = new EventService();
