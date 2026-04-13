import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { MEDICINES, BATCH_LIST, BATCHES } from '../data/pharmaData';

const GRAPH_TYPES = [
  { id: 'potency',   label: '📉 Potency Curve',       icon: '📉' },
  { id: 'expiry',    label: '⏰ Expiry Dist.',        icon: '⏰' },
  { id: 'mfg',       label: '🏭 Mfg Timeline',        icon: '🏭' },
  { id: 'expmonth',  label: '📆 Expiry Calendar',     icon: '📆' },
  { id: 'tests',     label: '🧪 Test Params',         icon: '🧪' },
  { id: 'passfail',  label: '✅ Pass/Fail',           icon: '✅' },
];



const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-3 text-sm shadow-xl shadow-slate-200/50">
      <p className="text-slate-800 mb-2 font-bold border-b border-slate-100 pb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center space-x-3 text-slate-700 my-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: p.color }}></span>
          <span className="text-slate-500 font-medium">{p.name}:</span>
          <span className="font-bold text-slate-900">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [globalMedId, setGlobalMedId] = useState<number>(MEDICINES[0].id);

  // Map medicine to a specific graph type (using modulo to rotate through them)
  const getGraphTypeForMed = (medId: number) => {
    return GRAPH_TYPES[(medId - 1) % GRAPH_TYPES.length];
  };

  const activeGraph = getGraphTypeForMed(globalMedId);

  // --- DYNAMIC DATA COMPUTATION ---
  const { filteredMeds, stats, dynamicChartData } = useMemo(() => {
    const batches = BATCH_LIST.filter(b => b.medicineId === globalMedId);
    const meds = MEDICINES.filter(m => m.id === globalMedId);
    
    // KPI Stats
    const totalMeds = meds.length;
    const totalBatches = batches.length;
    let totalPass = 0; let totalTests = 0;
    batches.forEach(b => {
      b.testIntervals.forEach(t => {
        totalTests++;
        if (t.passFail) totalPass++;
      });
    });
    const compliance = totalTests > 0 ? ((totalPass / totalTests) * 100).toFixed(1) : '0.0';

    // 1. Expiry Status Distribution
    const expCount = { Critical: 0, Warning: 0, Safe: 0 };
    batches.forEach(b => { expCount[b.status as keyof typeof expCount]++; });
    const expiryDist = [
      { name: 'Critical', value: expCount.Critical, fill: '#f97316' },
      { name: 'Warning',  value: expCount.Warning,  fill: '#f59e0b' },
      { name: 'Safe',     value: expCount.Safe,     fill: '#10b981' },
    ];

    // 2. Manufacture Timeline
    const mfgCounts: Record<string, number> = {};
    batches.forEach(b => {
      const key = b.mfgDate.slice(0, 7);
      mfgCounts[key] = (mfgCounts[key] || 0) + 1;
    });
    const mfgTimeline = Object.entries(mfgCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, batches: count }));

    // 3. Expiry by Month
    const expMonthCounts: Record<string, number> = {};
    batches.forEach(b => {
      if (b.days > 0) {
        const key = b.expiryDate.slice(0, 7);
        expMonthCounts[key] = (expMonthCounts[key] || 0) + 1;
      }
    });
    const expiryCalendar = Object.entries(expMonthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, batches: count }));

    // 4. Potency Trend (Only for selected meds or top 5 if all)
    const potencyMeds = meds;
    const potencyData = [0, 3, 6, 9, 12].map(month => {
      const row: Record<string, any> = { month: `${month}m` };
      potencyMeds.forEach(med => {
        const medBatches = BATCHES.filter(b => b.medicineId === med.id);
        const avg = medBatches.reduce((sum, b) => {
          const t = b.testIntervals.find(ti => ti.month === month);
          return sum + (t?.assay ?? 100);
        }, 0) / medBatches.length;
        row[med.name.split(' ')[0]] = +avg.toFixed(2);
      });
      return row;
    });

    // 5. Radar / Tests Data
    const radarData = meds.map(med => {
      const latestTests = BATCHES.filter(b => b.medicineId === med.id).map(b => b.testIntervals[b.testIntervals.length - 1]);
      const avg = (key: keyof typeof latestTests[0]) => 
        +(latestTests.reduce((s, t) => s + (t[key] as number), 0) / (latestTests.length || 1)).toFixed(2);
      return {
        medicine: med.name.split(' ')[0],
        Assay: avg('assay'),
        Dissolution: avg('dissolution'),
        pH: avg('pH'),
        Moisture: avg('moisture')
      };
    });

    // 6. Pass/Fail Data
    const passFail = meds.map(med => {
      const allTests = BATCHES.filter(b => b.medicineId === med.id).flatMap(b => b.testIntervals);
      return {
        medicine: med.name.split(' ')[0],
        Pass: allTests.filter(t => t.passFail).length,
        Fail: allTests.filter(t => !t.passFail).length,
      };
    });

    return { 
      filteredBatches: batches, 
      filteredMeds: meds,
      stats: { totalMeds, totalBatches, totalTests, compliance, potencyMeds },
      dynamicChartData: { expiryDist, mfgTimeline, expiryCalendar, potencyData, radarData, passFail }
    };
  }, [globalMedId]);
  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto h-auto min-h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)]">
      {/* Medicine Selection Sidebar */}
      <div className="w-full md:w-80 max-h-72 md:max-h-none bg-white/80 backdrop-blur-xl border border-blue-100 shadow-sm rounded-2xl flex flex-col overflow-hidden flex-shrink-0">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">
            Analytics Profiles
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-medium">Select a medicine to view its targeted analysis</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {MEDICINES.map(m => {
            const isActive = globalMedId === m.id;
            const graphInfo = getGraphTypeForMed(m.id);
            return (
              <button
                key={m.id}
                onClick={() => setGlobalMedId(m.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex flex-col ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                    : 'hover:bg-slate-50 text-slate-700 hover:text-blue-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">{m.name.split(' ')[0]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {m.category}
                  </span>
                </div>
                <div className={`text-xs mt-1 flex items-center space-x-1 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                  <span>{graphInfo.icon}</span>
                  <span>Shows: {graphInfo.label.replace('📉 ', '').replace('⏰ ', '').replace('🏭 ', '').replace('📆 ', '').replace('🧪 ', '').replace('✅ ', '')}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-2">
        {/* Header Stats for Selected Medicine */}
        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-slate-100" style={{ backgroundColor: `${filteredMeds[0]?.color}20` }}>
              {activeGraph.icon}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{filteredMeds[0]?.name}</h2>
              <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium mt-0.5">
                <span className="text-blue-600 font-bold">{activeGraph.label}</span>
                <span>•</span>
                <span>{stats.totalBatches} active batches</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Compliance</p>
              <p className="text-xl font-black text-emerald-600 leading-none mt-1">{stats.compliance}%</p>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Test Records</p>
              <p className="text-xl font-black text-blue-600 leading-none mt-1">{stats.totalTests}</p>
            </div>
          </div>
        </div>

        {/* ── CHART RENDERERS (Only shows the one for the selected drug) ── */}
        <div className="animate-fade-in-up flex-1 flex flex-col">
          {/* Potency Curve */}
          {activeGraph.id === 'potency' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 flex-1 flex flex-col min-h-[500px]">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-slate-800">Assay Potency Degradation</h3>
                <p className="text-slate-500 text-sm mt-1">Showing 12-month stability curve for {filteredMeds[0]?.name}</p>
              </div>
              <div className="flex-1 w-full relative min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicChartData.potencyData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 12, fontWeight: 600 }} tickMargin={10} axisLine={false} />
                  <YAxis domain={[85, 105]} stroke="#64748B" tick={{ fontSize: 12, fontWeight: 600 }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 600, color: '#475569' }} />
                  <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} label={{ value: 'ICH Q1E Minimum (90%)', fill: '#ef4444', fontSize: 12, fontWeight: 'bold', position: 'insideTopLeft' }} />
                  {stats.potencyMeds.map((m) => (
                    <Line
                      key={m.id}
                      type="monotone"
                      dataKey={m.name.split(' ')[0]}
                      stroke={m.color}
                      strokeWidth={4}
                      dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: m.color }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                      animationDuration={1500}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* Expiry Dist */}
        {activeGraph.id === 'expiry' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 flex flex-col">
              <h3 className="text-xl font-black text-slate-800 mb-1">Expiry Status Overview</h3>
               <p className="text-slate-500 text-sm mb-6">Current breakdown of batch statuses</p>
              <div className="flex-1 relative min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dynamicChartData.expiryDist}
                      cx="50%" cy="50%" innerRadius={80} outerRadius={130}
                      paddingAngle={5} dataKey="value"
                      label={({ name, percent }: any) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                      labelLine={false}
                      stroke="none"
                    >
                      {dynamicChartData.expiryDist.map((entry, i) => <Cell key={i} fill={entry.fill} className="hover:opacity-80 transition-opacity" />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-slate-800">{stats.totalBatches}</span>
                  <span className="text-sm font-bold text-slate-400">Batches</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 flex flex-col">
              <h3 className="text-xl font-black text-slate-800 mb-1">Batch Breakdown</h3>
              <p className="text-slate-500 text-sm mb-6">Expiry stack across selected portfolio</p>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredMeds.map(m => {
                      const mBatches = BATCH_LIST.filter(b => b.medicineId === m.id);
                      return {
                        name: m.name.split(' ')[0],
                        Critical: mBatches.filter((b: any) => b.status === 'Critical').length,
                        Warning: mBatches.filter((b: any) => b.status === 'Warning').length,
                        Safe: mBatches.filter((b: any) => b.status === 'Safe').length,
                      };
                    })}
                    margin={{ top: 20, right: 0, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} angle={-20} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                    <Legend wrapperStyle={{fontWeight: 600, fontSize: '12px'}} />
                    <Bar dataKey="Critical" stackId="a" fill="#f97316" radius={[0,0,4,4]} animationDuration={1000} />
                    <Bar dataKey="Warning"  stackId="a" fill="#f59e0b" animationDuration={1000} />
                    <Bar dataKey="Safe"     stackId="a" fill="#10b981" radius={[4,4,0,0]} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Mfg Timeline */}
        {activeGraph.id === 'mfg' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 flex-1 flex flex-col min-h-[500px]">
             <h3 className="text-xl font-black text-slate-800 mb-1">Manufacturing Velocity</h3>
             <p className="text-slate-500 text-sm mb-6">Historical batch production timeline for {filteredMeds[0]?.name}</p>
            <div className="flex-1 relative min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicChartData.mfgTimeline} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="colorMfg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} angle={-45} textAnchor="end" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="batches" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorMfg)" activeDot={{ r: 8, strokeWidth: 0, fill: '#4f46e5' }} animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Expiry Calendar */}
        {activeGraph.id === 'expmonth' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 flex-1 flex flex-col min-h-[500px]">
             <h3 className="text-xl font-black text-slate-800 mb-1">Projected Expiry Volume</h3>
             <p className="text-slate-500 text-sm mb-6">Upcoming batch expirations by month for {filteredMeds[0]?.name}</p>
            <div className="flex-1 relative min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicChartData.expiryCalendar} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="barGradError" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444"/><stop offset="100%" stopColor="#b91c1c"/></linearGradient>
                    <linearGradient id="barGradWarn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#d97706"/></linearGradient>
                    <linearGradient id="barGradSafe" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#047857"/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} angle={-45} textAnchor="end" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                  <ReferenceLine x={new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().slice(0, 7)} stroke="#f97316" strokeDasharray="4 4" strokeWidth={2} label={{ value: '6-Month Horizon', fill: '#f97316', fontSize: 12, fontWeight: 'bold' }} />
                  <Bar dataKey="batches" radius={[6, 6, 0, 0]} animationDuration={1000}>
                    {dynamicChartData.expiryCalendar.map((entry, i) => {
                      const isNear = new Date(entry.month) <= new Date(new Date().setMonth(new Date().getMonth() + 1));
                      const isWarn = new Date(entry.month) <= new Date(new Date().setMonth(new Date().getMonth() + 6));
                      return <Cell key={i} fill={isNear ? 'url(#barGradError)' : isWarn ? 'url(#barGradWarn)' : 'url(#barGradSafe)'} className="hover:opacity-80 transition-opacity cursor-pointer" />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
           </div>
        )}

        {/* Tests / Radar */}
        {activeGraph.id === 'tests' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 flex flex-col items-center">
              <div className="w-full">
                <h3 className="text-xl font-black text-slate-800 mb-1">Parameter Fingerprint</h3>
                <p className="text-slate-500 text-sm mb-6">Latest tests overview vs acceptable limits</p>
              </div>
              <div className="flex-1 w-full max-w-md min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dynamicChartData.radarData}>
                    <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="medicine" tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fontSize: 10}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Radar name="Assay (%)" dataKey="Assay" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} strokeWidth={3} animationDuration={1500} />
                    <Radar name="Dissolution (%)" dataKey="Dissolution" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={3} animationDuration={1500} />
                    <Legend wrapperStyle={{fontWeight: 600, fontSize: 12}} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 flex flex-col">
              <h3 className="text-xl font-black text-slate-800 mb-1">Average Test Values</h3>
              <p className="text-slate-500 text-sm mb-6">Comparison of chemical properties</p>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicChartData.radarData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="medicine" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} angle={-30} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                    <Legend wrapperStyle={{fontWeight: 600, fontSize: 12}} />
                    <Bar dataKey="Assay" fill="#4f46e5" radius={[4,4,0,0]} animationDuration={1000} />
                    <Bar dataKey="Dissolution" fill="#14b8a6" radius={[4,4,0,0]} animationDuration={1000} />
                    <Bar dataKey="pH" fill="#f59e0b" radius={[4,4,0,0]} animationDuration={1000} />
                    <Bar dataKey="Moisture" fill="#ec4899" radius={[4,4,0,0]} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Pass/Fail */}
        {activeGraph.id === 'passfail' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 flex-1 flex flex-col min-h-[500px]">
            <h3 className="text-xl font-black text-slate-800 mb-1">Quality Control Pass/Fail Ratios</h3>
            <p className="text-slate-500 text-sm mb-6">Count of successful vs failed intervals for {filteredMeds[0]?.name}</p>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicChartData.passFail} margin={{ top: 20, right: 20, left: -10, bottom: 40 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis dataKey="medicine" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} width={120} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                  <Legend wrapperStyle={{fontWeight: 600, paddingTop: 10}} />
                  <Bar dataKey="Pass" stackId="a" fill="#10b981" radius={[0,0,0,0]} animationDuration={1000} barSize={24} />
                  <Bar dataKey="Fail" stackId="a" fill="#ef4444" radius={[0,4,4,0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
