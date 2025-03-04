import { Router } from 'express';
// import { setAlarm } from '../controllers/alarmController';
import { setAlarmAck} from '../controllers/alarmController';
import { editAlarm} from '../controllers/alarmController';
import { getAlarmHistory } from '../controllers/alarmController';
import { getAllAlarms,clearOneAlarm,clearAllAlarms,deleteAllAlarmHistories,editAlarmdef, setAlarmDefinition,deleteAlarmDefinition,getAllAlarmDefinitions} from '../controllers/alarmController';
import { authenticateUser } from "../lib/authMiddleware";
import { authorizeRoles } from '../lib/authorizeRoles';
const router = Router();
//****** Alarm Definition Routes ************//
router.post('/setalarmdef/:projectId', authenticateUser, authorizeRoles("setAlarmDefinition"), setAlarmDefinition);
router.put("/definitions/:alarmDefId", authenticateUser, authorizeRoles("editAlarmdef"), editAlarmdef);
router.delete("/definitions/:alarmDefId", authenticateUser, authorizeRoles("deleteAlarmDefinition"), deleteAlarmDefinition);
router.get("/definitions", authenticateUser, authorizeRoles("getAllAlarmDefinitions"), getAllAlarmDefinitions);

//********** Active Alarm Routes ********************//

// Acknowledge alarm
router.post('/:alarmId/acknowledge', authenticateUser, authorizeRoles("setAlarmAck"), setAlarmAck);

// Get alarm history
router.get('/history', authenticateUser, authorizeRoles("getAlarmHistory"), getAlarmHistory);

// Delete all alarm history
router.delete("/history", authenticateUser, authorizeRoles("deleteAllAlarmHistories"), deleteAllAlarmHistories);

// Clear a specific alarm
router.delete("/:alarmId", authenticateUser, authorizeRoles("clearOneAlarm"), clearOneAlarm);

// Clear all alarms
router.delete("/", authenticateUser, authorizeRoles("clearAllAlarms"), clearAllAlarms);

// Fetch all active alarms
router.get('/', authenticateUser, authorizeRoles("getAllAlarms"), getAllAlarms);

// Edit an alarm
router.put("/:alarmId", authenticateUser, authorizeRoles("editAlarm"), editAlarm);
export default router;
