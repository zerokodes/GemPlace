const mongoose = require("mongoose");
const {Schema} = require("mongoose");

const VendorRequestSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, "Please input first name"]
        },
        lastName: {
            type: String,
            required: [true, "Please input last name"]
        },
        otherName: {
            type: String,
            required: [true, "Please input other name"]
        },
        idCardImage: {
            type: String,
            required: [true, "Please input a picture of your id"]
        },
        faceImage: {
            type: String,
            required: [true, "Please input a picture of your face"]
        },
        status: {
            type: String,
            enum: ["Pending", "Success"],
            default: "Pending"
        },
        userID: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { timestamps: true}
);

module.exports = mongoose.model("VendorRequest", VendorRequestSchema)