import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { analyzeIncidentHeuristics, simulateGateFlows } from "./src/operations.ts";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it via the Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// In-Memory Database for Stadium Operations
interface Incident {
  id: string;
  location: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "DISPATCHED" | "RESOLVED";
  reportedBy: string;
  reportedAt: string;
  actionTaken?: string;
  assignedTeam?: string;
}

interface Announcement {
  id: string;
  timestamp: string;
  type: "INFO" | "CROWD" | "TRANSPORT" | "EMERGENCY";
  message: string;
  languages: { [lang: string]: string }; // e.g., { en: "...", es: "...", fr: "..." }
  isLive: boolean;
}

let incidents: Incident[] = [
  {
    id: "INC-001",
    location: "Gate B ticket scanner line 3",
    description: "Ticket scanner hardware offline. Congestion forming rapidly.",
    category: "Access Control",
    priority: "HIGH",
    status: "DISPATCHED",
    reportedBy: "Volunteer Maria S.",
    reportedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    assignedTeam: "Tech Support Team B",
  },
  {
    id: "INC-002",
    location: "Concourse Section 112",
    description: "Large liquid spill near the hot dog stand. Slipping hazard.",
    category: "Sanitation / Maintenance",
    priority: "MEDIUM",
    status: "OPEN",
    reportedBy: "Staff Officer James P.",
    reportedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    assignedTeam: "Cleaning Squad West",
  },
  {
    id: "INC-003",
    location: "Upper Concourse Ramp 4",
    description: "Wheelchair escort requested for an elderly fan from Gate C to Section 302.",
    category: "Accessibility Support",
    priority: "LOW",
    status: "RESOLVED",
    reportedBy: "Volunteer Kenji T.",
    reportedAt: new Date(Date.now() - 50 * 60000).toISOString(),
    actionTaken: "Assisted fan safely. Transport completed via elevator 2.",
    assignedTeam: "Mobility Support Team",
  }
];

let announcements: Announcement[] = [
  {
    id: "ANN-001",
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    type: "CROWD",
    message: "Attention fans: Gate C is currently experiencing light traffic. We recommend fans in zones 3 and 4 to utilize Gate C for faster entry.",
    languages: {
      en: "Attention fans: Gate C is currently experiencing light traffic. We recommend fans in zones 3 and 4 to utilize Gate C for faster entry.",
      es: "Atención aficionados: La Puerta C presenta tráfico ligero en este momento. Recomendamos a los aficionados de las zonas 3 y 4 que utilicen la Puerta C para un ingreso más rápido.",
      fr: "Attention supporters: La porte C est actuellement peu encombrée. Nous conseillons aux supporters des zones 3 et 4 de passer par la porte C pour entrer plus rapidement."
    },
    isLive: true,
  },
  {
    id: "ANN-002",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    type: "TRANSPORT",
    message: "NJ Transit outbound trains will begin operations immediately after the match. Please follow signs towards Lot E train platforms.",
    languages: {
      en: "NJ Transit outbound trains will begin operations immediately after the match. Please follow signs towards Lot E train platforms.",
      es: "Los trenes de salida de NJ Transit comenzarán a operar inmediatamente después del partido. Siga las señales hacia los andenes del lote E.",
      fr: "Les trains de départ NJ Transit commenceront à circuler immédiatement après le match. Veuillez suivre les indications vers les quais du parking E."
    },
    isLive: true,
  }
];

// Preconfigured crowd status & gate wait times
let crowdCongestionLevel = "NORMAL"; // NORMAL, PEAK, HEAVY
let gateWaitTimes = {
  GateA: { name: "Gate A (North)", waitTime: 12, status: "CLEAR", sensoryRoomNearby: false },
  GateB: { name: "Gate B (East - Main)", waitTime: 28, status: "BUSY", sensoryRoomNearby: true },
  GateC: { name: "Gate C (South)", waitTime: 8, status: "CLEAR", sensoryRoomNearby: true },
  GateD: { name: "Gate D (West - Express)", waitTime: 18, status: "MODERATE", sensoryRoomNearby: false }
};

// API ROUTES

