import express from 'express';
import cors from 'cors';
import type { RequestRepository } from './types/domain.js';
import { isAllowedCorsOrigin } from './config.js';
import { createControllers } from './controllers/controllers.js';
import { requireRole, selectDemoUser } from './middleware/demo-user.js';
import { errorHandler } from './middleware/error.js';
export function createApp(repository: RequestRepository) {
  const app = express();
  const c = createControllers(repository);
  const demoUser = selectDemoUser(repository);
  app.use(
    cors({
      origin: (origin, callback) => callback(null, isAllowedCorsOrigin(origin)),
      credentials: true,
    }),
  );
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  app.get('/api/auth/users', c.users);
  app.get('/api/requests', demoUser, requireRole('CLIENT'), c.list);
  app.post('/api/requests', demoUser, requireRole('CLIENT'), c.create);
  app.get('/api/requests/:id', demoUser, requireRole('CLIENT'), c.get);
  app.patch('/api/requests/:id/status', demoUser, requireRole('ADMIN'), c.updateStatus);
  app.get('/api/admin/requests', demoUser, requireRole('ADMIN'), c.adminList);
  app.get('/api/admin/requests/:id', demoUser, requireRole('ADMIN'), c.get);
  app.use(errorHandler);
  return app;
}
