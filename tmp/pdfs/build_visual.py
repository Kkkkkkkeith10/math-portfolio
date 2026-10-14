from pathlib import Path
from math import sin, cos, pi
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/pdf/Everything_Has_a_Slope.pdf'
W,H=595.28,841.89
INK='#203F38'; GREEN='#28715C'; MUTED='#62766E'; PALE='#E8EEE6'; BG='#FAF9F4'; ORANGE='#BC643E'; LINE='#CDD8CD'
for n,f in [('Body','arial.ttf'),('Bold','arialbd.ttf'),('Italic','ariali.ttf'),('Serif','georgia.ttf')]:
 pdfmetrics.registerFont(TTFont(n,str(Path('C:/Windows/Fonts')/f)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Italic',boldItalic='Bold')
c=canvas.Canvas(str(OUT),pagesize=(W,H))
c.setTitle('Everything Has a Slope | Mathematical Modelling')
c.setAuthor('Chun Yiu (Keith) Lau')

def rect(x,y,w,h,fill=PALE,stroke=None,r=0):
 c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(stroke or fill))
 if r:c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=bool(stroke))
 else:c.rect(x,H-y-h,w,h,fill=1,stroke=bool(stroke))
def line(x,y,x2,y2,color=GREEN,width=1,dash=None):
 c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.setDash(dash or [])
 c.line(x,H-y,x2,H-y2);c.setDash([])
def text(s,x,y,size=11,font='Body',color=INK):
 c.setFillColor(HexColor(color));c.setFont(font,size);c.drawString(x,H-y-size,s)
def para(s,x,y,w=499,size=10.8,leading=15.6,color=INK,font='Body'):
 p=Paragraph(s,ParagraphStyle('p',fontName=font,fontSize=size,leading=leading,textColor=HexColor(color)))
 _,h=p.wrap(w,800);p.drawOn(c,x,H-y-h)
 assert y+h<792, (s[:50],y+h)
 return y+h
def label(s,x,y,color=GREEN):text(s,x,y,8.4,'Bold',color)
def title(kicker,heading,sub=None):
 label(kicker,48,43);para(heading,48,70,499,27,32,font='Serif')
 if sub:para(sub,48,143,499,11,16,color=MUTED)
def base(num,section):
 rect(0,0,W,H,BG)
 line(48,798,547,798,LINE)
 text('KEITH LAU  /  MATHEMATICAL MODELLING',48,810,7.6,color=MUTED)
 text(section,310,810,7.6,color=MUTED)
 text(f'{num:02}',532,808,10,'Bold',GREEN)
def end():c.showPage()
def triangle(x,y,run,rise,color=GREEN):
 p=c.beginPath();p.moveTo(x,H-y);p.lineTo(x+run,H-y);p.lineTo(x+run,H-y+rise);p.close()
 c.setFillColor(HexColor(PALE));c.drawPath(p,fill=1,stroke=0)
 line(x,y,x+run,y-rise,color,2.5);line(x,y,x+run,y,LINE,1)
 line(x+run,y,x+run,y-rise,color,1,dash=[3,3])
def number(n,x,y):
 rect(x,y,24,24,GREEN,r=12);text(str(n),x+8,y+4,11,'Bold','#FFFFFF')
def step(n,heading,body,x,y,w=225):
 number(n,x,y);text(heading,x+34,y,12,'Bold');return para(body,x+34,y+24,w-34,10.4,15)

