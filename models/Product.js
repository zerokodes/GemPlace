const mongoose = require("mongoose");
const {Schema} = require('mongoose');

const ProductSchema = new mongoose.Schema(
    {
        productName: {type: String, required:[true, "Please input product name"]},
        price: {type: Number, required:[true, "Please input product's price"]},
        imageLink: {type: String, required:[true, "Please input product's image"]},
        productDesc: {type: String},
        cut: {type: String},
        productCertLink: {type: String},
        color: {type: String, required:[true, "Please input product's color"]},
        size: [
            {
                weight: {type: Number},
                dimension: {type: Number}
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



