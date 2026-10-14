from pathlib import Path
import re, html
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether, Flowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/pdf/Everything_Has_a_Slope.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
SRC=ROOT/'tmp/pdfs/slope_content.txt'
for name,file in [('Body','arial.ttf'),('Bold','arialbd.ttf'),('Italic','ariali.ttf'),('BI','arialbi.ttf'),('Serif','georgia.ttf')]:
 pdfmetrics.registerFont(TTFont(name,str(Path('C:/Windows/Fonts')/file)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Italic',boldItalic='BI')
ink=HexColor('#243C36');teal=HexColor('#286957');muted=HexColor('#65736D');pale=HexColor('#EAF0E9')
styles={
 'body':ParagraphStyle('body',fontName='Body',fontSize=10.5,leading=14.5,textColor=ink,spaceAfter=7),
 'title':ParagraphStyle('title',fontName='Serif',fontSize=30,leading=36,textColor=ink,spaceAfter=10),
 'sub':ParagraphStyle('sub',fontName='Body',fontSize=12,leading=17,textColor=muted,spaceAfter=11),
 'h2':ParagraphStyle('h2',fontName='Serif',fontSize=21,leading=27,textColor=ink,spaceBefore=13,spaceAfter=12,keepWithNext=True),
 'h3':ParagraphStyle('h3',fontName='Bold',fontSize=13,leading=18,textColor=teal,spaceBefore=12,spaceAfter=9,keepWithNext=True),
 'quote':ParagraphStyle('quote',fontName='Body',fontSize=10.7,leading=15,textColor=ink,backColor=pale,borderPadding=8,spaceBefore=7,spaceAfter=11,leftIndent=10,rightIndent=10),
 'bullet':ParagraphStyle('bullet',fontName='Body',fontSize=10.5,leading=14.5,textColor=ink,leftIndent=13,firstLineIndent=-10,spaceAfter=6),
 'cell':ParagraphStyle('cell',fontName='Body',fontSize=9.5,leading=13,textColor=ink),
 'thead':ParagraphStyle('thead',fontName='Body',fontSize=9.5,leading=13,textColor=white),
}
def fmt(s):
 s=html.escape(s)
 s=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',s)
 s=re.sub(r'\*(.+?)\*',r'<i>\1</i>',s)
 return s
class Equation(Flowable):
 def __init__(self):Flowable.__init__(self);self.width=480;self.height=64
 def draw(self):
  c=self.canv;c.setFillColor(ink);c.setStrokeColor(ink);c.setFont('Body',13)
  c.drawString(62,24,'gradient =');c.drawCentredString(183,36,'rise');c.line(157,31,209,31);c.drawCentredString(183,13,'run')
  c.drawString(224,24,'=');c.line(252,31,330,31)
  for letter,yy in [('y',39),('x',14)]:
   c.setFont('Body',13);c.drawString(264,yy,letter);c.drawString(285,yy,'−');c.drawString(305,yy,letter)
   c.setFont('Body',8);c.drawString(272,yy-3,'2');c.drawString(313,yy-3,'1')
story=[];lines=SRC.read_text(encoding='utf-8-sig').splitlines();i=0
breaks=('## 2.','## 3.','### Stage 2:','### Stage 4:','### Stage 6:','## 4.','### Slides:','## 5.')
while i<len(lines):
 s=lines[i].strip();i+=1
 if not s or s=='---':continue
 if s.startswith(breaks):story.append(PageBreak())
 if s.startswith('$$'):story.append(Equation());continue
 if s.startswith('|'):
  rows=[s]
  while i<len(lines) and lines[i].strip().startswith('|'):rows.append(lines[i].strip());i+=1
  parsed=[]
  for row in rows:
   cells=[v.strip() for v in row.strip('|').split('|')]
   if all(re.fullmatch(r'[:\- ]+',v or '-') for v in cells):continue
   parsed.append([Paragraph(fmt(v),styles['thead' if not parsed else 'cell']) for v in cells])
  widths=[110,186,186] if len(parsed)>4 else [142,170,170]
  tab=Table(parsed,colWidths=widths,hAlign='LEFT',repeatRows=1)
  tab.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),teal),('ROWBACKGROUNDS',(0,1),(-1,-1),[pale,white]),('GRID',(0,0),(-1,-1),.4,HexColor('#D2DDD3')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
  story.extend([Spacer(1,5),tab,Spacer(1,14)]);continue
 if s.startswith('# '):kind='title';s=s[2:]
 elif s.startswith('## '):kind='h2';s=s[3:]
 elif s.startswith('### '):kind='sub' if s.startswith(('### Teaching', '### Mathematical')) else 'h3';s=s[4:]
 elif s.startswith('> '):kind='quote';s=s[2:]
 elif s.startswith('- '):kind='bullet';s='• '+s[2:]
 else:kind='body'
 story.append(Paragraph(fmt(s),styles[kind]))
def page(c,doc):
 c.saveState();c.setFillColor(HexColor('#FAF9F5'));c.rect(0,0,595.28,841.89,fill=1,stroke=0)
 c.setFillColor(muted);c.setFont('Body',8)
 if doc.page>1:c.drawString(54,808,'EVERYTHING HAS A SLOPE')
 c.setStrokeColor(HexColor('#D2DDD3'));c.line(54,46,541,46)
 c.drawString(54,30,'CHUN YIU (KEITH) LAU  /  TEACHING CASE STUDY');c.drawRightString(541,30,str(doc.page));c.restoreState()
doc=SimpleDocTemplate(str(OUT),pagesize=(595.28,841.89),rightMargin=54,leftMargin=54,topMargin=54,bottomMargin=61,title='Everything Has a Slope',author='Chun Yiu (Keith) Lau')
doc.build(story,onFirstPage=page,onLaterPages=page)
print(OUT)
