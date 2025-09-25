'use strict';

const express = require('express');
const { asyncHandler } = require('../../helpers/asyncHandlers')
const PoolController = require('../../controllers/pool.controller');

const router = express.Router();

//pool
router.post('/pool/add', asyncHandler(PoolController.addPool));
router.get('/pool/get', asyncHandler(PoolController.getPool));
router.post('/pool/update/:id', asyncHandler(PoolController.updatePool));

module.exports = router;