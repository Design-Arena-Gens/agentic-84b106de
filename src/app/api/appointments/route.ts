import { NextRequest, NextResponse } from "next/server";
import { addAppointment, generateAvailableSlots, getSession, listAppointmentsBySession, uuid } from "@/lib/store";

export async function GET() {
  const slots = generateAvailableSlots();
  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, startIso, endIso, type, notes } = body as {
      sessionId: string;
      startIso: string;
      endIso: string;
      type: 'initial' | 'followup';
      notes?: string;
    };
    if (!sessionId || !startIso || !endIso || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const session = getSession(sessionId);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 404 });

    const appt = {
      id: uuid('appt'),
      sessionId,
      patientId: session.patient.id,
      startIso,
      endIso,
      type,
      notes,
      createdAt: Date.now(),
    };
    addAppointment(appt);

    return NextResponse.json({ appointment: appt, existing: listAppointmentsBySession(sessionId) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}
