/** Browser-local mission evidence. Drawings are preserved, never treated as recognised handwriting. */
export interface GardenPlan {
  id: number;
  length: number;
  width: number;
  fence: number;
  area: number;
  prediction: number;
  correctPrediction: boolean;
  validFence: boolean;
  ink: number[][][];
}

export interface GardenState {
  phase: "meet" | "build" | "compare" | "transfer" | "complete";
  plans: GardenPlan[];
  activePlan: GardenPlan | null;
  transferPassed: boolean;
}

let current: GardenState = { phase: "meet", plans: [], activePlan: null, transferPassed: false };
const listeners = new Set<(state: GardenState) => void>();

export function getGardenState(): GardenState { return current; }
export function updateGardenState(patch: Partial<GardenState>): void {
  current = { ...current, ...patch };
  listeners.forEach((listener) => listener(current));
}
export function subscribeGarden(listener: (state: GardenState) => void): () => void {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
}
