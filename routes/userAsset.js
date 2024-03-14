const express = require("express");
const router = express.Router();

const{
    createUserAsset,
    getAllUserAssets,
    getUserAsset,
    topUpUserAsset,
    deleteUserAsset,
    usdtToAsset,
    assetToUsdt,
    shareUserAsset,
} = require("../controllers/userAsset");

router.route("/addUserAsset").post(createUserAsset);
router.route("/").get(getAllUserAssets)
router.route("/:id").get(getUserAsset).patch(topUpUserAsset).delete(deleteUserAsset);
router.route("/convertFromUsdt/:id").patch(usdtToAsset);
router.route("/convertToUsdt/:id").patch(assetToUsdt);
router.route("/shareUserAsset/:id").patch(shareUserAsset);

module.exports = router;