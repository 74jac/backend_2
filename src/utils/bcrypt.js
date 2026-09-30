import bcrypt from "bcrypt";

// Función para hashear la contraseña
export async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10); // Número de rondas de sal para el algoritmo de hash
    
    return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
};
