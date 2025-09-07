const fs = require('fs');
const path = require('path');

const addressesPath = path.join(__dirname, '../deployedAddresses.json');

function saveAddress(contractName, address) {
    let addresses = {};
    if (fs.existsSync(addressesPath)) {
        addresses = JSON.parse(fs.readFileSync(addressesPath));
    }
    addresses[contractName] = address;
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
}

function getAddresses() {
    if (fs.existsSync(addressesPath)) {
        return JSON.parse(fs.readFileSync(addressesPath));
    }
    return {};
}

module.exports = { saveAddress, getAddresses };