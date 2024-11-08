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
        return next(createCustomError(`No product found with id : ${productID}`, 200));
     }

    
     if(paymentMethod === "user_token"){
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

        //save to user
        user.orders.push(newOrder);
        await user.save();

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

    //save to user
    user.orders.push(newOrder);
    await user.save();

    const data = {
        newOrder
    }


    await newOrder.save();
    res.status(200).json({ success: true, message: 'Order created successfully.' , data, code: 200});

})

//GET A USER ORDER HISTORY
const orderHistory = asyncWrapper(async(req,res,next) => {
    const { id: userID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userID)) {
        return next(createCustomError("Invalid Id format", 200));
      }
    let searchUser = await User.findOne({ _id: userID });

    //check if it is the same user making the request
    if (searchUser._id.toString() !== req.user.id){
        return next(createCustomError(`You can not perform this operation`, 200));
      }

    
    const orders = await Order.find({user: userID})
    .populate('product')
    .populate('user')

    let orderDetails = orders;
    
   /** const orders = searchUser.orders;

    // Initialize an empty array to store order History results
    let orderDetails = [];

    for (const order of orders) {
        const searchOrder = await Order.findOne({ _id: order });
        if (!searchOrder){
            return next(createCustomError(`No order found with id : ${order}`, 200));

        }

        orderDetails.push({
            orderID: searchOrder._id,
            totalPrice: searchOrder.totalPrice,
            paymentMethod: searchOrder.paymentMethod,
            status: searchOrder.status,
            time: searchOrder.createdAt,
            userDetails: {
                userID: searchUser._id,
                email: searchUser.email
            }
        })
    }**/
    
    const pageNumber = req.query.pageNumber || 1; // Default to page 1 if pageNumber is not provided
    const pageSize = req.query.pageSize || 10; // Default page size to 10 if pageSize is not provided

    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = pageNumber * pageSize;
    
    orderDetails.slice(startIndex, endIndex);
    
    const data = {
        orderDetails
    }
    
    res.status(200).json({success: true, message: "Successful", data, code:200})
})

// Get all order history for all users
const getAllOrderHistory = asyncWrapper(async (req, res, next) => {
    const pageNumber = req.query.pageNumber || 1; // Default to page 1 if pageNumber is not provided
    const pageSize = req.query.pageSize || 10; // Default page size to 10 if pageSize is not provided

    const limit = parseInt(pageSize); // Convert pageSize to a number
    const skip = (parseInt(pageNumber) - 1) * limit; // Calculate skip based on pageNumber

    // Query MongoDB for products with pagination
    const orders = await Order.find()
    .skip(skip)
    .limit(limit)
    .exec();

    //Populate user and product fields 
    const populatedOrders = await Promise.all(orders.map(async (order) => {
        return await Order.findById(order._id)
        .populate('product')
        .populate('user');
    }))

    if (!populatedOrders || populatedOrders.length === 0) {
        return next(createCustomError(`No orders placed yet`, 200));
      }

    res.status(200).json({status: true, message: "Fetch successful", data:populatedOrders, code:200});
})

const getAllPendingOrder = asyncWrapper(async (req,res,next) => {
    const orders = await Order.find({ status: 'Pending'});

    //Populate user and product fields 
    const populatedOrders = await Promise.all(orders.map(async (order) => {
        return await Order.findById(order._id)
        .populate('product')
        .populate('user');
    }));

    if (!populatedOrders || populatedOrders.length === 0) {
        return next(createCustomError(`No orders placed yet`, 200));
      }

    res.status(200).json({status: true, message: "Fetch successful", data:populatedOrders, code:200});
})


const approveOrder = asyncWrapper(async (req,res,next) => {
    const { id: orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return next(createCustomError("Invalid id format", 200));
    }

    let order = Order.findOne({_id: orderId});

    if(!order){
        return next(createCustomError(`No order found wiith id: ${orderId}`,200)); 
    }

    order = await Order.findByIdAndUpdate({_id: orderId }, {status: 'Success'},{
        new: true,
        runValidators: true,
    });

    res.status(200).json({success: true, message: 'Order Approved', code: 200});
})

const disapproveOrder = asyncWrapper(async (req,res,next) => {
    const { id: orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return next(createCustomError("Invalid id format", 200));
    }

    let order = Order.findOne({_id: orderId});

    if(!order){
        return next(createCustomError(`No order found wiith id: ${orderId}`,200)); 
    }

    order = await Order.findByIdAndUpdate({_id: orderId }, {status: 'Failed'},{
        new: true,
        runValidators: true,
    });

    res.status(200).json({success: true, message: 'Order Disapproved', code: 200});
})

module.exports = {
    createOrder,
    orderHistory,
    getAllOrderHistory,
    getAllPendingOrder,
    approveOrder,
    disapproveOrder,
}