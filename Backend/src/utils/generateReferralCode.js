const crypto = require('crypto');

const generateReferralCode = () => {
    return crypto.randomBytes(6).toString('base64url'); // ví dụ: 89EmiB6iwHgA
}

module.exports = generateReferralCode;
