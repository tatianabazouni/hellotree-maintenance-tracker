export type Role = 'CLIENT' | 'ADMIN';
export type RequestStatus = 'NEW' | 'IN_PROGRESS' | 'DONE';
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}
export interface MaintenanceRequest {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: RequestStatus;
  resolutionNote: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client?: Pick<User, 'id' | 'name' | 'email'>;
}
export interface RequestRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findRequest(id: string): Promise<MaintenanceRequest | null>;
  listRequests(filters: {
    clientId?: string;
    status?: RequestStatus;
  }): Promise<MaintenanceRequest[]>;
  createRequest(
    input: Pick<MaintenanceRequest, 'clientId' | 'title' | 'description'>,
  ): Promise<MaintenanceRequest>;
  updateRequest(
    id: string,
    input: Partial<Pick<MaintenanceRequest, 'status' | 'resolutionNote' | 'resolvedAt'>>,
  ): Promise<MaintenanceRequest>;
}
