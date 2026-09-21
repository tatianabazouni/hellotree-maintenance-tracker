export type Priority = "low" | "normal" | "urgent";

export type RequestStatus = "new" | "in_progress" | "done";

export interface Client {
  id: string;
  name: string;
  email?: string;
}

export interface MaintenanceRequest {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  priority: Priority;
  status: RequestStatus;
  createdAt: string;
  statusChangedAt: string;
  resolutionNote?: string | null;
  isOverdue?: boolean;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "ADMIN";
}

export interface CreateRequestInput {
  title: string;
  description: string;
  priority: Priority;
}

export interface MaintenanceData {
  requests: MaintenanceRequest[];
  clients: Client[];
}

export type DataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: MaintenanceData };

export interface MaintenanceApiAdapter {
  createRequest: (input: CreateRequestInput) => Promise<MaintenanceRequest>;
  moveToInProgress: (requestId: string) => Promise<MaintenanceRequest>;
  markAsDone: (
    requestId: string,
    resolutionNote: string,
  ) => Promise<MaintenanceRequest>;
}
