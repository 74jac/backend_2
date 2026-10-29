import { userDAO } from "../dao/user.dao.js";

export class UserRepository {
    async findAll() {
        return await userDAO.find({});
    }

    async findById(id) {
        return await userDAO.findById(id);
    }

    async findByEmail(email) {
        const normalizedEmail = email.toLowerCase().trim();
        return await userDAO.findOne({ email: normalizedEmail });
    }

    async createUser(userData) {
        return await userDAO.create(userData);
    }

    async updateByEmail(email, updateData) {
        const normalizedEmail = email.toLowerCase().trim();
        return await userDAO.updateOne({ email: normalizedEmail }, updateData);
    }
}

export const userRepository = new UserRepository();

