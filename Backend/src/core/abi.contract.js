'use strict';

const fs = require('fs');
const uniswapV2RouterAbi = require('@uniswap/v2-periphery/build/IUniswapV2Router02.json').abi;

module.exports = {
    abi: {
        fundVault: JSON.parse(fs.readFileSync('./src/abis/MoneyFiFundVault.json')).abi,
        routerAbi: JSON.parse(fs.readFileSync('./src/abis/MoneyFiRouter.json')).abi,
        controllerAbi: JSON.parse(fs.readFileSync('./src/abis/MoneyFiController.json')).abi,
        strategyAbi: JSON.parse(fs.readFileSync('./src/abis/MoneyFiStrategyUpgradeableUniswapV2.json')).abi,
        uniswapV2Router: uniswapV2RouterAbi,
    },
};