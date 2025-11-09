import OpenAI from "openai";
import { Diagnosis, TriageInput } from "@/lib/types";

const apiKey = process.env.OPENAI_API_KEY;
let client: OpenAI | null = null;
if (apiKey) {
  client = new OpenAI({ apiKey });
}

const SYSTEM_PROMPT = `You are an AI foot health practitioner for a footcare clinic.
You will assess patient's symptoms and provide a concise differential diagnosis (top 3),
with probabilities, urgency, and actionable recommendations.
Focus on common foot issues such as ingrown toenail, plantar fasciitis, athlete's foot,
bunions, blisters, corns/calluses, heel spurs, toenail fungus.
Be cautious: do not provide definitive diagnosis; advise seeing a clinician when needed.
`;

export async function getDiagnosisFromModel(input: TriageInput, patientAge: number): Promise<Diagnosis> {
  if (!client) {
    return ruleBasedDiagnosis(input, patientAge);
  }

  const userPrompt = `Patient age: ${patientAge}\nCategory: ${input.category}\nSymptoms: ${input.symptoms.join(", ")}\nDetails: ${input.details}\nDuration (days): ${input.durationDays ?? 'unknown'}\nPlease respond in JSON with keys: summary (string), urgency (one of emergency/urgent/routine), likelihoods (array of {condition, probability 0-1}), recommendations (array of string).`;

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
  });

  const content = completion.choices?.[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(content);
    return normalizeDiagnosis(parsed);
  } catch {
    // Fallback to rule-based if parsing fails
    return ruleBasedDiagnosis(input, patientAge);
  }
}

function normalizeDiagnosis(raw: any): Diagnosis {
  const likelihoods = Array.isArray(raw.likelihoods)
    ? raw.likelihoods
        .map((l: any) => ({
          condition: String(l.condition ?? "Unknown"),
          probability: Math.max(0, Math.min(1, Number(l.probability ?? 0))),
        }))
        .slice(0, 5)
    : [];
  const recs = Array.isArray(raw.recommendations)
    ? raw.recommendations.map((r: any) => String(r)).slice(0, 10)
    : [];
  const urgency: Diagnosis["urgency"] = ["emergency", "urgent", "routine"].includes(raw.urgency)
    ? raw.urgency
    : "routine";
  return {
    summary: String(raw.summary ?? "Assessment not available."),
    likelihoods: likelihoods.length
      ? likelihoods
      : [
          { condition: "Undifferentiated foot complaint", probability: 0.5 },
          { condition: "Soft tissue inflammation", probability: 0.3 },
          { condition: "Refer to clinician", probability: 0.2 },
        ],
    recommendations: recs.length ? recs : ["Monitor symptoms", "Book clinic assessment"],
    urgency,
  };
}

function ruleBasedDiagnosis(input: TriageInput, age: number): Diagnosis {
  const text = `${input.category} ${input.details} ${input.symptoms.join(" ")}`.toLowerCase();
  const likely: Array<{ condition: string; probability: number }> = [];
  const recs: string[] = [];
  let urgency: Diagnosis["urgency"] = "routine";

  if (text.includes("ingrown") || text.includes("paronychia") || text.includes("toenail pain")) {
    likely.push({ condition: "Ingrown toenail (onychocryptosis)", probability: 0.7 });
    recs.push(
      "Warm water soaks 2-3x/day",
      "Avoid tight footwear",
      "Topical antiseptic; book clinic for possible partial nail avulsion"
    );
  }
  if (text.includes("heel") && (text.includes("pain") || text.includes("sore"))) {
    likely.push({ condition: "Plantar fasciitis", probability: 0.6 });
    recs.push("Calf/plantar stretches", "Ice massage", "Heel cup orthotic");
  }
  if (text.includes("itch") && (text.includes("between toes") || text.includes("peeling"))) {
    likely.push({ condition: "Athlete's foot (tinea pedis)", probability: 0.6 });
    recs.push("Keep feet dry", "Topical antifungal 2-4 weeks");
  }
  if (text.includes("redness") && text.includes("swelling") && text.includes("fever")) {
    urgency = "urgent";
    recs.push("Seek urgent care to rule out cellulitis or infection");
  }

  if (likely.length === 0) {
    likely.push(
      { condition: "Mechanical foot pain", probability: 0.4 },
      { condition: "Skin/soft tissue irritation", probability: 0.3 },
      { condition: "Nail disorder", probability: 0.2 }
    );
    recs.push("Activity modification", "Supportive footwear", "Book clinic assessment");
  }

  const summary = `Most likely: ${likely[0].condition}. Consider others listed. Recommendations provided.`;
  return { summary, likelihoods: likely.slice(0, 3), recommendations: Array.from(new Set(recs)).slice(0, 6), urgency };
}
