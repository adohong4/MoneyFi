'use strict';

const express = require('express');
const { checkTokenCookie, checkTokenCookieAdmin } = require('../../middlewares/checkAuth');
const { asyncHandler } = require('../../helpers/asyncHandlers')
const UserController = require('../../controllers/user.controller');

const router = express.Router();

//User
router.get('/user/connectWallet', asyncHandler(UserController.connectWallet));

module.exports = router;