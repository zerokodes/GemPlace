const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const TransactionSchema = new mongoose.Schema(
    {
        type: { type: String, required: true, enum: ['buy', 'swap', 'share']},
        timestamp: { type: Date, required: true, default: Date.now },
        status: { type: String, required: true, enum: ['pending', 'completed', 'failed'], default: 'pending' },

        // Fields for Token Buying
        buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
        amount: { type: Number },
        price: { type: Number },
        totalCost: { type: Number },

         // Fields for Token Swapping
        swapperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        assetIdFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
        assetIdTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
        amountFrom: { type: Number },
        amountTo: { type: Number },
        exchangeRate: { type: Number },
        

        // Fields for Token Sharing
        sharerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: { type: Number },
    },
)

module.exports = mongoose.model('Transaction', TransactionSchema)