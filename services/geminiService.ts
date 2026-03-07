
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const SYSTEM_INSTRUCTION = `You are an expert Senior Product Manager and Technical Architect.
Your task is to audit Product Requirement Documents (PRDs) or technical specifications.
Analyze the provided text for:
1. Ambiguity: Vagueness that could lead to multiple interpretations.
2. Missing Acceptance Criteria: Functional gaps that need clear pass/fail definitions.
3. Unclear Scope: Undefined boundaries or potential scope creep.
4. Internal Inconsistency: Contradictions within the document.
5. Overall Feasibility and Clarity.

Output a structured JSON response including a 0-100 quality score, a summary, categorized scores, detailed findings, and suggested missing acceptance criteria.`;

export async function analyzeSpecification(text: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analyze this specification text and provide detailed feedback:\n\n${text}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          categories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                score: { type: Type.NUMBER },
                description: { type: Type.STRING }
              },
              required: ["name", "score", "description"]
            }
          },
          findings: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                severity: { type: Type.STRING, description: "high, medium, or low" },
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ["severity", "category", "title", "description", "recommendation"]
            }
          },
          suggestedAcceptanceCriteria: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["overallScore", "summary", "categories", "findings", "suggestedAcceptanceCriteria"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as AnalysisResult;
}
