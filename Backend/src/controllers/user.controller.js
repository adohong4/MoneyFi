'use strict'

const userService = require('../services/identity');
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
}

module.exports = new UserController();