import { userRepository } from "../repositories/user.repository.js";
import { UserDTO } from "../dto/user.dto.js";

function createHttpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

export class UserService {
    async getAllUsers() {
        const users = await userRepository.findAll();
        return UserDTO.fromUsers(users);
    }

    async getUserByEmail(email) {
        if (!email) {
            throw createHttpError(400, "El email es requerido");
        }
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw createHttpError(404, "Usuario no encontrado");
        }
        return UserDTO.fromUser(user);
    }

    async updateUserByEmail(email, updateData) {
        if (!email) {
            throw createHttpError(400, "El email es requerido");
        }
        const sanitized = { ...updateData };
        delete sanitized.password;

        const updated = await userRepository.updateByEmail(email, sanitized);
        if (!updated) {
            throw createHttpError(404, "Usuario no encontrado");
        }
        return UserDTO.fromUser(updated);
    }
}

export const userService = new UserService();

