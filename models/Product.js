const mongoose = require("mongoose");
const {Schema} = require('mongoose');

const ProductSchema = new mongoose.Schema(
    {
        productName: {type: String},
        price: {type: Number},
        imageLink: {type: String},
        productDesc: {type: String, default: null},
        cut: {type: String, default: null},
        productCertLink: {type: String, default: null},
        color: {type: String},
        size: [
            {
                weight: {type: Number, default: null},
                dimension: {type: Number, default: null}
            }
        ],
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    } ,  
    { timestamps: true}
)
module.exports = mongoose.model("Product", ProductSchema);



