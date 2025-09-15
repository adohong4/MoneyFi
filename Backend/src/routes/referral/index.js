'use strict';

const express = require('express');
const { checkTokenCookie, checkTokenCookieAdmin } = require('../../middlewares/checkAuth');
const { asyncHandler } = require('../../helpers/asyncHandlers')
const ReferralController = require('../../controllers/referral.controller');

const router = express.Router();

//Referral
router.get('/referral/getRank', asyncHandler(ReferralController.getReferrerRankPagination));

module.exports = router;