import { useState, useMemo } from 'react';
import { TASKS, NOW } from '../data/pharmaData';

export default function Schedule() {
  const [activeRole, setActiveRole] = useState<'All' | 'QA Manager' | 'Lab Technician'>('All');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(NOW.toISOString().split('T')[0]);

  // Calendar logic
  const year = NOW.getFullYear();
  const month = NOW.getMonth(); // 0-11
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  const monthName = NOW.toLocaleString('default', { month: 'long' });

  // Filter tasks based on role
  const filteredTasks = useMemo(() => 
    TASKS.filter(t => activeRole === 'All' || t.assigneeRole === activeRole),
  [activeRole]);

  // Generate calendar cells (padding + actual days)
  const calendarCells = useMemo(() => {
    const emptyPrefix = Array.from({ length: firstDayOfMonth }, () => null);
    
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1, 12); // Use noon to avoid timezone shift
      const dateStr = d.toISOString().split('T')[0];
      const dayTasks = filteredTasks.filter(t => t.date === dateStr);
      return { day: i + 1, dateStr, dayTasks };
    });

    return [...emptyPrefix, ...days];
  }, [year, month, daysInMonth, firstDayOfMonth, filteredTasks]);

  const selectedDayTasks = useMemo(() => 
    filteredTasks.filter(t => t.date === selectedDateStr),
  [filteredTasks, selectedDateStr]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Real-Time Task Calendar</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage schedules, stability pulls, and QA approvals.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1.5 rounded-lg">
          {['All', 'QA Manager', 'Lab Technician'].map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role as any)}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                activeRole === role 
                  ? 'bg-white dark:bg-slate-600 shadow text-blue-700 dark:text-blue-200' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-500'
              }`}
            >
              {role === 'All' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Calendar Grid */}
        <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{monthName} {year}</h3>
             <div className="flex space-x-2 text-xs font-semibold">
               <div className="flex items-center space-x-1"><span className="w-3 h-3 bg-purple-500 rounded-sm"></span><span className="text-slate-600 dark:text-slate-300">QA Task</span></div>
               <div className="flex items-center space-x-1"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span><span className="text-slate-600 dark:text-slate-300">Lab Tech Task</span></div>
             </div>
           </div>

           <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
             {/* Days of week header */}
             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
               <div key={d} className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase">
                 {d}
               </div>
             ))}

             {/* Cells */}
             {calendarCells.map((cell, idx) => {
               if (!cell) {
                 return <div key={`empty-${idx}`} className="bg-white dark:bg-slate-800/50 min-h-[100px] p-2"></div>;
               }

               const isToday = cell.dateStr === NOW.toISOString().split('T')[0];
               const isSelected = cell.dateStr === selectedDateStr;

               return (
                 <button 
                   key={cell.dateStr}
                   onClick={() => setSelectedDateStr(cell.dateStr)}
                   className={`bg-white dark:bg-slate-800 min-h-[100px] p-2 text-left relative transition border-t border-l border-transparent hover:border-blue-300 dark:hover:border-blue-600
                     ${isSelected ? 'ring-inset ring-2 ring-blue-500 dark:ring-blue-400 z-10' : ''}
                   `}
                 >
                   <span className={`inline-flex w-7 h-7 justify-center items-center rounded-full text-sm font-bold ${
                     isToday ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'
                   }`}>
                     {cell.day}
                   </span>

                   {/* Render badges for tasks */}
                   <div className="mt-2 flex flex-col gap-1">
                     {cell.dayTasks.slice(0, 3).map(task => (
                       <div key={task.id} className={`text-[10px] sm:text-xs truncate px-1.5 py-0.5 rounded font-semibold text-white ${
                         task.assigneeRole === 'QA Manager' ? 'bg-purple-500' : 'bg-blue-500'
                       } ${task.status === 'Completed' ? 'opacity-50 line-through' : ''}`}>
                         {task.title}
                       </div>
                     ))}
                     {cell.dayTasks.length > 3 && (
                       <div className="text-[10px] text-slate-500 font-bold px-1">+ {cell.dayTasks.length - 3} more</div>
                     )}
                   </div>
                 </button>
               );
             })}
           </div>
        </div>

        {/* Side Panel: Selected Day Details */}
        <div className="w-full xl:w-96 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-auto xl:h-[600px]">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 rounded-t-xl">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Tasks details</h3>
            <p className="text-blue-600 dark:text-blue-400 font-semibold">{new Date(selectedDateStr).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric'})}</p>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {selectedDayTasks.length === 0 ? (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                <p>No tasks scheduled for this day.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDayTasks.map(task => (
                  <div key={task.id} className={`p-4 rounded-xl border ${
                    task.status === 'Completed' ? 'bg-slate-100 border-slate-200 dark:bg-slate-700/30 dark:border-slate-600 opacity-60' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 shadow-sm'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                         task.assigneeRole === 'QA Manager' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                       }`}>
                         {task.assigneeRole}
                       </span>
                       <span className={`text-xs font-bold ${task.status === 'Completed' ? 'text-green-600' : 'text-amber-500'}`}>{task.status}</span>
                    </div>
                    <h4 className={`font-semibold text-sm ${task.status === 'Completed' ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {task.title}
                    </h4>
                    {task.batchId && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">Related: Batch #{task.batchId}</p>
                    )}
                    
                    {task.status !== 'Completed' && (
                      <button className="mt-3 text-xs w-full py-2 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-600 transition font-semibold text-slate-700 dark:text-slate-300">
                        Mark as Complete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
