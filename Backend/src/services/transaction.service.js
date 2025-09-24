'use strict'

const transactionLogModel = require("../models/trigger/transaction_log.model")
const poolModel = require("../models/pool.model")

class TransactionLogService {
    static async getTransactionLog(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const transactions = await transactionLogModel.find()
                .sort({ timestamps: -1 })
                .skip(skip)
                .limit(limit)
                .exec();

            const totalTransactions = await transactionLogModel.countDocuments();
            const totalPages = Math.ceil(totalTransactions / limit);

            return {
                metadata: {
                    transactions,
                    currentPage: page,
                    totalPages,
                    totalTransactions,
                    limit
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async searchTransaction(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const { query, status, type } = req.query;

            const searchConditions = {};

            if (query) {
                searchConditions.$or = [
                    { txHash: { $regex: query, $options: 'i' } },
                    { userAddress: { $regex: query, $options: 'i' } },
                    { poolName: { $regex: query, $options: 'i' } }
                ];
            }

            if (status && status !== 'all') {
                searchConditions.status = status;
            }

            if (type && type !== 'all') {
                searchConditions.type = { $regex: type, $options: 'i' };
            }

            const transactions = await transactionLogModel.find(searchConditions)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec();

            const totalTransactions = await transactionLogModel.countDocuments(searchConditions);

            const totalPages = Math.ceil(totalTransactions / limit);


            return {
                metadata: {
                    transactions,
                    currentPage: page,
                    totalPages,
                    totalTransactions,
                    limit
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async totalAmountInPoolForUser(req, res) {
        try {
            const { userAddress } = req.params;

            const result = await transactionLogModel.aggregate([
                {
                    $match: {
                        userAddress: userAddress,
                        status: "Success",
                    },
                },
                {
                    $group: {
                        _id: "$poolName",
                        totalAmount: {
                            $sum: {
                                $toDecimal: "$amountDeposit",
                            },
                        },
                    },
                },
                {
                    $project: {
                        poolName: "$_id",
                        totalAmount: { $toString: "$totalAmount" },
                        _id: 0,
                    },
                },
            ]);

            return result
        } catch (error) {
            throw error;
        }
    }
}

module.exports = TransactionLogService;