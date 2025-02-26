import { Router } from 'express';
import {
    createDevice,
     editDevice,deleteDevice,getDeviceById,getAllDevices,setTankLevel,testWebAPIConnection,deleteManyDevices,deleteAllDevices
} from '../controllers/deviceController';
import { authenticateUser } from "../lib/authMiddleware";
import { authorizeRoles } from '../lib/authorizeRoles';
const router = Router();

// Create a new device
router.post('/create',authenticateUser,authorizeRoles(['SuperAdmin']), createDevice); // POST /api/devices/create
router.post("/testconnection", testWebAPIConnection);

router.post('/tank/:tankId', setTankLevel);
// Edit an existing device
 router.put('/:id',authenticateUser,authorizeRoles(['SuperAdmin']), editDevice); // PUT /api/devices/edit/:id
// 
 router.get('/',authenticateUser,authorizeRoles(['SuperAdmin']), getAllDevices); 
 router.get('/:id',authenticateUser,authorizeRoles(['SuperAdmin']), getDeviceById); 

 router.delete('/delete-many', deleteManyDevices); 
 router.delete('/remove-all', deleteAllDevices);
 router.delete('/:id',authenticateUser,authorizeRoles(['SuperAdmin']), deleteDevice);












export default router;
