const express = require("express");
const router = express.Router();

const {
 createUser,
 loginUser,
 verifyEmail,
 sendVerificationMail,
 sendForgotPasswordMail,
 validateEmailAndToken,

} = require("../controllers/auth");

router.route('/register').post(createUser);
router.route('/login').post(loginUser);
router.route('/verify/:id').get(verifyEmail);
router.route('/sendVerificationMail').get(sendVerificationMail);
router.route('/sendForgotPasswordMail').get(sendForgotPasswordMail);
router.route('/validateEmailAndToken').get(validateEmailAndToken);
module.exports = router;