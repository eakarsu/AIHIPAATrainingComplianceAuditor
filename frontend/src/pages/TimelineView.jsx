import React, { useEffect, useState } from 'react';

const STAGE_LABELS = {
  assigned: 'Assigned',
  content_verified: 'Content verified',
  in_progress: 'In progress',
  assessed: 'Assessed',
  attested: 'Attested',
  remediation: 'Remediation',
  compliance_review: 'Compliance review',
  closed: 'Closed',
};

function TimelineView() {
  const [stages, setStages] = useState([]);
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/insights/case-funnel', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || 'Failed to load case funnel');
        setStages(body.stages || []);
        setAvailable(body.available !== false);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const width = 620;
  const height = 260;
  const max = Math.max(...stages.map((stage) => stage.count), 1);
  const points = stages.map((stage, index) => {
    const x = 48 + index * (520 / Math.max(stages.length - 1, 1));
    const y = 202 - (stage.count / max) * 142;
    return { ...stage, x, y };
  });

  return (
    <main style={{ padding: 24, color: '#172033' }}>
      <p style={{ margin: 0, color: '#64748b', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>Custom visualization</p>
      <h1 style={{ margin: '6px 0 18px', fontSize: 30 }}>AI HIPAATraining Compliance Auditor Timeline View</h1>
      {!available && !loading && (
        <p style={{ color: '#b45309', marginBottom: 12 }}>
          Governed-training tables are not installed yet (migration 001). Showing an empty funnel.
        </p>
      )}
      {error && <p style={{ color: '#900', marginBottom: 12 }}>{error}</p>}
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 260px', gap: 18 }}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Governed training cases per workflow state" style={{ width: '100%', minHeight: 300, border: '1px solid #d7dde8', borderRadius: 8, background: '#f8fafc' }}>
          {[60, 100, 140, 180, 220].map((y) => <line key={y} x1="42" x2="580" y1={y} y2={y} stroke="#e2e8f0" />)}
          <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point) => (
            <g key={point.state}>
              <circle cx={point.x} cy={point.y} r="8" fill="#2563eb" stroke="#ffffff" strokeWidth="3" />
              <text x={point.x} y="238" textAnchor="middle" fill="#475569" fontSize="11">{STAGE_LABELS[point.state] || point.state}</text>
              <text x={point.x} y={point.y - 16} textAnchor="middle" fill="#172033" fontSize="13" fontWeight="700">{point.count}</text>
            </g>
          ))}
        </svg>
        <div style={{ display: 'grid', gap: 10 }}>
          {stages.map((stage) => (
            <div key={stage.state} style={{ border: '1px solid #d7dde8', borderRadius: 8, padding: 12, background: '#ffffff' }}>
              <strong>{STAGE_LABELS[stage.state] || stage.state}</strong>
              <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
                <div style={{ width: `${(stage.count / max) * 100}%`, height: '100%', background: '#2563eb' }} />
              </div>
              <span style={{ color: '#64748b', fontSize: 12 }}>{stage.count} case{stage.count === 1 ? '' : 's'}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default TimelineView;
