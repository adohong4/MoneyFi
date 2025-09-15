'use strict'

const accountModel = require('../models/user.models')
const bcrypt = require('bcrypt')
const { BadRequestError, AuthFailureError, NotFoundError } = require("../core/error.response");
const generateReferralCode = require("../utils/generateReferralCode")
const userModel = require('../models/user.models');

class ReferralService {
    static getReferrerRankPagination = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const pipeline = [
                // Nhóm theo referralCode và đếm số lượng
                {
                    $group: {
                        _id: "$referralCode",  // referralCode mà người khác nhập vào
                        totalReferrals: { $sum: 1 }
                    }
                },
                // Bỏ qua các referralCode null (user không nhập referralCode khi tạo)
                {
                    $match: { $and: [{ _id: { $ne: null } }, { _id: { $ne: "" } }] }
                },
                // Join để lấy thông tin của referrer (người mời)
                {
                    $lookup: {
                        from: "users",           // collection accountModel
                        localField: "_id",          // referralCode
                        foreignField: "invitationCode", // invitationCode của user mời
                        as: "referrer"
                    }
                },
                // Lấy 1 user duy nhất (vì invitationCode là unique)
                {
                    $unwind: "$referrer"
                },
                // Chọn field cần trả về
                {
                    $project: {
                        _id: 0,
                        referrerAddress: "$referrer.userAddress",
                        invitationCode: "$referrer.invitationCode",
                        totalReferrals: 1
                    }
                },
                // Sort theo số lượng referral giảm dần
                { $sort: { totalReferrals: -1 } },
                // Paginate
                { $skip: skip },
                { $limit: limit }
            ];

            const results = await accountModel.aggregate(pipeline);

            // Tổng số referrers có ít nhất 1 referral
            const totalReferrers = await accountModel.aggregate([
                { $match: { referralCode: { $ne: null } } },
                { $group: { _id: "$referralCode" } },
                { $count: "count" }
            ]);

            const totalPages = Math.ceil(
                (totalReferrers[0]?.count || 0) / limit
            );

            return {
                metadata: {
                    ranking: results,
                    currentPage: page,
                    totalPages,
                    totalReferrers: totalReferrers[0]?.count || 0,
                    limit
                }
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ReferralService;