const mongoose = require("mongoose");


const ProductSchema = new mongoose.Schema(
    {
        productName: {type: String, required:[true, "Please input product name"]},
        price: {type: Number, required:[true, "Please input product's price"]},
        imageLink: {type: String, required:[true, "Please input product's image"]},
        productDesc: {type: String,}
    
    } ,  
    { timestamps: true}
)
module.exports = mongoose.model("Product", ProductSchema);