const express = require("express");
const router = express.Router();

const{
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct,
} = require("../controllers/product");

router.route("/addProduct").post(createProduct);
router.route("/").get(getAllProducts)
router.route("/:id").get(getProduct).patch(updateProduct).delete(deleteProduct);

module.exports = router;