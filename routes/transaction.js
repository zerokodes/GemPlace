const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRole } = require("../middleware/security")

const {
    createBuyTransaction,
    getAllTransactionHistoryByIdForAUser,
    getAllPendingTransaction,
    approveTransaction,
    disapproveTransaction,
    placeWithdrawalRequest,
    approveWithdrawal,
    disapproveWithdrawal,
} = require('../controllers/transaction')

router.route('/createBuyTransaction').post(authenticateUser, createBuyTransaction)
router.route('/transactionHistoryForAUser/:id').get(authenticateUser, getAllTransactionHistoryByIdForAUser)
router.route('/pendingTransactions').get(authenticateUser, authorizeRole('Admin'), getAllPendingTransaction)
router.route('/approveTransaction/:id').patch(authenticateUser,authorizeRole('Admin'), approveTransaction)
router.route('/disapproveTransaction/:id').patch(authenticateUser,authorizeRole('Admin'), disapproveTransaction)
router.route('/placeWithdrawal').post(authenticateUser, placeWithdrawalRequest);
router.route('/approveWithdrawal/:id').patch(authenticateUser,authorizeRole('Admin'), approveWithdrawal)
router.route('/disapproveWithdrawal/:id').patch(authenticateUser,authorizeRole('Admin'), disapproveWithdrawal)
module.exports = router;
