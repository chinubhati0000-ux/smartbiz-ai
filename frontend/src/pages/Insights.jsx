import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card, EmptyState, PageHeader } from '../components/ui';

const toneBorder = {
  positive: 'border-l-ledger-teal',
  warning: 'border-l-ledger-rust',
  neutral: 'border-l-ledger-amber'
};

export default function Insights() {
  const [insights, setInsights] = useState(null);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    api.get('/insights').then((res) => setInsights(res.data.insights));
    api.get('/predict').then((res) => setPrediction(res.data));
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Smart AI" title="AI Insights" />

      <Card className="mb-8">
        <h3 className="font-display text-lg font-semibold mb-4">What the numbers are telling you</h3>
        {!insights ? (
          <p className="text-sm text-ledger-ink/50">Analyzing your business data...</p>
        ) : (
          <ul className="space-y-3">
            {insights.map((ins, i) => (
              <li
                key={i}
                className={`flex items-start gap-3 border-l-4 ${toneBorder[ins.type] || 'border-l-ledger-line'} bg-ledger-paper rounded-r-md px-4 py-3`}
              >
                <span className="text-lg">{ins.icon}</span>
                <span className="text-sm text-ledger-ink">{ins.message}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Sales Prediction</h3>
        {!prediction ? (
          <p className="text-sm text-ledger-ink/50">Calculating prediction...</p>
        ) : !prediction.sufficientData ? (
          <EmptyState message={prediction.message} />
        ) : (
          <div>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-ledger-paper rounded-md p-4">
                <p className="font-mono text-xs tracking-widest text-ledger-ink/50 uppercase mb-1">
                  Trend
                </p>
                <p className="text-xl font-semibold capitalize">
                  {prediction.trendDirection === 'up' ? '📈 Up' : prediction.trendDirection === 'down' ? '📉 Down' : '➡️ Flat'}
                </p>
              </div>
              <div className="bg-ledger-paper rounded-md p-4">
                <p className="font-mono text-xs tracking-widest text-ledger-ink/50 uppercase mb-1">
                  Predicted Next Week Revenue
                </p>
                <p className="ledger-number text-xl font-semibold text-ledger-teal">
                  ₹{prediction.nextWeekRevenue.toFixed(2)}
                </p>
              </div>
              <div className="bg-ledger-paper rounded-md p-4">
                <p className="font-mono text-xs tracking-widest text-ledger-ink/50 uppercase mb-1">
                  Predicted Next Month Revenue
                </p>
                <p className="ledger-number text-xl font-semibold text-ledger-teal">
                  ₹{prediction.nextMonthRevenue.toFixed(2)}
                </p>
              </div>
            </div>

            <h4 className="font-medium text-sm mb-2">Predicted Product Demand (Next 7 Days)</h4>
            {prediction.productDemand.length === 0 ? (
              <EmptyState message="No product demand data yet." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ledger-ink/50 border-b border-ledger-line">
                    <th className="py-2">Product</th>
                    <th className="py-2">Predicted Units</th>
                  </tr>
                </thead>
                <tbody>
                  {prediction.productDemand.map((p) => (
                    <tr key={p.id} className="border-b border-ledger-line/60">
                      <td className="py-2 font-medium">{p.name}</td>
                      <td className="py-2 ledger-number">{p.predictedNextWeekUnits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="text-xs text-ledger-ink/40 mt-4">
              Predictions use a simple linear trend model based on your recorded sales history —
              accuracy improves as you log more data.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
