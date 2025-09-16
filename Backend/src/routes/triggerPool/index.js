'use strict';

const express = require('express');
const { asyncHandler } = require('../../helpers/asyncHandlers')
const TriggerPoolController = require('../../controllers/trigger.controller');

const router = express.Router();

//Referral
router.get('/trigger/status', asyncHandler(TriggerPoolController.checkStatus));

module.exports = router;