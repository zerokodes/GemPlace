require('dotenv').config();
const Product = require("../models/Product");
const User = require("../models/User");
const Asset = require("../models/Asset");
const UserAsset = require("../models/UserAsset");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const Commission = require('../models/Commission')
//const serviceAccount = require("../admin.json");
const { getStorage, getDownloadURL } = require('firebase-admin/storage');



// CREATE a new product
const createProduct = asyncWrapper(async (req, res, next) => {

  const image = req.file

 
  if (!image) {
    return next(createCustomError('No image uploaded', 200));
   
  }
  const bucket = admin.storage().bucket();
  const imageUrl = `images/${image.originalname}`;

  // Upload image to Firebase Storage
  await bucket.upload(image.path, { destination: imageUrl });

  const fileRef = getStorage().bucket(process.env.BUCKET_URL).file(imageUrl);
  
  // Get the download URL of the uploaded image
  const downloadURL= await getDownloadURL(fileRef);


    const { price, color, productName, productDesc} = req.body;

    const newProduct = new Product ({
      productName,
      price,
      imageLink: downloadURL,
      productDesc,
      color,
      //removed once Security layer is added
      user: req.user.id
    });

    //Commission Handler
    const commission = await Commission.findOne({commissionType: "Promotion"});

    if(!commission){
      return next(createCustomError(`No commission for promotion found`,200)); 
   }

   const commissionFeePercent = commission.fee;

   const commissionFee = (commissionFeePercent/100)*price;

   const userId = req.user.id;
    const assetName = 'USDT';

    // Find the asset with the given name
    const asset = await Asset.findOne({ assetName });
    if (!asset) {
      return next(createCustomError(`No Asset found with this name : ${assetName}`, 200));
  }

  // Find the user asset with the asset ID and user ID
  let userAsset = await UserAsset.findOne({ user:userId, asset: asset._id });
  if (!userAsset) {
    return res.status(404).json({ message: 'User asset not found' });
  }

  if(commissionFee > userAsset.currentBalance ){
    return next(createCustomError(`Insufficient Balance, You will require a fee of ${commissionFee} to promote your product`, 200));
  }

  // Deduct commission fee from  userAsset balance
  userAsset = await UserAsset.findOneAndUpdate({ _id: userAsset._id},{$inc: {currentBalance: -commissionFee}}, {
    new: true,
    runValidators: true,
  });


    const savedProduct= await newProduct.save();

    const user = await User.findById({_id: savedProduct.user})
      user.publishedProducts.push(savedProduct);
      await user.save();

      const data = {
        savedProduct
      }

    res.status(200).json({success:true,message: "Product added Successfully", data, code:200 });
  });



// GET all products
const getAllProducts = asyncWrapper(async (req, res) => {

 /** const pageNumber = req.query.pageNumber || 1; // Default to page 1 if pageNumber is not provided
    const pageSize = req.query.pageSize || 10; // Default page size to 10 if pageSize is not provided

  const limit = parseInt(pageSize); // Convert pageSize to a number
    const skip = (parseInt(pageNumber) - 1) * limit;**/ // Calculate skip based on pageNumber

    // Query MongoDB for products with pagination
    const products = await Product.find()
      /**.skip(skip)
      .limit(limit)
      .exec();**/

  res.status(200).json({ success: true, message: 'Fetch successful', data: products, code:200 });
    
  });


   //GET a product
const getProduct = asyncWrapper(async (req, res, next) => {
    const { id: productID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    const product = await Product.findOne({ _id: productID });
  
    if (!product) {
      return next(createCustomError(`No product found with id : ${productID}`, 404));
    }
  
    res.status(200).json({ product });
  });


   // UPDATE a  product

const updateProduct = asyncWrapper(async (req, res, next) => {
    const { id: productID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    let searchProduct = await Product.findOne({ _id: productID });
   
    if (!searchProduct) {
      return next(createCustomError(`No product found with id : ${productID}`, 404));
    }
    
    // check if it is the same user who created the product or an Admin

    const userId = req.user.id; // User ID from JWT token
    const isAdmin = req.user.role === 'Admin';

    
    if (userId !== searchProduct.user._id.toString() && !isAdmin){
      return next(createCustomError(`You can't modify this product : ${productID}`, 403));
    }

    searchProduct = await Product.findOneAndUpdate({ _id: productID }, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ searchProduct });
  });


   // DELETE a user

const deleteProduct = asyncWrapper(async (req, res, next) => {
    const { id: productID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productID)) {
      return next(createCustomError("Invalid Id format", 200));
    }

    let searchProduct = await Product.findOne({ _id: productID });
   
    if (!searchProduct) {
      return next(createCustomError(`No product found with id : ${productID}`, 404));
    }

    // check if it is the same user who created the product or an Admin

    const userId = req.user.id; // User ID from JWT token
    const isAdmin = req.user.role === 'Admin';
   
   
    if (userId !== searchProduct.user._id.toString() && !isAdmin){
      return next(createCustomError(`You can't delete this product : ${productID}`, 403));
    }

    searchProduct = await Product.findOneAndDelete({ _id: productID });
  
    res.status(200).json({ searchProduct });
  });


      // Delete all Products
const deleteAllProducts = asyncWrapper(async (req, res) => {
  const products = await Product.deleteMany({});
  res.status(200).json({ products });
});

  module.exports = {
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    deleteAllProducts,
  };