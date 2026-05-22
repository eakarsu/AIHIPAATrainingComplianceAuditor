import React, { useEffect, useState } from 'react';

const EMPTY = {
  module_name: '',
  category: 'Privacy',
  frequency_months: 12,
  passing_threshold: 80,
  mandatory: true,
  applies_to_role: 'all',
  notes: '',
};

function authHeaders() {
  const t = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

export default function TrainingRulesEditor() {
  const [rules, setRules]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [form, setForm]     = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/custom-views/training-rules', { headers: authHeaders() });
      const j   = await res.json();
      if (!res.ok) throw new Error(j.error || 'load failed');
      setRules(j.rules || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.module_name?.trim()) { setError('module_name required'); return; }
    setSaving(true);
    setError('');
    try {
      const url    = editingId
        ? `/api/custom-views/training-rules/${editingId}`
        : `/api/custom-views/training-rules`;
      const method = editingId ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'save failed');
      setForm(EMPTY);
      setEditingId(null);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this rule?')) return;
    try {
      const res = await fetch(`/api/custom-views/training-rules/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'delete failed');
      }
      await refresh();
    } catch (e) { setError(e.message); }
  }

  function startEdit(r) {
    setForm({
      module_name:       r.module_name,
      category:          r.category,
      frequency_months:  r.frequency_months,
      passing_threshold: r.passing_threshold,
      mandatory:         r.mandatory,
      applies_to_role:   r.applies_to_role,
      notes:             r.notes || '',
    });
    setEditingId(r.id);
  }

  function cancelEdit() {
    setForm(EMPTY);
    setEditingId(null);
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
      <h3 className="text-base font-semibold text-white mb-1">Training &amp; Compliance Rules Editor</h3>
      <p className="text-xs text-slate-400 mb-4">
        Define mandatory HIPAA training modules, retraining frequency (months),
        and minimum passing thresholds per role.
      </p>

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 bg-slate-900/50 p-3 rounded">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Module Name *</label>
          <input
            value={form.module_name}
            onChange={e => setForm({ ...form, module_name: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
            placeholder="e.g. HIPAA Security Rule Fundamentals"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Category</label>
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
          >
            {['Privacy', 'Security', 'Breach', 'Compliance', 'General'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Frequency (months)</label>
          <input type="number" min="1" max="60"
            value={form.frequency_months}
            onChange={e => setForm({ ...form, frequency_months: +e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Passing Threshold (%)</label>
          <input type="number" min="50" max="100"
            value={form.passing_threshold}
            onChange={e => setForm({ ...form, passing_threshold: +e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Applies To Role</label>
          <input
            value={form.applies_to_role}
            onChange={e => setForm({ ...form, applies_to_role: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
            placeholder="all | clinical | it | compliance"
          />
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={form.mandatory}
              onChange={e => setForm({ ...form, mandatory: e.target.checked })}
            />
            Mandatory
          </label>
        </div>
        <div className="md:col-span-2">
          <label className="block text-[11px] text-slate-400 mb-1">Notes</label>
          <textarea rows="2"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
          />
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={saving}
            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium disabled:opacity-60">
            {saving ? 'Saving…' : (editingId ? 'Update Rule' : 'Add Rule')}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit}
              className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs">
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="text-[11px] text-rose-400 mb-2">Error: {error}</p>}

      <div className="overflow-auto border border-slate-700 rounded">
        <table className="min-w-full text-[11px]">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left p-2">Module</th>
              <th className="text-left p-2">Category</th>
              <th className="text-right p-2">Frequency</th>
              <th className="text-right p-2">Pass %</th>
              <th className="text-left p-2">Role</th>
              <th className="text-center p-2">Mandatory</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="7" className="p-3 text-slate-500 text-center">Loading…</td></tr>}
            {!loading && rules.length === 0 && (
              <tr><td colSpan="7" className="p-3 text-slate-500 text-center">No rules yet.</td></tr>
            )}
            {rules.map(r => (
              <tr key={r.id} className="border-t border-slate-800">
                <td className="p-2 text-white">{r.module_name}</td>
                <td className="p-2 text-slate-300">{r.category}</td>
                <td className="p-2 text-right text-slate-300">{r.frequency_months} mo</td>
                <td className="p-2 text-right text-slate-300">{r.passing_threshold}%</td>
                <td className="p-2 text-slate-300">{r.applies_to_role}</td>
                <td className="p-2 text-center">
                  {r.mandatory
                    ? <span className="text-emerald-400">yes</span>
                    : <span className="text-slate-500">no</span>}
                </td>
                <td className="p-2 text-right">
                  <button onClick={() => startEdit(r)}
                    className="text-sky-400 hover:text-sky-300 text-[11px] mr-2">Edit</button>
                  <button onClick={() => remove(r.id)}
                    className="text-rose-400 hover:text-rose-300 text-[11px]">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
