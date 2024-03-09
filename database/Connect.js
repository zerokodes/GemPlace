const mongoose = require("mongoose");
// Connect to mongodb database
const connectDB = (url) => {
  return mongoose.connect(url, {
    //useNewUrlParser: true,
    //useUnifiedTopology: true,
  }).then(() => console.log("DBConnection Successfull!"))
  .catch((err) => {
      console.log(err);
  });;
};

module.exports = connectDB;