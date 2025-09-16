'use strict';

const fs = require('fs');

module.exports = {
    abi: {
        fundVault: JSON.parse(fs.readFileSync('./abis/MoneyFiFundVault.json')).abi,
        routerAbi: JSON.parse(fs.readFileSync('./abis/MoneyFiRouter.json')).abi,
        controllerAbi: JSON.parse(fs.readFileSync('./abis/MoneyFiController.json')).abi,
        strategyAbi: JSON.parse(fs.readFileSync('./abis/MoneyFiStrategyUpgradeableUniswapV2.json')).abi,
    },
};