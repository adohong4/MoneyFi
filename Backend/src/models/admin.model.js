'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DOCUMENT_NAME = 'admin'

const adminSchema = new Schema({
    userAddress: { type: String },
    role: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true })


const adminModel = mongoose.models.pools || mongoose.model(DOCUMENT_NAME, adminSchema)

module.exports = adminModel;