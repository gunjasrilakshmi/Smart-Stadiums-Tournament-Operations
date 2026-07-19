import { describe, it, expect } from "vitest";
import { calculateAverageWaitTime, getGateColor, filterConcessions, getPriorityBadgeColor } from "./utils.ts";
import { Gate, Concession } from "./types.ts";

describe("Stadium Operations Utils", () => {
  describe("calculateAverageWaitTime", () => {
    it("should return 0 when there are no gates", () => {
      expect(calculateAverageWaitTime({})).toBe(0);
    });

    it("should calculate correct rounded average wait time for active gates", () => {
      const gates: { [key: string]: Gate } = {
        GateA: { name: "Gate A", waitTime: 10, status: "CLEAR", sensoryRoomNearby: false },
        GateB: { name: "Gate B", waitTime: 25, status: "MODERATE", sensoryRoomNearby: false },
        GateC: { name: "Gate C", waitTime: 35, status: "HEAVY", sensoryRoomNearby: true },
        GateD: { name: "Gate D", waitTime: 12, status: "CLEAR", sensoryRoomNearby: false },
      };
      // Average: (10 + 25 + 35 + 12) / 4 = 82 / 4 = 20.5 -> rounded to 21
      expect(calculateAverageWaitTime(gates)).toBe(21);
    });
  });

  describe("getGateColor", () => {
    it("should return emerald styles for light wait times under 15 minutes", () => {
      expect(getGateColor(10)).toContain("emerald");
      expect(getGateColor(14)).toContain("emerald");
    });

    it("should return amber styles for moderate wait times between 15 and 29 minutes", () => {
      expect(getGateColor(15)).toContain("amber");
      expect(getGateColor(29)).toContain("amber");
    });

    it("should return rose styles for heavy wait times 30 minutes or above", () => {
      expect(getGateColor(30)).toContain("rose");
      expect(getGateColor(45)).toContain("rose");
    });
  });

  describe("filterConcessions", () => {
    const mockConcessions: Concession[] = [
      { name: "Eco Dogs", wait: "5 min", type: "Classic Eats", ecoFriendly: true },
      { name: "Standard Tacos", wait: "12 min", type: "Mexican", ecoFriendly: false },
      { name: "Access Pretzels", wait: "8 min", type: "Accessibility Friendly Snacks", ecoFriendly: false },
      { name: "Green Bowls", wait: "10 min", type: "Healthy & Accessibility Dining", ecoFriendly: true },
    ];

    it("should return all concessions when filter is ALL", () => {
      expect(filterConcessions(mockConcessions, "ALL")).toHaveLength(4);
    });

    it("should return only eco-friendly concessions when filter is ECO", () => {
      const eco = filterConcessions(mockConcessions, "ECO");
      expect(eco).toHaveLength(2);
      expect(eco.every((item) => item.ecoFriendly)).toBe(true);
    });

    it("should return concessions with Accessibility in type when filter is ACCESSIBILITY", () => {
      const acc = filterConcessions(mockConcessions, "ACCESSIBILITY");
      expect(acc).toHaveLength(2);
      expect(acc.map((item) => item.name)).toContain("Access Pretzels");
      expect(acc.map((item) => item.name)).toContain("Green Bowls");
    });
  });

  describe("getPriorityBadgeColor", () => {
    it("should return critical styling for CRITICAL priority", () => {
      expect(getPriorityBadgeColor("CRITICAL")).toContain("rose");
    });

    it("should return orange/high styling for HIGH priority", () => {
      expect(getPriorityBadgeColor("HIGH")).toContain("orange");
    });

    it("should return amber styling for MEDIUM priority", () => {
      expect(getPriorityBadgeColor("MEDIUM")).toContain("amber");
    });

    it("should return sky/default styling for other priorities", () => {
      expect(getPriorityBadgeColor("LOW")).toContain("sky");
    });
  });
});
