const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security");
const multer = require("multer");
const {
    createVendorRequest,
    getPendingVendorRequest,
    updateUserToVendor,
    disapproveVendorRequest,
} = require("../controllers/vendorRequest");


const upload = multer({ dest: 'uploads/' })

router.route("/createVendorRequest").post(authenticateUser, authorizeRole('NormalUser'),upload.fields([
    { name: 'idCardImage', maxCount: 1 },
    { name: 'faceImage', maxCount: 1 }
  ]),createVendorRequest);

router.route("/pendingVendorRequest").get(authenticateUser, authorizeRole('Admin'), getPendingVendorRequest)
router.route("/approveRequest/:id").patch(authenticateUser, authorizeRole('Admin'), updateUserToVendor);
router.route("/disapproveRequest/:id").patch(authenticateUser, authorizeRole('Admin'), disapproveVendorRequest);
  module.exports = router;