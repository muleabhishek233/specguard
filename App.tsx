
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, AnalysisResult, HistoryItem } from './types';
import { analyzeSpecification } from './services/geminiService';
import { ScoreGauge } from './components/ScoreGauge';
import { FindingCard } from './components/FindingCard';

const STORAGE_KEY = 'specguard_history_v1';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setState(AppState.LOADING);
    setError(null);
    try {
      const analysis = await analyzeSpecification(inputText);
      setResult(analysis);
      setState(AppState.RESULTS);

      // Save to history
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        title: analysis.summary.slice(0, 60) + '...',
        result: analysis,
        inputTextSnippet: inputText.slice(0, 100) + '...'
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 20)); // Keep last 20
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during analysis.');
      setState(AppState.ERROR);
    }
  };

  const reset = () => {
    setState(AppState.IDLE);
    setResult(null);
    setError(null);
    setInputText('');
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResult(item.result);
    setState(AppState.RESULTS);
    setIsHistoryOpen(false);
    setInputText(''); // Clear input to focus on result
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text);
      };
      reader.readAsText(file);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-50';
    if (score >= 50) return 'text-amber-500 bg-amber-50';
    return 'text-rose-500 bg-rose-50';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 relative overflow-x-hidden">
      {/* History Sidebar Drawer */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isHistoryOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out transform ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-800">Audit History</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {history.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">No previous audits found.</p>
                  <p className="text-xs text-slate-400 mt-1">Your analysis results will appear here.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="group relative p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${getScoreColor(item.result.overallScore)}`}>
                        {item.result.overallScore}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{formatDate(item.timestamp)}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 italic">
                      "{item.inputTextSnippet}"
                    </p>
                    <button 
                      onClick={(e) => deleteHistoryItem(e, item.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b px-6 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04c0 4.833 1.158 8.244 3.018 10.897.587.837 1.251 1.624 1.977 2.352a11.91 11.91 0 001.213 1.107c.361.272.748.525 1.156.758a11.968 11.968 0 002.664-2.671 11.95 11.95 0 002.324-4.526A11.95 11.95 0 0020.382 7.984z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">SpecGuard<span className="text-indigo-600">AI</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
              {history.length > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {history.length}
                </span>
              )}
            </button>
            {state === AppState.RESULTS && (
              <button 
                onClick={reset}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-all"
              >
                New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        {state === AppState.IDLE || state === AppState.ERROR ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Audit your requirements in seconds.</h2>
              <p className="text-lg text-slate-600">Detect ambiguities, missing acceptance criteria, and scope risks with professional-grade AI analysis.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-1 border-b border-slate-100 bg-slate-50 flex gap-2 px-4">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="p-6">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your PRD, user stories, or technical spec here..."
                  className="w-full h-80 p-4 text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none font-mono text-sm"
                />
                
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".txt,.md"
                      onChange={handleFileUpload}
                      id="file-upload"
                      className="hidden" 
                    />
                    <label 
                      htmlFor="file-upload"
                      className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Attach Text/MD File
                    </label>
                  </div>

                  {/* Fix: Removed state === AppState.LOADING check as it is logically impossible in this block and causing a TS error */}
                  <button
                    onClick={handleAnalyze}
                    disabled={!inputText.trim()}
                    className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    Analyze Specification
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        ) : null}

        {state === AppState.LOADING && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="inline-block relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Analyzing your specification...</h2>
            <p className="text-slate-500 italic">Thinking like a Senior PM. Reviewing for edge cases, ambiguities, and technical feasibility.</p>
          </div>
        )}

        {state === AppState.RESULTS && result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Overview Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                <ScoreGauge score={result.overallScore} />
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-bold text-slate-800">Overall Health</h3>
                  <p className="text-sm text-slate-500 max-w-xs mt-2">{result.summary}</p>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Pillar Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.categories.map((cat, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-slate-600">{cat.name}</span>
                        <span className="text-sm font-bold text-indigo-600">{cat.score}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">{cat.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Findings Section */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              <div className="xl:col-span-3 space-y-6">
                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  Analysis Findings
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-md">{result.findings.length} Items</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.findings.map((finding, idx) => (
                    <FindingCard key={idx} finding={finding} />
                  ))}
                </div>
              </div>

              {/* Suggestions Sidepanel */}
              <div className="xl:col-span-1 space-y-6">
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
                  <h4 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Missing ACs
                  </h4>
                  <ul className="space-y-4">
                    {result.suggestedAcceptanceCriteria.map((ac, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-emerald-800 leading-snug">
                        <span className="flex-shrink-0 w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-600 border border-emerald-200">
                          {idx + 1}
                        </span>
                        {ac}
                      </li>
                    ))}
                  </ul>
                  {result.suggestedAcceptanceCriteria.length === 0 && (
                    <p className="text-sm text-emerald-600 italic">No missing criteria identified. Great job!</p>
                  )}
                </div>

                <div className="bg-slate-800 text-white rounded-2xl p-6 shadow-xl">
                  <h4 className="font-bold mb-2">Pro Tip</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    A high Spec Quality Score doesn't guarantee success, but it ensures your team doesn't waste time on misunderstandings. Use the recommendations to patch the gaps before your sprint planning.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
          <p>© 2025 SpecGuard AI Auditor. Powered by Gemini 3.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-indigo-600">Documentation</a>
            <a href="#" className="hover:text-indigo-600">API</a>
            <a href="#" className="hover:text-indigo-600">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
