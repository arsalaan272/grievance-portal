// routes/staffRoutes.js
import express from 'express';
import {
  signupStaff,
  loginStaff,
  forgotPasswordStaff,
  resetPasswordStaff,
  getMeStaff,
} from '../controllers/staffController.js';
import protectStaff from '../middleware/staffAuthMiddleware.js';

const router = express.Router();

router.post('/signup', signupStaff);
router.post('/login', loginStaff);
router.post('/forgot-password', forgotPasswordStaff);
router.put('/reset-password/:token', resetPasswordStaff);

// protected route — needs a valid staff token
router.get('/me', protectStaff, getMeStaff);

export default router;