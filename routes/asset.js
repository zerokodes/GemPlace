const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const{
    createAsset,
    getAllAssets,
    getAsset,
    updateAsset,
    deleteAsset,
    deleteAllAssets,
} = require("../controllers/asset");

router.route("/addAsset").post(authenticateUser, authorizeRole('Admin'), createAsset);
router.route("/").get(authenticateUser,getAllAssets).delete(authenticateUser, authorizeRole('Admin'),deleteAllAssets);
router.route("/:id").get(authenticateUser,getAsset).patch(authenticateUser, authorizeRole('Admin'),updateAsset).delete(authenticateUser, authorizeRole('Admin'),deleteAsset);
module.exports = router;