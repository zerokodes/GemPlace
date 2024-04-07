const Asset = require("../models/Asset");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");


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

    res.status(201).json({ savedAsset});
  });


  // GET all Assets
const getAllAssets = asyncWrapper(async (req, res) => {
    const assets = await Asset.find({});
    res.status(200).json({ assets });
  });


   //GET an Asset
const getAsset = asyncWrapper(async (req, res, next) => {
    const { id: assetID } = req.params;
    const asset = await Asset.findOne({ _id: assetID });
  
    if (!asset) {
      return next(createCustomError(`No Asset found with id : ${assetID}`, 404));
    }
  
    res.status(200).json({ asset });
  });



   // UPDATE an Asset

const updateAsset = asyncWrapper(async (req, res, next) => {
    const { id: assetID } = req.params;
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