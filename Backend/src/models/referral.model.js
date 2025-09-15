'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DOCUMENT_NAME = 'Referrals'

const userSchema = new Schema({
    userAddress: { type: String, required: true },
    referrer: { type: String, default: true },
    isReferral: { type: Boolean, default: true },
}, { timestamps: true })

// userSchema.index({ userId: 1 });

const userModel = mongoose.models.user || mongoose.model(DOCUMENT_NAME, userSchema)

module.exports = userModel;