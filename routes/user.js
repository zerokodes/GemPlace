const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    verifyUser,
    deleteAllUsers,
    resetPassword,
    setPassword,
  } = require("../controllers/user");


  router.route("/").get(authenticateUser, authorizeRole('Admin'),getAllUsers).delete(authenticateUser, authorizeRole('Admin'),deleteAllUsers);
  router.route("/:id").get(authenticateUser, authorizeRole('Admin'),getUser).patch(authenticateUser,updateUser).delete(authenticateUser, authorizeRole('Admin'),deleteUser);
  router.route("/verifyUser/:id").patch(authenticateUser, authorizeRole('Admin'),verifyUser);
  router.route("/resetPassword").post(authenticateUser, resetPassword)
  router.route("/forgotPassword/:email/:id").get(setPassword)

  module.exports = router;