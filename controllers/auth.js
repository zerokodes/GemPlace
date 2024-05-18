require('dotenv').config();
const User = require("../models/User");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/customError");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');


// CREATE a new user
  const createUser = asyncWrapper(async (req, res) => {
    const {username, email, password, role} = req.body;
   // Check if user already exists with email or username
  const existingUserEmail = await User.findOne({ email });
  const existingUserUsername = await User.findOne({ username });
  if (existingUserEmail) {
    return res.status(200).json({ message: `User already exists with this Email: ${email}`  });
  }
  
  if (existingUserUsername){
    return res.status(200).json({ message: `User already exists with this Username: ${username}` });
  }
    const newUser = new User ({
      username,
      email,
      password: CryptoJS.AES.encrypt(
        password,
        process.env.PASS_SEC
        ).toString(),
      role,
    });
    

    // Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


 // Generate verification token (you can use crypto or uuid package)
 const randomBytes = CryptoJS.lib.WordArray.random(16);
 const token = CryptoJS.enc.Hex.stringify(randomBytes);

 
 // Send verification email
 const mailOptions = {
  from: process.env.SMTP_USER,
  to: email,
  subject: 'Verify Your Email Address',
  text: `Click the link to verify your email address: ${process.env.BASE_URL}/verify/${token}`
};
await transporter.sendMail(mailOptions);
await newUser.save();
res.status(200).json({ message: 'User registered successfully. Check your email for verification.'});
  });

  // LOGIN user
  const loginUser = asyncWrapper(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email});
    if (!user) {
        return next(createCustomError("Wrong Crendentials", 200));
      }
    
    const hashedPassword = CryptoJS.AES.decrypt(
        user.password,
        process.env.PASS_SEC
    );
    const originalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
    
    if(originalPassword !== req.body.password){
        return next(createCustomError("Wrong Credentials", 200));
    }

    // Check if user has verified email
    if (user.isVerified === false){
      //return next(createCustomError("Please verify your email address", 200));
      const data = {
        isVerified: user.isVerified
      }
      return res.status(200).json({success:false,message: "Please verify your email address", data, code:200 });
    }

    //Assigning token to users
    const accessToken = jwt.sign({
      id: user._id,
      role: user.role,
  }, 
  process.env.JWT_SEC,
  {expiresIn: "3d"}
  );

    //decouple data inorder to send other user details except password
    const { password, ...others } = user._doc;
    const data = {
        details: { ...others },
        token: accessToken
    }
    res.status(200).json({success: true, message: "Login successful", data, code:200})

});


const verifyEmail = asyncWrapper(async (req,res,next) => {
    // Find user by token and update isVerified field
    const user = await User.findOneAndUpdate({ isVerified: false }, { isVerified: true });
    if (!user) {
      return next(createCustomError("User not found or already verified", 200));
    }
    res.status(200).json({success: true, message: "Email is Successfully Verified", code:200});
})

module.exports = {
    createUser,
    loginUser,
    verifyEmail,
  };