import { randomUUID } from "node:crypto";

import type { QueryResult, QueryResultRow } from "pg";

import type { JsonValue } from "../idempotency/idempotency-types.js";
import type { AuditEvent, CreateAuditEventInput } from "./audit-types.js";

export interface PgQueryable {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[]
  ): Promise<QueryResult<T>>;
}

export interface PgTransactionClient extends PgQueryable {
  release(): void;
}

export interface PgTransactionProvider {
  connect(): Promise<PgTransactionClient>;
}

interface AuditEventRow {
  audit_event_id: string;
  workspace_id: string;
  actor_id: string;
  action_name: string;
  resource_type: string;
  resource_id: string | null;
  request_id: string | null;
  created_at: Date | string;
  before_state: JsonValue | null;
  after_state: JsonValue | null;
}

function toIsoString(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function mapAuditEventRow(row: AuditEventRow): AuditEvent {
  return {
    auditEventId: row.audit_event_id,
    workspaceId: row.workspace_id,
    actorId: row.actor_id,
    action: row.action_name,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    correlationId: row.request_id,
    occurredAt: toIsoString(row.created_at),
    beforeState: row.before_state,
    afterState: row.after_state
  };
}

function jsonValue(value: JsonValue | null | undefined): string | null {
  return value === undefined || value === null ? null : JSON.stringify(value);
}

export class AuditRepository {
  constructor(private readonly db: PgTransactionProvider & PgQueryable) {}

  async withTransaction<T>(
    operation: (client: PgQueryable) => Promise<T>
  ): Promise<T> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original transaction error if rollback itself fails.
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async createAuditEvent(
    input: CreateAuditEventInput,
    db: PgQueryable = this.db
  ): Promise<AuditEvent> {
    const result = await db.query<AuditEventRow>(
      `
        INSERT INTO audit_events (
          audit_event_id,
          workspace_id,
          actor_id,
          action_name,
          resource_type,
          resource_id,
          request_id,
          before_state,
          after_state
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
        RETURNING *;
      `,
      [
        randomUUID(),
        input.workspaceId,
        input.actorId,
        input.action,
        input.resourceType,
        input.resourceId ?? null,
        input.correlationId ?? null,
        jsonValue(input.beforeState),
        jsonValue(input.afterState)
      ]
    );

    return mapAuditEventRow(result.rows[0]);
  }
}
