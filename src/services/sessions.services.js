import { userRepository } from "../repositories/user.repository.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";
import { UserDTO } from "../dto/user.dto.js";

function createHttpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

export async function registerUser(userData) {
    const first_name = userData.first_name || userData.firstName;
    const last_name = userData.last_name || userData.lastName;
    const { email, password } = userData;

    if (!first_name || !last_name || !email || !password) {
        throw createHttpError(400, "Todos los campos son requeridos");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
        throw createHttpError(400, "El correo electrónico no tiene un formato válido");
    }

    if (password.length < 8) {
        throw createHttpError(400, "La contraseña debe tener al menos 8 caracteres");
    }

    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
        throw createHttpError(409, "El correo electrónico ya está registrado");
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await userRepository.createUser({
        first_name,
        last_name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "user"
    });

    return UserDTO.fromUser(newUser);
}

export async function loginUser(userData) {
    const { email, password } = userData;

    if (!email || !password) {
        throw createHttpError(400, "Debes enviar email y contraseña");
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
        throw createHttpError(401, "Credenciales inválidas");
    }

    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
        throw createHttpError(401, "Credenciales inválidas");
    }

    return UserDTO.fromUser(user);
}
