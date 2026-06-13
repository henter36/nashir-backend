import type { JsonValue } from "../idempotency/idempotency-types.js";

export interface AuditEvent {
  auditEventId: string;
  workspaceId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  correlationId: string | null;
  occurredAt: string;
  beforeState: JsonValue | null;
  afterState: JsonValue | null;
}

export interface CreateAuditEventInput {
  workspaceId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  correlationId?: string | null;
  beforeState?: JsonValue | null;
  afterState?: JsonValue | null;
}
