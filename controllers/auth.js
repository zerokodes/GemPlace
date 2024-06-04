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
    return res.status(200).json({success: false, message: `User already exists with this Email: ${email}`, code: 200});
  }
  
  if (existingUserUsername){
    return res.status(200).json({success: false, message: `User already exists with this Username: ${username}` , code:200});
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
res.status(200).json({success: true, message: 'User registered successfully. Check your email for verification.', code: 200});
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

const sendVerificationMail = asyncWrapper(async (req,res,next) => {

  const email = req.body.email

  const existingUserEmail = await User.findOne({ email: email });

  if (!existingUserEmail) {
    return next(createCustomError("Please enter the email address you used when registering", 200));
  }

  if (existingUserEmail.isVerified === true){
    return next(createCustomError("Email address is verified already", 200));
  }

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

return res.status(200).json({success: true, message: "Check your email for verification",code:200})
  
})

const sendForgotPasswordMail = asyncWrapper(async (req, res, next) => {
  const email = req.body.email;
  
  const user = await User.findOne({email: email});

  if (!user) {
    return next(createCustomError("Please enter the email address you used when registering", 200));
  }
 
       // Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


 //Assigning token to users
 const token = jwt.sign({
  id: user._id
}, 
process.env.JWT_SEC,
{expiresIn: "1h"}
);

//const randomBytes = CryptoJS.lib.WordArray.random(16);
//const token = CryptoJS.enc.Hex.stringify(randomBytes);

// Send verification email
const mailOptions = {
  from: process.env.SMTP_USER,
  to: email,
  subject: 'Password Reset',
  text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
  Please click on the following link, or paste this into your browser to complete the process:\n\n
  ${process.env.BASE_URL2}/forgotPassword/${email}/${token}\n\n
  If you did not request this, please ignore this email and your password will remain unchanged.\n`
  //text: `Click the link to verify your email address: ${process.env.BASE_URL}/verify/${token}`
};
await transporter.sendMail(mailOptions);

  res.status(200).json({success: true, message: 'Check your email for link to reset password', code: 200});
})
module.exports = {
    createUser,
    loginUser,
    verifyEmail,
    sendVerificationMail,
    sendForgotPasswordMail,
    
  };