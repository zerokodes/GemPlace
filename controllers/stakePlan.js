const StakePlan = require("../models/StakePlan");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const Asset = require("../models/Asset");

// CREATE a new Stake Plan
const createStakePlan = asyncWrapper(async (req, res, next) => {
    const assetID = req.body.asset
    const newStakePlan = new StakePlan ({
      ROIPerDay: req.body.ROIPerDay,
      asset: assetID
      
    });

   
    const asset = await Asset.findById({_id: assetID})

    if (!asset){
        return next(createCustomError(`No Asset found with id : ${assetID}`, 404));
    }


    const savedStakePlan= await newStakePlan.save();

      asset.stakePlans.push(savedStakePlan);
      await asset.save();

    res.status(201).json({ savedStakePlan});
  });



   // GET all Stake Plan
const getAllStakePlans = asyncWrapper(async (req, res) => {
    const stakePlans = await StakePlan.find({});
    res.status(200).json({ stakePlans });
  });


   //GET a Stake Plan
const getStakePlan = asyncWrapper(async (req, res, next) => {
    const { id: stakePlanID } = req.params;
    const stakePlan = await StakePlan.findOne({ _id: stakePlanID });
  
    if (!stakePlan) {
      return next(createCustomError(`No Stake Plan found with id : ${stakePlanID}`, 404));
    }
  
    res.status(200).json({ stakePlan });
  });



  // UPDATE a Stake PLan

const updateStakePlan = asyncWrapper(async (req, res, next) => {
    const { id: stakePlanID } = req.params;
    let searchStakePlan = await StakePlan.findOne({ _id: stakePlanID });
   
    if (!searchStakePlan) {
      return next(createCustomError(`No Stake Plan found with id : ${stakePlanID}`, 404));
    }
    
    searchStakePlan = await StakePlan.findOneAndUpdate({ _id: stakePlanID }, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ searchStakePlan });
  });


      // DELETE a Stake PLan

const deleteStakePlan = asyncWrapper(async (req, res, next) => {
    const { id: stakePlanID } = req.params;
    let searchStakePlan = await StakePlan.findOne({ _id: stakePlanID });
   
    if (!searchStakePlan) {
      return next(createCustomError(`No Stake Plan found with id : ${stakePlanID}`, 404));
    }
   
    searchStakePlan = await StakePlan.findOneAndDelete({ _id: stakePlanID });
  
    res.status(200).json({ searchStakePlan });
  });

      // Delete all Stake Plans
const deleteAllStakePlans = asyncWrapper(async (req, res) => {
    const stakePlans = await StakePlan.deleteMany({});
    res.status(200).json({ stakePlans });
  });


  module.exports = {
    createStakePlan,
    getAllStakePlans,
    getStakePlan,
    updateStakePlan,
    deleteStakePlan,
    deleteAllStakePlans,
  };