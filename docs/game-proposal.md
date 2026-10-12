# Game proposal (working title: Math Town)

Status: DRAFT for Keith to edit. The portfolio now includes a browser-local playable Garden concept with a low-poly rooftop, planning board and learning walkthrough. The wider game proposed here is still future work.

## 1. One-line pitch

A game where students collect the maths hiding in their own life: they look at it, decide with it, and build with it, and the same prerequisite map that diagnoses their mistakes decides what the game offers next.

## 2. Why this game

- Maths stays on paper. Students can do the exercise and still not see where it appears outside school.
- Version 1 (item collecting, a home, a shop, coins, trophies) made daily practice something students wanted to open. Practice participation went up and student feedback improved.
- Teachers and students then asked for more: practice that connects to real life. This proposal is that next step.
- The diagnosis engine already knows which prerequisite topic a mistake points back to. The game can use it to help at the exact moment a student stalls.

## 3. Who it is for

- Hong Kong primary students (roughly P3 to P6), at school and after school.
- Teachers, who see mission results and gaps on the existing dashboard.

## 4. The idea in one picture

The town is the hub. Real life is the playground. Every mission is one of three kinds:

| Mode | The student... | Mission in this proposal |
|---|---|---|
| **Look** | notices maths that was already there | Maths X-ray |
| **Decide** | makes a choice using maths and lives with the result | The Market |
| **Make** | builds something and tests it | The Garden |

What a student collects are **Finds**: concept cards for maths discovered in life (for example "Same fence, different space" or "Unit price"). Collecting stops being decoration and becomes the learning.

## 5. The loop every mission follows

1. **Hook.** A situation with no numbers given.
2. **Ask.** The student decides what they would need to know.
3. **Gather.** They pick tools, or do an optional **field task** (measure something real) and the game uses their number.
4. **Commit.** They write a plan or answer on a notebook page (handwritten working, graded by the existing pipeline).
5. **World responds.** The result shows in the fiction. No red cross: the garden grows or does not, the till total comes out.
6. **Name it.** Only now does the game name the concept.
7. **Collect.** A Find card is added. The matching topic lights up on the student's learning map.
8. **Twist.** A variation to check the idea transfers.

## 6. Design rules (the test every mission must pass)

1. Built around a decision, not just a number.
2. In the child's world, not an adult's.
3. Quantities are gathered or estimated, not handed over.
4. Reality can push back.
5. More than one defensible answer.
6. The concept is discovered first, named after.
7. No random rewards or loot-box mechanics. Rewards are earned and predictable.

## 7. Missions

### A. Maths X-ray (Look)

- **First sight:** a normal Hong Kong scene (a wet market lane, a playground, an escalator). The student taps and the hidden maths appears as overlays: equal lengths, symmetry, angles, tile counts, repeating patterns.
- **The twist that makes it learning:** the student must **predict first** (which is longer, how many tiles?) before the reveal. Then the game shows who was right.
- **Finds:** symmetry, parallel lines, ratio, patterns.
- **Maths:** length, 2D shapes, angles, symmetry, patterns.
- **Build in stages:** (1) authored scenes with hand-placed hotspots, which are reliable; (2) later, the student's own photo, using the vision model, with strict limits (see risks).

### B. The Market (Decide)

- **Hook:** "You have $100 to buy dinner for four. Here is the list."
- **Gather:** stall prices, offers like "3 for $10", and weights. Field task: bring in a real price label from a shop visit.
- **Decisions:** which offer is the better buy, whether the basket fits the budget, estimating the total before the cashier does.
- **World responds:** the till total versus the student's estimate, the change, or "put one thing back".
- **Finds:** unit price, estimating, change.
- **Maths:** money and decimals, add and subtract, multiplication, unit price, rounding, simple percentages.
- **Authentic wrinkle to verify:** many local markets price by the catty (斤). Decide with a teacher whether to show it.

### C. The Garden (Make)

- **Hook:** "You have 24 m of fence. Make a vegetable garden."
- **Make:** drag fence pieces on a grid to build any shape. Each square metre grows one plant. The student sees how many plants fit.
- **The surprise:** the same fence can enclose very different space. A long thin plot holds far fewer plants than a squarer one, and many students expect them to be equal.
- **Field task:** cover a real desk or balcony with paper squares and count.
- **World responds:** the garden grows and the harvest comes in.
- **Finds:** "Same fence, different space", area by covering with squares, composite shapes (L-shaped plots).
- **Maths:** perimeter, area of rectangles, composite shapes, estimating area.
- **Why it is a good first build:** it is mostly front-end, the concept is strong, and the typical error (mixing up perimeter and area) maps directly onto the prerequisite map.

## 8. How the prerequisite map plugs in

- Each mission is tagged with the topics it exercises and the errors it is likely to surface.
- If a student stalls, the diagnosis finds the prerequisite gap and the game offers a short targeted challenge, not a lecture. Example: perimeter/area mix-up leads to a mini-challenge on covering shapes with squares.
- Finishing a mission lights the matching nodes on the learning map.
- The teacher dashboard shows mission outcomes and the gaps they revealed.

## 9. What stays from version 1

Home, coins, items and trophies can stay as the reward layer. The new part is that missions give Finds, and Finds are the main collection.

## 10. How we would know it works

Use measures we can actually collect, and set targets after a first pilot:

- Daily practice participation among students who play missions versus those who do not.
- Mission completion and retry rates.
- A short transfer question after a mission, checking the concept was understood.
- Teacher feedback on whether the game surfaced useful gaps.

## 11. Risks and open questions

- **Photos of children and homes (X-ray, own-photo stage).** Needs opt-in, no storage, no faces, and school approval, and should be left out of the first version.
- **Curriculum fit.** Confirm with a teacher that each mission matches the grade it is placed at.
- **Language.** Missions need both English and Traditional Chinese text.
- **Handwriting on phones.** Make sure the notebook step works on small screens.
- **Art.** The existing concept art covers the town and school, but each mission needs scenes.

## 12. Build order

- **Show first (for the portfolio and for first impressions):** X-ray, because it is the quickest "wow".
- **Build first (a real vertical slice):** Garden, because it is the cheapest and teaches a clear concept.
- **Then:** Market.
- **Last:** X-ray with the student's own photo.

## 13. What the portfolio site should show (decision pending)

Option 1: a clickable storyboard for each of the three missions.
Option 2: three small interactive sketches (a taste of each idea), clearly labelled as concept sketches and not the game.
