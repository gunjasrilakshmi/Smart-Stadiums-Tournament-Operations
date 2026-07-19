import { describe, it, expect } from "vitest";
import { analyzeIncidentHeuristics, simulateGateFlows } from "./operations.ts";

describe("Stadium Hub Operational Fallback Heuristics", () => {
  describe("analyzeIncidentHeuristics", () => {
    it("should classify medical emergencies correctly with high critical priority", () => {
      const result = analyzeIncidentHeuristics("A fan in section 104 is feeling faint and has hurt their knee.");
      expect(result.category).toBe("Medical Emergency");
      expect(result.priority).toBe("CRITICAL");
      expect(result.assignedTeam).toBe("Medical Rapid Response");
      expect(result.aiAction).toContain("paramedic");
    });

    it("should classify physical security threats as critical priority with specialized dispatch", () => {
      const result = analyzeIncidentHeuristics("A fight has broken out near Gate B and someone is making a threat.");
      expect(result.category).toBe("Security Threat");
      expect(result.priority).toBe("CRITICAL");
      expect(result.assignedTeam).toBe("Stadium Security Unit 2");
      expect(result.aiAction).toContain("police");
    });

    it("should classify crowd bottlenecks with high priority", () => {
      const result = analyzeIncidentHeuristics("The queue is completely stuck and congestion is building up.");
      expect(result.category).toBe("Crowd Control");
      expect(result.priority).toBe("HIGH");
      expect(result.assignedTeam).toBe("Gate Operations & Flow Staff");
      expect(result.aiAction).toContain("marshals");
    });

    it("should classify spills or physical hazards as medium maintenance events", () => {
      const result = analyzeIncidentHeuristics("We have a soda spill and some leaking water causing a slip risk.");
      expect(result.category).toBe("Sanitation / Maintenance");
      expect(result.priority).toBe("MEDIUM");
      expect(result.assignedTeam).toBe("Cleaning Squad West");
    });

    it("should classify accessibility requests appropriately with lower priority", () => {
      const result = analyzeIncidentHeuristics("A fan needs a wheelchair escort to elevator 3.");
      expect(result.category).toBe("Accessibility Support");
      expect(result.priority).toBe("LOW");
      expect(result.assignedTeam).toBe("Mobility Support Team");
    });

    it("should classify technical device outages as medium IT operations", () => {
      const result = analyzeIncidentHeuristics("Ticket barcode scanner went completely offline.");
      expect(result.category).toBe("Technical / IT");
      expect(result.priority).toBe("MEDIUM");
      expect(result.assignedTeam).toBe("IT Field Support Unit C");
    });

    it("should fallback to a general operational ticket for obscure, generic logs", () => {
      const result = analyzeIncidentHeuristics("Need assistance with some documents and banners.");
      expect(result.category).toBe("General Operations");
      expect(result.priority).toBe("MEDIUM");
      expect(result.assignedTeam).toBe("General Venue Crew");
    });
  });

  describe("simulateGateFlows", () => {
    it("should simulate low wait times and clear statuses for NORMAL congestion", () => {
      const gates = simulateGateFlows("NORMAL");
      expect(gates.GateA.waitTime).toBe(10);
      expect(gates.GateA.status).toBe("CLEAR");
      expect(gates.GateB.waitTime).toBe(18);
      expect(gates.GateB.status).toBe("CLEAR");
    });

    it("should simulate medium wait times for PEAK congestion", () => {
      const gates = simulateGateFlows("PEAK");
      expect(gates.GateA.status).toBe("MODERATE");
      expect(gates.GateB.status).toBe("BUSY");
      expect(gates.GateB.waitTime).toBe(32);
    });

    it("should simulate heavy queue wait times and busy status for HEAVY congestion", () => {
      const gates = simulateGateFlows("HEAVY");
      expect(gates.GateA.status).toBe("BUSY");
      expect(gates.GateB.status).toBe("BUSY");
      expect(gates.GateB.waitTime).toBe(48);
      expect(gates.GateC.status).toBe("MODERATE");
    });
  });
});
