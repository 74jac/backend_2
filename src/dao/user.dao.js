import { userModel } from "../models/user.model.js";

export class UserDAO {
    async find(filter = {}) {
        return await userModel.find(filter);
    }

    async findOne(filter = {}) {
        return await userModel.findOne(filter);
    }

    async findById(id) {
        return await userModel.findById(id);
    }

    async create(userData) {
        return await userModel.create(userData);
    }

    async updateOne(filter, updateData) {
        return await userModel.findOneAndUpdate(filter, updateData, {
            new: true,
            runValidators: true
        });
    }

    async updateById(id, updateData) {
        return await userModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });
    }
}

export const userDAO = new UserDAO();

