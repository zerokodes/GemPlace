const Product = require("../models/Product");
const User = require("../models/User");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");


// CREATE a new product
const createProduct = asyncWrapper(async (req, res) => {
    const newProduct = new Product ({
      productName: req.body.productName,
      price: req.body.price,
      imageLink: req.body.imageLink,
      productDesc: req.body.productDesc,
      color: req.body.color,
      //removed once Security layer is added
      user: req.user.id
    });
    const savedProduct= await newProduct.save();

    const user = await User.findById({_id: savedProduct.user})
      user.publishedProducts.push(savedProduct);
      await user.save();

    res.status(201).json({ savedProduct});
  });



// GET all products
const getAllProducts = asyncWrapper(async (req, res) => {
    const products = await Product.find({});
    const data = {
      products
  }
  res.status(200).json({ success: true, data });
    //res.status(200).json({ products });
  });


   //GET a product
const getProduct = asyncWrapper(async (req, res, next) => {
    const { id: productID } = req.params;
    const product = await Product.findOne({ _id: productID });
  
    if (!product) {
      return next(createCustomError(`No product found with id : ${productID}`, 404));
    }
  
    res.status(200).json({ product });
  });


   // UPDATE a  product

const updateProduct = asyncWrapper(async (req, res, next) => {
    const { id: productID } = req.params;
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