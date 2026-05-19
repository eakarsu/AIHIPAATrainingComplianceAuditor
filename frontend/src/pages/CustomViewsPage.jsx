import React from 'react';
import TrainingCompletionChart from '../components/TrainingCompletionChart';
import RiskHeatmap from '../components/RiskHeatmap';
import AuditReportPdf from '../components/AuditReportPdf';
import TrainingRulesEditor from '../components/TrainingRulesEditor';

export default function CustomViewsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-testid="custom-views-page">
      <div>
        <h1 className="text-2xl font-bold text-white">HIPAA Custom Views</h1>
        <p className="text-sm text-slate-400 mt-1">
          Custom audit views: training completion, risk heatmap, audit-report export,
          and a training/compliance rules editor.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <TrainingCompletionChart />
        <RiskHeatmap />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <AuditReportPdf />
        <TrainingRulesEditor />
      </div>
    </div>
  );
}
