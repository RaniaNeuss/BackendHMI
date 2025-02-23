

import { PrismaClient,Device,Tag ,Alarm} from '@prisma/client';
import deviceManager from './runtime/devices/deviceManager';

import  alarmManager from './runtime/alarms/alarmmanager';



const prisma = new PrismaClient().$extends({
  query: {
    device: {
      async $allOperations({ operation, args, query }) {
        console.log(`Intercepted operation on Device: ${operation}`);

        let prevDevice: Device | null = null;

        try {
          // For "update" operation, fetch the previous state of the device
          if (operation === 'update') {
            const deviceId = args.where?.id; // Ensure `id` exists in the `where` clause

            if (deviceId) {
              prevDevice = await prisma.device.findUnique({
                where: { id: deviceId }, // Use `id` to find the device
              });
            } else {
              console.warn('No `id` provided in `where` clause for update operation.');
            }
          }

          // Execute the original operation
          const result = await query(args);

          if (operation === 'create') {
            const device = result as Device;
            console.log(`Device created with ID: ${device.id}`);
            if (device.enabled) {
              console.log(`Initializing polling for new device '${device.name}'...`);
              deviceManager.initializeAndPollDevices([device]);
            }
          } else if (operation === 'delete') {
            const deletedDeviceId = args.where?.id;
            if (deletedDeviceId) {
              console.log(`Device deleted with ID: ${deletedDeviceId}`);
              deviceManager.handleDeviceDeleted(deletedDeviceId);
            }
          } else if (operation === 'update') {
            const updatedDevice = result as Device;
            if (prevDevice) {
              console.log(`Device updated with ID: ${updatedDevice.id}`);
              deviceManager.handleDeviceUpdated(updatedDevice, prevDevice);
            } else {
              console.warn(`No previous state found for device with ID: ${args.where?.id}`);
            }
          }

          return result;
        } catch (err) {
          console.error('Error in Prisma middleware:', err);
          throw err;
        }
      },
    },
   



    
    tag: {
      async $allOperations({ operation, args, query }) {
        console.log(`📡 Intercepted operation on Tag: ${operation}`);
        console.log("🔎 Arguments:", args);

        try {
          const result = await query(args); // Execute the DB operation

          if (operation === "create" || operation === "upsert") {
            const createdTag = result as Tag;
            console.log(`✅ New Tag Created: ${createdTag.id}`);

            if (createdTag.deviceId) {
              console.log(`🔄 Notifying device update for tag '${createdTag.label}' in device '${createdTag.deviceId}'`);

              // Fetch latest device data and trigger handleDeviceUpdated
              const updatedDevice = await prisma.device.findUnique({
                where: { id: createdTag.deviceId },
                include: { tags: true },
              });

              if (updatedDevice) {
                deviceManager.handleDeviceUpdated(updatedDevice, updatedDevice);
              } else {
                console.error(`❌ Could not fetch updated device '${createdTag.deviceId}'`);
              }
            }
          }

          return result;
        } catch (err) {
          console.error("❌ Error in Prisma middleware:", err);
          throw err;
        }
      },
    },

  
    alarm: {
      async $allOperations({ operation, args, query }) {
        console.log("Arguments:", args);
    
        let prevAlarm: Alarm | null = null;
    
        // Fetch previous state on update if available.
        if (operation === "update") {

          const alarmId = args.where?.id;
          if (alarmId) {
            prevAlarm = await prisma.alarm.findUnique({
              where: { id: alarmId },
            });
          }
        }
    
        const result = await query(args);
    
        try {
          if (operation === "create") {
            const newAlarm = result as Alarm;
            console.log(`✅ Alarm created with ID: ${newAlarm.id}`);
            alarmManager.addOrUpdateAlarmInMemory(newAlarm);
          } else if (operation === "update") {
            const updatedAlarm = result as Alarm;
            console.log(`♻ Alarm updated with ID: ${updatedAlarm.id}`);
            // Always update the in-memory state, regardless of prevAlarm
            alarmManager.addOrUpdateAlarmInMemory(updatedAlarm);
          } else if (operation === "delete") {
            const deletedAlarmId = args.where?.id;
            if (deletedAlarmId) {
              console.log(`❌ Alarm deleted with ID: ${deletedAlarmId}`);
              alarmManager.removeAlarmInMemory(deletedAlarmId);
            }
          }
        } catch (err) {
          console.error("Error syncing alarm changes to AlarmManager:", err);
        }
    
        return result;
      },
    }
    



  }
  
  
});

export default prisma;