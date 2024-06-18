const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const {
    createOrder,
    orderHistory,
    getAllOrderHistory,
    getAllPendingOrder,
    approveOrder,
    disapproveOrder
} = require("../controllers/order");

router.route("/order").post(authenticateUser, createOrder);
router.route("/orderHistory/:id").get(authenticateUser, orderHistory);
router.route("/allOrderHistory").get(authenticateUser, authorizeRole('Admin'), getAllOrderHistory);
router.route("/pendingOrder").get(authenticateUser,authorizeRole('Admin'), getAllPendingOrder);
router.route("/approveOrder/:id").patch(authenticateUser,authorizeRole('Admin'), approveOrder);
router.route("/disapproveOrder/:id").patch(authenticateUser,authorizeRole('Admin'), disapproveOrder)
module.exports = router;