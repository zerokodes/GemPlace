const express = require("express");
const router = express.Router();

const {
 createUser,
 loginUser,
 verifyEmail,
} = require("../controllers/auth");

router.route("/register").post(createUser);
router.route("/login").post(loginUser);
router.route('/verify/:id').get(verifyEmail);
module.exports = router;