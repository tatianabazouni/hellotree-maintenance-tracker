import type {
  Client,
  CreateRequestInput,
  DemoUser,
  MaintenanceApiAdapter,
  MaintenanceRequest,
  Priority,
  RequestStatus,
} from "./types";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api"
).replace(/\/$/, "");

type ApiPriority = "LOW" | "NORMAL" | "URGENT";
type ApiStatus = "NEW" | "IN_PROGRESS" | "DONE";

interface ApiRequest {
  id: string;
  title: string;
  description: string;
  priority: ApiPriority;
  status: ApiStatus;
  createdAt: string;
  statusChangedAt: string;
  resolutionNote: string | null;
  isOverdue?: boolean;
  client?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ApiEnvelope<T> {
  data: T;
}

interface ApiErrorEnvelope {
  error?: {
    message?: string;
  };
}

const priorityToApi: Record<Priority, ApiPriority> = {
  low: "LOW",
  normal: "NORMAL",
  urgent: "URGENT",
};

const priorityFromApi: Record<ApiPriority, Priority> = {
  LOW: "low",
  NORMAL: "normal",
  URGENT: "urgent",
};

const statusFromApi: Record<ApiStatus, RequestStatus> = {
  NEW: "new",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T> &
    ApiErrorEnvelope;
  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? "The maintenance API request failed.",
    );
  }
  return payload.data;
}

function withDemoUser(userId: string, init: RequestInit = {}) {
  return {
    ...init,
    headers: {
      "X-Demo-User-Id": userId,
      ...init.headers,
    },
  };
}

export function toUiRequest(
  request: ApiRequest,
  fallbackClient?: Client,
): MaintenanceRequest {
  const client = request.client ?? fallbackClient;
  return {
    id: request.id,
    clientId: client?.id ?? "",
    clientName: client?.name ?? "Client",
    title: request.title,
    description: request.description,
    priority: priorityFromApi[request.priority],
    status: statusFromApi[request.status],
    createdAt: request.createdAt,
    statusChangedAt: request.statusChangedAt,
    resolutionNote: request.resolutionNote,
    isOverdue: request.isOverdue ?? false,
  };
}

export async function listDemoUsers() {
  return request<DemoUser[]>("/auth/users");
}

export async function listRequestsForUser(user: DemoUser) {
  const requests =
    user.role === "ADMIN"
      ? await request<ApiRequest[]>("/admin/requests", withDemoUser(user.id))
      : await request<ApiRequest[]>("/requests", withDemoUser(user.id));

  return requests.map((item) =>
    toUiRequest(
      item,
      user.role === "CLIENT"
        ? { id: user.id, name: user.name, email: user.email }
        : undefined,
    ),
  );
}

export function createMaintenanceApi(
  currentUser: DemoUser,
): MaintenanceApiAdapter {
  return {
    async createRequest(input: CreateRequestInput) {
      const created = await request<ApiRequest>(
        "/requests",
        withDemoUser(currentUser.id, {
          method: "POST",
          body: JSON.stringify({
            title: input.title,
            description: input.description,
            priority: priorityToApi[input.priority],
          }),
        }),
      );
      return toUiRequest(created, {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
      });
    },
    async moveToInProgress(requestId: string) {
      const updated = await request<ApiRequest>(
        `/requests/${requestId}/status`,
        withDemoUser(currentUser.id, {
          method: "PATCH",
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        }),
      );
      return toUiRequest(updated);
    },
    async markAsDone(requestId: string, resolutionNote: string) {
      const updated = await request<ApiRequest>(
        `/requests/${requestId}/status`,
        withDemoUser(currentUser.id, {
          method: "PATCH",
          body: JSON.stringify({ status: "DONE", resolutionNote }),
        }),
      );
      return toUiRequest(updated);
    },
  };
}
