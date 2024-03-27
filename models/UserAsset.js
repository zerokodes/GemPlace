const mongoose = require("mongoose");
const {Schema} = require('mongoose');


const UserAssetSchema = new mongoose.Schema(
    {
        currentBalance: {
            type: Number,
            default: 0,
        },
        asset: {
            type: Schema.Types.ObjectId,
            ref: 'Asset',
            required: true
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        userStakePlans: [{
            type: Schema.Types.ObjectId,
            ref: 'UserStakePlan'
        }],
    },
    { timestamps: true}
)


module.exports = mongoose.model("UserAsset", UserAssetSchema);