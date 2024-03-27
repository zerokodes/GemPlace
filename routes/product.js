const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const{
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    deleteAllProducts,
} = require("../controllers/product");

router.route("/addProduct").post(authenticateUser, authorizeRole('Vendor'),createProduct);
router.route("/").get(authenticateUser,getAllProducts).delete(authenticateUser, authorizeRole('Admin'),deleteAllProducts)
router.route("/:id").get(authenticateUser,getProduct).patch(authenticateUser, authorizeRole(['Admin', 'Vendor']),updateProduct).delete(authenticateUser, authorizeRole(['Admin', 'Vendor']),deleteProduct);

module.exports = router;