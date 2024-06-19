const StakePlan = require("../models/StakePlan");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const Asset = require("../models/Asset");
const mongoose = require('mongoose');
const UserStakePlan = require("../models/UserStakePlan");
const UserAsset = require("../models/UserAsset");

// CREATE a new Stake Plan
const createStakePlan = asyncWrapper(async (req, res, next) => {
    const {assetID,  ROIPerDay, startDate, endDate} = req.body

    // Initialize an empty array to store stakePlan results
    let stakePlanDetails = [];

    if (!mongoose.Types.ObjectId.isValid(assetID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    console.log("save")
    //console.log(startDate, endDate)
    const newStakePlan = new StakePlan ({
      ROIPerDay,
      asset: assetID,
      startDate,
      endDate
    });

   
    const asset = await Asset.findById({_id: assetID})

    if (!asset){
        return next(createCustomError(`No Asset found with id : ${assetID}`, 200));
    }


    const savedStakePlan= await newStakePlan.save();

      asset.stakePlans.push(savedStakePlan);
      await asset.save();
  
      stakePlanDetails.push({
        id: savedStakePlan._id,
        ROIPerDay: savedStakePlan.ROIPerDay,
        AssetDetails: [{
          id: asset._id,
          assetName: asset.assetName,
          usdtEquivalent: asset.usdtEquivalent
        }],
        startDate: startDate,
        endDate: endDate,
        // Include other asset fields as needed
      });


      const data = {
        stakePlanDetails
      }

    res.status(200).json({success:true, message:"Stake Plan created successfully", data, code: 200});
  });



   // GET all Stake Plan
const getAllStakePlans = asyncWrapper(async (req, res,next) => {
    const stakePlans = await StakePlan.find({});

    // Initialize an empty array to store asset results
    let stakePlanDetails = [];

    for(const stakePlan of stakePlans){
      const asset = await Asset.findOne({ _id: stakePlan.asset });
  
      if (!asset) {
        return next(createCustomError(`No Asset found with id : ${stakePlan.asset}`, 200));
      }
      
      stakePlanDetails.push({
        id: stakePlan._id,
        ROIPerDay: stakePlan.ROIPerDay,
        AssetDetails: [{
          id: asset._id,
          assetName: asset.assetName,
          usdtEquivalent: asset.usdtEquivalent
        }],
        startDate: stakePlan.startDate,
        endDate: stakePlan.endDate
        // Include other asset fields as needed
      });
      
      
    }

    const data = {
      stakePlanDetails
    }
    res.status(200).json({success:true, message:"Successful",data, code:200 });
  });


   //GET a Stake Plan
const getStakePlan = asyncWrapper(async (req, res, next) => {
    const { id: stakePlanID } = req.params;

    // Initialize an empty array to store stakePlan results
    let stakePlanDetails = [];

    if (!mongoose.Types.ObjectId.isValid(stakePlanID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    const stakePlan = await StakePlan.findOne({ _id: stakePlanID });
  
    if (!stakePlan) {
      return next(createCustomError(`No Stake Plan found with id : ${stakePlanID}`, 200));
    }

    const assetID = stakePlan.asset;
    const asset = await Asset.findById({_id: assetID})

    if (!asset){
      return next(createCustomError(`No Asset found with id : ${assetID}`, 200));
  }

  stakePlanDetails.push({
    id: stakePlan._id,
    ROIPerDay: stakePlan.ROIPerDay,
    AssetDetails: [{
      id: asset._id,
      assetName: asset.assetName,
      usdtEquivalent: asset.usdtEquivalent
    }],
    startDate: stakePlan.startDate,
    endDate: stakePlan.endDate
    // Include other asset fields as needed
  });
  
    const data = {
      stakePlanDetails
    }
    res.status(200).json({success:true, message:"Successful",data, code:200 });
  });



  // UPDATE a Stake PLan

const updateStakePlan = asyncWrapper(async (req, res, next) => {
    const { id: stakePlanID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(stakePlanID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    let searchStakePlan = await StakePlan.findOne({ _id: stakePlanID });
   
    if (!searchStakePlan) {
      return next(createCustomError(`No Stake Plan found with id : ${stakePlanID}`, 200));
    }
    
    searchStakePlan = await StakePlan.findOneAndUpdate({ _id: stakePlanID }, req.body, {
      new: true,
      runValidators: true,
    });

    const data = {
      searchStakePlan
    }
    res.status(200).json({success:true, message:"Update Successful",data, code:200 });
  });


      // DELETE a Stake PLan

const deleteStakePlan = asyncWrapper(async (req, res, next) => {
    const { id: stakePlanID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(stakePlanID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    // Start a session and transaction
    const session = await mongoose.startSession();
    session.startTransaction();

     // Delete the StakePlan
     const stakePlan = await StakePlan.findByIdAndDelete(stakePlanID).session(session);
    
     if (!stakePlan) {
      await session.abortTransaction();
      session.endSession();
      return next(createCustomError(`No StakePlan found with id : ${stakePlanID}`, 200));
    }

    // Delete stakePlan and remove references from Asset documents
    await Asset.updateOne(
      {stakePlans: stakePlanID},
      {$pull: {stakePlans: stakePlanID}}
    ).session(session);

    // Find all UserStakePlan associated with the StakePlan
    const userStakePlans = await UserStakePlan.find({ stakePlan: stakePlanID }).session(session);

    // Delete UserStakePlan and remove references from UserAsset documents
    for (const userStakePlan of userStakePlans) {
      // Remove the UserStakePlan reference from the UserAsset document
      await UserAsset.updateMany(
        { userStakePlans: userStakePlan._id },
        { $pull: { userStakePlans: userStakePlan._id } }
      ).session(session);


      // Delete the UserStakePlan
      await UserStakePlan.findByIdAndDelete(userStakePlan._id).session(session);
    }
    
    res.status(200).json({success: true, message: 'StakePlan and references deleted successfully', code:200 });
  });

      // Delete all Stake Plans
const deleteAllStakePlans = asyncWrapper(async (req, res) => {
    const stakePlans = await StakePlan.deleteMany({});
    const data = {
      stakePlans
    }
    res.status(200).json({success:true, message:"Delete Successful",data, code:200 });
  });


  module.exports = {
    createStakePlan,
    getAllStakePlans,
    getStakePlan,
    updateStakePlan,
    deleteStakePlan,
    deleteAllStakePlans,
  };