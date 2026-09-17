import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors.js';
import type { RequestRepository, Role } from '../types/domain.js';
export interface DemoRequestUser {
  id: string;
  role: Role;
  name: string;
  email: string;
}
declare global {
  // Express exposes request augmentation through this namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: DemoRequestUser;
    }
  }
}
export function selectDemoUser(repository: RequestRepository) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.header('x-demo-user-id');
    if (!userId) return next(new AppError(401, 'DEMO_USER_REQUIRED', 'Select a demo user first'));
    try {
      const user = await repository.findUserById(userId);
      if (!user)
        return next(new AppError(401, 'DEMO_USER_NOT_FOUND', 'Selected demo user was not found'));
      req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
      next();
    } catch (error) {
      next(error);
    }
  };
}
export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction) =>
    req.user?.role === role
      ? next()
      : next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
}
