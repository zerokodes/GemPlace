const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")
const multer = require('multer');

const{
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    deleteAllProducts,
} = require("../controllers/product");

const upload = multer({ dest: 'uploads/' });

router.route("/addProduct").post(authenticateUser,authorizeRole(['Vendor','Admin']),upload.single('image'),createProduct);
router.route("/").get(authenticateUser,getAllProducts).delete(authenticateUser, authorizeRole('Admin'),deleteAllProducts)
router.route("/:id").get(authenticateUser,getProduct).patch(authenticateUser, authorizeRole(['Admin', 'Vendor']),updateProduct).delete(authenticateUser, authorizeRole(['Admin', 'Vendor']),deleteProduct);

module.exports = router;