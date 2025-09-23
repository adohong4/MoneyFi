'use strict';

const express = require('express');
const { asyncHandler } = require('../../helpers/asyncHandlers')
const TriggerPoolController = require('../../controllers/trigger.controller');
const TransactionController = require('../../controllers/transaction_log.controller');

const router = express.Router();

//trigger
router.get('/trigger/status', asyncHandler(TriggerPoolController.checkStatus));

// transaction
router.get('/trigger/transaction', asyncHandler(TransactionController.getTransactionLog));
router.get('/trigger/search', asyncHandler(TransactionController.searchTransaction));
router.get('/trigger/amountPool/:userAddress', asyncHandler(TransactionController.totalAmountInPoolForUser));

module.exports = router;