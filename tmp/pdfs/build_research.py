from pathlib import Path
base=Path(__file__).with_name('build_modelling.py').read_text(encoding='utf-8').split("y=page(1,")[0]
base=base.replace('Keith_Lau_Mathematical_Modelling.pdf','Keith_Lau_Exploration_and_Modelling.pdf').replace("'Learning mathematics through real world exploration'","'Discovering mathematics through real world exploration'")
exec(base)
def para(text,y):return p(text,y,11.1,leading=16.4)+14

y=page(1,'A pedagogical position paper','Discovering mathematics through real world exploration','A slope investigation as a case for guided mathematical modelling')
y=p('Chun Yiu (Keith) Lau',y,12,'Bold')+25
y=p('Abstract',y,14,'Bold')+28
y=para('This paper develops a teaching philosophy in which students encounter mathematics through questions arising from their surroundings. A real-world slope lesson with two secondary-school students provides the starting point for an analytical reconstruction. The paper examines how measuring an incline can create a need for ratios, coordinate systems, linear relationships, and the evaluation of evidence. It argues that the educational value of the activity lies in the decisions learners make: defining a question, choosing quantities, interpreting an imperfect measurement, and testing a prediction.',y)
y=para('Published research provides qualified support for mathematical modelling and guided discovery. The case illustrates a plausible mechanism for learning; it does not establish a measured treatment effect. Its wider value is a conception of mathematical understanding that includes deciding when a method is appropriate and whether its answer is credible.',y)
y=p('Central proposition',y,14,'Bold')+27
y=box('I want students to see mathematics as a way to investigate their world. I begin with situations they can explore, and help them develop tools to explain what they discover.',y,113)
y=para('The aim is to connect experience with abstraction. Observation creates a question; mathematical structure makes an answer possible; testing brings that answer back into contact with the world.',y)
p('<b>Basis of the account.</b> The author confirms conducting a real-world slope lesson with two secondary-school students. The site, sequence, dialogue, measurements, and student outcomes have not been documented for this paper. The wall investigation and numerical results below are an illustrative reconstruction, not a record of observed student performance.',y,9.3,color=MUTED)
end()

y=page(2,'1  Rationale and research context','Why begin with a real situation?')
y=para('A learner may calculate a gradient from two labelled points while remaining uncertain about how to recognise a useful gradient in the world. The pedagogical question is therefore broader than whether a student can execute a procedure: can the student identify quantities, construct a representation, and judge whether the procedure answers the question being asked?',y)
y=para('Outdoor exploration makes these choices visible. A wall does not supply labelled axes. A ramp does not announce which distance should be the denominator. The teacher can use this incompleteness to create a reason for mathematical precision. The proposed mechanism is that definitions become responses to a problem learners understand, rather than vocabulary whose purpose must be accepted in advance.',y)
y=p('Modelling and supported discovery',y,14,'Bold')+26
y=para('The GAIMME framework treats modelling as an iterative relationship between a real situation and its mathematical representation. Assumptions, interpretation, and revision are part of the work [1]. This supports a lesson in which students decide what to measure and test a representation against further evidence.',y)
y=para('Discovery also requires support. Across 164 studies, Alfieri and colleagues found that unassisted discovery generally compared unfavourably with explicit instruction, while enhanced or assisted discovery had favourable outcomes relative to its comparison conditions [2]. This distinction informs the teacher’s role here: preserve decisions that develop reasoning, while supplying feedback, examples, and explanations when needed.',y)
y=para('A 2025 meta-analysis by Ünlü and Ertekin combined 51 effect sizes from 45 studies and reported a positive pooled effect on mathematics achievement (Hedges’s g = 0.845; 95% CI 0.712-0.978). Effects were heterogeneous and varied with research design and mathematical topic [3]. This supports investigating modelling as an instructional approach; it cannot establish the effectiveness of this particular lesson or isolate the contribution of being outdoors.',y)
p('Research question: How can a real-world slope investigation create opportunities for conceptual understanding, mathematical judgment, and transfer?',y,12,'Italic')
end()

