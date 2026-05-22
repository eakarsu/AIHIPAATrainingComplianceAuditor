import React, { useEffect, useState } from 'react';

export default function MinimumNecessaryTrainingDrift() {
  const [data, setData] = useState(null);
  const token = localStorage.getItem('token');
  useEffect(() => {
    fetch('/api/minimum-necessary-training-drift', { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.json()).then(setData).catch(() => {});
  }, [token]);
  return (
    <div className="space-y-4">
      <h1>Minimum Necessary Training Drift</h1>
      <p>Flags departments whose HIPAA training is drifting away from current PHI access patterns.</p>
      {data?.departments?.map((d) => (
        <section key={d.name} className="rounded border border-slate-200 bg-white p-4">
          <h2>{d.name}</h2>
          <p>{d.status} - drift score {d.drift_score}</p>
          <p>Recommended module: {d.module}</p>
        </section>
      ))}
    </div>
  );
}
