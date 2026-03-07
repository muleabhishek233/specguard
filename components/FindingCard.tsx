
import React from 'react';
import { Finding } from '../types';

interface FindingCardProps {
  finding: Finding;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const severityColors = {
    high: 'bg-rose-100 text-rose-700 border-rose-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${severityColors[finding.severity]}`}>
            {finding.severity.toUpperCase()}
          </span>
          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-200 uppercase">
            {finding.category}
          </span>
        </div>
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{finding.title}</h3>
      <p className="text-slate-600 mb-4 text-sm leading-relaxed">{finding.description}</p>
      
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
        <div className="flex items-center gap-2 mb-1 text-indigo-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wide">Recommendation</span>
        </div>
        <p className="text-sm text-slate-700 italic">"{finding.recommendation}"</p>
      </div>
    </div>
  );
};
