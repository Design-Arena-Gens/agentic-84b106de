import { NextRequest, NextResponse } from "next/server";
import { addMessage, listMessagesBySession, uuid } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  return NextResponse.json({ messages: listMessagesBySession(sessionId) });
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, text } = (await req.json()) as { sessionId: string; text: string };
    if (!sessionId || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const msg = { id: uuid('msg'), sessionId, from: 'clinic' as const, text, createdAt: Date.now() };
    addMessage(msg);
    return NextResponse.json({ message: msg });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}
