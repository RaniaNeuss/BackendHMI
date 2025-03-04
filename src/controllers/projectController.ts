// Import required modules
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import nodemailer from 'nodemailer';

import { authenticateUser } from "../lib/authMiddleware";



// Controller: Create Project
export const createProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ error: 'unauthorized', message: 'User is not logged in.' });
            return;
        }
        const { name, description } = req.body;

        if (!name) {
            res.status(400).json({
                error: 'validation_error',
                message: 'Project name is required',
            });
            return;
        }

        // Check if a project with the same name exists
        const existingProject = await prisma.project.findFirst({
            where: { name, userId },
        });

        if (existingProject) {
            res.status(400).json({
                error: 'conflict_error',
                message: 'A project with this name already exists for the user',
            });
            return;
        }

        // Create the project
        const newProject = await prisma.project.create({
            data: {
                name,
                description,
                userId,
            },
        });

        res.status(201).json({ message: 'Project created successfully', project: newProject });
    } catch (err: any) {
        console.error(`Failed to create projects for userId ${req.userId}: ${err.message}`);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while creating the project' });
    }
};




// Controller: Get Users by Project ID
export const getUsersByProjectId = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Session Data:', req.session);

        const userId = req.userId; // Logged-in user
        console.log('userId:', userId);

        // if (!userId) {
        //     res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
        //     return;
        // }

        const { projectId } = req.params;

        if (!projectId) {
            res.status(400).json({
                error: 'validation_error',
                message: 'Project ID is required.',
            });
            return;
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                users: {
                    include: {
                        groups: true, // Include user groups
                    },
                },
            },
        });

        if (!project) {
            res.status(404).json({
                error: 'not_found',
                message: `Project with ID ${projectId} not found.`,
            });
            return;
        }

       

        const assignedUsers = project.users;

        console.info(`Fetched users assigned to project ${projectId} successfully.`);
        res.status(200).json({
            projectId,
            assignedUsers,
        });
    } catch (err: any) {
        console.error(`Failed to fetch users for project ${req.params.projectId}: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while fetching users for the project.',
        });
    }
};



// Controller: Fetch All Projects
export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        // if (!userId) {
        //     res.status(401).json({ error: 'unauthorized', message: 'User is not logged in.' });
        //     return;
        // }

        // Fetch projects owned by the user or where the user is assigned
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { userId: userId }, // Projects owned by the user
                    { users: { some: { id: userId } } }, // Projects the user is assigned to
                ],
            },
        });

        console.info(`Fetched all projects for userId: ${userId}`);
        res.status(200).json(projects);
    } catch (err: any) {
        console.error(`Failed to fetch projects for userId ${req.userId}: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while fetching projects.',
        });
    }
};


// Controller: Fetch Project by ID

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Retrieve userId from session
        const userId = req.userId;
        // Validate that both ID and userId exist
        if (!id || !userId) {
            console.warn('Project ID or User ID is missing in request or session');
            res.status(400).json({
                error: 'validation_error',
                message: 'Both Project ID and User must be logged in',
            });
            return;
        }

        // Fetch the project associated with the given ID and userId
        const project = await prisma.project.findFirst({
            where: {
                id: id,
                OR: [
                    { userId: userId }, // Fetch if the user is the owner
                    { users: { some: { id: userId } } }, // Fetch if the user is assigned
                ],
            },
            include: {
                alarms: true,
                devices: true,
                reports: true,
                scripts: true,
                texts: true,
                events: true,
                views: true,
            },
        });

        if (project) {
            console.info(`Fetched project with ID: ${id} for userId: ${userId}`);
            res.status(200).json(project);
        } else {
            console.warn(`Project not found with ID: ${id} for userId: ${userId}`);
            res.status(404).json({
                error: 'not_found',
                message: 'Project not found for the given user',
            });
        }
    } catch (err: any) {
        console.error(
            `Failed to fetch project by ID: ${req.params.id} for userId from session: ${err.message}`
        );
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while fetching the project.',
        });
    }
};

