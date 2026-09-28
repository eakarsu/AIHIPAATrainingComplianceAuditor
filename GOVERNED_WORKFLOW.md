# Governed HIPAA training workflow

## Scope

The new endpoint is `/api/governed-training`. It implements role-based curriculum assignment, verified content, assessments, attestations, remediation, and an audit-ready close decision. The state sequence is:

`assigned → content_verified → in_progress → assessed → attested/remediation → compliance_review → closed`

Generated `gap-*` routes were formerly unmounted boilerplate. They are now implemented — together with the `cf-*` feature pages — by `backend/src/routes/featureTools.js`: one authenticated, rate-limited router with domain-specific prompts that persists every run to `feature_tool_runs` (migration `003_feature_tool_runs.sql`). They remain decision-support outputs, not verified domain execution.

## Safety and data boundaries

- Every request is authenticated and resolved against `governed_tenant_memberships`; token roles alone do not grant tenant access.
- Memberships can be restricted by opaque `subject_ref_prefix`. Case lists, evidence, history, assessments, and transitions apply that scope.
- Mutations require `Idempotency-Key`; reusing a key for different input fails with `IDEMPOTENCY_PAYLOAD_CONFLICT`.
- Transitions require `expectedVersion`, row locking, authoritative evidence, permitted roles, a reason, and independent approval where configured.
- Evidence stores an approved-storage pointer, source version, SHA-256 digest, capture time, and non-sensitive metadata. Raw content and obvious personal-data fields are rejected.
- Case identity, evidence, and events are protected from destructive updates/deletes by database constraints and triggers. The event history is readable at `GET /api/governed-training/cases/:id/history`.
- Deterministic triage validates role/content/policy versions, passing score, accessibility status, digest-only assessment and attestation evidence. It always returns `automatedDecision: false` and `requiresHumanReview: true`.
- This is administrative compliance-training support, not legal advice or proof of HIPAA compliance. A separate compliance owner must close a case.

The code and tests have not been professionally, legally, clinically, regulatorily, or production validated.

## Connector quarantine

The policy endpoint declares LMS, HRIS, identity, policy repository, notification, and compliance-case connectors. This repository contains no credentials or verified provider clients for them. Each is reported as `configured: false` and `quarantined_until_credentialed_and_contract_tested`. The connector-failure API only records sanitized operational failure metadata; it does not call a provider.

Before enabling any connector, supply credentials through an approved secret store, establish contracts and data-use authority, add signed-request and response-schema validation, run provider sandbox contract tests, and define retry/dead-letter ownership. Failures must leave the case in its prior state.

## Database and access provisioning

Migration `backend/migrations/001_governed_workflow.sql` is forward-only and contains no drop/down path. The application never applies it automatically. An operator should back up and use normal change control, then run:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/001_governed_workflow.sql
```

Migration `backend/migrations/002_runtime_feature_tables.sql` (also forward-only, never auto-applied) creates the runtime feature tables assumed by mounted routes: `reminders`, `quiz_attempts`, `ai_results_store`, and `audit_logs.severity` (used by the insider-access monitor). Apply it the same way:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/002_runtime_feature_tables.sql
```

Migration `backend/migrations/003_feature_tool_runs.sql` (forward-only, never auto-applied) creates `feature_tool_runs`, which backs the cf-*/gap-* feature-tool history. Apply it the same way:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/003_feature_tool_runs.sql
```

Provision tenant memberships separately through an administrator-controlled process. Do not expose membership creation as public self-service. Use opaque subject references; store source documents in approved encrypted systems.

## Non-destructive local run

1. Copy `.env.example` to `.env`, generate a unique JWT secret of at least 32 characters, and configure a dedicated database account. Provider variables may remain blank.
2. Install locked dependencies explicitly with `npm ci` in the package directories. Dependency installation is never part of startup.
3. Apply the governed migration explicitly as described above. Seeds are optional demo operations and are never part of startup.
4. Run `./start.sh`. It refuses occupied ports and missing dependencies; it does not kill processes, install packages, create/migrate/seed databases, or start PostgreSQL.
5. Keep `ENABLE_LEGACY_SCHEMA_BOOTSTRAP=false`, `ALLOW_MOCK_PROVIDERS=false`, and any demo/scheduler flags false. Production startup rejects unsafe flags.

## Verification

From `backend`, run `npm run check:governance`. The dependency-free Node test suite covers configuration, authorization context, sensitive-data rejection, deterministic/fail-closed assessment, optimistic concurrency, evidence gates, RBAC, dual control, tenant scope, idempotency, migration immutability, and router contracts. CI repeats these checks and validates `start.sh` syntax.

Migrations 001–004 were additionally applied to a local development PostgreSQL instance, and an HTTP smoke path (membership, case create, evidence, triage, transitions, RBAC denial, idempotent replay, history) was exercised successfully against it. Two latent parameter-type defects in the evidence and assessment INSERT…SELECT statements were found and fixed through that execution.

Provider sandboxes, load tests, accessibility evaluation, and production security review remain explicit deployment gates because no external provider, credentials, licensed data, or production infrastructure was used here.
