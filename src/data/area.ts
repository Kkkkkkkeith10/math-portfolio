/**
 * A small slice of the real MathsAI data, for one topic only: 4M2 Area (I).
 *
 * Source: the private question bank (question-banks-dump/24-4/4M2_fixed.json) and the curriculum graph.
 * The current English-language 24-4 snapshot contains 46 questions and 64 common-error entries.
 * The full question content and wider curriculum remain private; only this selected slice is published.
 * Only the entries below are published. Wording of descriptions and misconceptions is as written in the bank.
 */

export interface TopicNode {
  code: string;
  name: string;
  grade: string;
  strand: string;
  note?: string;
}

export interface BankError {
  code: string;
  severity: "critical" | "major";
  category: string;
  /** What the student wrote, line by line. */
  wrote: string[];
  /** The step the student should have written. */
  should: string;
  /** Short statement of the error in symbols. */
  inSymbols: string;
  description: string;
  misconception: string;
  /** Where the error points back to. Undefined when the bank links it to no other topic. */
  linked?: TopicNode;
  linkedHow: string;
}

export interface BankQuestion {
  id: string;
  label: string;
  prompt: string;
  /** Rectangle drawing: width, height as drawn, plus labels. */
  shape: { w: number; h: number; labelW: string; labelH: string };
  correct: string[];
  errors: BankError[];
}

export const TOPIC: TopicNode = {
  code: "4M2",
  name: "Area (I)",
  grade: "P4",
  strand: "Measures",
};

const PERIMETER: TopicNode = {
  code: "4M1",
  name: "Perimeter (I)",
  grade: "P4",
  strand: "Measures",
  note: "recognise and use the formulae for the perimeters of squares and rectangles",
};

const MULTIPLICATION: TopicNode = {
  code: "4N1",
  name: "Multiplication (II)",
  grade: "P4",
  strand: "Number",
  note: "prerequisite unit named by the question",
};

export const PREREQS: TopicNode[] = [
  { code: "3N4", name: "Four arithmetic operations (I)", grade: "P3", strand: "Number" },
  { code: "4S2", name: "Dissecting and Forming Shapes", grade: "P4", strand: "Shape and Space" },
];

export const QUESTIONS: BankQuestion[] = [
  {
    id: "4M2_T2_Q2",
    label: "8 cm × 6 cm",
    prompt: "Find the area of the rectangle.",
    shape: { w: 8, h: 6, labelW: "8 cm", labelH: "6 cm" },
    correct: ["Area = length × width", "= 8 × 6", "= 48 cm^2"],
    errors: [
      {
        code: "PERIMETER_AREA_CONFUSION",
        severity: "critical",
        category: "conceptual",
        wrote: ["(8 + 6) × 2", "= 28"],
        should: "8 × 6 = 48 cm^2",
        inSymbols: "P = 2(l + w) used where A = l × w is needed",
        description: "Calculates (8 + 6) × 2 = 28, applying the perimeter formula instead of the area formula.",
        misconception:
          "Confuses area with perimeter. Having just learned perimeter in 4M1, the student applies the wrong formula.",
        linked: PERIMETER,
        linkedHow: "Linked in the bank to",
      },
      {
        code: "AREA_FORMULA_ERROR",
        severity: "critical",
        category: "conceptual",
        wrote: ["8 + 6", "= 14"],
        should: "8 × 6 = 48 cm^2",
        inSymbols: "l + w used where A = l × w is needed",
        description: "Adds 8 + 6 = 14 instead of multiplying 8 × 6 = 48.",
        misconception: "Confuses the area operation (multiplication) with addition.",
        linked: MULTIPLICATION,
        linkedHow: "Prerequisite unit from the question",
      },
    ],
  },
  {
    id: "4M2_T2_Q1",
    label: "11 cm × 5 cm",
    prompt: "Find the area of the rectangle.",
    shape: { w: 11, h: 5, labelW: "11 cm", labelH: "5 cm" },
    correct: ["Area = length × width", "= 11 × 5", "= 55 cm^2"],
    errors: [
      {
        code: "AREA_UNIT_ERROR",
        severity: "major",
        category: "notation",
        wrote: ["11 × 5 = 55", "Area = 55 cm"],
        should: "55 cm^2",
        inSymbols: "cm (length) written where cm^2 (area) is needed",
        description: "Calculates 55 correctly but writes 55 cm instead of 55 cm^2.",
        misconception: "Does not recognise that area must be expressed in square units.",
        linkedHow: "No other topic linked in the bank",
      },
      {
        code: "AREA_FORMULA_ERROR",
        severity: "critical",
        category: "conceptual",
        wrote: ["11 + 5", "= 16"],
        should: "11 × 5 = 55 cm^2",
        inSymbols: "l + w used where A = l × w is needed",
        description: "Adds 11 + 5 = 16 instead of multiplying 11 × 5 = 55.",
        misconception:
          "Confuses the area formula with a step of the perimeter formula, or does not understand that area requires multiplication of two dimensions.",
        linked: MULTIPLICATION,
        linkedHow: "Prerequisite unit from the question",
      },
    ],
  },
  {
    id: "4M2_T2_Q4",
    label: "Square, side 10 cm",
    prompt: "Find the area of the square.",
    shape: { w: 10, h: 10, labelW: "10 cm", labelH: "10 cm" },
    correct: ["Area = side × side", "= 10 × 10", "= 100 cm^2"],
    errors: [
      {
        code: "PERIMETER_AREA_CONFUSION",
        severity: "critical",
        category: "conceptual",
        wrote: ["10 × 4", "= 40"],
        should: "10 × 10 = 100 cm^2",
        inSymbols: "P = 4s used where A = s × s is needed",
        description: "Calculates 10 × 4 = 40 instead of 10 × 10 = 100.",
        misconception: "Confuses the square area formula (side × side) with the perimeter formula (side × 4).",
        linked: PERIMETER,
        linkedHow: "Linked in the bank to",
      },
      {
        code: "AREA_UNIT_ERROR",
        severity: "major",
        category: "notation",
        wrote: ["10 × 10 = 100", "Area = 100 cm"],
        should: "100 cm^2",
        inSymbols: "cm (length) written where cm^2 (area) is needed",
        description: "Calculates 100 correctly but writes 100 cm instead of 100 cm^2.",
        misconception:
          "Omits the square symbol in the unit, showing a weak grasp of the distinction between length and area units.",
        linkedHow: "No other topic linked in the bank",
      },
    ],
  },
];

/** Escape, then turn `x^2` into a superscript. Everything shown as maths goes through this. */
export function m(text: string): string {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return safe.replace(/\^(\d)/g, "<sup>$1</sup>");
}
