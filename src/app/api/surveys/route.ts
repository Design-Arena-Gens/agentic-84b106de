import { NextRequest, NextResponse } from "next/server";
import { addSurvey, getSession, uuid } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, rating, feedback } = body as { sessionId: string; rating: number; feedback?: string };
    if (!sessionId || !rating) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const session = getSession(sessionId);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 404 });

    const survey = { id: uuid('survey'), sessionId, patientId: session.patient.id, rating, feedback, createdAt: Date.now() };
    addSurvey(survey);

    return NextResponse.json({ survey });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}
