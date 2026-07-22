// routes/grievanceRoutes.js
import express from 'express';
import {
    createGrievance,
    getMyGrievances,
    getMyResolvedGrievances,
    getCommunityGrievances,
    getAssignedGrievances,
    getEscalatedGrievances,
    getResolvedGrievances,
    polishGrievance,
    summarizeGrievance,
    updateGrievanceStatus,
    addComment,
} from '../controllers/grievanceController.js';
import protect from '../middleware/authMiddleware.js';
import protectStaff from '../middleware/staffAuthMiddleware.js';

const router = express.Router();

// student routes
router.post('/', protect, createGrievance);
router.get('/my', protect, getMyGrievances);
router.get('/my/resolved', protect, getMyResolvedGrievances);
router.post('/polish', protect, polishGrievance);
router.get('/community', protect, getCommunityGrievances);
// routes/grievanceRoutes.js
router.post('/:id/comments', protect, addComment);

// staff routes
router.get('/assigned', protectStaff, getAssignedGrievances);
router.get('/escalated', protectStaff, getEscalatedGrievances);
router.get('/resolved', protectStaff, getResolvedGrievances);
router.patch('/:id/status', protectStaff, updateGrievanceStatus);
router.get('/:id/summarize', protectStaff, summarizeGrievance);


export default router;