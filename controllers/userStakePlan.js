const UserStakePlan = require("../models/UserStakePlan");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const UserAsset = require("../models/UserAsset");
const StakePlan = require("../models/StakePlan");
const User = require("../models/User");
const Asset = require("../models/Asset");
const mongoose = require('mongoose');




// CREATE a new UserStakePlan: Similar to staking
const stake = asyncWrapper(async (req, res, next) => {
    const { stakePlanID, numOfDays, amount, userAssetID} = req.body;

    console.log("first")
    if (!mongoose.Types.ObjectId.isValid(userAssetID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    console.log("second")
    if (!mongoose.Types.ObjectId.isValid(stakePlanID)) {
      return next(createCustomError("Invalid Id format", 200));
    }
    

    let userAsset = await UserAsset.findOne({ _id: userAssetID });
    if (!userAsset){
        return next(createCustomError(`No userAsset found with id : ${userAssetID}`, 200));
    }

    if(userAsset.user._id.toString() !== req.user.id){
        return next(createCustomError(`UserAsset does not belong to this user`, 200)); 
    }
    
    if(amount > userAsset.currentBalance ){
        return next(createCustomError(`Insufficient Balance`, 200));
      }

      

    // Calculate the total amount to be returned
    const searchStakePlan = await StakePlan.findById({_id: stakePlanID});

    if (!searchStakePlan){
        return next(createCustomError(`No stake plan found with id : ${stakePlanID}`, 200));
    }
    const totalROI = searchStakePlan.ROIPerDay * numOfDays;
    const returnAmount = totalROI + amount;

    const newUserStakePlan = new UserStakePlan ({
        userAsset: userAssetID,
        stakePlan: stakePlanID,
        amount,
        numOfDays
      });


    newUserStakePlan.expectedReturnAmount = returnAmount;
    

    const savedUserStakePlan= await newUserStakePlan.save();

    // Deduct amount from user asset balance
    userAsset = await UserAsset.findOneAndUpdate({ _id: userAssetID },{$inc: {currentBalance: -amount}}, {
        new: true,
        runValidators: true,
      });

      // Save userStakePlan in UserAsset
      userAsset.userStakePlans.push(savedUserStakePlan);
      await userAsset.save();

    //Save userStakePlan in Stake Plan
    searchStakePlan.userStakePlans.push(savedUserStakePlan);
      await searchStakePlan.save();

      const data = {
        amount
      }
    

    res.status(200).json({success:true, message:"Staked successful", data, code:200});
  });


  
  //returns stake after staking period is completed
  const returnStake = asyncWrapper(async (req,res,next) =>{
    const currentDate = new Date();
    const currentDateSeparator = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());


    const expiredUserStakePlans = await UserStakePlan.find({ endDate: { $lt: currentDateSeparator } });
    if (!expiredUserStakePlans){
        return next(createCustomError(`No UserStake Plan found or is expired`, 404));
    }

    for (const userStakePlan of expiredUserStakePlans) {
      // Call your processing function for each expired document
      const { userAssetID, expectedReturnAmount } = userStakePlan;
      const userAsset = await UserAsset.findOneAndUpdate({ _id: userAssetID }, {$inc: {currentBalance: +expectedReturnAmount}}, {
        new: true,
        runValidators: true,
      });
      // Remove the staking record from the database
      await UserStakePlan.findByIdAndDelete(userStakePlan._id);
    
    }
    res.status(200).json({expiredUserStakePlans});
  })

  /**const returnStake = asyncWrapper(async (req, res, next) => {

    const { id: userStakePlanID } = req.params;
    let searchUserStakePlan = await UserStakePlan.findOne({ _id: userStakePlanID });
   
    if (!searchUserStakePlan) {
      return next(createCustomError(`No UserStake Plan found with id : ${userStakePlanID}`, 404));
    }

    const userAssetID = req.body.userAssetID
    let userAsset = await UserAsset.findOne({ _id: userAccessID})

    if (!userAsset) {
        return next(createCustomError(`No userAsset found with id : ${userAssetID}`, 404));
      }
    
    if(!userAsset.user.equals(searchUserStakePlan.user)){
        return next(createCustomError(`UserAsset does not belong to this user`, 404));
    }


    
    userAsset = await UserAsset.findOneAndUpdate({ _id: userAssetID }, {$inc: {currentBalance: +searchUserStakePlan.expectedReturnAmount}}, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ userAsset });
   

  })**/


    // GET all USER Stake Plan
const getAllUserStakePlans = asyncWrapper(async (req, res) => {
    const userStakePlans = await UserStakePlan.find({});
    res.status(200).json({ userStakePlans });
  });

        // DELETE a User Stake PLan

const deleteUserStakePlan = asyncWrapper(async (req, res, next) => {
    const { id: userStakePlanID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userStakePlanID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    let searchUserStakePlan = await UserStakePlan.findOne({ _id: userStakePlanID });
   
    if (!searchUserStakePlan) {
      return next(createCustomError(`No Use Stake Plan found with id : ${userStakePlanID}`, 404));
    }
   
    searchUserStakePlan = await UserStakePlan.findOneAndDelete({ _id: userStakePlanID });
  
    res.status(200).json({ searchUserStakePlan });
  });


      // Delete all User Stake Plans
const deleteAllUserStakePlans = asyncWrapper(async (req, res) => {
    const userStakePlans = await UserStakePlan.deleteMany({});
    res.status(200).json({ userStakePlans });
  });


  //get all userStakePlan belonging to a user 
  const getUserStakePlans = asyncWrapper(async(req,res,next) =>{
    const {id: userID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    let searchUser = await User.findOne({ _id: userID });

    if (!searchUser) {
      return next(createCustomError(`No user found with id : ${userID}`, 200));
    }

    //check if it is the same user making the request
    if (searchUser._id.toString() !== req.user.id){
      return next(createCustomError(`You can not perform this operation`, 200));
    }

    const userAssets = searchUser.userAssets;

    // Initialize an empty array to store userStakePlan results
    let userStakePlanDetails = [];

     // Loop through the userStakePlan and save them in the userStakePlanResults array
     for (const userAsset of userAssets) {
      const  searchUserAsset = await UserAsset.findOne({_id: userAsset});

      if(!searchUserAsset) {
        return next(createCustomError(`No UserAsset found with id : ${userAsset}`, 200));
      }

      const assetID = searchUserAsset.asset;

      const searchAsset = await Asset.findOne({_id: assetID})

      if (!searchAsset) {
        return next(createCustomError(`No Asset found with id : ${assetID}`, 200));
      }


      const userStakePlans = searchUserAsset.userStakePlans

      for(const userStakePlan of userStakePlans){
        const searchUserStakePlan = await UserStakePlan.findOne({_id: userStakePlan});

        if(!searchUserStakePlan){
          return next(createCustomError(`No UserStakePlan found with id : ${userStakePlan}`, 200));
        }

        const stakePlanID = searchUserStakePlan.stakePlan;

        const searchStakePlan = await StakePlan.findOne({_id: stakePlanID})

        if (!searchStakePlan) {
          return next(createCustomError(`No StakePlan found with id : ${stakePlanID}`, 200));
        }
        console.log("push to array")
        userStakePlanDetails.push({
          userStakePlanID: searchUserStakePlan._id,
          amount: searchUserStakePlan.amount,
          numOfDays: searchUserStakePlan.numOfDays,
          startDate: searchUserStakePlan.startDate,
          endDate: searchUserStakePlan.endDate,
          expectedReturnAmount: searchUserStakePlan.expectedReturnAmount,
          stakePlanDetails: [{
            stakePlanID: searchStakePlan._id,
            ROIPerDay: searchStakePlan.ROIPerDay,

          }],
          userAssetDetails: [{
            userAssetID: searchUserAsset._id,
            currentBalance: searchUserAsset.currentBalance,
            AssetDetails: [{
              assetID: searchAsset._id,
              assetName: searchAsset.assetName,
              usdtEquivalent: searchAsset.usdtEquivalent
            }],
            UserDetails: [{
              userID: searchUser._id,
              email: searchUser.email
            }],
          }]
        })
      }
     }

     const data = {
      userStakePlanDetails
     }
     res.status(200).json({success: true, message: "Successful", data, code:200})
  })




  module.exports = {
   stake,
   returnStake,
   getAllUserStakePlans,
   deleteUserStakePlan,
   deleteAllUserStakePlans,
   getUserStakePlans,
  };