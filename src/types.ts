export interface Concession {
  name: string;
  wait: string;
  type: string;
  ecoFriendly: boolean;
}

export interface Restroom {
  location: string;
  wait: string;
  wheelchairAccessible: boolean;
}

export interface Gate {
  name: string;
  waitTime: number;
  status: string;
  sensoryRoomNearby: boolean;
}

export interface StadiumStatus {
  stadiumName: string;
  city: string;
  capacity: string;
  matchToday: string;
  crowdCongestionLevel: "NORMAL" | "PEAK" | "HEAVY";
  gateWaitTimes: { [key: string]: Gate };
  concessionsWaitTimes: Concession[];
  restroomsWaitTimes: Restroom[];
}

export interface Incident {
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

export interface Announcement {
  id: string;
  timestamp: string;
  type: "INFO" | "CROWD" | "TRANSPORT" | "EMERGENCY";
  message: string;
  languages: { [lang: string]: string };
  isLive: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
