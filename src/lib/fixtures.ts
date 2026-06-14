import type { Scenario } from "./types";

export const scenarios: Scenario[] = [
  {
    id: "freezer-emergency",
    name: "Freezer emergency",
    customer: "North Pier Market",
    note:
      "Walk-in freezer is warming fast. Manager says product loss starts within the hour. Tech thinks condenser fan or 45uF capacitor. Customer wants a real ETA, not a maybe.",
    site: "North Pier Market - back dock",
    serviceLevel: "Premium food-service SLA",
    memory: [
      "Customer prefers SMS updates every 20 minutes during critical food-safety calls.",
      "North Pier Market has narrow dock access after 4pm; send a van, not the box truck.",
      "They approved emergency after-hours rates on two prior refrigeration calls."
    ],
    inventory: ["45uF capacitor", "condenser fan motor", "coil cleaner", "temperature probes"],
    crew: ["Maya - refrigeration lead", "Jon - apprentice nearby", "Priya - parts runner"]
  },
  {
    id: "water-leak",
    name: "Water leak",
    customer: "Harbor & 9th Coworking",
    note:
      "Ceiling leak above conference room B. Tenant event starts at 3pm. Need stopgap, photos, and whether to call plumber or roofer first.",
    site: "Harbor & 9th - second floor",
    serviceLevel: "Business continuity SLA",
    memory: [
      "Building owner wants photo evidence before any trade escalation.",
      "Conference room B has a ceiling access panel behind the projector screen.",
      "Tenant-facing updates should avoid assigning fault until inspection is complete."
    ],
    inventory: ["wet vacuum", "moisture meter", "containment plastic", "ceiling tile kit"],
    crew: ["Luis - building systems", "Ari - tenant comms", "Maya - backup"]
  },
  {
    id: "missed-install",
    name: "Missed install window",
    customer: "Solace Dental",
    note:
      "Install crew missed the 10am window for operatory light replacement. Dentist is angry because patients start at noon. Need recovery plan and apology.",
    site: "Solace Dental - operatory 3",
    serviceLevel: "Healthcare priority",
    memory: [
      "Customer prefers direct manager calls for schedule slips.",
      "Prior job notes say operatory 3 has a low ceiling obstruction.",
      "Dental office blocks patient care from noon to 2pm; noise must be minimized."
    ],
    inventory: ["operatory light kit", "low-profile mount", "drop cloth", "inspection checklist"],
    crew: ["Nora - install lead", "Eli - customer recovery", "Priya - parts runner"]
  }
];

export function getScenario(id?: string): Scenario {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
}
