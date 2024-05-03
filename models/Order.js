const mongoose = require("mongoose");
const {Schema} = require('mongoose');

const OrderSchema = new mongoose.Schema(
    {
    products: { type: Schema.Types.ObjectId, ref: 'Product' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    totalPrice: {type: Number},
    paymentMethod: {
        type: String,
        enum: ["User Token", "Direct USDT Transfer", "Bank Transfer"]
    },
    status: {
        type: String,
        enum: ["Success","Failed","Pending"],
        default: "Pending"
    }
    },
    { timestamps: true }
)

const Order = mongoose.model('Sale', OrderSchema);