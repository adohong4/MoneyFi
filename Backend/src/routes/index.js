'use strict'

const express = require('express');
const router = express.Router();

router.use('/v1/api', require('./identity'));
router.use('/v1/api', require('./referral'));


module.exports = router;