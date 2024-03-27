const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const{
   stake,
   returnStake,
   getAllUserStakePlans,
   deleteAllUserStakePlans
} = require("../controllers/userStakePlan");


router.route("/stake").post(authenticateUser,stake);
router.route("/").get(authenticateUser, authorizeRole('Admin'),getAllUserStakePlans).delete(authenticateUser, authorizeRole('Admin'),deleteAllUserStakePlans);
router.route("/returnStake").patch(returnStake)

module.exports = router;
