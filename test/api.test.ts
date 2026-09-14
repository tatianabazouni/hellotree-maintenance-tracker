import { beforeEach, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.js';
import type {
  MaintenanceRequest,
  RequestRepository,
  RequestStatus,
  User,
} from '../src/types/domain.js';
class MemoryRepository implements RequestRepository {
  users: User[] = [];
  requests: MaintenanceRequest[] = [];
  async findUserByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async findRequest(id: string) {
    return this.requests.find((r) => r.id === id) ?? null;
  }
  async listRequests(f: { clientId?: string; status?: RequestStatus }) {
    return this.requests
      .filter(
        (r) => (!f.clientId || r.clientId === f.clientId) && (!f.status || r.status === f.status),
      )
      .map((r) => ({ ...r, client: this.users.find((u) => u.id === r.clientId)! }));
  }
  async createRequest(i: Pick<MaintenanceRequest, 'clientId' | 'title' | 'description'>) {
    const now = new Date();
    const r: MaintenanceRequest = {
      id: randomUUID(),
      ...i,
      status: 'NEW',
      resolutionNote: null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.requests.push(r);
    return r;
  }
  async updateRequest(
    id: string,
    input: Partial<Pick<MaintenanceRequest, 'status' | 'resolutionNote' | 'resolvedAt'>>,
  ) {
    const r = (await this.findRequest(id))!;
    Object.assign(r, input, { updatedAt: new Date() });
    return r;
  }
}
let repo: MemoryRepository;
let app: ReturnType<typeof createApp>;
let clientA: User;
let clientB: User;
let admin: User;
let oldNew: MaintenanceRequest;
let recentNew: MaintenanceRequest;
let progress: MaintenanceRequest;
const login = async (email: string) =>
  (await request(app).post('/api/auth/login').send({ email, password: 'Password123!' })).body.data
    .token;
beforeEach(async () => {
  repo = new MemoryRepository();
  const passwordHash = await bcrypt.hash('Password123!', 4);
  clientA = { id: randomUUID(), name: 'A', email: 'a@example.com', role: 'CLIENT', passwordHash };
  clientB = { id: randomUUID(), name: 'B', email: 'b@example.com', role: 'CLIENT', passwordHash };
  admin = {
    id: randomUUID(),
    name: 'Admin',
    email: 'admin@example.com',
    role: 'ADMIN',
    passwordHash,
  };
  repo.users.push(clientA, clientB, admin);
  const make = (clientId: string, status: RequestStatus, hours: number): MaintenanceRequest => ({
    id: randomUUID(),
    clientId,
    title: 'Repair item',
    description: 'A sufficiently descriptive issue.',
    status,
    resolutionNote: null,
    resolvedAt: null,
    createdAt: new Date(Date.now() - hours * 3600000),
    updatedAt: new Date(),
  });
  oldNew = make(clientA.id, 'NEW', 25);
  recentNew = make(clientA.id, 'NEW', 24);
  progress = make(clientA.id, 'IN_PROGRESS', 48);
  repo.requests.push(oldNew, recentNew, progress, make(clientB.id, 'DONE', 72));
  app = createApp(repo);
});
describe('authentication and authorization', () => {
  it('logs in valid users and rejects invalid credentials', async () => {
    expect(
      (
        await request(app)
          .post('/api/auth/login')
          .send({ email: clientA.email, password: 'Password123!' })
      ).status,
    ).toBe(200);
    expect(
      (await request(app).post('/api/auth/login').send({ email: clientA.email, password: 'wrong' }))
        .status,
    ).toBe(401);
  });
  it('requires auth and admin role', async () => {
    expect((await request(app).get('/api/requests')).status).toBe(401);
    expect(
      (
        await request(app)
          .get('/api/admin/requests')
          .set('Authorization', `Bearer ${await login(clientA.email)}`)
      ).status,
    ).toBe(403);
  });
});
describe('requests', () => {
  it('isolates client data and assigns ownership server-side', async () => {
    const token = await login(clientA.email);
    const list = await request(app).get('/api/requests').set('Authorization', `Bearer ${token}`);
    expect(list.body.data).toHaveLength(3);
    expect(list.body.data[0].isUrgent).toBe(false);
    expect(
      (
        await request(app)
          .get(`/api/requests/${repo.requests[3].id}`)
          .set('Authorization', `Bearer ${token}`)
      ).status,
    ).toBe(404);
    const made = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New repair', description: 'This description has enough content.' });
    expect(made.status).toBe(201);
    expect(made.body.data.status).toBe('NEW');
    expect(repo.requests.at(-1)?.clientId).toBe(clientA.id);
  });
  it('validates creation and prevents admin creation', async () => {
    const token = await login(clientA.email);
    expect(
      (
        await request(app)
          .post('/api/requests')
          .set('Authorization', `Bearer ${token}`)
          .send({ title: '', description: 'short' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post('/api/requests')
          .set('Authorization', `Bearer ${await login(admin.email)}`)
          .send({ title: 'Valid title', description: 'This description has enough content.' })
      ).status,
    ).toBe(403);
  });
});
describe('admin workflow', () => {
  it('filters at repository level and exposes urgency', async () => {
    const token = await login(admin.email);
    const res = await request(app)
      .get(`/api/admin/requests?status=NEW&clientId=${clientA.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.find((r: { id: string }) => r.id === oldNew.id).isUrgent).toBe(true);
    expect(res.body.data.find((r: { id: string }) => r.id === recentNew.id).isUrgent).toBe(false);
  });
  it('enforces lifecycle and resolution requirement', async () => {
    const token = await login(admin.email);
    expect(
      (
        await request(app)
          .patch(`/api/requests/${oldNew.id}/status`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: 'DONE', resolutionNote: 'No' })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .patch(`/api/requests/${progress.id}/status`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: 'DONE' })
      ).status,
    ).toBe(400);
    const done = await request(app)
      .patch(`/api/requests/${progress.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DONE', resolutionNote: 'Repair completed successfully.' });
    expect(done.status).toBe(200);
    expect(done.body.data.resolutionNote).toBe('Repair completed successfully.');
    expect(
      (
        await request(app)
          .patch(`/api/requests/${progress.id}/status`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: 'NEW' })
      ).status,
    ).toBe(409);
  });
});
