import { Concession, Gate } from "./types.ts";

/**
 * Calculates the average wait time of all active stadium gates
 */
export function calculateAverageWaitTime(gateWaitTimes: { [key: string]: Gate }): number {
  const gates = Object.values(gateWaitTimes);
  if (gates.length === 0) return 0;
  const sum = gates.reduce((acc, curr) => acc + curr.waitTime, 0);
  return Math.round(sum / gates.length);
}

/**
 * Returns Tailwind CSS class names representing queue flow state based on wait time minutes
 */
export function getGateColor(waitTime: number): string {
  if (waitTime < 15) return "stroke-emerald-400 fill-emerald-950/40 text-emerald-400";
  if (waitTime < 30) return "stroke-amber-400 fill-amber-950/40 text-amber-400";
  return "stroke-rose-400 fill-rose-950/40 text-rose-400";
}

/**
 * Filters concessions based on selected dietary or accessibility parameters
 */
export function filterConcessions(
  concessions: Concession[],
  filter: "ALL" | "ECO" | "ACCESSIBILITY"
): Concession[] {
  if (!concessions) return [];
  return concessions.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "ECO") return !!item.ecoFriendly;
    if (filter === "ACCESSIBILITY") return item.type.includes("Accessibility");
    return true;
  });
}

/**
 * Returns proper color badge styling classes based on incident priority levels
 */
export function getPriorityBadgeColor(priority: string): string {
  switch (priority) {
    case "CRITICAL":
      return "bg-rose-500/10 text-rose-400 border-rose-500/25";
    case "HIGH":
      return "bg-orange-500/10 text-orange-400 border-orange-500/25";
    case "MEDIUM":
      return "bg-amber-500/10 text-amber-400 border-amber-500/25";
    default:
      return "bg-sky-500/10 text-sky-400 border-sky-500/25";
  }
}
