import { getGardenState, updateGardenState, type GardenPlan, type GardenState } from "./state";
import type { RooftopHandle } from "./rooftop";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./garden.css";

export function mountMission(container: HTMLElement): { destroy(): void } {
  container.innerHTML = `
  <div class="garden-shell" data-phase="meet">
    <header class="garden-top"><span class="garden-brand"><i aria-hidden="true">✳</i> Math Town <small>/ Rooftop garden</small></span><div class="garden-top-actions"><span class="garden-label">Playable portfolio concept</span><button type="button" id="garden-fullscreen" aria-pressed="false">⛶ Full screen</button></div></header>
    <ol class="garden-steps" aria-label="Mission progress"><li data-step="meet"><span>01</span> Meet Mei</li><li data-step="build"><span>02</span> Make a plan</li><li data-step="compare"><span>03</span> Compare</li><li data-step="transfer"><span>04</span> Try a twist</li></ol>
    <div class="garden-world-layout">
      <div class="garden-world">
        <div id="rooftop-scene" role="group" aria-label="Interactive low-poly rooftop garden. Drag the gold corner or the teal side handles to resize your garden; the side panel also has keyboard-accessible sliders." data-lenis-prevent></div>
        <span class="garden-location">⌖ Sham Shui Po · Rooftop garden</span><span id="garden-direct-hint" hidden>Drag a glowing handle to shape your garden</span><span id="garden-mobile-fence">Fence: 22 / 24 m</span><div id="garden-world-stat" hidden><span>Harvest</span><b id="garden-harvest">0</b><small>plants</small></div><span class="garden-render-note">Rooftop garden</span>
        <details id="garden-notebook" class="garden-notebook" hidden><summary>✎ My notebook</summary><div class="garden-board-wrap"><div class="garden-toolbar" role="group" aria-label="Notebook tools"><button type="button" data-tool="shape" aria-pressed="true">↔ <span>Diagram</span></button><button type="button" data-tool="pen" aria-pressed="false">✎ <span>Pen</span></button><button type="button" data-tool="eraser" aria-pressed="false">▱ <span>Eraser</span></button><button type="button" id="garden-ruler" aria-pressed="true">⌇ <span>Measure</span></button><button type="button" id="garden-undo" aria-label="Undo last whiteboard change">↶ <span>Undo</span></button></div><svg id="garden-board" role="img" aria-label="Your garden diagram and handwritten notes" data-lenis-prevent><defs><pattern id="garden-grid-pattern" patternUnits="userSpaceOnUse"><path id="garden-grid-path" fill="none"/></pattern></defs><rect width="100%" height="100%" fill="url(#garden-grid-pattern)"/><g id="garden-board-geometry"></g><g id="garden-board-ink"></g></svg><div class="garden-board-foot"><span>□ Each square is 1 m²</span><span id="garden-tool-hint">Sketch your working here</span></div></div></details>
        <section id="garden-comparison" class="garden-comparison garden-scene-panel" hidden><span class="garden-caption">Your discovery</span><h3>Same fence. A different harvest.</h3><div id="garden-plan-cards" class="garden-plan-cards"></div><p id="garden-comparison-note"></p><div class="garden-actions"><button type="button" class="garden-secondary" id="garden-experiment">Keep experimenting</button><button type="button" class="garden-primary" id="garden-twist">Try a new fence allowance →</button></div></section>
        <section id="garden-transfer" class="garden-transfer garden-scene-panel" hidden><span class="garden-caption">A fresh situation</span><h3>Next door has 20 metres of fence.</h3><p>Both gardens use it all. Which one grows more plants?</p><div class="garden-transfer-options"><button type="button" data-transfer="21"><span class="transfer-mini transfer-long"></span><b>3 m × 7 m</b><span>Choose this garden</span></button><button type="button" data-transfer="24"><span class="transfer-mini transfer-square"></span><b>4 m × 6 m</b><span>Choose this garden</span></button></div><p id="garden-transfer-feedback" aria-live="polite"></p></section>
        <section id="garden-complete" class="garden-complete garden-scene-panel" hidden><div class="garden-find"><span class="garden-caption">Your first Find</span><span class="garden-find-symbol" aria-hidden="true">✳</span><h3>Same fence,<br>different space.</h3><p>The edge and the space inside measure different things.</p><span class="garden-find-tag">Area · Perimeter</span></div><div><span class="garden-caption">Experiment complete</span><h3>You made the discovery.</h3><p>Your fresh answer matches: 4 × 6 gives 24 plants, compared with 3 × 7 giving 21.</p><p>Next, see how MathsAI traces a mistake to the learning foundation that needs help.</p><a class="garden-primary" href="#error">Find the learning gap ↗</a><button type="button" class="garden-text-button" id="garden-restart">Try the garden again</button></div></section>
      </div>
      <aside class="garden-guide"><div class="mei-avatar" aria-hidden="true">♧</div><p class="garden-character">Auntie Mei <span>Community gardener</span></p><h3 id="mei-title">Help Mei<br>grow more.</h3><p id="mei-speech">Use all 24 metres of fence. Each square metre grows one plant.</p>
        <div id="garden-intro"><p class="garden-prompt">Which shape might grow more?</p><div class="garden-predictions" aria-label="Your first prediction"><button type="button" data-first="long" aria-pressed="false">Long & thin</button><button type="button" data-first="square" aria-pressed="false">Closer to a square</button><button type="button" data-first="unsure" aria-pressed="false">Let's find out</button></div><button type="button" class="garden-primary" id="garden-start">Make my garden ↗</button><small class="garden-duration">Drag in the scene. Discover what grows.</small></div>
        <div id="garden-guide-active" hidden><p id="garden-instruction">Drag a handle. Predict the plants.</p><div class="garden-fence-meter"><div><span>Fence used</span><output id="fence-count">22 / 24 m</output></div><div class="garden-meter-track"><i id="fence-fill"></i></div><p id="fence-note">2 m left</p></div></div>
        <div id="garden-workspace" class="garden-plan-controls" hidden><header><span class="garden-caption">Your garden</span><span id="garden-draft-label">Plan A</span></header><label for="garden-length">Length <output id="garden-length-label">8 m</output></label><input id="garden-length" type="range" min="1" max="11" value="8"><label for="garden-width">Width <output id="garden-width-label">3 m</output></label><input id="garden-width" type="range" min="1" max="11" value="3"><label for="garden-prediction">Predict the harvest</label><div class="garden-guess"><input id="garden-prediction" type="number" inputmode="numeric" min="1" max="121" placeholder="Your guess"><span>plants</span></div><button type="button" class="garden-primary" id="garden-test">Plant & see ↗</button><button type="button" class="garden-secondary" id="garden-next" hidden>Try a different shape →</button><button type="button" class="garden-secondary" id="garden-compare" hidden>Compare plans →</button><div id="garden-saved-plans" class="garden-saved-plans" aria-label="Saved garden designs"></div><details class="garden-equation"><summary>Show the fence calculation</summary><p id="garden-equation">2 × (8 + 3) = 22 m</p></details></div>
        <p id="garden-feedback" aria-live="polite" hidden></p>
      </aside>
    </div>
    <footer class="garden-bottom"><span>Built for curiosity. Grounded in maths.</span><a href="#error">How the system finds the gap →</a></footer>
  </div>`;
  const root = container.querySelector<HTMLElement>(".garden-shell")!;
  const $ = <T extends HTMLElement = HTMLElement>(id: string): T => root.querySelector<T>(`#${id}`)!;
  const all = <T extends Element = HTMLElement>(selector: string): T[] => [...root.querySelectorAll<T>(selector)];
  const board = root.querySelector<SVGSVGElement>("#garden-board")!;
  const geometry = root.querySelector<SVGGElement>("#garden-board-geometry")!;
  const ink = root.querySelector<SVGGElement>("#garden-board-ink")!;
  let scene: RooftopHandle | null = null, destroyed = false;
  let draft = { length: 8, width: 3, ink: [] as number[][][] };
  let tool = "shape", measure = true, harvested = false, planNumber = 0;
  let boardWidth = 600, unit = 28;
  let pointerMode: "shape" | "draw" | null = null, stroke: number[][] | null = null;
  const history: typeof draft[] = [];
  const controller = new AbortController();
  const on = (el: EventTarget, event: string, callback: EventListener): void => el.addEventListener(event, callback, { signal: controller.signal });
  const remember = (): void => { history.push(structuredClone(draft)); if (history.length > 30) history.shift(); };
  function svg(tag: string, attrs: Record<string, string | number>, parent: Element): SVGElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v)); parent.appendChild(el); return el;
  }
  function drawInk(): void { ink.replaceChildren(); draft.ink.forEach(points => svg("polyline", { points: points.map(([x,y]) => `${x*boardWidth},${y*360}`).join(" "), class: "garden-ink-stroke" }, ink)); }
  function drawBoard(): void {
    const width = board.parentElement!.clientWidth; if (width > 0) boardWidth = width;
    unit = Math.min(28, (boardWidth - 92) / 11);
    board.setAttribute("viewBox", `0 0 ${boardWidth} 360`);
    const pattern = root.querySelector("#garden-grid-pattern")!;
    for (const [k,v] of Object.entries({ width: unit, height: unit, x:42, y:30 })) pattern.setAttribute(k,String(v));
    root.querySelector("#garden-grid-path")!.setAttribute("d", `M${unit} 0H0V${unit}`);
    geometry.replaceChildren();
    const x=42,y=30,w=draft.length*unit,h=draft.width*unit;
    svg("rect",{x,y,width:w,height:h,class:"garden-board-plot"},geometry);
    if(harvested)for(let r=0;r<draft.width;r++)for(let c=0;c<draft.length;c++){
      const g=svg("g",{transform:`translate(${x+(c+.5)*unit},${y+(r+.5)*unit})`,class:"garden-board-plant"},geometry);
      svg("ellipse",{cx:-unit*.1,cy:0,rx:unit*.16,ry:unit*.22,transform:"rotate(-35)"},g);svg("ellipse",{cx:unit*.1,cy:0,rx:unit*.16,ry:unit*.22,transform:"rotate(35)"},g);
    }
    if(measure){svg("text",{x:x+w/2,y:y-12,"text-anchor":"middle"},geometry).textContent=`${draft.length} m`;svg("text",{x:x+w+13,y:y+h/2+5},geometry).textContent=`${draft.width} m`;}
    if(tool==="shape"){svg("circle",{cx:x+w,cy:y+h,r:22,class:"garden-resize-target","data-resize":"true"},geometry);svg("circle",{cx:x+w,cy:y+h,r:9,class:"garden-resize-handle","data-resize":"true"},geometry);}
    drawInk();
  }
  function renderDraft(): void {
    const fence=2*(draft.length+draft.width);
    for(const k of ["length","width"] as const){$(`garden-${k}-label`).textContent=`${draft[k]} m`;$<HTMLInputElement>(`garden-${k}`).value=String(draft[k]);}
    $("fence-count").textContent=`${fence} / 24 m`;$("fence-fill").style.width=`${Math.min(1,fence/24)*100}%`;$("fence-fill").classList.toggle("over-budget",fence>24);
    $("garden-mobile-fence").textContent=`Fence: ${fence} / 24 m`;
    $("fence-note").textContent=fence>24?`${fence-24} m too much`:fence===24?"All fence used ✓":`${24-fence} m left`;
    $("garden-equation").textContent=`2 × (${draft.length} + ${draft.width}) = ${fence} m`;$("garden-draft-label").textContent=`Plan ${String.fromCharCode(65+planNumber)}`;
    $("garden-world-stat").hidden=!harvested;$("garden-harvest").textContent=String(draft.length*draft.width);
    $("garden-next").hidden=!harvested||getGardenState().plans.length!==1;$("garden-compare").hidden=!harvested||getGardenState().plans.length<2;
    $<HTMLButtonElement>("garden-undo").disabled=!history.length;drawBoard();scene?.updateGarden(draft.length,draft.width,harvested);
  }
  function phase(value: GardenState["phase"]): void {
    updateGardenState({phase:value});root.dataset.phase=value;
    for(const [id,at]of [["garden-intro","meet"],["garden-workspace","build"],["garden-comparison","compare"],["garden-transfer","transfer"],["garden-complete","complete"]])$(id).hidden=value!==at;
    $("garden-guide-active").hidden=value==="meet"||value==="complete";
    $("garden-notebook").hidden=value!=="build";
    $("garden-direct-hint").hidden=value!=="build";
    $("garden-feedback").hidden=value!=="build";
    scene?.setInteractive(value==="build", (length,width)=>{if(draft.length===length&&draft.width===width)return;draft.length=length;draft.width=width;changed();});
    all<HTMLElement>("[data-step]").forEach(el=>{if(el.dataset.step===(value==="complete"?"transfer":value))el.setAttribute("aria-current","step");else el.removeAttribute("aria-current");});
    const titles={meet:"Help Mei<br>grow more.",build:"Your garden",compare:"Which plan<br>grows more?",transfer:"Try the idea<br>with less fence.",complete:"You found<br>the difference."};
    $("mei-title").innerHTML=titles[value];
    const speeches={meet:"Use all 24 metres of fence. Each square metre grows one plant.",build:"",compare:"Both use 24 m of fence.",transfer:"Both choices use 20 m.",complete:"Same fence. Different space."};
    $("mei-speech").textContent=speeches[value];scene?.setStage(value);requestAnimationFrame(()=>{if(value==="build")drawBoard();ScrollTrigger.refresh();});
    if(value==="compare")$("garden-instruction").textContent="Compare the plants.";
    if(value==="transfer")$("garden-instruction").textContent="Choose the bigger planting space.";
  }
  function saved():void{$("garden-saved-plans").innerHTML=getGardenState().plans.map((p,i)=>`<span><b>Plan ${String.fromCharCode(65+i)}</b> ${p.length} × ${p.width} m <em>${p.area} plants</em></span>`).join("");}
  function changed():void{harvested=false;$("garden-feedback").textContent="";renderDraft();}
  all<HTMLButtonElement>("[data-first]").forEach(b=>on(b,"click",()=>{all("[data-first]").forEach(el=>el.setAttribute("aria-pressed",String(el===b)));$("mei-speech").textContent="Try two shapes to find out.";}));
  on($("garden-start"),"click",()=>{phase("build");renderDraft();$("garden-length").focus({preventScroll:true});if(window.matchMedia('(max-width:700px)').matches)requestAnimationFrame(()=>$("rooftop-scene").scrollIntoView({block:"start",behavior:"instant"}));});
  on($("rooftop-scene"),"pointerdown",remember);
  on($("garden-notebook"),"toggle",()=>requestAnimationFrame(drawBoard));
  on($("garden-fullscreen"),"click",()=>{
    if(document.fullscreenElement===root)void document.exitFullscreen().catch(()=>undefined);
    else if(root.requestFullscreen)void root.requestFullscreen().catch(()=>{$("garden-feedback").hidden=false;$("garden-feedback").textContent="Full screen isn't available here. The garden still fills the page.";});
  });
  on(document,"fullscreenchange",()=>{const active=document.fullscreenElement===root;$("garden-fullscreen").setAttribute("aria-pressed",String(active));$("garden-fullscreen").textContent=active?"⛶ Exit full screen":"⛶ Full screen";requestAnimationFrame(()=>{drawBoard();ScrollTrigger.refresh();});});
  on(root,"click",event=>{if((event.target as Element).closest('a[href^="#"]')&&document.fullscreenElement===root)void document.exitFullscreen().catch(()=>undefined);});
  all<HTMLButtonElement>("[data-tool]").forEach(b=>on(b,"click",()=>{tool=b.dataset.tool!;all("[data-tool]").forEach(el=>el.setAttribute("aria-pressed",String(el===b)));board.dataset.tool=tool;$("garden-tool-hint").textContent=tool==="pen"?"Write your working on the board":tool==="eraser"?"Touch a pen stroke to erase it":"Drag the round corner";drawBoard();}));
  on($("garden-ruler"),"click",()=>{measure=!measure;$("garden-ruler").setAttribute("aria-pressed",String(measure));drawBoard();});
  on($("garden-undo"),"click",()=>{const last=history.pop();if(last){draft=last;changed();}});
  for(const k of ["length","width"] as const){const input=$<HTMLInputElement>(`garden-${k}`);on(input,"pointerdown",remember);on(input,"keydown",e=>{if((e as KeyboardEvent).key.startsWith("Arrow"))remember();});on(input,"input",()=>{draft[k]=Number(input.value);changed();});}
  on($("garden-prediction"),"input",()=>{if(harvested){harvested=false;$("garden-feedback").textContent="Test again to check your new prediction.";renderDraft();}});
  function point(e:PointerEvent):[number,number]{const p=board.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(board.getScreenCTM()!.inverse());return[q.x,q.y];}
  on(board,"pointerdown",event=>{const e=event as PointerEvent;if(tool==="shape"&&!(e.target as Element).hasAttribute("data-resize"))return;e.preventDefault();remember();board.setPointerCapture(e.pointerId);const[x,y]=point(e);if(tool==="shape")pointerMode="shape";else if(tool==="pen"){pointerMode="draw";stroke=[[x/boardWidth,y/360]];draft.ink.push(stroke);drawInk();}else{let index=-1;draft.ink.forEach((points,i)=>{if(points.some(([px,py])=>Math.hypot(px*boardWidth-x,py*360-y)<18))index=i;});if(index>=0)draft.ink.splice(index,1);drawInk();}$<HTMLButtonElement>("garden-undo").disabled=false;});
  on(board,"pointermove",e=>{if(!pointerMode)return;const[x,y]=point(e as PointerEvent);if(pointerMode==="shape"){draft.length=Math.max(1,Math.min(11,Math.round((x-42)/unit)));draft.width=Math.max(1,Math.min(11,Math.round((y-30)/unit)));changed();}else if(stroke&&stroke.length<1200){stroke.push([x/boardWidth,y/360]);drawInk();}});
  const stop=():void=>{pointerMode=null;stroke=null;};on(board,"pointerup",stop);on(board,"pointercancel",stop);
  on($("garden-test"),"click",()=>{
    const v=$<HTMLInputElement>("garden-prediction").value,prediction=Number(v);
    if(!v||!Number.isInteger(prediction)||prediction<1||prediction>121){$("garden-feedback").textContent="Enter your plant prediction first.";$("garden-prediction").focus({preventScroll:true});return;}
    const fence=2*(draft.length+draft.width),area=draft.length*draft.width;
    const plan:GardenPlan={id:Date.now(),length:draft.length,width:draft.width,fence,area,prediction,correctPrediction:prediction===area,validFence:fence===24,ink:structuredClone(draft.ink)};
    updateGardenState({activePlan:plan});
    if(!plan.validFence){$("garden-feedback").textContent=fence>24?`Needs ${fence} m. You have 24 m.`:`Use the remaining ${24-fence} m.`;return;}
    const plans=getGardenState().plans,same=plans.some(p=>Math.min(p.length,p.width)===Math.min(plan.length,plan.width)&&Math.max(p.length,p.width)===Math.max(plan.length,plan.width));
    if(!same)updateGardenState({plans:[...plans,plan].slice(-2)});
    else updateGardenState({plans:plans.map(p=>Math.min(p.length,p.width)===Math.min(plan.length,plan.width)&&Math.max(p.length,p.width)===Math.max(plan.length,plan.width)?plan:p)});
    harvested=true;renderDraft();saved();
    $("garden-feedback").textContent=`${area} plants. ${plan.correctPrediction?"Prediction matches!":`You predicted ${prediction}. Count the squares.`}${same?" Try another shape.":""}`;
    $("garden-instruction").textContent="1 square metre = 1 plant.";
  });
  on($("garden-next"),"click",()=>{planNumber=1;harvested=false;draft.ink=[];history.length=0;$<HTMLInputElement>("garden-prediction").value="";$("garden-feedback").textContent="";$("garden-instruction").textContent="Try a different shape. Same 24 m of fence.";renderDraft();});
  on($("garden-compare"),"click",()=>{const plans=getGardenState().plans;if(plans.length<2)return;$("garden-plan-cards").innerHTML=plans.map((p,i)=>`<article class="garden-plan-card"><span class="garden-caption">Plan ${String.fromCharCode(65+i)}</span><div class="garden-mini-diagram"><div style="width:${p.length*15}px;height:${p.width*15}px"></div></div><h4>${p.length} m × ${p.width} m</h4><p><b>${p.area}</b> plants <span>24 m of fence</span></p><small>You predicted ${p.prediction} plants</small></article>`).join("");$("garden-comparison-note").textContent=`You found ${Math.abs(plans[0].area-plans[1].area)} extra plants inside the same length of fence. For these rectangular gardens, a shape closer to a square makes more room.`;phase("compare");});
  on($("garden-experiment"),"click",()=>{harvested=false;phase("build");renderDraft();});on($("garden-twist"),"click",()=>phase("transfer"));
  all<HTMLButtonElement>("[data-transfer]").forEach(b=>on(b,"click",()=>{all("[data-transfer]").forEach(el=>el.setAttribute("aria-pressed",String(el===b)));if(b.dataset.transfer!=="24"){$("garden-transfer-feedback").textContent="3 × 7 grows 21 plants. Compare it with 4 × 6. Both use 20 metres of fence.";return;}updateGardenState({transferPassed:true});phase("complete");}));
  on($("garden-restart"),"click",()=>{updateGardenState({plans:[],activePlan:null,transferPassed:false});draft={length:8,width:3,ink:[]};harvested=false;planNumber=0;history.length=0;$<HTMLInputElement>("garden-prediction").value="";$("garden-transfer-feedback").textContent="";all("[data-transfer]").forEach(b=>b.removeAttribute("aria-pressed"));saved();phase("meet");renderDraft();});
  const resize=new ResizeObserver(drawBoard);resize.observe($("garden-workspace"));resize.observe(root.querySelector('.garden-board-wrap')!);phase("meet");renderDraft();
  void import("./rooftop").then(({mountRooftop})=>{if(destroyed)return;scene=mountRooftop($("rooftop-scene"));scene.updateGarden(draft.length,draft.width,harvested);scene.setStage(getGardenState().phase);scene.setInteractive(getGardenState().phase==="build",(length,width)=>{if(draft.length===length&&draft.width===width)return;draft.length=length;draft.width=width;changed();});}).catch(()=>{if(!destroyed){$("rooftop-scene").innerHTML='<img class="rooftop-poster" src="/img/rooftop-low-poly.webp" alt="Low-poly rooftop garden">';root.querySelector(".garden-render-note")!.textContent="Rooftop artwork";}});
  return{destroy(){destroyed=true;controller.abort();resize.disconnect();scene?.destroy();container.replaceChildren();}};
}
