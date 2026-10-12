/**
 * Selected educational fields from MathV4's real runtime curriculum-graph.json.
 * Source: mathv4/src/lib/server/analytics_v2/data/curriculum-graph.json, generated 2026-04-23.
 * Each solid edge below is present in nodes[dependent].prerequisites.
 * Question-specific links come from the English 4M2_T2_Q2_en entry in 24-4/4M2_fixed.json.
 * This is a bounded Area neighbourhood, not the full private graph or bank.
 */
export interface AreaTopic { code: string; name: string; grade: number; }
export interface AreaEdge {
  dependent: string;
  foundation: string;
  kind: "curriculum" | "question" | "error";
}

export const AREA_TOPICS: AreaTopic[] = [
  { code: "5M1", name: "Area (II)", grade: 5 },
  { code: "4M2", name: "Area (I)", grade: 4 },
  { code: "3N4", name: "Four arithmetic operations (I)", grade: 3 },
  { code: "4S2", name: "Dissecting and Forming Shapes", grade: 4 },
  { code: "3N2", name: "Multiplication (I)", grade: 3 },
  { code: "3N3", name: "Division (I)", grade: 3 },
  { code: "4S1", name: "Quadrilaterals (III)", grade: 4 },
  { code: "2N5", name: "Addition and subtraction (III)", grade: 2 },
  { code: "2N6", name: "Division (Basic)", grade: 2 },
  { code: "3S2", name: "Triangles", grade: 3 },
  { code: "4N1", name: "Multiplication (II)", grade: 4 },
  { code: "4M1", name: "Perimeter (I)", grade: 4 },
  { code: "2S4", name: "Quadrilaterals (I)", grade: 2 },
];

export const AREA_EDGES: AreaEdge[] = [
  { dependent: "5M1", foundation: "4M2", kind: "curriculum" },
  { dependent: "4M2", foundation: "3N4", kind: "curriculum" },
  { dependent: "4M2", foundation: "4S2", kind: "curriculum" },
  { dependent: "3N4", foundation: "3N2", kind: "curriculum" },
  { dependent: "3N4", foundation: "3N3", kind: "curriculum" },
  { dependent: "4S2", foundation: "4S1", kind: "curriculum" },
  { dependent: "3N2", foundation: "2N5", kind: "curriculum" },
  { dependent: "3N2", foundation: "2N6", kind: "curriculum" },
  { dependent: "3N3", foundation: "3N2", kind: "curriculum" },
  { dependent: "4S1", foundation: "3S2", kind: "curriculum" },
  { dependent: "4N1", foundation: "3N3", kind: "curriculum" },
  { dependent: "4N1", foundation: "3N4", kind: "curriculum" },
  { dependent: "4M1", foundation: "3N4", kind: "curriculum" },
  // connections[] with name='Prerequisite Units', specific to the 8 cm × 6 cm question.
  { dependent: "4M2", foundation: "4N1", kind: "question" },
  { dependent: "4M2", foundation: "2S4", kind: "question" },
  // PERIMETER_AREA_CONFUSION.commonErrors[].relatedCurriculum[].code.
  { dependent: "4M2", foundation: "4M1", kind: "error" },
];

/** Counts computed from English questions.en.byTier[].commonErrors in the same 24-4 snapshot. */
export const AREA_BANK_COUNTS = { questions: 46, errorEntries: 64 } as const;
