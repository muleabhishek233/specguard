
export interface Finding {
  severity: 'high' | 'medium' | 'low';
  category: 'Ambiguity' | 'Missing Criteria' | 'Scope' | 'Consistency' | 'Clarity';
  title: string;
  description: string;
  recommendation: string;
}

export interface AnalysisResult {
  overallScore: number;
  summary: string;
  categories: {
    name: string;
    score: number;
    description: string;
  }[];
  findings: Finding[];
  suggestedAcceptanceCriteria: string[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  title: string;
  result: AnalysisResult;
  inputTextSnippet: string;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}
