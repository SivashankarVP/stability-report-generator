import { useState } from 'react';
import { AUDIT_LOGS } from '../data/pharmaData';

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = AUDIT_LOGS.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Trails & Activity Logs</h2>
          <p className="text-slate-500 dark:text-slate-400">21 CFR Part 11 Compliant System Logs</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Search events, users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <button className="justify-center bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>Export Log</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-widest">
                <th className="px-6 py-4 font-semibold">Event ID</th>
                <th className="px-6 py-4 font-semibold">Timestamp (UTC)</th>
                <th className="px-6 py-4 font-semibold">User Ident</th>
                <th className="px-6 py-4 font-semibold">Action Type</th>
                <th className="px-6 py-4 font-semibold">Detailed Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredLogs.map(log => {
                const dateObj = new Date(log.timestamp);
                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition duration-150">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">EVT-{log.id.toString().padStart(4, '0')}</td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-700 dark:text-slate-300">
                      <div>{dateObj.toISOString().split('T')[0]}</div>
                      <div className="text-xs text-slate-400">{dateObj.toISOString().split('T')[1].replace('Z', '')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded text-xs font-bold">
                        {log.user}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{log.action}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{log.details}</td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">No logs found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
