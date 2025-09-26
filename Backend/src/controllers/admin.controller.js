'use strict';
const adminService = require('../services/admin.service');
const { OK, CREATED } = require('../core/success.response')

class AdminController {
    async createAdmin(req, res, next) {
        try {
            const newAdmin = await adminService.creatAdmin(req, res);
            new CREATED({
                message: 'Admin created successfully',
                metadata: newAdmin
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    async getAllAdmin(req, res, next) {
        try {
            const admins = await adminService.getAllAdmin(req, res);
            new OK({
                message: 'Admins retrieved successfully',
                metadata: admins
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    async updateAdmin(req, res, next) {
        try {
            const updatedAdmin = await adminService.updateAdmin(req, res);
            new OK({
                message: 'Admin updated successfully',
                metadata: updatedAdmin
            }).send(res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();