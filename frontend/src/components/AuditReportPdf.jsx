import React, { useState } from 'react';

export default function AuditReportPdf() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [lastDownloaded, setLastDownloaded] = useState(null);

  async function download() {
    setDownloading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/custom-views/audit-report-pdf', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const txt = await res.text();
        try { throw new Error(JSON.parse(txt).error || 'Download failed'); }
        catch { throw new Error('Download failed'); }
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `hipaa-audit-report-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastDownloaded(new Date().toLocaleString());
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
      <h3 className="text-base font-semibold text-white mb-1">HIPAA Audit Report (PDF)</h3>
      <p className="text-xs text-slate-400 mb-4">
        Generates a one-page executive HIPAA compliance audit report drawn live from
        workforce, training, incident, BAA, risk and deadline tables. Downloads as PDF.
      </p>

      <button
        onClick={download}
        disabled={downloading}
        className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800
                   disabled:cursor-not-allowed text-white text-sm font-medium"
      >
        {downloading ? 'Generating…' : 'Download Audit Report PDF'}
      </button>

      {lastDownloaded && (
        <p className="text-[11px] text-emerald-400 mt-3">Last downloaded: {lastDownloaded}</p>
      )}
      {error && <p className="text-[11px] text-rose-400 mt-3">Error: {error}</p>}

      <ul className="text-[11px] text-slate-400 mt-4 list-disc pl-4 space-y-1">
        <li>Executive summary (workforce, training, policies, BAAs)</li>
        <li>Open / overdue items (high &amp; critical risks, deadlines)</li>
        <li>Recent incident snapshot (up to 5)</li>
        <li>Recommendations checklist</li>
      </ul>
    </div>
  );
}
