import { useMemo } from 'react';
import { BATCH_LIST } from '../data/pharmaData';
import { exportToCsv } from '../utils/exportCsv';

export default function ExpiredHistory() {
  const expiredBatches = useMemo(() => 
    BATCH_LIST.filter(b => b.status === 'Expired').sort((a, b) => 
      new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime()
    ),
  []);

  const stats = useMemo(() => {
    const totalBatches = expiredBatches.length;
    const uniqueMedicines = new Set(expiredBatches.map(b => b.med.id)).size;
    const mostRecent = expiredBatches.length > 0 ? expiredBatches[0] : null;

    return { totalBatches, uniqueMedicines, mostRecent };
  }, [expiredBatches]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center bg-red-950/5 p-6 rounded-xl border border-red-200 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-bold text-red-900">Expired History</h2>
          <p className="text-red-700/70">Archived records of all expired medicine batches</p>
        </div>
        <div>
          <button 
            onClick={() => {
              const exportData = expiredBatches.map(b => ({
                'Batch ID': b.id,
                'Medicine Name': b.med.name,
                'Manufacturer': b.med.manufacturer,
                'Mfg Date': b.mfgDate,
                'Expiry Date': b.expiryDate,
                'Days Since Expiry': Math.abs(b.days)
              }));
              exportToCsv('Expired_Batches_Report.csv', exportData);
            }}
            className="bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 border border-red-200 transition font-medium flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
          <div className="text-sm font-semibold text-red-800 uppercase tracking-wider mb-1">Total Expired Batches</div>
          <div className="text-3xl font-black text-red-700">{stats.totalBatches}</div>
        </div>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
          <div className="text-sm font-semibold text-red-800 uppercase tracking-wider mb-1">Medicines Affected</div>
          <div className="text-3xl font-black text-red-700">{stats.uniqueMedicines}</div>
        </div>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
          <div className="text-sm font-semibold text-red-800 uppercase tracking-wider mb-1">Most Recent Expiry</div>
          <div className="text-xl font-bold text-red-700 truncate">
            {stats.mostRecent ? `${stats.mostRecent.med.name} (Batch #${stats.mostRecent.id})` : 'None'}
          </div>
          <div className="text-sm text-red-600 mt-1">
            {stats.mostRecent ? `Expired ${Math.abs(stats.mostRecent.days)} days ago` : '-'}
          </div>
        </div>
      </div>

      {/* Expired Batches Table */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-red-50 bg-red-50/30">
          <h3 className="font-bold text-red-900">Expired Batch Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-red-50/50 border-b border-red-100 text-red-800 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Batch ID</th>
                <th className="px-4 py-3 font-semibold">Medicine</th>
                <th className="px-4 py-3 font-semibold">Manufacturer</th>
                <th className="px-4 py-3 font-semibold">Mfg. Date</th>
                <th className="px-4 py-3 font-semibold">Expiry Date</th>
                <th className="px-4 py-3 font-semibold">Time Since Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-50">
              {expiredBatches.map(b => (
                <tr key={b.id} className="hover:bg-red-50/30 transition">
                  <td className="px-4 py-3 font-bold text-slate-800">#{b.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.med.color }}></span>
                      <span className="font-medium text-slate-800">{b.med.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{b.med.manufacturer}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{b.mfgDate}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 text-xs">{b.expiryDate}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                      {Math.abs(b.days)} days ago
                    </span>
                  </td>
                </tr>
              ))}
              {expiredBatches.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No expired batches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
