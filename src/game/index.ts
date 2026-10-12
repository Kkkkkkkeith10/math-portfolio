export { mountMission as mountGame } from './mission';
export interface GameHandle { destroy(): void; }
export function gameReady(): boolean { return true; }
