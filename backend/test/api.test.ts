import { beforeEach, describe, expect, it } from 'vitest';
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
  async findUserById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async listUsers() {
    return this.users;
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
  async createRequest(
    i: Pick<MaintenanceRequest, 'clientId' | 'title' | 'description' | 'priority'>,
  ) {
    const now = new Date();
    const r: MaintenanceRequest = {
      id: randomUUID(),
      ...i,
      status: 'NEW',
      resolutionNote: null,
      resolvedAt: null,
      statusChangedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.requests.push(r);
    return r;
  }
  async updateRequest(
    id: string,
    input: Partial<
      Pick<MaintenanceRequest, 'status' | 'resolutionNote' | 'resolvedAt' | 'statusChangedAt'>
    >,
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
const asUser = (user: User) => ({ 'X-Demo-User-Id': user.id });
beforeEach(async () => {
  repo = new MemoryRepository();
  clientA = { id: randomUUID(), name: 'A', email: 'a@example.com', role: 'CLIENT' };
  clientB = { id: randomUUID(), name: 'B', email: 'b@example.com', role: 'CLIENT' };
  admin = {
    id: randomUUID(),
    name: 'Admin',
    email: 'admin@example.com',
    role: 'ADMIN',
  };
  repo.users.push(clientA, clientB, admin);
  const make = (
    clientId: string,
    status: RequestStatus,
    hours: number,
    priority: MaintenanceRequest['priority'] = 'NORMAL',
  ): MaintenanceRequest => ({
    id: randomUUID(),
    clientId,
    title: 'Repair item',
    description: 'A sufficiently descriptive issue.',
    priority,
    status,
    resolutionNote: null,
    resolvedAt: null,
    statusChangedAt: new Date(Date.now() - hours * 3600000),
    createdAt: new Date(Date.now() - hours * 3600000),
    updatedAt: new Date(),
  });
  oldNew = make(clientA.id, 'NEW', 25, 'URGENT');
  recentNew = make(clientA.id, 'NEW', 23, 'URGENT');
  progress = make(clientA.id, 'IN_PROGRESS', 48);
  repo.requests.push(oldNew, recentNew, progress, make(clientB.id, 'DONE', 72));
  app = createApp(repo);
});
describe('demo user authorization', () => {
  it('lists demo users without passwords', async () => {
    const res = await request(app).get('/api/auth/users');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].passwordHash).toBeUndefined();
  });
  it('requires a selected demo user and admin role', async () => {
    expect((await request(app).get('/api/requests')).status).toBe(401);
    expect((await request(app).get('/api/admin/requests').set(asUser(clientA))).status).toBe(403);
  });
});
describe('requests', () => {
  it('isolates client data and assigns ownership server-side', async () => {
    const list = await request(app).get('/api/requests').set(asUser(clientA));
    expect(list.body.data).toHaveLength(3);
    expect(list.body.data.every((r: { priority: string }) => r.priority)).toBe(true);
    expect(
      (await request(app).get(`/api/requests/${repo.requests[3].id}`).set(asUser(clientA))).status,
    ).toBe(404);
    const made = await request(app).post('/api/requests').set(asUser(clientA)).send({
      title: 'Update homepage CTA',
      description: 'The homepage button should point to the new booking page.',
      priority: 'LOW',
    });
    expect(made.status).toBe(201);
    expect(made.body.data.status).toBe('NEW');
    expect(made.body.data.priority).toBe('LOW');
    expect(repo.requests.at(-1)?.clientId).toBe(clientA.id);
  });
  it('validates creation and prevents admin creation', async () => {
    expect(
      (
        await request(app)
          .post('/api/requests')
          .set(asUser(clientA))
          .send({ title: '', description: 'short' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post('/api/requests')
          .set(asUser(admin))
          .send({ title: 'Valid title', description: 'This description has enough content.' })
      ).status,
    ).toBe(403);
  });
});
describe('admin workflow', () => {
  it('filters at repository level and exposes urgency', async () => {
    const res = await request(app)
      .get(`/api/admin/requests?status=NEW&clientId=${clientA.id}`)
      .set(asUser(admin));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.find((r: { id: string }) => r.id === oldNew.id).isUrgent).toBe(true);
    expect(res.body.data.find((r: { id: string }) => r.id === recentNew.id).isUrgent).toBe(false);
  });
  it('enforces lifecycle and resolution requirement', async () => {
    const newToDone = await request(app)
      .patch(`/api/requests/${oldNew.id}/status`)
      .set(asUser(admin))
      .send({ status: 'DONE', resolutionNote: 'No' });

    expect(newToDone.status).toBe(409);
    expect(repo.requests.find((item) => item.id === oldNew.id)?.status).toBe('NEW');

    const previousStatusChangedAt = oldNew.statusChangedAt.getTime();
    const inProgress = await request(app)
      .patch(`/api/requests/${oldNew.id}/status`)
      .set(asUser(admin))
      .send({ status: 'IN_PROGRESS' });

    expect(inProgress.status).toBe(200);
    expect(inProgress.body.data.status).toBe('IN_PROGRESS');
    expect(new Date(inProgress.body.data.statusChangedAt).getTime()).toBeGreaterThan(
      previousStatusChangedAt,
    );

    expect(
      (
        await request(app)
          .patch(`/api/requests/${oldNew.id}/status`)
          .set(asUser(admin))
          .send({ status: 'DONE' })
      ).status,
    ).toBe(400);
    expect(repo.requests.find((item) => item.id === oldNew.id)?.status).toBe('IN_PROGRESS');

    const done = await request(app)
      .patch(`/api/requests/${oldNew.id}/status`)
      .set(asUser(admin))
      .send({ status: 'DONE', resolutionNote: 'Repair completed successfully.' });

    expect(done.status).toBe(200);
    expect(done.body.data.status).toBe('DONE');
    expect(done.body.data.resolutionNote).toBe('Repair completed successfully.');

    const doneToProgress = await request(app)
      .patch(`/api/requests/${oldNew.id}/status`)
      .set(asUser(admin))
      .send({ status: 'IN_PROGRESS' });
    expect(doneToProgress.status).toBe(409);
    expect(repo.requests.find((item) => item.id === oldNew.id)?.status).toBe('DONE');

    const doneToNew = await request(app)
      .patch(`/api/requests/${oldNew.id}/status`)
      .set(asUser(admin))
      .send({ status: 'NEW' });
    expect(doneToNew.status).toBe(409);
    expect(repo.requests.find((item) => item.id === oldNew.id)?.status).toBe('DONE');

    const progressToNew = await request(app)
      .patch(`/api/requests/${progress.id}/status`)
      .set(asUser(admin))
      .send({ status: 'NEW' });
    expect(progressToNew.status).toBe(409);
    expect(repo.requests.find((item) => item.id === progress.id)?.status).toBe('IN_PROGRESS');
  });
});