# 1: A question before a definition.
base(1,'THE QUESTION')
label('TEACHING & INTERACTIVE LEARNING  /  CHUN YIU (KEITH) LAU',48,40)
text('Everything Has a Slope',48,77,32,'Serif')
text('Mathematical Modelling',48,122,25,'Bold',GREEN)
text('Teaching math by modelling the world around us.',48,161,12,color=MUTED)
para('One ramp rises higher.<br/>Which one is steeper?',48,214,480,25,31,font='Serif')
rect(48,298,499,264,PALE,r=8)
label('A  /  THE TALLER RAMP',66,315)
triangle(77,446,330,99)
text('6 m horizontally',180,452,10,color=MUTED)
text('45 cm',418,390,11,'Bold')
label('B  /  THE SHORTER RAMP',66,495)
triangle(280,542,66,33,ORANGE)
text('1.2 m',283,547,9,color=MUTED);text('15 cm',361,519,11,'Bold',ORANGE)
text('Same scale for both ramps; vertical distances enlarged 4x for clarity.',66,574,8.3,color=MUTED)
para('A student can calculate a gradient and still struggle to explain <b>1:12 on a road sign</b>. I want the calculation to describe something they can see, measure and question.',48,610,499,12,17)
line(48,682,547,682,LINE)
label('MY APPROACH',48,701)
para('Start with a situation. Choose what matters. Build a mathematical model.<br/>Test it against the world, then revise it.',48,721,499,12,18)
end()

# The teaching problem must precede the technique.
base(2,'THE LEARNING PROBLEM')
title('01 / WHY I DESIGNED THIS LESSON','The answer can be correct.<br/>The meaning can still be missing.')
para('Most students meet slope as a formula on a whiteboard. They subtract two y-values, subtract two x-values and divide. Practice can make that procedure reliable. Yet a student who calculates gradient perfectly may still not understand <b>1:12 on a road sign</b>.',48,160,499,12,18)
rect(48,253,499,120,PALE,r=7)
label('THE GAP I WANT TO ADDRESS',66,269)
para('Can students choose what to measure, explain the number, and use it to make a decision beyond the exercise?',66,292,463,16,22,font='Serif')
label('WHY THE USUAL EXERCISE CAN LEAVE THIS GAP',48,385)
para('In a worked example, the quantities and axes are already chosen. The question tells students which calculation to perform. They can succeed without deciding why those quantities matter or whether the result describes the situation sensibly.',48,408,499,11.5,17)
para('A ramp removes that scaffolding. There are no labelled axes and nobody has marked the horizontal run. Students must decide what “steep” means, choose a measurement and defend a comparison. Those decisions are where I want the mathematical thinking to begin.',48,489,499,11.5,17)
label('A SECOND GAP: ONE IDEA TAUGHT AS SEPARATE CHAPTERS',48,585)
para('Students meet straight-line gradient, the angle of inclination, positive and negative slopes, and eventually differentiation in separate parts of the curriculum. I use ramps, stairs, walls and slides to connect them through one question: <b>how does height change as horizontal position changes?</b>',48,608,499,11.5,17)
para('My aim is to connect procedural fluency with interpretation: students should be able to calculate a slope and explain why that calculation helps them understand the world.',48,716,499,12,18,font='Bold')
end()

base(3,'WHY THIS LESSON IS DESIGNED THIS WAY')
title('02 / MY TEACHING CHOICES','The situation gives<br/>the mathematics a purpose.')
para('I start with a practical question: <b>could someone using a wheelchair get up this ramp independently?</b> Students cannot settle it by looking. Comparing gradients gives them a way to investigate one part of that question.',48,158,499,11.5,17)
label('THE SETTING',48,239)
para('Two ramps near school or in a park; a tape measure, a 1 m spirit level, a ruler and an optional clinometer. The numerical ramps in this case study are worked examples. Outdoors is the setting; the teaching method is the sequence of decisions students make.',48,261,499,11,16)
line(48,336,547,336,LINE)
label('DESIGN CHOICE',48,354);label('THE LEARNING PROBLEM IT ADDRESSES',246,354)
rows=[
 ('Predict before measuring', 'A taller ramp may look steeper. Recording a reason makes that assumption explicit, so students have something to test and revise.'),
 ('Let students choose a measure', 'The calculation is usually supplied. Choosing between height, length and angle makes students consider what a useful measure must capture.'),
 ('Compare a common run', 'Two raw heights are not a fair comparison. Rise per metre makes the purpose of division visible before the formula is introduced.'),
 ('Test the rule by scaling', 'A student may subtract because both quantities are lengths. Doubling the ramp tests that rule: its shape stays the same, but the difference changes.'),
 ('Use a new design problem', 'Repeating the original example can hide dependence on a prompt. A new ramp tests whether students can select and explain the model themselves.')
]
for i,(a,b) in enumerate(rows):
 yy=383+i*72
 para(a,48,yy,177,11,16,font='Bold')
 para(b,246,yy,301,10.6,15)
 if i<4:line(48,yy+60,547,yy+60,LINE)
