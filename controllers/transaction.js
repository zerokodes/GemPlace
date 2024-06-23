const Transaction = require('../models/Transaction');
const asyncWrapper = require('../middleware/async');
const mongoose = require('mongoose');
const { createCustomError } = require("../errors/customError");
const User = require("../models/User");
const Asset = require("../models/Asset");
const UserAsset = require('../models/UserAsset');

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
      }).sort({ createdAt: -1 })
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
          case 'withdrawal':
            return await Transaction.findById(transaction._id)
              .populate('recipientId')
              .populate('usdtUserAsset');
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

    let transaction = await Transaction.findOne({ _id: transactionId});

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

    let transaction = await Transaction.findOne({ _id: transactionId});

    if(!transaction) {
        return next(createCustomError(`No transaction found wiith id: ${transactionId}`,200));
    }
    transaction = await Transaction.findByIdAndUpdate({_id: transactionId }, {status: 'failed'},{
        new: true,
        runValidators: true,
    });

    res.status(200).json({success: true, message: 'Transaction Disapproved', code: 200}); 
})

//Create a withdrawal request
const placeWithdrawalRequest = asyncWrapper(async(req,res,next) => {
  const { recipientId, usdtUserAsset, amount, walletAddress, blockChainNetwork } = req.body;

if (!mongoose.Types.ObjectId.isValid(recipientId) || !mongoose.Types.ObjectId.isValid(usdtUserAsset)) {
    return next(createCustomError("Invalid id format", 200));
 }


 // Validate customer ID
 const user = await User.findById(recipientId);
 if (!user) {
    return next(createCustomError(`No user found with id : ${recipientId}`, 200));
 }

 //Validate userAsset ID
 const userAsset = await UserAsset.findById(usdtUserAsset);
 if (!userAsset) {
  return next(createCustomError(`No userAsset found with id : ${usdtUserAsset}`, 200));
}

//Check if userAsset is a USDT Asset
const asset = await Asset.findOne({_id: userAsset.asset})
if (!asset) {
  return next(createCustomError(`No Asset found with id : ${userAsset.asset}`, 200));
}

if(asset.assetName !== 'USDT'){
  return next(createCustomError('You can only withdral USDT please input your USDT userAsset', 200));
}

if(amount > userAsset.currentBalance ){
  return next(createCustomError(`Insufficient Balance`, 200));
}

 //create a new Transaction document
 const newTransaction = new Transaction({
  type: 'withdrawal',
  recipientId,
  usdtUserAsset,
  amount,
  walletAddress,
  blockChainNetwork
})

await newTransaction.save();

res.status(200).json({ success: true, message: 'Transaction created successfully' , data: newTransaction, code: 200});
})

const approveWithdrawal = asyncWrapper(async(req,res,next) => {

  const { id: transactionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
        return next(createCustomError("Invalid id format", 200));
    }

    let transaction = await Transaction.findOne({ _id: transactionId});

    if(!transaction) {
        return next(createCustomError(`No transaction found wiith id: ${transactionId}`,200));
    }

    if(transaction.status.toString() === 'completed'){
      return next(createCustomError('Transaction already approved',200));
    }

    const userAsset = await UserAsset.findOne({_id: transaction.usdtUserAsset});

    if(!userAsset) {
      return next(createCustomError(`No userAsset found wiith id: ${transaction.usdtUserAsset}`,200));
  }

  if(transaction.amount > userAsset.currentBalance){
    return next(createCustomError(`Insufficient Balance`, 200));
  }

  //deduct amount from userAsset
  const amount = transaction.amount
  const userAsserId = userAsset._id
  await UserAsset.findOneAndUpdate({ _id: userAsserId },{$inc: {currentBalance: -amount}}, {
    new: true,
    runValidators: true,
  });

  transaction = await Transaction.findByIdAndUpdate({_id: transactionId }, {status: 'completed'},{
    new: true,
    runValidators: true,
});

res.status(200).json({success: true, message: 'Withdrawal Approved', code: 200});

})

const disapproveWithdrawal = asyncWrapper(async(req,res,next) => {

  const { id: transactionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
        return next(createCustomError("Invalid id format", 200));
    }

    let transaction = await Transaction.findOne({ _id: transactionId});

    if(!transaction) {
        return next(createCustomError(`No transaction found wiith id: ${transactionId}`,200));
    }

    if(transaction.status.toString() === 'completed'){
      return next(createCustomError('Transaction already approved',200));
    }

    if(transaction.status.toString() === 'failed'){
      return next(createCustomError('Transaction already disapproved',200));
    }

    transaction = await Transaction.findByIdAndUpdate({_id: transactionId }, {status: 'failed'},{
      new: true,
      runValidators: true,
  });

  res.status(200).json({success: true, message: 'Withdrawal Disapproved', code: 200});
})


module.exports = {
   createBuyTransaction,
   getAllTransactionHistoryByIdForAUser,
   getAllPendingTransaction,
   approveTransaction,
   disapproveTransaction,
   placeWithdrawalRequest,
   approveWithdrawal,
   disapproveWithdrawal
}