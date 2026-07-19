import React, { useState, useEffect, useRef } from "react";
import { 
  Compass, 
  MapPin, 
  Users, 
  ShieldAlert, 
  Volume2, 
  CheckCircle, 
  HelpCircle, 
  Send, 
  User, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  PlusCircle, 
  TramFront, 
  Bus, 
  Eye, 
  HeartHandshake, 
  Shield, 
  Leaf, 
  Clock, 
  Info,
  Sliders,
  ChevronRight,
  TrendingUp,
  Award,
  Zap
} from "lucide-react";
import { StadiumStatus, Incident, Announcement, ChatMessage, Gate } from "./types.ts";
import StadiumMap from "./components/StadiumMap.tsx";
import { calculateAverageWaitTime, getPriorityBadgeColor, filterConcessions } from "./utils.ts";

export default function App() {
  // Current Active Role
  const [activeRole, setActiveRole] = useState<"FAN" | "VOLUNTEER" | "ORGANIZER">("FAN");

  // Stadium & Operations State
  const [stadiumStatus, setStadiumStatus] = useState<StadiumStatus | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedGateKey, setSelectedGateKey] = useState<string>("GateC");
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Chat Widget State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Welcome to the FIFA World Cup 2026 Stadium Companion! Ask me anything about transportation, gate wait times, zero-waste guidelines, sensory rooms, or elevator locations.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Incident reporting form
  const [incLocation, setIncLocation] = useState("");
  const [incDescription, setIncDescription] = useState("");
  const [incReporter, setIncReporter] = useState("");
  const [reportingIncident, setReportingIncident] = useState(false);

  // Announcement draft form
  const [annDraft, setAnnDraft] = useState("");
  const [annType, setAnnType] = useState<"INFO" | "CROWD" | "TRANSPORT" | "EMERGENCY">("INFO");
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  // Decision Support query
  const [decisionQuery, setDecisionQuery] = useState("");
  const [decisionResponse, setDecisionResponse] = useState<string>("");
  const [decisionLoading, setDecisionLoading] = useState(false);

  // Filter keys
  const [concessionsFilter, setConcessionsFilter] = useState<"ALL" | "ECO" | "ACCESSIBILITY">("ALL");

  // Initial Data Fetching
  useEffect(() => {
    fetchStadiumData();
    fetchIncidents();
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    // Scroll to bottom of chat whenever messages change
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchStadiumData = async () => {
    try {
      const res = await fetch("/api/stadium/status");
      const data = await res.json();
      setStadiumStatus(data);
    } catch (e) {
      console.error("Failed to load stadium status", e);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch("/api/incidents");
      const data = await res.json();
      setIncidents(data);
    } catch (e) {
      console.error("Failed to load incidents", e);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      setAnnouncements(data);
    } catch (e) {
      console.error("Failed to load announcements", e);
    }
  };

  // Change crowd density simulation state
  const handleSimulateCrowd = async (level: "NORMAL" | "PEAK" | "HEAVY") => {
    try {
      const res = await fetch("/api/stadium/simulate-crowd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level })
      });
      const data = await res.json();
      if (stadiumStatus) {
        setStadiumStatus({
          ...stadiumStatus,
          crowdCongestionLevel: level,
          gateWaitTimes: data.gateWaitTimes
        });
      }
    } catch (e) {
      console.error("Failed to simulate crowd level", e);
    }
  };

  // Submit dynamic incident
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incLocation || !incDescription) return;

    setReportingIncident(true);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: incLocation,
          description: incDescription,
          reportedBy: incReporter || "Staff / Volunteer"
        })
      });
      const data = await res.json();
      setIncidents((prev) => [data, ...prev]);
      setIncLocation("");
      setIncDescription("");
      setIncReporter("");
      
      // Auto-switch back to incidents tab view
    } catch (e) {
      console.error("Failed to report incident", e);
    } finally {
      setReportingIncident(false);
    }
  };

  // Update incident status
  const handleResolveIncident = async (id: string, solutionText: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          actionTaken: solutionText
        })
      });
      const updated = await res.json();
      setIncidents((prev) => prev.map((inc) => (inc.id === id ? updated : inc)));
    } catch (e) {
      console.error("Failed to resolve incident", e);
    }
  };

  // Dispatch incident
  const handleDispatchIncident = async (id: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DISPATCHED"
        })
      });
      const updated = await res.json();
      setIncidents((prev) => prev.map((inc) => (inc.id === id ? updated : inc)));
    } catch (e) {
      console.error("Failed to dispatch incident", e);
    }
  };

  // Publish dynamic translated announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annDraft) return;

    setCreatingAnnouncement(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: annDraft,
          type: annType
        })
      });
      const data = await res.json();
      setAnnouncements((prev) => [data, ...prev]);
      setAnnDraft("");
    } catch (e) {
      console.error("Failed to create announcement", e);
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  // Submit AI Decision Support emergency scenario query
  const handleSubmitDecisionSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionQuery) return;

    setDecisionLoading(true);
    setDecisionResponse("");
    try {
      const res = await fetch("/api/decision-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioQuery: decisionQuery })
      });
      const data = await res.json();
      setDecisionResponse(data.advice);
    } catch (e) {
      console.error("Failed to fetch decision support", e);
      setDecisionResponse("Could not contact the decision-support system. Please verify API configuration.");
    } finally {
      setDecisionLoading(false);
    }
  };

  // Send message to AI Companion
  const handleSendChat = async (textToSend?: string) => {
    const finalMsg = textToSend || chatInput;
    if (!finalMsg.trim()) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: finalMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");
    setChatLoading(true);

    try {
      const payloadMessages = [...chatMessages, userMsg].map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          userRole: activeRole
        })
      });
      const data = await res.json();

      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (e) {
      console.error("Chat error", e);
    } finally {
      setChatLoading(false);
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case "EMERGENCY": return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case "CROWD": return <Users className="w-4 h-4 text-amber-400" />;
      case "TRANSPORT": return <TramFront className="w-4 h-4 text-sky-400" />;
      default: return <Info className="w-4 h-4 text-emerald-400" />;
    }
  };

  const filteredConcessions = filterConcessions(
    stadiumStatus?.concessionsWaitTimes || [],
    concessionsFilter
  );

  return (
    <div id="root-viewport" className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Visual Header Banner */}
      <div className="relative border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-slate-950 p-2.5 rounded-xl font-display font-black text-xl tracking-tighter flex items-center justify-center shadow-lg shadow-emerald-500/15">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25 font-semibold">
                  FIFA World Cup 2026
                </span>
                <span className="text-slate-500 text-xxs font-mono">STADIUM SMART HUB</span>
              </div>
              <h1 className="text-lg font-display font-bold text-white tracking-tight mt-0.5">
                New York New Jersey Stadium Operations
              </h1>
            </div>
          </div>

          {/* Role Navigator Selector */}
          <div className="flex bg-slate-950 border border-slate-800 p-1.5 rounded-xl w-full md:w-auto" role="tablist" aria-label="Stadium Hub Role Selection">
            <button
              id="tab-fan"
              role="tab"
              aria-selected={activeRole === "FAN"}
              aria-controls="panel-fan"
              aria-label="Switch to Fan Hub view"
              onClick={() => setActiveRole("FAN")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium font-display transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                activeRole === "FAN" 
                  ? "bg-slate-800 text-white shadow-md border border-slate-700/50" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span aria-hidden="true">🎫</span> Fan Hub
            </button>
            <button
              id="tab-volunteer"
              role="tab"
              aria-selected={activeRole === "VOLUNTEER"}
              aria-controls="panel-volunteer"
              aria-label="Switch to Volunteer Portal view"
              onClick={() => setActiveRole("VOLUNTEER")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium font-display transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                activeRole === "VOLUNTEER" 
                  ? "bg-slate-800 text-white shadow-md border border-slate-700/50" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span aria-hidden="true">🙋</span> Volunteer Portal
            </button>
            <button
              id="tab-organizer"
              role="tab"
              aria-selected={activeRole === "ORGANIZER"}
              aria-controls="panel-organizer"
              aria-label="Switch to Commander Center view"
              onClick={() => setActiveRole("ORGANIZER")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium font-display transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                activeRole === "ORGANIZER" 
                  ? "bg-slate-800 text-white shadow-md border border-slate-700/50" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span aria-hidden="true">👔</span> Commander Center
            </button>
          </div>

        </div>
      </div>

      {/* Matchday Quick KPIs Ribbon */}
      <div className="bg-slate-900 border-b border-slate-800/60 py-3 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-slate-300 font-sans font-semibold">Live Quarter-Final:</span>
            <span className="text-slate-100">ARGENTINA vs. FRANCE</span>
            <span className="text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-xxs">74' 2-1</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-400">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Att.: <strong className="text-white">81,450 / 82,500</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span>Cup Return rate: <strong className="text-white">74% 🌱</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Avg Gate Wait: <strong className="text-white">
                {stadiumStatus ? calculateAverageWaitTime(stadiumStatus.gateWaitTimes) : "--"} mins
              </strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dynamic Warning Notification if any Emergency is live */}
        {announcements.some(a => a.type === "EMERGENCY" && a.isLive) && (
          <div className="mb-6 bg-rose-950/40 border border-rose-800/50 p-4 rounded-xl flex items-start gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xxs font-mono tracking-widest text-rose-400 font-bold block uppercase">STADIUM FLASH BROADCAST</span>
              <p className="text-xs text-rose-200 font-medium mt-1">
                {announcements.find(a => a.type === "EMERGENCY" && a.isLive)?.message}
              </p>
              <div className="flex gap-4 mt-2">
                <button 
                  onClick={() => handleSendChat("Spanish translation of active emergency warning")}
                  className="text-rose-300 hover:text-white underline text-[10px] font-mono cursor-pointer"
                >
                  [Español]
                </button>
                <button 
                  onClick={() => handleSendChat("French translation of active emergency warning")}
                  className="text-rose-300 hover:text-white underline text-[10px] font-mono cursor-pointer"
                >
                  [Français]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ROLE 1: FAN COMPANION */}
        {activeRole === "FAN" && (
          <div role="tabpanel" id="panel-fan" aria-labelledby="tab-fan" className="space-y-6">
            
            {/* Intro text */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                  Your Smart Stadium Guide
                </h2>
                <p className="text-sm text-slate-400 max-w-2xl">
                  Real-time crowds, zero-wait navigation, and instant smart help. Designed to make your FIFA World Cup experience accessible, sustainable, and smooth.
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-mono font-bold">
                <Leaf className="w-4 h-4" /> Eco Cup-Return program active!
              </div>
            </div>

            {/* Core Interactive Section */}
            <StadiumMap 
              gateWaitTimes={stadiumStatus?.gateWaitTimes || {}}
              onSelectGate={(key) => setSelectedGateKey(key)}
              selectedGateKey={selectedGateKey}
            />

            {/* Bento details grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Concessions Wait times & Eco highlights */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-display font-bold text-white text-base">Wait Times & Dining</h3>
                      <p className="text-xs text-slate-400">Avoid the halftime crowds & explore eco eats</p>
                    </div>
                    <Sliders className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Dining filter pills */}
                  <div className="flex gap-2 mb-4 text-[10px] font-mono" role="group" aria-label="Filter concessions">
                    <button 
                      onClick={() => setConcessionsFilter("ALL")}
                      aria-pressed={concessionsFilter === "ALL"}
                      className={`px-2.5 py-1 rounded border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                        concessionsFilter === "ALL" 
                          ? "bg-slate-800 text-white border-slate-700" 
                          : "text-slate-500 border-transparent hover:text-slate-300"
                      }`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setConcessionsFilter("ECO")}
                      aria-pressed={concessionsFilter === "ECO"}
                      className={`px-2.5 py-1 rounded border transition-colors flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                        concessionsFilter === "ECO" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "text-slate-500 border-transparent hover:text-slate-300"
                      }`}
                    >
                      <Leaf className="w-3 h-3" aria-hidden="true" /> Zero-Waste
                    </button>
                    <button 
                      onClick={() => setConcessionsFilter("ACCESSIBILITY")}
                      aria-pressed={concessionsFilter === "ACCESSIBILITY"}
                      className={`px-2.5 py-1 rounded border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                        concessionsFilter === "ACCESSIBILITY" 
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/20" 
                          : "text-slate-500 border-transparent hover:text-slate-300"
                      }`}
                    >
                      Accessible
                    </button>
                  </div>

                  <div className="space-y-3">
                    {filteredConcessions?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800/60 hover:border-slate-800 transition-all duration-150">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-slate-200 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            {item.type}
                            {item.ecoFriendly && (
                              <span className="text-emerald-400 text-xxs font-mono bg-emerald-500/5 px-1.5 py-0.2 rounded border border-emerald-500/10 flex items-center gap-0.5">
                                <Leaf className="w-2.5 h-2.5" /> Eco
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                          {item.wait}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 text-[10px] text-slate-400 leading-relaxed font-sans">
                  🌱 <strong>Tip:</strong> Earn a $2 voucher on your match ticket by returning cups to composting bins near Section 122!
                </div>
              </div>

              {/* Chat companion with predefined prompts */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:col-span-2 flex flex-col h-[460px]">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800/60">
                  <div>
                    <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Multilingual Fan Assistant
                    </h3>
                    <p className="text-xs text-slate-400">Instant AI response about seating, transit, accessibility and safety</p>
                  </div>
                  <div className="flex gap-2 text-xxs font-mono">
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">EN</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded">ES</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded">FR</span>
                  </div>
                </div>

                {/* Messages feed */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
                  {chatMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                        msg.role === "user" ? "bg-slate-800 text-emerald-400" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {msg.role === "user" ? "U" : "AI"}
                      </div>
                      
                      <div className="space-y-1">
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.role === "user" 
                            ? "bg-emerald-500/10 text-slate-200 border border-emerald-500/20 rounded-tr-none" 
                            : "bg-slate-950 text-slate-300 border border-slate-800/60 rounded-tl-none"
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block pl-1">{msg.timestamp}</span>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-3 mr-auto items-center">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-bold animate-pulse">
                        ...
                      </div>
                      <span className="text-xxs font-mono text-slate-500 animate-pulse">Assistant is typing...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Predefined helpful prompt buttons */}
                <div className="flex flex-wrap gap-2 py-2.5 border-t border-slate-800/60" role="group" aria-label="Quick questions">
                  <button 
                    onClick={() => handleSendChat("Where is public transit to NYC and how do I board?")}
                    className="text-xxs px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-lg text-slate-300 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:border-transparent"
                  >
                    🚇 Train to NYC?
                  </button>
                  <button 
                    onClick={() => handleSendChat("Where are the Sensory Rooms and quiet zones in MetLife?")}
                    className="text-xxs px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-lg text-slate-300 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:border-transparent"
                  >
                    🧩 Sensory Haven info
                  </button>
                  <button 
                    onClick={() => handleSendChat("¿Dónde están los baños con acceso de silla de ruedas?")}
                    className="text-xxs px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-lg text-slate-300 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:border-transparent"
                  >
                    🇪🇸 Baños accesibles?
                  </button>
                  <button 
                    onClick={() => handleSendChat("How does the reusable cup return discount work?")}
                    className="text-xxs px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-lg text-slate-300 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:border-transparent"
                  >
                    🌱 Eco Cup Reward?
                  </button>
                </div>

                {/* Chat input form */}
                <div className="flex gap-2">
                  <input
                    id="chat-input"
                    type="text"
                    aria-label="Ask the stadium fan assistant a question"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Ask about elevators, rideshares, food menus, or Spanish help..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-400"
                  />
                  <button
                    onClick={() => handleSendChat()}
                    aria-label="Send message to assistant"
                    className="p-2.5 bg-emerald-500 text-slate-950 rounded-xl font-bold hover:bg-emerald-400 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}


        {/* ROLE 2: VOLUNTEER HUB */}
        {activeRole === "VOLUNTEER" && (
          <div role="tabpanel" id="panel-volunteer" aria-labelledby="tab-volunteer" className="space-y-6">
            
            {/* Intro Header */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-400" />
                    Volunteer Deployment Dashboard
                  </h2>
                  <p className="text-sm text-slate-400">
                    Submit crowd, maintenance, or medical observations. Our real-time Gemini AI will classify and route them to appropriate responder units.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-800/80 p-2 rounded-lg font-mono">
                  Active Volunteer ID: <span className="text-emerald-400 font-bold">FIFA-VOL-2026-99</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Report New Incident Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-display font-bold text-white text-base mb-1 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-400" />
                  Report Field Incident
                </h3>
                <p className="text-xs text-slate-400 mb-5">AI-Powered routing. No triage training required.</p>

                <form onSubmit={handleReportIncident} className="space-y-4">
                  <div>
                    <label htmlFor="inc-reporter" className="text-xxs font-mono text-slate-400 uppercase tracking-wider block mb-1">YOUR NAME / ID</label>
                    <input
                      id="inc-reporter"
                      type="text"
                      required
                      value={incReporter}
                      onChange={(e) => setIncReporter(e.target.value)}
                      placeholder="Volunteer Kenji T."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="inc-location" className="text-xxs font-mono text-slate-400 uppercase tracking-wider block mb-1">SPECIFIC LOCATION</label>
                    <input
                      id="inc-location"
                      type="text"
                      required
                      value={incLocation}
                      onChange={(e) => setIncLocation(e.target.value)}
                      placeholder="Concourse near Section 112 hot dog stand"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label htmlFor="inc-description" className="text-xxs font-mono text-slate-400 uppercase tracking-wider block mb-1">WHAT IS HAPPENING?</label>
                    <textarea
                      id="inc-description"
                      required
                      rows={4}
                      value={incDescription}
                      onChange={(e) => setIncDescription(e.target.value)}
                      placeholder="e.g., ticket barcode scanner went black and turned off. 20+ fans are backlog in line 4. Need a technician."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reportingIncident}
                    className="w-full py-2.5 bg-emerald-500 text-slate-950 rounded-xl font-bold font-display text-xs hover:bg-emerald-400 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {reportingIncident ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        AI Routing in Progress...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Submit with Gemini AI Dispatch
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Active Incidents Feed */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-display font-bold text-white text-base">Active Operations Log</h3>
                    <p className="text-xs text-slate-400">Dispatched units and crowd safety priorities</p>
                  </div>
                  <button 
                    onClick={fetchIncidents}
                    className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                  {incidents.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs font-mono">
                      No stadium incidents reported. Standard operations are green.
                    </div>
                  ) : (
                    incidents.map((inc) => (
                      <div 
                        key={inc.id} 
                        className={`p-4 bg-slate-950 border rounded-xl relative transition-all duration-200 ${
                          inc.status === "RESOLVED" 
                            ? "border-slate-800/40 opacity-75" 
                            : inc.status === "DISPATCHED"
                            ? "border-amber-500/20"
                            : "border-rose-500/30 shadow-lg shadow-rose-500/[0.02]"
                        }`}
                      >
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-bold">
                              {inc.id}
                            </span>
                            <span className="text-[10px] font-mono font-medium text-slate-300">
                              {inc.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border ${getPriorityBadgeColor(inc.priority)}`}>
                              {inc.priority}
                            </span>
                            <span className={`text-[10px] font-mono font-bold ${
                              inc.status === "RESOLVED" 
                                ? "text-emerald-400" 
                                : inc.status === "DISPATCHED" 
                                ? "text-amber-400 animate-pulse" 
                                : "text-rose-400 animate-pulse"
                            }`}>
                              ● {inc.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-white font-medium mb-1">{inc.location}</p>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">{inc.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-900 text-xxs font-mono">
                          <div>
                            <span className="text-slate-500 block uppercase">REPORTED BY</span>
                            <span className="text-slate-300 font-semibold">{inc.reportedBy}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase">ASSIGNED TEAM</span>
                            <span className="text-emerald-400 font-semibold">{inc.assignedTeam || "Awaiting dispatch"}</span>
                          </div>
                        </div>

                        {inc.actionTaken && (
                          <div className="mt-3 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xxs leading-relaxed">
                            <span className="text-emerald-400 font-bold uppercase block font-mono mb-0.5">AI DIRECTIVE / SOLUTION:</span>
                            <span className="text-slate-300">{inc.actionTaken}</span>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-900/40">
                          {inc.status === "OPEN" && (
                            <button
                              onClick={() => handleDispatchIncident(inc.id)}
                              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black font-semibold text-xxs rounded transition-colors cursor-pointer"
                            >
                              Dispatch Team
                            </button>
                          )}
                          {inc.status !== "RESOLVED" && (
                            <button
                              onClick={() => {
                                const solution = prompt("Describe the resolution or action taken:") || "Resolved by volunteer.";
                                handleResolveIncident(inc.id, solution);
                              }}
                              className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black font-semibold text-xxs rounded transition-colors cursor-pointer"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}


        {/* ROLE 3: ORGANIZER COMMAND CENTRE */}
        {activeRole === "ORGANIZER" && (
          <div role="tabpanel" id="panel-organizer" aria-labelledby="tab-organizer" className="space-y-6">
            
            {/* Command Header */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400 animate-pulse" />
                  Tactical Stadium Commander
                </h2>
                <p className="text-sm text-slate-400">
                  Global parameters, real-time public broadcasts, crowd simulation, and AI strategic advisors.
                </p>
              </div>

              {/* Dynamic Crowd Simulation Controls */}
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center gap-3">
                <span className="text-xxs font-mono text-slate-400 uppercase tracking-widest block pl-1">SIMULATE CROWD:</span>
                <div className="flex gap-1.5 font-mono text-xxs">
                  <button 
                    onClick={() => handleSimulateCrowd("NORMAL")}
                    className={`px-3 py-1 rounded transition-all duration-200 cursor-pointer ${
                      stadiumStatus?.crowdCongestionLevel === "NORMAL" 
                        ? "bg-emerald-500 text-black font-bold" 
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    NORMAL
                  </button>
                  <button 
                    onClick={() => handleSimulateCrowd("PEAK")}
                    className={`px-3 py-1 rounded transition-all duration-200 cursor-pointer ${
                      stadiumStatus?.crowdCongestionLevel === "PEAK" 
                        ? "bg-amber-500 text-black font-bold" 
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    PEAK
                  </button>
                  <button 
                    onClick={() => handleSimulateCrowd("HEAVY")}
                    className={`px-3 py-1 rounded transition-all duration-200 cursor-pointer ${
                      stadiumStatus?.crowdCongestionLevel === "HEAVY" 
                        ? "bg-rose-500 text-black font-bold" 
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    CRITICAL
                  </button>
                </div>
              </div>
            </div>

            {/* Strategic advisor & PA Broadcaster Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* AI Strategic Decision Advisor */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-white text-base mb-1 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    AI Commander (Gemini Decision Support)
                  </h3>
                  <p className="text-xs text-slate-400 mb-5">
                    Consult our GenAI stadium advisor with real-time operational queries, transit problems, or emergency situations.
                  </p>

                  <form onSubmit={handleSubmitDecisionSupport} className="space-y-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex gap-2">
                      <input 
                        type="text" 
                        aria-label="Tactical operational query for advisor"
                        value={decisionQuery}
                        onChange={(e) => setDecisionQuery(e.target.value)}
                        placeholder="e.g. Train shuttle suspended post-game. Heavy rain starting at Gate D. How do we shift flow?"
                        className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
                      />
                      <button
                        type="submit"
                        disabled={decisionLoading}
                        className="px-4 py-1.5 bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold font-display hover:bg-emerald-400 transition-colors cursor-pointer"
                      >
                        {decisionLoading ? "Analyzing..." : "Ask Advisor"}
                      </button>
                    </div>
                  </form>

                  {/* Predefined scenario clickers */}
                  <div className="flex flex-wrap gap-2 mt-3.5">
                    <button
                      onClick={() => setDecisionQuery("NJ Transit Meadowlands trains delayed. 15,000 fans are backing up on Gate A ramps. Draft evacuation/re-route.")}
                      className="text-xxs px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      Scenario: Train Outage
                    </button>
                    <button
                      onClick={() => setDecisionQuery("Security alert at Gate B has caused ticket scanners to go offline. Lines are wrapping around general parking. Shift them safely.")}
                      className="text-xxs px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      Scenario: Gate B Security Jam
                    </button>
                  </div>

                  {/* Strategic Advisor output */}
                  {decisionResponse && (
                    <div className="mt-5 p-4 bg-slate-950 border border-emerald-500/20 rounded-xl max-h-[320px] overflow-y-auto leading-relaxed text-xs">
                      <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="font-display font-bold text-white text-xs">AI OPERATIONAL DIRECTIVE</span>
                      </div>
                      <div className="prose prose-invert prose-xs text-slate-300 whitespace-pre-line font-sans space-y-2">
                        {decisionResponse}
                      </div>
                    </div>
                  )}

                  {decisionLoading && (
                    <div className="mt-5 p-12 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                      <span className="text-xs font-mono text-slate-400 animate-pulse">Running advanced tactical simulation...</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                  <span>Directive engine:</span>
                  <span className="text-emerald-400 font-bold">GEMINI-3.5-FLASH</span>
                </div>
              </div>

              {/* Public Address Announcement Broadcaster */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col h-[520px]">
                <div className="pb-3 border-b border-slate-800/60 mb-4">
                  <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" />
                    PA Broadcast Studio
                  </h3>
                  <p className="text-xs text-slate-400">Generate instantly translated World Cup announcements</p>
                </div>

                <form onSubmit={handleCreateAnnouncement} className="space-y-4 mb-4">
                  <div className="flex gap-2">
                    <select
                      value={annType}
                      aria-label="Announcement type select"
                      onChange={(e) => setAnnType(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <option value="INFO">ℹ️ General Info</option>
                      <option value="CROWD">👥 Crowd Alert</option>
                      <option value="TRANSPORT">🚇 Transport</option>
                      <option value="EMERGENCY">⚠️ Emergency</option>
                    </select>

                    <input
                      type="text"
                      required
                      aria-label="Announcement text prompt"
                      value={annDraft}
                      onChange={(e) => setAnnDraft(e.target.value)}
                      placeholder="e.g. Please use Gate C for immediate entry."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creatingAnnouncement}
                    className="w-full py-2 bg-emerald-500 text-slate-950 text-xs font-bold font-display rounded-xl hover:bg-emerald-400 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {creatingAnnouncement ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Translating ...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Broadcast & Translate
                      </>
                    )}
                  </button>
                </form>

                {/* Published Announcements History */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl relative space-y-2">
                      <div className="flex justify-between items-center text-xxs font-mono">
                        <div className="flex items-center gap-1.5">
                          {getAnnouncementIcon(ann.type)}
                          <span className="text-slate-400 font-bold">{ann.type}</span>
                        </div>
                        <span className="text-slate-500">
                          {new Date(ann.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      {/* Display in 3 tabs or side-by-side for multilingual display */}
                      <div className="space-y-1.5 text-xs">
                        <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-mono block mb-0.5">🇺🇸 ENGLISH</span>
                          <span className="text-slate-200">{ann.languages.en || ann.message}</span>
                        </div>
                        <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-mono block mb-0.5">🇪🇸 ESPAÑOL</span>
                          <span className="text-slate-300">{ann.languages.es || "[Awaiting Spanish]"}</span>
                        </div>
                        <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-mono block mb-0.5">🇫🇷 FRANÇAIS</span>
                          <span className="text-slate-300">{ann.languages.fr || "[Awaiting French]"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 mt-12 text-slate-500 text-xs text-center font-mono space-y-2">
        <p>© FIFA World Cup 2026 · Stadium Smart Hub Operations · NYNJ MetLife Stadium</p>
        <p className="text-[10px] text-slate-600">Enhanced with server-side Google Gemini 3.5 Flash capabilities</p>
      </footer>
    </div>
  );
}
