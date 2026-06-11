CREATE TABLE IF NOT EXISTS products (
  product_id text PRIMARY KEY,
  workspace_id text NOT NULL,
  name text NOT NULL CHECK (char_length(name) > 0),
  category text,
  price numeric CHECK (price IS NULL OR price >= 0),
  sku text,
  stock_status text NOT NULL DEFAULT 'unknown' CHECK (
    stock_status IN ('available', 'limited', 'out_of_stock', 'unknown')
  ),
  image_url text,
  video_url text,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'active', 'archived')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS products_workspace_status_idx
  ON products (workspace_id, status);

CREATE INDEX IF NOT EXISTS products_workspace_updated_at_idx
  ON products (workspace_id, updated_at DESC, product_id DESC);

CREATE TABLE IF NOT EXISTS idempotency_records (
  idempotency_record_id bigserial PRIMARY KEY,
  workspace_id text NOT NULL,
  actor_id text NOT NULL,
  operation_name text NOT NULL,
  idempotency_key text NOT NULL,
  request_fingerprint text NOT NULL,
  status text NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
  response_status_code integer,
  response_body jsonb,
  resource_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE (workspace_id, actor_id, operation_name, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idempotency_records_expires_at_idx
  ON idempotency_records (expires_at);

CREATE TABLE IF NOT EXISTS audit_events (
  audit_event_id text PRIMARY KEY,
  actor_id text NOT NULL,
  workspace_id text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  action_name text NOT NULL CHECK (char_length(action_name) > 0),
  before_state jsonb,
  after_state jsonb,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_workspace_created_at_idx
  ON audit_events (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_events_resource_created_at_idx
  ON audit_events (resource_id, created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_idempotency_records_updated_at ON idempotency_records;

CREATE TRIGGER update_idempotency_records_updated_at
  BEFORE UPDATE ON idempotency_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
