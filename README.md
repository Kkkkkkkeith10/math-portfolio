# Interactive portfolio: MathsAI

A playable case study of how I took an adaptive maths platform from a teacher's problem to 30+ paying schools, and where its learning experience could go next.

- Live: https://keith-math-portfolio.keithlau100.workers.dev
- Stack: Vite, TypeScript, Three.js, GSAP ScrollTrigger, Lenis. Deployed on Cloudflare Workers (static assets).
- The rooftop mission is a bundled browser-local game with procedural low-poly 3D geometry, directly draggable garden handles, an in-game measurement panel, an optional notebook, full-screen mode, fence checks, prediction feedback, two-design comparison and a fresh question. No account, API key or external game host is required.
- The knowledge tree uses a focused Area neighborhood extracted from the actual MathV4 data: 13 learning units and 16 verified relationships. Solid links are curriculum prerequisites; separately revealed dashed links belong to the selected question or error. Short skill checks are authored teaching examples, and their results describe only the reader's responses.
- Three actual Area (I) questions and six error entries remain available as worked bank examples. The wider bank and diagnosis engine remain private. The 46-question / 64-error-entry figures describe the English Area (I) bank snapshot, not platform-wide totals. Export provenance is recorded in `src/data/area-neighborhood.ts`.
- The teacher section restores the original manual-marking versus live-feedback comparison, using the same 30 authored attempts in both lanes. Animations run for eight seconds and 1.8 seconds, representing the reported next-day versus five-minute feedback times. Select a pupil to see their working and the teacher's next move. Playback pauses offscreen; reduced motion shows the completed snapshot. The reader's garden is shown separately. Pen strokes are preserved as drawings, without pretending to recognise handwriting.
- Generated rooftop artwork and its prompt are documented in [docs/low-poly-art.md](docs/low-poly-art.md).

## Run

```
npm install
npm run dev
```

## Deploy

```
npm run deploy
```

## Experience

1. Play the rooftop garden mission.
2. Explore the real Area prerequisites and check an earlier skill.
3. Compare manual marking with live feedback and inspect a pupil's working.
4. Try one short follow-up question chosen from the mistake.
5. Read three clear statements about Keith's contribution.

The game lives in `src/game/mission.ts`, the procedural scene in `src/game/rooftop.ts`, and shared mission evidence in `src/game/state.ts`. The 3D code loads separately from the main page and suspends rendering offscreen. A generated illustration provides a fallback when WebGL is unavailable. The whiteboard and learning flow still work.
