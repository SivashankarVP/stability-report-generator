import { BATCH_LIST } from '../data/pharmaData';

export default function StabilityTesting() {
  const upcomingBatches = [...BATCH_LIST]
    .filter(b => b.status !== 'Expired')
    .sort((a, b) => a.days - b.days)
    .slice(0, 15);

  const selectedBatch = upcomingBatches[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Stability Data Entry</h2>
          <p className="text-slate-500">Log test results for Assay Potency, Dissolution, pH, etc.</p>
        </div>
        <button className="w-full sm:w-auto bg-pharmacy-100 text-pharmacy-800 px-5 py-2.5 rounded-lg hover:bg-pharmacy-200 transition font-medium">
          New Validation Study
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
           <div className="bg-slate-50 p-4 border-b border-slate-200">
             <h3 className="font-semibold text-slate-700">Scheduled Tests</h3>
           </div>
           <div className="divide-y divide-slate-100 flex-1 overflow-auto max-h-[600px] custom-scrollbar">
             {upcomingBatches.map(b => {
               const lastInterval = b.testIntervals[b.testIntervals.length - 1]?.month ?? 0;
               const nextInterval = lastInterval === 0 ? 3 : lastInterval + (lastInterval >= 12 ? 6 : 3);
               return (
                 <div key={b.id} className="p-4 hover:bg-slate-50 cursor-pointer transition">
                   <div className="flex justify-between items-start mb-1">
                     <h4 className="font-bold text-slate-800 text-sm">Batch {b.id}</h4>
                     <span className={`text-xs font-semibold px-2 py-0.5 rounded ${b.days < 30 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>Due</span>
                   </div>
                   <p className="text-sm text-slate-600 truncate">{b.med.name}</p>
                   <p className={`text-xs font-medium mt-1.5 ${b.days < 30 ? 'text-red-600' : 'text-pharmacy-600'}`}>Next: {nextInterval} Months ({b.days}d left)</p>
                 </div>
               )
             })}
           </div>
        </div>

        <div className="lg:col-span-2 border border-slate-200 bg-white rounded-xl shadow-sm p-6 relative">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Log Sequence: Batch {selectedBatch?.id || '---'} ({selectedBatch?.med?.name || '---'})</h3>
          
          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assay Potency (%)</label>
                <input type="number" step="0.1" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-pharmacy-500" placeholder="e.g. 98.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dissolution (%)</label>
                <input type="number" step="0.1" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-pharmacy-500" placeholder="e.g. 96.0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">pH Level</label>
                <input type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-pharmacy-500" placeholder="e.g. 5.5" />
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Moisture Content (%)</label>
                <input type="number" step="0.1" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-pharmacy-500" placeholder="e.g. 2.1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Impurity Level (%)</label>
                <input type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-pharmacy-500" placeholder="e.g. 0.15" />
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Microbial Limit (CFU)</label>
                <input type="number" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-pharmacy-500" placeholder="e.g. 10" />
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 flex justify-end space-x-4">
               <button type="button" className="px-5 py-2.5 bg-pharmacy-600 hover:bg-pharmacy-700 text-white rounded-lg font-medium transition shadow-sm">
                  Save Stability Record
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
