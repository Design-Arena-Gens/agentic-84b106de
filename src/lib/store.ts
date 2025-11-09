import { Appointment, Message, Patient, Session, SurveyResponse, TriageInput, TriageRecord } from "@/lib/types";

// In-memory store (non-persistent, demo only)
// On serverless platforms, data may be reset on cold start.

let sessions = new Map<string, Session>();
let patients = new Map<string, Patient>();
let triages: TriageRecord[] = [];
let appointments: Appointment[] = [];
let surveys: SurveyResponse[] = [];
let messages: Message[] = [];

export function upsertSession(session: Session) {
  sessions.set(session.id, session);
  patients.set(session.patient.id, session.patient);
}

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function addTriage(record: TriageRecord) {
  triages.push(record);
}

export function listTriagesBySession(sessionId: string) {
  return triages.filter((t) => t.sessionId === sessionId);
}

export function addAppointment(appt: Appointment) {
  appointments.push(appt);
}

export function listAppointmentsBySession(sessionId: string) {
  return appointments.filter((a) => a.sessionId === sessionId);
}

export function addSurvey(response: SurveyResponse) {
  surveys.push(response);
}

export function listSurveysBySession(sessionId: string) {
  return surveys.filter((s) => s.sessionId === sessionId);
}

export function addMessage(msg: Message) {
  messages.push(msg);
}

export function listMessagesBySession(sessionId: string) {
  return messages
    .filter((m) => m.sessionId === sessionId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function listPortalOverview() {
  const allSessions = Array.from(sessions.values()).sort((a, b) => b.createdAt - a.createdAt);
  const totalPatients = patients.size;
  const totalTriages = triages.length;
  const avgSatisfaction = surveys.length
    ? surveys.reduce((s, r) => s + r.rating, 0) / surveys.length
    : 0;
  const upcomingAppointments = appointments
    .filter((a) => new Date(a.startIso).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime())
    .slice(0, 20);

  const conditionCounts: Record<string, number> = {};
  for (const t of triages) {
    if (t.diagnosis.likelihoods.length > 0) {
      const top = t.diagnosis.likelihoods[0].condition;
      conditionCounts[top] = (conditionCounts[top] || 0) + 1;
    }
  }

  return {
    totalPatients,
    totalTriages,
    avgSatisfaction,
    upcomingAppointments,
    sessions: allSessions,
    conditionCounts,
  };
}

export function generateAvailableSlots(daysAhead = 7, perDay = 6) {
  const slots: { startIso: string; endIso: string }[] = [];
  const now = new Date();
  for (let d = 0; d < daysAhead; d++) {
    for (let i = 0; i < perDay; i++) {
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + d,
        9 + i, // 9am onward hourly
        0,
        0,
        0
      );
      const end = new Date(start.getTime() + 45 * 60 * 1000);
      // filter out already-booked
      const taken = appointments.some((a) => a.startIso === start.toISOString());
      if (!taken && start.getTime() > Date.now()) {
        slots.push({ startIso: start.toISOString(), endIso: end.toISOString() });
      }
    }
  }
  return slots;
}

export function uuid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
