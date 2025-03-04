import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting seed script...");

    // Seed group: SuperAdmin
    const superAdminGroup = await prisma.group.upsert({
        where: { name: 'SuperAdmin' },
        update: {}, // If it exists, don't modify
        create: { name: 'SuperAdmin' }, // If it doesn't exist, create it
    });
    console.log(`Group '${superAdminGroup.name}' ensured.`);

    // Seed user: SuperAdmin
    const superAdminUser = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {}, // If the user exists, don't modify it
        create: {
            username: 'admin',
            email: 'admin@main.com',
            password: await bcrypt.hash('password123456', 10), // Hash the password
            groups: {
                connect: { id: superAdminGroup.id }, // Link to SuperAdmin group
            },
        },
    });
    console.log(`SuperAdmin user '${superAdminUser.username}' ensured.`);

    const permissions = [
        // Project Management
        "createProject", "getAllProjects", "getProjectById", "updateProjectData",
        "assignUsersToProject", "removeAssignedUsers", "deleteProject",
        "getUsersByProjectId", "inviteUsers", "getUnassignedUsers",

        // View Management
        "createView", "getAllViews", "getViewById", "updateView", "deleteView",

        // User Management
        "getUsers", "refreshtoken", "editUser", "Register",
        "createUser", "deleteUser", "getGroups", "createGroup",
        "deleteGroup", "getUser", "login", "authStatus",
        "logout", "editProfile",

        // Settings Management
        "createSettings", "getAllSettings", "getSettingsById",
        "updateSettings", "deleteSettings",

        // Device Management
        "createDevice", "editDevice", "deleteDevice",
        "getDeviceById", "getAllDevices", "setTankLevel",
        "testWebAPIConnection", "deleteManyDevices", "deleteAllDevices",

        // Alarm Management
        "getAllAlarms", "clearOneAlarm", "clearAllAlarms",
        "deleteAllAlarmHistories", "editAlarmdef", "setAlarmDefinition",
        "deleteAlarmDefinition", "getAllAlarmDefinitions"
    ];

    // Upsert permissions to avoid duplication
    for (const action of permissions) {
        await prisma.permission.upsert({
            where: { action },
            update: {},
            create: { action },
        });
    }
    console.log("Permissions seeded successfully!");

    // 4️⃣ **Assign All Permissions to SuperAdmin**
    const allPermissions = await prisma.permission.findMany();
    await prisma.group.update({
        where: { id: superAdminGroup.id },
        data: {
            permissions: {
                connect: allPermissions.map((perm) => ({ id: perm.id })),
            },
        },
    });

    console.log(`All permissions assigned to '${superAdminGroup.name}'.`);







}




main()
    .then(() => {
        console.log("Seeding completed.");
        prisma.$disconnect();
    })
    .catch((error) => {
        console.error("Seeding failed:", error);
        prisma.$disconnect();
        process.exit(1);
    });
