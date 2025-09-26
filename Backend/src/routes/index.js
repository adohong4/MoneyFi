'use strict'

const express = require('express');
const router = express.Router();

router.use('/v1/api', require('./identity'));
router.use('/v1/api', require('./referral'));
router.use('/v1/api', require('./triggerPool'));
router.use('/v1/api', require('./pool'));
router.use('/v1/api', require('./admin'));

module.exports = router;