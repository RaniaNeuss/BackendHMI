import { Router } from 'express';
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProjectData,
  assignUsersToProject,       
  removeAssignedUsers,
  deleteProject,getUsersByProjectId,inviteUsers,getUnassignedUsers
 
} from '../controllers/projectController';
import { authenticateUser } from "../lib/authMiddleware";
import { authorizeRoles } from '../lib/authorizeRoles';

const router = Router();


// Fetch all projects
router.get("/getprojects", authenticateUser, authorizeRoles("getAllProjects"), getAllProjects);

// Fetch a project by ID
router.get("/:id", authenticateUser, authorizeRoles("getProjectById"), getProjectById);

// Remove specific users from a project
router.delete("/:projectId/removeusers", authenticateUser, authorizeRoles("removeAssignedUsers"), removeAssignedUsers);

// Create a new project
router.post("/create", authenticateUser, authorizeRoles("createProject"), createProject);

// Update specific project data
router.put("/:id", authenticateUser, authorizeRoles("updateProjectData"), updateProjectData);

// Get users assigned to a project
router.get("/:projectId/users", authenticateUser, authorizeRoles("getUsersByProjectId"), getUsersByProjectId);

// Assign users to a project
router.post("/:projectId/assignusers", authenticateUser, authorizeRoles("assignUsersToProject"), assignUsersToProject);

// Get unassigned users for a project
router.get("/:projectId/unassignedusers", authenticateUser, authorizeRoles("getUnassignedUsers"), getUnassignedUsers);

// Invite users to a project
router.post("/:projectId/inviteusers", authenticateUser, authorizeRoles("inviteUsers"), inviteUsers);

// Delete a project by ID
router.delete("/:id", authenticateUser, authorizeRoles("deleteProject"), deleteProject);

























// Get device property
// router.get('/device', getDeviceProperty); // GET /api/projects/device

// Update device property
// router.post('/device', updateDeviceProperty); // POST /api/projects/device

// Upload a file
// router.post('/upload', uploadFile); // POST /api/projects/upload

export default router;
