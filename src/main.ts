import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/inter";
import "./style.css";

import { initMotion } from "./motion";
import { initClassroom } from "./sections/classroom";
import { initDiagnosis } from "./sections/diagnosis";
import { initFunnel } from "./sections/funnel";
import { initGame } from "./sections/game";
import { initExperience } from "./sections/experience";

// Interactive parts first, so scroll animations measure the final layout.
initClassroom();
initDiagnosis();
initFunnel();
initGame();
initExperience();
initMotion();
