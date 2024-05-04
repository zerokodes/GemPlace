const Order = require("../models/Order");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const User = require("../models/User");
const Product = require("../models/Product");
const UserAsset = require("../models/UserAsset");
const mongoose = require('mongoose');

//Create an Order
const createOrder = asyncWrapper(async(req,res,next) => {
    const { productID, userID, totalPrice, paymentMethod, userAssetID } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userID) || !mongoose.Types.ObjectId.isValid(productID)) {
        return next(createCustomError("Invalid Id format", 200));
    }  
    
     // Validate customer ID
     const user = await User.findById(userID);
     if (!user) {
        return next(createCustomError(`No user found with id : ${userID}`, 200));
     }

     
     // Validate Product
     const product = await Product.findById(productID);
     if (!product) {
        return next(createCustomError(`No user found with id : ${productID}`, 200));
     }

    
     if(paymentMethod === "User Token"){
        //const userAssetID = req.body

        if (!mongoose.Types.ObjectId.isValid(userAssetID)) {
            return next(createCustomError("Invalid Id format", 200));
          }
        
          let userAsset = await UserAsset.findOne({ _id: userAssetID });
      
          if (!userAsset) {
            return next(createCustomError(`No UserAsset found with id : ${userAssetID}`, 200));
          }

          if(totalPrice > userAsset.currentBalance ){
            return next(createCustomError(`Insufficient Balance`, 200));
          }

        
      // Create a new order document
        const newOrder = new Order({
            product: productID,
            user: userID,
            totalPrice,
            paymentMethod,
            status: "Success"
        });

        
        await newOrder.save();

        const data = {
            newOrder
        }

        
          // Deduct amount from UserAsset balance
      userAsset = await UserAsset.findOneAndUpdate({ _id: userAssetID },{$inc: {currentBalance: -totalPrice}}, {
        new: true,
        runValidators: true,
      });

       
        return res.status(200).json({ success: true, message: 'Order created successfully.' , data, code: 200});
     }

    
     // Create a new order document
     const newOrder = new Order({
        product: productID,
        user: userID,
        totalPrice,
        paymentMethod,
    });
    const data = {
        newOrder
    }


    await newOrder.save();
    res.status(200).json({ success: true, message: 'Order created successfully.' , data, code: 200});

})

module.exports = {
    createOrder,
}