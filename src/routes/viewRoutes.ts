import { Router } from 'express';
import {
    createView,
    getAllViews,
    getViewById,
    updateView,
    deleteView
} from '../controllers/viewController';
import { authenticateUser } from "../lib/authMiddleware";
import { authorizeRoles } from '../lib/authorizeRoles';

const router = Router();
// Create a new view
router.post('/:projectId', authenticateUser, authorizeRoles("createView"), createView);

// Fetch all views
router.get('/:projectId', authenticateUser, authorizeRoles("getAllViews"), getAllViews);

// Fetch a view by ID
router.get('/:projectId/:id', authenticateUser, authorizeRoles("getViewById"), getViewById);

// Update a view by ID
router.put('/:projectId/:id', authenticateUser, authorizeRoles("updateView"), updateView);

// Delete a view by ID
router.delete('/:projectId/:id', authenticateUser, authorizeRoles("deleteView"), deleteView);

export default router;




