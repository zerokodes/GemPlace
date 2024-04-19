const mongoose = require("mongoose");
const {Schema} = require('mongoose');

const ProductSchema = new mongoose.Schema(
    {
        productName: {type: String, required:[true, "Please input product name"]},
        price: {type: Number, required:[true, "Please input product's price"]},
        imageLink: {type: String, required:[true, "Please input product's image"]},
        productDesc: {type: String, default: null},
        cut: {type: String, default: null},
        productCertLink: {type: String, default: null},
        color: {type: String, required:[true, "Please input product's color"]},
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



