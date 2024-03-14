const express = require("express");
const router = express.Router();

const{
    createAsset,
    getAllAssets,
    getAsset,
    updateAsset,
    deleteAsset,
} = require("../controllers/asset");

router.route("/addAsset").post(createAsset);
router.route("/").get(getAllAssets)
router.route("/:id").get(getAsset).patch(updateAsset).delete(deleteAsset);

module.exports = router;