// Handles error 
const { CustomAPIError } = require("../errors/customError");
const errorHandlerMiddleware = (err, req, res, next) => {
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({success: false, message: err.message,data: null,code:err.statusCode });
  }
  return res.status(500).json({ message: "Something went wrong,please try again" });
};

module.exports = errorHandlerMiddleware;