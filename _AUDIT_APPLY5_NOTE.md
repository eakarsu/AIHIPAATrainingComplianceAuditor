# Apply Pass 5 — AIHIPAATrainingComplianceAuditor

**Date:** 2026-05-08
**Stack:** Node ESM + Express + Vite/React. Postgres. JWT bearer. `aiRateLimiter` (per-route limit). `aiChat(systemPrompt, userPrompt)` helper. Persistence via `logAiAction` + `saveAiResult`.
**Source audit:** `/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 19.

## Verified present
- 36+ existing AI endpoints in `routes/ai.js` (highest in batch).
- Pass 2 added `/vendor-security-assessment`, `/breach-simulation`.
- FE: `aiConfig.js` with 28+ feature configs and `App.jsx` `AIFeaturePageWrapper` that drives a generic form-based UI off `AI_CONFIG[feature]`.

## Implemented this pass (3 mechanical AI endpoints)
1. `POST /api/ai/policy-gap-analysis` — accepts pasted policy document text and produces a HIPAA Privacy/Security/Breach gap analysis with redline-style recommendations. Caps text at 12000 chars to bound prompt.
2. `POST /api/ai/adaptive-training-path` — generates role/risk-aware adaptive training path. Pulls from `employees` table when `employeeId` provided.
3. `POST /api/ai/continuous-compliance-narrative` — synthesizes orgs recent state (employees, incidents, policies, assessments, BAAs) into a continuous-monitoring narrative. Each table query is wrapped try/catch so missing table doesn't crash the route.

All three:
- `authenticateToken` + `aiRateLimiter`.
- Explicit 503 guard at top of each handler (`noKeyGuard(res)` helper).
- `aiChat` + `logAiAction` + `saveAiResult` matching existing pattern.

### FE
- `aiConfig.js` extended with three feature configs: `policy-gap-analysis`, `adaptive-training-path`, `continuous-compliance-narrative`.
- `services/api.js` exports `policyGapAnalysis`, `adaptiveTrainingPath`, `continuousComplianceNarrative` (`aiPost` helper).
- `App.jsx` AI_FUNCTIONS map updated; the existing `AIFeaturePageWrapper` automatically renders these at `/ai/policy-gap-analysis`, `/ai/adaptive-training-path`, `/ai/continuous-compliance-narrative`.

## Deferred / categorization
- TOO-RISKY mechanically: real-time autonomous PHI access blocking, autonomous BAA execution.
- NEEDS-CREDS: EHR connector, regulator API.
- NEEDS-PRODUCT-DECISION: continuous monitoring scheduler cadence, breach simulation gamification scoring.

## Smoke test
- `node --check backend/src/routes/ai.js` PASS.
- FE config picked up by existing dynamic route `/ai/:feature`.

## HIPAA disclaimers
All three new endpoints emit HIPAA-aligned narrative outputs with explicit references to Privacy/Security/Breach Notification rules. They do NOT make autonomous regulatory decisions.

## Cap respected
3 of 5 allowed. Vendor risk portfolio dashboard, OCR PDF ingest, and EHR integration are NEEDS-CREDS / NEEDS-PRODUCT-DECISION.
