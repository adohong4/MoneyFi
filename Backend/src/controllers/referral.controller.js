'use strict'

const referralService = require('../services/referral.service');
const { OK, CREATED } = require('../core/success.response')

class UserController {

    getReferrerRankPagination = async (req, res, next) => {
        try {
            const result = await referralService.getReferrerRankPagination(req, res);
            new OK({
                message: 'Get Referrer Rank',
                metadata: result.metadata
            }).send(res)
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();