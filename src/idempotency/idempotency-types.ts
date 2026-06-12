export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

export const IDEMPOTENCY_STATUSES = [
  "in_progress",
  "completed",
  "failed"
] as const;

export type IdempotencyStatus = (typeof IDEMPOTENCY_STATUSES)[number];

export interface IdempotencyRecord {
  idempotencyRecordId: string;
  workspaceId: string;
  actorId: string;
  operationName: string;
  idempotencyKey: string;
  requestFingerprint: string;
  status: IdempotencyStatus;
  responseStatusCode: number | null;
  responseBody: JsonValue | null;
  resourceId: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface IdempotencyScope {
  workspaceId: string;
  actorId: string;
  operationName: string;
  idempotencyKey: string;
}

export interface ReserveIdempotencyRecordInput extends IdempotencyScope {
  requestFingerprint: string;
  expiresAt?: string | null;
}

export type ReserveIdempotencyRecordResult =
  | {
      status: "created";
      record: IdempotencyRecord;
    }
  | {
      status: "existing";
      record: IdempotencyRecord;
    };

export interface CompleteIdempotencyRecordInput extends IdempotencyScope {
  responseStatusCode: number;
  responseBody: JsonValue;
  resourceId?: string | null;
}

export interface FailIdempotencyRecordInput extends IdempotencyScope {
  responseStatusCode?: number | null;
  responseBody?: JsonValue | null;
}
