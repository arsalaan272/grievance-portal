// routes/studentRoutes.js
import express from 'express';
import { signupStudent,loginStudent, getSecurityQuestion, resetPasswordWithSecurityAnswers,getMe } from '../controllers/studentController.js';
import protect from '../middleware/authMiddleware.js'

const router = express.Router();

router.post('/signup', signupStudent);
router.post('/login', loginStudent);
router.post('/forgot-password/question', getSecurityQuestion);
router.post('/forgot-password/reset', resetPasswordWithSecurityAnswers);
router.get('/me', protect, getMe); // protected route

export default router;