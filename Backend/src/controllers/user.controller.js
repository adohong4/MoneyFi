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
}

module.exports = new UserController();