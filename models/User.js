const mongoose = require("mongoose");
const validator = require('validator');
const {Schema} = require('mongoose');


const UserSchema = new mongoose.Schema(
    {
        username: { type: String , required:[true,'Please tell us your username'], unique:true},
        email:{
            type:String,
            required:[true,'Please provide your mail'],
            unique:true,
            lowercase:true,
            validate:[validator.isEmail,'Please provide valid email'],
        },
        password: { type: String, required: [true,'Please enter your password']},
        role: {
            type: String,
            enum: ['Admin','Vendor','NormalUser'],
            default: 'NormalUser',
        },
        firstName: { type: String },
        surname: { type: String},
        phone: { 
            type: Number,
            maxLength:[11, "Number can't be more than 11 digit"],
            minLength:[11, "Number can't be less than 11 digit"],
            },
        gender: {
            type: String,
            enum: ["Male","Female"],
        },
        address: { type: String},
        dateOfBirth: { type: Date},
        nationality: { type: String},
        isVerified: { type: Boolean, default: false},
        kycVerified: { type: Boolean, default: false},
        publishedProducts: [{
            type: Schema.Types.ObjectId,
            ref: 'Product'
        }],
        userAssets: [{
            type: Schema.Types.ObjectId,
            ref: 'UserAsset'
        }],
    
    },
    { timestamps: true}
);


module.exports = mongoose.model("User", UserSchema);