from pathlib import Path
import math
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/pdf/Keith_Lau_Mathematical_Modelling.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
for name,file in [('Body','arial.ttf'),('Bold','arialbd.ttf'),('Serif','georgia.ttf'),('Italic','georgiai.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(Path('C:/Windows/Fonts')/file)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Body',boldItalic='Bold')
W,H=595.28,841.89
INK=HexColor('#233A35'); TEAL=HexColor('#246A5A'); MUTED=HexColor('#5D6D66'); PAPER=HexColor('#FAF8F2'); PALE=HexColor('#E8EFE7'); GOLD=HexColor('#D49D48')
c=canvas.Canvas(str(OUT),pagesize=(W,H))
c.setTitle('Learning mathematics through real world exploration')
c.setAuthor('Chun Yiu (Keith) Lau')
def p(text,y,size=11.2,font='Body',color=INK,x=48,width=499,leading=None):
    style=ParagraphStyle('p',fontName=font,fontSize=size,leading=leading or size*1.48,textColor=color)
    q=Paragraph(text,style); _,h=q.wrap(width,800)
    q.drawOn(c,x,H-y-h)
    assert y+h<790, (text[:50],y+h)
    return y+h
def label(text,y,x=48):
    return p(text.upper(),y,9,'Bold',TEAL,x)
def page(n,tag,title,sub=None):
    c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
    label(tag,39)
    y=p(title,70,27,'Serif',width=490,leading=33)
    if sub:y=p(sub,y+15,11.4,color=MUTED)
    c.setStrokeColor(HexColor('#D4DDD4'));c.line(48,49,W-48,49)
    p('KEITH LAU  /  LEARNING DESIGN',801,8,color=MUTED) if False else None
    c.setFillColor(MUTED);c.setFont('Body',8);c.drawString(48,31,'KEITH LAU  /  LEARNING DESIGN');c.drawRightString(W-48,31,f'{n:02d} / 07')
    return y+26
def block(head,body,y):
    y=p(head,y,13,'Bold');return p(body,y+7)+21
def box(text,y,height=90):
    c.setFillColor(PALE);c.roundRect(48,H-y-height,499,height,10,fill=1,stroke=0)
    p(text,y+17,13,'Serif',x=65,width=464)
    return y+height+22
def end():c.showPage()

y=page(1,'Teaching philosophy and proposed lesson','Learning mathematics through real world exploration')
y=p('Chun Yiu (Keith) Lau',y,12,'Bold')+30
y=box('I want students to see mathematics as a way to investigate their world.',y,84)
y=p('I begin with situations students can explore. I invite them to make predictions, notice what happens, and develop the mathematical tools to explain what they discover.',y,15,'Serif',leading=23)+26
y=block('Begin with a question worth answering','A garden, a wall, or a path can become the starting point for mathematical thinking. Students first need a reason to measure, compare, and look for a relationship.',y)
y=block('Give students decisions to make','They choose what information matters, how to represent it, and whether their answer is convincing. I provide prompts, examples, and direct instruction when those help them take the next step.',y)
y=block('Let evidence change the explanation','A prediction that fails is useful. It gives us a reason to revisit a measurement, question an assumption, or improve a model.',y)
p('This portfolio presents a proposed secondary-school slope investigation. The lesson sequence and numerical examples are designs for teaching, not reported classroom results.',y,9.5,color=MUTED)
end()

y=page(2,'The approach','From observation to a tested explanation','Mathematical modelling is one way I connect mathematical ideas with decisions students can make. Outdoor exploration supplies questions and evidence.')
y=p('Students simplify a situation into something they can reason about: a diagram, a table, a relationship, or an equation. They use that representation to answer a question, then check the answer against the original situation. The modelling process allows movement back and forth between these activities. [1]',y)+22
steps=[('Notice and ask','What do we want to explain or decide?'),('Choose and measure','Which quantities matter? What can we reasonably ignore?'),('Represent and predict','What relationship fits? What does it tell us about something we have not measured?'),('Check and revise','Does the prediction match reality closely enough? What needs to change?')]
for i,(a,b) in enumerate(steps):
    c.setFillColor(TEAL);c.circle(62,H-y-15,14,fill=1,stroke=0);c.setFillColor(white);c.setFont('Bold',11);c.drawCentredString(62,H-y-19,str(i+1))
    p(a,y,12,'Bold',x=89,width=450);p(b,y+21,10.7,x=89,width=450);y+=70
y=block('What the teacher contributes','I establish a clear mathematical goal, choose a setting with useful evidence, and prepare questions that reveal student thinking. Exploration is supported: I can demonstrate a measuring method or teach a ratio when students need it.',y+6)
y=block('What makes an outdoor activity a modelling lesson','Measuring a wall angle is a useful skill. Using several measurements to predict its lean elsewhere, and checking whether a straight-line model is adequate, adds modelling decisions.',y)
p('The outdoor setting makes the question tangible. The mathematical learning comes from the reasoning students do with it.',y,12,'Italic')
end()

y=page(3,'Proposed lesson','Does this wall really lean?','A slope investigation for learners who can use coordinates, measurements, and ratios. Angle calculation is an optional extension.')
y=box('How could we describe the lean of this wall, and predict its position at a height we have not measured?',y,91)
top=y
c.setStrokeColor(MUTED);c.setLineWidth(1);c.setDash(3,3);c.line(100,H-top-125,100,H-top-5);c.setDash()
c.setStrokeColor(TEAL);c.setLineWidth(5);c.line(118,H-top-125,168,H-top-5)
c.setStrokeColor(GOLD);c.setLineWidth(1.4)
for yy,xx in [(100,128.4),(60,145.1),(20,161.8)]:
    c.line(100,H-top-yy,xx,H-top-yy)
p('Vertical reference',top+130,8.5,x=58,width=100)
p('Wall profile',top+130,8.5,x=170,width=100)
p('Measure sideways from the same reference at several heights.',top+17,12,'Bold',x=292,width=245)
p('Gold lines show horizontal offsets. The lean is exaggerated here so the geometry is visible.',top+72,10,color=MUTED,x=292,width=245)
y=top+163
y=block('Learning intentions','Students will interpret a slope as a ratio, build a linear model from measurements, test a prediction, and explain an assumption or limitation. They will distinguish horizontal displacement from the angle of lean.',y)
y=block('Setting and equipment','Choose an accessible slanted wall with a visible side profile, or use a rigid slanted panel outdoors. Examine one vertical cross-section. Bring a tape measure, plumb line, level, recording sheets, and graph paper. Keep measurements within reach and the reference fixed.',y)
y=block('Suggested timing','Allow 70 minutes: observe (10), measure (15), model (15), test (15), and explain (15). Allow a follow-up lesson if graphs need more time.',y)
p('This is a geometric investigation, not an assessment of building condition. If using photographs, consider perspective and camera alignment.',y,9.5,color=MUTED)
end()

y=page(4,'The learning sequence','Let the need for slope emerge')
items=[('01  Predict before measuring','“Which part seems to lean most? If we double the height, will the sideways displacement double?” Students sketch an expected profile and explain their prediction. Keep their first sketch for the final discussion.'),('02  Decide what to measure','“What would let another group describe the same wall?” Agree a vertical reference, a base height, units, and a sign convention. Let groups justify their measurement intervals, then compare plans.'),('03  Collect enough evidence','Measure horizontal offsets at three or more accessible heights. Repeat readings to estimate measurement variation. Reserve one additional height for checking the model later.'),('04  Look for a relationship','Plot height on the horizontal axis and offset on the vertical axis. Ask: “How much extra offset accompanies each extra metre of height?” Compare differences between readings, rather than simply dividing every offset by its height.'),('05  Predict and test','Use the relationship to predict the reserved measurement. Agree beforehand what difference would be plausible given the repeated readings. Reveal the measurement, compare, and decide whether to keep or revise the model.'),('06  Explain the decision','“What does your slope mean? Why is a straight line reasonable here? What would make you change your mind?” Students submit an annotated graph and a short evidence-based explanation.')]
for a,b in items:y=block(a,b,y)
end()

y=page(5,'Worked mathematical example','A ratio becomes a model','Illustrative data only. These deliberately simple values explain the method; actual measurements will have variation.')
# compact table
rows=[('Height above base h (m)','Offset from reference x (cm)'),('0.0','2.0'),('0.5','3.0'),('1.0','4.0'),('1.5','5.0')]
ty=y
for i,row in enumerate(rows):
    c.setFillColor(TEAL if i==0 else (PALE if i%2 else white));c.rect(48,H-ty-29,499,29,fill=1,stroke=0)
    for j,t in enumerate(row):p(t,ty+7,10,'Bold' if i==0 else 'Body',white if i==0 else INK,x=59+250*j,width=235)
    ty+=29
y=ty+20
y=p('Each additional 0.5 m of height adds 1 cm of offset. The rate is therefore <b>2 cm per metre</b>. Using metres for both quantities:',y)+13
y=box('x(h) = 0.02 + 0.02h<br/>At h = 2 m, the predicted offset is 0.06 m = 6 cm.',y,80)
y=p('The first 0.02 is the base offset from our chosen reference. The second is the slope of this graph: horizontal offset change divided by vertical height change. It means 2 cm of extra lean for every metre upwards.',y)+18
y=block('Check the model','Suppose the reserved reading is 6.2 cm and repeated readings vary by about 0.3 cm. That observation is consistent with the prediction at this measurement resolution. One close result supports the model locally; it does not prove that the entire wall is straight.',y)
y=block('Connect to conventional gradient','Our graph uses height as its input. Its slope measures lean relative to vertical. For a ramp drawn as height against horizontal distance, conventional gradient is rise / run. Always identify the axes and reference direction. [2]',y)
p('Optional trigonometry: the model gives a lean from vertical of arctan(0.02), approximately 1.15 degrees. A perfectly vertical wall has zero lean in our model, while its conventional rise/run gradient is undefined.',y,10,color=MUTED)
end()

y=page(6,'Feedback and evidence','Make the reasoning visible','I use student responses to decide what to teach next, and check understanding in a new situation.')
for a,b in [
('“The taller wall leans more.”','Ask students to compare 4 cm of displacement over 2 m with 6 cm over 3 m. Both have the same lean ratio. Height or displacement alone is not enough.'),
('“We can divide offset by height.”','Return to the 2 cm base offset in the example. Ask what changes between two readings. This reveals why the slope uses differences and why the intercept matters.'),
('“The points must make a perfect line.”','Compare repeated readings. Ask whether the differences are consistent with measurement variation or whether a systematic bend suggests a different model.'),
('“The graph looks steep, so the wall leans a lot.”','Redraw the same data with different axis scales. Ask students to calculate and interpret the ratio, then explain why the visual angle on the page changed.')]:y=block(a,b,y)
y=p('A short transfer task',y,14,'Bold')+29
y=p('A ramp rises 0.6 m over a horizontal run of 6 m. Students explain its gradient, predict the run needed for the same rise at half that gradient, and draw a labelled model. The expected results are 0.1 (10%) and 12 m. Ask what else they would need to know to decide whether that design fits a real site.',y)+22
y=p('Evidence I would collect',y,13,'Bold')+26
p('Compare initial predictions with final explanations. Look for correct ratios and units, a justified representation, an independently checked prediction, and a sensible revision or limitation. A new question about a ramp tests transfer beyond the wall example. These are planned assessment criteria, not claims of measured learning gains.',y)
end()

y=page(7,'Beyond one lesson','Carry the question back into the world')
y=block('Extend the same way of thinking','Students could compare two routes up a hill, predict a shadow, or investigate where puddles form. Each setting asks them to choose a representation and check its usefulness. A route may need several slopes; a courtyard may need more than one cross-section.',y)
y=block('An interactive version','An online lesson could let learners choose measurement points on a calibrated wall profile, commit to a prediction, and reveal a withheld reading. Moving the reference line would change the intercept while preserving the lean ratio. A second, curved profile would challenge the straight-line assumption.',y)
y=block('What I would learn from a pilot','I would note where students need help choosing quantities, whether they explain slope in context, and whether they revise a model for a mathematical reason. I would use their work and transfer responses to refine the prompts, scaffolding, and time allocation.',y)
y=box('My goal is for students to leave with a habit: notice a question, find the mathematics that helps, and check whether the answer makes sense.',y,87)
y=p('References and design foundations',y,13,'Bold')+27
refs=[
('[1] SIAM and COMAP. GAIMME, first edition (2016).','The modelling cycle and the role of student choices and assumptions. Chapters 1 and 2.','https://comap.org/images/resources/free_resources/GAIMME_Report.pdf'),
('[2] U.S. Geological Survey. Percent and angle of slope.','The relationship between rise, horizontal run, and angle.','https://www.usgs.gov/educational-resources/determine-percent-slope-and-angle-slope'),
('[3] MathCityMap. Generic Tasks: Slope (2021).','An established outdoor context for measuring ramps and stair handrails.','https://mathcitymap.eu/en/generic-tasks-slope-2/')]
for title,desc,url in refs:
    y=p(f'<link href="{url}" color="#246A5A"><b>{title}</b></link>',y,9.5)+3
    y=p(desc,y,9,color=MUTED)+12
p('The wall lesson, prompts, and illustrative dataset in this document are Keith Lau’s proposed teaching design, developed with reference to these sources.',y,8.5,color=MUTED)
end()
c.save()
print(OUT)
