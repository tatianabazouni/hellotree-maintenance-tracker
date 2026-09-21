import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Clock3,
  LoaderCircle,
  Plus,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createMaintenanceApi,
  listDemoUsers,
  listRequestsForUser,
} from "./api";
import type {
  CreateRequestInput,
  DataState,
  DemoUser,
  MaintenanceApiAdapter,
  MaintenanceRequest,
  Priority,
  RequestStatus,
} from "./types";

type Feedback = { type: "success" | "error"; message: string } | null;

export interface MaintenanceTrackerProps {
  dataState?: DataState;
  api?: MaintenanceApiAdapter | undefined;
}

const EMPTY_DATA_STATE: DataState = {
  status: "ready",
  data: { requests: [], clients: [] },
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  normal: "Normal",
  urgent: "Urgent",
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  done: "Done",
};

export function MaintenanceTracker({
  dataState = EMPTY_DATA_STATE,
  api,
}: MaintenanceTrackerProps) {
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [activeUser, setActiveUser] = useState<DemoUser | null>(null);
  const [loadedState, setLoadedState] = useState<DataState>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    async function loadUsers() {
      setLoadedState({ status: "loading" });
      try {
        const demoUsers = await listDemoUsers();
        if (cancelled) return;
        setUsers(demoUsers);
        const firstClient = demoUsers.find((user) => user.role === "CLIENT");
        const firstUser = firstClient ?? demoUsers[0];
        if (!firstUser) {
          setLoadedState({
            status: "error",
            message: "No demo users are available.",
          });
          return;
        }
        setSelectedUserId(firstUser.id);
      } catch (error) {
        if (!cancelled) {
          setLoadedState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not reach the request API. Is the backend running?",
          });
        }
      }
    }
    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const selected = users.find((user) => user.id === selectedUserId);
    if (!selected) return;

    let cancelled = false;
    async function loadRequests() {
      setLoadedState({ status: "loading" });
      try {
        const userRequests = await listRequestsForUser(selected);
        if (cancelled) return;
        setActiveUser(selected);
        setLoadedState({
          status: "ready",
          data: {
            requests: userRequests,
            clients: users
              .filter((user) => user.role === "CLIENT")
              .map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
              })),
          },
        });
      } catch (error) {
        if (!cancelled) {
          setLoadedState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load client requests from the API.",
          });
        }
      }
    }
    loadRequests();
    return () => {
      cancelled = true;
    };
  }, [selectedUserId, users]);

  const effectiveState = api ? dataState : loadedState;
  const data = effectiveState.status === "ready" ? effectiveState.data : null;
  const selectedUser = api
    ? null
    : (activeUser ?? users.find((user) => user.id === selectedUserId) ?? null);
  const effectiveApi =
    api ?? (selectedUser ? createMaintenanceApi(selectedUser) : undefined);
  const requests = data?.requests ?? [];

  const updateRequest = (updated: MaintenanceRequest) => {
    if (effectiveState.status !== "ready") return;
    setLoadedState({
      status: "ready",
      data: {
        ...effectiveState.data,
        requests: effectiveState.data.requests.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-18 max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wrench aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold leading-none">
                hellotree
              </p>
              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                Website & App Maintenance Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-xs font-semibold uppercase text-muted-foreground sm:inline">
              Preview as
            </span>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={users.length === 0}
            >
              <SelectTrigger
                aria-label="Preview dashboard role"
                className="h-10 w-[190px] bg-card font-semibold shadow-none"
              >
                <SelectValue placeholder="Loading users" />
              </SelectTrigger>
              <SelectContent align="end">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        {selectedUser?.role === "ADMIN" ? (
          <AdminDashboard
            dataState={effectiveState}
            requests={requests}
            clients={data?.clients ?? []}
            api={effectiveApi}
            onRequestUpdated={updateRequest}
          />
        ) : (
          <ClientDashboard
            userName={selectedUser?.name ?? "Client"}
            dataState={effectiveState}
            requests={requests}
            api={effectiveApi}
            onRequestCreated={(request) => {
              if (effectiveState.status !== "ready") return;
              setLoadedState({
                status: "ready",
                data: {
                  ...effectiveState.data,
                  requests: [request, ...effectiveState.data.requests],
                },
              });
            }}
          />
        )}
      </main>
    </div>
  );
}

function PageHeading({
  role,
  userName,
}: {
  role: "CLIENT" | "ADMIN";
  userName?: string;
}) {
  const admin = role === "ADMIN";
  return (
    <div className="mb-7 flex items-start gap-3">
      <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card">
        {admin ? (
          <ShieldCheck className="size-4" />
        ) : (
          <UserRound className="size-4" />
        )}
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {admin ? "Support overview" : `${userName ?? "Client"} dashboard`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {admin
            ? "Review, filter, and progress client website and app requests."
            : "Submit a request and track its progress."}
        </p>
      </div>
    </div>
  );
}

function ClientDashboard({
  userName,
  dataState,
  requests,
  api,
  onRequestCreated,
}: {
  userName: string;
  dataState: DataState;
  requests: MaintenanceRequest[];
  api?: MaintenanceApiAdapter | undefined;
  onRequestCreated: (request: MaintenanceRequest) => void;
}) {
  return (
    <>
      <PageHeading role="CLIENT" userName={userName} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.5fr)]">
        <RequestForm api={api} onRequestCreated={onRequestCreated} />
        <section aria-labelledby="my-requests-title" className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2
                id="my-requests-title"
                className="font-display text-lg font-bold"
              >
                My Requests
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your submitted website and app requests.
              </p>
            </div>
            {dataState.status === "ready" && requests.length > 0 ? (
              <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold">
                {requests.length}
              </span>
            ) : null}
          </div>
          <RequestCollection
            state={dataState}
            requests={requests}
            mode="client"
          />
        </section>
      </div>
    </>
  );
}

function RequestForm({
  api,
  onRequestCreated,
}: {
  api?: MaintenanceApiAdapter | undefined;
  onRequestCreated: (request: MaintenanceRequest) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    priority?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: {
      title?: string;
      description?: string;
      priority?: string;
    } = {};
    if (!title.trim()) nextErrors.title = "Enter a request title.";
    if (!description.trim())
      nextErrors.description = "Describe the website or app issue.";
    if (!priority) nextErrors.priority = "Choose a priority.";
    setErrors(nextErrors);
    setFeedback(null);
    if (Object.keys(nextErrors).length > 0 || !priority) return;
    if (!api) {
      setFeedback({
        type: "error",
        message: "Request service is not connected yet.",
      });
      return;
    }

    const input: CreateRequestInput = {
      title: title.trim(),
      description: description.trim(),
      priority,
    };
    setSubmitting(true);
    try {
      const created = await api.createRequest(input);
      onRequestCreated(created);
      setTitle("");
      setDescription("");
      setPriority("");
      setFeedback({
        type: "success",
        message: "Your request was submitted successfully.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "We couldn't submit your request. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="rounded-lg border border-border bg-card p-5 shadow-card sm:p-6"
      aria-labelledby="new-request-title"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary-soft text-foreground">
          <Plus aria-hidden="true" className="size-4" />
        </div>
        <div>
          <h2 id="new-request-title" className="font-display text-lg font-bold">
            New request
          </h2>
          <p className="text-sm text-muted-foreground">
            Tell us what needs attention.
          </p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="request-title">
            Title <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="request-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs attention?"
            maxLength={120}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "request-title-error" : undefined}
            className="h-11 shadow-none"
          />
          {errors.title ? (
            <FieldError id="request-title-error">{errors.title}</FieldError>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="request-description">
            Description <span aria-hidden="true">*</span>
          </Label>
          <Textarea
            id="request-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add the page, device, steps, and helpful details."
            maxLength={1500}
            rows={6}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "request-description-error" : undefined
            }
            className="min-h-32 resize-y shadow-none"
          />
          {errors.description ? (
            <FieldError id="request-description-error">
              {errors.description}
            </FieldError>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="request-priority">
            Priority <span aria-hidden="true">*</span>
          </Label>
          <Select
            value={priority}
            onValueChange={(value) => setPriority(value as Priority)}
          >
            <SelectTrigger
              id="request-priority"
              aria-invalid={Boolean(errors.priority)}
              className="h-11 shadow-none"
            >
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          {errors.priority ? <FieldError>{errors.priority}</FieldError> : null}
        </div>

        {feedback ? <FormFeedback feedback={feedback} /> : null}

        <Button
          type="submit"
          className="h-11 w-full shadow-none"
          disabled={submitting}
        >
          {submitting ? <LoaderCircle className="animate-spin" /> : <Plus />}
          {submitting ? "Submitting..." : "Submit request"}
        </Button>
      </form>
    </section>
  );
}

function AdminDashboard({
  dataState,
  requests,
  clients,
  api,
  onRequestUpdated,
}: {
  dataState: DataState;
  requests: MaintenanceRequest[];
  clients: { id: string; name: string }[];
  api?: MaintenanceApiAdapter | undefined;
  onRequestUpdated: (request: MaintenanceRequest) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">(
    "all",
  );
  const [clientFilter, setClientFilter] = useState("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [completionRequest, setCompletionRequest] =
    useState<MaintenanceRequest | null>(null);

  const filtered = useMemo(
    () =>
      requests.filter(
        (request) =>
          (statusFilter === "all" || request.status === statusFilter) &&
          (clientFilter === "all" || request.clientId === clientFilter),
      ),
    [requests, statusFilter, clientFilter],
  );

  const counts = useMemo(
    () => ({
      total: requests.length,
      new: requests.filter((item) => item.status === "new").length,
      inProgress: requests.filter((item) => item.status === "in_progress")
        .length,
      done: requests.filter((item) => item.status === "done").length,
      urgentOverdue: requests.filter((item) => item.isOverdue || isOverdue(item))
        .length,
    }),
    [requests],
  );

  const moveForward = async (request: MaintenanceRequest) => {
    setActionError(null);
    if (!api) {
      setActionError("Request service is not connected yet.");
      return;
    }
    setBusyId(request.id);
    try {
      onRequestUpdated(await api.moveToInProgress(request.id));
    } catch {
      setActionError("The status couldn't be updated. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeading role="ADMIN" />
      <SummaryGrid counts={counts} available={dataState.status === "ready"} />

      <section aria-labelledby="all-requests-title" className="mt-8">
        <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h2
              id="all-requests-title"
              className="font-display text-lg font-bold"
            >
              All Requests
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Requests across all connected clients.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as RequestStatus | "all")
                }
              >
                <SelectTrigger className="h-10 min-w-36 bg-card shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Client</Label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="h-10 min-w-40 bg-card shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {actionError ? (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-md border border-error-border bg-error-soft px-4 py-3 text-sm text-error"
          >
            <AlertCircle className="size-4 shrink-0" />
            {actionError}
          </div>
        ) : null}

        <RequestCollection
          state={dataState}
          requests={filtered}
          mode="admin"
          busyId={busyId}
          filtered={statusFilter !== "all" || clientFilter !== "all"}
          onMoveToInProgress={moveForward}
          onMarkDone={setCompletionRequest}
        />
      </section>

      <ResolutionDialog
        request={completionRequest}
        api={api}
        onClose={() => setCompletionRequest(null)}
        onCompleted={onRequestUpdated}
      />
    </>
  );
}

function SummaryGrid({
  counts,
  available,
}: {
  counts: {
    total: number;
    new: number;
    inProgress: number;
    done: number;
    urgentOverdue: number;
  };
  available: boolean;
}) {
  const items = [
    { label: "Total Requests", value: counts.total, icon: ClipboardList },
    { label: "New", value: counts.new, icon: CircleDot },
    { label: "In Progress", value: counts.inProgress, icon: Clock3 },
    { label: "Done", value: counts.done, icon: CheckCircle2 },
    {
      label: "Urgent / Overdue",
      value: counts.urgentOverdue,
      icon: TriangleAlert,
      alert: true,
    },
  ];
  return (
    <section
      aria-label="Request summary"
      className="grid grid-cols-2 gap-3 md:grid-cols-5"
    >
      {items.map(({ label, value, icon: Icon, alert }) => (
        <div
          key={label}
          className={cn(
            "rounded-lg border bg-card p-4 shadow-card",
            alert ? "border-warning-border" : "border-border",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">
              {label}
            </p>
            <Icon
              className={cn(
                "size-4 shrink-0",
                alert ? "text-warning" : "text-muted-foreground",
              )}
            />
          </div>
          <p
            className="mt-4 font-display text-3xl font-bold"
            aria-label={`${label}: ${available ? value : "unavailable"}`}
          >
            {available ? value : "-"}
          </p>
        </div>
      ))}
    </section>
  );
}

function RequestCollection({
  state,
  requests,
  mode,
  busyId,
  filtered = false,
  onMoveToInProgress,
  onMarkDone,
}: {
  state: DataState;
  requests: MaintenanceRequest[];
  mode: "client" | "admin";
  busyId?: string | null;
  filtered?: boolean;
  onMoveToInProgress?: (request: MaintenanceRequest) => void;
  onMarkDone?: (request: MaintenanceRequest) => void;
}) {
  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState message={state.message} />;
  if (requests.length === 0) return <EmptyState filtered={filtered} />;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <div className="hidden grid-cols-[1.1fr_1.5fr_0.7fr_0.85fr_0.9fr_1fr] gap-4 border-b border-border bg-surface-subtle px-5 py-3 text-xs font-semibold text-muted-foreground lg:grid">
        {mode === "admin" ? <span>Client</span> : <span>Title</span>}
        <span>{mode === "admin" ? "Title" : "Description"}</span>
        <span>Priority</span>
        <span>Status</span>
        <span>Created</span>
        <span className="text-right">{mode === "admin" ? "Actions" : ""}</span>
      </div>
      <div className="divide-y divide-border">
        {requests.map((request) => (
          <RequestRow
            key={request.id}
            request={request}
            mode={mode}
            busy={busyId === request.id}
            onMoveToInProgress={onMoveToInProgress}
            onMarkDone={onMarkDone}
          />
        ))}
      </div>
    </div>
  );
}

function RequestRow({
  request,
  mode,
  busy,
  onMoveToInProgress,
  onMarkDone,
}: {
  request: MaintenanceRequest;
  mode: "client" | "admin";
  busy?: boolean | undefined;
  onMoveToInProgress?: ((request: MaintenanceRequest) => void) | undefined;
  onMarkDone?: ((request: MaintenanceRequest) => void) | undefined;
}) {
  const overdue = mode === "admin" && (request.isOverdue || isOverdue(request));
  return (
    <article className={cn("p-5", overdue && "bg-warning-soft")}>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.5fr_0.7fr_0.85fr_0.9fr_1fr] lg:items-center">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold text-muted-foreground lg:hidden">
            {mode === "admin" ? "Client" : "Title"}
          </p>
          <p className="truncate text-sm font-semibold">
            {mode === "admin" ? request.clientName : request.title}
          </p>
          {overdue ? (
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-warning">
              <TriangleAlert className="size-3.5" /> Overdue
            </span>
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold text-muted-foreground lg:hidden">
            {mode === "admin" ? "Title" : "Description"}
          </p>
          <p
            className={cn(
              "text-sm",
              mode === "admin"
                ? "font-semibold"
                : "line-clamp-2 text-muted-foreground",
            )}
          >
            {mode === "admin" ? request.title : request.description}
          </p>
          {mode === "admin" ? (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {request.description}
            </p>
          ) : null}
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-muted-foreground lg:hidden">
            Priority
          </p>
          <PriorityBadge priority={request.priority} />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-muted-foreground lg:hidden">
            Status
          </p>
          <StatusBadge status={request.status} />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-muted-foreground lg:hidden">
            Created
          </p>
          <time
            className="text-sm text-muted-foreground"
            dateTime={request.createdAt}
          >
            {formatDate(request.createdAt)}
          </time>
        </div>
        {mode === "admin" ? (
          <div className="flex justify-start lg:justify-end">
            {request.status === "new" ? (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => onMoveToInProgress?.(request)}
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <ArrowRight />
                )}{" "}
                Move to In Progress
              </Button>
            ) : request.status === "in_progress" ? (
              <Button size="sm" onClick={() => onMarkDone?.(request)}>
                <Check /> Mark as Done
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                No action needed
              </span>
            )}
          </div>
        ) : (
          <div />
        )}
      </div>
    </article>
  );
}

function ResolutionDialog({
  request,
  api,
  onClose,
  onCompleted,
}: {
  request: MaintenanceRequest | null;
  api?: MaintenanceApiAdapter | undefined;
  onClose: () => void;
  onCompleted: (request: MaintenanceRequest) => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setNote("");
    setError(null);
    onClose();
  };
  const submit = async () => {
    if (!note.trim()) {
      setError("Enter a resolution note before completing this request.");
      return;
    }
    if (!request) return;
    if (!api) {
      setError("Request service is not connected yet.");
      return;
    }
    setSubmitting(true);
    try {
      onCompleted(await api.markAsDone(request.id, note.trim()));
      close();
    } catch {
      setError("The request couldn't be completed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>Complete client request</DialogTitle>
          <DialogDescription>
            Add a required note explaining how the issue was resolved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="resolution-note">
            Resolution Note <span aria-hidden="true">*</span>
          </Label>
          <Textarea
            id="resolution-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={5}
            maxLength={1500}
            placeholder="Describe the completed work."
            aria-invalid={Boolean(error)}
          />
          {error ? <FieldError>{error}</FieldError> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={submitting}>
            {submitting ? <LoaderCircle className="animate-spin" /> : <Check />}
            {submitting ? "Completing..." : "Mark as Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        priority === "urgent"
          ? "border-error-border bg-error-soft text-error"
          : priority === "normal"
            ? "border-warning-border bg-warning-soft text-warning-foreground"
            : "border-border bg-surface-subtle text-muted-foreground",
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        status === "done"
          ? "border-success-border bg-success-soft text-success"
          : status === "in_progress"
            ? "border-info-border bg-info-soft text-info"
            : "border-border bg-surface-subtle text-foreground",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

function LoadingState() {
  return (
    <div
      className="rounded-lg border border-border bg-card p-10 text-center shadow-card"
      aria-live="polite"
    >
      <LoaderCircle className="mx-auto size-6 animate-spin text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">Loading requests...</p>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-5 py-14 text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-surface-subtle">
        <ClipboardList className="size-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold">
        {filtered ? "No matching requests" : "No requests yet"}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "Try changing the selected filters."
          : "Requests will appear here when data is available."}
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-error-border bg-error-soft px-5 py-10 text-center"
    >
      <AlertCircle className="mx-auto size-6 text-error" />
      <h3 className="mt-3 font-semibold">Requests couldn't be loaded</h3>
      <p className="mt-1 text-sm text-error">{message}</p>
    </div>
  );
}

function FieldError({ id, children }: { id?: string; children: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="flex items-center gap-1.5 text-xs font-medium text-error"
    >
      <AlertCircle className="size-3.5" />
      {children}
    </p>
  );
}

function FormFeedback({ feedback }: { feedback: NonNullable<Feedback> }) {
  const success = feedback.type === "success";
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm",
        success
          ? "border-success-border bg-success-soft text-success"
          : "border-error-border bg-error-soft text-error",
      )}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      )}
      {feedback.message}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function isOverdue(request: MaintenanceRequest, now = Date.now()) {
  const statusChanged = new Date(request.statusChangedAt).getTime();
  return (
    request.priority === "urgent" &&
    request.status === "new" &&
    Number.isFinite(statusChanged) &&
    now - statusChanged > 24 * 60 * 60 * 1000
  );
}
