const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const {
    createOrder,
    orderHistory,
    getAllOrderHistory,
} = require("../controllers/order");

router.route("/order").post(authenticateUser, createOrder);
router.route("/orderHistory/:id").get(authenticateUser, orderHistory);
router.route("/allOrderHistory").get(authenticateUser, authorizeRole('Admin'), getAllOrderHistory);
module.exports = router;