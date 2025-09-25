'use strict';

const StrategyPool = require('../models/pool.model');
const { ethers } = require('ethers');
const { abi } = require('../core/abi.contract');

class PoolService {
    static async addPool(req, res) {
        try {
            const { name, strategyAddress, baseToken, quoteToken, chainId, slippageWhenSwapAsset, minimumSwapAmount, pairAddress } = req.body;

            const newPool = await StrategyPool.create({
                name: name,
                strategyAddress: strategyAddress,
                baseToken: baseToken,
                quoteToken: quoteToken,
                pairAddress: pairAddress,
                chainId: chainId,
                slippageWhenSwapAsset: slippageWhenSwapAsset,
                minimumSwapAmount: minimumSwapAmount,
                status: 'active'
            })

            return newPool
        } catch (error) {
            throw error
        }
    }

    static async getPools(req, res) {
        try {
            const pools = await StrategyPool.find({ chainId: 11155111 });
            return pools
        } catch (error) {
            throw (error)
        }
    }

    static async updatePools(req, res) {
        try {
            const { id } = req.params;
            const { name, strategyAddress, baseToken, quoteToken, chainId, slippageWhenSwapAsset, minimumSwapAmount, pairAddress, status } = req.body;

            const updatedPool = await StrategyPool.findByIdAndUpdate(id, {
                name: name,
                strategyAddress: strategyAddress,
                baseToken: baseToken,
                quoteToken: quoteToken,
                chainId: chainId,
                pairAddress: pairAddress,
                slippageWhenSwapAsset: slippageWhenSwapAsset,
                minimumSwapAmount: minimumSwapAmount,
                status: status
            }, { new: true })

            return updatedPool;
        } catch (error) {
            throw (error)
        }
    }
}

module.exports = PoolService;