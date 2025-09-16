'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DOCUMENT_NAME = 'StrategyPool'

const poolSchema = new Schema({
    name: { type: String }, // USDC/ARB
    strategyAddress: { type: String },
    qouteToken: { type: String },
    baseToken: { type: String },
    chainId: { type: Number, default: 115511 }
}, { timestamps: true })


const poolModel = mongoose.models.pools || mongoose.model(DOCUMENT_NAME, poolSchema)

module.exports = poolModel;