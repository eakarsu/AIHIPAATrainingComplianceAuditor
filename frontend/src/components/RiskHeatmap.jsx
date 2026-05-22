import React, { useEffect, useState } from 'react';

function cellColor(value, max) {
  if (!max) return 'rgba(30,41,59,0.6)';
  const ratio = Math.min(1, value / max);
  // emerald -> amber -> rose gradient
  if (ratio < 0.34) return `rgba(16,185,129,${0.18 + ratio * 0.6})`;
  if (ratio < 0.67) return `rgba(245,158,11,${0.25 + ratio * 0.55})`;
  return `rgba(244,63,94,${0.30 + ratio * 0.55})`;
}

export default function RiskHeatmap() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/risk-heatmap', {
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

  if (loading) return <div className="p-4 text-slate-400 text-sm">Loading risk heatmap…</div>;
  if (error)   return <div className="p-4 text-rose-400 text-sm">Error: {error}</div>;
  if (!data)   return null;

  const max = Math.max(
    1,
    ...((data.matrix || []).flatMap(r => (r.cells || []).map(c => c.score || 0))),
  );

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">Risk &amp; Incident Heatmap</h3>
          <p className="text-xs text-slate-400">Department (rows) × Risk/Incident Category (columns)</p>
        </div>
        <div className="text-xs text-slate-400">
          Categories: <span className="text-white">{(data.categories || []).length}</span> ·
          Departments: <span className="text-white">{(data.departments || []).length}</span>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-[11px]">
          <thead>
            <tr>
              <th className="p-2 text-left text-slate-400 sticky left-0 bg-slate-800/60">Department</th>
              {(data.categories || []).map(c => (
                <th key={c} className="p-2 text-center text-slate-400 whitespace-nowrap" title={c}>
                  {c.length > 16 ? c.slice(0, 14) + '…' : c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.matrix || []).map(row => (
              <tr key={row.department}>
                <td className="p-2 text-slate-300 font-medium sticky left-0 bg-slate-800/60 whitespace-nowrap">
                  {row.department}
                </td>
                {(row.cells || []).map((c, i) => (
                  <td
                    key={i}
                    className="p-2 text-center text-white font-semibold border border-slate-900"
                    style={{ backgroundColor: cellColor(c.score, max), minWidth: 60 }}
                    title={`${row.department} × ${c.category}: ${c.score}`}
                  >
                    {c.score}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 mt-4 text-[11px] text-slate-400">
        <span>Low</span>
        <div className="flex-1 h-2 rounded"
             style={{
               background:
                 'linear-gradient(to right, rgba(16,185,129,0.6), rgba(245,158,11,0.7), rgba(244,63,94,0.85))',
             }}
        />
        <span>High</span>
      </div>
    </div>
  );
}
