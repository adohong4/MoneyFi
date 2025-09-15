'use strict'

const accountModel = require('../models/user.models')
const bcrypt = require('bcrypt')
const { BadRequestError, AuthFailureError, NotFoundError } = require("../core/error.response");
const generateReferralCode = require("../utils/generateReferralCode")
const userModel = require('../models/user.models');

class AccountService {
    static connectWallet = async (req, res) => {
        try {
            const { userAddress, invitationCode } = req.body;
            console.log("invitationCode: ", invitationCode);

            const existAddress = await accountModel.findOne({ userAddress });
            if (existAddress) return "Connecting Wallet is successful!";

            let invitedBy = null;
            let isReferral = false;
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
                referralCode: invitedBy,
                isReferral: isReferral
            })

            return newUser;

        } catch (error) {
            throw new BadRequestError(error)
        }
    }

    static userDeposit = async (req, res) => {
        try {
            const { amount, userAddress } = req.body;

            const user = await accountModel.findOneAndUpdate(
                { userAddress },
                { $inc: { balance: amount } },
                { new: true }
            )
            if (!user) throw new BadRequestError("User not found");
            return user
        } catch (error) {
            throw new BadRequestError(error);
        }
    }

    static userInformation = async (req, res) => {
        try {
            const { userAddress } = req.body;

            const infor = await accountModel.findOne({ userAddress })
            return infor;

        } catch (error) {
            throw new BadRequestError(error);
        }
    }

    static getAllUserPagination = async (req, res) => {

    }

    static searchUserPagination = async (req, res) => {
        try {

        } catch (error) {
            throw new BadRequestError(error);
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