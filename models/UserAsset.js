const mongoose = require("mongoose");
const {Schema} = require('mongoose');


const UserAssetSchema = new mongoose.Schema(
    {
        currentBalance: {
            type: Number,
            required: true
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
        }
    },
    { timestamps: true}
)

module.exports = mongoose.model("UserAsset", UserAssetSchema);