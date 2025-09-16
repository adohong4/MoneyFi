'use strict';

const { OK, CREATED } = require('../core/success.response')
const triggerService = require('../services/triggerPool.service');

class TriggerPoolController {
    checkStatus = async (req, res, next) => {
        try {
            const result = await triggerService.startDepositListener(req, res);
            new OK({
                message: 'Successful trigger deposition!',
                metadata: result
            }).send(res)
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new TriggerPoolController();