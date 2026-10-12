import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/caveat";
import "./style.css";

import { initMotion } from "./motion";
import { refreshOnLoad } from "./scene";
import { initClassroom } from "./sections/classroom";
import { initDiagnosis } from "./sections/diagnosis";
import { initExperience } from "./sections/experience";
import { initFunnel } from "./sections/funnel";
import { initGame } from "./sections/game";
import { initLoop } from "./sections/loop";
import { initReward } from "./sections/reward";
import { initStory } from "./sections/story";
import { initTeacher } from "./sections/teacher";

// Build every scene first, so scroll positions are measured against the final layout.
initStory();
initGame();
initClassroom();
initDiagnosis();
initReward();
initTeacher();
initLoop();
initFunnel();
initExperience();
initMotion();
refreshOnLoad();
