const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');

function updateEnvVariable(key, value) {
  const envFilePath = '.env';
  
  const envConfig = dotenv.parse(fs.readFileSync(envFilePath));

  envConfig[key] = value;

  const updatedEnvConfig = Object.keys(envConfig).map(envKey => `${envKey}=${envConfig[envKey]}`).join('\n');

  fs.writeFileSync(envFilePath, updatedEnvConfig);
}

async function fetchPriceUpdates() {
  try {
    const wethId = "9d4294bbcd1174d6f2003ec365831e64cc31d9f6f15a2b85399db8d5000960f6"; 
    const usdcId = "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a"; 
    const apiUrlWeth = `https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=${wethId}&encoding=hex&parsed=true`;

    const apiUrlUsdc =`https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=${usdcId}&encoding=hex&parsed=true`;

     const wethUpdatePriceData = await axios.get(apiUrlWeth);
     const usdcUpdatePriceData = await axios.get(apiUrlUsdc);

     console.log("Weth update price data: ", `0x${wethUpdatePriceData.data.binary.data}`);
      console.log("Usdc update price data: ", `0x${usdcUpdatePriceData.data.binary.data}`);
        // Update the .env file with the new price data
    updateEnvVariable('WETH_UPDATE_PRICE_DATA', `0x${wethUpdatePriceData.data.binary.data}`);
    updateEnvVariable('USDC_UPDATE_PRICE_DATA', `0x${usdcUpdatePriceData.data.binary.data}`);
  } catch (error) {
    console.error('Error fetching or decoding data:', error);
  }
}


fetchPriceUpdates();


