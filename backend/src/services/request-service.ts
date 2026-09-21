import { AppError } from '../errors.js';
import type {
  MaintenanceRequest,
  RequestRepository,
  RequestStatus,
  Role,
} from '../types/domain.js';
const transitions: Record<RequestStatus, RequestStatus | null> = {
  NEW: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: null,
};
export function serializeRequest(request: MaintenanceRequest, includeClient = false) {
  const overdue =
    request.priority === 'URGENT' &&
    request.status === 'NEW' &&
    request.statusChangedAt.getTime() < Date.now() - 24 * 60 * 60 * 1000;
  return {
    id: request.id,
    title: request.title,
    description: request.description,
    priority: request.priority,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    statusChangedAt: request.statusChangedAt.toISOString(),
    resolutionNote: request.resolutionNote,
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
    isOverdue: overdue,
    ...(includeClient && request.client ? { client: request.client } : {}),
  };
}
export class RequestService {
  constructor(private readonly repository: RequestRepository) {}
  async listForUser(user: { id: string; role: Role }) {
    return (await this.repository.listRequests({ clientId: user.id })).map((r) =>
      serializeRequest(r),
    );
  }
  async listForAdmin(filters: { clientId?: string; status?: RequestStatus }) {
    return (await this.repository.listRequests(filters)).map((r) => serializeRequest(r, true));
  }
  async getOne(id: string, user: { id: string; role: Role }) {
    const request = await this.requireRequest(id);
    if (user.role === 'CLIENT' && request.clientId !== user.id)
      throw new AppError(404, 'REQUEST_NOT_FOUND', 'Request not found');
    return serializeRequest(request, user.role === 'ADMIN');
  }
  async create(
    clientId: string,
    input: { title: string; description: string; priority: MaintenanceRequest['priority'] },
  ) {
    return serializeRequest(await this.repository.createRequest({ clientId, ...input }));
  }
  async updateStatus(id: string, status: RequestStatus, resolutionNote?: string) {
    const current = await this.requireRequest(id);
    if (transitions[current.status] !== status)
      throw new AppError(
        409,
        'INVALID_STATUS_TRANSITION',
        'A request can only move from NEW to IN_PROGRESS, then to DONE.',
      );
    const trimmed = resolutionNote?.trim();
    if (status === 'DONE' && !trimmed)
      throw new AppError(
        400,
        'RESOLUTION_NOTE_REQUIRED',
        'A non-empty resolution note is required when marking a request DONE.',
      );
    return serializeRequest(
      await this.repository.updateRequest(id, {
        status,
        statusChangedAt: new Date(),
        ...(status === 'DONE' ? { resolutionNote: trimmed!, resolvedAt: new Date() } : {}),
      }),
      true,
    );
  }
  private async requireRequest(id: string) {
    const request = await this.repository.findRequest(id);
    if (!request) throw new AppError(404, 'REQUEST_NOT_FOUND', 'Request not found');
    return request;
  }
}
