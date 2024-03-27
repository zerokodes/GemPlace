const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateUser = (req,res,next)=>{
    const authHeader = req.headers.token;
    if(authHeader){
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.JWT_SEC, (err, user) =>{
            if(err) res.status(403).json("Invalid Token");
            req.user = user;
            next();
        });
    }else{
        return res.status(401).json({message: 'Access denied. No token provided.'});
    }
}


const authorizeRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
  };

  module.exports = { authenticateUser, authorizeRole };


