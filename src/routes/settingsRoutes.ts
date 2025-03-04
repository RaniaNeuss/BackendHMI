import { Router } from 'express';
import {
    createSettings,
    getAllSettings,
    getSettingsById,
    updateSettings,
    deleteSettings
} from '../controllers/settingsController';
import { authenticateUser } from "../lib/authMiddleware";
import { authorizeRoles } from '../lib/authorizeRoles';
const router = Router();

// Create new settings for a project
router.post('/:projectId', authenticateUser, authorizeRoles("createSettings"), createSettings);

// Fetch all settings for a project
router.get('/:projectId', authenticateUser, authorizeRoles("getAllSettings"), getAllSettings);

// Fetch settings by ID for a project
router.get('/:projectId/:id', authenticateUser, authorizeRoles("getSettingsById"), getSettingsById);

// Update settings by ID for a project
router.put('/:projectId', authenticateUser, authorizeRoles("updateSettings"), updateSettings);

// Delete settings by ID for a project
router.delete('/:projectId/:id', authenticateUser, authorizeRoles("deleteSettings"), deleteSettings);

export default router;