y=page(3,'2  Case reconstruction and analytical approach','Making slope a question')
y=para('The reported teaching context involved two secondary-school students. To examine the philosophy in concrete terms, the reconstruction uses an accessible slanted wall or rigid panel with a visible side profile. The guiding question is whether its lean can be described by one relationship and used to predict a position that has not yet been measured.',y)
y=para('An initial visual judgment provides a starting point. The teacher asks how another person could verify that judgment. A measurement plan must specify a vertical reference, a base height, a direction for horizontal offsets, and common units. A plumb line and level can make these references tangible. Only accessible heights are used; the task concerns geometry, not structural assessment.',y)
y=para('The mathematical decision is to represent one vertical cross-section, treating the relevant profile as approximately straight. Measurements at several heights can then be organised into a table. A further measurement is reserved for validation. This makes the model accountable to evidence that was not used to construct it.',y)
y=para('The two learners could take turns measuring and checking, then each explain the relationship independently. Pair work creates an opportunity to compare reasons, but agreement between partners should not be taken as proof that both understand. Separate predictions would make that distinction visible.',y)
y=p('What the reconstruction can establish',y,14,'Bold')+27
y=para('The analysis follows the demands built into the task: choosing variables, coordinating representations, interpreting a ratio, and evaluating a prediction. It identifies learning opportunities and the evidence that would support them. It does not assign fabricated statements, misconceptions, or improvements to the two students.',y)
y=para('Outdoor ramp and handrail investigations already appear in MathCityMap [4]. The distinctive emphasis in this case is the move from obtaining a measurement to defending a model. A numerical angle can be the beginning of that reasoning rather than its endpoint.',y)
end()

y=page(4,'3  Illustrative mathematical results','From measurements to a prediction','The data and validation reading on this page are constructed examples, not student records.')
rows=[('Height h above base (m)','Horizontal offset x (cm)'),('0.0','2.0'),('0.5','3.0'),('1.0','4.0'),('1.5','5.0')]
for i,row in enumerate(rows):
 c.setFillColor(PALE if i else TEAL);c.rect(48,H-y-27,499,27,fill=1,stroke=0)
 for j,t in enumerate(row):p(t,y+6,10,'Bold' if not i else 'Body',white if not i else INK,x=60+250*j,width=230)
 y+=27
y+=17
y=para('The offset increases by 1 cm for each 0.5 m of additional height. In common units, the model is x(h) = 0.02 + 0.02h. The coefficient represents 2 cm of additional displacement per metre upwards. The base offset is separate from the rate of change.',y)
# compact plot with fully labelled axes
t=y; left=100; bottom=H-t-150; pw=330; ph=125
c.setLineWidth(1);c.setStrokeColor(MUTED);c.line(left,bottom,left+pw+10,bottom);c.line(left,bottom,left,bottom+ph+8)
for h in [0,0.5,1,1.5,2]:
 xx=left+h/2*pw;c.setFont('Body',8);c.setFillColor(MUTED);c.drawCentredString(xx,bottom-14,str(h))
for val in [0,2,4,6]:
 yy=bottom+val/7*ph;c.drawRightString(left-9,yy-3,str(val))
c.setStrokeColor(TEAL);c.setLineWidth(1.8);c.line(left,bottom+2/7*ph,left+pw,bottom+6/7*ph)
for h,v in [(0,2),(.5,3),(1,4),(1.5,5)]:
 c.setFillColor(TEAL);c.circle(left+h/2*pw,bottom+v/7*ph,3,fill=1,stroke=0)
c.setFillColor(GOLD);c.circle(left+pw,bottom+6.2/7*ph,4,fill=1,stroke=0)
p('Offset x (cm)',t+2,9,x=58,width=160)
p('Height h (m)',t+173,9,x=230,width=150)
p('Line: model. Green points: construction data. Gold point: illustrative check.',t+195,8.5,color=MUTED)
y=t+229
y=para('At 2 m, the predicted offset is 6 cm. An illustrative check of 6.2 cm leaves a residual of 0.2 cm. If repeated readings vary by about 0.3 cm, the discrepancy is consistent with that measurement resolution. It supports local adequacy, rather than proving that the whole wall is straight.',y)
p('Here the graph’s slope is offset change / height change: lean relative to vertical. Conventional ramp gradient uses rise / horizontal run [5]. For this wall model, the lean angle is arctan(0.02), approximately 1.15 degrees. Choosing the axes is part of the mathematical interpretation.',y,10,color=MUTED)
end()

y=page(5,'4  Pedagogical interpretation','The learning beneath the measurement')
y=para('The first potential gain is problem formulation. Before calculating, a learner must decide what “lean” means in measurable terms. That decision connects everyday language with a mathematical quantity. Evidence would be a student explaining why displacement alone is insufficient and proposing a comparison that accounts for height.',y)
y=para('A second gain is conceptual ownership of ratio. Comparing measurements at different heights creates a reason to distinguish a fixed offset from a rate of change. If the reference line moves sideways, all offsets change by the same amount while the lean remains constant. Explaining this invariance would reveal understanding that a single correct division cannot establish.',y)
y=para('A third gain is judgment about evidence. Differences between readings require learners to consider units, tool placement, and precision. A model need not reproduce every recorded digit to be useful. Conversely, a tidy equation is insufficient when its predictions systematically miss the observations. This creates an opportunity to discuss what counts as a reasonable answer.',y)
y=para('Mistakes can also become diagnostic. Dividing the total offset by height would ignore the intercept in the illustrative example. Measuring along an inclined surface instead of horizontally would change the intended quantity. Each error would help the teacher identify a specific conceptual gap and choose a targeted question or demonstration. These are anticipated responses, not observed episodes.',y)
y=para('The less visible value is a change in the learner’s responsibility. In a fully specified exercise, quantities and representations may already be chosen. In this investigation, students help decide what information should exist and how the answer can be checked. Routine practice remains valuable for fluency; exploration adds occasions to use that fluency with judgment.',y)
y=para('These opportunities may encourage confidence in asking questions and revising an explanation. Such benefits should be treated as hypotheses until supported by student work or observation. Enjoyment, participation, and conceptual understanding are related possibilities, but they are different outcomes.',y)
end()

