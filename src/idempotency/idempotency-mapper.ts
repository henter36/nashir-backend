import type {
  IdempotencyRecord,
  IdempotencyStatus,
  JsonValue
} from "./idempotency-types.js";

export interface IdempotencyRecordRow {
  idempotency_record_id: string;
  workspace_id: string;
  actor_id: string;
  operation_name: string;
  idempotency_key: string;
  request_fingerprint: string;
  status: IdempotencyStatus;
  response_status_code: number | null;
  response_body: JsonValue | null;
  resource_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  expires_at: Date | string | null;
}

function toIsoString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function toNullableIsoString(value: Date | string | null): string | null {
  if (value === null) {
    return null;
  }

  return toIsoString(value);
}

export function mapIdempotencyRecordRow(
  row: IdempotencyRecordRow
): IdempotencyRecord {
  return {
    idempotencyRecordId: row.idempotency_record_id,
    workspaceId: row.workspace_id,
    actorId: row.actor_id,
    operationName: row.operation_name,
    idempotencyKey: row.idempotency_key,
    requestFingerprint: row.request_fingerprint,
    status: row.status,
    responseStatusCode: row.response_status_code,
    responseBody: row.response_body,
    resourceId: row.resource_id,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    expiresAt: toNullableIsoString(row.expires_at)
  };
}
