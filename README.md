# Interactive portfolio: MathsAI

A scroll-driven, interactive walk-through of how I took an adaptive maths platform from a teacher's problem to 30+ paying schools.

- Live: https://keith-math-portfolio.keithlau100.workers.dev
- Stack: Vite, TypeScript, GSAP ScrollTrigger, Lenis. Deployed on Cloudflare Workers (static assets).
- The explainers use made-up illustrative examples. The real curriculum map, question banks and diagnosis logic are private and are not in this repo.

## Run

```
npm install
npm run dev
```

## Deploy

```
npm run deploy
```

## Adding the new game

The game frame is a slot, not a game. Host the finished game on https, copy `.env.example` to `.env`,
set `VITE_GAME_URL`, then deploy. The Play button switches on and loads it. To bundle a game instead,
edit `src/game/index.ts`.