// 1. Get stadium baseline info
app.get("/api/stadium/status", (req, res) => {
  res.json({
    stadiumName: "New York New Jersey Stadium (MetLife)",
    city: "East Rutherford, NJ, USA",
    capacity: "82,500",
    matchToday: "Argentina vs. France (Quarter-Finals - FIFA World Cup 2026)",
    crowdCongestionLevel,
    gateWaitTimes,
    concessionsWaitTimes: [
      { name: "Apex Burgers (Sec 114)", wait: "15 min", type: "Food", ecoFriendly: true },
      { name: "Verde Salads (Sec 122)", wait: "5 min", type: "Food", ecoFriendly: true },
      { name: "Copa Beverages (Sec 135)", wait: "8 min", type: "Drink", ecoFriendly: false },
      { name: "Gluten-Free Zone (Sec 103)", wait: "4 min", type: "Food / Accessibility", ecoFriendly: true },
    ],
    restroomsWaitTimes: [
      { location: "Sec 110 (Mens)", wait: "12 min", wheelchairAccessible: true },
      { location: "Sec 110 (Womens)", wait: "18 min", wheelchairAccessible: true },
      { location: "Sec 124 (Gender Neutral)", wait: "4 min", wheelchairAccessible: true },
      { location: "Sec 132 (Mens)", wait: "6 min", wheelchairAccessible: true },
      { location: "Sec 132 (Womens)", wait: "8 min", wheelchairAccessible: true },
    ]
  });
});

// Update crowd simulation status
app.post("/api/stadium/simulate-crowd", (req, res) => {
  const { level } = req.body;
  if (!["NORMAL", "PEAK", "HEAVY"].includes(level)) {
    return res.status(400).json({ error: "Invalid crowd level" });
  }
  crowdCongestionLevel = level;
  gateWaitTimes = simulateGateFlows(level as any) as any;
  res.json({ message: `Crowd density updated to ${level}`, gateWaitTimes });
});

// 2. Chat Assistant for Fans & Staff (Multilingual and context-aware)
app.post("/api/chat", async (req, res) => {
  const { messages, userRole } = req.body; // userRole: "FAN", "VOLUNTEER", "ORGANIZER"
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages array." });
  }

  try {
    const ai = getGeminiClient();
    const systemPrompt = `You are a world-class AI Assistant operating inside the "FIFA World Cup 2026 Stadium Hub" for MetLife Stadium (N.Y./N.J. Stadium).
Your role is to assist ${userRole === "FAN" ? "fans attending the game" : userRole === "VOLUNTEER" ? "stadium volunteers" : "venue operations staff"}.

STADIUM INFO & FAQ:
- Venue: New York New Jersey Stadium (MetLife Stadium), East Rutherford, NJ. Capacity: 82,500.
- Todays Match: Argentina vs France (Quarter-Finals, FIFA World Cup 2026).
- Gates:
  * Gate A (North): Closest to NJ Transit Rail Station. Good for general entry.
  * Gate B (East): Main gate, near Fan Plaza. Often very busy.
  * Gate C (South): Near Coach Bus Loops and accessible drop-off. Best for wheelchair/stroller assistance.
  * Gate D (West): Quickest security lines, closest to Lot G.
- Transportation:
  * Train: NJ Transit Meadowlands Rail Line connects directly to Secaucus Junction. Trains run continuously pre and post game.
  * Bus: Meadowlands Express Shuttle buses run from Port Authority Bus Terminal (NYC) directly to Bus Lot A.
  * Rideshare: Designated pickup/drop-off is strictly in LOT E. Taxis in Lot D.
  * Sustainability: Clean Green paths have solar-powered lights. Walking to train platform is highly encouraged!
- Accessibility:
  * Wheelchair escorts available from any gate.
  * Sensory Rooms: Section 215 and Section 330. Accessible elevators are adjacent to Section 104 and 124.
- Sustainability:
  * Zero-waste sorting: Blue bins for recycling, green for compost, black for landfill.
  * Cup-return program: Bring reusable World Cup cups back to recycling hubs for a $2 discount on future concessions.

CROWD DATA (REAL-TIME):
- Current general stadium state: Crowd Congestion level is ${crowdCongestionLevel}.
- Gate Wait Times: Gate A is ${gateWaitTimes.GateA.waitTime} min, Gate B is ${gateWaitTimes.GateB.waitTime} min, Gate C is ${gateWaitTimes.GateC.waitTime} min, Gate D is ${gateWaitTimes.GateD.waitTime} min.

RULES:
1. Provide extremely accurate, helpful, polite responses.
2. Be highly multilingual. If the user greets or asks a question in Spanish, French, German, Japanese, Portuguese, Arabic, or any language, answer immediately and fluently in that language!
3. Keep answers relatively concise and easy to read on mobile devices, using bullet points for directions.
4. Incorporate sustainability and accessibility tips where relevant (e.g., recommend low-wait restrooms, public transport options, sensory rooms).`;

    // Map history to parts format
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini API Chat Error:", error);
    res.json({ 
      reply: `[Demo Mode Notice: Gemini AI Key is missing or failed] I can still assist you! You are currently at MetLife Stadium for the Argentina vs. France match. Let me know if you need info about gates (Gate C is shortest with ${gateWaitTimes.GateC.waitTime} min wait), trains, or accessible seating (elevators at Sec 104/124).`,
      error: error.message 
    });
  }
});

