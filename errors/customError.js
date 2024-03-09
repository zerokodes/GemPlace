class CustomAPIError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  // Creates a Custom error
  const createCustomError = (msg, statusCode) => {
    return new CustomAPIError(msg, statusCode);
  };
  
  module.exports = { CustomAPIError, createCustomError };