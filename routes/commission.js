const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const {
    createCommission,
    updateCommissionFee,
    getCommissionFeeForPromotion
} = require("../controllers/commission");


router.route("/createCommission").post(authenticateUser, authorizeRole('Admin'), createCommission);
router.route("/updateCommissionFee/:id").patch(authenticateUser,authorizeRole('Admin'), updateCommissionFee);
router.route("/getCommissionFeeForPromotion").get(authenticateUser, authorizeRole('Admin'), getCommissionFeeForPromotion);
module.exports = router;
