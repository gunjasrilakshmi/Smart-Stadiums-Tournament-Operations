import { Gate } from "./types.ts";

export interface HeuristicIncidentResult {
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  assignedTeam: string;
  aiAction: string;
}

/**
 * Categorizes and schedules response priorities using intelligent heuristics
 * when the Generative AI client is unavailable or in fallback mode.
 */
export function analyzeIncidentHeuristics(description: string): HeuristicIncidentResult {
  const descLower = description.toLowerCase();
  
  if (
    descLower.includes("hurt") || 
    descLower.includes("faint") || 
    descLower.includes("medical") || 
    descLower.includes("heart") ||
    descLower.includes("injury") ||
    descLower.includes("bleeding")
  ) {
    return {
      category: "Medical Emergency",
      priority: "CRITICAL",
      assignedTeam: "Medical Rapid Response",
      aiAction: "Dispatch nearby paramedic team. Inform emergency command.",
    };
  }
  
  if (
    descLower.includes("fight") || 
    descLower.includes("weapon") || 
    descLower.includes("steal") || 
    descLower.includes("threat") ||
    descLower.includes("assault") ||
    descLower.includes("suspicious package")
  ) {
    return {
      category: "Security Threat",
      priority: "CRITICAL",
      assignedTeam: "Stadium Security Unit 2",
      aiAction: "Mobilize immediate police/security intervention at the location.",
    };
  }
  
  if (
    descLower.includes("wifi") ||
    descLower.includes("scanner") ||
    descLower.includes("offline") ||
    descLower.includes("power") ||
    descLower.includes("screen")
  ) {
    return {
      category: "Technical / IT",
      priority: "MEDIUM",
      assignedTeam: "IT Field Support Unit C",
      aiAction: "Assign technician to inspect and reboot device hardware.",
    };
  }

  if (
    descLower.includes("crowd") || 
    descLower.includes("congest") || 
    descLower.includes("stuck") || 
    (descLower.includes("line") && !descLower.includes("offline") && !descLower.includes("online")) ||
    descLower.includes("bottleneck") ||
    descLower.includes("gate backlog")
  ) {
    return {
      category: "Crowd Control",
      priority: "HIGH",
      assignedTeam: "Gate Operations & Flow Staff",
      aiAction: "Deploy crowd marshals to direct fans and ease queues.",
    };
  }

  if (
    descLower.includes("spill") || 
    descLower.includes("leak") || 
    descLower.includes("trash") || 
    descLower.includes("water") ||
    descLower.includes("broken glass") ||
    descLower.includes("slip")
  ) {
    return {
      category: "Sanitation / Maintenance",
      priority: "MEDIUM",
      assignedTeam: "Cleaning Squad West",
      aiAction: "Send sanitation personnel with wet floor markers and cleanup kit.",
    };
  }

  if (
    descLower.includes("wheelchair") ||
    descLower.includes("stroller") ||
    descLower.includes("elevator") ||
    descLower.includes("mobility") ||
    descLower.includes("accessible")
  ) {
    return {
      category: "Accessibility Support",
      priority: "LOW",
      assignedTeam: "Mobility Support Team",
      aiAction: "Deploy sensory/mobility support officer to assist fan.",
    };
  }

  return {
    category: "General Operations",
    priority: "MEDIUM",
    assignedTeam: "General Venue Crew",
    aiAction: "Deploy standard operations crew to inspect location.",
  };
}

/**
 * Returns calculated gate wait times and operational statuses based on target congestion simulation level.
 */
export function simulateGateFlows(level: "NORMAL" | "PEAK" | "HEAVY"): { [key: string]: Gate } {
  if (level === "NORMAL") {
    return {
      GateA: { name: "Gate A (North)", waitTime: 10, status: "CLEAR", sensoryRoomNearby: false },
      GateB: { name: "Gate B (East - Main)", waitTime: 18, status: "CLEAR", sensoryRoomNearby: true },
      GateC: { name: "Gate C (South)", waitTime: 8, status: "CLEAR", sensoryRoomNearby: true },
      GateD: { name: "Gate D (West - Express)", waitTime: 12, status: "CLEAR", sensoryRoomNearby: false }
    };
  } else if (level === "PEAK") {
    return {
      GateA: { name: "Gate A (North)", waitTime: 15, status: "MODERATE", sensoryRoomNearby: false },
      GateB: { name: "Gate B (East - Main)", waitTime: 32, status: "BUSY", sensoryRoomNearby: true },
      GateC: { name: "Gate C (South)", waitTime: 12, status: "CLEAR", sensoryRoomNearby: true },
      GateD: { name: "Gate D (West - Express)", waitTime: 22, status: "MODERATE", sensoryRoomNearby: false }
    };
  } else {
    return {
      GateA: { name: "Gate A (North)", waitTime: 28, status: "BUSY", sensoryRoomNearby: false },
      GateB: { name: "Gate B (East - Main)", waitTime: 48, status: "BUSY", sensoryRoomNearby: true },
      GateC: { name: "Gate C (South)", waitTime: 20, status: "MODERATE", sensoryRoomNearby: true },
      GateD: { name: "Gate D (West - Express)", waitTime: 38, status: "BUSY", sensoryRoomNearby: false }
    };
  }
}
