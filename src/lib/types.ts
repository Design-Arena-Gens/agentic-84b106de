export type Patient = {
  id: string;
  fullName: string;
  age: number;
  email?: string;
  phone?: string;
};

export type TriageInput = {
  category: string;
  details: string;
  symptoms: string[];
  durationDays?: number;
};

export type Diagnosis = {
  summary: string;
  likelihoods: Array<{ condition: string; probability: number }>;
  recommendations: string[];
  urgency: 'emergency' | 'urgent' | 'routine';
};

export type TriageRecord = {
  id: string;
  sessionId: string;
  patientId: string;
  input: TriageInput;
  diagnosis: Diagnosis;
  createdAt: number;
};

export type Appointment = {
  id: string;
  sessionId: string;
  patientId: string;
  startIso: string;
  endIso: string;
  type: 'initial' | 'followup';
  notes?: string;
  createdAt: number;
};

export type SurveyResponse = {
  id: string;
  sessionId: string;
  patientId: string;
  rating: number; // 1-5
  feedback?: string;
  createdAt: number;
};

export type Message = {
  id: string;
  sessionId: string;
  from: 'patient' | 'clinic' | 'ai';
  text: string;
  createdAt: number;
};

export type Session = {
  id: string;
  patient: Patient;
  createdAt: number;
};
