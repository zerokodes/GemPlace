const Product = require("../models/Product");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");


// CREATE a new product
const createProduct = asyncWrapper(async (req, res) => {
    const newProduct = new Product ({
      productName: req.body.productName,
      price: req.body.price,
      imageLink: req.body.imageLink,
      productDesc: req.body.productDesc
    });
    const savedProduct= await newProduct.save();
    res.status(201).json({ savedProduct});
  });



// GET all products
const getAllProducts = asyncWrapper(async (req, res) => {
    const products = await Product.find({});
    res.status(200).json({ products });
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
   
    searchProduct = await Product.findOneAndDelete({ _id: productID });
  
    res.status(200).json({ searchProduct });
  });


  module.exports = {
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct,
  };