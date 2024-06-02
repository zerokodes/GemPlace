require('dotenv').config();
const User = require("../models/User");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const mongoose = require('mongoose');
const CryptoJS = require("crypto-js");


// GET all users
const getAllUsers = asyncWrapper(async (req, res) => {
    const users = await User.find({});
    res.status(200).json({ users });
  });


  //GET a User
const getUser = asyncWrapper(async (req, res, next) => {
 
    const { id: userID } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return next(createCustomError("Invalid Id format", 200));
    }
      
   const user = await User.findOne({ _id: userID });

    if (!user) {
      return next(createCustomError(`No user found with id : ${userID}`, 200));
    }
   
   
    
  
   res.status(200).json({ user });
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
    });
    res.status(200).json({ searchUser });
  });
  

  // DELETE a user

const deleteUser = asyncWrapper(async (req, res, next) => {
    const { id: userID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    let searchUser = await User.findOne({ _id: userID });
   
    if (!searchUser) {
      return next(createCustomError(`No user found with id : ${userID}`, 200));
    }
   
    searchUser = await User.findOneAndDelete({ _id: userID });
  
    res.status(200).json({ searchUser });
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
  const { newPassword ,email } = req.body;; 
  
  
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