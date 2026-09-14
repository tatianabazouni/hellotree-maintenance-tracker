import { PrismaClient, RequestStatus } from '@prisma/client';
import type {
  MaintenanceRequest,
  RequestRepository,
  RequestStatus as Status,
  User,
} from '../types/domain.js';
const prisma = new PrismaClient();
const include = { client: { select: { id: true, name: true, email: true } } } as const;
export class PrismaRepository implements RequestRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }
  async findRequest(id: string): Promise<MaintenanceRequest | null> {
    return prisma.maintenanceRequest.findUnique({ where: { id }, include });
  }
  async listRequests(filters: {
    clientId?: string;
    status?: Status;
  }): Promise<MaintenanceRequest[]> {
    return prisma.maintenanceRequest.findMany({
      where: { clientId: filters.clientId, status: filters.status as RequestStatus | undefined },
      include,
      orderBy: { createdAt: 'desc' },
    });
  }
  async createRequest(
    input: Pick<MaintenanceRequest, 'clientId' | 'title' | 'description'>,
  ): Promise<MaintenanceRequest> {
    return prisma.maintenanceRequest.create({ data: input, include });
  }
  async updateRequest(
    id: string,
    input: Partial<Pick<MaintenanceRequest, 'status' | 'resolutionNote' | 'resolvedAt'>>,
  ): Promise<MaintenanceRequest> {
    return prisma.maintenanceRequest.update({ where: { id }, data: input, include });
  }
}
export { prisma };
