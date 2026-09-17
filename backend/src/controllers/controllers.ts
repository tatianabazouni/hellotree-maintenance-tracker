import type { RequestHandler } from 'express';
import type { RequestRepository } from '../types/domain.js';
import { RequestService } from '../services/request-service.js';
import {
  adminFiltersSchema,
  createRequestSchema,
  requestIdSchema,
  statusSchema,
} from '../validation/schemas.js';
export function createControllers(repository: RequestRepository) {
  const service = new RequestService(repository);
  const publicUser = (user: Awaited<ReturnType<RequestRepository['findUserByEmail']>>) =>
    user && { id: user.id, name: user.name, email: user.email, role: user.role };
  const users: RequestHandler = async (_req, res) => {
    res.json({ data: (await repository.listUsers()).map(publicUser).filter(Boolean) });
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
  return { users, list, create, get, adminList, updateStatus };
}
