import { useState, useMemo } from 'react';
import { MEDICINES, BATCH_LIST } from '../data/pharmaData';
import { exportToCsv } from '../utils/exportCsv';

type ExpiryStatus = 'Critical' | 'Warning' | 'Safe';

const STATUS_STYLES: Record<ExpiryStatus, string> = {
  Critical: 'bg-red-500 text-white border border-red-600',
  Warning:  'bg-yellow-100 text-yellow-800 border border-yellow-300',
  Safe:     'bg-green-100 text-green-700 border border-green-300',
};
const STATUS_DOT: Record<ExpiryStatus, string> = {
  Critical: 'bg-red-600 animate-pulse',
  Warning:  'bg-yellow-400',
  Safe:     'bg-green-500',
};

function getExpiryLabel(days: number): string {
  if (days <= 0) return `Expired ${Math.abs(days)}d ago`;
  if (days <= 7) return `${days} days left`;
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}

export default function MedicineManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | ExpiryStatus>('All');
  const [filterMedicine, setFilterMedicine] = useState('All');
  const [expandedMed, setExpandedMed] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'batches'>('overview');

  // "Critical alerts" should highlight only 1-2 medicines to update:
  // - Critical batches are already <= 7 days in data, but we enforce <= 7 days here too.
  // - We select the 2 medicines with the closest expiry (smallest days).
  const criticalMedicineAlerts = useMemo(() => {
    const perMedicine = new Map<number, { medicine: typeof MEDICINES[number]; minDays: number; criticalBatchCount: number }>();

    BATCH_LIST.forEach(b => {
      if (b.status === 'Critical' && b.days <= 7) {
        const key = b.medicineId;
        const existing = perMedicine.get(key);
        if (existing) {
          existing.minDays = Math.min(existing.minDays, b.days);
          existing.criticalBatchCount += 1;
        } else {
          perMedicine.set(key, {
            medicine: b.med,
            minDays: b.days,
            criticalBatchCount: 1,
          });
        }
      }
    });

    return [...perMedicine.values()]
      .sort((a, c) => a.minDays - c.minDays)
      .slice(0, 2);
  }, []);

  const criticalMedicineAlertIds = useMemo(() => {
    return new Set(criticalMedicineAlerts.map(m => m.medicine.id));
  }, [criticalMedicineAlerts]);

  const stats = useMemo(() => ({
    critical: criticalMedicineAlerts.length,
    warning:  BATCH_LIST.filter(b => b.status === 'Warning').length,
    safe:     BATCH_LIST.filter(b => b.status === 'Safe').length,
  }), [criticalMedicineAlerts]);

  const filteredBatches = useMemo(() =>
    BATCH_LIST.filter(b => b.status !== 'Expired').filter(b => {
      const q = search.toLowerCase();
      const matchSearch = !search || b.id.toString().includes(q) ||
        b.med.name.toLowerCase().includes(q) || b.med.genericName.toLowerCase().includes(q) ||
        b.med.manufacturer.toLowerCase().includes(q) || b.med.category.toLowerCase().includes(q);
      return matchSearch &&
        (filterStatus === 'All' || b.status === filterStatus) &&
        (filterMedicine === 'All' || b.med.name === filterMedicine);
    }),
  [search, filterStatus, filterMedicine]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Medicine Portfolio</h2>
          <p className="text-slate-500">10 medicines · 50 batches (IDs 101–150) · Multi-status expiry tracking</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'overview' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Overview</button>
            <button onClick={() => setActiveTab('batches')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'batches' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>All 50 Batches</button>
          </div>
          
          <button 
            onClick={() => {
              const exportData = filteredBatches.map(b => ({
                'Batch ID': b.id,
                'Medicine Name': b.med.name,
                'Generic Name': b.med.genericName,
                'Category': b.med.category,
                'Mfg Date': b.mfgDate,
                'Expiry Date': b.expiryDate,
                'Days Left': b.days,
                'Last Potency (%)': b.lastTest.assay,
                'Status': b.status
              }));
              exportToCsv('Filtered_Batches_Report.csv', exportData);
            }}
            className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg hover:bg-slate-200 border border-slate-200 transition font-medium flex items-center space-x-2"
          >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             <span>Export CSV</span>
          </button>

          <button onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto justify-center bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 transition font-medium flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            <span>Register Medicine</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Critical (≤7 days)',value: stats.critical, color: 'border-red-600',    bg: 'bg-red-100',   text: 'text-red-800',    dot: 'bg-red-600',   status: 'Critical' as ExpiryStatus },
          { label: 'Warning (≤6 months)',value: stats.warning, color: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-800', dot: 'bg-yellow-400',status: 'Warning'  as ExpiryStatus },
          { label: 'Safe Batches',      value: stats.safe,     color: 'border-green-400',  bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500', status: 'Safe'     as ExpiryStatus },
        ].map(c => (
          <button key={c.label} onClick={() => { setFilterStatus(filterStatus === c.status ? 'All' : c.status); setActiveTab('batches'); }}
            className={`${c.bg} border-l-4 ${c.color} p-4 rounded-xl text-left transition hover:shadow-md hover:scale-[1.02] ${filterStatus === c.status ? 'ring-2 ring-teal-500 ring-offset-1' : ''}`}>
            <div className="flex items-center space-x-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`}></span>
              <span className={`text-xs font-semibold uppercase tracking-wide ${c.text}`}>{c.label}</span>
            </div>
            <div className={`text-3xl font-black ${c.text}`}>{c.value}</div>
            <div className={`text-xs mt-1 opacity-70 ${c.text}`}>Click to filter</div>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {criticalMedicineAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-red-700">Medicines to update (Critical)</h3>
                  <p className="text-sm text-red-600 mt-1">
                    Showing top {criticalMedicineAlerts.length} medicine{criticalMedicineAlerts.length > 1 ? 's' : ''} with earliest expiry (&lt;= 7 days).
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {criticalMedicineAlerts.map(item => (
                  <div
                    key={item.medicine.id}
                    className="bg-white rounded-lg border border-red-100 p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-red-800">{item.medicine.name}</p>
                      <p className="text-xs text-red-600">{item.criticalBatchCount} critical batch{item.criticalBatchCount > 1 ? 'es' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-700">{item.minDays} days left</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {MEDICINES.map(med => {
            const expanded = expandedMed === med.id;
            const medBatches = BATCH_LIST.filter(b => b.medicineId === med.id && b.status !== 'Expired');
            const crit = criticalMedicineAlertIds.has(med.id)
              ? medBatches.filter(b => b.status === 'Critical' && b.days <= 7).length
              : 0;
            const warn = medBatches.filter(b => b.status === 'Warning').length;
            return (
              <div key={med.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedMed(expanded ? null : med.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition text-left">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: med.color }}>
                      {med.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{med.name}</h3>
                      <p className="text-sm text-slate-500">{med.genericName} · {med.manufacturer} · {med.dosageForm} · <span className="font-medium text-slate-600">{med.category}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                    <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-1 rounded-full">5 Batches</span>
                    {crit > 0 && <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">{crit} Alert{crit > 1 ? 's' : ''}</span>}
                    {warn > 0 && <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">{warn} Warning{warn > 1 ? 's' : ''}</span>}
                    <svg className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </button>
                {expanded && (
                  <div className="border-t border-slate-100 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="px-4 py-3">Batch ID</th><th className="px-4 py-3">Mfg. Date</th><th className="px-4 py-3">Expiry</th>
                        <th className="px-4 py-3">Time Left</th><th className="px-4 py-3">Last Potency</th><th className="px-4 py-3">Storage</th><th className="px-4 py-3">Status</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {medBatches.map(b => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-700">#{b.id}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{b.mfgDate}</td>
                            <td className="px-4 py-3 text-slate-600 font-medium text-xs">{b.expiryDate}</td>
                            <td className={`px-4 py-3 font-semibold text-sm ${b.status === 'Critical' ? 'text-red-600' : b.status === 'Warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                              {getExpiryLabel(b.days)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-slate-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${b.lastTest.assay >= 95 ? 'bg-green-500' : b.lastTest.assay >= 90 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${b.lastTest.assay}%` }}></div></div>
                                <span className="text-xs font-semibold text-slate-700">{b.lastTest.assay}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{med.storageCondition}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full ${STATUS_STYLES[b.status as ExpiryStatus]}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[b.status as ExpiryStatus]}`}></span>
                                <span>{b.status}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* All 50 Batches Tab */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center bg-slate-50">
            <div className="flex-1 min-w-48 relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" placeholder="Search by batch ID, medicine, generic name, category..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-teal-500"/>
            </div>
            <select value={filterMedicine} onChange={e => setFilterMedicine(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 bg-white">
              <option value="All">All 10 Medicines</option>
              {MEDICINES.map(m => <option key={m.id}>{m.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 bg-white">
              <option value="All">All Statuses</option>
              {(['Critical','Warning','Safe'] as ExpiryStatus[]).map(s => <option key={s}>{s}</option>)}
            </select>
            <span className="text-sm text-slate-500 font-medium">{filteredBatches.length} / 50</span>
            {(search || filterStatus !== 'All' || filterMedicine !== 'All') && (
              <button onClick={() => { setSearch(''); setFilterStatus('All'); setFilterMedicine('All'); }} className="text-teal-600 hover:text-teal-800 text-sm font-medium">Clear ×</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  {['Batch ID','Medicine','Generic / Category','Form','Mfg. Date','Expiry Date','Time Left','Last Potency','Status'].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map(b => (
                  <tr key={b.id} className={`hover:bg-slate-50 transition ${b.status === 'Critical' ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3 font-bold text-slate-800">#{b.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.med.color }}></span>
                        <div>
                          <p className="font-medium text-slate-800 text-xs">{b.med.name}</p>
                          <p className="text-slate-400 text-xs">{b.med.manufacturer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <p>{b.med.genericName}</p>
                      <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-xs">{b.med.category}</span>
                    </td>
                    <td className="px-4 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{b.med.dosageForm}</span></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{b.mfgDate}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium text-xs">{b.expiryDate}</td>
                    <td className={`px-4 py-3 font-bold text-xs ${b.status === 'Critical' ? 'text-red-700' : b.status === 'Warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {getExpiryLabel(b.days)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-14 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-1.5 rounded-full ${b.lastTest.assay >= 95 ? 'bg-green-500' : b.lastTest.assay >= 90 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${b.lastTest.assay}%`}}></div>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{b.lastTest.assay}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-bold rounded-full ${STATUS_STYLES[b.status as ExpiryStatus]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[b.status as ExpiryStatus]}`}></span>
                        <span>{b.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredBatches.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-12 text-slate-400">No batches match your filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-xl font-bold text-slate-800">Register New Medicine</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Brand Name',         placeholder: 'e.g. Tylenol 500mg' },
                  { label: 'Generic Name',        placeholder: 'e.g. Paracetamol' },
                  { label: 'Manufacturer',        placeholder: 'Enter manufacturer' },
                  { label: 'Drug Category',       placeholder: 'e.g. Analgesic, Antibiotic' },
                  { label: 'Dosage Form',         placeholder: 'Tablet / Capsule / Syrup' },
                  { label: 'Strength',            placeholder: 'e.g. 500mg' },
                  { label: 'Storage Condition',   placeholder: 'e.g. 25°C / 60% RH' },
                  { label: 'Initial Potency (%)', placeholder: '100', type: 'number' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                    <input type={f.type ?? 'text'} placeholder={f.placeholder} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-teal-500 text-sm"/>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition">Cancel</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition shadow-sm">Save Registration</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
