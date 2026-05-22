import React, { useEffect, useState } from 'react';

export default function TrainingCompletionChart() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/training-completion', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j.error || 'request failed');
        setData(j);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-slate-400 text-sm">Loading training completion data…</div>;
  if (error)   return <div className="p-4 text-rose-400 text-sm">Error: {error}</div>;
  if (!data)   return null;

  const summary = data.department_summary || [];
  const maxVal = Math.max(100, ...summary.map(s => s.completion_rate || 0));

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">Training Completion Rate</h3>
          <p className="text-xs text-slate-400">By department, aggregated across all HIPAA modules</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>Records: <span className="text-white">{data.overall?.total_records ?? 0}</span></div>
          <div>Completed: <span className="text-emerald-400">{data.overall?.total_completed ?? 0}</span></div>
        </div>
      </div>

      {/* Bar chart — department summary */}
      <div className="space-y-2 mb-6">
        {summary.length === 0 && <div className="text-xs text-slate-500">No data.</div>}
        {summary.map(row => (
          <div key={row.department} className="flex items-center gap-3">
            <div className="w-44 truncate text-xs text-slate-300">{row.department}</div>
            <div className="flex-1 bg-slate-900 rounded h-5 overflow-hidden relative">
              <div
                className="h-full bg-sky-500/80"
                style={{ width: `${(row.completion_rate / maxVal) * 100}%` }}
              />
              <span className="absolute inset-0 flex items-center px-2 text-[11px] text-white font-medium">
                {row.completion_rate}% &nbsp; <span className="text-slate-300">({row.completed}/{row.enrolled})</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Per-module breakdown table */}
      <details className="text-xs">
        <summary className="cursor-pointer text-sky-400 hover:text-sky-300 mb-2">
          Per-department × per-module breakdown ({data.matrix?.length || 0} rows)
        </summary>
        <div className="overflow-auto max-h-80 mt-2 border border-slate-700 rounded">
          <table className="min-w-full text-[11px]">
            <thead className="bg-slate-900 text-slate-400 sticky top-0">
              <tr>
                <th className="text-left p-2">Department</th>
                <th className="text-left p-2">Module</th>
                <th className="text-right p-2">Enrolled</th>
                <th className="text-right p-2">Completed</th>
                <th className="text-right p-2">Rate</th>
              </tr>
            </thead>
            <tbody>
              {(data.matrix || []).map((r, i) => (
                <tr key={i} className="border-t border-slate-800">
                  <td className="p-2 text-slate-300">{r.department_name}</td>
                  <td className="p-2 text-slate-300">{r.course_title}</td>
                  <td className="p-2 text-right text-slate-400">{r.enrolled}</td>
                  <td className="p-2 text-right text-emerald-400">{r.completed}</td>
                  <td className="p-2 text-right text-white">{r.completion_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
