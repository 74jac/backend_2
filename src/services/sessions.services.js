import { userModel } from "../models/user.model.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";

export async function registerUser (userData) {
    
    const {firstName, lastName, email, password} = userData;

    // Validar que todos los campos requeridos estén presentes    
    if (!firstName || !lastName || !email || !password) {
        throw new Error("Todos los campos son requeridos");
    }
    // Validar que el correo electrónico tenga un formato válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error("El correo electrónico no tiene un formato válido");
    }
    // Validar que la contraseña cumpla con los requisitos de seguridad
    if (password.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres");
    }
    // Validar que el correo electrónico no esté ya registrado en la base de datos
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        throw new Error("El correo electrónico ya está registrado");
    }   
    // Hashear la contraseña antes de guardarla en la base de datos
    const hashedPassword = await hashPassword(password);

    
    // Crear un nuevo usuario en la base de datos
    const newUser = await userModel.create({ 
        first_name: firstName, 
        last_name: lastName, 
        email, 
        password: hashedPassword,
        role: "user"
    });
    
    
    const userResponse = newUser.toObject();
    delete userResponse.password;
    return userResponse;
}; 
export async function loginUser (userData) {
    const { email, password } = userData;

    const user = await userModel.findOne({email});
    if (user == null) throw new Error("Credenciales inválidas");  

    
    if (!(await comparePassword(password, user.password))) 
        throw new Error("Credenciales inválidas");
    

    return user;

};
