import { userService } from "../services/user.services.js";

export async function getAll(req, res, next) {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json({
            status: "success",
            payload: users
        });
    } catch (error) {
        next(error);
    }
}

export async function getByEmail(req, res, next) {
    try {
        const { email } = req.params;
        const user = await userService.getUserByEmail(email);
        res.status(200).json({
            status: "success",
            payload: user
        });
    } catch (error) {
        next(error);
    }
}

export async function updateUser(req, res, next) {
    try {
        const { email } = req.params;
        const updatedUser = await userService.updateUserByEmail(email, req.body);
        res.status(200).json({
            status: "success",
            message: "Usuario actualizado con éxito",
            payload: updatedUser
        });
    } catch (error) {
        next(error);
    }
}
