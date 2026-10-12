import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/caveat";
import "./style.css";
import { initMotion } from "./motion";
import { refreshOnLoad } from "./scene";
import { initExperience } from "./sections/experience";
import { initGame } from "./sections/game";
import { initKnowledge } from "./sections/knowledge";
import { initLearningFlow } from "./sections/learning-flow";

initGame();
initKnowledge();
initLearningFlow();
initExperience();
initMotion();
refreshOnLoad();
