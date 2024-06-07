const Asset = require("../models/Asset");
const User = require("../models/User");
const UserAsset = require("../models/UserAsset");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const mongoose = require('mongoose');


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

    let searchAsset = await Asset.findOne({ _id: assetID });
   
    if (!searchAsset) {
      return next(createCustomError(`No Asset found with id : ${assetID}`, 404));
    }
   
    searchAsset = await Asset.findOneAndDelete({ _id: assetID });
  
    res.status(200).json({ searchAsset });
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