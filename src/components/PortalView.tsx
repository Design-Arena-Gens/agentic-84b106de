"use client";

import { useEffect, useMemo, useState } from "react";

type Overview = {
  totalPatients: number;
  totalTriages: number;
  avgSatisfaction: number;
  upcomingAppointments: { id: string; startIso: string; endIso: string; type: string; sessionId: string }[];
  sessions: { id: string; patient: { id: string; fullName: string; age: number; email?: string; phone?: string }; createdAt: number }[];
  conditionCounts: Record<string, number>;
};

export default function PortalView() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/portal");
      const data = await res.json();
      setOverview(data);
      setLoading(false);
    })();
  }, []);

  const chartData = useMemo(() => {
    if (!overview) return [] as Array<{ k: string; v: number }>;
    return Object.entries(overview.conditionCounts).map(([k, v]) => ({ k, v }));
  }, [overview]);

  async function sendMessage() {
    if (!selectedSession || !message) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSession, text: message }),
      });
      if (res.ok) setMessage("");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div>Loading portal...</div>;
  if (!overview) return <div>Error loading portal</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <section className="grid grid-cols-3 gap-4">
          <StatCard label="Patients" value={overview.totalPatients} />
          <StatCard label="Triages" value={overview.totalTriages} />
          <StatCard label="Avg Rating" value={Number(overview.avgSatisfaction).toFixed(1)} />
        </section>

        <section className="border rounded-xl bg-white p-4">
          <h3 className="font-semibold mb-2">Top Conditions</h3>
          {chartData.length === 0 ? (
            <div className="text-sm text-zinc-600">No data yet.</div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {chartData.map(({ k, v }) => (
                <div key={k} className="flex-1">
                  <div className="bg-blue-600 w-full" style={{ height: `${Math.max(8, v * 20)}px` }} />
                  <div className="text-xs mt-1 truncate" title={k}>{k}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border rounded-xl bg-white p-4">
          <h3 className="font-semibold mb-2">Upcoming Appointments</h3>
          <div className="divide-y">
            {overview.upcomingAppointments.length === 0 ? (
              <div className="text-sm text-zinc-600">No upcoming appointments</div>
            ) : (
              overview.upcomingAppointments.map((a) => (
                <div key={a.id} className="py-2 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-medium">{new Date(a.startIso).toLocaleString()}</div>
                    <div className="text-xs text-zinc-500">{a.type} ? Session {a.sessionId}</div>
                  </div>
                  <button onClick={() => setSelectedSession(a.sessionId)} className="text-blue-600 text-xs underline">Message</button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="md:col-span-1 space-y-6">
        <section className="border rounded-xl bg-white p-4">
          <h3 className="font-semibold mb-2">Sessions</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {overview.sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s.id)}
                className={`w-full text-left border rounded-md p-2 text-sm ${selectedSession === s.id ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}
              >
                <div className="font-medium">{s.patient.fullName || 'Unnamed Patient'}</div>
                <div className="text-xs text-zinc-500">Age {s.patient.age} ? {new Date(s.createdAt).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="border rounded-xl bg-white p-4">
          <h3 className="font-semibold mb-2">Patient Communication</h3>
          {selectedSession ? (
            <div className="space-y-2">
              <textarea
                className="w-full border rounded-md p-2 text-sm"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message to the patient..."
              />
              <button disabled={sending || !message} onClick={sendMessage} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm">Send</button>
            </div>
          ) : (
            <div className="text-sm text-zinc-600">Select a session to start messaging.</div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border rounded-xl bg-white p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
