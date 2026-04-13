import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { HomeIcon, BeakerIcon, ChartPieIcon, DocumentTextIcon, ArchiveBoxIcon, ChatBubbleLeftIcon, ClockIcon, ClipboardDocumentListIcon, CalendarDaysIcon, PresentationChartLineIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import Dashboard from './pages/Dashboard';
import MedicineManagement from './pages/MedicineManagement';
import StabilityTesting from './pages/StabilityTesting';
import Analytics from './pages/Analytics';
import AIReportGenerator from './pages/AIReportGenerator';
import ExpiredHistory from './pages/ExpiredHistory';
import AIChatAssistant from './components/AIChatAssistant';
import Login from './pages/Login';
import NotificationBell from './components/NotificationBell';
import AuditLogs from './pages/AuditLogs';
import Schedule from './pages/Schedule';
import TrendAnalysis from './pages/TrendAnalysis';
import { useTheme } from './context/ThemeContext';

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const { theme } = useTheme();
  const navItems = [
    { name: 'Dashboard', path: '/', icon: HomeIcon },
    { name: 'Medicines', path: '/medicines', icon: BeakerIcon },
    { name: 'Stability Testing', path: '/testing', icon: ArchiveBoxIcon },
    { name: 'Analytics', path: '/analytics', icon: ChartPieIcon },
    { name: 'Trend Analysis', path: '/trends', icon: PresentationChartLineIcon },
    { name: 'Pull Schedule', path: '/schedule', icon: CalendarDaysIcon },
    { name: 'AI Report Generator', path: '/ai-report', icon: DocumentTextIcon },
    { name: 'Expired History', path: '/expired', icon: ClockIcon },
    { name: 'Audit Logs', path: '/audit', icon: ClipboardDocumentListIcon },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" 
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64 min-h-screen p-4 flex flex-col border-r border-slate-700/50`} style={theme === 'dark' ? { background: '#0f172a', color: '#f8fafc' } : {background: 'linear-gradient(to bottom, #3a87c8 0%, #5ba3de 40%, #7bbfee 100%)', color: 'white', boxShadow: '2px 0 10px rgba(0,0,0,0.12)'}}>
        <div className="flex items-center space-x-2 mb-8 mt-2 px-2">
          <BeakerIcon className="h-8 w-8" style={{ color: theme === 'dark' ? '#38bdf8' : 'white' }} />
          <h1 className="text-lg font-bold leading-tight drop-shadow" style={{ color: theme === 'dark' ? '#f8fafc' : 'white' }}>Enviroapps</h1>
        </div>
        
        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pb-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 ${
                isActive 
                  ? theme === 'dark' 
                    ? 'bg-blue-600/30 text-blue-400 font-bold border border-blue-500/30'
                    : 'bg-white/20 text-white font-bold shadow-sm backdrop-blur-sm'
                  : theme === 'dark'
                    ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    : 'text-blue-50 hover:bg-white/10'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? (theme === 'dark' ? 'text-blue-400' : 'text-white') : 'opacity-80'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className={`mt-auto p-4 rounded-xl backdrop-blur-md border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50 text-slate-300' : 'bg-white/10 border-white/20 text-blue-50'}`}>
        <p className="text-xs font-semibold mb-1 opacity-80">System Status</p>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0"></span>
          <span className="text-xs md:text-sm font-bold truncate">Operational</span>
        </div>
      </div>
      </div>
    </>
  );
};

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="hidden md:flex flex-col items-end mr-4 select-none">
      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
        {time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </span>
      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 opacity-80 mt-0.5 tracking-wider">
        {time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
};

const Layout = ({ children, onLogout }: { children: React.ReactNode, onLogout: () => void }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`flex min-h-screen overflow-x-hidden ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50'}`}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col relative w-full overflow-hidden">
        <header className="relative z-20 h-16 flex items-center px-4 md:px-8 justify-between border-b border-blue-200/60 dark:border-slate-700" style={{background: theme === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(184,217,240,0.55)', backdropFilter: 'blur(8px)'}}>
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="mr-3 md:hidden p-2 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg md:text-xl font-semibold text-blue-900 dark:text-blue-300 truncate max-w-[150px] sm:max-w-none">Pharma Ops</h2>
          </div>
          <div className="flex items-center space-x-4">
            <LiveClock />
            <button onClick={toggleTheme} className="p-2 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition focus:outline-none rounded-full hover:bg-black/5 dark:hover:bg-white/10">
              {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <NotificationBell />
            <button className="hidden sm:block text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-amber-100 font-medium">Settings</button>
            <button onClick={onLogout} className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-amber-100 font-medium">Logout</button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 relative">
          {children}
          
          <AIChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </main>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`absolute bottom-8 right-8 p-4 rounded-full shadow-lg text-white transition-all transform hover:scale-105 z-50 ${isChatOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-pharmacy-600 hover:bg-pharmacy-700'}`}
        >
          {isChatOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <ChatBubbleLeftIcon className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/*" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout onLogout={() => setIsAuthenticated(false)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/medicines" element={<MedicineManagement />} />
          <Route path="/testing" element={<StabilityTesting />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/trends" element={<TrendAnalysis />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/audit" element={<AuditLogs />} />
          <Route path="/ai-report" element={<AIReportGenerator />} />
          <Route path="/expired" element={<ExpiredHistory />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
