'use strict';

const express = require('express');
const { asyncHandler } = require('../../helpers/asyncHandlers')
const AdminController = require('../../controllers/admin.controller');

const router = express.Router();

//Admin
router.post('/admin/create', asyncHandler(AdminController.createAdmin));
router.get('/admin/get', asyncHandler(AdminController.getAllAdmin));
router.put('/admin/update/:id', asyncHandler(AdminController.updateAdmin));

module.exports = router;