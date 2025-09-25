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
            const { userAddress } = req.params;
            const infor = await accountModel.findOne({ userAddress })
            return infor;

        } catch (error) {
            throw new BadRequestError(error);
        }
    }

    static getAllUserPagination = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const users = await accountModel.find()
                .sort({ balance: -1 })
                .skip(skip)
                .limit(limit)
                .exec();

            const totalUser = await accountModel.countDocuments();
            const totalPages = Math.ceil(totalUser / limit);

            return {
                metadata: {
                    users,
                    currentPage: page,
                    totalPages,
                    totalUser,
                    limit
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static searchUserPagination = async (req, res) => {
        try {
            const { search } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // filter
            let filter = { isActive: true };
            if (search) {
                filter.$or = [
                    { userAddress: { $regex: search, $options: "i" } },
                    { invitationCode: { $regex: search, $options: "i" } },
                    { referralCode: { $regex: search, $options: "i" } }
                ];
            }

            const users = await accountModel.find(filter)
                .sort({ balance: -1 })
                .skip(skip)
                .limit(limit)
                .exec();

            const totalUsers = await users.countDocuments(filter);
            const totalPages = Math.ceil(totalUsers / limit);

            return {
                metadata: {
                    users,
                    currentPage: page,
                    totalPages,
                    totalUsers,
                    limit
                }
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = AccountService;