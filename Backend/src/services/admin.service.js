'use strict';

const adminModel = require('../models/admin.model');
const { BadRequestError, AuthFailureError, NotFoundError } = require("../core/error.response");

class AdminService {
    static async creatAdmin(req, res) {
        try {
            const { userAddress, role } = req.body

            if (!userAddress || !role) {
                throw new Error('Missing required fields');
            }

            const newAdmin = new adminModel({
                userAddress,
                role,
            })

            await newAdmin.save()
            return newAdmin;
        } catch (error) {
            throw new BadRequestError(error)
        }
    }

    static async getAllAdmin(req, res) {
        try {
            const admins = await adminModel.find();
            return admins;
        } catch (error) {
            throw new BadRequestError(error)
        }
    }

    static async updateAdmin(req, res) {
        try {
            const { id } = req.params;
            const { role, status } = req.body;
            const updatedAdmin = await adminModel.findByIdAndUpdate(
                id,
                { role, status },
                { new: true }
            );
            if (!updatedAdmin) {
                throw new NotFoundError('Admin not found');
            }
            return updatedAdmin;
        } catch (error) {
            throw new BadRequestError(error)
        }
    }
}

module.exports = AdminService;