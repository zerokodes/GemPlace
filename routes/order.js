const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const {
    createOrder,
    orderHistory,
} = require("../controllers/order");

router.route("/order").post(authenticateUser, createOrder);
router.route("/transaction_history/:id").get(authenticateUser, orderHistory);
module.exports = router;