para('These choices explain the lesson’s rationale. I judge their success through students’ explanations and transfer to a new situation.',48,753,499,10.4,14,color=MUTED)
end()

# Keep the pedagogical decisions visible alongside diagrams.
base(4,'THE INVESTIGATION')
title('03 / FROM A GUESS TO A MODEL','Give students a reason<br/>to invent the ratio.')
step(1,'Notice','“Which ramp is steeper? Why?”<br/>Students record a prediction before measuring. I keep their first explanation so they can revisit it.',48,160)
step(2,'Decide what matters','“What would you measure?”<br/>If they choose height alone, I ask about a ramp that rises 1 m over the length of a football pitch.',310,160)
step(3,'Measure','Students choose their measurements. A horizontal spirit level helps them measure rise over a known run. Different readings invite a check of units and method.',48,286)
step(4,'Make a fair comparison','“What if both ramps went 1 m across?”<br/>A common horizontal run makes the comparison meaningful. Only then do I name the gradient.',310,286)
rect(48,420,499,104,PALE,r=7)
label('RISE FOR EVERY 1 METRE HORIZONTALLY',65,434)
text('A',65,464,14,'Bold');rect(96,465,150,14,GREEN);text('7.5 cm',258,463,12,'Bold')
text('B',65,492,14,'Bold',ORANGE);rect(96,493,250,14,ORANGE);text('12.5 cm',358,491,12,'Bold',ORANGE)
para('<b>The shorter ramp is steeper.</b> I ask students which evidence supports or changes their first prediction.',48,543,499,11.5,16)
label('THE TEACHING MOVE / TEST A RULE WITH A COUNTEREXAMPLE',48,599)
para('“Make Ramp B twice as big. Does it become steeper?”',48,620,499,16,21,font='Serif')
triangle(66,700,120,15);triangle(271,700,240,30)
text('0.15 / 1.2 = 0.125',66,712,10,'Bold');text('0.30 / 2.4 = 0.125',271,712,10,'Bold')
para('The ratio stays the same. Run minus rise doubles from 1.05 m to 2.10 m.<br/>Students can now explain why subtraction does not measure steepness.',48,749,499,10.3,14)
end()

# 3: Complete stages 5-7, with an exact triangle.
base(5,'TEST & TRANSFER')
title('04 / USE THE MODEL','Turn a number into a decision.')
number(5,48,136);text('Interpret 1:12',82,138,14,'Bold')
para('Our design brief allows at most 1 unit of rise for every 12 units of horizontal run. Students sketch the ratio, then check both ramps.',82,165,465,11,16)
rect(48,218,499,82,PALE,r=7)
text('A  0.075',65,234,18,'Bold',GREEN);text('B  0.125',317,234,18,'Bold',ORANGE)
text('Meets the 1/12 gradient limit',65,267,10);text('Exceeds the 1/12 gradient limit',317,267,10)
para('This tests the gradient requirement. Surface, width, landings and the person using the ramp also affect accessibility.',48,311,499,9.5,13,color=MUTED)
number(6,48,360);text('Choose the right measurement',82,361,14,'Bold')
triangle(67,528,144,108)
text('4: horizontal run',84,540,10,'Bold');text('3: rise',219,463,10,'Bold')
c.saveState();c.translate(121,H-458);c.rotate(36.87);c.setFont('Body',10);c.setFillColor(HexColor(MUTED));c.drawString(0,8,'5: sloping length');c.restoreState()
para('“Which length belongs in the denominator?”<br/><br/><b>Gradient = 3/4.</b><br/>Using 3/5 compares rise with distance along the surface. Students trace each measurement, then correct their model.',310,403,237,11,16)
number(7,48,586);text('Transfer to a new ramp',82,588,14,'Bold')
para('“An entrance is 30 cm high. You have 3 m of horizontal space. Can a straight ramp meet our 1:12 brief?”',82,615,465,12,17)
para('<b>0.30 / 3 = 0.10 = 1:10.</b> The ramp is too steep for the brief.<br/>It needs at least <b>3.6 m of horizontal run</b>.',82,669,465,11,16)
label('WHAT I LOOK FOR',48,737)
para('A labelled sketch, consistent units, and an explanation of why a longer run makes the same rise gentler. The answer must mean something.',48,754,499,10.3,14)
end()

