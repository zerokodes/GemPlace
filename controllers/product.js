require('dotenv').config();
const Product = require("../models/Product");
const User = require("../models/User");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const serviceAccount = require('../admin.json');
const { getStorage, getDownloadURL } = require('firebase-admin/storage');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.BUCKET_URL,
});

const bucket = admin.storage().bucket();

// CREATE a new product
const createProduct = asyncWrapper(async (req, res, next) => {

  const image = req.file

 
console.log("checking image")
console.log(image)
  if (!image) {
    return next(createCustomError('No image uploaded', 200));
   
  }

  const imageUrl = `images/${image.originalname}`;

  // Upload image to Firebase Storage
  await bucket.upload(image.path, { destination: imageUrl });

  const fileRef = getStorage().bucket(process.env.BUCKET_URL).file(imageUrl);
  
  // Get the download URL of the uploaded image
  const downloadURL= await getDownloadURL(fileRef);
    

    const newProduct = new Product ({
      productName: req.body.productName,
      price: req.body.price,
      imageLink: downloadURL,
      productDesc: req.body.productDesc,
      color: req.body.color,
      //removed once Security layer is added
      user: req.user.id
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

  const pageNumber = req.query.pageNumber || 1; // Default to page 1 if pageNumber is not provided
    const pageSize = req.query.pageSize || 10; // Default page size to 10 if pageSize is not provided

  const limit = parseInt(pageSize); // Convert pageSize to a number
    const skip = (parseInt(pageNumber) - 1) * limit; // Calculate skip based on pageNumber

    // Query MongoDB for products with pagination
    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .exec();

    const data = {
      products
  }
  res.status(200).json({ success: true, data });
    //res.status(200).json({ products });
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