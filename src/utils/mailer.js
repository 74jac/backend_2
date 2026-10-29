import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export async function sendTicketConfirmationEmail({ user, event, ticket }) {
    if (!env.MAIL_HOST || !env.MAIL_USER || !env.MAIL_PASS) {
        console.warn(
            "[Mailer] Variables MAIL_HOST, MAIL_USER o MAIL_PASS no configuradas en .env. Se omite el envío de correo."
        );
        return false;
    }

    const port = Number(env.MAIL_PORT) || 587;

    const transporter = nodemailer.createTransport({
        host: env.MAIL_HOST,
        port,
        secure: port === 465,
        auth: {
            user: env.MAIL_USER,
            pass: env.MAIL_PASS
        }
    });

    const formattedDate = new Date(event.date).toLocaleString("es-AR");

    await transporter.sendMail({
        from: env.MAIL_FROM || env.MAIL_USER,
        to: user.email,
        subject: `Confirmación de inscripción: ${event.title}`,
        html: `
            <h2>¡Inscripción confirmada!</h2>
            <p>Hola <strong>${user.first_name || user.email}</strong>, tu inscripción al evento se registró con éxito.</p>
            <ul>
                <li><strong>Evento:</strong> ${event.title}</li>
                <li><strong>Fecha:</strong> ${formattedDate}</li>
                <li><strong>Ubicación:</strong> ${event.location}</li>
                <li><strong>Cantidad de entradas:</strong> ${ticket.quantity}</li>
                <li><strong>Código de reserva:</strong> ${ticket.reservationCode}</li>
                <li><strong>Estado:</strong> ${ticket.status}</li>
            </ul>
        `
    });

    return true;
}

