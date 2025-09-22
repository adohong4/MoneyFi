'use strict';

const express = require('express');
const { checkTokenCookie, checkTokenCookieAdmin } = require('../../middlewares/checkAuth');
const { asyncHandler } = require('../../helpers/asyncHandlers')
const UserController = require('../../controllers/user.controller');

const router = express.Router();

//User
router.post('/user/connectWallet', asyncHandler(UserController.connectWallet));
router.post('/user/deposit', asyncHandler(UserController.userDeposit));
router.get('/user/infor/:userAddress', asyncHandler(UserController.userInformation));
router.get('/user/getAll', asyncHandler(UserController.getAllUserPagination));
router.get('/user/search', asyncHandler(UserController.searchUserPagination));
router.get('/user/balance/:userAddress', asyncHandler(UserController.userBalance));

module.exports = router;