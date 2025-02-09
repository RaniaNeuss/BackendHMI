import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();





export const createItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { viewId } = req.params; // Retrieve viewId from params
        const { type, name, property, events, actions, label,  tagId } = req.body;

        // Validate viewId
        if (!viewId) {
            res.status(400).json({ error: "validation_error", message: "View ID is required." });
            return;
        }

        // Check if the view exists
        const view = await prisma.view.findUnique({
            where: { id: viewId },
        });

        if (!view) {
            res.status(404).json({ error: "not_found", message: "View not found." });
            return;
        }

        // Validate and parse property
        let parsedProperty = [];
        if (property) {
            if (!Array.isArray(property)) {
                res.status(400).json({
                    error: "validation_error",
                    message: "Property must be an array.",
                });
                return;
            }
            parsedProperty = property; // Ensure property is an array
        }

        // Create the new item
        const newItem = await prisma.item.create({
            data: {
                viewId,
                type,
                name,
                property: JSON.stringify(parsedProperty), // Stringify the array for storage
                events: events ? JSON.stringify(events) : null,
                actions: actions ? JSON.stringify(actions) : null,
                label,
              
                tagId,
            },
        });

        res.status(201).json(newItem);
    } catch (err: any) {
        console.error("Failed to create item:", err.message);
        res.status(500).json({
            error: "unexpected_error",
            message: "An error occurred while creating the item.",
        });
    }
};


// Get All Items by view id
export const getAllItems = async (req: Request, res: Response): Promise<void> => {
    try {
        const { viewId } = req.params;

        // Validate viewId
        if (!viewId) {
            res.status(400).json({ error: 'validation_error', message: 'View ID is required.' });
            return;
        }

        // Check if the view exists
        const view = await prisma.view.findUnique({
            where: { id: viewId },
        });

        if (!view) {
            res.status(404).json({ error: 'not_found', message: 'View not found.' });
            return;
        }

        // Fetch all items by viewId
        const items = await prisma.item.findMany({
            where: { viewId }
        });

        res.status(200).json(items);
    } catch (err: any) {
        console.error('Failed to fetch items:', err.message);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while fetching items.' });
    }
};







// Get Item by ID by view id
export const getItemById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { viewId, id } = req.params;

        // Validate viewId
        if (!viewId) {
            res.status(400).json({ error: 'validation_error', message: 'View ID is required.' });
            return;
        }

        // Check if the view exists
        const view = await prisma.view.findUnique({
            where: { id: viewId },
        });

        if (!view) {
            res.status(404).json({ error: 'not_found', message: 'View not found.' });
            return;
        }

        // Fetch the item by id and viewId
        const item = await prisma.item.findUnique({
            where: { id, viewId }
        });

        if (item) {
            res.status(200).json(item);
        } else {
            res.status(404).json({ error: 'not_found', message: 'Item not found' });
        }
    } catch (err: any) {
        console.error(`Failed to fetch item by ID: ${req.params.id} and View ID: ${req.params.viewId}: ${err.message}`);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while fetching the item.' });
    }
};

// Update Item
export const updateItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { type, name, property,events,actions, label, tagId } = req.body;
        const updatedItem = await prisma.item.update({
            where: { id },
            data: {
                type,
                name,
                property: JSON.stringify(property),
                events: JSON.stringify(events),
                actions: JSON.stringify(actions),
                label,
                tagId
            }
        });
        res.status(200).json(updatedItem);
    } catch (err: any) {
        console.error(`Failed to update item by ID: ${req.params.id}: ${err.message}`);
        res.status(500).json({ error: 'unexpected_error', message: 'An error occurred while updating the item.' });
    }
};




export const deleteItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { viewId, id } = req.params;

        // Validate viewId and id
        if (!viewId || !id) {
            res.status(400).json({
                error: 'validation_error',
                message: 'Both view ID and item ID are required.',
            });
            return;
        }

        // Check if the view exists
        const view = await prisma.view.findUnique({
            where: { id: viewId },
        });

        if (!view) {
            res.status(404).json({
                error: 'not_found',
                message: `View with ID ${viewId} not found.`,
            });
            return;
        }

        // Check if the item exists for the specified view
        const item = await prisma.item.findFirst({
            where: {
                id,
                viewId,
            },
        });

        if (!item) {
            res.status(404).json({
                error: 'not_found',
                message: `Item with ID ${id} not found in view ${viewId}.`,
            });
            return;
        }

        // Delete the item
        await prisma.item.delete({
            where: { id },
        });

        res.status(200).json({
            message: `Item with ID ${id} in view ${viewId} deleted successfully.`,
        });
    } catch (err: any) {
        console.error(`Failed to delete item by view ID: ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while deleting the item.',
        });
    }
};



export const deleteAllItemsByViewId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { viewId } = req.params;

        // Validate `viewId`
        if (!viewId) {
            res.status(400).json({
                error: 'validation_error',
                message: 'View ID is required.',
            });
            return;
        }

        // Check if the view exists
        const view = await prisma.view.findUnique({
            where: { id: viewId },
        });

        if (!view) {
            res.status(404).json({
                error: 'not_found',
                message: `View with ID ${viewId} not found.`,
            });
            return;
        }

        // Delete all items for the specified view
        await prisma.item.deleteMany({
            where: { viewId },
        });

        res.status(200).json({
            message: `All items for view with ID ${viewId} have been deleted successfully.`,
        });
    } catch (err: any) {
        console.error(`Failed to delete items for view ID  ${err.message}`);
        res.status(500).json({
            error: 'unexpected_error',
            message: 'An error occurred while deleting items.',
        });
    }
};