# 4: Extensions expressed by diagrams.
base(6,'EXTEND THE IDEA')
title('05 / ONE IDEA, DIFFERENT MODELS','From a staircase<br/>to the beginning of calculus.')
label('STAIRS / AN OVERALL INCLINE',48,165)
for i in range(4):
 line(64+i*35,302-i*17.5,64+(i+1)*35,302-i*17.5,GREEN,2)
 line(64+(i+1)*35,302-i*17.5,64+(i+1)*35,302-(i+1)*17.5,GREEN,2)
line(64,302,204,232,ORANGE,1.6,dash=[4,3])
text('15 cm rise / 30 cm run = 1:2',52,322,9.5,'Bold')
para('“How can flat steps make a slope?”<br/><br/>The line through equal step edges models the overall incline. Each tread is still horizontal; each riser is vertical.',292,201,255,11,16)
line(48,359,547,359,LINE)
label('LEVEL GROUND & WALLS / THE LIMITS OF THE RATIO',48,379)
line(65,474,135,474,GREEN,3);text('zero rise',65,488,9);text('gradient = 0',65,507,9.5,'Bold')
line(211,483,211,416,ORANGE,3);text('zero run',171,488,9);text('undefined',171,507,9.5,'Bold',ORANGE)
para('“Both contain a zero. Why are they different?”<br/><br/>Zero divided by a nonzero run is zero. A vertical line has zero run, so its gradient is undefined.',292,408,255,11,16)
line(48,546,547,546,LINE)
label('CURVED SLIDE / A SLOPE THAT CHANGES',48,566)
p=c.beginPath();p.moveTo(65,H-611);p.curveTo(85,H-715,140,H-712,225,H-714)
c.setStrokeColor(HexColor(GREEN));c.setLineWidth(3);c.drawPath(p)
line(65,611,225,714,MUTED,1,dash=[4,3])
for t,length in [(0.22,66),(0.80,64)]:
 u=1-t
 px=u**3*65+3*u*u*t*85+3*u*t*t*140+t**3*225
 py=u**3*611+3*u*u*t*715+3*u*t*t*712+t**3*714
 dx=3*u*u*(85-65)+6*u*t*(140-85)+3*t*t*(225-140)
 dy=3*u*u*(715-611)+6*u*t*(712-715)+3*t*t*(714-712)
 scale=length/(dx*dx+dy*dy)**0.5/2
 line(px-dx*scale,py-dy*scale,px+dx*scale,py+dy*scale,ORANGE,1.5)
text('average',136,646,9,color=MUTED);text('local slopes',102,738,9,'Bold',ORANGE)
para('“Is the slide equally steep everywhere?”<br/><br/>The endpoints give an average gradient. Nearby points reveal how steep each part is. Bringing them closer introduces the idea behind a tangent and a derivative.',292,599,255,11,16)
end()

