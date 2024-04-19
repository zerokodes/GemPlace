const mongoose = require("mongoose");
const {Schema} = require('mongoose');


const StakePlanSchema = new mongoose.Schema(
    {
        ROIPerDay: {type: Number, required: [true,"Please input Percentage ROI per day"]},
        asset: { 
            type: Schema.Types.ObjectId,
            ref: 'Asset',
            required: true
        },
        userStakePlans: [{
            type: Schema.Types.ObjectId,
            ref: 'UserStakePlan'
        }],

        startDate: {type: Date, default: null },

        endDate: {type: Date, default: null}

    },
    { timestamps: true }
)

module.exports = mongoose.model("StakePlan", StakePlanSchema);