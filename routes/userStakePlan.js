const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const{
   stake,
   returnStake,
   getAllUserStakePlans,
   deleteAllUserStakePlans,
   getUserStakePlans
} = require("../controllers/userStakePlan");


router.route("/stake").post(authenticateUser,stake);
router.route("/").get(authenticateUser, authorizeRole('Admin'),getAllUserStakePlans).delete(authenticateUser, authorizeRole('Admin'),deleteAllUserStakePlans);
router.route("/returnStake").patch(returnStake)
router.route("/allUserStakePlans/:id").get(authenticateUser, getUserStakePlans);

module.exports = router;
