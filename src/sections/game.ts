import { mountGame } from '../game';
export function initGame(): void {
  const container = document.getElementById('game-mount');
  if (container) mountGame(container);
}
