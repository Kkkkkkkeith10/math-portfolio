import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/caveat";
import "./style.css";

import { initMotion } from "./motion";
import { refreshOnLoad } from "./scene";
import { initDiagnosis } from "./sections/diagnosis";
import { initExperience } from "./sections/experience";
import { initFunnel } from "./sections/funnel";
import { initGame } from "./sections/game";
import { initKnowledge } from "./sections/knowledge";
import { initLearningFlow } from "./sections/learning-flow";

// Build every scene first, so scroll positions are measured against the final layout.
initGame();
initDiagnosis();
initKnowledge();
initLearningFlow();
initFunnel();
initExperience();
initMotion();
refreshOnLoad();
