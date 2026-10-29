import { generateToken } from "../utils/jwt.js";

export async function registerController(req, res) {

    // Enviamos la respuesta
    res.status(201).json({
        status: 'success',
        message: 'Usuario registrado exitosamente',
        payload: {
            id: req.user._id,
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            email: req.user.email,
            role: req.user.role
        }
    });

}


export async function loginController(req, res) {

    // Guardamos los datos que necesitamos para generar el token
    const tokenUser = {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role
    }

    // Generamos el token
    const token = generateToken(tokenUser);

    
    res.cookie("Este_es_el_nombre_de_la_cookie", token, {
        maxAge: 60 * 60 * 1000, 
        httpOnly: true,         
        signed: true            
    })

    // Enviamos la respuesta
    res.status(200).json({
        status: "success",
        message: "Login correcto"
    })
}

export async function logoutController(req, res) {

    // Eliminamos la cookie que contiene el token
    res.clearCookie("Este_es_el_nombre_de_la_cookie")
    res.status(200).json({
        status: "succes",
        message: "Logout correcto"
    })
}

export async function currentController(req, res) {

    res.status(200).json({
        status: "success",
        payload: {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role
        }
    })
}