// Controller: Update Project Data
export const updateProjectData = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Project ID
        const userId = req.userId; // Logged-in user ID
        const { data } = req.body; // Data to update

        // Validate that ID, userId, and data exist
        if (!id || !userId || !data) {
            console.warn('Project ID, User ID, or data is missing in request or session');
            res.status(400).json({
                error: 'validation_error',
                message: 'Project ID, User must be logged in, and data is required',
            });
            return;
        }

        // Fetch the project and include its owner and assigned users
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                users: true, // Include assigned users
            },
        });

        // Check if the project exists
        if (!project) {
            console.warn(`Project not found with ID: ${id}`);
            res.status(404).json({
                error: 'not_found',
                message: `Project with ID ${id} not found.`,
            });
            return;
        }

        // Verify if the logged-in user is either the project owner or an assigned user
        const isOwner = project.userId === userId;
        const isAssignedUser = project.users.some((user) => user.id === userId);

        if (!isOwner && !isAssignedUser) {
            console.warn(`User ID: ${userId} does not have permission to update project ID: ${id}`);
            res.status(403).json({
                error: 'forbidden',
                message: 'You do not have permission to update this project.',
            });
            return;
        }

        // Update project data
        const updatedProject = await prisma.project.update({
            where: { id },
            data,
        });

        console.info(`Updated project with ID: ${id} for userId: ${userId}`);
        res.status(200).json({
            message: 'Project updated successfully',
            project: updatedProject,
        });
    } catch (err: any) {
        console.error('Failed to update project data:', err.message);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while updating the project.',
        });
    }
};



export const deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Validate that both ID and userId exist
        if (!id || !userId) {
            console.warn('Project ID or User ID is missing in request or session');
            res.status(400).json({
                error: 'validation_error',
                message: 'Both Project ID and User must be logged in',
            });
            return;
        }

        // Delete the project associated with the given ID and userId
        const deletedProject = await prisma.project.deleteMany({
            where: {
                id: id,
                userId: userId,
            },
        });

        if (deletedProject.count > 0) {
            console.info(`Deleted project with ID: ${id} for userId: ${userId}`);
            res.status(200).json({ message: 'Project deleted successfully' });
        } else {
            console.warn(`Project not found with ID: ${id} and userId: ${userId}`);
            res.status(404).json({ error: 'not_found', message: 'Project not found for the given user' });
        }
    } catch (err: any) {
        console.error(`Failed to delete project by ID: ${req.params.id} for userId from session: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while deleting the project.',
        });
    }
};


//Assigne Users in a Project
export const assignUsersToProject = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Session Data:', req.session);

        const userId = req.userId; // Logged-in user
        console.log('userId:', userId);

        // if (!userId) {
        //     res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
        //     return;
        // }

        const { projectId } = req.params;
        const { userIds } = req.body;

        if (!projectId) {
            res.status(400).json({ error: 'validation_error', message: 'Project ID is required.' });
            return;
        }

        if (!Array.isArray(userIds) || userIds.length === 0) {
            res.status(400).json({ error: 'validation_error', message: 'User IDs must be a non-empty array.' });
            return;
        }

        // Check if the logged-in user is the owner of the project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            res.status(404).json({
                error: 'not_found',
                message: `Project with ID ${projectId} not found.`,
            });
            return;
        }

        if (project.userId !== userId) {
            res.status(403).json({
                error: 'forbidden',
                message: 'You do not have permission to modify this project.',
            });
            return;
        }

        // Fetch users who are already assigned to this project
        const alreadyAssignedUsers = await prisma.user.findMany({
            where: {
                id: { in: userIds },
                status: "assigned",
                projects: { some: { id: projectId } } // Ensure they are assigned to this specific project
            },
            select: { id: true, email: true, username: true }
        });

        // If any users are already assigned, return their details
        if (alreadyAssignedUsers.length > 0) {
            res.status(400).json({
                error: "conflict_error",
                message: "The following users are already assigned to this project.",
                alreadyAssignedUsers, // Returns list of users already assigned
            });
            return;
        }

        // Update users' status to "assigned" and connect them to the project
        await prisma.$transaction([
            prisma.user.updateMany({
                where: {
                    id: { in: userIds },
                    status: "active" // Only update users who are "active"
                },
                data: {
                    status: "assigned"
                }
            }),
            prisma.project.update({
                where: { id: projectId },
                data: {
                    users: {
                        connect: userIds.map((id) => ({ id })), // Add new users
                    },
                },
            })
        ]);

        console.info(`Users added to project ${projectId} successfully.`);
        res.status(200).json({
            message: 'Users assigned to the project successfully.',
            projectId,
            addedUsers: userIds,
        });
    } catch (err: any) {
        console.error(`Failed to assign users to project ${req.params.projectId}: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while assigning users to the project.',
        });
    }
};





