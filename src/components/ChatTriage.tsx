"use client";

import { useEffect, useMemo, useState } from "react";
import { Diagnosis, Patient, TriageInput } from "@/lib/types";

function newSessionId() {
  return `sess_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
}

type ChatMessage = { from: "system" | "patient" | "ai"; text: string };

export default function ChatTriage() {
  const [sessionId] = useState<string>(() => newSessionId());
  const [patient, setPatient] = useState<Patient>({ id: `p_${Math.random().toString(36).slice(2, 8)}`, fullName: "", age: 30 });
  const [input, setInput] = useState<TriageInput>({ category: "Nail", details: "", symptoms: [], durationDays: undefined });
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "system", text: "Welcome to the Footcare Clinic. I'm your AI foot health assistant." },
  ]);
  const [userText, setUserText] = useState("");
  const [step, setStep] = useState<"collect" | "triage" | "book" | "survey" | "done">("collect");
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [loading, setLoading] = useState(false);

  function pushMessage(m: ChatMessage) {
    setMessages((prev) => [...prev, m]);
  }

  const canTriage = useMemo(() => patient.fullName && patient.age > 0 && input.details && input.category, [patient, input]);

  async function submitTriage() {
    setLoading(true);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, patient, input, messages }),
      });
      const data = await res.json();
      if (res.ok) {
        setDiagnosis(data.diagnosis);
        pushMessage({ from: "ai", text: data.diagnosis.summary });
        setStep("book");
      } else {
        pushMessage({ from: "system", text: `Error: ${data.error || "Unable to assess"}` });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 border rounded-xl p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-3">AI Triage Chat</h2>
        <div className="h-[380px] overflow-y-auto space-y-3 pb-2">
          {messages.map((m, idx) => (
            <div key={idx} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.from === "patient" ? "bg-blue-50 ml-auto" : m.from === "ai" ? "bg-green-50" : "bg-zinc-100"}`}>
              <span className="block text-xs text-zinc-500 mb-1">{m.from.toUpperCase()}</span>
              <span className="text-zinc-800 leading-relaxed whitespace-pre-wrap">{m.text}</span>
            </div>
          ))}
        </div>
        {step === "collect" && (
          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 border rounded-md px-3 py-2"
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="Describe your foot issue..."
            />
            <button
              className="px-3 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
              disabled={!userText}
              onClick={() => {
                pushMessage({ from: "patient", text: userText });
                setInput((i) => ({ ...i, details: i.details ? `${i.details}\n${userText}` : userText }));
                setUserText("");
              }}
            >
              Send
            </button>
          </div>
        )}
        {step === "triage" && (
          <div className="mt-3">
            <button
              className="px-4 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50"
              disabled={!canTriage || loading}
              onClick={submitTriage}
            >
              {loading ? "Assessing..." : "Get AI Assessment"}
            </button>
          </div>
        )}
        {step === "book" && diagnosis && <AppointmentScheduler sessionId={sessionId} onDone={() => setStep("survey")} />}
        {step === "survey" && <SatisfactionSurvey sessionId={sessionId} onDone={() => setStep("done")} />}
        {step === "done" && (
          <div className="mt-3 text-sm text-zinc-700">Thanks! Your details and bookings are sent to the clinic portal.</div>
        )}
      </div>

      <div className="md:col-span-1 border rounded-xl p-4 bg-white shadow-sm space-y-4">
        <h3 className="text-base font-semibold">Patient Details</h3>
        <div className="space-y-2">
          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="Full name"
            value={patient.fullName}
            onChange={(e) => setPatient((p) => ({ ...p, fullName: e.target.value }))}
          />
          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="Age"
            type="number"
            value={patient.age}
            onChange={(e) => setPatient((p) => ({ ...p, age: Number(e.target.value) }))}
          />
          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="Email (optional)"
            value={patient.email || ""}
            onChange={(e) => setPatient((p) => ({ ...p, email: e.target.value }))}
          />
          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="Phone (optional)"
            value={patient.phone || ""}
            onChange={(e) => setPatient((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Issue Category</label>
          <select
            className="w-full border rounded-md px-3 py-2 mt-1"
            value={input.category}
            onChange={(e) => setInput((i) => ({ ...i, category: e.target.value }))}
          >
            <option>Nail</option>
            <option>Skin</option>
            <option>Heel</option>
            <option>Forefoot</option>
            <option>Ankle</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Common Symptoms</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              "Pain",
              "Redness",
              "Swelling",
              "Itching",
              "Numbness",
              "Warmth",
              "Discharge",
              "Toenail pain",
            ].map((sym) => {
              const active = input.symptoms.includes(sym);
              return (
                <button
                  key={sym}
                  onClick={() =>
                    setInput((i) => ({
                      ...i,
                      symptoms: active ? i.symptoms.filter((s) => s !== sym) : [...i.symptoms, sym],
                    }))
                  }
                  className={`px-2 py-1 rounded-full border text-xs ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}
                >
                  {sym}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Duration (days)</label>
          <input
            className="w-full border rounded-md px-3 py-2 mt-1"
            type="number"
            min={0}
            value={input.durationDays ?? ""}
            onChange={(e) => setInput((i) => ({ ...i, durationDays: Number(e.target.value) }))}
          />
        </div>
        <button
          onClick={() => setStep("triage")}
          className="w-full mt-2 px-3 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50"
          disabled={!canTriage}
        >
          Proceed to AI Assessment
        </button>
      </div>
    </div>
  );
}

function AppointmentScheduler({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const [slots, setSlots] = useState<{ startIso: string; endIso: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      setSlots(data.slots || []);
      setLoading(false);
    })();
  }, []);

  async function book(slot: { startIso: string; endIso: string }, type: 'initial' | 'followup') {
    setBooking(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, startIso: slot.startIso, endIso: slot.endIso, type }),
      });
      const data = await res.json();
      if (res.ok) setBooked(data.appointment);
    } finally {
      setBooking(false);
    }
  }

  if (loading) return <div className="mt-3 text-sm">Loading slots...</div>;

  return (
    <div className="mt-4">
      <h4 className="font-semibold mb-2">Book an Appointment</h4>
      {!booked ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {slots.slice(0, 10).map((s) => (
            <div key={s.startIso} className="border rounded-md p-2 flex items-center justify-between">
              <div className="text-sm">
                <div>{new Date(s.startIso).toLocaleString()}</div>
                <div className="text-xs text-zinc-500">45 min</div>
              </div>
              <div className="flex gap-2">
                <button disabled={booking} onClick={() => book(s, 'initial')} className="px-2 py-1 rounded-md bg-blue-600 text-white text-xs">Book</button>
                <button disabled={booking} onClick={() => book(s, 'followup')} className="px-2 py-1 rounded-md bg-amber-600 text-white text-xs">Follow-up</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm space-y-2">
          <div className="text-emerald-700 font-medium">Booked: {new Date(booked.startIso).toLocaleString()} ({booked.type})</div>
          <button onClick={onDone} className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm">Continue to Satisfaction Survey</button>
        </div>
      )}
    </div>
  );
}

function SatisfactionSurvey({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, rating, feedback }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted)
    return (
      <div className="mt-3 text-sm space-y-2">
        <div>Thanks for your feedback!</div>
        <button onClick={onDone} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm">Finish</button>
      </div>
    );

  return (
    <div className="mt-4 space-y-2">
      <h4 className="font-semibold">Satisfaction Survey</h4>
      <div className="flex items-center gap-2">
        <span className="text-sm">Rating:</span>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((n) => (
            <button key={n} onClick={() => setRating(n)} className={`w-8 h-8 rounded-full border ${n <= rating ? 'bg-yellow-400' : 'bg-white'}`}>{n}</button>
          ))}
        </div>
      </div>
      <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} className="w-full border rounded-md p-2" rows={3} placeholder="Any comments?" />
      <button disabled={submitting} onClick={submit} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm">Submit</button>
    </div>
  );
}
