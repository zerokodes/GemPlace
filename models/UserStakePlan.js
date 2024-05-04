const mongoose = require("mongoose");
const {Schema} = require('mongoose');


const UserStakePlanSchema = new mongoose.Schema(
    {
        userAsset: {
            type: Schema.Types.ObjectId,
            ref: 'UserAsset',
            required: true
        },
        stakePlan: {
            type: Schema.Types.ObjectId,
            ref: 'StakePlan',
            required: true
        },
        amount: {type: Number, required: [true, "Please input amount to be staked"]},
        numOfDays: {type: Number, required: [true, 'Please input number of days for staking']},
        startDate: {type: Date},
        endDate: {type: Date},
        expectedReturnAmount: {type: Number}
    },
    { timestamps: true }
)


// Define a pre-save hook to set startDate and calculate endDate based on user input
UserStakePlanSchema.pre('save', function (next) {
    if (!this.endDate) {
      // Calculate endDate only if it's not already set
      const daysToAdd = this.numOfDays;
      const currentDate = new Date();
      this.startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      //this.endDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000); // Calculate endDate based on daysToAdd
      this.endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + daysToAdd);
    }
    next();
  });




module.exports = mongoose.model("UserStakePlan", UserStakePlanSchema);