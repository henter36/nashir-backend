import type { QueryResult, QueryResultRow } from "pg";
import {
  mapIdempotencyRecordRow,
  type IdempotencyRecordRow
} from "./idempotency-mapper.js";
import type {
  CompleteIdempotencyRecordInput,
  FailIdempotencyRecordInput,
  IdempotencyRecord,
  IdempotencyScope,
  ReserveIdempotencyRecordInput,
  ReserveIdempotencyRecordResult
} from "./idempotency-types.js";

export interface PgQueryable {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[]
  ): Promise<QueryResult<T>>;
}

export class IdempotencyRepository {
  constructor(private readonly db: PgQueryable) {}

  async reserveIdempotencyRecord(
    input: ReserveIdempotencyRecordInput
  ): Promise<ReserveIdempotencyRecordResult> {
    const result = await this.db.query<IdempotencyRecordRow>(
      `
        INSERT INTO idempotency_records (
          workspace_id,
          actor_id,
          operation_name,
          idempotency_key,
          request_fingerprint,
          status,
          expires_at
        )
        VALUES ($1, $2, $3, $4, $5, 'in_progress', $6)
        ON CONFLICT (
          workspace_id,
          actor_id,
          operation_name,
          idempotency_key
        )
        DO UPDATE SET
          request_fingerprint = EXCLUDED.request_fingerprint,
          status = 'in_progress',
          expires_at = EXCLUDED.expires_at,
          response_status_code = NULL,
          response_body = NULL,
          resource_id = NULL,
          updated_at = NOW()
        WHERE idempotency_records.expires_at < NOW()
        RETURNING *;
      `,
      [
        input.workspaceId,
        input.actorId,
        input.operationName,
        input.idempotencyKey,
        input.requestFingerprint,
        input.expiresAt ?? null
      ]
    );

    const insertedRow = result.rows[0];

    if (insertedRow) {
      return {
        status: "created",
        record: mapIdempotencyRecordRow(insertedRow)
      };
    }

    const existingRecord = await this.getIdempotencyRecord(input);

    if (!existingRecord) {
      throw new Error(
        "Idempotency record conflict occurred but no record was found"
      );
    }

    return {
      status: "existing",
      record: existingRecord
    };
  }

  async getIdempotencyRecord(
    scope: IdempotencyScope
  ): Promise<IdempotencyRecord | null> {
    const result = await this.db.query<IdempotencyRecordRow>(
      `
        SELECT *
        FROM idempotency_records
        WHERE workspace_id = $1
          AND actor_id = $2
          AND operation_name = $3
          AND idempotency_key = $4
          AND (expires_at IS NULL OR expires_at > NOW());
      `,
      [
        scope.workspaceId,
        scope.actorId,
        scope.operationName,
        scope.idempotencyKey
      ]
    );

    const row = result.rows[0];

    return row ? mapIdempotencyRecordRow(row) : null;
  }

  async markIdempotencyRecordCompleted(
    input: CompleteIdempotencyRecordInput
  ): Promise<IdempotencyRecord | null> {
    const result = await this.db.query<IdempotencyRecordRow>(
      `
        UPDATE idempotency_records
        SET
          status = 'completed',
          response_status_code = $5,
          response_body = $6::jsonb,
          resource_id = $7
        WHERE workspace_id = $1
          AND actor_id = $2
          AND operation_name = $3
          AND idempotency_key = $4
        RETURNING *;
      `,
      [
        input.workspaceId,
        input.actorId,
        input.operationName,
        input.idempotencyKey,
        input.responseStatusCode,
        input.responseBody === undefined || input.responseBody === null
          ? null
          : JSON.stringify(input.responseBody),
        input.resourceId ?? null
      ]
    );

    const row = result.rows[0];

    return row ? mapIdempotencyRecordRow(row) : null;
  }

  async markIdempotencyRecordFailed(
    input: FailIdempotencyRecordInput
  ): Promise<IdempotencyRecord | null> {
    const result = await this.db.query<IdempotencyRecordRow>(
      `
        UPDATE idempotency_records
        SET
          status = 'failed',
          response_status_code = $5,
          response_body = $6::jsonb
        WHERE workspace_id = $1
          AND actor_id = $2
          AND operation_name = $3
          AND idempotency_key = $4
        RETURNING *;
      `,
      [
        input.workspaceId,
        input.actorId,
        input.operationName,
        input.idempotencyKey,
        input.responseStatusCode ?? null,
        input.responseBody === undefined || input.responseBody === null
          ? null
          : JSON.stringify(input.responseBody)
      ]
    );

    const row = result.rows[0];

    return row ? mapIdempotencyRecordRow(row) : null;
  }
}
