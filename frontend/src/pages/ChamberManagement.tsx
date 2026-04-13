import { useState, useMemo } from 'react';
import { CHAMBERS } from '../data/pharmaData';

export default function ChamberManagement() {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Maintenance' | 'Out of Calibration'>('All');

  const filteredChambers = useMemo(() => 
    CHAMBERS.filter(c => filter === 'All' || c.status === filter),
  [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Stability Chamber Management</h2>
          <p className="text-slate-500 dark:text-slate-400">Monitoring lab climate equipment and calibration states.</p>
        </div>
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-700 rounded-lg p-1.5 shadow-inner gap-1">
          {['All', 'Active', 'Maintenance', 'Out of Calibration'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                filter === status 
                  ? 'bg-white dark:bg-slate-600 shadow text-blue-700 dark:text-white' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-500'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredChambers.map(chamber => (
          <div key={chamber.id} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-t-4 transition duration-300 hover:shadow-md ${
            chamber.status === 'Active' ? 'border-green-500' : 
            chamber.status === 'Maintenance' ? 'border-blue-500' : 'border-red-500'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">{chamber.id}</span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{chamber.name}</h3>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${
                chamber.status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 border-green-200 dark:border-green-800' :
                chamber.status === 'Maintenance' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 border-blue-200 dark:border-blue-800' :
                'bg-red-100 dark:bg-red-900/30 text-red-700 border-red-200 dark:border-red-800 animate-pulse'
              }`}>
                {chamber.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Temperature</p>
                <p className="text-xl font-black text-slate-800 dark:text-slate-200">{chamber.temperature}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Relative Humidity</p>
                <p className="text-xl font-black text-slate-800 dark:text-slate-200">{chamber.humidity}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-0.5">Next Calibration</p>
                <p className={`text-sm font-bold ${chamber.status === 'Out of Calibration' ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                  {chamber.nextCalibration}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-400 mb-0.5">Active Batches</p>
                <p className="text-lg font-black text-blue-600 dark:text-blue-400">{chamber.batchCount}</p>
              </div>
            </div>
            {chamber.status === 'Out of Calibration' && (
               <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition text-sm">
                 Request Calibration Service
               </button>
            )}
          </div>
        ))}
        {filteredChambers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 font-medium">
            No chambers matching the selected status.
          </div>
        )}
      </div>
    </div>
  );
}
