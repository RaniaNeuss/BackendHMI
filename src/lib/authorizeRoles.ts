// file: src/lib/authorizeRoles.ts
import { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient";

/**
 * Higher-order function that takes a list of allowed roles
 * and returns an Express middleware checking if the user
 * has at least one of those roles.
 */
export function authorizeRoles (permission: string)  {
    return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
          const userId = req.userId;
          if (!userId) {
              res.status(401).json({ error: "unauthorized", message: "User not logged in" });
              return;
          }

          // Fetch the user's roles and their permissions
          const user = await prisma.user.findUnique({
              where: { id: userId },
              include: {
                  groups: {
                      include: { permissions: true }
                  }
              }
          });

          if (!user) {
             res.status(403).json({ error: "forbidden", message: "User not found" });
             return;
          }

          // Check if the user has the required permission
          const hasPermission = user.groups.some(group =>
              group.permissions.some(p => p.action === permission)
          );

          if (!hasPermission) {
               res.status(403).json({ error: "forbidden", message: "Insufficient permissions" });
          }

          next();
      } catch (error) {
          console.error("Authorization error:", error);
          res.status(500).json({ error: "unexpected_error", message: "An error occurred during authorization" });
      }
  };
};