'use strict'

const PoolService = require('../services/pool.service');
const { OK, CREATED } = require('../core/success.response')

class PoolController {

    addPool = async (req, res, next) => {
        try {
            const result = await PoolService.addPool(req, res);
            new OK({
                message: 'Successful pool adding!',
                metadata: result
            }).send(res)
        } catch (error) {
            next(error);
        }
    }

    getPool = async (req, res, next) => {
        try {
            const result = await PoolService.getPools(req, res);
            new OK({
                message: 'Successful pool getting!',
                metadata: result
            }).send(res)
        } catch (error) {
            next(error);
        }
    }

}

module.exports = new PoolController();