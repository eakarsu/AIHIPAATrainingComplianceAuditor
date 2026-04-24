import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { aiChat } from '../services/openrouter.js';
import pool from '../db.js';

const router = express.Router();

// AI Policy Generator
router.post('/generate-policy', authenticateToken, async (req, res) => {
  try {
    const { policyType, department, specificRequirements } = req.body;
    const systemPrompt = `You are a HIPAA compliance expert and policy writer. Generate professional, comprehensive HIPAA policies that are ready to implement. Structure your response with clear sections: Purpose, Scope, Policy Statement, Procedures, Responsibilities, Enforcement, and Review Schedule. Use formal language appropriate for healthcare compliance documentation.`;
    const userPrompt = `Generate a detailed HIPAA ${policyType || 'general'} policy for the ${department || 'organization'}. ${specificRequirements ? 'Additional requirements: ' + specificRequirements : ''} Include specific procedures, responsible parties, and enforcement measures.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('generate-policy', req.user.email, { policyType, department });
    res.json({ result, type: 'policy', title: `${policyType || 'General'} HIPAA Policy` });
  } catch (err) {
    console.error('AI Policy Generator error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Training Quiz Generator
router.post('/generate-quiz', authenticateToken, async (req, res) => {
  try {
    const { topic, difficulty, questionCount } = req.body;
    const systemPrompt = `You are a HIPAA training specialist. Generate training quiz questions with multiple choice answers. For each question provide: the question text, 4 options (A, B, C, D), the correct answer letter, and a brief explanation of why it's correct. Format each question clearly with numbered questions. Make questions practical and scenario-based when possible.`;
    const userPrompt = `Generate ${questionCount || 10} HIPAA training quiz questions about "${topic || 'General HIPAA Compliance'}". Difficulty level: ${difficulty || 'intermediate'}. Include real-world healthcare scenarios and test practical knowledge of HIPAA regulations.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('generate-quiz', req.user.email, { topic, difficulty, questionCount });
    res.json({ result, type: 'quiz', title: `${topic || 'HIPAA'} Training Quiz` });
  } catch (err) {
    console.error('AI Quiz Generator error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Compliance Checker
router.post('/check-compliance', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'compliance-check', title: 'Compliance Assessment Report' });
  } catch (err) {
    console.error('AI Compliance Checker error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Risk Analyzer
router.post('/analyze-risk', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'risk-analysis', title: 'Risk Analysis Report' });
  } catch (err) {
    console.error('AI Risk Analyzer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Incident Response Advisor
router.post('/incident-response', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'incident-response', title: 'Incident Response Plan' });
  } catch (err) {
    console.error('AI Incident Response error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Gap Analysis
router.post('/gap-analysis', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'gap-analysis', title: 'HIPAA Gap Analysis Report' });
  } catch (err) {
    console.error('AI Gap Analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Training Recommendation
router.post('/training-recommendation', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'training-recommendation', title: 'Training Recommendation Plan' });
  } catch (err) {
    console.error('AI Training Recommendation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Audit Report Generator
router.post('/generate-audit-report', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'audit-report', title: 'HIPAA Compliance Audit Report' });
  } catch (err) {
    console.error('AI Audit Report Generator error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Security Assessment
router.post('/security-assessment', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'security-assessment', title: 'Security Assessment Report' });
  } catch (err) {
    console.error('AI Security Assessment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI BAA Review
router.post('/baa-review', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'baa-review', title: 'BAA Compliance Review' });
  } catch (err) {
    console.error('AI BAA Review error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Employee Training Analysis
router.post('/analyze-employee', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'employee-analysis', title: 'Employee Training Analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Department Compliance Analysis
router.post('/analyze-department', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'department-analysis', title: 'Department Compliance Analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Course Content Generator
router.post('/generate-course-content', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'course-content', title: 'Generated Course Content' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Training Record Analysis
router.post('/analyze-training-records', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'training-analysis', title: 'Training Record Analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Assessment Generator
router.post('/generate-assessment', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'assessment-generator', title: 'Generated Assessment Framework' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Document Review
router.post('/review-document', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'document-review', title: 'Document Review Analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI PHI Risk Assessment
router.post('/analyze-phi-risk', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'phi-risk-analysis', title: 'PHI Risk Assessment' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Access Control Review
router.post('/review-access-control', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'access-review', title: 'Access Control Review' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Sanction Recommendation
router.post('/recommend-sanction', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'sanction-recommendation', title: 'Sanction Recommendation' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Deadline Priority Analyzer
router.post('/prioritize-deadlines', authenticateToken, async (req, res) => {
  try {
    const { deadlines, organizationContext } = req.body;
    const systemPrompt = `You are a HIPAA compliance project manager. Analyze compliance deadlines and provide: Priority Ranking (with reasoning), Risk Assessment for each deadline, Resource Allocation Recommendations, Dependencies Between Tasks, Critical Path Analysis, Delegation Suggestions, Escalation Triggers, Regulatory Impact of Missing Each Deadline, Suggested Timeline Adjustments, and Weekly Action Plan. Consider regulatory requirements and organizational capacity.`;
    const userPrompt = `Analyze and prioritize these compliance deadlines:
Deadlines: ${deadlines || 'General HIPAA compliance deadlines'}
Organization Context: ${organizationContext || 'Healthcare organization with standard compliance requirements'}
Provide a prioritized action plan with risk assessments.`;
    const result = await aiChat(systemPrompt, userPrompt);
    await logAiAction('prioritize-deadlines', req.user.email, {});
    res.json({ result, type: 'deadline-priorities', title: 'Deadline Priority Analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Audit Log Analyzer
router.post('/analyze-audit-logs', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'audit-log-analysis', title: 'Audit Log Analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI BAA Compliance Monitor
router.post('/monitor-baa', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'baa-monitor', title: 'BAA Compliance Monitor' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Incident Investigation
router.post('/investigate-incident', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'incident-investigation', title: 'Incident Investigation Plan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Risk Mitigation Planner
router.post('/plan-risk-mitigation', authenticateToken, async (req, res) => {
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
    res.json({ result, type: 'risk-mitigation', title: 'Risk Mitigation Plan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Policy Compliance Validator
router.post('/validate-policy', authenticateToken, async (req, res) => {
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

export default router;
