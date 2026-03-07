
import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ShieldCheck, 
  FileText, 
  Upload, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  ArrowLeft,
  Info,
  Zap,
  Target,
  FileWarning,
  Link as LinkIcon
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---
interface AuditResult {
  overallScore: number;
  summary: string;
  ambiguities: { point: string; impact: 'High' | 'Medium' | 'Low'; suggestion: string }[];
  missingCriteria: { category: string; details: string; suggestion: string }[];
  scopeRisks: { risk: string; mitigation: string; severity: 'Critical' | 'Moderate'; type: 'Assumption' | 'Dependency' | 'Scope' }[];
  strengths: string[];
}

const SpecGuardAI = () => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [files, setFiles] = useState<{data: string, type: string, name: string}[]>([]);
  const [activeTab, setActiveTab] = useState<'text' | 'upload' >('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setFiles(prev => [...prev, {
          data: base64.split(',')[1],
          type: file.type || 'application/octet-stream',
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const performAudit = async () => {
    if (!inputText && files.length === 0) return;
    
    setIsAnalyzing(true);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const promptParts: any[] = [
        { text: `Audit the following software PRD/Requirements for professional quality.
        Target: Ambiguous Requirements, Missing Acceptance Criteria, and Scope/Dependency Risks.
        
        Instructions:
        1. Ambiguous Requirements: Identify subjective/vague language.
        2. Missing Acceptance Criteria: Identify gaps in edge cases, error handling, or performance.
        3. Scope / Dependency Risks: Identify unclear assumptions, hidden dependencies, and potential scope creep.
        4. Provide an overall Spec Quality Score (0-100).
        
        Requirements Text: ${inputText}` }
      ];

      files.forEach(f => {
        promptParts.push({
          inlineData: {
            data: f.data,
            mimeType: f.type.includes('docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : f.type
          }
        });
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [{ parts: promptParts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              ambiguities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    point: { type: Type.STRING },
                    impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                    suggestion: { type: Type.STRING }
                  },
                  required: ["point", "impact", "suggestion"]
                }
              },
              missingCriteria: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    details: { type: Type.STRING },
                    suggestion: { type: Type.STRING }
                  },
                  required: ["category", "details", "suggestion"]
                }
              },
              scopeRisks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    risk: { type: Type.STRING },
                    mitigation: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ["Critical", "Moderate"] },
                    type: { type: Type.STRING, enum: ["Assumption", "Dependency", "Scope"] }
                  },
                  required: ["risk", "mitigation", "severity", "type"]
                }
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["overallScore", "summary", "ambiguities", "missingCriteria", "scopeRisks", "strengths"]
          }
        }
      });

      const parsedResult = JSON.parse(response.text || '{}') as AuditResult;
      setResult(parsedResult);
    } catch (error) {
      console.error("Audit failed:", error);
      alert("Analysis failed. Please ensure your API key is valid and files are readable.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setInputText('');
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <ShieldCheck size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">SpecGuard<span className="text-indigo-600">AI</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!result ? (
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Audit your requirements <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">in seconds.</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Professional-grade AI analysis for ambiguities, missing acceptance criteria, and scope risks.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-100 overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 min-w-[140px] px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'text' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                  <FileText size={18} /> Paste Text
                </button>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 min-w-[140px] px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                  <Upload size={18} /> Upload Docs
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {activeTab === 'text' && (
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your PRD sections or User Stories here..."
                    className="w-full h-64 p-4 rounded-xl border-none focus:ring-0 text-slate-700 placeholder:text-slate-400 resize-none text-base leading-relaxed bg-slate-50/50"
                  />
                )}

                {activeTab === 'upload' && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 transition-all group"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors mb-4">
                      <Upload size={32} />
                    </div>
                    <p className="font-bold text-slate-700">Click to upload PRD documents</p>
                    <p className="text-sm text-slate-500">Supports .pdf, .docx, .txt, and images</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      multiple 
                      accept=".pdf,.docx,.txt,image/*"
                    />
                  </div>
                )}

                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200">
                        <FileText size={14} /> {f.name}
                        <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="hover:text-red-500">×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="hidden sm:flex items-center gap-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Privacy Secure</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={12} /> SOC-2 Compliant</span>
                  </div>
                  <button
                    onClick={performAudit}
                    disabled={isAnalyzing || (!inputText && files.length === 0 )}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isAnalyzing ? (
                      <><Loader2 className="animate-spin" size={20} /> Analyzing...</>
                    ) : (
                      <>Analyze PRD <ChevronRight size={18} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4">
              <button onClick={reset} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600"><ArrowLeft size={24} /></button>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Spec Quality Analysis</h2>
                <p className="text-slate-500 text-sm">Targeting ambiguities, gaps, and risks.</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center space-y-4">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32">
                      <circle className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                      <circle
                        className={`${result.overallScore > 75 ? 'text-emerald-500' : result.overallScore > 50 ? 'text-amber-500' : 'text-rose-500'}`}
                        strokeWidth="8"
                        strokeDasharray={364}
                        strokeDashoffset={364 - (364 * result.overallScore) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="58"
                        cx="64"
                        cy="64"
                      />
                    </svg>
                    <span className="absolute text-3xl font-black text-slate-800">{result.overallScore}</span>
                  </div>
                  <h3 className="text-xl font-bold">Spec Quality Score</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{result.summary}</p>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-3xl">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Zap size={18} className="text-amber-400" /> Key Strengths</h3>
                  <ul className="space-y-3">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-300">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2 text-slate-700">
                      <Info size={18} className="text-indigo-600" /> Ambiguous Requirements
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {result.ambiguities.map((item, i) => (
                      <div key={i} className="p-6 space-y-2 hover:bg-slate-50/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">"{item.point}"</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.impact === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{item.impact}</span>
                        </div>
                        <p className="text-sm text-slate-500 italic">Suggested clarification:</p>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 border-dashed">{item.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2 text-slate-700">
                      <Target size={18} className="text-emerald-600" /> Missing Acceptance Criteria
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {result.missingCriteria.map((item, i) => (
                      <div key={i} className="p-6 space-y-3">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">{item.category}</span>
                        <p className="text-sm font-medium text-slate-800">{item.details}</p>
                        <div className="flex gap-2 items-start p-3 bg-emerald-50 rounded-xl text-emerald-800 text-sm">
                          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                          <span><strong>Recommendation:</strong> {item.suggestion}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-rose-50 flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2 text-rose-700">
                      <FileWarning size={18} className="text-rose-600" /> Scope / Dependency Risks
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {result.scopeRisks.map((item, i) => (
                      <div key={i} className="p-6 grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase text-rose-400 tracking-widest">{item.type}</span>
                            <span className={`text-[10px] px-1 rounded ${item.severity === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{item.severity}</span>
                          </div>
                          <p className="font-bold text-slate-800 leading-tight">{item.risk}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Mitigation Strategy</span>
                          <p className="text-sm text-slate-600 leading-relaxed">{item.mitigation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
            
            <div className="flex justify-center pb-12">
              <button onClick={reset} className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Audit Another PRD</button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-xs text-slate-400">© 2025 SpecGuard AI Systems. Prototype compliant with PRD v1.0. Powered by Gemini 3.</p>
        </div>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<SpecGuardAI />);
}
