import { eventModel } from "../models/event.model.js";

export async function getAll(req, res, next){
try {
    
} catch (error) {
    console.log(error);
}

}

export async function getById(req, res, next){
try {
    const events = await eventModel.find(
    res.status(200).json({message: "sucess", events})
    )
} catch (error) {
    console.log(error);
}

}

export async function createEvent(req, res, next){
try {
    const newEvent = req.body;
    const eventCreated = await eventModel.create(req.body);
    res.status(201).json({ message: "Evento creado con éxito", newEvent: eventCreated });  
} catch (error) {
    console.log(error);
}

}
export async function deleteEvent(req, res, next){
try {
    
} catch (error) {
    console.log(error);
}

}
export async function updateEvent(req, res, next){
try {
    
} catch (error) {
    console.log(error);
}

}
