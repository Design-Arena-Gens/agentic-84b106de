import { NextResponse } from "next/server";
import { listAppointmentsBySession, listMessagesBySession, listPortalOverview, listSurveysBySession, listTriagesBySession } from "@/lib/store";

export async function GET() {
  const overview = listPortalOverview();
  return NextResponse.json(overview);
}
