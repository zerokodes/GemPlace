const express = require("express");
const app = express();
const dotenv = require("dotenv");
const userRoute = require("./routes/user");
const productRoute = require("./routes/product");
const authRoute = require("./routes/auth");
const assetRoute = require("./routes/asset");
const userAssetRoute = require("./routes/userAsset");
const stakePlanRoute = require("./routes/stakePlan");
const userStakePlanRoute = require("./routes/userStakePlan");
const orderRoute = require("./routes/order");
const transactionRoute = require("./routes/transaction");
const vendorRequest = require("./routes/vendorRequest");
const commission = require("./routes/commission");
const notFound = require("./middleware/notFound");
const errorHandlerMiddleware = require("./middleware/errorHandler");
const connectDB = require("./database/Connect");
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require("./admin.json");
//Initialize firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.BUCKET_URL,
})




const schedule = require('node-schedule');
const UserStakePlan = require("./models/UserStakePlan");
const{
    returnStake
 } = require("./controllers/userStakePlan");



app.use(express.json());
require('dotenv').config();
app.use(cors({
  origin: [process.env.CORS_URL1, process.env.CORS_URL2, process.env.CORS_URL3]
  //origin: '*'
}))



//routes
app.use("/api/v1/users", userRoute);
app.use("/api/v1/auth", authRoute); 
app.use("/api/v1/products", productRoute);
app.use("/api/v1/assets", assetRoute); 
app.use("/api/v1/userAssets", userAssetRoute);
app.use("/api/v1/stakePlans", stakePlanRoute);
app.use("/api/v1/userStakePlans", userStakePlanRoute);
app.use("/api/v1/orders", orderRoute);
app.use("/api/v1/transactions", transactionRoute);
app.use("/api/v1/vendorRequests", vendorRequest);
app.use("/api/v1/commissions", commission);


//middleware
app.use(notFound);
app.use(errorHandlerMiddleware);



// Schedule a daily check for expired stakes
schedule.scheduleJob('0 0 * * *', async () => { // Runs at midnight every day
      returnStake;
});

// connect to database
const port = process.env.PORT || 2000;
const MONGO_URI = process.env.MONGO_URI
const start = async () => {
  try {
    await connectDB(MONGO_URI);
    app.listen(port, () => {
        console.log(`Server is listen on port ${port}...`)
    });
  } catch (error) {
    console.log(error);
  }
};

start();