// backend/src/types.ts
export type DiagnosePayload = {
  transcript: string;
  language?: 'pt' | 'en';
};

export type DiagnosisResponse = {
  diagnosis: string;
  conditions: string[];
  exams: string[];
  medications: string[];
  explanation?: string;
  language: 'pt' | 'en';
};

export type ChatPayload = {
  message: string;
  context: DiagnosisResponse;
  language?: 'pt' | 'en';
};

export type ChatResponse = {
  response: string;
};
