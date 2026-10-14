from pathlib import Path
import re

root = Path(__file__).resolve().parents[2]
original = Path('C:/Users/keith10/.codex/attachments/4e8cf58c-dc42-45cd-af45-47b96d149a8c/Pasted text.txt').read_text(encoding='utf-8-sig')
s = original.replace('# Everything Has a Slope\n### Teaching mathematics by modelling the world around us', '# Everything Has a Slope\n### Mathematical modelling\n### Teaching math by modelling the world around us')
s = s.replace("This builds fluency, and fluency matters. But I often see students who can calculate a gradient perfectly and still can't tell me:\n- why we divide rise by run instead of subtracting one from the other\n- what the number actually means for the ramp in front of them\n- whether their answer is reasonable", "This builds fluency, and fluency matters. But I often see students who can calculate a gradient perfectly and still do not understand what 1:12 means when they see it on a road sign. They can use the formula in an exercise, but cannot connect the number to the road in front of them. I want them to be able to explain it: for every 12 units travelled horizontally, the road rises or falls by 1 unit.")
s = s.replace('By the end they have met almost every one of those pieces, and they have seen how the pieces connect.', 'The ramp establishes rise per unit of horizontal run. Stairs, walls and slides then extend that idea to overall slope, zero and undefined gradients, and a slope that changes from place to place. These are starting points for later work in trigonometry and calculus.')
s = s.replace("The question also has a real standard to check against. Hong Kong's barrier-free design guidance sets 1:12 as the steepest gradient allowed for a ramp. That means the investigation ends with a decision, not just a number.", "For this investigation, I give students a design brief: the ramp should rise no more than 1 unit for every 12 units horizontally. They must use their measurements to decide whether each ramp meets that gradient requirement. This answers one part of the opening question; the surface, width, landings and the person using the ramp also matter.")
s = s.replace("For each one I've noted what I ask, what students usually do, the mistake I expect, and how I respond.", "The sequence sets out my questions, the reasoning I want students to develop, and how I respond to possible mistakes. The measurements below are a worked example for comparing two ramps.")
s = s.replace('Almost everyone points to Ramp A. It is taller and longer, and it looks more impressive.', 'Ramp A is taller and longer, and may look steeper at first. I ask students to record their own choice and their reason before measuring anything.')
s = s.replace('> **From my lesson:** *[Add what your two students guessed first and what they said.]*', '> **Check for understanding:** "What made you choose that ramp? Write down your reason. We will return to it after measuring."')
s = s.replace('The short, low ramp is steeper. This is the moment students usually react, because it contradicts what they pointed to in Stage 1.', 'The short, low ramp is steeper. Students now return to their first prediction and decide whether the measurements support it. If they change their answer, I ask them to explain which comparison changed their mind.')
s = s.replace('Students reach this conclusion themselves, which is why it stays with them.', 'I ask students to explain why the ratio stays the same while the difference changes, so they can justify the choice of division themselves.')
s = s.replace('> **From my lesson:** *[Add the moment your students realised they needed to compare, not just measure.]*', '> **Check for understanding:** "A third ramp rises 15 cm over 2 m horizontally. Which of our ramps is it equally steep as, and how do you know?"\nIt matches Ramp A: both rise 7.5 cm per metre. I look for an explanation using comparable quantities, rather than a guess based on the ramps\' sizes.')
s = s.replace('Now I bring in the standard.\n> **"Hong Kong says a ramp can be no steeper than 1:12. Do our ramps pass?"**\n1:12 means rising 1 unit for every 12 across, a gradient of about 0.083. Ramp A (0.075) passes. Ramp B (0.125) fails.', 'Now I bring in the design brief.\n> **"Our brief says the ramp can be no steeper than 1:12. Which ramp meets that requirement?"**\n1:12 means rising 1 unit for every 12 units horizontally, a gradient of about 0.083. Ramp A (0.075) meets this gradient requirement. Ramp B (0.125) is too steep for the brief.\nI ask students to sketch what 1:12 means and label both lengths in the same units. Then they connect the ratio to the ramp in front of them: a horizontal run of 1.2 m would allow a rise of 10 cm. Ramp B rises 15 cm over that distance.\nThe decision must include an explanation. "It fails" is incomplete; "it rises 5 cm more than our brief allows over 1.2 m" connects the calculation to the actual shape.')
s += '''
---
### Stage 6: Which length is the run?
I return to the measurements students chose in Stage 3. A tape laid along the ramp and a spirit level held horizontally do not measure the same length.
> **"Our two methods give different lengths. Which one belongs in rise divided by run?"**
Students sketch a side view of the ramp as a right triangle. They label the vertical rise, the horizontal run and the sloping surface. I ask them to trace the direction of each measurement with a finger before writing a calculation.
**The mistake I expect:** using the sloping surface as the run because that is the length a person travels along the ramp.
**How I respond:** I use an example triangle with a rise of 3 units, a horizontal run of 4 and a sloping length of 5. Rise divided by run is 3/4. Using 3/5 answers a different question: how the rise compares with distance along the surface. Both ratios describe the triangle, but only the first is its gradient.
> **"If the sign says 1:12, where would you put the 1 and the 12 on your sketch?"**
The 12 belongs on the horizontal side. Students revisit their measurements and revise any calculation that used the sloping length. For students who know trigonometry, I connect this to the angle of inclination: gradient equals tan(theta), while rise divided by sloping length equals sin(theta).
### Stage 7: Use the model to make a decision
I give students a new problem to solve independently, before comparing approaches with a partner.
> **"An entrance is 30 cm above the ground. You have 3 m of horizontal space. Can a straight ramp meet our 1:12 brief? If not, what needs to change?"**
Students draw and label a model, convert the units and calculate. A rise of 0.30 m over a run of 3 m gives a gradient of 0.10, or 1:10. This is steeper than 1:12. A 30 cm rise needs at least 3.6 m of horizontal run to meet the brief.
**The mistake I expect:** assuming 1:12 is steeper than 1:10 because 12 is the larger number.
**How I respond:** "Hold the rise at 1 unit. Which ramp spreads that rise over more ground? Draw both." Students use their sketches to explain why a larger run makes the ramp gentler.
To finish, I ask students to explain a 1:12 road sign in their own words and invent a pair of rise and run measurements that match it. I look for three things: a horizontal run, consistent units, and a ratio that describes the shape. This checks whether they can carry the idea beyond the original example.
---
## 4. Part B: Finding slope beyond the ramp
The next part of the investigation takes the same question to other familiar places: how much does the height change as we move horizontally? Each setting tests where our model works and where we need to refine it.
### Stairs: one step or the whole staircase?
> **"A staircase has flat treads and vertical risers. How can the whole staircase have a slope?"**
Students sketch a side view and draw a straight line through the front edges of equal steps. For example, a rise of 15 cm and a horizontal tread depth of 30 cm give an overall gradient of 1:2. Across four equal rise-and-run units, the totals are 60 cm and 120 cm, and the ratio is unchanged.
The distinction matters: each tread is horizontal and each riser is vertical. The line through the step edges models the overall incline; it is not the shape of every part of the surface. Students decide which model answers the question they are asking.
I then reverse the direction of travel on the sketch. With horizontal position increasing to the right, a staircase rising to the right has a positive gradient; one falling to the right has a negative gradient. The sign describes the direction of change, while the magnitude describes steepness.
### Level ground and walls: zero or undefined?
> **"A level path and a vertical wall both have a zero in the calculation. Does that make their gradients the same?"**
On a level path, the rise is zero while the horizontal run is nonzero, so the gradient is zero. On a vertical wall, the height changes but the horizontal run is zero. Division by zero is undefined, so a vertical line has no defined numerical gradient.
I ask students to sketch a ramp becoming steeper while its rise stays fixed. As its horizontal run gets smaller, the ratio grows. At the vertical wall, the run reaches zero and the calculation no longer gives a defined number. This gives students a reason for the distinction, rather than two rules to memorise.
---
### Slides: when one slope is not enough
> **"Is a curved slide equally steep all the way down? Can one number describe every part of it?"**
Students inspect a slide from the ground and sketch its side profile. They mark a steep section and a gentler section, then explain what would happen if they used only the total height and total horizontal run.
That calculation gives the average gradient between the endpoints. Two slides could share those endpoints and still have very different shapes. A single average hides the changes along the way.
On the sketch, students choose two nearby points on one section and draw a straight line between them. They repeat this elsewhere and compare the gradients. Then they bring the points closer together around one location to estimate how steep the slide is there.
This introduces the idea behind a tangent and, later, a derivative: describing the rate of change at a particular point. I do not need to teach formal differentiation here. I want students to recognise the question that differentiation will eventually help them answer.
### Back to a graph
Students turn a ramp's side view into a graph, with horizontal distance on the x-axis and height on the y-axis. The rise and run now become changes in coordinates. The gradient formula records the same comparison they made outdoors.
I finish with a transfer question: "If the horizontal axis showed time and the vertical axis showed distance travelled, what would rise divided by run mean?" It would be distance per unit of time: speed. The operation is the same, but the axes determine its meaning and units.
---
## 5. Reflection: mathematics as a tool for understanding
I want students to see mathematics as a tool for understanding the world. It should have a purpose beyond an exam or a page of equations in an exercise book. A road sign, a staircase or a slide should give them something they can investigate with it.
In this lesson, the formula comes after a need. Students need a fair way to compare two ramps, so they compare rise per unit of horizontal run. They need to interpret 1:12, so they connect a ratio to distances they can measure. They meet stairs and curved slides, so they have to think about what one gradient can describe and what it leaves out.
The part I care about most is whether students can explain their decisions. A correct number matters, but I also want to hear why they measured horizontally, why scaling a ramp does not change its steepness, and why an average gradient cannot describe every part of a slide. Those explanations show whether the mathematics has meaning for them.
My role is to give students enough structure to make progress while leaving them decisions to make. I can offer a counterexample, a measurement tool or a question without immediately supplying the method. I also need to know when to pause: if students still confuse the sloping length with the horizontal run, that deserves attention before moving on to curves or calculus.
The route can be spread across lessons. The ramp investigation is the core; stairs, walls and slides extend it when students are ready. For a future iteration, I would use their initial sketches and final explanations to decide which connection needs more time.
> **I want students to leave with a habit: look at something in the world, ask a question, build a mathematical model, and use it to make sense of what they see.**
'''
s = s.replace('–', '-').replace('—', '-')
(root/'tmp/pdfs/slope_content.txt').write_text(s, encoding='utf-8')
builder = (root/'tmp/pdfs/format_supplied.py').read_text(encoding='utf-8')
builder = re.sub(r"SRC=Path\([^\n]+\)", "SRC=ROOT/'tmp/pdfs/slope_content.txt'", builder)
builder = builder.replace("breaks=('## 2.','## 3.','### Stage 2:','### Stage 4:')", "breaks=('## 2.','## 3.','### Stage 2:','### Stage 4:','### Stage 6:','## 4.','### Slides:','## 5.')")
builder = builder.replace("s.startswith('### Teaching')", "s.startswith(('### Teaching', '### Mathematical'))")
(root/'tmp/pdfs/build_updated.py').write_text(builder, encoding='utf-8')
