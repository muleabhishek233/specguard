
import React from 'react';

interface ScoreGaugeProps {
  score: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-slate-100"
        />
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${getColor(score)} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-5xl font-bold ${getColor(score)}`}>{Math.round(score)}</span>
        <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Quality</span>
      </div>
    </div>
  );
};
