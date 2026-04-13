import { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BATCH_LIST } from '../data/pharmaData';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Show up to 2 DISTINCT medicines (not batches) in the Critical notifications dropdown.
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

  const criticalCount = alerts.length;
  const totalAlerts = alerts.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-blue-700 hover:text-blue-900 transition-colors focus:outline-none"
      >
        <BellIcon className="h-6 w-6" />
        {totalAlerts > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${criticalCount > 0 ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-4 w-4 items-center justify-center text-[9px] font-bold text-white ${criticalCount > 0 ? 'bg-red-500' : 'bg-yellow-500'}`}>
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-slate-100 animate-fade-in-up">
          <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Notifications</h3>
            <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{totalAlerts} New</span>
          </div>
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No new notifications.
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {alerts.map((alert, idx) => (
                  <li key={idx} className="p-4 hover:bg-slate-50 transition border-l-4 border-red-500 bg-red-50/10">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-semibold text-slate-800 truncate pr-2">Batch {alert.id}</p>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                        Critical
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">Medicine: {alert.med.name}</p>
                    <p className="text-xs mt-1.5 font-medium text-red-600">
                      Expires in {alert.days} days
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {null}
        </div>
      )}
    </div>
  );
}
