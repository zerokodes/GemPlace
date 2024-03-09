// This is an Async Wrapper to help reduce the bioler plate codes of try 
// and catch block during promise handling
const asyncWrapper = (fn) => {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  };
  
  module.exports = asyncWrapper;