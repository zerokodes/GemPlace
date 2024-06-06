require('dotenv').config();
const VendorRequest = require("../models/VendorRequest");
const asyncWrapper = require("../middleware/async");
const { createCustomError }= require("../errors/customError");
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const { getStorage, getDownloadURL }  = require('firebase-admin/storage');
const User = require('../models/User');


const createVendorRequest = asyncWrapper(async (req, res, next) => {
    const { firstName, lastName, otherName } = req.body;

   // const { idCardImage, faceImage } = req.files;

    const idCardImage = req.files['idCardImage'][0];
    const faceImage = req.files['faceImage'][0];

 console.log("welcome")
    if(!idCardImage || !faceImage) {
        return next(createCustomError("Upload all require image field", 200));
    }

    // upload images to firebase
    const bucket = admin.storage().bucket();

    const idCardImageUrl = `images/${idCardImage.originalname}`;
    const faceImageUrl = `images/${faceImage.originalname}`;

    await bucket.upload(idCardImage.path, { destination: idCardImageUrl });
    await bucket.upload(faceImage.path, { destination: faceImageUrl });

    //Download url to images sent to firebase
    const fileRef1 = getStorage().bucket(process.env.BUCKET_URL).file(idCardImageUrl);
    const fileRef2 = getStorage().bucket(process.env.BUCKET_URL).file(faceImageUrl);
    const downloadUrl1 = await getDownloadURL(fileRef1);
    const downloadUrl2 = await getDownloadURL(fileRef2);


    const vendorRequest = new VendorRequest({
        firstName: firstName,
        lastName: lastName,
        otherName: otherName,
        idCardImage: downloadUrl1,
        faceImage: downloadUrl2,
        userID: req.user.id
    });

    await vendorRequest.save();

    const userID = req.user.id;
    //Update vendorRequestStatus of user
    const user = await User.findOneAndUpdate({_id: userID}, {vendorRequestStatus: 'Pending'},{
        new: true,
        runValidators: true,
    });

    const data = {
        vendorRequest
    }

    res.status(200).json({success: true, message: "Your request has been sent successfully.", data: data, code:200});
})

//Get all pending vendor request
const getPendingVendorRequest = asyncWrapper(async (req, res, next) => {
    const vendorRequests = await VendorRequest.find({ status: 'Pending'});
    const data = {
        vendorRequests
    }

    res.status(200).json({ success: true, message: 'Fetch successful', data: data, code:200});
})

//Update a user to vendor
const updateUserToVendor = asyncWrapper(async (req,res,next) => {
    const { id: userID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userID)) {
        return next(createCustomError("Invalid id format", 200));
    }

    let user = await User.findOne({ _id: userID});

    if(!user) {
        return next(createCustomError(`No user found wiith id: ${userID}`,200));
    }

    let vendorRequest = await VendorRequest.findOne({userID: userID})
    if(!vendorRequest) {
        return next(createCustomError("This user didn't place a request to become a vendor",200));
    }

    vendorRequest = await VendorRequest.findOneAndUpdate({userID: userID}, {status: 'Success'}, {
        new: true,
        runValidators: true, 
    });

    user = await User.findOneAndUpdate({ _id: userID }, {role: 'Vendor'},{vendorRequestStatus: 'Success'}, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({success: true, message: 'Vendor Request Approved', code: 200});
})

const disapproveVendorRequest = asyncWrapper(async (req,res,next) => {
    const {id: userID} = req.params;

    if (!mongoose.Types.ObjectId.isValid(userID)) {
        return next(createCustomError("Invalid id format", 200));
    }

    let user = await User.findOne({_id: userID});

    if(!user) {
        return next(createCustomError(`No user found wiith id: ${userID}`,200));
    }

    let vendorRequest = await VendorRequest.findOne({userID: userID})
    if(!vendorRequest) {
        return next(createCustomError("This user didn't place a request to become a vendor",200));
    }

    vendorRequest = await VendorRequest.findOneAndUpdate({userID: userID}, {status: 'Failed'}, {
        new: true,
        runValidators: true, 
    });

    user = await User.findOneAndUpdate({ _id: userID },{role: 'NormalUser'}, {vendorRequestStatus: 'Failed'}, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({success: true, message: 'Vendor Request Failed', code: 200});
})
module.exports = {
    createVendorRequest,
    getPendingVendorRequest,
    updateUserToVendor,
    disapproveVendorRequest,
}