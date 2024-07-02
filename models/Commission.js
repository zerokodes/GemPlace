const mongoose = require("mongoose");
const {Schema} = require('mongoose');

const CommissionSchema = new mongoose.Schema(
    {
        fee:{
            type: Number,
            required: [true,'Please provide fee for commission'],
        },
        commissionType:{
            type: String,
            enum: ["Promotion"],
            unique: true
        }
    },
    { timestamps: true}
);

module.exports = mongoose.model("Commission", CommissionSchema);