const express = require("express");
const router = express.Router();

const {
 createUser,
 loginUser,
 verifyEmail,
 sendVerificationMail,
 sendForgotPasswordMail,
 
} = require("../controllers/auth");

router.route('/register').post(createUser);
router.route('/login').post(loginUser);
router.route('/verify/:id').get(verifyEmail);
router.route('/sendVerificationMail').get(sendVerificationMail);
router.route('/sendForgotPasswordMail').get(sendForgotPasswordMail);
module.exports = router;