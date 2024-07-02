const Commission = require("../models/Commission");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const mongoose = require('mongoose');


//create a commission
const createCommission = asyncWrapper(async(req,res,next) => {
    const { fee, commissionType } = req.body;

    const newCommission = new Commission({
        fee,
        commissionType
    })

    await newCommission.save();

    return res.status(200).json({ success: true, message: 'Commission created successfully.' , data: newCommission, code: 200});
})


//update commission fee 
const updateCommissionFee = asyncWrapper(async(req,res,next) => {
    const {id: commissionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commissionId)) {
        return next(createCustomError("Invalid id format", 200));
    }

    let commission = Commission.findOne({_id: commissionId});

    if(!commission){
        return next(createCustomError(`No commission found wiith id: ${commissionId}`,200)); 
    }

    commission = await Commission.findByIdAndUpdate({_id: commissionId}, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({success: true, message: 'Commission fee updated successful', data:commission, code:200});
})

// get commission fee for promotion
const getCommissionFeeForPromotion = asyncWrapper(async(req,res,next) => {

    const commission = await Commission.findOne({commissionType: "Promotion"});

    if(!commission){
        return next(createCustomError(`No commission for promotion found`,200)); 
    }

    res.status(200).json({success: true, message: 'Fetch successful', data:commission, code:200});
})
module.exports = {
    createCommission,
    updateCommissionFee,
    getCommissionFeeForPromotion,
}