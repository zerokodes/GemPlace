const UserAsset = require("../models/UserAsset");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const User = require("../models/User");
const Asset = require("../models/Asset");


// CREATE a new UserAsset: Similar to buying an asset
const createUserAsset = asyncWrapper(async (req, res) => {
  const {asset} = req.body;
 
    // Check if userAsset already exists with request user
    const existingUserAssetByUserID = await UserAsset.findOne({ asset });

    if ( existingUserAssetByUserID ){
      if (existingUserAssetByUserID.user._id.toString() === req.user.id  ) {
        return res.status(400).json({ message: `UserAsset already exists with this User: ${req.user.id}`  });
      }
    }
    

    const newUserAsset = new UserAsset ({
      user: req.user.id,
      asset
    });

    const savedUserAsset= await newUserAsset.save();

    const user = await User.findById({_id: savedUserAsset.user})
      user.userAssets.push(savedUserAsset);
      await user.save();

    const saveAsset = await Asset.findById({_id: savedUserAsset.asset})
      saveAsset.userAssets.push(savedUserAsset);
      await saveAsset.save();
      
    
    res.status(201).json({ savedUserAsset});
  });


    // GET all UserAssets
const getAllUserAssets = asyncWrapper(async (req, res) => {
    const userAssets = await UserAsset.find({});
    res.status(200).json({ userAssets });
  });


     //GET a UserAsset
const getUserAsset = asyncWrapper(async (req, res, next) => {
    const { id: userAssetID } = req.params;
    const userAsset = await UserAsset.findOne({ _id: userAssetID });
  
    if (!userAsset) {
      return next(createCustomError(`No UserAsset found with id : ${userAssetID}`, 404));
    }

    // check if it is the same user who created the userAsset or an Admin

    const userId = req.user.id; // User ID from JWT token
    const isAdmin = req.user.role === 'Admin';

    
    if (userId !== userAsset.user._id.toString() && !isAdmin){
      return next(createCustomError(`You can't View this UserAsset : ${userAssetID}`, 403));
    }
  
    console.log(userAsset.user.currentBalance)
    res.status(200).json({ userAsset });
  });


   // UPDATE a  UserAsset: Similar to Top up UserAsset
const topUpUserAsset = asyncWrapper(async (req, res, next) => {
    const { id: userAssetID } = req.params;
    let searchUserAsset = await UserAsset.findOne({ _id: userAssetID });
   
    if (!searchUserAsset) {
      return next(createCustomError(`No UserAsset found with id : ${userAssetID}`, 404));
    }
    
    // amount to be added
    const amount = req.body.amount;
    searchUserAsset = await UserAsset.findOneAndUpdate({ _id: userAssetID },{$inc: {currentBalance:amount}}, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ searchUserAsset });
  });


      // DELETE a UserAsset

