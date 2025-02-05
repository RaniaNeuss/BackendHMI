import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


// Create View by project id
export const createView = async (req: Request, res: Response): Promise<void> => {
    try {
           
        const { projectId } = req.params;
        const { name, width, height, backgroundColor,gridType,property,description} = req.body;
        const userId = req.userId;
        // Validate required fields
        if (!userId  ) {
            res.status(400).json({
                error: 'validation_error',
                message: 'User must be logged in',
            });
            return;
        }
         const existingproject = await prisma.project.findFirst({
            where: {
                id:projectId
            },
        });
        
        if (!existingproject) {
        res.status(400).json({
            error: 'validation_error',
            message: 'Project does not exist',
        });
        return;

    }
        // Check if a view with the same name already exists in the project
        const existingView = await prisma.view.findFirst({
            where: {
                name: name,
                projectId: projectId,
                
            },
            
        });

        if (existingView) {
            res.status(400).json({
                error: 'conflict_error',
                message: 'A view with this name already exists for the user',
            });
            return;
        }

        // Create the new view
        const newView = await prisma.view.create({
            data: {
                name,
                projectId,
                width,
                height,
                description ,
                backgroundColor,
              property: JSON.stringify(property),
                gridType,
              
            },
        });

        res.status(201).json(newView);
    } catch (err: any) {
        console.error('Failed to create view:', err.message);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while creating the view.' });
    }
};


// Get All Views by project id
export const getAllViews = async (req: Request, res: Response): Promise<void> => {
    try {

           

       // Debug: Log session details
       console.log('Session Data:', req.session);

       // Retrieve userId from session
       const userId = req.userId;
     console.log('userId:', userId);

       if (!userId) {
           res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
           return;
       }
        const { projectId } = req.params;

        if (!projectId) {
            res.status(400).json({ error: 'validation_error', message: 'Project ID is required' });
            return;
        }

        // Check if the project exists
        const existingProject = await prisma.project.findFirst({
            where: {
                id: projectId,
            },
        });

        if (!existingProject) {
            res.status(404).json({ error: 'not_found', message: 'Project does not exist' });
            return;
        }

        // Fetch all views for the project
        const views = await prisma.view.findMany({
            where: {
                projectId: projectId,
            },
            select: {
                name: true,
                id: true,
            },
        });

        res.status(200).json(views);
    } catch (err: any) {
        console.error('Failed to fetch views:', err.message);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while fetching views.' });
    }
};






// Get View by ID


export const getViewById = async (req: Request, res: Response): Promise<void> => {
    try {
          // Debug: Log session details
       console.log('Session Data:', req.session);

       // Retrieve userId from session
       const userId = req.userId; 
             console.log('userId:', userId);

       if (!userId) {
           res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
           return;
       }
        const { projectId, id } = req.params; // Retrieve projectId and viewId from params

        // Validate required fields
        if (!id || !projectId) {
            res.status(400).json({
                error: 'validation_error',
                message: 'Both view ID and project ID are required.',
            });
            return;
        }

        // Check if the project exists
        const existingProject = await prisma.project.findFirst({
            where: {
                id: projectId,
            },
        });

        if (!existingProject) {
            res.status(404).json({ error: 'not_found', message: 'Project does not exist' });
            return;
        }

        // Fetch the view using the view ID and project ID
        const view = await prisma.view.findFirst({
            where: {
                id: id,
                projectId: projectId,
            },
            include: {
                items: true, // Include related items
                project: true, // Include project details
            },
        });

        // Check if the view exists
        if (view) {
            res.status(200).json(view);
        } else {
            res.status(404).json({ error: 'not_found', message: 'View not found for the given project.' });
        }
    } catch (err: any) {
        console.error(`Failed to fetch view by ID: ${req.params.id} and projectId: ${req.params.projectId}: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while fetching the view.',
        });
    }
};





export const updateView = async (req: Request, res: Response): Promise<void> => {
    try {

          // Debug: Log session details
       console.log('Session Data:', req.session);

       // Retrieve userId from session
       const userId = req.userId;
        console.log('userId:', userId);

       if (!userId) {
           res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
           return;
       }
        const { projectId, id } = req.params;
        const { name, width, height, backgroundColor, description, property, gridType, items } = req.body;

        if (!id || !projectId) {
            res.status(400).json({ error: 'validation_error', message: 'Both view ID and project ID are required' });
            return;
        }

        // Check if the project exists
        const existingProject = await prisma.project.findFirst({
            where: {
                id: projectId,
            },
        });

        if (!existingProject) {
            res.status(404).json({ error: 'not_found', message: 'Project does not exist' });
            return;
        }

        // Update the view
        const updatedView = await prisma.view.updateMany({
            where: {
                id: id,
                projectId: projectId,
            },
            data: {
                name,
                width,
                description,
                height,
                backgroundColor,
                property: JSON.stringify(property),
                gridType,
            },
        });

        if (updatedView.count === 0) {
            res.status(404).json({ error: 'not_found', message: 'View not found for the given project' });
            return;
        }

        // Update the items associated with the view if provided
        if (Array.isArray(items) && items.length > 0) {
            const updatedItems = await Promise.all(
                items.map(async (item: any) => {
                    const { id: itemId, ...itemData } = item;

                    // Update existing item if `itemId` is provided
                    if (itemId) {
                        return prisma.item.update({
                            where: { id: itemId },
                            data: {
                                ...itemData,
                                updatedAt: new Date(), // Update timestamp
                            },
                        });
                    }

                    // Create a new item if no `itemId` is provided
                    return prisma.item.create({
                        data: {
                            ...itemData,
                            viewId: id, // Associate with the current view
                        },
                    });
                })
            );

            console.log(`Updated items for view '${id}':`, updatedItems);
        }

        res.status(200).json({ message: 'View and associated items updated successfully' });
    } catch (err: any) {
        console.error(`Failed to update view by ID: ${req.params.id} and projectId: ${req.params.projectId}: ${err.message}`);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while updating the view and items' });
    }
};


// Delete View
export const deleteView = async (req: Request, res: Response): Promise<void> => {
    try {

          // Debug: Log session details
       console.log('Session Data:', req.session);

       // Retrieve userId from session
       const userId = req.userId;
       console.log('userId:', userId);

       if (!userId) {
           res.status(401).json({ error: 'unauthorized', message: 'User is not logged in' });
           return;
       }
        const { projectId, id } = req.params;

        if (!id || !projectId) {
            res.status(400).json({ error: 'validation_error', message: 'Both view ID and project ID are required' });
            return;
        }

        // Check if the project exists
        const existingProject = await prisma.project.findFirst({
            where: {
                id: projectId,
            },
        });

        if (!existingProject) {
            res.status(404).json({ error: 'not_found', message: 'Project does not exist' });
            return;
        }

        // Check if the view exists
        const existingView = await prisma.view.findFirst({
            where: {
                id: id,
                projectId: projectId,
            },
        });

        if (!existingView) {
            res.status(404).json({ error: 'not_found', message: 'View not found for the given project' });
            return;
        }

        // Delete the view
        await prisma.view.delete({
            where: {
                id: id,
            },
        });

        res.status(200).json({ message: 'View deleted successfully' });
    } catch (err: any) {
        console.error(`Failed to delete view by ID: ${req.params.id} and projectId: ${req.params.projectId}: ${err.message}`);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while deleting the view.' });
    }
};







