import React, { useEffect, useMemo, useState } from 'react';

const STATUSES = ['Queued', 'Ready', 'In progress', 'Done'];

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function CodexOperationsFeature() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [task, setTask] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/operations-tasks', { headers: authHeaders() })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to load tasks');
        setItems(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => Object.values(item).join(' ').toLowerCase().includes(normalized));
  }, [items, query]);

  async function addTask(event) {
    event.preventDefault();
    if (!task.trim()) return;
    try {
      const res = await fetch('/api/operations-tasks', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ task: task.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add task');
      setItems((current) => [data, ...current]);
      setTask('');
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  async function advanceStatus(item) {
    const next = STATUSES[(STATUSES.indexOf(item.status) + 1) % STATUSES.length];
    try {
      const res = await fetch(`/api/operations-tasks/${item.id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task');
      setItems((current) => current.map((i) => (i.id === item.id ? data : i)));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section style={{ padding: 24, color: '#172033' }}>
      <p style={{ margin: 0, color: '#64748b', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>Non-visual workflow</p>
      <h1 style={{ margin: '6px 0 18px', fontSize: 30 }}> AI HIPAATraining Compliance Auditor Operations Desk</h1>

      <form onSubmit={addTask} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) auto', gap: 10, marginBottom: 16 }}>
        <input value={task} onChange={(event) => setTask(event.target.value)} placeholder="Add an operational follow-up" style={{ padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 8 }} />
        <button type="submit" style={{ padding: '12px 16px', border: 0, borderRadius: 8, background: '#172033', color: '#ffffff', fontWeight: 700 }}>Add task</button>
      </form>

      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search owner, priority, status, or task" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: 16 }} />

      {error && <div style={{ background: '#fee', color: '#900', padding: '0.75rem', borderRadius: 6, marginBottom: 12 }}>{error}</div>}

      <div style={{ border: '1px solid #d7dde8', borderRadius: 8, overflow: 'hidden', background: '#ffffff' }}>
        {filtered.map((item) => (
          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 140px', gap: 12, padding: 14, borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
            <strong>{item.task}</strong>
            <span>{item.owner}</span>
            <span>{item.priority}</span>
            <button onClick={() => advanceStatus(item)} title="Click to advance status" style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}>
              {item.status} →
            </button>
          </div>
        ))}
        {!loading && filtered.length === 0 && <div style={{ padding: 18, color: '#64748b' }}>No matching workflow items.</div>}
        {loading && <div style={{ padding: 18, color: '#64748b' }}>Loading…</div>}
      </div>
    </section>
  );
}
