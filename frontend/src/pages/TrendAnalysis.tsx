import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { MEDICINES, BATCHES } from '../data/pharmaData';

export default function TrendAnalysis() {
  const [selectedMed, setSelectedMed] = useState(MEDICINES[0].id);
  const batchesForMed = useMemo(() => BATCHES.filter(b => b.medicineId === selectedMed), [selectedMed]);
  
  const [selectedBatch, setSelectedBatch] = useState(batchesForMed[0]?.id || 0);

  // Update batch automatically if medicin changes
  useMemo(() => {
    if (!batchesForMed.find(b => b.id === selectedBatch)) {
      setSelectedBatch(batchesForMed[0]?.id || 0);
    }
  }, [selectedMed, batchesForMed, selectedBatch]);

  const batchData = BATCHES.find(b => b.id === selectedBatch);
  const chartData = useMemo(() => {
    return batchData?.testIntervals.map(t => ({
      name: `${t.month}m`,
      potency: t.assay,
      dissolution: t.dissolution
    })) || [];
  }, [batchData]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Advanced Trend Analysis</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Track degradation profiles and predict Out of Specification (OOS) failures before they occur.</p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Medicine</label>
            <select 
              value={selectedMed} 
              onChange={e => setSelectedMed(Number(e.target.value))}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            >
              {MEDICINES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Batch</label>
            <select 
              value={selectedBatch} 
              onChange={e => setSelectedBatch(Number(e.target.value))}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            >
              {batchesForMed.map(b => <option key={b.id} value={b.id}>Batch #{b.id} (Mfg: {b.mfgDate})</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Potency Degradation Profile</h3>
          <div className="flex space-x-3 text-sm">
            <div className="flex items-center space-x-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span><span className="text-slate-600 dark:text-slate-400">OOS (90%)</span></div>
            <div className="flex items-center space-x-1"><span className="w-3 h-3 bg-yellow-500 rounded-full"></span><span className="text-slate-600 dark:text-slate-400">Action Limit (95%)</span></div>
          </div>
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} vertical={false}/>
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis domain={[85, 105]} stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                itemStyle={{ color: '#bae6fd' }}
              />
              <Legend />
              
              <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'OOS Limit', fill: '#ef4444', fontSize: 12 }} />
              <ReferenceLine y={95} stroke="#eab308" strokeDasharray="3 3" label={{ position: 'top', value: 'Action Limit', fill: '#eab308', fontSize: 12 }} />
              <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="3 3" />

              <Line type="monotone" dataKey="potency" name="Assay Potency (%)" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="dissolution" name="Dissolution (%)" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
