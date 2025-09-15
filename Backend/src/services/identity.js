'use strict'

const accountModel = require('../models/user.models')
const bcrypt = require('bcrypt')
const { BadRequestError, AuthFailureError, NotFoundError } = require("../core/error.response");
const { generateReferralCode } = require("../utils/generateReferralCode")
const userModel = require('../models/referral.model');

class AccountService {
    static connectWallet = async (req, res) => {
        try {
            const { userAddress, invitationCode } = req.body;

            const existAddress = await accountModel.findOne({ userAddress });
            if (existAddress) throw new BadRequestError("Connecting Wallet is successful!")

            let invitedBy = null;
            if (invitationCode) {
                const referrer = await accountModel.findOne({ invitationCode });
                if (referrer) {
                    invitedBy = referrer.invitationCode;
                    isReferral = true;
                }
            }

            const newUser = await userModel.create({
                userAddress: userAddress,
                invitationCode: generateReferralCode(),
                referralCode: invitedBy
            })

            return newUser;

        } catch (error) {
            throw new BadRequestError(error)
        }
    }

    static getAllAccount = async () => {
        try {
            const account = await accountModel.find()
                .select('username email role address cartData')
                .sort({ createdAt: -1 })
                .exec();
            return { metadata: account }
        } catch (error) {
            throw new BadRequestError(error);
        }
    }
}

module.exports = AccountService;