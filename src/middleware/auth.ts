import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from '../errors.js';
import type { Role } from '../types/domain.js';
export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  email: string;
}
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return next(new AppError(401, 'UNAUTHORIZED', 'Authentication is required'));
  try {
    req.user = jwt.verify(token, config.jwtSecret) as AuthUser;
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired authentication token'));
  }
}
export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction) =>
    req.user?.role === role
      ? next()
      : next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
}
