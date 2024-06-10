const Transaction = require('../models/Transaction');
const asyncWrapper = require('../middleware/async');
const mongoose = require('mongoose');
const { createCustomError } = require("../errors/customError");
const User = require("../models/User");
const Asset = require("../models/Asset");

//Create a Buy Transaction
const createBuyTransaction = asyncWrapper(async (req,res,next) => {
    const { buyerId, assetId, amount, price, totalCost } = req.body;

    if (!mongoose.Types.ObjectId.isValid(buyerId) || !mongoose.Types.ObjectId.isValid(assetId)) {
        return next(createCustomError("Invalid Id format", 200));
    } 

    // Validate customer ID
    const user = await User.findById(buyerId);
    if (!user) {
       return next(createCustomError(`No user found with id : ${buyerId}`, 200));
    }

    // Validate Asset
    const asset = await Asset.findById(assetId);
    if (!asset) {
       return next(createCustomError(`No product found with id : ${assetId}`, 200));
    }

    //create a new Transaction document
    const newTransaction = new Transaction({
        type: 'buy',
        buyerId,
        assetId,
        amount,
        price,
        totalCost
    })

    await newTransaction.save();

    res.status(200).json({ success: true, message: 'Transaction created successfully' , data: newTransaction, code: 200});
})

const getAllTransactionHistoryByIdForAUser = asyncWrapper(async (req,res,next) => {
    const { id: userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(createCustomError("Invalid Id format", 200));
      }

    const searchUser = await User.findOne({ _id: userId });

    //check if it is the same user making the request
    if (searchUser._id.toString() !== req.user.id){
        return next(createCustomError(`You can not perform this operation`, 200));
      }

      const transactions = await Transaction.find({
        $or: [
          { buyerId: userId },
          { swapperId: userId },
          { sharerId: userId },
          { recipientId: userId }
        ]
      })
        // Populate fields based on transaction type
    const populatedTransactions = await Promise.all(transactions.map(async (transaction) => {
        switch (transaction.type) {
          case 'buy':
            return await Transaction.findById(transaction._id)
              .populate('buyerId')
              .populate('assetId');
          case 'swap':
            return await Transaction.findById(transaction._id)
              .populate('swapperId')
              .populate('assetIdFrom')
              .populate('assetIdTo');
          case 'share':
            return await Transaction.findById(transaction._id)
              .populate('sharerId')
              .populate('recipientId')
              .populate('assetId');
          default:
            return transaction;
        }
      }));
  
      if (!populatedTransactions || populatedTransactions.length === 0) {
        return next(createCustomError(`No transactions found for this user ${userId}`, 200));
      }
  
  

      res.status(200).json({success: true, message: "Fetch Successful", data: populatedTransactions, code:200})
})

const getAllPendingTransaction = asyncWrapper(async(req,res,next) => {
    const transactions = await Transaction.find({status: 'pending'})

       // Populate fields based on transaction type
       const populatedTransactions = await Promise.all(transactions.map(async (transaction) => {
        switch (transaction.type) {
          case 'buy':
            return await Transaction.findById(transaction._id)
              .populate('buyerId')
              .populate('assetId');
            }
        }));   
        
    if (!populatedTransactions || populatedTransactions.length === 0) {
            return next(createCustomError(`No pending transactions`, 200));
          }
     res.status(200).json({success: true, message: "Fetch Successful", data: populatedTransactions, code:200});
        
      
})

//For Approving Buy Transaction: Changing Status to Completed
const approveTransaction = asyncWrapper(async (req,res,next) => {
    const { id: transactionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
        return next(createCustomError("Invalid id format", 200));
    }

    let transaction = Transaction.findOne({ _id: transactionId});

    if(!transaction) {
        return next(createCustomError(`No transaction found wiith id: ${transactionId}`,200));
    }

    transaction = await Transaction.findByIdAndUpdate({_id: transactionId }, {status: 'completed'},{
        new: true,
        runValidators: true,
    });

    res.status(200).json({success: true, message: 'Transaction Approved', code: 200}); 
})

//For disapproving Buy TRansaction: Changing status to failed
const disapproveTransaction = asyncWrapper(async (req,res,next) => {
    const { id: transactionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
        return next(createCustomError("Invalid id format", 200));
    }

    let transaction = Transaction.findOne({ _id: transactionId});

    if(!transaction) {
        return next(createCustomError(`No transaction found wiith id: ${transactionId}`,200));
    }
    transaction = await Transaction.findByIdAndUpdate({_id: transactionId }, {status: 'failed'},{
        new: true,
        runValidators: true,
    });

    res.status(200).json({success: true, message: 'Transaction Disapproved', code: 200}); 
})

module.exports = {
   createBuyTransaction,
   getAllTransactionHistoryByIdForAUser,
   getAllPendingTransaction,
   approveTransaction,
   disapproveTransaction,
}