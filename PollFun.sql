DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

CREATE TYPE "poll_status" AS ENUM (
  'OPEN',
  'CLOSED'
);
CREATE TYPE "registration_status" AS ENUM (
  'PENDING',
  'COMPLETED'
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "username" text UNIQUE NOT NULL CHECK (length(trim(username)) > 3),
  "created_at" timestamp DEFAULT (now()),
  "status" registration_status DEFAULT ('PENDING')
);

CREATE TABLE "passkey_credentials" (
  "cred_id" text PRIMARY KEY,
  "cred_public_key" bytea NOT NULL,
  "user_id" uuid NOT NULL,
  "webauthn_user_id" text NOT NULL,
  "counter" integer NOT NULL,
  "device_type" text NOT NULL,
  "backed_up" bool NOT NULL,
  "transports" text,
  "created_at" timestamp DEFAULT (now()),
  "last_used" timestamp
);

CREATE TABLE "polls" (
  "id" uuid PRIMARY KEY,
  "title" varchar(255) NOT NULL,
  "body" varchar(255),
  "user_id" uuid NOT NULL,
  "status" poll_status,
  "created_at" timestamp DEFAULT (now()),
  "expires_at" timestamp DEFAULT (now() + interval '2 days')
);

CREATE TABLE "options" (
  "id" uuid PRIMARY KEY,
  "title" varchar(255),
  "poll_id" uuid NOT NULL
);

CREATE TABLE "votes" (
  "user_id" uuid NOT NULL,
  "poll_id" uuid NOT NULL,
  "option_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT (now()),
  PRIMARY KEY ("user_id", "poll_id")
);

CREATE INDEX ON "passkey_credentials" ("webauthn_user_id");

ALTER TABLE "votes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "passkey_credentials" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "votes" ADD FOREIGN KEY ("poll_id") REFERENCES "polls" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "votes" ADD FOREIGN KEY ("option_id") REFERENCES "options" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "polls" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "options" ADD FOREIGN KEY ("poll_id") REFERENCES "polls" ("id") ON DELETE CASCADE ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;