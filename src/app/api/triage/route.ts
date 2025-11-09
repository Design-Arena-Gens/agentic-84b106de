import { NextRequest, NextResponse } from "next/server";
import { getDiagnosisFromModel } from "@/lib/openai";
import { Diagnosis, Patient, TriageInput } from "@/lib/types";
import { addMessage, addTriage, getSession, listMessagesBySession, upsertSession, uuid } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      patient,
      input,
      messages,
    }: { sessionId: string; patient: Patient; input: TriageInput; messages?: { from: string; text: string }[] } = body;

    if (!sessionId || !patient || !input) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = getSession(sessionId);
    if (!existing) {
      upsertSession({ id: sessionId, patient, createdAt: Date.now() });
    }

    // persist incoming messages
    if (Array.isArray(messages)) {
      for (const m of messages) {
        addMessage({ id: uuid("msg"), sessionId, from: m.from === "patient" ? "patient" : "clinic", text: m.text, createdAt: Date.now() });
      }
    }

    const diagnosis: Diagnosis = await getDiagnosisFromModel(input, patient.age);

    addMessage({ id: uuid("msg"), sessionId, from: "ai", text: diagnosis.summary, createdAt: Date.now() });

    const recordId = uuid("triage");
    addTriage({ id: recordId, sessionId, patientId: patient.id, input, diagnosis, createdAt: Date.now() });

    return NextResponse.json({ diagnosis, recordId, history: listMessagesBySession(sessionId) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
