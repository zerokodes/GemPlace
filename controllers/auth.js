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
    return res.status(400).json({ message: `User already exists with this Email: ${email}`  });
  }
  
  if (existingUserUsername){
    return res.status(400).json({ message: `User already exists with this Username: ${username}` });
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
    //await newUser.save();


console.log("Email don start")
    // Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


console.log("token things")
 // Generate verification token (you can use crypto or uuid package)
 const randomBytes = CryptoJS.lib.WordArray.random(16);
 const token = CryptoJS.enc.Hex.stringify(randomBytes);

 console.log("i wan send mail")
 // Send verification email
 const mailOptions = {
  from: process.env.SMTP_USER,
  to: email,
  subject: 'Verify Your Email Address',
  text: `Click the link to verify your email address: ${process.env.BASE_URL}/verify/${token}`
};
await transporter.sendMail(mailOptions);
await newUser.save();
res.status(201).json({ message: 'User registered successfully. Check your email for verification.'});
  });

  // LOGIN user
  const loginUser = asyncWrapper(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email});
    if (!user) {
        return next(createCustomError("Wrong Crendentials", 401));
      }
    
    const hashedPassword = CryptoJS.AES.decrypt(
        user.password,
        process.env.PASS_SEC
    );
    const originalPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
    
    if(originalPassword !== req.body.password){
        return next(createCustomError("Wrong Credentials", 401));
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
    res.status(200).json({...others, accessToken});

});


const verifyEmail = asyncWrapper(async (req,res,next) => {
    // Find user by token and update isVerified field
    const user = await User.findOneAndUpdate({ isVerified: false }, { isVerified: true });
    if (!user) {
      return next(createCustomError("User not found or already verified", 404));
    }
    res.status(200).json({message: "Email is Successfully Verified"});
})

module.exports = {
    createUser,
    loginUser,
    verifyEmail,
  };