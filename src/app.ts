import express from 'express';
import cors from 'cors';
import type { RequestRepository } from './types/domain.js';
import { config } from './config.js';
import { createControllers } from './controllers/controllers.js';
import { authenticate, requireRole } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';
export function createApp(repository: RequestRepository) {
  const app = express();
  const c = createControllers(repository);
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  app.post('/api/auth/login', c.login);
  app.get('/api/requests', authenticate, requireRole('CLIENT'), c.list);
  app.post('/api/requests', authenticate, requireRole('CLIENT'), c.create);
  app.get('/api/requests/:id', authenticate, requireRole('CLIENT'), c.get);
  app.patch('/api/requests/:id/status', authenticate, requireRole('ADMIN'), c.updateStatus);
  app.get('/api/admin/requests', authenticate, requireRole('ADMIN'), c.adminList);
  app.get('/api/admin/requests/:id', authenticate, requireRole('ADMIN'), c.get);
  app.use(errorHandler);
  return app;
}
