require('dotenv').config();
const User = require("../models/User");
const UserAsset = require("../models/UserAsset");
const Asset = require("../models/Asset");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const mongoose = require('mongoose');
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const UserStakePlan = require('../models/UserStakePlan');
const StakePlan = require('../models/StakePlan');
const Order = require('../models/Order');
const Product = require('../models/Product');



// GET all users
const getAllUsers = asyncWrapper(async (req, res) => {
   // const users = await User.find({});

    const users = await User.find().populate({
      path: 'userAssets',
      populate: {
        path: 'asset',
        model: 'Asset'
      }
    });

    res.status(200).json({success: true, message: 'Fetch successful', data:users, code:200});
  });


  //GET a User
const getUser = asyncWrapper(async (req, res, next) => {
 
    const { id: userID } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return next(createCustomError("Invalid Id format", 200));
    }
      
   //const user = await User.findOne({ _id: userID });

   const user = await User.findOne({_id: userID}).populate({
    path: 'userAssets',
    populate: {
      path: 'asset',
      model: 'Asset'
    }
  });

    if (!user) {
      return next(createCustomError(`No user found with id : ${userID}`, 200));
    }
   
   
    
    res.status(200).json({success: true, message: 'Fetch successful', data:user, code:200});
  });


  // UPDATE a  User

const updateUser = asyncWrapper(async (req, res, next) => {
    const { id: requestedUserId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestedUserId)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    let searchUser = await User.findOne({ _id: requestedUserId });

    const userId = req.user.id; // User ID from JWT token
    const isAdmin = req.user.role === 'Admin';
   
   
    if (!searchUser) {
      return next(createCustomError(`No user found with id : ${requestedUserId}`, 200));
    }
    
    if (userId !== requestedUserId && !isAdmin){
      return next(createCustomError(`You can't modify this user: ${requestedUserId}`, 200));
    }
    
    searchUser = await User.findOneAndUpdate({ _id: requestedUserId }, req.body, {
      new: true,
      runValidators: true,
    }).populate({
      path: 'userAssets',
      populate: {
        path: 'asset',
        model: 'Asset'
      }
    });
    res.status(200).json({success: true, message: 'Profile data updated successful', data:searchUser, code:200});
  });
  

  // DELETE a user

const deleteUser = asyncWrapper(async (req, res, next) => {
    const { id: userID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return next(createCustomError("Invalid Id format", 200));
    }
   
    // Start a session and transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    
    // Delete the User
    const user = await User.findByIdAndDelete(userID).session(session);

    
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return next(createCustomError(`No User found with id : ${userID}`, 200));
    }

    
    // Find all UserAssets associated with the user
    const userAssets = await UserAsset.find({ user: userID }).session(session);

    
    // Delete UserAssets and remove references from Asset documents
    for (const userAsset of userAssets) {
      // Remove the UserAsset reference from the Asset document
      await Asset.updateMany(
        { userAssets: userAsset._id },
        { $pull: { userAssets: userAsset._id } }
      ).session(session);


      
      //delete userStakePlan associated with the userAsset
      const userStakePlan = await UserStakePlan.findOne({userAsset: userAsset._id}).session(session);

      
      // Remove the UserStakePlan reference from the StakePlan document
      if(userStakePlan !== null){
      await StakePlan.updateMany(
        { userStakePlans: userStakePlan._id},
        { $pull: { userStakePlans: userStakePlan._id}}
      ).session(session);

       //Delete the UserStakePlan
       await UserStakePlan.findByIdAndDelete(userStakePlan._id).session(session);
    }
      

      // Delete the UserAsset
      await UserAsset.findByIdAndDelete(userAsset._id).session(session);
    }

    
    // Find all orders associated with the user and delete them
     await Order.deleteMany({ user: userID }).session(session);

     
     // Find all products associated with the user and delete them
     await Product.deleteMany({ user: userID }).session(session);

     // Commit the transaction
    await session.commitTransaction();
    session.endSession();
  
    res.status(200).json({success: true, message: 'User and references deleted successfully', code:200 });
  });

  const verifyUser = asyncWrapper(async (req, res, next) => {
    const { id: userID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    let searchUser = await User.findOne({ _id: userID });

    if (!searchUser) {
      return next(createCustomError(`No user found with id : ${userID}`, 200));
    }

    searchUser = await User.findOneAndUpdate({ _id: userID }, {kycVerified: true}, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ searchUser });
  })

      // Delete all Users
const deleteAllUsers = asyncWrapper(async (req, res) => {
  const users = await User.deleteMany({});
  res.status(200).json({ users });
});

const resetPassword = asyncWrapper(async (req, res, next) => {
  const { newPassword } = req.body;; 
  const id = req.user.id;
  
  const user = await User.findOneAndUpdate({ _id: id }, {password: CryptoJS.AES.encrypt(
    newPassword,
    process.env.PASS_SEC
    ).toString()}, {
    new: true,
    runValidators: true,
  });
 
  res.status(200).json({success: true, message: 'User password successfully updated', code: 200});
})

const setPassword = asyncWrapper(async (req, res, next) => {
  const { newPassword, token, email } = req.body;
  
  // Decode the token to get the user id
  jwt.verify(token, process.env.JWT_SEC, (err) =>{
  if(err) return next(createCustomError('Invalid token or has expired', 200));
  });

  
  const user = await User.findOneAndUpdate({ email: email }, {password: CryptoJS.AES.encrypt(
    newPassword,
    process.env.PASS_SEC
    ).toString()}, {
    new: true,
    runValidators: true,
  });
 
  res.status(200).json({success: true, message: 'User password successfully updated', code: 200});
})


  module.exports = {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    verifyUser,
    deleteAllUsers,
    resetPassword,
    setPassword
  };