import { useState } from 'react';
import { BATCH_LIST } from '../data/pharmaData';
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChatAssistant({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello! I am your AI Pharmaceutical Stability Assistant. How can I help you analyze data or generate insights today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const sampleBatch = BATCH_LIST.find(b => b.status === "Warning" || b.status === "Critical") || BATCH_LIST[0] || { id: '---' };
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: `Based on the latest stability data, Batch ${sampleBatch.id} is flagged as ${sampleBatch.status}. We should closely monitor its degradation profile. Would you like me to generate a full report for this?` 
      }]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-24 right-8 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-50 animate-fade-in-up">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-pharmacy-400" />
          <h3 className="font-bold text-sm">Regulatory AI Assistant</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition">
           <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50 relative custom-scrollbar">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <SparklesIcon className="w-48 h-48 text-pharmacy-600" />
        </div>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}>
             <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-pharmacy-600 text-white rounded-tr-sm' : 'bg-white border text-slate-700 border-slate-200 rounded-tl-sm shadow-sm'}`}>
                {msg.content}
             </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start relative z-10">
             <div className="bg-white border text-slate-700 border-slate-200 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 flex space-x-1">
               <div className="w-2 h-2 bg-pharmacy-300 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-pharmacy-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
               <div className="w-2 h-2 bg-pharmacy-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
             </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 flex items-center shrink-0">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          className="flex-1 border-none bg-slate-100 rounded-full px-4 py-2 outline-none text-sm placeholder-slate-500 focus:bg-slate-200 transition focus:ring-1 focus:ring-pharmacy-500"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim()}
          className="ml-2 w-9 h-9 rounded-full bg-pharmacy-600 flex items-center justify-center text-white disabled:opacity-50 hover:bg-pharmacy-700 transition"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
