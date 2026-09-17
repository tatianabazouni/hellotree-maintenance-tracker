export type Role = 'CLIENT' | 'ADMIN';
export type RequestPriority = 'LOW' | 'NORMAL' | 'URGENT';
export type RequestStatus = 'NEW' | 'IN_PROGRESS' | 'DONE';
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface MaintenanceRequest {
  id: string;
  clientId: string;
  title: string;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  resolutionNote: string | null;
  resolvedAt: Date | null;
  statusChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  client?: Pick<User, 'id' | 'name' | 'email'>;
}
export interface RequestRepository {
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  findRequest(id: string): Promise<MaintenanceRequest | null>;
  listRequests(filters: {
    clientId?: string;
    status?: RequestStatus;
  }): Promise<MaintenanceRequest[]>;
  createRequest(
    input: Pick<MaintenanceRequest, 'clientId' | 'title' | 'description' | 'priority'>,
  ): Promise<MaintenanceRequest>;
  updateRequest(
    id: string,
    input: Partial<
      Pick<MaintenanceRequest, 'status' | 'resolutionNote' | 'resolvedAt' | 'statusChangedAt'>
    >,
  ): Promise<MaintenanceRequest>;
}
