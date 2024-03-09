const express = require("express");
const router = express.Router();

const {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
  } = require("../controllers/user");


  router.route("/").get(getAllUsers)
  router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

  module.exports = router;