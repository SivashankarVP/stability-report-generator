import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MEDICINES, BATCH_LIST, STATUS_COUNTS } from '../data/pharmaData';
import { exportToCsv } from '../utils/exportCsv';

export default function Dashboard() {
  const [activeModal, setActiveModal] = useState<'medicines' | 'all' | 'critical' | 'warning' | null>(null);

  const stats = { 
    medicines: MEDICINES.length, 
    activeBatches: BATCH_LIST.length, 
    criticalAlerts: STATUS_COUNTS.Critical, 
    warnings: STATUS_COUNTS.Warning 
  };

  const averagePotencyData = [0, 3, 6, 9, 12, 18, 24].map(month => {
    const allTests = BATCH_LIST.map(b => b.testIntervals.find(t => t.month === month)).filter(Boolean);
    const avg = allTests.length ? allTests.reduce((sum, t) => sum + t!.assay, 0) / allTests.length : 100;
    return { month, potency: +avg.toFixed(2) };
  });

  // Show up to 2 DISTINCT medicines (not batches) in the Critical alerts panel.
  const criticalBatches = BATCH_LIST.filter(b => b.status === 'Critical' && b.days <= 7);
  const bestBatchByMedicineId = new Map<number, (typeof criticalBatches)[number]>();

  criticalBatches.forEach(b => {
    const existing = bestBatchByMedicineId.get(b.medicineId);
    if (!existing || b.days < existing.days) {
      bestBatchByMedicineId.set(b.medicineId, b);
    }
  });

  const alerts = [...bestBatchByMedicineId.values()]
    .sort((a, b) => a.days - b.days)
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-blue-900">Pharmaceutical Analytics Overview</h2>
        <div className="flex space-x-2 w-full sm:w-auto">
          <button 
            onClick={() => {
              const exportData = BATCH_LIST.map(b => ({
                'Batch ID': b.id,
                'Medicine Name': b.med.name,
                'Manufacturer': b.med.manufacturer,
                'Category': b.med.category,
                'Mfg Date': b.mfgDate,
                'Expiry Date': b.expiryDate,
                'Days Left': b.days,
                'Last Potency (%)': b.lastTest.assay,
                'Status': b.status
              }));
              exportToCsv('Global_Stability_Report.csv', exportData);
            }}
            className="w-full sm:w-auto justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>Download Global Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button onClick={() => setActiveModal('medicines')} className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm flex flex-col text-left hover:border-blue-400 hover:shadow-md transition">
          <span className="text-slate-500 text-sm font-medium">Total Medicines Monitored</span>
          <span className="text-3xl font-bold text-slate-900 mt-2">{stats.medicines}</span>
        </button>
        <button onClick={() => setActiveModal('all')} className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm flex flex-col text-left hover:border-blue-400 hover:shadow-md transition">
          <span className="text-slate-500 text-sm font-medium">Active Stability Studies</span>
          <span className="text-3xl font-bold text-slate-900 mt-2">{stats.activeBatches} Batches</span>
        </button>
        <button onClick={() => setActiveModal('critical')} className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm flex flex-col relative overflow-hidden text-left hover:border-red-400 hover:shadow-md transition">
          <div className="absolute top-0 right-0 p-3 opacity-20 text-red-600">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          </div>
          <span className="text-red-800 text-sm font-bold uppercase tracking-wider">Critical</span>
          <span className="text-3xl font-bold text-red-600 mt-2">{stats.criticalAlerts} Alerts</span>
        </button>
        <button onClick={() => setActiveModal('warning')} className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-sm flex flex-col relative overflow-hidden text-left hover:border-yellow-400 hover:shadow-md transition">
           <div className="absolute top-0 right-0 p-3 opacity-20 text-yellow-600">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          </div>
          <span className="text-yellow-800 text-sm font-bold uppercase tracking-wider">Early Warning (&lt; 6 Mon)</span>
          <span className="text-3xl font-bold text-yellow-600 mt-2">{stats.warnings} Warnings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Global Average Potency Degradation</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={averagePotencyData}>
                <defs>
                  <linearGradient id="colorPotency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tickFormatter={(v) => `${v}m`} stroke="#64748B" />
                <YAxis domain={[85, 105]} stroke="#64748B" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${value}%`, 'Potency']}
                  labelFormatter={(v) => `Month ${v}`}
                />
                <Area type="monotone" dataKey="potency" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPotency)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notifications list */}
        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Expiry Alerts Panel</h3>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {alerts.map(b => (
            <div key={b.id} className="p-3 border-l-4 rounded-r-lg border-red-500 bg-red-50">
                <div className="flex justify-between">
                  <span className="font-semibold text-sm text-red-800">
                    CRITICAL: Batch {b.id}
                  </span>
                  <span className="text-xs font-bold text-red-600">
                    {b.days} Days
                  </span>
                </div>
                <p className="text-sm mt-1 truncate text-red-700">
                  {b.med.name} requires immediate review.
                </p>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">No current alerts. All batches are safe.</p>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in-up">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <h3 className="text-lg md:text-xl font-bold text-slate-800 flex items-center space-x-2">
                {activeModal === 'medicines' && <span>💊 Total Medicines Monitored</span>}
                {activeModal === 'all' && <span>🧪 All Active Stability Batches</span>}
                {activeModal === 'critical' && <span className="text-red-600">🚨 Critical Batches</span>}
                {activeModal === 'warning' && <span className="text-yellow-600">⚠️ Early Warning Batches</span>}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-1.5 rounded-full transition shadow-sm border border-slate-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar bg-white">
              {activeModal === 'medicines' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {MEDICINES.map(m => (
                    <div key={m.id} className="p-4 border border-slate-200 rounded-xl flex items-center space-x-4 bg-white hover:bg-slate-50 transition hover:shadow-sm">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: m.color }}>{m.name[0]}</div>
                      <div>
                        <p className="font-bold text-slate-800">{m.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{m.category} · {m.manufacturer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {BATCH_LIST.filter(b => 
                    activeModal === 'all' ? true :
                    activeModal === 'critical' ? (b.status === 'Critical') :
                    (b.status === 'Warning')
                  ).map(b => (
                    <div key={b.id} className={`p-4 border rounded-xl flex justify-between items-center transition hover:shadow-md ${b.status === 'Critical' ? 'bg-red-50/30 border-red-200' : b.status === 'Warning' ? 'bg-yellow-50/50 border-yellow-200' : 'bg-slate-50/50 border-slate-200 hover:bg-white'}`}>
                       <div>
                         <p className="font-bold text-slate-800 text-sm">Batch #{b.id} <span className="text-slate-500 font-semibold ml-2">{b.med.name}</span></p>
                         <p className="text-xs text-slate-500 mt-1.5 font-medium">Mfg: {b.mfgDate} <span className="mx-2 text-slate-300">|</span> Exp: {b.expiryDate}</p>
                       </div>
                       <div className="text-right flex flex-col items-end">
                         <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider shadow-sm border ${b.status === 'Critical' ? 'bg-red-600 text-white border-red-700' : b.status === 'Warning' ? 'bg-yellow-400 text-yellow-900 border-yellow-500' : 'bg-green-500 text-white border-green-600'}`}>
                           {b.status}
                         </span>
                         <p className={`text-[11px] font-bold mt-1.5 ${b.status === 'Critical' ? 'text-red-500' : b.status === 'Warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                           {b.days} days left
                         </p>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
