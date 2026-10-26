import { eventModel } from "../models/event.model.js";

export function rolesPermition(roles) {
    return function (req, res, next) {
       try { 
        if (roles.includes(req.user.role)) next()
        else throw new Error ("Acesso no permitido")
    
    } catch {
        res.status(403).json({error: error.message})
    }
}
};


export async function ticketPermition(req, res, next) { 
    try {
        if(req.user.role == "user") next();
        if(req.user.role == "admin" || req.user.role == "organizer") {
            const event = await eventModel.findById(req.params.eid);
            if(event.organizer == req.user.id){
                throw new Error ("No podes comprar un ticket de tu propio evento");
            }
        }   
    } catch (error) {
        res.status(403).json({error: error.message});
    }

}

//eventos cancelados
//realizar validación de organizador no pueda editar o eliminar un evento que no sea suyo
//realizar validacion de fecha para que no se pueda crear un evento con fecha pasada