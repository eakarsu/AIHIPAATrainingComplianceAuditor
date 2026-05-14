import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import { aiChat } from '../services/openrouter.js';
import pool from '../db.js';

const router = express.Router();

const aiRateLimiter = rateLimit({
  windowMs: 3600000,
  max: 20,
  keyGenerator: (req) => req.user ? `user:${req.user.id}` : req.ip,
  message: { error: 'AI rate limit reached. Please wait before making more requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI Policy Generator
router.post('/generate-policy', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { policyType, department, specificRequirements } = req.body;
    const systemPrompt = `You are a HIPAA compliance expert and policy writer. Generate professional, comprehensive HIPAA policies that are ready to implement. Structure your response with clear sections: Purpose, Scope, Policy Statement, Procedures, Responsibilities, Enforcement, and Review Schedule. Use formal language appropriate for healthcare compliance documentation.`;
    const userPrompt = `Generate a detailed HIPAA ${policyType || 'general'} policy for the ${department || 'organization'}. ${specificRequirements ? 'Additional requirements: ' + specificRequirements : ''} Include specific procedures, responsible parties, and enforcement measures.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('generate-policy', req.user.email, { policyType, department });
    await saveAiResult(req.user?.id, req.user?.email, 'generate-policy', req.body, result);
    res.json({ result, type: 'policy', title: `${policyType || 'General'} HIPAA Policy` });
  } catch (err) {
    console.error('AI Policy Generator error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Training Quiz Generator
router.post('/generate-quiz', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { topic, difficulty, questionCount } = req.body;
    const systemPrompt = `You are a HIPAA training specialist. Generate training quiz questions with multiple choice answers. For each question provide: the question text, 4 options (A, B, C, D), the correct answer letter, and a brief explanation of why it's correct. Format each question clearly with numbered questions. Make questions practical and scenario-based when possible.`;
    const userPrompt = `Generate ${questionCount || 10} HIPAA training quiz questions about "${topic || 'General HIPAA Compliance'}". Difficulty level: ${difficulty || 'intermediate'}. Include real-world healthcare scenarios and test practical knowledge of HIPAA regulations.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('generate-quiz', req.user.email, { topic, difficulty, questionCount });
    await saveAiResult(req.user?.id, req.user?.email, 'generate-quiz', req.body, result);
    res.json({ result, type: 'quiz', title: `${topic || 'HIPAA'} Training Quiz` });
  } catch (err) {
    console.error('AI Quiz Generator error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Compliance Checker
router.post('/check-compliance', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { organizationDetails, currentPractices, areasOfConcern } = req.body;
    const systemPrompt = `You are a HIPAA compliance auditor. Analyze the given organizational practices and provide a detailed compliance assessment. Structure your response as: Overall Compliance Score (percentage), Key Findings (numbered list), Areas of Non-Compliance (with specific HIPAA rule references), Recommended Actions (prioritized), and Timeline for Remediation. Be thorough and reference specific HIPAA regulations (Privacy Rule, Security Rule, Breach Notification Rule).`;
    const userPrompt = `Perform a HIPAA compliance check for the following:
Organization Details: ${organizationDetails || 'Healthcare organization'}
Current Practices: ${currentPractices || 'Standard healthcare operations'}
Areas of Concern: ${areasOfConcern || 'General compliance review'}
Provide a comprehensive compliance assessment with specific findings and actionable recommendations.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('check-compliance', req.user.email, { areasOfConcern });
    await saveAiResult(req.user?.id, req.user?.email, 'check-compliance', req.body, result);
    res.json({ result, type: 'compliance-check', title: 'Compliance Assessment Report' });
  } catch (err) {
    console.error('AI Compliance Checker error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Risk Analyzer
router.post('/analyze-risk', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { riskDescription, systemType, dataTypes, currentControls } = req.body;
    const systemPrompt = `You are a HIPAA security risk analyst. Analyze risks to protected health information (PHI) and provide a structured risk assessment. Include: Risk Rating (Critical/High/Medium/Low), Threat Analysis, Vulnerability Assessment, Impact Analysis, Likelihood Assessment, Risk Score (1-25 scale), Recommended Controls (Administrative, Physical, Technical), Mitigation Priority, and Cost-Benefit Analysis of proposed controls. Reference NIST Cybersecurity Framework and HIPAA Security Rule requirements.`;
    const userPrompt = `Analyze the following HIPAA security risk:
Risk Description: ${riskDescription || 'General PHI security risk'}
System Type: ${systemType || 'Healthcare IT system'}
Data Types Involved: ${dataTypes || 'Protected Health Information (PHI)'}
Current Controls: ${currentControls || 'Standard security controls'}
Provide a comprehensive risk analysis with specific mitigation recommendations.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('analyze-risk', req.user.email, { riskDescription, systemType });
    await saveAiResult(req.user?.id, req.user?.email, 'analyze-risk', req.body, result);
    res.json({ result, type: 'risk-analysis', title: 'Risk Analysis Report' });
  } catch (err) {
    console.error('AI Risk Analyzer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Incident Response Advisor
router.post('/incident-response', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { incidentType, severity, description, affectedSystems } = req.body;
    const systemPrompt = `You are a HIPAA incident response expert. Provide detailed incident response guidance for healthcare data breaches and security incidents. Structure your response as: Immediate Actions (within 1 hour), Short-term Response (24-72 hours), Notification Requirements (with specific timelines per HIPAA Breach Notification Rule), Investigation Steps, Containment Strategy, Evidence Preservation, Remediation Plan, and Post-Incident Review recommendations. Reference 45 CFR §164.400-414 for breach notification requirements.`;
    const userPrompt = `Provide incident response guidance for:
Incident Type: ${incidentType || 'Data breach'}
Severity: ${severity || 'Medium'}
Description: ${description || 'Potential PHI exposure'}
Affected Systems: ${affectedSystems || 'Unknown'}
Include specific timelines, responsible parties, and regulatory notification requirements.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('incident-response', req.user.email, { incidentType, severity });
    await saveAiResult(req.user?.id, req.user?.email, 'incident-response', req.body, result);
    res.json({ result, type: 'incident-response', title: 'Incident Response Plan' });
  } catch (err) {
    console.error('AI Incident Response error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Gap Analysis
router.post('/gap-analysis', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { currentState, desiredState, complianceAreas } = req.body;
    const systemPrompt = `You are a HIPAA compliance gap analyst. Perform a thorough gap analysis comparing current organizational state against HIPAA requirements. Structure your response as: Executive Summary, Gap Identification (numbered with severity), Current vs Required State (table format), Prioritized Remediation Roadmap, Resource Requirements, Timeline Estimates, and Quick Wins (items that can be addressed immediately). Cover all HIPAA rules: Privacy Rule, Security Rule, Breach Notification Rule, and Enforcement Rule.`;
    const userPrompt = `Perform a HIPAA compliance gap analysis:
Current State: ${currentState || 'Organization with basic HIPAA controls in place'}
Desired State: ${desiredState || 'Full HIPAA compliance across all rules'}
Focus Areas: ${complianceAreas || 'All HIPAA compliance areas'}
Identify specific gaps and provide a remediation roadmap.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('gap-analysis', req.user.email, { complianceAreas });
    await saveAiResult(req.user?.id, req.user?.email, 'gap-analysis', req.body, result);
    res.json({ result, type: 'gap-analysis', title: 'HIPAA Gap Analysis Report' });
  } catch (err) {
    console.error('AI Gap Analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Training Recommendation
router.post('/training-recommendation', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { employeeRole, department, currentCertifications, knowledgeGaps } = req.body;
    const systemPrompt = `You are a HIPAA training coordinator and compliance educator. Recommend personalized training programs for healthcare employees based on their role, department, and current knowledge level. Structure your response as: Recommended Training Path (ordered sequence), Required Courses (with estimated duration), Supplementary Training, Certification Goals, Timeline, Knowledge Assessment Areas, and Ongoing Education Requirements. Consider role-specific HIPAA requirements and recent regulatory changes.`;
    const userPrompt = `Recommend HIPAA training for:
Employee Role: ${employeeRole || 'Healthcare worker'}
Department: ${department || 'General'}
Current Certifications: ${currentCertifications || 'None'}
Knowledge Gaps: ${knowledgeGaps || 'General HIPAA awareness'}
Provide a personalized training recommendation with specific courses and timeline.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('training-recommendation', req.user.email, { employeeRole, department });
    await saveAiResult(req.user?.id, req.user?.email, 'training-recommendation', req.body, result);
    res.json({ result, type: 'training-recommendation', title: 'Training Recommendation Plan' });
  } catch (err) {
    console.error('AI Training Recommendation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Audit Report Generator
router.post('/generate-audit-report', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { auditScope, auditPeriod, findings, department } = req.body;
    const systemPrompt = `You are a HIPAA compliance auditor generating formal audit reports. Create professional, detailed audit reports suitable for regulatory submission. Structure your response as: Report Header (audit details), Executive Summary, Audit Scope and Methodology, Detailed Findings (each with severity, description, evidence, and recommendation), Compliance Score by Category, Non-Conformities Summary, Corrective Action Plan, Management Response Section, and Next Audit Schedule. Use formal audit language and reference specific HIPAA regulations.`;
    const userPrompt = `Generate a HIPAA compliance audit report:
Audit Scope: ${auditScope || 'Comprehensive HIPAA compliance audit'}
Audit Period: ${auditPeriod || 'Last 12 months'}
Key Findings: ${findings || 'General compliance review findings'}
Department/Area: ${department || 'Organization-wide'}
Create a formal audit report with detailed findings and corrective actions.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('generate-audit-report', req.user.email, { auditScope, auditPeriod });
    await saveAiResult(req.user?.id, req.user?.email, 'generate-audit-report', req.body, result);
    res.json({ result, type: 'audit-report', title: 'HIPAA Compliance Audit Report' });
  } catch (err) {
    console.error('AI Audit Report Generator error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Security Assessment
router.post('/security-assessment', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { systemDescription, networkArchitecture, currentMeasures } = req.body;
    const systemPrompt = `You are a HIPAA security specialist performing technical security assessments. Evaluate the technical safeguards of healthcare IT systems. Structure your response as: Security Posture Rating (A-F), Technical Safeguards Assessment, Access Control Review, Encryption Standards Evaluation, Audit Controls Assessment, Transmission Security Analysis, Vulnerability Summary, Recommended Technical Controls, and Implementation Priority Matrix. Reference HIPAA Security Rule technical safeguard requirements (§164.312).`;
    const userPrompt = `Perform a HIPAA security assessment:
System Description: ${systemDescription || 'Healthcare IT infrastructure'}
Network Architecture: ${networkArchitecture || 'Standard healthcare network'}
Current Security Measures: ${currentMeasures || 'Basic security controls'}
Provide a comprehensive technical security assessment.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('security-assessment', req.user.email, { systemDescription });
    await saveAiResult(req.user?.id, req.user?.email, 'security-assessment', req.body, result);
    res.json({ result, type: 'security-assessment', title: 'Security Assessment Report' });
  } catch (err) {
    console.error('AI Security Assessment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI BAA Review
router.post('/baa-review', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { associateName, agreementDetails, servicesProvided } = req.body;
    const systemPrompt = `You are a HIPAA legal compliance specialist reviewing Business Associate Agreements. Analyze BAAs for completeness and compliance with HIPAA requirements. Structure your response as: Overall BAA Compliance Status, Required Clauses Check (list each required clause and whether it's present/adequate), Missing or Deficient Provisions, Risk Areas, Recommended Amendments, Model Language Suggestions, and Review Summary. Reference 45 CFR §164.504(e) requirements.`;
    const userPrompt = `Review a Business Associate Agreement:
Associate Name: ${associateName || 'Business associate'}
Agreement Details: ${agreementDetails || 'Standard BAA terms'}
Services Provided: ${servicesProvided || 'Healthcare data processing'}
Analyze the BAA for HIPAA compliance and identify any gaps.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('baa-review', req.user.email, { associateName });
    await saveAiResult(req.user?.id, req.user?.email, 'baa-review', req.body, result);
    res.json({ result, type: 'baa-review', title: 'BAA Compliance Review' });
  } catch (err) {
    console.error('AI BAA Review error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Employee Training Analysis
router.post('/analyze-employee', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { employeeName, jobTitle, department, trainingStatus, certifications } = req.body;
    const systemPrompt = `You are a HIPAA training coordinator. Analyze an employee's training profile and provide personalized recommendations. Include: Training Gap Assessment, Required Certifications, Recommended Courses (with priority order), Risk Areas based on their role, Compliance Score Estimate, and a 90-Day Training Action Plan. Consider role-specific HIPAA requirements.`;
    const userPrompt = `Analyze training needs for:
Employee: ${employeeName || 'Healthcare worker'}
Job Title: ${jobTitle || 'Not specified'}
Department: ${department || 'General'}
Current Training Status: ${trainingStatus || 'Unknown'}
Certifications: ${certifications || 'None listed'}
Provide a comprehensive training gap analysis and personalized improvement plan.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('analyze-employee', req.user.email, { employeeName, jobTitle });
    await saveAiResult(req.user?.id, req.user?.email, 'analyze-employee', req.body, result);
    res.json({ result, type: 'employee-analysis', title: 'Employee Training Analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Department Compliance Analysis
router.post('/analyze-department', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { departmentName, employeeCount, complianceScore, riskLevel, headName } = req.body;
    const systemPrompt = `You are a HIPAA compliance analyst specializing in department-level assessments. Analyze a department's compliance posture and provide: Department Compliance Rating, Key Risk Factors, Training Coverage Analysis, Policy Adherence Assessment, Recommended Improvements (prioritized), Benchmark Comparison, and a Quarterly Action Plan. Reference specific HIPAA requirements applicable to the department's function.`;
    const userPrompt = `Analyze HIPAA compliance for:
Department: ${departmentName || 'Healthcare department'}
Department Head: ${headName || 'Not specified'}
Employee Count: ${employeeCount || 'Unknown'}
Current Compliance Score: ${complianceScore || 'Not assessed'}
Risk Level: ${riskLevel || 'Unknown'}
Provide a thorough departmental compliance analysis with actionable recommendations.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('analyze-department', req.user.email, { departmentName });
    await saveAiResult(req.user?.id, req.user?.email, 'analyze-department', req.body, result);
    res.json({ result, type: 'department-analysis', title: 'Department Compliance Analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Course Content Generator
router.post('/generate-course-content', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { courseTitle, category, targetAudience, duration } = req.body;
    const systemPrompt = `You are a HIPAA training content developer. Create comprehensive training course content including: Course Objectives (3-5 learning outcomes), Module Outline (with sub-topics and estimated time per module), Key Concepts & Definitions, Real-World Case Studies (2-3 scenarios), Interactive Activities, Assessment Questions (5-10 with answers), Resources & References, and Instructor Notes. Content should be engaging, practical, and compliant with current HIPAA regulations.`;
    const userPrompt = `Generate course content for:
Course Title: ${courseTitle || 'HIPAA Training Course'}
Category: ${category || 'General Compliance'}
Target Audience: ${targetAudience || 'All healthcare workers'}
Duration: ${duration || '2 hours'}
Create complete, ready-to-use training content.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('generate-course-content', req.user.email, { courseTitle });
    await saveAiResult(req.user?.id, req.user?.email, 'generate-course-content', req.body, result);
    res.json({ result, type: 'course-content', title: 'Generated Course Content' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Training Record Analysis
router.post('/analyze-training-records', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { employeeName, courseName, status, score, completionDate } = req.body;
    const systemPrompt = `You are a HIPAA training analytics specialist. Analyze training records and provide: Performance Assessment, Knowledge Gap Identification, Score Interpretation (what areas need improvement), Recommended Follow-up Training, Certification Readiness Assessment, Comparison to Organizational Benchmarks, and Next Steps for the employee. Be specific about which HIPAA areas need reinforcement.`;
    const userPrompt = `Analyze training record:
Employee: ${employeeName || 'Healthcare worker'}
Course: ${courseName || 'HIPAA Training'}
Status: ${status || 'Unknown'}
Score: ${score || 'Not available'}
Completion Date: ${completionDate || 'Not completed'}
Provide detailed analysis of training performance and recommendations.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('analyze-training-records', req.user.email, { employeeName, courseName });
    await saveAiResult(req.user?.id, req.user?.email, 'analyze-training-records', req.body, result);
    res.json({ result, type: 'training-analysis', title: 'Training Record Analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Assessment Generator
router.post('/generate-assessment', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { departmentName, assessmentType, focusAreas, previousScore } = req.body;
    const systemPrompt = `You are a HIPAA compliance assessor. Generate a comprehensive compliance assessment template and evaluation criteria including: Assessment Checklist (20+ items organized by HIPAA rule), Scoring Rubric (with weighted categories), Interview Questions for staff, Document Review Checklist, Physical Walkthrough Points, Technical Controls Verification Steps, and Assessment Summary Template. Make it ready to execute as an on-site assessment.`;
    const userPrompt = `Generate compliance assessment for:
Department: ${departmentName || 'Healthcare department'}
Assessment Type: ${assessmentType || 'Comprehensive HIPAA audit'}
Focus Areas: ${focusAreas || 'All HIPAA requirements'}
Previous Score: ${previousScore || 'First assessment'}
Create a complete, actionable assessment framework.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('generate-assessment', req.user.email, { departmentName, assessmentType });
    await saveAiResult(req.user?.id, req.user?.email, 'generate-assessment', req.body, result);
    res.json({ result, type: 'assessment-generator', title: 'Generated Assessment Framework' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Document Review
router.post('/review-document', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { documentTitle, category, content, documentType } = req.body;
    const systemPrompt = `You are a HIPAA documentation specialist. Review compliance documents and provide: Document Compliance Score, Content Accuracy Assessment, Missing Required Sections, Language & Clarity Review, Regulatory Reference Verification, Version Control Recommendations, Suggested Revisions (specific text improvements), Approval Readiness Status, and Distribution Recommendations. Reference specific HIPAA regulatory requirements the document should address.`;
    const userPrompt = `Review this compliance document:
Title: ${documentTitle || 'HIPAA Document'}
Category: ${category || 'General'}
Type: ${documentType || 'Policy document'}
Content/Description: ${content || 'Standard HIPAA compliance document'}
Provide a thorough document review with specific improvement recommendations.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('review-document', req.user.email, { documentTitle });
    await saveAiResult(req.user?.id, req.user?.email, 'review-document', req.body, result);
    res.json({ result, type: 'document-review', title: 'Document Review Analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI PHI Risk Assessment
router.post('/analyze-phi-risk', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { dataType, storageLocation, systemName, encryptionStatus, accessLevel } = req.body;
    const systemPrompt = `You are a HIPAA PHI security specialist. Assess the risk of PHI data storage and handling. Provide: PHI Risk Score (1-100), Data Classification Level, Encryption Adequacy Assessment, Access Control Evaluation, Storage Compliance Status, Data Retention Compliance, Breach Probability Estimate, Recommended Safeguards (Administrative, Physical, Technical), Data Flow Risk Analysis, and Regulatory Compliance Gaps. Reference HIPAA Security Rule §164.312 technical safeguard requirements.`;
    const userPrompt = `Assess PHI risk for:
Data Type: ${dataType || 'Protected Health Information'}
Storage Location: ${storageLocation || 'Unknown'}
System: ${systemName || 'Healthcare system'}
Encryption Status: ${encryptionStatus || 'Unknown'}
Access Level: ${accessLevel || 'Unknown'}
Provide a comprehensive PHI-specific risk assessment.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('analyze-phi-risk', req.user.email, { dataType, systemName });
    await saveAiResult(req.user?.id, req.user?.email, 'analyze-phi-risk', req.body, result);
    res.json({ result, type: 'phi-risk-analysis', title: 'PHI Risk Assessment' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Access Control Review
router.post('/review-access-control', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { employeeName, systemName, accessLevel, phiAccess, justification } = req.body;
    const systemPrompt = `You are a HIPAA access control auditor. Review access permissions and provide: Access Appropriateness Rating, Minimum Necessary Compliance, Role-Based Access Verification, PHI Access Justification Review, Segregation of Duties Check, Access Risk Score, Recommended Access Modifications, Review Schedule Recommendation, Audit Trail Requirements, and Compliance Status. Reference HIPAA Security Rule §164.312(a) access control requirements.`;
    const userPrompt = `Review access control for:
Employee: ${employeeName || 'Healthcare worker'}
System: ${systemName || 'Healthcare system'}
Access Level: ${accessLevel || 'Standard'}
PHI Access: ${phiAccess || 'Unknown'}
Justification: ${justification || 'Job function requirement'}
Evaluate whether this access is appropriate and compliant.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('review-access-control', req.user.email, { employeeName, systemName });
    await saveAiResult(req.user?.id, req.user?.email, 'review-access-control', req.body, result);
    res.json({ result, type: 'access-review', title: 'Access Control Review' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Sanction Recommendation
router.post('/recommend-sanction', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { violationType, description, severity, employeeHistory } = req.body;
    const systemPrompt = `You are a HIPAA compliance enforcement specialist. Analyze violations and recommend appropriate sanctions. Provide: Violation Severity Classification, Applicable HIPAA Regulation References, Recommended Sanction Level (verbal warning through termination), Corrective Action Plan, Required Retraining, Follow-up Schedule, Documentation Requirements, Legal Considerations, Progressive Discipline Alignment, and Prevention Recommendations. Ensure recommendations are fair, consistent, and legally defensible.`;
    const userPrompt = `Recommend sanction for:
Violation Type: ${violationType || 'HIPAA violation'}
Description: ${description || 'Not specified'}
Severity: ${severity || 'To be determined'}
Employee History: ${employeeHistory || 'No prior violations'}
Provide a fair and compliant sanction recommendation.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('recommend-sanction', req.user.email, { violationType, severity });
    await saveAiResult(req.user?.id, req.user?.email, 'recommend-sanction', req.body, result);
    res.json({ result, type: 'sanction-recommendation', title: 'Sanction Recommendation' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Deadline Priority Analyzer
router.post('/prioritize-deadlines', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { deadlines, organizationContext } = req.body;
    const systemPrompt = `You are a HIPAA compliance project manager. Analyze compliance deadlines and provide: Priority Ranking (with reasoning), Risk Assessment for each deadline, Resource Allocation Recommendations, Dependencies Between Tasks, Critical Path Analysis, Delegation Suggestions, Escalation Triggers, Regulatory Impact of Missing Each Deadline, Suggested Timeline Adjustments, and Weekly Action Plan. Consider regulatory requirements and organizational capacity.`;
    const userPrompt = `Analyze and prioritize these compliance deadlines:
Deadlines: ${deadlines || 'General HIPAA compliance deadlines'}
Organization Context: ${organizationContext || 'Healthcare organization with standard compliance requirements'}
Provide a prioritized action plan with risk assessments.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('prioritize-deadlines', req.user.email, {});
    await saveAiResult(req.user?.id, req.user?.email, 'prioritize-deadlines', req.body, result);
    res.json({ result, type: 'deadline-priorities', title: 'Deadline Priority Analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Audit Log Analyzer
router.post('/analyze-audit-logs', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { logSummary, timeframe, concernAreas } = req.body;
    const systemPrompt = `You are a HIPAA security audit analyst. Analyze audit log patterns and provide: Anomaly Detection Summary, Suspicious Activity Patterns, Access Pattern Analysis, Compliance Violations Identified, User Behavior Analytics Summary, Risk Indicators, Recommended Investigations, Incident Correlation, Trend Analysis, and Security Posture Assessment. Reference HIPAA audit control requirements under §164.312(b).`;
    const userPrompt = `Analyze audit log activity:
Log Summary: ${logSummary || 'System audit logs for review'}
Timeframe: ${timeframe || 'Last 30 days'}
Areas of Concern: ${concernAreas || 'General security and compliance review'}
Identify anomalies, risks, and provide actionable insights.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('analyze-audit-logs', req.user.email, { timeframe });
    await saveAiResult(req.user?.id, req.user?.email, 'analyze-audit-logs', req.body, result);
    res.json({ result, type: 'audit-log-analysis', title: 'Audit Log Analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI BAA Compliance Monitor
router.post('/monitor-baa', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { associateName, agreementType, servicesProvided, complianceStatus, expirationDate } = req.body;
    const systemPrompt = `You are a HIPAA business associate oversight specialist. Monitor BAA compliance and provide: Compliance Health Score, Agreement Adequacy Assessment, Required Clause Verification, Upcoming Action Items (renewals, audits), Risk Profile of the Associate, Monitoring Schedule Recommendation, Security Assessment Requirements, Breach History Review Recommendations, Contract Improvement Suggestions, and Regulatory Update Impact on BAA. Reference 45 CFR §164.504(e) requirements.`;
    const userPrompt = `Monitor BAA compliance for:
Associate: ${associateName || 'Business associate'}
Agreement Type: ${agreementType || 'Standard BAA'}
Services: ${servicesProvided || 'Healthcare data services'}
Current Status: ${complianceStatus || 'Active'}
Expiration: ${expirationDate || 'Not specified'}
Provide comprehensive BAA compliance monitoring report.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('monitor-baa', req.user.email, { associateName });
    await saveAiResult(req.user?.id, req.user?.email, 'monitor-baa', req.body, result);
    res.json({ result, type: 'baa-monitor', title: 'BAA Compliance Monitor' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Incident Investigation
router.post('/investigate-incident', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { incidentTitle, incidentType, severity, description, affectedIndividuals } = req.body;
    const systemPrompt = `You are a HIPAA incident investigator. Conduct a thorough investigation analysis and provide: Investigation Plan (step-by-step), Evidence Collection Checklist, Root Cause Analysis Framework, Affected Party Identification, Breach Determination Criteria, Notification Requirements Assessment (with timelines per HIPAA), Containment Verification Steps, Remediation Roadmap, Lessons Learned Template, and Prevention Measures. Reference 45 CFR §164.400-414 for breach notification requirements.`;
    const userPrompt = `Investigate this incident:
Title: ${incidentTitle || 'Security incident'}
Type: ${incidentType || 'Unknown'}
Severity: ${severity || 'Under assessment'}
Description: ${description || 'Incident requiring investigation'}
Affected Individuals: ${affectedIndividuals || 'Unknown count'}
Provide a complete investigation framework with specific action items.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('investigate-incident', req.user.email, { incidentTitle, severity });
    await saveAiResult(req.user?.id, req.user?.email, 'investigate-incident', req.body, result);
    res.json({ result, type: 'incident-investigation', title: 'Incident Investigation Plan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Risk Mitigation Planner
router.post('/plan-risk-mitigation', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { riskTitle, riskLevel, category, description, currentControls } = req.body;
    const systemPrompt = `You are a HIPAA risk mitigation strategist. Create detailed mitigation plans including: Mitigation Strategy Options (at least 3), Cost-Benefit Analysis for each option, Implementation Timeline, Resource Requirements, Technical Controls Needed, Administrative Controls Needed, Physical Controls Needed, Success Metrics, Monitoring Plan, Residual Risk Assessment, and Contingency Plan. Reference NIST 800-30 risk assessment framework and HIPAA Security Rule requirements.`;
    const userPrompt = `Create mitigation plan for:
Risk: ${riskTitle || 'HIPAA compliance risk'}
Risk Level: ${riskLevel || 'Medium'}
Category: ${category || 'General'}
Description: ${description || 'Risk requiring mitigation'}
Current Controls: ${currentControls || 'Basic controls in place'}
Provide a comprehensive, actionable mitigation plan.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('plan-risk-mitigation', req.user.email, { riskTitle, riskLevel });
    await saveAiResult(req.user?.id, req.user?.email, 'plan-risk-mitigation', req.body, result);
    res.json({ result, type: 'risk-mitigation', title: 'Risk Mitigation Plan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Policy Compliance Validator
router.post('/validate-policy', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { policyTitle, category, content, version } = req.body;
    const systemPrompt = `You are a HIPAA policy compliance validator. Review existing policies for regulatory compliance and provide: Compliance Score (percentage), HIPAA Rule Coverage Map (which requirements are addressed), Missing Required Elements, Language Clarity Assessment, Enforceability Review, Cross-Reference with Other Policies, Update Recommendations, Version History Suggestions, Staff Communication Plan, and Regulatory Change Impact. Check against all applicable HIPAA rules.`;
    const userPrompt = `Validate this policy:
Title: ${policyTitle || 'HIPAA Policy'}
Category: ${category || 'General'}
Version: ${version || '1.0'}
Content Summary: ${content || 'Standard HIPAA policy'}
Assess compliance completeness and identify gaps.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('validate-policy', req.user.email, { policyTitle });
    await saveAiResult(req.user?.id, req.user?.email, 'validate-policy', req.body, result);
    res.json({ result, type: 'policy-validation', title: 'Policy Compliance Validation' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function logAiAction(action, userEmail, details) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (action, entity_type, user_email, details) VALUES ($1, $2, $3, $4)',
      [`ai_${action}`, 'ai_feature', userEmail, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('Failed to log AI action:', err);
  }
}

async function saveAiResult(userId, userEmail, toolName, inputSnapshot, result) {
  try {
    await pool.query(
      'INSERT INTO ai_results_store (user_id, user_email, tool_name, input_snapshot, result) VALUES ($1,$2,$3,$4,$5)',
      [userId, userEmail, toolName, JSON.stringify(inputSnapshot), typeof result === 'string' ? result : JSON.stringify(result)]
    );
  } catch (err) {
    // Non-fatal — table may not exist yet
    console.error('Failed to save AI result:', err.message);
  }
}

// GET AI results history
router.get('/results', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const [rows, count] = await Promise.all([
      pool.query('SELECT * FROM ai_results_store WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [req.user.id, limit, offset]),
      pool.query('SELECT COUNT(*) FROM ai_results_store WHERE user_id = $1', [req.user.id]),
    ]);
    res.json({ data: rows.rows, total: parseInt(count.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
   DB-CONTEXT AI TOOLS (audit gap #1: refactored to take entity IDs)
   ════════════════════════════════════════════════════════════════════════ */

// 3-strategy JSON parser for AI responses
function parseAIJson(text) {
  if (!text) return null;
  try { return JSON.parse(text.trim()); } catch (_) {}
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1].trim()); } catch (_) {} }
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch (_) {} }
  const arr = text.match(/\[[\s\S]*\]/);
  if (arr) { try { return JSON.parse(arr[0]); } catch (_) {} }
  return null;
}

// AI Employee Deep Analysis — pulls real DB context from entity ID
router.post('/analyze-employee-deep', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'employeeId required' });

    const empResult = await pool.query(
      `SELECT e.*, d.name AS department_name, d.compliance_score AS dept_compliance
       FROM employees e LEFT JOIN departments d ON e.department_id = d.id WHERE e.id = $1`,
      [employeeId]
    );
    if (empResult.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    const emp = empResult.rows[0];

    const [trainingResult, sanctionResult, accessResult] = await Promise.all([
      pool.query(
        `SELECT tr.*, tc.title AS course_title, tc.category, tc.is_mandatory
         FROM training_records tr LEFT JOIN training_courses tc ON tr.course_id = tc.id
         WHERE tr.employee_id = $1 ORDER BY tr.created_at DESC LIMIT 50`,
        [employeeId]
      ),
      pool.query('SELECT * FROM sanctions WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 10', [employeeId]).catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM access_control WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 10', [employeeId]).catch(() => ({ rows: [] })),
    ]);

    const completed = trainingResult.rows.filter(r => r.status === 'completed').length;
    const pending = trainingResult.rows.filter(r => r.status !== 'completed').length;
    const avgScore = trainingResult.rows.filter(r => r.score).reduce((a, r, _, arr) => a + r.score / (arr.length || 1), 0);

    const systemPrompt = `You are a HIPAA training coordinator. Return JSON only with keys: compliance_score (0-100), risk_level (low|medium|high|critical), training_gaps (array), recommended_courses (array of {title,priority,reason}), action_plan_90day (array), summary (string).`;
    const userPrompt = `Analyze this employee's HIPAA training status using real DB data:

Employee: ${emp.first_name} ${emp.last_name}
Job Title: ${emp.job_title}
Department: ${emp.department_name || 'N/A'}
Department Compliance Score: ${emp.dept_compliance || 'N/A'}
Hire Date: ${emp.hire_date}
HIPAA Certified: ${emp.hipaa_certified}
Certification Date: ${emp.certification_date || 'Not certified'}
Training Status: ${emp.training_status}

Training History (${trainingResult.rows.length} records):
- Completed: ${completed}
- Pending/in-progress: ${pending}
- Average Score: ${avgScore.toFixed(1)}
${trainingResult.rows.slice(0, 10).map(r => `- ${r.course_title || 'Unknown'} (${r.category || 'general'}, mandatory=${r.is_mandatory}): ${r.status}, score=${r.score || 'n/a'}`).join('\n')}

Sanctions on record: ${sanctionResult.rows.length}
Active Access Permissions: ${accessResult.rows.length}

Return JSON only.`;

    const result = await aiChat(systemPrompt, userPrompt);
    const parsed = parseAIJson(result);
    await logAiAction('analyze-employee-deep', req.user.email, { employeeId });
    await saveAiResult(req.user?.id, req.user?.email, 'analyze-employee-deep', { employeeId }, result);

    res.json({
      employeeId,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      analysis: parsed,
      raw_response: parsed ? undefined : result,
      data_summary: { completed, pending, sanctions: sanctionResult.rows.length, training_records: trainingResult.rows.length },
    });
  } catch (err) {
    console.error('analyze-employee-deep error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Department Deep Analysis — pulls real DB context
router.post('/analyze-department-deep', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { departmentId } = req.body;
    if (!departmentId) return res.status(400).json({ error: 'departmentId required' });

    const deptResult = await pool.query('SELECT * FROM departments WHERE id = $1', [departmentId]);
    if (deptResult.rows.length === 0) return res.status(404).json({ error: 'Department not found' });
    const dept = deptResult.rows[0];

    const [empCount, certCount, trainingStats, riskRows] = await Promise.all([
      pool.query('SELECT COUNT(*)::int FROM employees WHERE department_id = $1', [departmentId]),
      pool.query('SELECT COUNT(*)::int FROM employees WHERE department_id = $1 AND hipaa_certified = true', [departmentId]),
      pool.query(
        `SELECT tr.status, COUNT(*)::int AS cnt FROM training_records tr
         JOIN employees e ON tr.employee_id = e.id WHERE e.department_id = $1 GROUP BY tr.status`,
        [departmentId]
      ),
      pool.query('SELECT * FROM risk_register WHERE risk_level IN ($1, $2) ORDER BY created_at DESC LIMIT 10', ['high', 'critical']).catch(() => ({ rows: [] })),
    ]);

    const totalEmps = empCount.rows[0].count;
    const certified = certCount.rows[0].count;
    const certPct = totalEmps > 0 ? ((certified / totalEmps) * 100).toFixed(1) : 0;
    const statusBreakdown = trainingStats.rows.reduce((a, r) => ({ ...a, [r.status]: r.cnt }), {});

    const systemPrompt = `You are a HIPAA compliance analyst. Return JSON only with keys: compliance_rating (A-F), key_risks (array), training_coverage_pct (number), priorities (array of {action,priority,timeline}), quarterly_plan (array), summary.`;
    const userPrompt = `Analyze department HIPAA compliance using real DB data:

Department: ${dept.name}
Head: ${dept.head_name || 'N/A'}
Recorded Compliance Score: ${dept.compliance_score || 'N/A'}
Recorded Risk Level: ${dept.risk_level || 'N/A'}

Live Stats:
- Total Employees: ${totalEmps}
- HIPAA Certified: ${certified} (${certPct}%)
- Training Status Breakdown: ${JSON.stringify(statusBreakdown)}
- Org-Wide High/Critical Risks: ${riskRows.rows.length}

Return JSON only.`;

    const result = await aiChat(systemPrompt, userPrompt);
    const parsed = parseAIJson(result);
    await logAiAction('analyze-department-deep', req.user.email, { departmentId });
    await saveAiResult(req.user?.id, req.user?.email, 'analyze-department-deep', { departmentId }, result);

    res.json({
      departmentId,
      department_name: dept.name,
      analysis: parsed,
      raw_response: parsed ? undefined : result,
      stats: { totalEmps, certified, certPct, statusBreakdown },
    });
  } catch (err) {
    console.error('analyze-department-deep error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
   PROPOSED FEATURE #2: Training-Deadline Auto-Enroller
   ════════════════════════════════════════════════════════════════════════ */
router.post('/auto-enroll-training', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { employeeId, dryRun = true } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'employeeId required' });

    const empResult = await pool.query(
      `SELECT e.*, d.name AS department_name FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id WHERE e.id = $1`,
      [employeeId]
    );
    if (empResult.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    const emp = empResult.rows[0];

    const [coursesResult, completedCourses] = await Promise.all([
      pool.query('SELECT * FROM training_courses WHERE status = $1', ['active']),
      pool.query(`SELECT course_id FROM training_records WHERE employee_id = $1 AND status = 'completed'`, [employeeId]),
    ]);
    const completedIds = new Set(completedCourses.rows.map(r => r.course_id));
    const availableCourses = coursesResult.rows.filter(c => !completedIds.has(c.id));

    const systemPrompt = `You are a HIPAA training coordinator. Given an employee's role and the available courses they haven't completed, select the most appropriate courses to assign. Return JSON only: { "assignments": [{ "courseId": number, "courseTitle": string, "priority": "high|medium|low", "reason": string, "due_date_offset_days": number }], "rationale": string }`;
    const userPrompt = `Employee: ${emp.first_name} ${emp.last_name}
Role: ${emp.job_title}
Department: ${emp.department_name}
Certified: ${emp.hipaa_certified}
Cert Date: ${emp.certification_date || 'never'}

Available Courses (${availableCourses.length}):
${availableCourses.map(c => `- id=${c.id}, title="${c.title}", category=${c.category}, mandatory=${c.is_mandatory}, duration=${c.duration_hours}h`).join('\n')}

Return JSON only with the assignments to create.`;

    const aiResult = await aiChat(systemPrompt, userPrompt);
    const parsed = parseAIJson(aiResult);
    await saveAiResult(req.user?.id, req.user?.email, 'auto-enroll-training', { employeeId, dryRun }, aiResult);

    let created = [];
    if (parsed?.assignments && !dryRun) {
      for (const a of parsed.assignments) {
        try {
          const dueDate = new Date(Date.now() + (a.due_date_offset_days || 30) * 86400000);
          const ins = await pool.query(
            `INSERT INTO training_records (employee_id, course_id, status, due_date, created_at)
             VALUES ($1, $2, 'assigned', $3, NOW()) RETURNING id`,
            [employeeId, a.courseId, dueDate]
          );
          created.push({ id: ins.rows[0].id, courseId: a.courseId, courseTitle: a.courseTitle, priority: a.priority, due_date: dueDate });
        } catch (e) {
          // try without due_date column if it doesn't exist
          try {
            const ins = await pool.query(
              `INSERT INTO training_records (employee_id, course_id, status) VALUES ($1, $2, 'assigned') RETURNING id`,
              [employeeId, a.courseId]
            );
            created.push({ id: ins.rows[0].id, courseId: a.courseId, courseTitle: a.courseTitle, priority: a.priority });
          } catch (e2) { console.error('Assign error:', e2.message); }
        }
      }
    }

    res.json({
      employeeId,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      ai_recommendations: parsed,
      raw_response: parsed ? undefined : aiResult,
      created_records: created,
      dryRun,
    });
  } catch (err) {
    console.error('auto-enroll-training error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
   PROPOSED FEATURE #3: PHI Access Anomaly Detector
   ════════════════════════════════════════════════════════════════════════ */
router.post('/detect-access-anomalies', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { hours = 24, autoCreateIncident = false } = req.body;

    const logsResult = await pool.query(
      `SELECT action, entity_type, user_email, COUNT(*)::int AS cnt
       FROM audit_logs WHERE created_at >= NOW() - ($1 || ' hours')::interval
       GROUP BY action, entity_type, user_email ORDER BY cnt DESC LIMIT 100`,
      [String(hours)]
    ).catch(() => ({ rows: [] }));

    const recentResult = await pool.query(
      `SELECT * FROM audit_logs WHERE created_at >= NOW() - ($1 || ' hours')::interval
       ORDER BY created_at DESC LIMIT 200`,
      [String(hours)]
    ).catch(() => ({ rows: [] }));

    const systemPrompt = `You are a HIPAA security audit analyst. Analyze audit log activity and identify anomalies. Return JSON only with keys: anomalies (array of {pattern, severity:"low|medium|high|critical", users_involved: [], description, recommended_action}), risk_level (low|medium|high|critical), summary, requires_incident (bool).`;
    const userPrompt = `Analyze these audit log patterns from the last ${hours} hours:

Top Activities:
${logsResult.rows.map(r => `- ${r.user_email}: ${r.action} on ${r.entity_type} (${r.cnt}x)`).join('\n')}

Total events: ${recentResult.rows.length}
Unique users: ${new Set(recentResult.rows.map(r => r.user_email)).size}

Reference HIPAA §164.312(b) audit control requirements. Return JSON only.`;

    const result = await aiChat(systemPrompt, userPrompt);
    const parsed = parseAIJson(result);
    await saveAiResult(req.user?.id, req.user?.email, 'detect-access-anomalies', { hours }, result);

    let createdIncident = null;
    if (autoCreateIncident && parsed?.requires_incident) {
      try {
        const ins = await pool.query(
          `INSERT INTO incident_reports (incident_title, incident_type, severity, description, status, created_at)
           VALUES ($1, 'access_anomaly', $2, $3, 'open', NOW()) RETURNING *`,
          [
            `Auto-detected access anomaly (${new Date().toISOString().slice(0, 10)})`,
            parsed.risk_level || 'medium',
            parsed.summary || 'AI-detected access anomaly from audit log review',
          ]
        );
        createdIncident = ins.rows[0];
      } catch (e) {
        console.error('Could not create incident:', e.message);
      }
    }

    res.json({ analysis: parsed, raw_response: parsed ? undefined : result, hours, events_analyzed: recentResult.rows.length, createdIncident });
  } catch (err) {
    console.error('detect-access-anomalies error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
   PROPOSED FEATURE #4: BAA Renewal Workflow
   ════════════════════════════════════════════════════════════════════════ */
router.get('/baa-renewals', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *,
        (expiration_date - CURRENT_DATE) AS days_until_expiry,
        CASE
          WHEN expiration_date < CURRENT_DATE THEN 'expired'
          WHEN expiration_date <= CURRENT_DATE + 30 THEN 'urgent'
          WHEN expiration_date <= CURRENT_DATE + 60 THEN 'warning'
          WHEN expiration_date <= CURRENT_DATE + 90 THEN 'upcoming'
          ELSE 'ok'
        END AS renewal_status
       FROM business_associate_agreements
       WHERE expiration_date <= CURRENT_DATE + 90 OR expiration_date < CURRENT_DATE
       ORDER BY expiration_date ASC`
    ).catch(() => ({ rows: [] }));
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/draft-baa-renewal', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { baaId } = req.body;
    if (!baaId) return res.status(400).json({ error: 'baaId required' });
    const result = await pool.query('SELECT * FROM business_associate_agreements WHERE id = $1', [baaId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'BAA not found' });
    const baa = result.rows[0];

    const systemPrompt = `You are a HIPAA legal compliance specialist. Draft a complete renewed Business Associate Agreement that includes all 45 CFR §164.504(e) required clauses. Structure: Preamble, Definitions, Permitted Uses & Disclosures, Safeguards, Reporting Requirements, Subcontractors, Access to PHI, Amendment, Termination, Effect of Termination. Return as professional legal text ready for review.`;
    const userPrompt = `Draft a renewal BAA for:
Associate: ${baa.associate_name || baa.name}
Services: ${baa.services_provided || 'data processing'}
Original Effective Date: ${baa.effective_date || 'unknown'}
Original Expiration: ${baa.expiration_date}
Previous Issues Noted: ${baa.notes || 'none'}

Generate a complete renewal BAA with all required HIPAA clauses.`;

    const aiResult = await aiChat(systemPrompt, userPrompt);
    await saveAiResult(req.user?.id, req.user?.email, 'draft-baa-renewal', { baaId }, aiResult);
    res.json({ baaId, associate_name: baa.associate_name || baa.name, draft: aiResult });
  } catch (err) {
    console.error('draft-baa-renewal error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
   PROPOSED FEATURE #5: Quiz Attempts Analytics + Remediation Generator
   ════════════════════════════════════════════════════════════════════════ */
router.post('/log-quiz-attempt', authenticateToken, async (req, res) => {
  try {
    const { employeeId, courseId, questionText, selectedAnswer, correctAnswer, isCorrect, topic } = req.body;
    await pool.query(
      `INSERT INTO quiz_attempts (employee_id, course_id, question_text, selected_answer, correct_answer, is_correct, topic, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [employeeId, courseId, questionText, selectedAnswer, correctAnswer, isCorrect, topic]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate-remediation', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { employeeId, courseId } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'employeeId required' });

    const wrongResult = await pool.query(
      `SELECT topic, question_text, selected_answer, correct_answer, COUNT(*)::int AS times_wrong
       FROM quiz_attempts WHERE employee_id = $1 AND is_correct = false
       ${courseId ? 'AND course_id = $2' : ''}
       GROUP BY topic, question_text, selected_answer, correct_answer
       ORDER BY times_wrong DESC LIMIT 20`,
      courseId ? [employeeId, courseId] : [employeeId]
    ).catch(() => ({ rows: [] }));

    const systemPrompt = `You are a HIPAA training content developer. Given an employee's wrong quiz answers, build a personalized remediation micro-course. Return JSON only: { "modules": [{ "topic": string, "key_concepts": [string], "explanation": string, "practice_questions": [{q,a,explanation}], "regulation_references": [string] }], "estimated_duration_minutes": number, "summary": string }`;
    const wrongTopics = [...new Set(wrongResult.rows.map(r => r.topic).filter(Boolean))];
    const userPrompt = `Employee made these mistakes (clustered):
${wrongResult.rows.map(r => `- Topic="${r.topic}", missed ${r.times_wrong}x: Q="${r.question_text}" Selected="${r.selected_answer}" Correct="${r.correct_answer}"`).join('\n')}

Top weak topics: ${wrongTopics.join(', ') || 'general HIPAA'}

Build a remediation micro-course in JSON.`;

    const aiResult = await aiChat(systemPrompt, userPrompt);
    const parsed = parseAIJson(aiResult);
    await saveAiResult(req.user?.id, req.user?.email, 'generate-remediation', { employeeId, courseId }, aiResult);
    res.json({ employeeId, weak_topics: wrongTopics, total_wrong: wrongResult.rows.length, remediation: parsed, raw_response: parsed ? undefined : aiResult });
  } catch (err) {
    console.error('generate-remediation error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/quiz-analytics', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.query;
    const where = employeeId ? 'WHERE employee_id = $1' : '';
    const params = employeeId ? [employeeId] : [];
    const [overall, byTopic] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS attempts, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct FROM quiz_attempts ${where}`, params).catch(() => ({ rows: [{ attempts: 0, correct: 0 }] })),
      pool.query(`SELECT topic, COUNT(*)::int AS attempts, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct FROM quiz_attempts ${where} GROUP BY topic ORDER BY attempts DESC LIMIT 20`, params).catch(() => ({ rows: [] })),
    ]);
    const o = overall.rows[0];
    res.json({
      overall: { attempts: o.attempts || 0, correct: o.correct || 0, pass_rate: o.attempts ? ((o.correct / o.attempts) * 100).toFixed(1) : '0' },
      by_topic: byTopic.rows.map(r => ({ topic: r.topic, attempts: r.attempts, correct: r.correct, pass_rate: r.attempts ? ((r.correct / r.attempts) * 100).toFixed(1) : '0' })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Reminder backfill job - exposed as endpoint for manual trigger */
router.post('/run-reminder-job', authenticateToken, async (req, res) => {
  try {
    const [overdueDeadlines, expiringCerts, expiringBAAs] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS cnt FROM compliance_deadlines WHERE due_date < NOW() AND status != 'completed'`).catch(() => ({ rows: [{ cnt: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS cnt FROM employees WHERE certification_date IS NOT NULL AND certification_date + INTERVAL '11 months' <= CURRENT_DATE`).catch(() => ({ rows: [{ cnt: 0 }] })),
      pool.query(`SELECT COUNT(*)::int AS cnt FROM business_associate_agreements WHERE expiration_date <= CURRENT_DATE + 30`).catch(() => ({ rows: [{ cnt: 0 }] })),
    ]);
    res.json({
      overdue_deadlines: overdueDeadlines.rows[0].cnt,
      expiring_certifications: expiringCerts.rows[0].cnt,
      expiring_baas: expiringBAAs.rows[0].cnt,
      ran_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Vendor Security Assessment
router.post('/vendor-security-assessment', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { vendorName, services, dataAccess, certifications, securityControls, recentIncidents } = req.body;
    const systemPrompt = `You are a third-party risk and HIPAA Business Associate security assessor. Evaluate the vendor's security posture relative to HIPAA Security and Privacy Rule expectations and produce a structured report. Include: Vendor Overview, Risk Tier (Low/Medium/High/Critical), Risk Score (0-100), Findings (with HIPAA rule references), Control Gaps, Recommended Mitigations, Required Contractual Provisions (e.g., BAA clauses), and Reassessment Cadence.`;
    const userPrompt = `Assess this vendor for HIPAA-aligned third-party risk:
Vendor Name: ${vendorName || 'Unspecified vendor'}
Services Provided: ${services || 'Unspecified'}
PHI / Data Access Scope: ${dataAccess || 'Unspecified'}
Stated Certifications: ${certifications || 'None provided'}
Security Controls Reported: ${securityControls || 'Not provided'}
Recent Incidents / Disclosures: ${recentIncidents || 'None reported'}

Provide a complete HIPAA-aligned vendor security assessment with concrete recommendations.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('vendor-security-assessment', req.user.email, { vendorName });
    await saveAiResult(req.user?.id, req.user?.email, 'vendor-security-assessment', req.body, result);
    res.json({ result, type: 'vendor-security-assessment', title: `Vendor Security Assessment: ${vendorName || 'Vendor'}` });
  } catch (err) {
    console.error('AI Vendor Security Assessment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Breach Simulation (tabletop exercise)
router.post('/breach-simulation', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { scenarioType, organizationContext, currentControls, participants } = req.body;
    const systemPrompt = `You are a HIPAA incident-response tabletop facilitator. Run a scripted breach simulation that an organization can use as a self-administered exercise. Output sections: Scenario Narrative, Injects (timed events), Decision Points (per role), Expected Response (against HIPAA Breach Notification Rule), Scoring Rubric (0-100 across detection, containment, notification, documentation, recovery), Identified Gaps, and Post-Exercise Action Items.`;
    const userPrompt = `Design a HIPAA breach tabletop exercise:
Scenario Type: ${scenarioType || 'ransomware affecting EHR'}
Organization Context: ${organizationContext || 'Mid-sized covered entity'}
Current Controls: ${currentControls || 'Standard HIPAA Security Rule controls'}
Participants / Roles: ${participants || 'CISO, Privacy Officer, IT Lead, Compliance, Communications, Legal'}

Produce a complete tabletop exercise with injects, decision points, scoring rubric, and post-exercise action items.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('breach-simulation', req.user.email, { scenarioType });
    await saveAiResult(req.user?.id, req.user?.email, 'breach-simulation', req.body, result);
    res.json({ result, type: 'breach-simulation', title: `Breach Simulation: ${scenarioType || 'Tabletop Exercise'}` });
  } catch (err) {
    console.error('AI Breach Simulation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Apply pass 5 backlog: 3 mechanical AI endpoints ---------- //

function noKeyGuard(res) {
  if (!process.env.OPENROUTER_API_KEY) {
    res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    return true;
  }
  return false;
}

// AI Policy Document Gap Analysis (OCR-style — accepts pasted policy text)
router.post('/policy-gap-analysis', authenticateToken, aiRateLimiter, async (req, res) => {
  if (noKeyGuard(res)) return;
  try {
    const { policyText, policyTitle, hipaaScope } = req.body || {};
    if (!policyText || policyText.trim().length < 50) {
      return res.status(400).json({ error: 'policyText (raw policy document text) is required' });
    }
    const systemPrompt = `You are a HIPAA policy auditor. Compare the provided policy document text against HIPAA Privacy, Security, and Breach Notification Rule requirements. Return a structured Markdown report with sections: Document Overview, HIPAA Mapping (table — clause referenced -> policy section), Identified Gaps (with Privacy/Security/Breach Rule references), Severity (Critical/High/Medium/Low), Recommended Edits (with redline-style suggestions), Missing Procedures, and Reassessment Cadence. If the document is too short for full coverage, say so explicitly.`;
    const userPrompt = `Policy Title: ${policyTitle || 'Untitled policy'}
Scope of Review: ${hipaaScope || 'Privacy + Security + Breach Notification Rules'}

POLICY TEXT (analyze):
"""
${policyText.slice(0, 12000)}
"""

Produce a complete HIPAA gap analysis with redline-style recommended edits.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('policy-gap-analysis', req.user.email, { policyTitle });
    await saveAiResult(req.user?.id, req.user?.email, 'policy-gap-analysis', { policyTitle, hipaaScope }, result);
    res.json({ result, type: 'policy-gap-analysis', title: `Policy Gap Analysis: ${policyTitle || 'Document'}` });
  } catch (err) {
    console.error('AI Policy Gap Analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Adaptive Training Path generator
router.post('/adaptive-training-path', authenticateToken, aiRateLimiter, async (req, res) => {
  if (noKeyGuard(res)) return;
  try {
    const { employeeId, role, department, riskProfile, recentQuizScores, knowledgeGaps } = req.body || {};
    let employee = null;
    if (employeeId) {
      try {
        const r = await pool.query('SELECT * FROM employees WHERE id = $1', [employeeId]);
        if (r.rows.length) employee = r.rows[0];
      } catch (e) { /* table shape may differ */ }
    }
    const systemPrompt = `You are a HIPAA training designer. Build an ADAPTIVE training path for an employee based on their role, department risk profile, recent quiz performance, and identified knowledge gaps. Output Markdown with sections: Learner Profile Summary, Recommended Modules (ordered, with rationale and HIPAA reference), Difficulty Progression, Scenario-Based Reinforcement Activities, Quiz Strategy (frequency + topics), Predicted Completion Time, Adaptive Triggers (when to branch). Be specific and grounded in HIPAA Privacy/Security Rule.`;
    const userPrompt = `Employee snapshot:
- Role: ${role || employee?.role || 'unspecified'}
- Department: ${department || employee?.department || 'unspecified'}
- Risk Profile: ${riskProfile || 'standard'}
- Recent Quiz Scores: ${recentQuizScores || 'not provided'}
- Knowledge Gaps: ${knowledgeGaps || 'not provided'}

Build a complete adaptive training path with module sequencing and adaptive triggers.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('adaptive-training-path', req.user.email, { employeeId, role });
    await saveAiResult(req.user?.id, req.user?.email, 'adaptive-training-path', req.body, result);
    res.json({ result, type: 'adaptive-training-path', title: `Adaptive Training Path${employee ? ` — ${employee.name || employee.email || employee.id}` : ''}` });
  } catch (err) {
    console.error('AI Adaptive Training Path error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Continuous Compliance Monitor narrative — synthesizes recent state into a narrative report
router.post('/continuous-compliance-narrative', authenticateToken, aiRateLimiter, async (req, res) => {
  if (noKeyGuard(res)) return;
  try {
    const { window_days } = req.body || {};
    const windowDays = Math.max(1, Math.min(parseInt(window_days) || 30, 180));

    let employees = [], incidents = [], policies = [], assessments = [], baas = [];
    try { const r = await pool.query('SELECT id, name, email, department, role FROM employees LIMIT 200'); employees = r.rows; } catch (_) {}
    try { const r = await pool.query(`SELECT * FROM incidents WHERE created_at >= NOW() - ($1 || ' days')::interval ORDER BY created_at DESC LIMIT 50`, [windowDays]); incidents = r.rows; } catch (_) {}
    try { const r = await pool.query('SELECT id, title, status, last_reviewed FROM policies LIMIT 100'); policies = r.rows; } catch (_) {}
    try { const r = await pool.query(`SELECT * FROM assessments WHERE created_at >= NOW() - ($1 || ' days')::interval ORDER BY created_at DESC LIMIT 50`, [windowDays]); assessments = r.rows; } catch (_) {}
    try { const r = await pool.query('SELECT id, vendor_name, status, expires_at FROM baas LIMIT 100'); baas = r.rows; } catch (_) {}

    const systemPrompt = `You are an automated HIPAA compliance program narrator. Given the org snapshot below, produce a CONTINUOUS-MONITORING narrative report covering the period. Output Markdown sections: Executive Summary (5 bullets), Health Score (0-100) with components (training, policies, incidents, BAAs, risk), Top 5 Risks This Period, Top 5 Wins, Trending Concerns, Recommended Actions (next 30 days, prioritized), Boilerplate Statement of Compliance Posture. Be precise, factual, and reference HIPAA rules where appropriate.`;
    const userPrompt = `Window: last ${windowDays} days

EMPLOYEES (${employees.length} sample):
${employees.slice(0, 30).map(e => `- ${e.id}: ${e.name || e.email} dept=${e.department || 'n/a'} role=${e.role || 'n/a'}`).join('\n')}

INCIDENTS (${incidents.length}):
${incidents.slice(0, 20).map(i => `- ${i.id}: ${i.title || i.summary || 'incident'} severity=${i.severity || 'n/a'} status=${i.status || 'open'}`).join('\n')}

POLICIES (${policies.length} sample):
${policies.slice(0, 15).map(p => `- ${p.id}: ${p.title} status=${p.status || 'unknown'} reviewed=${p.last_reviewed || 'n/a'}`).join('\n')}

ASSESSMENTS (${assessments.length}):
${assessments.slice(0, 15).map(a => `- ${a.id}: ${a.title || a.type || 'assessment'} score=${a.score || 'n/a'}`).join('\n')}

BAAs (${baas.length} sample):
${baas.slice(0, 15).map(b => `- ${b.id}: ${b.vendor_name} status=${b.status} expires=${b.expires_at || 'n/a'}`).join('\n')}

Produce a complete narrative report.`;

    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('continuous-compliance-narrative', req.user.email, { window_days: windowDays });
    await saveAiResult(req.user?.id, req.user?.email, 'continuous-compliance-narrative', { window_days: windowDays }, result);
    res.json({ result, type: 'continuous-compliance-narrative', title: `Continuous Compliance Report (${windowDays}d)` });
  } catch (err) {
    console.error('AI Continuous Compliance Narrative error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
