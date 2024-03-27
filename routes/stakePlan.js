const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const{
    createStakePlan,
    getAllStakePlans,
    getStakePlan,
    updateStakePlan,
    deleteStakePlan,
    deleteAllStakePlans,
} = require("../controllers/stakePlan");

router.route("/addStakePlan").post(authenticateUser, authorizeRole('Admin'), createStakePlan);
router.route("/").get(authenticateUser,getAllStakePlans).delete(authenticateUser, authorizeRole('Admin'),deleteAllStakePlans)
router.route("/:id").get(authenticateUser,getStakePlan).patch(authenticateUser, authorizeRole('Admin'),updateStakePlan).delete(authenticateUser, authorizeRole('Admin'),deleteStakePlan);

module.exports = router;