-- Private key đăng ký tài khoản + quyền quản trị
-- Dùng cho: planner (PostgreSQL local, port 5433)

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "registered_by_key_id" text;

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" text PRIMARY KEY NOT NULL,
  "label" text NOT NULL,
  "key_hash" text NOT NULL,
  "key_prefix" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "max_uses" integer,
  "used_count" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp with time zone,
  "note" text,
  "created_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "revoked_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_hash_idx" ON "api_keys" ("key_hash");
CREATE INDEX IF NOT EXISTS "api_keys_active_idx" ON "api_keys" ("is_active");

CREATE TABLE IF NOT EXISTS "api_key_usages" (
  "id" text PRIMARY KEY NOT NULL,
  "key_id" text NOT NULL REFERENCES "api_keys"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "used_at" timestamp with time zone DEFAULT now() NOT NULL,
  "user_agent" text
);

CREATE INDEX IF NOT EXISTS "api_key_usages_key_idx" ON "api_key_usages" ("key_id");
CREATE INDEX IF NOT EXISTS "api_key_usages_user_idx" ON "api_key_usages" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "api_key_usages_key_user_idx" ON "api_key_usages" ("key_id", "user_id");
