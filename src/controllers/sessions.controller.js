import { generateToken } from "../utils/jwt.js";
import { UserDTO } from "../dto/user.dto.js";

export async function registerController(req, res) {
    res.status(201).json({
        status: "success",
        message: "Usuario registrado exitosamente",
        payload: UserDTO.fromUser(req.user)
    });
}

export async function loginController(req, res) {
    const tokenUser = {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role
    };

    const token = generateToken(tokenUser);

    res.cookie("Este_es_el_nombre_de_la_cookie", token, {
        maxAge: 60 * 60 * 1000,
        httpOnly: true,
        signed: true
    });

    res.status(200).json({
        status: "success",
        message: "Login correcto"
    });
}

export async function logoutController(req, res) {
    res.clearCookie("Este_es_el_nombre_de_la_cookie");
    res.status(200).json({
        status: "success",
        message: "Logout correcto"
    });
}

export async function currentController(req, res) {
    res.status(200).json({
        status: "success",
        payload: UserDTO.fromUser(req.user)
    });
}
