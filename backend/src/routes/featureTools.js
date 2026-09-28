// Unified feature-tool endpoints (cf-* and gap-* pages).
// Replaces the unmounted backend/routes/gap-*.js boilerplate with a single
// authenticated, rate-limited implementation backed by the shared OpenRouter
// service. Every run is persisted to feature_tool_runs for auditability.
//
// These tools provide administrative compliance-training decision support.
// They are not legal advice and not proof of HIPAA compliance.
import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import { aiChat } from '../services/openrouter.js';
import pool from '../db.js';

const router = express.Router();

const featureRateLimiter = rateLimit({
  windowMs: 3600000,
  max: 20,
  keyGenerator: (req, res) => req.user ? `user:${req.user.id}` : ipKeyGenerator(req, res),
  message: { error: 'Rate limit reached. Please wait before making more requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const DISCLAIMER = 'Administrative compliance-training support only — not legal advice or proof of HIPAA compliance.';

const FEATURES = [
  {
    slug: 'cf-agentic-compliance-auditor-continuously-',
    title: 'Agentic compliance auditor continuously monitoring access logs, policy adherence, and training status',
    prompt: `You are a HIPAA compliance auditing analyst. Given the scenario, produce a structured audit assessment: compliance posture summary, findings mapped to HIPAA rules (Privacy, Security, Breach Notification), prioritized corrective actions, and residual risks. Be concrete and reference 45 CFR sections where relevant.`,
  },
  {
    slug: 'cf-breach-simulation-gamified-exercises-sco',
    title: 'Breach simulation: gamified exercises scoring incident response',
    prompt: `You are a HIPAA incident-response exercise designer. Create or score a breach tabletop exercise: scenario narrative, timed injects, role-based decision points, a 0-100 scoring rubric across detection/containment/notification/documentation/recovery, and post-exercise action items aligned to the Breach Notification Rule (45 CFR 164.400-414).`,
  },
  {
    slug: 'cf-adaptive-workforce-training-with-role-ba',
    title: 'Adaptive workforce training with role-based paths and scenarios',
    prompt: `You are a HIPAA training curriculum designer. Build adaptive, role-based training paths: role risk profile, required modules mapped to 45 CFR 164.530(a), scenario-based exercises, difficulty adaptation rules, and measurable completion criteria.`,
  },
  {
    slug: 'cf-real-time-access-monitoring-flagging-bul',
    title: 'Real-time access monitoring flagging bulk downloads and cross-department access',
    prompt: `You are a HIPAA security operations analyst specializing in access monitoring (45 CFR 164.312(b)). Given access patterns or a monitoring scenario, identify suspicious behaviors (bulk export, cross-department access, off-hours spikes), rate severity, and recommend investigation steps with audit-control references.`,
  },
  {
    slug: 'cf-vendor-risk-management-ingesting-soc-2',
    title: 'Vendor risk management ingesting SOC 2 / HITRUST reports',
    prompt: `You are a HIPAA third-party risk analyst. Given vendor information or a SOC 2 / HITRUST report summary, extract control coverage and gaps relative to HIPAA Security Rule requirements, assign a risk tier, list required BAA provisions (45 CFR 164.504(e)), and set a reassessment cadence.`,
  },
  {
    slug: 'cf-ocr-policy-automation-extracting-require',
    title: 'OCR + policy automation extracting requirements from PDFs and scanned documents',
    prompt: `You are a policy-analysis automation assistant. Given policy document text (as OCR-extracted input), extract discrete compliance requirements, map each to HIPAA citations, flag ambiguities and missing elements, and output a structured requirement register with owners and review cadence.`,
  },
  {
    slug: 'gap-limited-vendor-security-assessment-depth',
    title: 'Limited vendor-security-assessment depth (beyond BAA review)',
    prompt: `You are a HIPAA vendor security assessor performing deep assessments beyond contract review. Evaluate technical safeguards, subcontractor chains, incident history, and data-flow scope; produce findings with 45 CFR 164.308(b) and 164.314 references, control gaps, and concrete mitigations.`,
  },
  {
    slug: 'gap-no-breach-simulation-tabletop-endpoint',
    title: 'No breach-simulation tabletop endpoint',
    prompt: `You are a HIPAA breach tabletop facilitator. Run a self-administered breach simulation: narrative, injects, decision points per role, expected response checked against the Breach Notification Rule, scoring rubric, identified gaps, and follow-up actions.`,
  },
  {
    slug: 'gap-no-ehr-system-integration',
    title: 'No EHR system integration',
    prompt: `You are a healthcare interoperability architect. Given an EHR integration scenario, outline an HL7 FHIR-based integration approach: resource mapping, authentication (SMART on FHIR), minimum-necessary scoping, audit trails, and the HIPAA Security Rule safeguards each interface requires. Clearly separate what is designed vs. what requires real credentials and contracts.`,
  },
  {
    slug: 'gap-no-external-regulator-communication-work',
    title: 'No external regulator communication workflows',
    prompt: `You are a HIPAA regulatory affairs advisor. Draft regulator-communication workflows: OCR breach report timelines (60-day rule), content requirements per 45 CFR 164.400-414, state attorney general notifications, media notices for large breaches, and an approval chain. Never fabricate submission; output drafts for human review.`,
  },
  {
    slug: 'gap-no-insider-threat-behavior-baseline-drif',
    title: 'No insider-threat behavior-baseline drift detector',
    prompt: `You are an insider-threat analyst for covered entities. Given behavior data or a scenario, define baselines per role, detect drift (volume, scope, timing anomalies), rate severity, and recommend proportionate response steps consistent with 45 CFR 164.308(a)(1) risk analysis and minimum-necessary principles.`,
  },
  {
    slug: 'gap-no-multi-tenant-covered-entity-isolation',
    title: 'No multi-tenant covered-entity isolation',
    prompt: `You are a healthcare SaaS security architect. Given a multi-tenant scenario, design covered-entity data isolation: tenant keys, row-level security, per-tenant BAAs, cross-tenant access prevention, audit separation, and breach blast-radius containment mapped to HIPAA Security Rule safeguards.`,
  },
  {
    slug: 'gap-no-real-time-phi-streaming-monitor',
    title: 'No real-time PHI streaming monitor',
    prompt: `You are a PHI data-loss-prevention designer. Given a streaming-monitoring scenario, specify detection sources, PHI classification signals, alert thresholds, false-positive handling, and escalation mapped to 45 CFR 164.312 technical safeguards. Note clearly what requires real infrastructure to operate.`,
  },
  {
    slug: 'gap-no-user-facing-dashboard-backend-api',
    title: 'No user-facing dashboard (backend API only)',
    prompt: `You are a compliance analytics designer. Given a dashboard scenario, define the compliance KPIs (training completion, overdue deadlines, open incidents, risk posture), their exact data sources, drill-down paths, and role-appropriate visibility for a HIPAA training compliance dashboard.`,
  },
  {
    slug: 'gap-no-webhook-surface-for-siem-integration',
    title: 'No webhook surface for SIEM integration',
    prompt: `You are a security integration engineer. Given a SIEM integration scenario, design a webhook surface: event types, signed payloads (HMAC), retry/dead-letter semantics, RBAC on subscriptions, and which HIPAA-relevant events (access anomalies, incident state changes, audit exports) should stream to a SIEM.`,
  },
];

async function persistRun(slug, user, input, context, result) {
  try {
    await pool.query(
      'INSERT INTO feature_tool_runs (slug, user_id, user_email, input, context, result) VALUES ($1, $2, $3, $4, $5, $6)',
      [slug, user?.id || null, user?.email || null, input, JSON.stringify(context || {}), result]
    );
    return true;
  } catch (err) {
    console.error(`feature-tool persist failed (${slug}):`, err.message);
    return false;
  }
}

function buildHandler(feature) {
  return async (req, res) => {
    try {
      const input = typeof req.body?.input === 'string' ? req.body.input.trim() : '';
      const context = req.body?.context && typeof req.body.context === 'object' ? req.body.context : {};
      if (!input) return res.status(400).json({ error: 'input is required.' });
      if (input.length > 8000) return res.status(400).json({ error: 'input must be 8000 characters or fewer.' });

      const userPrompt = `User input:\n${input}\n\nContext:\n${JSON.stringify(context)}\n\nProvide a structured, actionable response.`;
      const result = await aiChat(feature.prompt, userPrompt);
      const persisted = await persistRun(feature.slug, req.user, input, context, result);
      res.json({ feature: feature.slug, title: feature.title, result, disclaimer: DISCLAIMER, persisted });
    } catch (err) {
      console.error(`feature-tool error (${feature.slug}):`, err);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  };
}

for (const feature of FEATURES) {
  router.post(`/${feature.slug}`, authenticateToken, featureRateLimiter, buildHandler(feature));
}

export default router;
