const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const{
    createUserAsset,
    getAllUserAssets,
    getUserAsset,
    topUpUserAsset,
    deleteUserAsset,
    usdtToAsset,
    assetToUsdt,
    shareUserAsset,
    deleteAllUserAssets,
} = require("../controllers/userAsset");

router.route("/addUserAsset").post(authenticateUser,createUserAsset);
router.route("/").get(authenticateUser,authorizeRole('Admin'),getAllUserAssets).delete(authenticateUser, authorizeRole('Admin'),deleteAllUserAssets)
router.route("/:id").get(authenticateUser,getUserAsset).patch(authenticateUser, authorizeRole('Admin'),topUpUserAsset).delete(authenticateUser, authorizeRole('Admin'),deleteUserAsset);
router.route("/convertFromUsdt/:id").patch(authenticateUser,usdtToAsset);
router.route("/convertToUsdt/:id").patch(authenticateUser,assetToUsdt);
router.route("/shareUserAsset/:id").patch(authenticateUser,shareUserAsset);

module.exports = router;