base(7,'ASSESSMENT & REFLECTION')
title('06 / WHAT UNDERSTANDING LOOKS LIKE','Listen to the explanation.<br/>Then decide what comes next.')
label('USE A WRONG ANSWER TO CHOOSE THE NEXT QUESTION',48,159)
para('If a student says height determines steepness, I offer a ramp rising 1 m over a football pitch. If they choose length alone, I ask whether a 50 cm ramp must be steep. If they suggest angle, I ask how they could measure it. Each answer tells me what to probe next.',48,181,499,11,16)
para('During measurement, I ask: “Would your partner get the same result?” A sagging tape, mixed units or a measurement along the sloping surface gives us a reason to revisit the method. I use the horizontal spirit level to make the run visible when students need that support.',48,261,499,11,16)
rect(48,344,499,135,PALE,r=7)
label('CHECK FOR TRANSFER',66,360)
para('“A third ramp rises 15 cm over 2 m horizontally. Which original ramp is it equally steep as? Explain.”',66,382,463,13,18,font='Bold')
para('It matches Ramp A: both rise 7.5 cm per metre. I look for a comparison using the same units and the same horizontal run. I also ask students to sketch a 1:12 sign and give a matching pair of measurements.',66,429,463,10.5,15)
label('BUILD CONNECTIONS WHEN STUDENTS ARE READY',48,507)
para('A side-view sketch becomes a height-versus-horizontal-distance graph. With x increasing to the right, rising and falling lines give positive and negative gradients. For students who know trigonometry, rise/run is tan(theta). Changing the axes to distance travelled and time turns the ratio into speed. The axes give the number its meaning.',48,530,499,11,16)
label('MY REFLECTION',48,632)
para('Mathematics should be a tool for understanding the world, with a purpose beyond an exam or equations in a book. I want students to recognise when it can help them make a decision, and to question whether their answer makes sense.',48,655,499,11.5,17)
para('I also need to pace the lesson. If students still confuse horizontal run with sloping length, I stay there. Their initial sketches and final explanations help me decide what to revisit before extending the work to curves.',48,722,499,10.8,15.5)
end()

# The portfolio bridge is explicit and clickable.
base(8,'FROM WORLD TO SIMULATION')
title('07 / THE SAME APPROACH, ONLINE','From real places<br/>to simulated environments.')
para('On my portfolio website, this approach becomes a simulated rooftop garden. Students help Mei use a fixed length of fence to create more growing space. A practical decision gives the mathematics a purpose.',48,156,499,12,17)
rect(48,233,499,207,PALE,r=7)
label('THE GARDEN / SAME 12 M OF FENCE, DIFFERENT AREAS',66,250)
for x,a,b in [(78,5,1),(246,4,2),(414,3,3)]:
 y=345-b*16
 for i in range(a):
  for j in range(b):rect(x+i*16,y+j*16,16,16,'#D4E1C7',BG)
 c.setStrokeColor(HexColor(GREEN));c.setLineWidth(2);c.rect(x,H-345,a*16,b*16,fill=0,stroke=1)
 text(f'{a} m x {b} m',x,358,11,'Bold');text(f'{a*b} square metres',x,381,10)
para('Which layout grows the most? What changes, and what stays fixed?',66,409,464,10.5,15,font='Bold')
label('REAL SITUATION',48,467);label('MATHEMATICAL MODEL',215,467);label('TEST & REVISE',402,467)
para('A ramp to compare.<br/>A garden to plan.',48,489,147,10.6,16)
para('Choose measurements<br/>and represent constraints.',215,489,160,10.6,16)
para('Try a solution.<br/>Explain the result.',402,489,145,10.6,16)
line(189,496,203,496,GREEN);line(378,496,390,496,GREEN)
para('The setting changes; the design principle stays the same. Learners make a prediction, act on a model and interpret what happens. A simulation lets them repeat that process with immediate, visible consequences.',48,539,499,11,16)
label('MY REFLECTION',48,617)
para('Mathematics should help students understand the world. I want a formula to become something they can use when they meet a road sign, a staircase or a design problem. My role is to create that need, then give them enough support to investigate it.',48,640,499,11.5,16.5)
rect(48,729,499,47,GREEN,r=6)
text('Explore the interactive garden',65,741,13,'Bold','#FFFFFF')
text('Open my portfolio  >',402,745,9,'Bold','#FFFFFF')
c.linkURL('https://keith-math-portfolio.keithlau100.workers.dev/#game',(48,H-776,547,H-729),relative=0)
end()
c.save()
print(OUT)
