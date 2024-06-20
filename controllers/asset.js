const Asset = require("../models/Asset");
const User = require("../models/User");
const UserAsset = require("../models/UserAsset");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const mongoose = require('mongoose');
const StakePlan = require("../models/StakePlan");
const UserStakePlan = require("../models/UserStakePlan");


// CREATE a new Asset
const createAsset = asyncWrapper(async (req, res) => {

  const { assetName, category, usdtEquivalent } = req.body;
  // Check if Asset already exists
  const existingAsset = await Asset.findOne({ assetName });
  if (existingAsset) {
    return res.status(400).json({ message: 'Asset already exists' });
  }

    const newAsset = new Asset ({
      assetName,
      category,
      usdtEquivalent,
    });
    const savedAsset= await newAsset.save();
    const data = {
      savedAsset
    }

    // Find all users
    const users = await User.find();

    // Create a user asset for each user
    const userAssets = users.map(user => ({
      user: user._id,
      asset: newAsset._id
    }));

     // Insert user assets into the UserAsset collection
     const createdUserAssets = await UserAsset.insertMany(userAssets);

     // Update each user with the new user assets
    for (const userAsset of createdUserAssets) {
      await User.findByIdAndUpdate(userAsset.user, {
        $push: { userAssets: userAsset._id }
      });
    }

     // Update the asset with the created user assets
     newAsset.userAssets = createdUserAssets.map(userAsset => userAsset._id);
     await newAsset.save();

    res.status(201).json({success:true, message: "Asset created successfully", data:data, code:200});
  });


  // GET all Assets
const getAllAssets = asyncWrapper(async (req, res) => {
    const assets = await Asset.find({});
    //const { resource} = assets._doc;
    const data =  [{
        assets
    }]
    res.status(200).json({ success: true, data });
  });


   //GET an Asset
const getAsset = asyncWrapper(async (req, res, next) => {
    const { id: assetID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assetID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    const asset = await Asset.findOne({ _id: assetID });
  
    if (!asset) {
      return next(createCustomError(`No Asset found with id : ${assetID}`, 404));
    }
    res.status(200).json({ asset });
  });



   // UPDATE an Asset

const updateAsset = asyncWrapper(async (req, res, next) => {
    const { id: assetID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assetID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    let searchAsset = await Asset.findOne({ _id: assetID });
   
    if (!searchAsset) {
      return next(createCustomError(`No Asset found with id : ${assetID}`, 404));
    }
    
    searchAsset = await Asset.findOneAndUpdate({ _id: assetID }, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ searchAsset });
  });

     // DELETE an Asset

const deleteAsset = asyncWrapper(async (req, res, next) => {
    const { id: assetID } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(assetID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    // Start a session and transaction
    const session = await mongoose.startSession();
    session.startTransaction();

     // Delete the asset
    const asset = await Asset.findByIdAndDelete(assetID).session(session);

    if (!asset) {
      await session.abortTransaction();
      session.endSession();
      return next(createCustomError(`No Asset found with id : ${assetID}`, 200));
    }


    // Find all UserAssets associated with the asset
    const userAssets = await UserAsset.find({ asset: assetID }).session(session);

    // Delete UserAssets and remove references from User documents
    for (const userAsset of userAssets) {
      // Remove the UserAsset reference from the User document
      await User.updateMany(
        { userAssets: userAsset._id },
        { $pull: { userAssets: userAsset._id } }
      ).session(session);

      // Delete the UserAsset
      await UserAsset.findByIdAndDelete(userAsset._id).session(session);
    }

     // Find and delete StakePlans associated with the asset
     const stakePlans = await StakePlan.find({ asset: assetID }).session(session);

     if(stakePlans.length > 0){
     for (const stakePlan of stakePlans) {

       // Find UserStakePlans associated with the StakePlan
       const userStakePlans = await UserStakePlan.find({ stakePlan: stakePlan._id }).session(session);
      // Delete UserStakePlans associated with the StakePlan
      if(userStakePlans.length > 0){
       await UserStakePlan.deleteMany({ stakePlan: stakePlan._id }).session(session);
     }
       // Delete the StakePlan
       await StakePlan.findByIdAndDelete(stakePlan._id).session(session);
     }
  }
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({success: true, message: 'Asset and references deleted successfully', code:200 });
  });


    // Delete all Assets
const deleteAllAssets = asyncWrapper(async (req, res) => {
  const assets = await Asset.deleteMany({});
  res.status(200).json({ assets });
});



  module.exports = {
    createAsset,
    getAllAssets,
    getAsset,
    updateAsset,
    deleteAsset,
    deleteAllAssets,
  };