// 3. Incident Management Endpoints
app.get("/api/incidents", (req, res) => {
  res.json(incidents);
});

// AI analysis of a reported incident
app.post("/api/incidents", async (req, res) => {
  const { location, description, reportedBy } = req.body;
  if (!location || !description) {
    return res.status(400).json({ error: "Location and description are required." });
  }

  let category = "General Operations";
  let priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "MEDIUM";
  let assignedTeam = "General Venue Crew";
  let aiAction = "Deploy standard operations crew to inspect location.";

  try {
    const ai = getGeminiClient();
    const prompt = `Analyze this stadium operational issue reported by a FIFA World Cup volunteer/staff member:
Location: "${location}"
Issue: "${description}"

Generate a structured JSON output specifying:
1. "category": Choose from ["Access Control", "Crowd Control", "Security Threat", "Medical Emergency", "Sanitation / Maintenance", "Accessibility Support", "Technical / IT", "Concessions Outage"]
2. "priority": Choose from ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
3. "assignedTeam": A relevant specific response team (e.g., "Medical Rapid Response", "IT Field Support Unit C", "Gate Crowd Officers", "Sanitation Crew Zone 4")
4. "recommendedAction": A concise action plan for dispatchers.

Output MUST be strictly JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            priority: { type: Type.STRING },
            assignedTeam: { type: Type.STRING },
            recommendedAction: { type: Type.STRING }
          },
          required: ["category", "priority", "assignedTeam", "recommendedAction"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    if (result.category) category = result.category;
    if (result.priority && ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(result.priority.toUpperCase())) {
      priority = result.priority.toUpperCase() as any;
    }
    if (result.assignedTeam) assignedTeam = result.assignedTeam;
    if (result.recommendedAction) aiAction = result.recommendedAction;
  } catch (error) {
    console.error("Gemini Incident Analysis Failed. Using heuristics.", error);
    const fallback = analyzeIncidentHeuristics(description);
    category = fallback.category;
    priority = fallback.priority;
    assignedTeam = fallback.assignedTeam;
    aiAction = fallback.aiAction;
  }

  const newIncident: Incident = {
    id: `INC-${String(incidents.length + 1).padStart(3, "0")}`,
    location,
    description,
    category,
    priority,
    status: "OPEN",
    reportedBy: reportedBy || "Staff Reporter",
    reportedAt: new Date().toISOString(),
    assignedTeam,
    actionTaken: aiAction
  };

  incidents.unshift(newIncident);
  res.json(newIncident);
});

// Update incident status
app.post("/api/incidents/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, actionTaken } = req.body;
  const incident = incidents.find((inc) => inc.id === id);
  if (!incident) {
    return res.status(404).json({ error: "Incident not found" });
  }
  if (status) incident.status = status;
  if (actionTaken) incident.actionTaken = actionTaken;
  res.json(incident);
});

// 4. Stadium Announcements Endpoints
app.get("/api/announcements", (req, res) => {
  res.json(announcements);
});

// Create AI Announcement (Translate/format beautifully into 3 languages)
app.post("/api/announcements", async (req, res) => {
  const { prompt, type } = req.body; // type: INFO, CROWD, TRANSPORT, EMERGENCY
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required to generate announcements." });
  }

  let languages: { [key: string]: string } = {
    en: prompt,
    es: prompt,
    fr: prompt
  };

  try {
    const ai = getGeminiClient();
    const gPrompt = `Create a professional stadium-wide public address announcement based on this draft instruction:
"${prompt}"

Produce a structured JSON output with translations in English ("en"), Spanish ("es"), and French ("fr").
The style should be formal, clear, and reassuring, suitable for standard stadium audio or digital board screens during a FIFA World Cup 2026 match.

Output format:
{
  "en": "Formatted English announcement",
  "es": "Formatted Spanish announcement",
  "fr": "Formatted French announcement"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: gPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            en: { type: Type.STRING },
            es: { type: Type.STRING },
            fr: { type: Type.STRING }
          },
          required: ["en", "es", "fr"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    if (parsed.en) languages = parsed;
  } catch (error) {
    console.error("Gemini Announcement translation failed. Using basic text.", error);
    languages = {
      en: prompt,
      es: `[Español] ${prompt}`,
      fr: `[Français] ${prompt}`
    };
  }

  const newAnnouncement: Announcement = {
    id: `ANN-${String(announcements.length + 1).padStart(3, "0")}`,
    timestamp: new Date().toISOString(),
    type: type || "INFO",
    message: languages.en,
    languages,
    isLive: true
  };

  announcements.unshift(newAnnouncement);
  res.json(newAnnouncement);
});

// 5. Decision Support System for Venue Managers
app.post("/api/decision-support", async (req, res) => {
  const { scenarioQuery } = req.body;
  if (!scenarioQuery) {
    return res.status(400).json({ error: "Scenario query is required." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are the Lead Crowd Management and Venue Safety Advisor for the FIFA World Cup 2026.
The Venue Manager is facing a real-time dilemma and needs immediate, highly professional, actionable decision support.

CURRENT STADIUM DATA SUMMARY:
- Venue: MetLife Stadium, NY/NJ
- Crowd Congestion: ${crowdCongestionLevel}
- Gate Wait Times: Gate A: ${gateWaitTimes.GateA.waitTime}m, Gate B: ${gateWaitTimes.GateB.waitTime}m, Gate C: ${gateWaitTimes.GateC.waitTime}m, Gate D: ${gateWaitTimes.GateD.waitTime}m
- Active Incidents Count: ${incidents.filter(i => i.status !== "RESOLVED").length} open incidents.

VENUE MANAGER'S EMERGENCY QUERY:
"${scenarioQuery}"

Formulate a concise operational guidance report. Structure the response into the following parts:
1. **Critical Assessment**: Analyze why this is happening and the immediate risk to crowd safety, transport, or venue access.
2. **Immediate Directive Actions (Next 15-30 mins)**: High-priority bullet points of exactly what to order stadium volunteers, police, security, and gate staffs to do.
3. **Multilingual PA Announcement Recommendation**: A draft message to immediately flash on stadium screens and play on speakers to guide fans safely.
4. **Post-Incident Recovery Plan**: Brief long-term strategy for the rest of the game.

Keep the advice practical, authoritative, and direct.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.6,
      }
    });

    res.json({ advice: response.text });
  } catch (error: any) {
    console.error("Gemini Decision Support Error:", error);
    res.json({
      advice: `### ⚠️ [Demo Mode Guidance]
**Critical Assessment:**
Due to high-priority stadium activities, we must maintain security lines and balance traffic across gates.

**Immediate Directives:**
- Re-route incoming fans from Gate B (currently ${gateWaitTimes.GateB.waitTime} minutes) to Gate C (currently ${gateWaitTimes.GateC.waitTime} minutes).
- Deploy 10 additional volunteers with handheld megaphones to direct pedestrian flow.
- Coordinate with NJ Transit dispatcher to hold standard train boarding until concourse clears.

**Recommended Public Announcement (English & Spanish):**
"Attention fans: Gate C is open and has zero wait time. Please proceed to Gate C for instant entry." / "Atención: La Puerta C está vacía. Por favor diríjase a la Puerta C."`,
      error: error.message
    });
  }
});


// Serve static files in production or run Vite dev server in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FIFA World Cup 2026 Stadium Hub Server running on http://localhost:${PORT}`);
  });
}

startServer();
