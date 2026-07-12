import React, { useState } from "react";
import { MapPin, TramFront, Bus, Compass, Eye, HeartHandshake } from "lucide-react";
import { Gate } from "../types.ts";

interface StadiumMapProps {
  gateWaitTimes: { [key: string]: Gate };
  onSelectGate: (gateKey: string) => void;
  selectedGateKey: string;
}

export default function StadiumMap({ gateWaitTimes, onSelectGate, selectedGateKey }: StadiumMapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Locations coordinate references for custom markers
  const facilities = [
    { id: "transit", type: "transport", name: "Meadowlands Train Station", x: "12%", y: "15%", icon: TramFront, desc: "Direct trains to NYC (Gate A Access)" },
    { id: "bus", type: "transport", name: "Port Authority Bus Loop A", x: "88%", y: "85%", icon: Bus, desc: "Express buses to Manhattan (Gate C Access)" },
    { id: "sensory1", type: "accessibility", name: "Sensory Haven (Sec 215)", x: "32%", y: "42%", icon: Eye, desc: "Quiet space for sensory-sensitive fans" },
    { id: "sensory2", type: "accessibility", name: "Sensory Haven (Sec 330)", x: "68%", y: "58%", icon: Eye, desc: "Quiet space for sensory-sensitive fans" },
    { id: "mobility", type: "accessibility", name: "Mobility Support Station", x: "82%", y: "18%", icon: HeartHandshake, desc: "Wheelchair assistance & golf carts (Gate C)" }
  ];

  const getGateColor = (waitTime: number) => {
    if (waitTime < 15) return "stroke-emerald-400 fill-emerald-950/40 text-emerald-400";
    if (waitTime < 30) return "stroke-amber-400 fill-amber-950/40 text-amber-400";
    return "stroke-rose-400 fill-rose-950/40 text-rose-400";
  };

  return (
    <div id="stadium-interactive-map" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            Arena Navigation & Flow
          </h3>
          <p className="text-xs text-slate-400">Interactive architectural blueprint of MetLife Stadium. Click to inspect.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xxs font-mono">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Light (&lt;15m)
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Moderate (15-30m)
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Busy (30m+)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* The Map Stage */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800/80 rounded-xl relative h-[360px] md:h-[420px] flex items-center justify-center p-4">
          
          {/* Compass Rose Backdrop */}
          <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center pointer-events-none">
            <div className="w-80 h-80 rounded-full border border-dashed border-white flex items-center justify-center">
              <div className="w-60 h-60 rounded-full border border-dashed border-white"></div>
            </div>
          </div>

          {/* Core Arena Vector */}
          <svg viewBox="0 0 500 500" className="w-full h-full max-w-[420px] max-h-[420px]">
            {/* Outer Parking Limits */}
            <circle cx="250" cy="250" r="230" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4,6" opacity="0.3" />
            <circle cx="250" cy="250" r="200" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />

            {/* Pedestrian Promenade Ring */}
            <circle cx="250" cy="250" r="170" fill="none" stroke="#1e293b" strokeWidth="12" opacity="0.6" />

            {/* Grandstands Outer Shell */}
            <ellipse cx="250" cy="250" rx="140" ry="110" className="fill-slate-900/90 stroke-slate-700 stroke-[3]" />

            {/* Grandstands Mid Ring */}
            <ellipse cx="250" cy="250" rx="115" ry="88" fill="none" className="stroke-slate-800 stroke-[4]" />
            
            {/* Grandstands Seating Tiers Section Cuts */}
            <line x1="250" y1="50" x2="250" y2="140" className="stroke-slate-800 stroke-[2]" />
            <line x1="250" y1="360" x2="250" y2="450" className="stroke-slate-800 stroke-[2]" />
            <line x1="110" y1="250" x2="200" y2="250" className="stroke-slate-800 stroke-[2]" />
            <line x1="300" y1="250" x2="390" y2="250" className="stroke-slate-800 stroke-[2]" />

            {/* Inner Pitch Enclosure */}
            <ellipse cx="250" cy="250" rx="80" ry="58" className="fill-slate-950 stroke-slate-800 stroke-[2]" />

            {/* Soccer Pitch Field Turf */}
            <rect x="200" y="215" width="100" height="70" className="fill-emerald-950/60 stroke-emerald-500/40 stroke-[2] rx-[2]" />
            
            {/* Pitch Marking details */}
            <line x1="250" y1="215" x2="250" y2="285" className="stroke-emerald-500/30" />
            <circle cx="250" cy="250" r="15" fill="none" className="stroke-emerald-500/30" />
            <rect x="200" y="235" width="12" height="30" fill="none" className="stroke-emerald-500/30" />
            <rect x="288" y="235" width="12" height="30" fill="none" className="stroke-emerald-500/30" />

            {/* GATE INTERACTIVES (Hoverable, Clickable Rings) */}
            
            {/* Gate A - North (Meadowlands Access) */}
            <g 
              className="cursor-pointer group"
              onClick={() => onSelectGate("GateA")}
              onMouseEnter={() => setHoveredZone("Gate A")}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <ellipse 
                cx="250" cy="140" rx="18" ry="14" 
                className={`transition-all duration-300 stroke-[3] ${
                  selectedGateKey === "GateA" 
                    ? "fill-emerald-500/20 stroke-emerald-400 stroke-[4] scale-105" 
                    : getGateColor(gateWaitTimes.GateA?.waitTime || 0)
                }`}
              />
              <text x="250" y="144" textAnchor="middle" className="text-[10px] font-mono font-bold fill-slate-200 pointer-events-none group-hover:fill-white">A</text>
            </g>

            {/* Gate B - East */}
            <g 
              className="cursor-pointer group"
              onClick={() => onSelectGate("GateB")}
              onMouseEnter={() => setHoveredZone("Gate B")}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <ellipse 
                cx="390" cy="250" rx="14" ry="18" 
                className={`transition-all duration-300 stroke-[3] ${
                  selectedGateKey === "GateB" 
                    ? "fill-emerald-500/20 stroke-emerald-400 stroke-[4] scale-105" 
                    : getGateColor(gateWaitTimes.GateB?.waitTime || 0)
                }`}
              />
              <text x="390" y="254" textAnchor="middle" className="text-[10px] font-mono font-bold fill-slate-200 pointer-events-none group-hover:fill-white">B</text>
            </g>

            {/* Gate C - South */}
            <g 
              className="cursor-pointer group"
              onClick={() => onSelectGate("GateC")}
              onMouseEnter={() => setHoveredZone("Gate C")}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <ellipse 
                cx="250" cy="360" rx="18" ry="14" 
                className={`transition-all duration-300 stroke-[3] ${
                  selectedGateKey === "GateC" 
                    ? "fill-emerald-500/20 stroke-emerald-400 stroke-[4] scale-105" 
                    : getGateColor(gateWaitTimes.GateC?.waitTime || 0)
                }`}
              />
              <text x="250" y="364" textAnchor="middle" className="text-[10px] font-mono font-bold fill-slate-200 pointer-events-none group-hover:fill-white">C</text>
            </g>

            {/* Gate D - West */}
            <g 
              className="cursor-pointer group"
              onClick={() => onSelectGate("GateD")}
              onMouseEnter={() => setHoveredZone("Gate D")}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <ellipse 
                cx="110" cy="250" rx="14" ry="18" 
                className={`transition-all duration-300 stroke-[3] ${
                  selectedGateKey === "GateD" 
                    ? "fill-emerald-500/20 stroke-emerald-400 stroke-[4] scale-105" 
                    : getGateColor(gateWaitTimes.GateD?.waitTime || 0)
                }`}
              />
              <text x="110" y="254" textAnchor="middle" className="text-[10px] font-mono font-bold fill-slate-200 pointer-events-none group-hover:fill-white">D</text>
            </g>

          </svg>

          {/* Dynamic Map Pins & Accessibility Markers Layer */}
          {facilities.map((fac) => {
            const IconComponent = fac.icon;
            const isHovered = hoveredZone === fac.id;
            return (
              <div
                key={fac.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 group"
                style={{ left: fac.x, top: fac.y }}
                onMouseEnter={() => setHoveredZone(fac.id)}
                onMouseLeave={() => setHoveredZone(null)}
              >
                <div className={`p-1.5 rounded-full shadow-lg border transition-all duration-200 cursor-help ${
                  fac.type === "transport" 
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500 hover:text-white" 
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                } ${isHovered ? "scale-125 z-20" : "scale-100 z-10"}`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Micro tooltip */}
                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-950 text-white rounded-lg p-2.5 text-xxs border border-slate-800 shadow-2xl transition-all duration-200 pointer-events-none ${
                  isHovered ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-95"
                }`}
                >
                  <p className="font-bold mb-0.5 text-slate-100">{fac.name}</p>
                  <p className="text-slate-400 text-[10px] font-sans leading-relaxed">{fac.desc}</p>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-950"></div>
                </div>
              </div>
            );
          })}

          {/* Central Match Banner overlay */}
          <div className="absolute bottom-3 left-3 bg-slate-950/95 border border-slate-800 rounded-lg py-1 px-3 flex items-center gap-2 pointer-events-none shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono tracking-wider text-slate-400">ARG ⚔&nbsp; FRA · QF</span>
          </div>

          <div className="absolute top-3 left-3 bg-slate-950/95 border border-slate-800 rounded-lg py-1 px-3 flex items-center gap-1.5 pointer-events-none shadow-md">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-mono tracking-wider text-slate-400">MetLife Stadium, NJ</span>
          </div>

        </div>

        {/* Selected Gate / Facility Stats Card */}
        <div className="flex flex-col justify-between bg-slate-950 border border-slate-800/80 rounded-xl p-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded">
                SELECTED GATE
              </span>
            </div>

            <h4 className="text-xl font-display font-bold text-white mb-2">
              {gateWaitTimes[selectedGateKey]?.name || "Select a gate"}
            </h4>

            {gateWaitTimes[selectedGateKey] ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xxs text-slate-500 block uppercase font-mono tracking-wider">CURRENT WAIT</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-display font-bold text-white tracking-tight">
                      {gateWaitTimes[selectedGateKey].waitTime}
                    </span>
                    <span className="text-sm font-sans text-slate-400 font-medium">minutes</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">FLOW STATE</span>
                    <span className={`text-xs font-bold block mt-1 ${
                      gateWaitTimes[selectedGateKey].status === "CLEAR" 
                        ? "text-emerald-400" 
                        : gateWaitTimes[selectedGateKey].status === "MODERATE" 
                        ? "text-amber-400" 
                        : "text-rose-400"
                    }`}>
                      ● {gateWaitTimes[selectedGateKey].status}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">SENSORY ADJACENT</span>
                    <span className="text-xs font-bold text-slate-300 block mt-1">
                      {gateWaitTimes[selectedGateKey].sensoryRoomNearby ? "Yes (Sec 215)" : "No"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-xxs text-slate-400 leading-relaxed font-sans border-t border-slate-900 space-y-2">
                  <p className="font-bold text-slate-300">💡 Navigation Tip:</p>
                  {selectedGateKey === "GateA" && (
                    <p>Ideal entry if arriving on the NJ Transit train. Direct pathways lead to rows 100-240.</p>
                  )}
                  {selectedGateKey === "GateB" && (
                    <p>Main gate with standard heavy rush. If this line is long, consider a 3-minute stroll to Gate A for faster entry.</p>
                  )}
                  {selectedGateKey === "GateC" && (
                    <p>Designated accessibility portal. Includes golf-cart shuttles to rideshare lot E and direct sensory room ramps.</p>
                  )}
                  {selectedGateKey === "GateD" && (
                    <p>Express lane gate closest to general Lot G parking. Ideal for ticket holders with club/suite access.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed">
                Click on Gate A, B, C, or D on the interactive stadium blueprint to view live wait times, flow status, accessibility features, and personalized navigation.
              </p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-900 text-xxs text-slate-500 font-mono flex items-center justify-between">
            <span>Flow data update:</span>
            <span className="text-emerald-400 font-bold animate-pulse">● LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
