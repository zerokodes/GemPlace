const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const {
    createBuyTransaction,
    getAllTransactionHistoryByIdForAUser
} = require('../controllers/transaction')

router.route('/createBuyTransaction').post(authenticateUser, createBuyTransaction)
router.route('/transactionHistoryForAUser/:id').get(authenticateUser, getAllTransactionHistoryByIdForAUser)
module.exports = router;