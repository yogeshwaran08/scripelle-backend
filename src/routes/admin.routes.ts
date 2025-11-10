import { Router } from 'express';
import {
    addBetaEmail,
    approveUser,
    getWaitlist,
    getBetaAccessList,
    rejectUser,
    removeBetaEmail
} from '../controllers/AdminController';
import { createAdmin, adminLogin } from '../controllers/Authentication';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Public Admin Routes (no authentication required)
 */
// Create admin user
router.post('/create', createAdmin);

// Admin login
router.post('/login', adminLogin);

/**
 * Protected Admin Routes (require authentication and admin privileges)
 */
// All routes below require authentication and admin privileges
router.use(authenticateToken, requireAdmin);

/**
 * Beta Access Management Routes
 */

// Add an email to the beta access list
router.post('/beta/add', addBetaEmail);

// Approve a user from the waiting list
router.post('/beta/approve/:userId', approveUser);

// Reject a user from the waiting list
router.post('/beta/reject/:userId', rejectUser);

// Get all users on the waiting list
router.get('/beta/waitlist', getWaitlist);

// Get all emails in the beta access list
router.get('/beta/list', getBetaAccessList);

// Remove an email from the beta access list
router.delete('/beta/remove/:email', removeBetaEmail);

export default router;
