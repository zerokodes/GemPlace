const mongoose = require("mongoose");
const {Schema} = require('mongoose');

const AssetSchema = new mongoose.Schema(
    {
        assetName: {type: String, required: [true, "Please input Asset name"], unique: true},
        category: {
            type: String,
            enum: ['Gem Stone','Crypto'],
            required: [true, "please input asset category"]
        },
        userAssets: [{
            type: Schema.Types.ObjectId,
            ref: 'UserAsset',
        }],
        
        //usdt equivalent to 1 of the asset
        usdtEquivalent:{type: Number, required: [true, "Please input usdt equivalent of asset"]},

        stakePlans: [{
            type: Schema.Types.ObjectId,
            ref: 'StakePlan'
        }],
    },
    
    { timestamps: true}
)

module.exports = mongoose.model("Asset", AssetSchema);