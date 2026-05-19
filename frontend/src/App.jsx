import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import {
  Shield, Users, BookOpen, ClipboardCheck, FileText, AlertTriangle,
  Handshake, Database, AlertOctagon, ScrollText, Calendar, Gavel,
  FolderOpen, Lock, Brain, Activity, LayoutDashboard, ChevronLeft,
  ChevronRight, LogOut, Menu, X, ChevronDown, ChevronUp, Plus,
  Trash2, Edit3, Eye, Search, Zap, Sparkles,
} from 'lucide-react';
import {
  login as apiLogin, fetchDashboard, fetchAll, fetchOne,
  createItem, updateItem, deleteItem,
  generatePolicy, generateQuiz, checkCompliance, analyzeRisk,
  incidentResponse, gapAnalysis, trainingRecommendation,
  generateAuditReport, securityAssessment, baaReview,
  analyzeEmployee, analyzeDepartment, generateCourseContent,
  analyzeTrainingRecords, generateAssessment, reviewDocument,
  analyzePhiRisk, reviewAccessControl, recommendSanction,
  prioritizeDeadlines, analyzeAuditLogs, monitorBaa,
  investigateIncident, planRiskMitigation, validatePolicy,
  // New: DB-context AI tools and proposed feature endpoints
  analyzeEmployeeDeep, analyzeDepartmentDeep, autoEnrollTraining,
  detectAccessAnomalies, fetchBaaRenewals, draftBaaRenewal,
  logQuizAttempt, generateRemediation, fetchQuizAnalytics,
  fetchReminders, acknowledgeReminder, runReminderJob,
  fetchAiResults,
  vendorSecurityAssessment, breachSimulation,
  // Apply pass 5
  policyGapAnalysis, adaptiveTrainingPath, continuousComplianceNarrative,
} from './services/api.js';
import AI_CONFIG from './aiConfig.js';

// === Batch 04 Gaps & Frontend Mounts ===
import CfAgenticComplianceAuditorContinuously from './pages/CfAgenticComplianceAuditorContinuously';
import CfBreachSimulationGamifiedExercisesSco from './pages/CfBreachSimulationGamifiedExercisesSco';
import CfAdaptiveWorkforceTrainingWithRoleBa from './pages/CfAdaptiveWorkforceTrainingWithRoleBa';
import CfRealTimeAccessMonitoringFlaggingBul from './pages/CfRealTimeAccessMonitoringFlaggingBul';
import CfVendorRiskManagementIngestingSoc2 from './pages/CfVendorRiskManagementIngestingSoc2';
import CfOcrPolicyAutomationExtractingRequire from './pages/CfOcrPolicyAutomationExtractingRequire';
import GapLimitedVendorSecurityAssessmentDepth from './pages/GapLimitedVendorSecurityAssessmentDepth';
import GapNoBreachSimulationTabletopEndpoint from './pages/GapNoBreachSimulationTabletopEndpoint';
import GapNoInsiderThreatBehaviorBaselineDrif from './pages/GapNoInsiderThreatBehaviorBaselineDrif';
import GapNoUserFacingDashboardBackendApi from './pages/GapNoUserFacingDashboardBackendApi';
import GapNoRealTimePhiStreamingMonitor from './pages/GapNoRealTimePhiStreamingMonitor';
import GapNoEhrSystemIntegration from './pages/GapNoEhrSystemIntegration';
import GapNoExternalRegulatorCommunicationWork from './pages/GapNoExternalRegulatorCommunicationWork';
import GapNoWebhookSurfaceForSiemIntegration from './pages/GapNoWebhookSurfaceForSiemIntegration';
import GapNoMultiTenantCoveredEntityIsolation from './pages/GapNoMultiTenantCoveredEntityIsolation';
import CustomViewsPage from './pages/CustomViewsPage';

/* ═══════════════════════════════════════════════════════════════════════════
   AUTH CONTEXT
   ═══════════════════════════════════════════════════════════════════════ */

const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  return children;
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAV CONFIG
   ═══════════════════════════════════════════════════════════════════════ */

const NAV_SECTIONS = [
  { label: 'Overview', items: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Management', items: [
    { label: 'Employees', path: '/employees', icon: Users },
    { label: 'Departments', path: '/departments', icon: Shield },
    { label: 'Training Courses', path: '/courses', icon: BookOpen },
    { label: 'Training Records', path: '/training-records', icon: ClipboardCheck },
    { label: 'Documents', path: '/documents', icon: FolderOpen },
  ]},
  { label: 'Compliance', items: [
    { label: 'Assessments', path: '/assessments', icon: ClipboardCheck },
    { label: 'Policies', path: '/policies', icon: ScrollText },
    { label: 'Incidents', path: '/incidents', icon: AlertTriangle },
    { label: 'BAAs', path: '/baas', icon: Handshake },
    { label: 'Deadlines', path: '/deadlines', icon: Calendar },
    { label: 'Sanctions', path: '/sanctions', icon: Gavel },
  ]},
  { label: 'Security', items: [
    { label: 'PHI Inventory', path: '/phi-inventory', icon: Database },
    { label: 'Risk Register', path: '/risk-register', icon: AlertOctagon },
    { label: 'Access Control', path: '/access-control', icon: Lock },
    { label: 'Audit Logs', path: '/audit-logs', icon: FileText },
  ]},
  { label: 'AI Generators', items: [
    { label: 'Policy Generator', path: '/ai/generate-policy', icon: Brain },
    { label: 'Quiz Generator', path: '/ai/generate-quiz', icon: Brain },
    { label: 'Course Content', path: '/ai/generate-course-content', icon: Brain },
    { label: 'Assessment Builder', path: '/ai/generate-assessment', icon: Brain },
    { label: 'Audit Report', path: '/ai/generate-audit-report', icon: Brain },
  ]},
  { label: 'AI Analysis', items: [
    { label: 'Compliance Check', path: '/ai/check-compliance', icon: Brain },
    { label: 'Risk Analysis', path: '/ai/analyze-risk', icon: Brain },
    { label: 'Gap Analysis', path: '/ai/gap-analysis', icon: Brain },
    { label: 'Security Assessment', path: '/ai/security-assessment', icon: Brain },
    { label: 'PHI Risk Assessment', path: '/ai/analyze-phi-risk', icon: Brain },
    { label: 'Audit Log Analysis', path: '/ai/analyze-audit-logs', icon: Brain },
  ]},
  { label: 'AI Advisors', items: [
    { label: 'Incident Response', path: '/ai/incident-response', icon: Brain },
    { label: 'Incident Investigation', path: '/ai/investigate-incident', icon: Brain },
    { label: 'Training Recommender', path: '/ai/training-recommendation', icon: Brain },
    { label: 'Employee Analysis', path: '/ai/analyze-employee', icon: Brain },
    { label: 'Dept Compliance', path: '/ai/analyze-department', icon: Brain },
    { label: 'Risk Mitigation', path: '/ai/plan-risk-mitigation', icon: Brain },
    { label: 'Sanction Advisor', path: '/ai/recommend-sanction', icon: Brain },
    { label: 'Deadline Prioritizer', path: '/ai/prioritize-deadlines', icon: Brain },
  ]},
  { label: 'AI Reviews', items: [
    { label: 'BAA Review', path: '/ai/baa-review', icon: Brain },
    { label: 'BAA Monitor', path: '/ai/monitor-baa', icon: Brain },
    { label: 'Policy Validator', path: '/ai/validate-policy', icon: Brain },
    { label: 'Document Review', path: '/ai/review-document', icon: Brain },
    { label: 'Access Review', path: '/ai/review-access-control', icon: Brain },
    { label: 'Training Records', path: '/ai/analyze-training-records', icon: Brain },
  ]},
  { label: 'AI v2 (DB-backed)', items: [
    { label: 'Employee Deep Analysis', path: '/ai/analyze-employee-deep', icon: Sparkles },
    { label: 'Department Deep Analysis', path: '/ai/analyze-department-deep', icon: Sparkles },
    { label: 'Auto-Enroll Training', path: '/ai/auto-enroll-training', icon: Sparkles },
    { label: 'Access Anomaly Detector', path: '/ai/detect-access-anomalies', icon: Sparkles },
    { label: 'BAA Renewal Drafter', path: '/ai/draft-baa-renewal', icon: Sparkles },
    { label: 'Quiz Remediation', path: '/ai/generate-remediation', icon: Sparkles },
    { label: 'Vendor Security Assessment', path: '/ai/vendor-security-assessment', icon: Sparkles },
    { label: 'Breach Tabletop Simulation', path: '/ai/breach-simulation', icon: Sparkles },
  ]},
  { label: 'Operations', items: [
    { label: 'BAA Renewals', path: '/baa-renewals', icon: Calendar },
    { label: 'Reminders', path: '/reminders', icon: AlertTriangle },
    { label: 'Quiz Analytics', path: '/quiz-analytics', icon: Activity },
    { label: 'AI History', path: '/ai-history', icon: FileText },
  ]},
  { label: 'Custom', items: [
    { label: 'HIPAA Views', path: '/custom-views', icon: Activity },
  ]},
];

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════════════════════ */

