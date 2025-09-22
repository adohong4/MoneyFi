'use strict'

const userService = require('../services/identity.service');
const balanceService = require('../services/getUserBalance.service');
const { OK, CREATED } = require('../core/success.response')

class UserController {
    connectWallet = async (req, res, next) => {
        try {
            const result = await userService.connectWallet(req, res);
            new OK({
                message: 'Successful Wallet connection!',
                metadata: result
            }).send(res)
        } catch (error) {
            next(error);
        }
    }

    userDeposit = async (req, res, next) => {
        try {
            const result = await userService.userDeposit(req, res);
            new OK({
                message: 'Successful Wallet deposition!',
                metadata: result
            }).send(res)
        } catch (error) {
            next(error);
        }
    }

    userInformation = async (req, res, next) => {
        try {
            const result = await userService.userInformation(req, res);
            new OK({
                message: 'User Information',
                metadata: result
            }).send(res)
        } catch (error) {
            next(error);
        }
    }

    getAllUserPagination = async (req, res, next) => {
        try {
            const result = await userService.getAllUserPagination(req, res);
            new OK({
                message: 'Get All User',
                metadata: result.metadata
            }).send(res)
        } catch (error) {
            next(error);
        }
    }

    searchUserPagination = async (req, res, next) => {
        try {
            const result = await userService.searchUserPagination(req, res);
            new OK({
                message: 'Successful Searching',
                metadata: result.metadata
            }).send(res)
        } catch (error) {
            next(error);
        }
    }

    userBalance = async (req, res, next) => {
        try {
            const { userAddress } = req.params;
            const result = await balanceService.getUserBalance(userAddress);
            new OK({
                message: 'Successful Getting',
                metadata: result
            }).send(res)
        } catch (error) {
            next(error);
        }
    }

}

module.exports = new UserController();