// Controller: Remove Assigned Users from a Project and Update Status
export const removeAssignedUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId; // Logged-in user
        const { projectId } = req.params;
        const { userIds } = req.body; // List of users to remove

        // if (!userId) {
        //     res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
        //     return;
        // }

        if (!projectId) {
            res.status(400).json({ error: 'validation_error', message: 'Project ID is required.' });
            return;
        }

        if (!Array.isArray(userIds) || userIds.length === 0) {
            res.status(400).json({ error: 'validation_error', message: 'User IDs must be a non-empty array.' });
            return;
        }

        // Check if the logged-in user is the owner of the project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            res.status(404).json({ error: 'not_found', message: 'Project not found.' });
            return;
        }

        if (project.userId !== userId) {
            res.status(403).json({
                error: 'forbidden',
                message: 'You do not have permission to remove users from this project.',
            });
            return;
        }

        // Check users' current status before removing
        const usersToUpdate = await prisma.user.findMany({
            where: {
                id: { in: userIds },
                status: { in: ["assigned", "invited"] } // Only update if status is "assigned" or "invited"
            },
            select: { id: true, email: true, status: true }
        });

        if (usersToUpdate.length === 0) {
            res.status(400).json({
                error: 'validation_error',
                message: 'No users found with "assigned" or "invited" status.',
            });
            return;
        }

        // Perform both updates in a transaction
        await prisma.$transaction([
            prisma.user.updateMany({
                where: { id: { in: usersToUpdate.map(user => user.id) } },
                data: { status: "active" } // Change status back to "active"
            }),
            prisma.project.update({
                where: { id: projectId },
                data: {
                    users: {
                        disconnect: usersToUpdate.map(user => ({ id: user.id })), // Remove users from project
                    },
                },
            }),
        ]);

        console.info(`Removed users from project ${projectId}. Status updated to "active".`);
        res.status(200).json({
            message: 'Users removed successfully and status updated to "active".',
            projectId,
            removedUsers: usersToUpdate.map(user => ({
                id: user.id,
                email: user.email,
                previousStatus: user.status, // Show what status they had before
                newStatus: "active"
            })),
        });
    } catch (err: any) {
        console.error(`Failed to remove users from project ${req.params.projectId}: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while removing users from the project.',
        });
    }
};




// Fetch unassigned users (Only Operators, Excluding Super Admins)
export const getUnassignedUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            res.status(400).json({ error: 'validation_error', message: 'Project ID is required.' });
            return;
        }

        const unassignedUsers = await prisma.user.findMany({
            where: {status: { not: "assigned" }, // Exclude users with status "assigned"

                groups: {
                    some: { name: 'Operator' } // Only users in "Operator" group
                },
                projects: {
                    none: { id: projectId } // Exclude users assigned to the given project
                },
              
            },
            select: { id: true, email: true, username: true ,status : true , groups: { 
                select: { name: true } // Select only the group names
            }}
        });

        res.status(200).json(unassignedUsers);
    } catch (err: any) {
        console.error('Failed to fetch unassigned users:', err.message);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while fetching unassigned users.' });
    }
};



export const inviteUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        // if (!userId) {
        //     res.status(401).json({ error: 'unauthorized', message: 'Admin is not logged in' });
        //     return;
        // }

        const { projectId } = req.params;
        const { emails } = req.body;

        if (!projectId) {
            res.status(400).json({ error: "validation_error", message: "Project ID is required." });
            return;
        }

        if (!Array.isArray(emails) || emails.length === 0) {
            res.status(400).json({ error: "validation_error", message: "Emails must be provided as a non-empty array" });
            return;
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } });

        if (!project) {
            res.status(404).json({ error: "not_found", message: `Project with ID ${projectId} not found.` });
            return;
        }

        for (const email of emails) {
            // Check if the user already exists
            const existingUser = await prisma.user.findUnique({ where: { email } });

            if (existingUser) {
                if (existingUser.status === "active" || existingUser.status === "assigned") {
                    res.status(409).json({
                        error: "conflict_error",
                        message: `The email ${email} is already registered and cannot be invited.`,
                    });
                    return; // Stop execution
                }
                if (existingUser.status === "invited") {
                    res.status(409).json({
                        error: "conflict_error",
                        message: `The email ${email} has already been invited.`,
                    });
                    return; // Stop execution
                }
            }
        }

        const invitedUsers = [];

        for (const email of emails) {
            // Create an "invited" user
            const newUser = await prisma.user.create({
                data: {
                    email,
                    username: email.split('@')[0], // Default username from email
                    password: "", // No password set until registration
                    info: "Invited user",
                    status: "invited", // Track invited status
                    groups: {
                        connect: [{ name: "Operator" }], // Assign to Operator group
                    },
                    projects: { connect: [{ id: projectId }] }, // Assign to the project
                },
            });

            invitedUsers.push(newUser);

            // Send an email invitation
            await sendInvitationEmail(email, projectId);
        }

        res.status(201).json({
            message: "Users invited successfully.",
            projectId,
            invitedUsers
        });

    } catch (err: any) {
        console.error("Failed to invite users:", err.message);
        res.status(500).json({ error: "unexpected_error", message: "An error occurred while inviting users." });
    }
};





// export const inviteUsers = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const userId = req.userId;
//         if (!userId) {
//             res.status(401).json({ error: 'unauthorized', message: 'Admin is not logged in' });
//             return;
//         }
//         const { projectId } = req.params;
//         const { emails } = req.body;
//         if (!projectId) {
//             res.status(400).json({ error: "validation_error", message: "Project ID is required." });
//             return;
//         }
//         if (!Array.isArray(emails) || emails.length === 0) {
//             res.status(400).json({ error: "validation_error", message: "Emails must be provided as a non-empty array" });
//             return;
//         }
//         const project = await prisma.project.findUnique({ where: { id: projectId } });

//         if (!project) {
//             res.status(404).json({ error: "not_found", message: `Project with ID ${projectId} not found.` });
//             return;
//         }
//         const invitedUsers = [];

//         for (const email of emails) {
//             // Check if the user already exists
//             const existingUser = await prisma.user.findUnique({ where: { email } });

//             if (existingUser) {
//                 console.warn(`User with email "${email}" already exists.`);
//                 continue; // Skip existing users
//             }

//             // Create an "invited" user
//            const newUser = await prisma.user.create({
//             data: {
//                 email,
//                 username: email.split('@')[0], // Default username from email
//                 password: "", // No password set until registration
//                 info: "Invited user",
//                 status: "invited", // Track invited status
//                 groups: {
//                     connect: [{ name: "Operator" }], // Assign to Operator group
//                 },
//                 projects: { connect: [{ id: projectId }] }, // Assign to the project
//             },
//         });

//             invitedUsers.push(newUser);

//             // Send an email invitation
//             await sendInvitationEmail(email,projectId);
//         }

//         res.status(200).json({
//             message: "Users invited successfully to the project.",
//             projectId,
//             invitedUsers,
//         });
//     } catch (err: any) {
//         console.error("Failed to invite users:", err.message);
//         res.status(500).json({ error: "unexpected_error", message: "An error occurred while inviting users." });
//     }
// };






// Function to send an invitation email


const sendInvitationEmail = async (email: string, projectId: string) => {
    try {
        // Fetch project settings
        const settings = await prisma.settings.findUnique({
            where: { projectId },
        });

        if (!settings || !settings.form) {
            console.error(`No SMTP configuration found for project: ${projectId}`);
            return;
        }

        // Parse the settings JSON
        const config = JSON.parse(settings.form);
        const smtpConfig = config.stepTwo; // Extract SMTP settings

        if (!smtpConfig || !smtpConfig.host || !smtpConfig.mailSender || !smtpConfig.password) {
            console.error("Incomplete SMTP configuration.");
            return;
        }

        // Create transporter with user-supplied credentials
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: smtpConfig.mailSender,
                pass: smtpConfig.password,
            },
        });

       


        const registrationLink = `http://your-app.com/register?email=${encodeURIComponent(email)}&projectId=${projectId}`;

        await transporter.sendMail({
            from: `"Project Admin" <${smtpConfig.mailSender}>`,
            to: email,
            subject: "Neuss Project Invitation!",
            text: `Hello,\n\nYou have been invited to join our system. Click the link below to register:\n${registrationLink}\n\nBest regards,\nNeuss Team`,
            html: `<p>Hello,</p><p>You have been invited to join our system. Click the link below to register:</p><a href="${registrationLink}">Register Here</a><p>Best regards,<br>Neuss Team</p>`,
        });

        console.info(`Invitation email sent to ${email} using ${smtpConfig.mailSender}`);
    } catch (error) {
        console.error(`Failed to send invitation email to ${email}:`, error);
    }
};



