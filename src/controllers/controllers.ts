import type { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from '../errors.js';
import type { RequestRepository } from '../types/domain.js';
import { RequestService } from '../services/request-service.js';
import {
  adminFiltersSchema,
  createRequestSchema,
  loginSchema,
  requestIdSchema,
  statusSchema,
} from '../validation/schemas.js';
export function createControllers(repository: RequestRepository) {
  const service = new RequestService(repository);
  const login: RequestHandler = async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await repository.findUserByEmail(input.email.toLowerCase());
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash)))
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      config.jwtSecret,
      { expiresIn: '8h' },
    );
    res.json({
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });
  };
  const list: RequestHandler = async (req, res) => {
    res.json({ data: await service.listForUser(req.user!) });
  };
  const create: RequestHandler = async (req, res) => {
    res
      .status(201)
      .json({ data: await service.create(req.user!.id, createRequestSchema.parse(req.body)) });
  };
  const get: RequestHandler = async (req, res) => {
    const { id } = requestIdSchema.parse(req.params);
    res.json({ data: await service.getOne(id, req.user!) });
  };
  const adminList: RequestHandler = async (req, res) => {
    res.json({ data: await service.listForAdmin(adminFiltersSchema.parse(req.query)) });
  };
  const updateStatus: RequestHandler = async (req, res) => {
    const { id } = requestIdSchema.parse(req.params);
    const body = statusSchema.parse(req.body);
    res.json({ data: await service.updateStatus(id, body.status, body.resolutionNote) });
  };
  return { login, list, create, get, adminList, updateStatus };
}
