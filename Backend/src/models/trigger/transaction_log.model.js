'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DOCUMENT_NAME = 'Transaction_log'

const transactionLogSchema = new Schema({
    userAddress: { type: String, required: true }, // user address
    poolName: { type: String, required: true },
    strategyAddress: { type: String, required: true },
    type: { type: String, default: "", required: true },
    token: { type: String, required: true },
    amountDeposit: { type: String, required: true }, // lưu bigint dưới dạng string
    txHash: { type: String, required: true },
    status: { type: String, required: true, enum: ["Success", "Failed"] },
}, { timestamps: true })


const transactionLogModel = mongoose.models.transactionLog || mongoose.model(DOCUMENT_NAME, transactionLogSchema)

module.exports = transactionLogModel;