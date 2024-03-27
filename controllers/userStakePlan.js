const UserStakePlan = require("../models/UserStakePlan");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const UserAsset = require("../models/UserAsset");
const StakePlan = require("../models/StakePlan");




// CREATE a new UserStakePlan: Similar to staking
const stake = asyncWrapper(async (req, res, next) => {
    const { stakePlan, numOfDays, amount, userAssetID} = req.body;
    

    let userAsset = await UserAsset.findOne({ _id: userAssetID });
    if (!userAsset){
        return next(createCustomError(`No userAsset found with id : ${userAssetID}`, 404));
    }

    if(userAsset.user._id.toString() !== req.user.id){
        return next(createCustomError(`UserAsset does not belong to this user`, 403)); 
    }
    
    if(amount > userAsset.currentBalance ){
        return next(createCustomError(`Insufficient Balance`, 404));
      }

      

    // Calculate the total amount to be returned
    const searchStakePlan = await StakePlan.findById({_id: stakePlan});

    if (!searchStakePlan){
        return next(createCustomError(`No stake plan found with id : ${stakePlan}`, 404));
    }
    const totalROI = searchStakePlan.ROIPerDay * numOfDays;
    const returnAmount = totalROI + amount;

    const newUserStakePlan = new UserStakePlan ({
        userAssetID,
        stakePlan,
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

    

    res.status(201).json({ savedUserStakePlan, userAsset});
  });


  const returnStake = asyncWrapper(async (req,res,next) =>{
    const currentDate = new Date();

    const expiredUserStakePlans = await UserStakePlan.find({ endDate: { $lt: currentDate } });
    console.log(currentDate)
    if (!expiredUserStakePlans){
        return next(createCustomError(`No UserStake Plan found or is expired`, 404));
    }

    for (const userStakePlan of expiredUserStakePlans) {
      // Call your processing function for each expired document
      const { userAssetID, expectedReturnAmount } = userStakePlan;
      console.log(userAssetID, expectedReturnAmount)
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




  module.exports = {
   stake,
   returnStake,
   getAllUserStakePlans,
   deleteUserStakePlan,
   deleteAllUserStakePlans,
  };