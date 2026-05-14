const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = (data && (data.detail || data.message || data.error)) || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

// Auth
export async function login(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Dashboard
export function fetchDashboard() {
  return apiRequest('/dashboard');
}

// Generic CRUD
export function fetchAll(resource, search = '') {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest(`/${resource}${qs}`);
}

export function fetchOne(resource, id) {
  return apiRequest(`/${resource}/${id}`);
}

export function createItem(resource, data) {
  return apiRequest(`/${resource}`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateItem(resource, id, data) {
  return apiRequest(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteItem(resource, id) {
  return apiRequest(`/${resource}/${id}`, { method: 'DELETE' });
}

// AI Features
function aiPost(endpoint, data) {
  return apiRequest(`/ai/${endpoint}`, { method: 'POST', body: JSON.stringify(data) });
}

// Original 10 AI features
export const generatePolicy = (d) => aiPost('generate-policy', d);
export const generateQuiz = (d) => aiPost('generate-quiz', d);
export const checkCompliance = (d) => aiPost('check-compliance', d);
export const analyzeRisk = (d) => aiPost('analyze-risk', d);
export const incidentResponse = (d) => aiPost('incident-response', d);
export const gapAnalysis = (d) => aiPost('gap-analysis', d);
export const trainingRecommendation = (d) => aiPost('training-recommendation', d);
export const generateAuditReport = (d) => aiPost('generate-audit-report', d);
export const securityAssessment = (d) => aiPost('security-assessment', d);
export const baaReview = (d) => aiPost('baa-review', d);

// Per-feature AI features
export const analyzeEmployee = (d) => aiPost('analyze-employee', d);
export const analyzeDepartment = (d) => aiPost('analyze-department', d);
export const generateCourseContent = (d) => aiPost('generate-course-content', d);
export const analyzeTrainingRecords = (d) => aiPost('analyze-training-records', d);
export const generateAssessment = (d) => aiPost('generate-assessment', d);
export const reviewDocument = (d) => aiPost('review-document', d);
export const analyzePhiRisk = (d) => aiPost('analyze-phi-risk', d);
export const reviewAccessControl = (d) => aiPost('review-access-control', d);
export const recommendSanction = (d) => aiPost('recommend-sanction', d);
export const prioritizeDeadlines = (d) => aiPost('prioritize-deadlines', d);
export const analyzeAuditLogs = (d) => aiPost('analyze-audit-logs', d);
export const monitorBaa = (d) => aiPost('monitor-baa', d);
export const investigateIncident = (d) => aiPost('investigate-incident', d);
export const planRiskMitigation = (d) => aiPost('plan-risk-mitigation', d);
export const validatePolicy = (d) => aiPost('validate-policy', d);

// New: DB-context AI tools (refactored from string-based originals)
export const analyzeEmployeeDeep = (d) => aiPost('analyze-employee-deep', d);
export const analyzeDepartmentDeep = (d) => aiPost('analyze-department-deep', d);

// Proposed Feature #2: Auto-enroll training
export const autoEnrollTraining = (d) => aiPost('auto-enroll-training', d);

// Proposed Feature #3: Access anomaly detection
export const detectAccessAnomalies = (d) => aiPost('detect-access-anomalies', d);

// Proposed Feature #4: BAA renewals
export const fetchBaaRenewals = () => apiRequest('/ai/baa-renewals');
export const draftBaaRenewal = (d) => aiPost('draft-baa-renewal', d);

// Proposed Feature #5: Quiz attempts + remediation
export const logQuizAttempt = (d) => aiPost('log-quiz-attempt', d);
export const generateRemediation = (d) => aiPost('generate-remediation', d);
export const fetchQuizAnalytics = (employeeId) => apiRequest(`/ai/quiz-analytics${employeeId ? `?employeeId=${employeeId}` : ''}`);

// Reminders
export const fetchReminders = (page = 1, limit = 20) => apiRequest(`/reminders?page=${page}&limit=${limit}`);
export const acknowledgeReminder = (id) => apiRequest(`/reminders/${id}/acknowledge`, { method: 'POST' });
export const runReminderJob = () => aiPost('run-reminder-job', {});

// AI history
export const fetchAiResults = (page = 1, limit = 20) => apiRequest(`/ai/results?page=${page}&limit=${limit}`);

// Audit-added: Vendor Security Assessment & Breach Simulation
export const vendorSecurityAssessment = (d) => aiPost('vendor-security-assessment', d);
export const breachSimulation = (d) => aiPost('breach-simulation', d);

// Apply pass 5 backlog
export const policyGapAnalysis = (d) => aiPost('policy-gap-analysis', d);
export const adaptiveTrainingPath = (d) => aiPost('adaptive-training-path', d);
export const continuousComplianceNarrative = (d) => aiPost('continuous-compliance-narrative', d);
