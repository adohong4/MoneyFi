'use strict';

const express = require('express');
const { checkTokenCookie, checkTokenCookieAdmin } = require('../../middlewares/checkAuth');
const { asyncHandler } = require('../../helpers/asyncHandlers')
const UserController = require('../../controllers/user.controller');

const router = express.Router();

//User
router.post('/user/connectWallet', asyncHandler(UserController.connectWallet));
router.post('/user/deposit', asyncHandler(UserController.userDeposit));
router.get('/user/infor', asyncHandler(UserController.userInformation));

module.exports = router;