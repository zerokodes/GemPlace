const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const {
    createOrder,
} = require("../controllers/order");

router.route("/order").post(authenticateUser, createOrder);

module.exports = router;