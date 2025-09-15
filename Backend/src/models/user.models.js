'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DOCUMENT_NAME = 'Users'

const userSchema = new Schema({
    userAddress: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    invitationCode: { type: String, default: '' },
    isReferral: { type: Boolean, default: false },
    referralCode: { type: String, default: '' },
    point: { type: Number, default: 0 },
}, { timestamps: true })

// userSchema.index({ userId: 1 });

const userModel = mongoose.models.user || mongoose.model(DOCUMENT_NAME, userSchema)

module.exports = userModel;