y=page(6,'5  Discussion and implications','What the case supports')
y=para('The reconstructed case supports the coherence of a pedagogy: begin with an observable question, help learners construct a useful representation, and return to evidence to evaluate the answer. Its strongest contribution is an account of how mathematical ideas can acquire purpose during an investigation. A slope becomes a tool for explaining a relationship and making a prediction.',y)
y=para('The outdoor setting supplies accessible objects, competing impressions, and imperfect measurements. These features create productive decisions only when the task is carefully structured. A change of location by itself offers no guarantee of learning. The same reasoning could be supported indoors with physical models or online through calibrated images and withheld measurements.',y)
y=p('Limits of the evidence',y,14,'Bold')+27
y=para('Two students and an undocumented lesson cannot demonstrate a general learning effect. No baseline assessment, comparison condition, retained student work, or delayed transfer evidence is available for this account. Individual attention, prior knowledge, novelty, and the teacher’s prompts could all contribute to any perceived success. The illustrative numerical result is a mathematical result, not an educational outcome.',y)
y=p('How the proposition could be tested',y,14,'Bold')+27
y=para('A future iteration could retain an initial explanation, a measurement plan, an annotated model, and an independent transfer response from each learner. A later task involving a ramp would test whether the ratio is recognised in a new setting. Assessment should distinguish accurate calculation, interpretation of units, justification of assumptions, and revision after conflicting evidence.',y)
y=para('A comparison with a conventional slope exercise would need similar teaching time, prior knowledge, content, and assessment. Both procedural fluency and modelling performance should be examined. This would test whether the added decisions improve learning, rather than assuming that an outdoor lesson is inherently superior.',y)
y=p('Conclusion',y,14,'Bold')+27
p('My philosophy is to help students discover mathematics through questions arising from their world. Guided modelling gives this philosophy a concrete form: students notice, predict, measure, explain, and reconsider. The educational ambition is that they learn both how to calculate and how to recognise when mathematics can help.',y,11.1)
end()

y=page(7,'References','Research and mathematical foundations')
refs=[
('1','Garfunkel, S., & Montgomery, M. (Eds.). (2016).','GAIMME: Guidelines for Assessment and Instruction in Mathematical Modeling Education. COMAP and SIAM.','https://comap.org/images/resources/free_resources/GAIMME_Report.pdf','Framework for interpreting modelling as a process involving assumptions, mathematical work, evaluation, and revision.'),
('2','Alfieri, L., Brooks, P. J., Aldrich, N. J., & Tenenbaum, H. R. (2011).','Does discovery-based instruction enhance learning? Journal of Educational Psychology, 103(1), 1-18.','https://doi.org/10.1037/a0021017','Research synthesis informing the distinction between unsupported exploration and discovery with instructional assistance.'),
('3','Ünlü, V., & Ertekin, E. (2025).','Effect of teaching with mathematical modeling on students’ mathematics achievements: A meta-analysis. International Journal of Assessment Tools in Education, 12(3), 549-575.','https://doi.org/10.21449/ijate.1515073','Evidence about achievement across modelling interventions; not a test of this case or an isolated outdoor-learning effect.'),
('4','Larmann, P. (2021, November 29).','Generic Tasks: Slope. MathCityMap.','https://mathcitymap.eu/en/generic-tasks-slope-2/','Practice context for outdoor investigations involving ramps and staircase handrails.'),
('5','U.S. Geological Survey. (n.d.).','To Determine Percent of Slope and Angle of Slope.','https://www.usgs.gov/educational-resources/determine-percent-slope-and-angle-slope','Reference for the distinction between horizontal run, rise, percentage gradient, and angle.')]
for n,a,title,url,note in refs:
 y=p(f'<b>[{n}] {a}</b> {title}',y,10.2,leading=14.5)+5
 y=p(f'<link href="{url}" color="#246A5A">Open source</link> | {note}',y,9.2,leading=13.1,color=MUTED)+22
y=p('Account and evidence',y,13,'Bold')+26
p('This paper combines the author’s report of teaching a slope lesson to two secondary-school students with an explicitly reconstructed activity and an interpretive analysis. No student quotations, scores, or measured learning gains are asserted. Published findings are attributed to their sources; the proposed learning mechanisms are the argument developed in this paper.',y,10,color=MUTED)
end()
c.save()
print(OUT)