const deleteUserAsset = asyncWrapper(async (req, res, next) => {
    const { id: userAssetID } = req.params;
    let searchUserAsset = await UserAsset.findOne({ _id: userAssetID });
   
    if (!searchUserAsset) {
      return next(createCustomError(`No UserAsset found with id : ${userAssetID}`, 404));
    }
   
    searchUserAsset = await UserAsset.findOneAndDelete({ _id: userAssetID });
  
    res.status(200).json({ searchUserAsset });
  });



    // Conversion from USDT to other assets
    const assetToUsdt = asyncWrapper(async (req, res, next) => {
        const { id: userAssetID } = req.params;
        let searchUserAsset = await UserAsset.findOne({ _id: userAssetID });
        
        if (!searchUserAsset) {
          return next(createCustomError(`No UserAsset found with id : ${userAssetID}`, 404));
        }

        const amount = req.body.amount;
        if(amount > searchUserAsset.currentBalance ){
          return next(createCustomError(`Insufficient Balance`, 404));
        }

        //The Usdt Asset
        const otherUserAssetID = req.body.otherUserAssetID
        let otherUserAsset = await UserAsset.findOne({ _id: otherUserAssetID });

        if (!otherUserAsset) {
          return next(createCustomError(`No UserAsset found with id : ${otherUserAssetID}`, 404));
        }

        //check if it is the same user who has the asset
       const userID = req.user.id;
       c
       if (searchUserAsset.user._id.toString() !== userID && otherUserAsset.user._id.toString() !== userID){
         return next(createCustomError(`You can not perform this operation`, 403));
       }
        
        const asset = await Asset.findById({_id: searchUserAsset.asset})

        //conversion of otherUserAsset to usdt equivalent
        const convertedValue = amount * asset.usdtEquivalent;



        // Deduct amount from other asset balance
         searchUserAsset = await UserAsset.findOneAndUpdate({ _id: userAssetID },{$inc: {currentBalance: -amount}}, {
          new: true,
          runValidators: true,
        });

        // Add converted value to USDT balance
        otherUserAsset = await UserAsset.findOneAndUpdate({ _id: otherUserAssetID },{$inc: {currentBalance: convertedValue}}, {
          new: true,
          runValidators: true,
        }); 


        res.status(200).json({ searchUserAsset, otherUserAsset, asset, convertedValue });

        
    })


    //convert from other asset to usdt
    const usdtToAsset = asyncWrapper(async (req, res, next) => {
      const { id: userAssetID } = req.params;
      let searchUserAsset = await UserAsset.findOne({ _id: userAssetID });
      
      if (!searchUserAsset) {
        return next(createCustomError(`No UserAsset found with id : ${userAssetID}`, 404));
      }

      const amount = req.body.amount;
      if(amount > searchUserAsset.currentBalance ){
        return next(createCustomError(`Insufficient Balance`, 404));
      }

      
      const otherUserAssetID = req.body.otherUserAssetID
      let otherUserAsset = await UserAsset.findOne({ _id: otherUserAssetID });

      if (!otherUserAsset) {
        return next(createCustomError(`No UserAsset found with id : ${otherUserAssetID}`, 404));
      }
      
       //check if it is the same user who has the asset
       const userID = req.user.id;
       if (searchUserAsset.user._id.toString() !== userID && otherUserAsset.user._id.toString() !== userID){
         return next(createCustomError(`You can not perform this operation`, 403));
       }

      const asset = await Asset.findById({_id: otherUserAsset.asset})

      //conversion of usdt equivalent to otherUserAsset
      const convertedValue = amount / asset.usdtEquivalent;



      // Deduct amount from USDT balance
       searchUserAsset = await UserAsset.findOneAndUpdate({ _id: userAssetID },{$inc: {currentBalance: -amount}}, {
        new: true,
        runValidators: true,
      });

      // Add converted value to otherAsset
      otherUserAsset = await UserAsset.findOneAndUpdate({ _id: otherUserAssetID },{$inc: {currentBalance: convertedValue}}, {
        new: true,
        runValidators: true,
      }); 


      res.status(200).json({ searchUserAsset, otherUserAsset });

      
  })

      // Share UserAsset amoung users
      const shareUserAsset = asyncWrapper(async (req, res, next) => {
        const senderUserAssetID = req.body.senderUserAssetID
        let senderUserAsset = await UserAsset.findOne({ _id: senderUserAssetID });

        if (!senderUserAsset) {
          return next(createCustomError(`No UserAsset found with id : ${senderUserAssetID}`, 404));
        }

        if (senderUserAsset.user._id.toString() !== req.user.id){
          return next(createCustomError(`This asset does not belong to you`, 403))
        }


        //Input amount to be sent
        const amount = req.body.amount;
        if(amount > senderUserAsset.currentBalance ){
          return next(createCustomError(`Insufficient Balance`, 404));
        }

        // Search for receiver
        const {id: receiverID} = req.params;
        let receiver = await User.findOne({ _id: receiverID })
      
        if (!receiver) {
          return next(createCustomError(`No User found with id : ${receiverID}`, 404));
        }

        //search for receiver's asset to be sent
        const receiverUserAssetID = req.body.receiverUserAssetID
        let receiverUserAsset = await UserAsset.findOne({ _id: receiverUserAssetID });

        if (!receiverUserAsset) {
          return next(createCustomError(`No UserAsset found with id : ${receiverUserAssetID}`, 404));
        }

        if (receiverUserAsset.user._id.toString() !== receiverID){
          return next(createCustomError(`This Asset does not belong to the receiver`, 403))
        }

        if (senderUserAsset.asset._id.toString() !== receiverUserAsset.asset._id.toString() ){
          return next(createCustomError(`Asset Address didn't match please input same asset type address`, 404));
        }

        //deduct amount from sender's userAsset
        senderUserAsset = await UserAsset.findOneAndUpdate({ _id: senderUserAssetID },{$inc: {currentBalance: -amount}}, {
          new: true,
          runValidators: true,
        });


        //add amount to receiver's userAsset
        receiverUserAsset = await UserAsset.findOneAndUpdate({ _id: receiverUserAssetID },{$inc: {currentBalance: amount}}, {
          new: true,
          runValidators: true,
        });

        res.status(200).json({ senderUserAsset, receiverUserAsset });

  })


      // Delete all User Assets
const deleteAllUserAssets = asyncWrapper(async (req, res) => {
  const userAssets = await UserAsset.deleteMany({});
  res.status(200).json({ userAssets });
});

  module.exports = {
    createUserAsset,
    getAllUserAssets,
    getUserAsset,
    topUpUserAsset,
    deleteUserAsset,
    usdtToAsset,
    assetToUsdt,
    shareUserAsset,
    deleteAllUserAssets,
  };