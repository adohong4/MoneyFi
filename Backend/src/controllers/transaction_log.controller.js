'use strict'

const TransactionLogService = require("../services/transaction.service")
const { OK, CREATED } = require('../core/success.response')

class TransactionController {
    getTransactionLog = async (req, res, next) => {
        try {
            const result = await TransactionLogService.getTransactionLog(req, res);
            new OK({
                message: 'Get transaction',
                metadata: result.metadata
            }).send(res)
        } catch (error) {
            next(error);
        }
    }

    searchTransaction = async (req, res, next) => {
        try {
            const result = await TransactionLogService.searchTransaction(req, res);
            new OK({
                message: 'Success search transaction',
                metadata: result.metadata
            }).send(res)
        } catch (error) {
            next(error);
        }
    }

    totalAmountInPoolForUser = async (req, res, next) => {
        try {
            const result = await TransactionLogService.totalAmountInPoolForUser(req, res);
            new OK({
                message: 'Get amount in pool',
                metadata: result
            }).send(res)
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new TransactionController();