import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

const API = '/api/governed-training';

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function govFetch(path, { method = 'GET', body, tenantId, idemKey } = {}) {
  const token = localStorage.getItem('token');
  return fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Tenant-Id': tenantId,
      ...(idemKey ? { 'Idempotency-Key': idemKey } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || data.error || `Request failed (${res.status})`);
      err.code = data.error;
      throw err;
    }
    return data;
  });
}

const STATE_STYLES = {
  assigned: 'bg-slate-500/10 text-slate-300 border-slate-500/40',
  content_verified: 'bg-sky-500/10 text-sky-400 border-sky-500/40',
  in_progress: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/40',
  assessed: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
  attested: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40',
  remediation: 'bg-orange-500/10 text-orange-400 border-orange-500/40',
  compliance_review: 'bg-purple-500/10 text-purple-400 border-purple-500/40',
  closed: 'bg-slate-700/30 text-slate-400 border-slate-600/40',
};

function Badge({ state }) {
  return (
    <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${STATE_STYLES[state] || STATE_STYLES.assigned}`}>
      {state}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500';
const btnCls = 'bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-lg';

export default function GovernedTrainingPage() {
  const [tenantId, setTenantId] = useState(() => localStorage.getItem('govTenantId') || 'default');
  const [policy, setPolicy] = useState(null);
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null); // case detail (with evidence)
  const [history, setHistory] = useState([]);
  const [membershipError, setMembershipError] = useState('');
  const [loading, setLoading] = useState(true);

  // create-case form
  const [form, setForm] = useState({ subjectRef: '', policyVersion: '', effectiveAt: '', retentionUntil: '' });
  // evidence form
  const [ev, setEv] = useState({ kind: '', sourceRef: '', sourceVersion: '', capturedAt: '', consentBasis: '', content: '' });
  // assessment form
  const [assess, setAssess] = useState({ roleVersion: '', contentVersion: '', assessmentScore: '', passingScore: '', accessibilityStatus: 'verified', policyVersion: '' });
  // transition form
  const [tx, setTx] = useState({ action: '', reason: '' });
  const [busy, setBusy] = useState(false);

  const handleError = useCallback((e) => {
    if (e.code === 'TENANT_MEMBERSHIP_REQUIRED') {
      setMembershipError(
        `No governed_tenant_memberships row exists for your user in tenant "${tenantId}". ` +
        `Provision one via an administrator-controlled process, e.g.: ` +
        `INSERT INTO governed_tenant_memberships (tenant_id, actor_id, role, granted_by) VALUES ('${tenantId}', '<your-user-id>', 'training_admin', 'admin');`
      );
    } else {
      toast.error(e.message);
    }
  }, [tenantId]);

  const loadCases = useCallback(() => {
    setLoading(true);
    setMembershipError('');
    Promise.all([
      govFetch('/policy', { tenantId }),
      govFetch('/cases', { tenantId }),
    ])
      .then(([p, c]) => { setPolicy(p); setCases(c); })
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [tenantId, handleError]);

  useEffect(() => {
    localStorage.setItem('govTenantId', tenantId);
    setSelected(null);
    loadCases();
  }, [tenantId, loadCases]);

  const openCase = useCallback((id) => {
    Promise.all([
      govFetch(`/cases/${id}`, { tenantId }),
      govFetch(`/cases/${id}/history`, { tenantId }),
    ])
      .then(([detail, events]) => {
        setSelected(detail);
        setHistory(events);
        setAssess((a) => ({ ...a, policyVersion: detail.policy_version }));
        setTx({ action: '', reason: '' });
      })
      .catch(handleError);
  }, [tenantId, handleError]);

  async function createCase(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        subjectRef: form.subjectRef.trim(),
        policyVersion: form.policyVersion.trim(),
        effectiveAt: new Date(form.effectiveAt).toISOString(),
        ...(form.retentionUntil ? { retentionUntil: new Date(form.retentionUntil).toISOString() } : {}),
      };
      const created = await govFetch('/cases', { method: 'POST', body, tenantId, idemKey: crypto.randomUUID() });
      toast.success(`Case created (${created.state})`);
      setForm({ subjectRef: '', policyVersion: '', effectiveAt: '', retentionUntil: '' });
      loadCases();
    } catch (err2) { handleError(err2); } finally { setBusy(false); }
  }

  async function addEvidence(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const digest = await sha256Hex(ev.content);
      const body = {
        kind: ev.kind,
        sourceRef: ev.sourceRef.trim(),
        sourceVersion: ev.sourceVersion.trim(),
        sha256: digest,
        capturedAt: new Date(ev.capturedAt).toISOString(),
        ...(ev.consentBasis.trim() ? { consentBasis: ev.consentBasis.trim() } : {}),
      };
      await govFetch(`/cases/${selected.id}/evidence`, { method: 'POST', body, tenantId, idemKey: crypto.randomUUID() });
      toast.success('Evidence attached (digest only)');
      setEv({ kind: '', sourceRef: '', sourceVersion: '', capturedAt: '', consentBasis: '', content: '' });
      openCase(selected.id);
    } catch (err2) { handleError(err2); } finally { setBusy(false); }
  }

  async function runAssessment(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        roleVersion: assess.roleVersion.trim(),
        contentVersion: assess.contentVersion.trim(),
        assessmentScore: Number(assess.assessmentScore),
        passingScore: Number(assess.passingScore),
        accessibilityStatus: assess.accessibilityStatus,
        policyVersion: assess.policyVersion.trim(),
      };
      const result = await govFetch(`/cases/${selected.id}/assess`, { method: 'POST', body, tenantId, idemKey: crypto.randomUUID() });
      toast.success(`Triage: ${result.disposition} (human review still required)`);
      openCase(selected.id);
    } catch (err2) { handleError(err2); } finally { setBusy(false); }
  }

  async function runTransition(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { action: tx.action, reason: tx.reason.trim(), expectedVersion: selected.version };
      const result = await govFetch(`/cases/${selected.id}/transitions`, { method: 'POST', body, tenantId, idemKey: crypto.randomUUID() });
      toast.success(`Transitioned to ${result.state}`);
      setTx({ action: '', reason: '' });
      openCase(selected.id);
      loadCases();
    } catch (err2) { handleError(err2); } finally { setBusy(false); }
  }

  const availableActions = useMemo(() => {
    if (!policy || !selected) return [];
    return policy.transitions.filter((t) => t.from === selected.state);
  }, [policy, selected]);

  if (membershipError) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-2">Governed Training</h2>
        <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 rounded-xl p-4 text-sm whitespace-pre-wrap">{membershipError}</div>
        <button onClick={() => setMembershipError('')} className={`${btnCls} mt-4`}>Back</button>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-4 flex justify-between items-start flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Governed Training Workflow</h2>
          <p className="text-sm text-slate-400 mt-1">
            Role-based curriculum cases with verified evidence, dual control, and immutable audit history.
            Administrative support only — not legal advice.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Tenant</span>
          <input value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={`${inputCls} w-40`} />
        </div>
      </div>

      {loading ? <div className="text-slate-400">Loading…</div> : !selected ? (
        <>
          <form onSubmit={createCase} className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-5 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <Field label="Subject ref (opaque)">
              <input required pattern="[A-Za-z0-9][A-Za-z0-9._:-]*" title="Opaque reference, not personal data" value={form.subjectRef} onChange={(e) => setForm({ ...form, subjectRef: e.target.value })} placeholder="emp-12345" className={inputCls} />
            </Field>
            <Field label="Policy version">
              <input required value={form.policyVersion} onChange={(e) => setForm({ ...form, policyVersion: e.target.value })} placeholder="policy-2026.07" className={inputCls} />
            </Field>
            <Field label="Effective at">
              <input required type="datetime-local" value={form.effectiveAt} onChange={(e) => setForm({ ...form, effectiveAt: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Retention until (optional)">
              <input type="datetime-local" value={form.retentionUntil} onChange={(e) => setForm({ ...form, retentionUntil: e.target.value })} className={inputCls} />
            </Field>
            <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Creating…' : 'Create case'}</button>
          </form>

          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Policy</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} onClick={() => openCase(c.id)} className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer">
                    <td className="px-4 py-3 text-slate-200">{c.subject_ref}</td>
                    <td className="px-4 py-3"><Badge state={c.state} /></td>
                    <td className="px-4 py-3 text-slate-400">{c.policy_version}</td>
                    <td className="px-4 py-3 text-slate-400">v{c.version}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(c.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
                {cases.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500">No cases yet — create one above.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div>
          <button onClick={() => setSelected(null)} className="text-sky-400 text-sm mb-4 hover:underline">← All cases</button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selected.subject_ref}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{selected.case_type} · policy {selected.policy_version} · v{selected.version}</p>
                  </div>
                  <Badge state={selected.state} />
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Effective {new Date(selected.effective_at).toLocaleString()}
                  {selected.retention_until && <> · retained until {new Date(selected.retention_until).toLocaleDateString()}</>}
                </p>
              </div>

              <form onSubmit={runTransition} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-white">Transition</h4>
                {availableActions.length === 0 ? (
                  <p className="text-xs text-slate-500">No transitions available from {selected.state}.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {availableActions.map((t) => (
                        <button key={t.action} type="button" onClick={() => setTx({ ...tx, action: t.action })}
                          className={`text-xs px-3 py-1.5 rounded-lg border ${tx.action === t.action ? 'bg-sky-600 border-sky-500 text-white' : 'border-slate-600 text-slate-300 hover:border-slate-500'}`}>
                          {t.action}{t.dualControl ? ' ⚭' : ''}
                        </button>
                      ))}
                    </div>
                    {tx.action && (
                      <>
                        <p className="text-xs text-slate-500">
                          → {availableActions.find((t) => t.action === tx.action)?.to}
                          {availableActions.find((t) => t.action === tx.action)?.dualControl && ' · requires a second person (dual control)'}
                          {' '}· roles: {availableActions.find((t) => t.action === tx.action)?.roles.join(', ')}
                        </p>
                        <textarea required minLength={8} maxLength={2000} value={tx.reason} onChange={(e) => setTx({ ...tx, reason: e.target.value })}
                          placeholder="Decision reason (8–2000 characters)" className={`${inputCls} min-h-[60px]`} />
                        <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Applying…' : `Apply ${tx.action}`}</button>
                      </>
                    )}
                  </>
                )}
              </form>

              <form onSubmit={runAssessment} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-white">Deterministic triage <span className="text-xs font-normal text-slate-500">(never a final decision)</span></h4>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Role version"><input required value={assess.roleVersion} onChange={(e) => setAssess({ ...assess, roleVersion: e.target.value })} className={inputCls} /></Field>
                  <Field label="Content version"><input required value={assess.contentVersion} onChange={(e) => setAssess({ ...assess, contentVersion: e.target.value })} className={inputCls} /></Field>
                  <Field label="Score (0–100)"><input required type="number" min="0" max="100" value={assess.assessmentScore} onChange={(e) => setAssess({ ...assess, assessmentScore: e.target.value })} className={inputCls} /></Field>
                  <Field label="Passing score"><input required type="number" min="0" max="100" value={assess.passingScore} onChange={(e) => setAssess({ ...assess, passingScore: e.target.value })} className={inputCls} /></Field>
                  <Field label="Accessibility status">
                    <select value={assess.accessibilityStatus} onChange={(e) => setAssess({ ...assess, accessibilityStatus: e.target.value })} className={inputCls}>
                      <option value="verified">verified</option>
                      <option value="pending">pending</option>
                      <option value="failed">failed</option>
                    </select>
                  </Field>
                  <Field label="Policy version"><input required value={assess.policyVersion} onChange={(e) => setAssess({ ...assess, policyVersion: e.target.value })} className={inputCls} /></Field>
                </div>
                <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Running…' : 'Run triage'}</button>
              </form>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-white mb-3">Evidence ({selected.evidence?.length || 0})</h4>
                <div className="space-y-2 mb-4">
                  {(selected.evidence || []).map((item) => (
                    <div key={item.id} className="border border-slate-700 rounded-lg p-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-200 font-medium">{item.kind}</span>
                        <span className="text-slate-500">{new Date(item.captured_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-400 mt-1">{item.source_ref} · v{item.source_version}</p>
                      <p className="text-slate-600 font-mono truncate" title={item.sha256}>sha256 {item.sha256}</p>
                    </div>
                  ))}
                  {(selected.evidence || []).length === 0 && <p className="text-xs text-slate-500">No evidence attached. Transitions require at least one evidence record.</p>}
                </div>
                <form onSubmit={addEvidence} className="space-y-3 border-t border-slate-700 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Kind">
                      <select required value={ev.kind} onChange={(e) => setEv({ ...ev, kind: e.target.value })} className={inputCls}>
                        <option value="">Select…</option>
                        {(policy?.evidenceKinds || []).map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </Field>
                    <Field label="Source version"><input required value={ev.sourceVersion} onChange={(e) => setEv({ ...ev, sourceVersion: e.target.value })} placeholder="v1.4" className={inputCls} /></Field>
                    <Field label="Source ref (opaque)"><input required value={ev.sourceRef} onChange={(e) => setEv({ ...ev, sourceRef: e.target.value })} placeholder="vault://records/abc" className={inputCls} /></Field>
                    <Field label="Captured at"><input required type="datetime-local" value={ev.capturedAt} onChange={(e) => setEv({ ...ev, capturedAt: e.target.value })} className={inputCls} /></Field>
                    <Field label="Consent basis (optional)"><input value={ev.consentBasis} onChange={(e) => setEv({ ...ev, consentBasis: e.target.value })} className={inputCls} /></Field>
                  </div>
                  <Field label="Content to digest (hashed locally; only the SHA-256 digest is sent)">
                    <textarea required value={ev.content} onChange={(e) => setEv({ ...ev, content: e.target.value })} className={`${inputCls} min-h-[60px]`} placeholder="Paste the evidence text — it never leaves your browser, only its digest is stored." />
                  </Field>
                  <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Attaching…' : 'Attach evidence'}</button>
                </form>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-white mb-3">History</h4>
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="text-xs border-l-2 border-slate-600 pl-3 py-1">
                      <span className="text-slate-300 font-medium">{h.action}</span>
                      {h.from_state !== h.to_state && <span className="text-slate-400"> · {h.from_state} → {h.to_state}</span>}
                      <span className="text-slate-500"> · {h.actor_role} · {new Date(h.created_at).toLocaleString()}</span>
                      {h.reason && <p className="text-slate-500 mt-0.5">{h.reason}</p>}
                      {h.details?.disposition && <p className="text-slate-500 mt-0.5">triage: {h.details.disposition}</p>}
                    </div>
                  ))}
                  {history.length === 0 && <p className="text-xs text-slate-500">No events yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
