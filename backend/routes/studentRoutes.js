// routes/studentRoutes.js
import express from 'express';
import { signupStudent,loginStudent, forgotPassword, resetPassword,getMe } from '../controllers/studentController.js';
import protect from '../middleware/authMiddleware.js'

const router = express.Router();

router.post('/signup', signupStudent);
router.post('/login', loginStudent);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe); // protected route

export default router;