function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState(() =>
    NAV_SECTIONS.reduce((a, s) => ({ ...a, [s.label]: true }), {})
  );

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'}`} style={{ minHeight: '100vh' }}>
      <div className="flex items-center justify-between px-3 py-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex-shrink-0 w-7 h-7 rounded-md bg-sky-500 flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white truncate">HIPAA Auditor</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto w-7 h-7 rounded-md bg-sky-500 flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggle} className="text-slate-400 hover:text-white p-1 rounded"><ChevronLeft size={16} /></button>
        )}
      </div>

      {collapsed && (
        <button onClick={onToggle} className="mt-2 mx-auto text-slate-400 hover:text-white p-1 rounded"><ChevronRight size={16} /></button>
      )}

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-1">
            {!collapsed && (
              <button onClick={() => setOpenSections(p => ({ ...p, [section.label]: !p[section.label] }))}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-300 rounded">
                <span>{section.label}</span>
                {openSections[section.label] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            {(collapsed || openSections[section.label]) && (
              <ul className="mt-0.5 space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <li key={item.path}>
                      <Link to={item.path} title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${active ? 'bg-sky-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${collapsed ? 'justify-center' : ''}`}>
                        <Icon size={16} className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-slate-300 uppercase">{user?.full_name?.[0] || user?.email?.[0] || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">{user?.full_name || user?.email || 'Admin'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role || 'admin'}</p>
            </div>
            <button onClick={() => { logout(); navigate('/', { replace: true }); }} className="text-slate-500 hover:text-red-400 p-1 rounded">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button onClick={() => { logout(); navigate('/', { replace: true }); }} className="w-full flex justify-center text-slate-500 hover:text-red-400 p-1 rounded" title="Logout">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════════════════════════════════ */

function Header({ onMenuClick }) {
  const location = useLocation();
  const pageTitle = (() => {
    const p = location.pathname;
    if (p === '/dashboard') return 'Dashboard';
    if (p.startsWith('/ai/')) return p.replace('/ai/', '').split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') + ' — AI Tool';
    return p.replace('/', '').split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  })();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-slate-900/80 backdrop-blur border-b border-slate-800">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden text-slate-400 hover:text-white"><Menu size={20} /></button>
        <h1 className="text-base font-semibold text-white">{pageTitle}</h1>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
        <Shield size={12} className="text-sky-400" />
        <span>HIPAA Compliance Platform</span>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter email and password.'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed.');
    } finally { setLoading(false); }
  }

  function autoFillAdmin() {
    setEmail('admin@hipaa-auditor.com');
    setPassword('admin123');
  }

  function autoFillUser() {
    setEmail('user@hipaa-auditor.com');
    setPassword('user123');
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30 mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">HIPAA Auditor</h1>
          <p className="text-sm text-slate-400 mt-1">AI-Powered Compliance Platform</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-1">Sign in</h2>
          <p className="text-xs text-slate-400 mb-5">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" autoComplete="email"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-md shadow-sky-900/40">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            <p className="text-xs text-slate-500 text-center">Quick Login</p>
            <div className="flex gap-2">
              <button onClick={autoFillAdmin}
                className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/40 text-emerald-400 text-xs font-medium py-2 rounded-lg transition-colors">
                Admin Account
              </button>
              <button onClick={autoFillUser}
                className="flex-1 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/40 text-violet-400 text-xs font-medium py-2 rounded-lg transition-colors">
                User Account
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">Protected by HIPAA-compliant infrastructure</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════════ */

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard().then(setStats).catch(() => setStats(null)).finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Total Employees', value: stats.totalEmployees ?? 0, color: 'sky', path: '/employees' },
    { label: 'Training Courses', value: stats.totalCourses ?? 0, color: 'emerald', path: '/courses' },
    { label: 'Completed Trainings', value: stats.completedTrainings ?? 0, color: 'teal', path: '/training-records' },
    { label: 'Non-Compliant', value: stats.nonCompliantAssessments ?? 0, color: 'rose', path: '/assessments' },
    { label: 'Open Incidents', value: stats.openIncidents ?? 0, color: 'amber', path: '/incidents' },
    { label: 'Active Policies', value: stats.activePolicies ?? 0, color: 'violet', path: '/policies' },
    { label: 'High Risks', value: stats.highRisks ?? 0, color: 'orange', path: '/risk-register' },
    { label: 'Overdue Deadlines', value: stats.overdueDeadlines ?? 0, color: 'red', path: '/deadlines' },
  ] : [];

  const colorMap = {
    sky:     'border-sky-500/40 bg-sky-500/10 text-sky-400',
    emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    teal:    'border-teal-500/40 bg-teal-500/10 text-teal-400',
    rose:    'border-rose-500/40 bg-rose-500/10 text-rose-400',
    amber:   'border-amber-500/40 bg-amber-500/10 text-amber-400',
    violet:  'border-violet-500/40 bg-violet-500/10 text-violet-400',
    orange:  'border-orange-500/40 bg-orange-500/10 text-orange-400',
    red:     'border-red-500/40 bg-red-500/10 text-red-400',
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Overview</h2>
        <p className="text-sm text-slate-400 mt-1">Real-time HIPAA compliance metrics</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-800 border border-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(card => (
            <Link key={card.label} to={card.path} className={`border rounded-xl p-5 ${colorMap[card.color]} hover:scale-[1.02] transition-transform cursor-pointer`}>
              <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-white">{card.value}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Activity size={40} className="mb-3 opacity-40" />
          <p className="text-sm">Dashboard data unavailable</p>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Quick AI Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Policy Generator', path: '/ai/generate-policy' },
            { label: 'Risk Analysis', path: '/ai/analyze-risk' },
            { label: 'Gap Analysis', path: '/ai/gap-analysis' },
            { label: 'Compliance Check', path: '/ai/check-compliance' },
            { label: 'Audit Report', path: '/ai/generate-audit-report' },
            { label: 'Quiz Generator', path: '/ai/generate-quiz' },
            { label: 'Incident Response', path: '/ai/incident-response' },
            { label: 'Training Recommender', path: '/ai/training-recommendation' },
            { label: 'Security Assessment', path: '/ai/security-assessment' },
            { label: 'BAA Review', path: '/ai/baa-review' },
          ].map(item => (
            <Link key={item.path} to={item.path}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-sky-500/50 rounded-xl px-3 py-3 text-xs font-medium text-slate-300 hover:text-white transition-all">
              <Brain size={14} className="text-sky-400 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DETAIL MODAL
   ═══════════════════════════════════════════════════════════════════════ */

function DetailModal({ item, onClose, onEdit, onDelete, resource, onAi }) {
  if (!item) return null;
  const keys = Object.keys(item).filter(k => k !== 'created_at');
  const aiActions = FEATURE_AI_MAP[resource] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-bold text-white">Record Details</h3>
          <div className="flex items-center gap-2">
            {aiActions.map(ai => (
              <button key={ai.aiPath} onClick={() => { onClose(); onAi({ aiPath: ai.aiPath, initialData: ai.prefill(item) }); }}
                className="flex items-center gap-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/40 text-violet-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                <Brain size={13} /> {ai.label}
              </button>
            ))}
            <button onClick={() => onEdit(item)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              <Edit3 size={13} /> Edit
            </button>
            <button onClick={() => onDelete(item.id)} className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              <Trash2 size={13} /> Delete
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded"><X size={18} /></button>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {keys.map(key => (
            <div key={key} className="flex gap-4">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider w-40 flex-shrink-0 pt-0.5">{key.replace(/_/g, ' ')}</span>
              <span className="text-sm text-slate-200 flex-1 break-words">
                {item[key] === null || item[key] === undefined ? <span className="text-slate-600">—</span>
                  : typeof item[key] === 'boolean' ? (item[key] ? <span className="text-emerald-400">Yes</span> : <span className="text-slate-500">No</span>)
                  : String(item[key])}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FORM MODAL
   ═══════════════════════════════════════════════════════════════════════ */

function FormModal({ item, fields, onClose, onSave, title }) {
  const [form, setForm] = useState(item || {});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map(f => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label || f.name.replace(/_/g, ' ')}</label>
              {f.type === 'textarea' ? (
                <textarea rows={3} value={form[f.name] ?? ''} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-y" />
              ) : f.type === 'checkbox' ? (
                <input type="checkbox" checked={form[f.name] ?? false} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.checked }))}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-sky-500 focus:ring-sky-500" />
              ) : (
                <input type={f.type || 'text'} value={form[f.name] ?? ''} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              )}
            </div>
          ))}
          <button type="submit" disabled={saving}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE PAGE CONFIG (fields for each resource)
   ═══════════════════════════════════════════════════════════════════════ */

const RESOURCE_FIELDS = {
  employees: [
    { name: 'first_name', label: 'First Name' },
    { name: 'last_name', label: 'Last Name' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'department_id', label: 'Department ID', type: 'number' },
    { name: 'job_title', label: 'Job Title' },
    { name: 'hire_date', label: 'Hire Date', type: 'date' },
    { name: 'training_status', label: 'Training Status' },
    { name: 'hipaa_certified', label: 'HIPAA Certified', type: 'checkbox' },
  ],
  departments: [
    { name: 'name', label: 'Department Name' },
    { name: 'head_name', label: 'Department Head' },
    { name: 'employee_count', label: 'Employee Count', type: 'number' },
    { name: 'compliance_score', label: 'Compliance Score', type: 'number' },
    { name: 'risk_level', label: 'Risk Level' },
  ],
  courses: [
    { name: 'title', label: 'Title' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'category', label: 'Category' },
    { name: 'duration_hours', label: 'Duration (hours)', type: 'number' },
    { name: 'passing_score', label: 'Passing Score', type: 'number' },
    { name: 'is_mandatory', label: 'Mandatory', type: 'checkbox' },
    { name: 'status', label: 'Status' },
  ],
  'training-records': [
    { name: 'employee_id', label: 'Employee ID', type: 'number' },
    { name: 'course_id', label: 'Course ID', type: 'number' },
    { name: 'status', label: 'Status' },
    { name: 'score', label: 'Score', type: 'number' },
    { name: 'started_at', label: 'Started At', type: 'date' },
    { name: 'completed_at', label: 'Completed At', type: 'date' },
    { name: 'expires_at', label: 'Expires At', type: 'date' },
  ],
  assessments: [
    { name: 'title', label: 'Title' },
    { name: 'department_id', label: 'Department ID', type: 'number' },
    { name: 'assessor_name', label: 'Assessor' },
    { name: 'assessment_date', label: 'Assessment Date', type: 'date' },
    { name: 'status', label: 'Status' },
    { name: 'score', label: 'Score', type: 'number' },
    { name: 'findings', label: 'Findings', type: 'textarea' },
    { name: 'recommendations', label: 'Recommendations', type: 'textarea' },
    { name: 'next_review_date', label: 'Next Review Date', type: 'date' },
  ],
  policies: [
    { name: 'title', label: 'Title' },
    { name: 'category', label: 'Category' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'content', label: 'Content', type: 'textarea' },
    { name: 'version', label: 'Version' },
    { name: 'status', label: 'Status' },
    { name: 'effective_date', label: 'Effective Date', type: 'date' },
    { name: 'review_date', label: 'Review Date', type: 'date' },
    { name: 'approved_by', label: 'Approved By' },
  ],
  incidents: [
    { name: 'title', label: 'Title' },
    { name: 'incident_type', label: 'Type' },
    { name: 'severity', label: 'Severity' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'reported_by', label: 'Reported By' },
    { name: 'reported_date', label: 'Reported Date', type: 'date' },
    { name: 'status', label: 'Status' },
    { name: 'affected_individuals', label: 'Affected Individuals', type: 'number' },
    { name: 'phi_involved', label: 'PHI Involved', type: 'checkbox' },
    { name: 'resolution', label: 'Resolution', type: 'textarea' },
  ],
  baas: [
    { name: 'associate_name', label: 'Associate Name' },
    { name: 'contact_email', label: 'Contact Email', type: 'email' },
    { name: 'agreement_type', label: 'Agreement Type' },
    { name: 'status', label: 'Status' },
    { name: 'effective_date', label: 'Effective Date', type: 'date' },
    { name: 'expiration_date', label: 'Expiration Date', type: 'date' },
    { name: 'phi_access_level', label: 'PHI Access Level' },
    { name: 'compliance_status', label: 'Compliance Status' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  'phi-inventory': [
    { name: 'data_type', label: 'Data Type' },
    { name: 'storage_location', label: 'Storage Location' },
    { name: 'system_name', label: 'System Name' },
    { name: 'department_id', label: 'Department ID', type: 'number' },
    { name: 'encryption_status', label: 'Encryption Status' },
    { name: 'access_level', label: 'Access Level' },
    { name: 'retention_period', label: 'Retention Period' },
    { name: 'risk_level', label: 'Risk Level' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  'risk-register': [
    { name: 'title', label: 'Title' },
    { name: 'category', label: 'Category' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'risk_level', label: 'Risk Level' },
    { name: 'likelihood', label: 'Likelihood (1-5)', type: 'number' },
    { name: 'impact', label: 'Impact (1-5)', type: 'number' },
    { name: 'mitigation_plan', label: 'Mitigation Plan', type: 'textarea' },
    { name: 'owner', label: 'Owner' },
    { name: 'status', label: 'Status' },
  ],
  'audit-logs': [
    { name: 'action', label: 'Action' },
    { name: 'entity_type', label: 'Entity Type' },
    { name: 'entity_id', label: 'Entity ID', type: 'number' },
    { name: 'user_email', label: 'User Email' },
    { name: 'details', label: 'Details', type: 'textarea' },
  ],
  deadlines: [
    { name: 'title', label: 'Title' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'category', label: 'Category' },
    { name: 'due_date', label: 'Due Date', type: 'date' },
    { name: 'assigned_to', label: 'Assigned To' },
    { name: 'status', label: 'Status' },
    { name: 'priority', label: 'Priority' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  sanctions: [
    { name: 'employee_name', label: 'Employee Name' },
    { name: 'violation_type', label: 'Violation Type' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'severity', label: 'Severity' },
    { name: 'sanction_type', label: 'Sanction Type' },
    { name: 'sanction_date', label: 'Sanction Date', type: 'date' },
    { name: 'status', label: 'Status' },
    { name: 'corrective_action', label: 'Corrective Action', type: 'textarea' },
    { name: 'imposed_by', label: 'Imposed By' },
  ],
  documents: [
    { name: 'title', label: 'Title' },
    { name: 'category', label: 'Category' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'file_type', label: 'File Type' },
    { name: 'version', label: 'Version' },
    { name: 'status', label: 'Status' },
    { name: 'uploaded_by', label: 'Uploaded By' },
    { name: 'upload_date', label: 'Upload Date', type: 'date' },
    { name: 'tags', label: 'Tags' },
  ],
  'access-control': [
    { name: 'employee_name', label: 'Employee Name' },
    { name: 'system_name', label: 'System Name' },
    { name: 'access_level', label: 'Access Level' },
    { name: 'phi_access', label: 'PHI Access', type: 'checkbox' },
    { name: 'granted_date', label: 'Granted Date', type: 'date' },
    { name: 'status', label: 'Status' },
    { name: 'approved_by', label: 'Approved By' },
    { name: 'justification', label: 'Justification', type: 'textarea' },
    { name: 'expiration_date', label: 'Expiration Date', type: 'date' },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════
   PER-FEATURE AI CONFIG (maps resource -> AI features)
   ═══════════════════════════════════════════════════════════════════════ */

const FEATURE_AI_MAP = {
  employees: [
    { label: 'Analyze Employee', aiPath: 'analyze-employee', prefill: (item) => ({ employeeName: `${item.first_name} ${item.last_name}`, jobTitle: item.job_title, department: item.department_name, trainingStatus: item.training_status }) },
    { label: 'Training Recommendation', aiPath: 'training-recommendation', prefill: (item) => ({ employeeRole: item.job_title, department: item.department_name }) },
  ],
  departments: [
    { label: 'Analyze Department', aiPath: 'analyze-department', prefill: (item) => ({ departmentName: item.name, headName: item.head_name, employeeCount: item.employee_count, complianceScore: item.compliance_score, riskLevel: item.risk_level }) },
    { label: 'Gap Analysis', aiPath: 'gap-analysis', prefill: (item) => ({ complianceAreas: `Department: ${item.name}, Score: ${item.compliance_score}` }) },
  ],
  courses: [
    { label: 'Generate Content', aiPath: 'generate-course-content', prefill: (item) => ({ courseTitle: item.title, category: item.category }) },
    { label: 'Generate Quiz', aiPath: 'generate-quiz', prefill: (item) => ({ topic: item.title }) },
  ],
  'training-records': [
    { label: 'Analyze Record', aiPath: 'analyze-training-records', prefill: (item) => ({ employeeName: item.employee_name, courseName: item.course_title, status: item.status, score: item.score }) },
    { label: 'Training Recommendation', aiPath: 'training-recommendation', prefill: (item) => ({ employeeRole: item.employee_name }) },
  ],
  assessments: [
    { label: 'Generate Assessment', aiPath: 'generate-assessment', prefill: (item) => ({ departmentName: item.department_name, assessmentType: item.title, previousScore: item.score }) },
    { label: 'Compliance Check', aiPath: 'check-compliance', prefill: (item) => ({ areasOfConcern: item.findings }) },
  ],
  policies: [
    { label: 'Validate Policy', aiPath: 'validate-policy', prefill: (item) => ({ policyTitle: item.title, category: item.category, version: item.version, content: item.description }) },
    { label: 'Generate Policy', aiPath: 'generate-policy', prefill: (item) => ({ policyType: item.category, department: 'Organization-wide' }) },
  ],
  incidents: [
    { label: 'Incident Response', aiPath: 'incident-response', prefill: (item) => ({ incidentType: item.incident_type, severity: item.severity, description: item.description }) },
    { label: 'Investigate Incident', aiPath: 'investigate-incident', prefill: (item) => ({ incidentTitle: item.title, incidentType: item.incident_type, severity: item.severity, description: item.description, affectedIndividuals: item.affected_individuals }) },
  ],
  baas: [
    { label: 'BAA Review', aiPath: 'baa-review', prefill: (item) => ({ associateName: item.associate_name, servicesProvided: item.notes }) },
    { label: 'Monitor BAA', aiPath: 'monitor-baa', prefill: (item) => ({ associateName: item.associate_name, agreementType: item.agreement_type, complianceStatus: item.compliance_status, expirationDate: item.expiration_date }) },
  ],
  'phi-inventory': [
    { label: 'Analyze PHI Risk', aiPath: 'analyze-phi-risk', prefill: (item) => ({ dataType: item.data_type, storageLocation: item.storage_location, systemName: item.system_name, encryptionStatus: item.encryption_status, accessLevel: item.access_level }) },
    { label: 'Security Assessment', aiPath: 'security-assessment', prefill: (item) => ({ systemDescription: `${item.system_name} - ${item.data_type}`, currentMeasures: `Encryption: ${item.encryption_status}, Access: ${item.access_level}` }) },
  ],
  'risk-register': [
    { label: 'Analyze Risk', aiPath: 'analyze-risk', prefill: (item) => ({ riskDescription: item.description, systemType: item.category, currentControls: item.mitigation_plan }) },
    { label: 'Mitigation Plan', aiPath: 'plan-risk-mitigation', prefill: (item) => ({ riskTitle: item.title, riskLevel: item.risk_level, category: item.category, description: item.description, currentControls: item.mitigation_plan }) },
  ],
  'audit-logs': [
    { label: 'Analyze Logs', aiPath: 'analyze-audit-logs', prefill: () => ({ timeframe: 'Last 30 days' }) },
    { label: 'Audit Report', aiPath: 'generate-audit-report', prefill: () => ({ auditScope: 'System activity audit', auditPeriod: 'Last 30 days' }) },
  ],
  deadlines: [
    { label: 'Prioritize Deadlines', aiPath: 'prioritize-deadlines', prefill: (item) => ({ deadlines: `${item.title} - Due: ${item.due_date} - Priority: ${item.priority} - Status: ${item.status}` }) },
    { label: 'Gap Analysis', aiPath: 'gap-analysis', prefill: (item) => ({ currentState: `Deadline: ${item.title}, Status: ${item.status}` }) },
  ],
  sanctions: [
    { label: 'Sanction Advisor', aiPath: 'recommend-sanction', prefill: (item) => ({ violationType: item.violation_type, description: item.description, severity: item.severity }) },
    { label: 'Training Recommendation', aiPath: 'training-recommendation', prefill: (item) => ({ employeeRole: item.employee_name, knowledgeGaps: item.violation_type }) },
  ],
  documents: [
    { label: 'Review Document', aiPath: 'review-document', prefill: (item) => ({ documentTitle: item.title, category: item.category, documentType: item.file_type, content: item.description }) },
    { label: 'Policy Validator', aiPath: 'validate-policy', prefill: (item) => ({ policyTitle: item.title, category: item.category, version: item.version }) },
  ],
  'access-control': [
    { label: 'Review Access', aiPath: 'review-access-control', prefill: (item) => ({ employeeName: item.employee_name, systemName: item.system_name, accessLevel: item.access_level, phiAccess: String(item.phi_access), justification: item.justification }) },
    { label: 'Security Assessment', aiPath: 'security-assessment', prefill: (item) => ({ systemDescription: `${item.system_name} access for ${item.employee_name}` }) },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════
   AI SLIDE PANEL (embedded in feature pages)
   ═══════════════════════════════════════════════════════════════════════ */

function AiSlidePanel({ aiPath, initialData, onClose }) {
  const config = AI_CONFIG[aiPath];
  const [form, setForm] = useState(initialData || {});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!config) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const fn = AI_FUNCTIONS[config.fn];
      if (!fn) throw new Error(`AI function "${config.fn}" not found`);
      const data = await fn(form);
      setResult(data);
    } catch (err) {
      toast.error(err.message || 'AI request failed');
    } finally { setLoading(false); }
  }

  const resultText = result
    ? (typeof result === 'string' ? result : result.result ?? result.output ?? result.content ?? JSON.stringify(result, null, 2))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="ml-auto relative w-full max-w-2xl bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-sky-400" />
            <h3 className="text-base font-bold text-white">{config.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded"><X size={18} /></button>
        </div>
        <p className="px-5 py-2 text-xs text-slate-400 border-b border-slate-800">{config.description}</p>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {config.samples && <SampleButtons samples={config.samples} onLoad={(data) => setForm(data)} />}
          <form onSubmit={handleSubmit} className="space-y-3">
            {config.fields.map(field => (
              <div key={field.name}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{field.label}</label>
                {field.type === 'resource_select' ? (
                  <ResourceSelect resource={field.resource} displayFn={field.displayFn} valueKey={field.valueKey} value={form[field.name] ?? ''} onChange={v => setForm(p => ({ ...p, [field.name]: v }))} placeholder={field.placeholder} />
                ) : field.type === 'textarea' ? (
                  <textarea rows={3} value={form[field.name] ?? ''} onChange={e => setForm(p => ({ ...p, [field.name]: e.target.value }))} placeholder={field.placeholder}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y" />
                ) : field.type === 'select' ? (
                  <select value={form[field.name] ?? ''} onChange={e => setForm(p => ({ ...p, [field.name]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="">Select...</option>
                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input type={field.type || 'text'} value={form[field.name] ?? ''} onChange={e => setForm(p => ({ ...p, [field.name]: e.target.value }))} placeholder={field.placeholder}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                )}
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
              ) : (
                <><Brain size={15} /> Generate with AI</>
              )}
            </button>
          </form>

          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-slate-500">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-sky-400 rounded-full animate-spin" />
              <p className="text-sm animate-pulse">AI is analyzing...</p>
            </div>
          )}

          {!loading && resultText && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300">AI Output</span>
                {result?.type && <span className="text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">{result.type}</span>}
              </div>
              <div className="ai-output" dangerouslySetInnerHTML={{ __html: formatAiOutput(resultText) }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE PAGE (CRUD with table, row click, detail, edit, delete, new, AI)
   ═══════════════════════════════════════════════════════════════════════ */

function FeaturePage({ resource, title, description }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [aiPanel, setAiPanel] = useState(null); // { aiPath, initialData }

  const fields = RESOURCE_FIELDS[resource] || [];
  const featureAiActions = FEATURE_AI_MAP[resource] || [];

  const load = useCallback((q = '') => {
    setLoading(true);
    fetchAll(resource, q)
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(err => { toast.error(err.message); setItems([]); })
      .finally(() => setLoading(false));
  }, [resource]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e) { e.preventDefault(); load(search); }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await deleteItem(resource, id);
      toast.success('Record deleted');
      setSelectedItem(null);
      load(search);
    } catch (err) { toast.error(err.message); }
  }

  function handleEdit(item) {
    setSelectedItem(null);
    setEditItem(item);
    setShowForm(true);
  }

  async function handleSave(formData) {
    if (editItem?.id) {
      await updateItem(resource, editItem.id, formData);
      toast.success('Record updated');
    } else {
      await createItem(resource, formData);
      toast.success('Record created');
    }
    setShowForm(false);
    setEditItem(null);
    load(search);
  }

  function handleNew() {
    setEditItem(null);
    setShowForm(true);
  }

  const columns = items.length > 0 ? Object.keys(items[0]).filter(k => k !== 'created_at').slice(0, 7) : [];

  const severityColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    minor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const statusColors = {
    active: 'bg-emerald-500/20 text-emerald-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    compliant: 'bg-emerald-500/20 text-emerald-400',
    open: 'bg-amber-500/20 text-amber-400',
    pending: 'bg-amber-500/20 text-amber-400',
    in_progress: 'bg-sky-500/20 text-sky-400',
    closed: 'bg-slate-500/20 text-slate-400',
    draft: 'bg-slate-500/20 text-slate-400',
    non_compliant: 'bg-red-500/20 text-red-400',
    expired: 'bg-red-500/20 text-red-400',
    overdue: 'bg-red-500/20 text-red-400',
  };

  function formatCell(key, val) {
    if (val === null || val === undefined) return <span className="text-slate-600">—</span>;
    if (typeof val === 'boolean') return <span className={val ? 'text-emerald-400 font-medium' : 'text-slate-500'}>{ val ? 'Yes' : 'No'}</span>;
    const strVal = String(val);
    if ((key === 'severity' || key === 'risk_level') && severityColors[strVal.toLowerCase()]) {
      return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${severityColors[strVal.toLowerCase()]}`}>{strVal}</span>;
    }
    if ((key === 'status' || key === 'training_status' || key === 'compliance_status') && statusColors[strVal.toLowerCase()]) {
      return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[strVal.toLowerCase()]}`}>{strVal}</span>;
    }
    if (strVal.length > 50) return strVal.slice(0, 50) + '...';
    return strVal;
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
        </div>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 w-44" />
            <button type="submit" className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm transition-colors">
              <Search size={16} />
            </button>
          </form>
          {featureAiActions.length > 0 && (
            <div className="flex gap-1">
              {featureAiActions.map(ai => (
                <button key={ai.aiPath} onClick={() => setAiPanel({ aiPath: ai.aiPath, initialData: {} })}
                  className="flex items-center gap-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/40 text-violet-400 px-3 py-2 rounded-lg text-xs font-medium transition-colors">
                  <Brain size={14} /> {ai.label}
                </button>
              ))}
            </div>
          )}
          {resource !== 'audit-logs' && (
            <button onClick={handleNew}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> New
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm animate-pulse">Loading {title.toLowerCase()}...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FolderOpen size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {columns.map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/50">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id ?? idx}
                    onClick={() => setSelectedItem(item)}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer">
                    {columns.map(col => (
                      <td key={col} className="px-4 py-3 text-slate-300">{formatCell(col, item[col])}</td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={e => { e.stopPropagation(); setSelectedItem(item); }}
                          className="text-slate-400 hover:text-sky-400 p-1 rounded transition-colors" title="View"><Eye size={15} /></button>
                        {featureAiActions.length > 0 && (
                          <button onClick={e => { e.stopPropagation(); const ai = featureAiActions[0]; setAiPanel({ aiPath: ai.aiPath, initialData: ai.prefill(item) }); }}
                            className="text-slate-400 hover:text-violet-400 p-1 rounded transition-colors" title="AI Analyze"><Brain size={15} /></button>
                        )}
                        {resource !== 'audit-logs' && (
                          <>
                            <button onClick={e => { e.stopPropagation(); handleEdit(item); }}
                              className="text-slate-400 hover:text-emerald-400 p-1 rounded transition-colors" title="Edit"><Edit3 size={15} /></button>
                            <button onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                              className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors" title="Delete"><Trash2 size={15} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onEdit={handleEdit} onDelete={handleDelete} resource={resource} onAi={setAiPanel} />
      )}

      {showForm && (
        <FormModal
          item={editItem}
          fields={fields}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSave={handleSave}
          title={editItem ? `Edit ${title.replace(/s$/, '')}` : `New ${title.replace(/s$/, '')}`}
        />
      )}

      {aiPanel && (
        <AiSlidePanel
          aiPath={aiPanel.aiPath}
          initialData={aiPanel.initialData}
          onClose={() => setAiPanel(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AI FEATURE PAGE
   ═══════════════════════════════════════════════════════════════════════ */

const AI_FUNCTIONS = {
  generatePolicy, generateQuiz, checkCompliance, analyzeRisk,
  incidentResponse, gapAnalysis, trainingRecommendation,
  generateAuditReport, securityAssessment, baaReview,
  analyzeEmployee, analyzeDepartment, generateCourseContent,
  analyzeTrainingRecords, generateAssessment, reviewDocument,
  analyzePhiRisk, reviewAccessControl, recommendSanction,
  prioritizeDeadlines, analyzeAuditLogs, monitorBaa,
  investigateIncident, planRiskMitigation, validatePolicy,
  // DB-context refactored
  analyzeEmployeeDeep, analyzeDepartmentDeep, autoEnrollTraining,
  detectAccessAnomalies, draftBaaRenewal, generateRemediation,
  // Audit-added
  vendorSecurityAssessment, breachSimulation,
  // Apply pass 5
  policyGapAnalysis, adaptiveTrainingPath, continuousComplianceNarrative,
};

/* ═══════════════════════════════════════════════════════════════════════════
   RESOURCE SELECT - dropdown that loads data from backend
   ═══════════════════════════════════════════════════════════════════════ */

function ResourceSelect({ resource, displayFn, valueKey, value, onChange, placeholder }) {
  const [options, setOptions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      fetchAll(resource).then(data => {
        // some endpoints return {data: [...]}, some return [...]
        const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setOptions(items);
      }).catch(() => setOptions([]));
      setLoaded(true);
    }
  }, [resource, loaded]);

  return (
    <select value={value ?? ''} onChange={e => {
      const v = e.target.value;
      // If a valueKey is set, coerce numeric IDs back to numbers
      if (valueKey && v !== '' && !isNaN(Number(v))) onChange(Number(v));
      else onChange(v);
    }}
      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent">
      <option value="">{placeholder || `Select from ${resource}...`}</option>
      {options.map(item => (
        <option key={item.id} value={valueKey ? item[valueKey] : displayFn(item)}>{displayFn(item)}</option>
      ))}
    </select>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SAMPLE BUTTONS - pre-fill AI forms with sample data
   ═══════════════════════════════════════════════════════════════════════ */

function SampleButtons({ samples, onLoad }) {
  if (!samples || samples.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Load Sample Data</p>
      <div className="flex flex-wrap gap-2">
        {samples.map((sample, i) => (
          <button key={i} type="button" onClick={() => onLoad(sample.data)}
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Sparkles size={12} /> {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* AI_CONFIG imported from ./aiConfig.js */

function formatAiOutput(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function AIFeaturePage({ feature }) {
  const config = AI_CONFIG[feature];
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!config) {
    return (
      <div className="p-6 text-center text-slate-400 animate-fade-in">
        <Brain size={40} className="mx-auto mb-3 opacity-30" />
        <p>Unknown AI feature: <code className="text-sky-400">{feature}</code></p>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const fn = AI_FUNCTIONS[config.fn];
      if (!fn) throw new Error(`AI function "${config.fn}" not found`);
      const data = await fn(form);
      setResult(data);
    } catch (err) {
      toast.error(err.message || 'AI request failed');
    } finally { setLoading(false); }
  }

  const resultText = result
    ? (typeof result === 'string' ? result : result.result ?? result.output ?? result.content ?? JSON.stringify(result, null, 2))
    : null;

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Brain size={18} className="text-sky-400" />
          <h2 className="text-xl font-bold text-white">{config.title}</h2>
        </div>
        <p className="text-sm text-slate-400">{config.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Input Parameters</h3>
          {config.samples && <div className="mb-4"><SampleButtons samples={config.samples} onLoad={(data) => setForm(data)} /></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {config.fields.map(field => (
              <div key={field.name}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{field.label}</label>
                {field.type === 'resource_select' ? (
                  <ResourceSelect resource={field.resource} displayFn={field.displayFn} valueKey={field.valueKey} value={form[field.name] ?? ''} onChange={v => setForm(p => ({ ...p, [field.name]: v }))} placeholder={field.placeholder} />
                ) : field.type === 'textarea' ? (
                  <textarea rows={4} value={form[field.name] ?? ''} onChange={e => setForm(p => ({ ...p, [field.name]: e.target.value }))} placeholder={field.placeholder}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-y" />
                ) : field.type === 'select' ? (
                  <select value={form[field.name] ?? ''} onChange={e => setForm(p => ({ ...p, [field.name]: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent">
                    <option value="">Select...</option>
                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input type={field.type || 'text'} value={form[field.name] ?? ''} onChange={e => setForm(p => ({ ...p, [field.name]: e.target.value }))} placeholder={field.placeholder}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
                )}
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-md shadow-sky-900/40 mt-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
              ) : (
                <><Brain size={15} /> Generate with AI</>
              )}
            </button>
          </form>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">AI Output</h3>
            {result && <span className="text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">{result.type || 'result'}</span>}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
                <div className="w-8 h-8 border-2 border-slate-600 border-t-sky-400 rounded-full animate-spin" />
                <p className="text-sm animate-pulse">AI is analyzing...</p>
              </div>
            )}
            {!loading && !resultText && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-600">
                <Brain size={32} className="mb-2 opacity-30" />
                <p className="text-sm">Output will appear here</p>
              </div>
            )}
            {!loading && resultText && (
              <div className="ai-output animate-fade-in" dangerouslySetInnerHTML={{ __html: formatAiOutput(resultText) }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NEW PAGES (BAA renewals, Reminders, Quiz Analytics, AI History)
   ═══════════════════════════════════════════════════════════════════════ */

function BaaRenewalsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draftFor, setDraftFor] = useState(null);
  const [draft, setDraft] = useState(null);
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    fetchBaaRenewals().then(d => setItems(d.data || [])).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  async function handleDraft(baaId) {
    setDraftFor(baaId); setDrafting(true); setDraft(null);
    try {
      const r = await draftBaaRenewal({ baaId });
      setDraft(r.draft);
    } catch (e) { toast.error(e.message); }
    finally { setDrafting(false); }
  }

  const statusColor = (s) => ({
    expired: 'bg-red-500/10 text-red-400 border-red-500/40',
    urgent: 'bg-orange-500/10 text-orange-400 border-orange-500/40',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
    upcoming: 'bg-sky-500/10 text-sky-400 border-sky-500/40',
    ok: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40',
  }[s] || 'bg-slate-500/10 text-slate-400 border-slate-500/40');

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">BAA Renewals</h2>
        <p className="text-sm text-slate-400 mt-1">Business Associate Agreements expiring within 90 days</p>
      </div>
      {loading ? <div className="text-slate-400">Loading…</div> : items.length === 0 ? (
        <div className="text-slate-500 py-12 text-center">No BAAs require renewal in the next 90 days.</div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {items.map(b => (
            <div key={b.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-base font-semibold text-white">{b.associate_name || b.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{b.services_provided || '—'}</p>
                </div>
                <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${statusColor(b.renewal_status)}`}>{b.renewal_status}</span>
              </div>
              <div className="text-xs text-slate-400 space-y-0.5 mb-3">
                <div>Expires: <span className="text-slate-200">{b.expiration_date}</span></div>
                <div>Days until expiry: <span className="text-slate-200">{b.days_until_expiry}</span></div>
              </div>
              <button onClick={() => handleDraft(b.id)} disabled={drafting && draftFor === b.id}
                className="flex items-center gap-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/40 text-violet-400 text-xs font-medium px-3 py-1.5 rounded-lg">
                <Brain size={13} /> {drafting && draftFor === b.id ? 'Drafting…' : 'Draft AI Renewal'}
              </button>
            </div>
          ))}
        </div>
      )}
      {draft && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDraft(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">AI-Drafted Renewal BAA</h3>
              <button onClick={() => setDraft(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <pre className="text-xs text-slate-200 whitespace-pre-wrap font-mono">{draft}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function RemindersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchReminders().then(d => setItems(d.data || [])).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function ack(id) {
    try { await acknowledgeReminder(id); load(); toast.success('Acknowledged'); }
    catch (e) { toast.error(e.message); }
  }

  async function runJob() {
    setRunning(true);
    try { const r = await runReminderJob(); toast.success(`Scan: ${r.overdue_deadlines} overdue, ${r.expiring_certifications} certs, ${r.expiring_baas} BAAs`); load(); }
    catch (e) { toast.error(e.message); } finally { setRunning(false); }
  }

  const sevColor = (s) => ({ high: 'bg-red-500/10 text-red-400 border-red-500/40', critical: 'bg-red-700/20 text-red-300 border-red-700/50', medium: 'bg-amber-500/10 text-amber-400 border-amber-500/40', low: 'bg-sky-500/10 text-sky-400 border-sky-500/40' }[s] || 'bg-slate-500/10 text-slate-400 border-slate-500/40');

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-white">Reminders</h2>
          <p className="text-sm text-slate-400 mt-1">Auto-scanned alerts for deadlines, certifications, and BAAs</p>
        </div>
        <button onClick={runJob} disabled={running} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium px-3 py-2 rounded-lg">
          <Activity size={13} /> {running ? 'Scanning…' : 'Run Scan Now'}
        </button>
      </div>
      {loading ? <div className="text-slate-400">Loading…</div> : items.length === 0 ? (
        <div className="text-slate-500 py-12 text-center">All clear — no active reminders.</div>
      ) : (
        <div className="space-y-2">
          {items.map(r => (
            <div key={r.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${sevColor(r.severity)}`}>{r.severity}</span>
                <span className="text-xs text-slate-500 uppercase">{r.type}</span>
                <span className="text-sm text-slate-200 truncate">{r.message}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                <button onClick={() => ack(r.id)} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded-md">Acknowledge</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuizAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchQuizAnalytics().then(setStats).catch(e => toast.error(e.message)).finally(() => setLoading(false)); }, []);

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Quiz Analytics</h2>
        <p className="text-sm text-slate-400 mt-1">Pass rates by topic — drives the AI remediation generator</p>
      </div>
      {loading ? <div className="text-slate-400">Loading…</div> : !stats ? <div className="text-slate-400">No data</div> : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total Attempts</p>
              <p className="text-3xl font-bold text-white">{stats.overall.attempts}</p>
            </div>
            <div className="bg-slate-800 border border-emerald-700/40 rounded-xl p-4">
              <p className="text-xs text-emerald-400 uppercase tracking-wider">Correct</p>
              <p className="text-3xl font-bold text-white">{stats.overall.correct}</p>
            </div>
            <div className="bg-slate-800 border border-sky-700/40 rounded-xl p-4">
              <p className="text-xs text-sky-400 uppercase tracking-wider">Pass Rate</p>
              <p className="text-3xl font-bold text-white">{stats.overall.pass_rate}%</p>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-slate-700 text-sm font-semibold text-slate-300">By Topic</div>
            <div className="divide-y divide-slate-700">
              {(stats.by_topic || []).length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No quiz attempts logged yet. Use POST /api/ai/log-quiz-attempt to record results.</div>
              ) : stats.by_topic.map(t => (
                <div key={t.topic} className="px-4 py-2 flex items-center justify-between text-sm">
                  <span className="text-slate-200">{t.topic || '—'}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{t.correct}/{t.attempts}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${parseFloat(t.pass_rate) >= 80 ? 'bg-emerald-500/10 text-emerald-400' : parseFloat(t.pass_rate) >= 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{t.pass_rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AiHistoryPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchAiResults(page).then(d => { setItems(d.data || []); setTotal(d.total || 0); }).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">AI History</h2>
        <p className="text-sm text-slate-400 mt-1">All AI tool invocations for your account ({total} total)</p>
      </div>
      {loading ? <div className="text-slate-400">Loading…</div> : (
        <>
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr><th className="text-left px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">Tool</th><th className="text-left px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">When</th><th></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {items.map(r => (
                  <tr key={r.id} className="hover:bg-slate-700/30">
                    <td className="px-3 py-2 text-slate-200">{r.tool_name}</td>
                    <td className="px-3 py-2 text-slate-400 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right"><button onClick={() => setSelected(r)} className="text-xs text-sky-400 hover:text-sky-300">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex justify-between items-center text-xs text-slate-500">
            <span>Page {page} / {totalPages || 1}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded disabled:opacity-50">Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{selected.tool_name}</h3>
                <p className="text-xs text-slate-400">{new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <p className="text-xs font-medium text-slate-400 uppercase mb-1">Input</p>
            <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded mb-3 overflow-x-auto">{JSON.stringify(selected.input_snapshot, null, 2)}</pre>
            <p className="text-xs font-medium text-slate-400 uppercase mb-1">Result</p>
            <pre className="text-xs text-slate-200 bg-slate-900 p-3 rounded whitespace-pre-wrap overflow-x-auto">{selected.result}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LAYOUT
   ═══════════════════════════════════════════════════════════════════════ */

function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-900">
      <div className="hidden md:flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════════════ */

function AIFeaturePageWrapper() {
  const { feature } = useParams();
  return <AppLayout><AIFeaturePage feature={feature} /></AppLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', fontSize: '13px' },
        success: { iconTheme: { primary: '#38bdf8', secondary: '#0f172a' } },
        error: { iconTheme: { primary: '#f87171', secondary: '#0f172a' } },
      }} />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        {[
          { path: '/employees', resource: 'employees', title: 'Employees', description: 'Manage employee records and training status' },
          { path: '/departments', resource: 'departments', title: 'Departments', description: 'Organizational departments and compliance scores' },
          { path: '/courses', resource: 'courses', title: 'Training Courses', description: 'HIPAA training course catalog' },
          { path: '/training-records', resource: 'training-records', title: 'Training Records', description: 'Employee training completion records' },
          { path: '/assessments', resource: 'assessments', title: 'Compliance Assessments', description: 'Compliance assessment results' },
          { path: '/policies', resource: 'policies', title: 'Policies', description: 'Organizational HIPAA policies' },
          { path: '/incidents', resource: 'incidents', title: 'Incident Reports', description: 'Security and privacy incident log' },
          { path: '/baas', resource: 'baas', title: 'Business Associate Agreements', description: 'BAA management and tracking' },
          { path: '/phi-inventory', resource: 'phi-inventory', title: 'PHI Inventory', description: 'Protected Health Information inventory' },
          { path: '/risk-register', resource: 'risk-register', title: 'Risk Register', description: 'Identified risks and mitigations' },
          { path: '/audit-logs', resource: 'audit-logs', title: 'Audit Logs', description: 'System activity audit trail' },
          { path: '/deadlines', resource: 'deadlines', title: 'Compliance Deadlines', description: 'Upcoming compliance milestones' },
          { path: '/sanctions', resource: 'sanctions', title: 'Sanctions', description: 'Disciplinary action records' },
          { path: '/documents', resource: 'documents', title: 'Documents', description: 'Compliance document repository' },
          { path: '/access-control', resource: 'access-control', title: 'Access Control', description: 'User access rights and permissions' },
        ].map(({ path, resource, title, description }) => (
          <Route key={path} path={path} element={
            <ProtectedRoute><AppLayout><FeaturePage resource={resource} title={title} description={description} /></AppLayout></ProtectedRoute>
          } />
        ))}
        <Route path="/ai/:feature" element={<ProtectedRoute><AIFeaturePageWrapper /></ProtectedRoute>} />
        <Route path="/baa-renewals" element={<ProtectedRoute><AppLayout><BaaRenewalsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/reminders" element={<ProtectedRoute><AppLayout><RemindersPage /></AppLayout></ProtectedRoute>} />
        <Route path="/quiz-analytics" element={<ProtectedRoute><AppLayout><QuizAnalyticsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/ai-history" element={<ProtectedRoute><AppLayout><AiHistoryPage /></AppLayout></ProtectedRoute>} />
          {/* // === Batch 04 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-compliance-auditor-continuously-" element={<CfAgenticComplianceAuditorContinuously />} />
          <Route path="/cf-breach-simulation-gamified-exercises-sco" element={<CfBreachSimulationGamifiedExercisesSco />} />
          <Route path="/cf-adaptive-workforce-training-with-role-ba" element={<CfAdaptiveWorkforceTrainingWithRoleBa />} />
          <Route path="/cf-real-time-access-monitoring-flagging-bul" element={<CfRealTimeAccessMonitoringFlaggingBul />} />
          <Route path="/cf-vendor-risk-management-ingesting-soc-2" element={<CfVendorRiskManagementIngestingSoc2 />} />
          <Route path="/cf-ocr-policy-automation-extracting-require" element={<CfOcrPolicyAutomationExtractingRequire />} />
          <Route path="/gap-limited-vendor-security-assessment-depth" element={<GapLimitedVendorSecurityAssessmentDepth />} />
          <Route path="/gap-no-breach-simulation-tabletop-endpoint" element={<GapNoBreachSimulationTabletopEndpoint />} />
          <Route path="/gap-no-insider-threat-behavior-baseline-drif" element={<GapNoInsiderThreatBehaviorBaselineDrif />} />
          <Route path="/gap-no-user-facing-dashboard-backend-api" element={<GapNoUserFacingDashboardBackendApi />} />
          <Route path="/gap-no-real-time-phi-streaming-monitor" element={<GapNoRealTimePhiStreamingMonitor />} />
          <Route path="/gap-no-ehr-system-integration" element={<GapNoEhrSystemIntegration />} />
          <Route path="/gap-no-external-regulator-communication-work" element={<GapNoExternalRegulatorCommunicationWork />} />
          <Route path="/gap-no-webhook-surface-for-siem-integration" element={<GapNoWebhookSurfaceForSiemIntegration />} />
          <Route path="/gap-no-multi-tenant-covered-entity-isolation" element={<GapNoMultiTenantCoveredEntityIsolation />} />
          <Route path="/custom-views" element={<ProtectedRoute><AppLayout><CustomViewsPage /></AppLayout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
