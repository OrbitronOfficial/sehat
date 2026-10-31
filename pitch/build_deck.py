"""Build the Sehat pitch deck (pitch/Sehat-GRAVITON-2026.pptx) from the real screenshots in pitch/shots."""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

HERE = os.path.dirname(os.path.abspath(__file__))
SHOT = lambda n: os.path.join(HERE, 'shots', n + '.png')
BLUE, LIGHT, INK, MUTED, WHITE, TINT = RGBColor(0x07, 0x74, 0xC4), RGBColor(0x8E, 0xBE, 0xF9), RGBColor(0x0F, 0x17, 0x2A), RGBColor(0x5B, 0x6B, 0x80), RGBColor(255, 255, 255), RGBColor(0xEA, 0xF3, 0xFE)

prs = Presentation(); prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BLANK = prs.slide_layouts[6]

def text(slide, x, y, w, h, s, size=18, bold=False, color=INK, font='Plus Jakarta Sans'):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h)); tf = tb.text_frame; tf.word_wrap = True
    for i, line in enumerate(s if isinstance(s, list) else [s]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        r = p.add_run(); r.text = line; r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color; r.font.name = font
        p.space_after = Pt(6)
    return tb

def base(title, kicker):
    s = prs.slides.add_slide(BLANK)
    bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, Inches(0.12)); bar.fill.solid(); bar.fill.fore_color.rgb = BLUE; bar.line.fill.background()
    text(s, 0.6, 0.35, 12, 0.4, kicker.upper(), 12, True, BLUE)
    text(s, 0.6, 0.65, 12, 1, title, 34, True, INK, 'Manrope')
    text(s, 0.6, 7.0, 12, 0.4, 'Sehat · Team ANTIJAREX · GRAVITON 2026 · sehat-ashen.vercel.app', 10, False, MUTED)
    return s

def shot(s, name, x, y, w):
    if os.path.exists(SHOT(name)):
        pic = s.shapes.add_picture(SHOT(name), Inches(x), Inches(y), width=Inches(w)); pic.line.color.rgb = RGBColor(0xDC, 0xE7, 0xF5); pic.line.width = Pt(1)

def card(s, x, y, w, h, big, small, fill=TINT):
    b = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h)); b.fill.solid(); b.fill.fore_color.rgb = fill; b.line.fill.background()
    text(s, x + 0.25, y + 0.2, w - 0.5, 0.8, big, 30, True, BLUE, 'Manrope'); text(s, x + 0.25, y + 1.0, w - 0.5, h - 1.1, small, 13, False, INK)

# 1 · title
s = prs.slides.add_slide(BLANK)
bg = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height); bg.fill.solid(); bg.fill.fore_color.rgb = TINT; bg.line.fill.background()
text(s, 0.7, 1.4, 6, 0.5, 'GRAVITON 2026 · TEAM ANTIJAREX', 14, True, BLUE)
text(s, 0.7, 1.9, 6.2, 2.2, ['Sehat', 'Care that connects itself.'], 44, True, INK, 'Manrope')
text(s, 0.7, 4.3, 5.8, 1.6, 'One live network for patients, hospitals, doctors, nurses, pharmacies and distributors, run by AI agents.', 18, False, MUTED)
text(s, 0.7, 6.2, 6, 0.5, 'sehat-ashen.vercel.app', 16, True, BLUE)
shot(s, 'home', 7.0, 1.3, 5.8)

# 2 · problem
s = base('The care chain is broken at every handoff', 'Problem')
card(s, 0.6, 1.8, 3.9, 3.0, '1 : 1,194', 'Allopathic doctors to people in India (govt 1 : 834 includes AYUSH). Doctors spend time on paperwork, not patients.')
card(s, 4.7, 1.8, 3.9, 3.0, '66%', 'Hypertension and diabetes patients in a Chennai study not taking medicines as prescribed: forgetting, fear of side effects.')
card(s, 8.8, 1.8, 3.9, 3.0, '₹1.61 lakh cr', 'Spent by Indians on medicines in 2022-23 (National Health Accounts), much of it out of pocket.')
text(s, 0.6, 5.2, 12, 1.4, ['Patients chase appointments, prescriptions get lost between doctor and pharmacy, pharmacies run out, elders forget doses.',
                            'Sources: Business Standard (Dec 2023), Janata Weekly analysis, WHO IMSEAR (Chennai UHC study), Medical Dialogues (NHA).'], 13, False, MUTED)

# 3 · solution
s = base('One network. Six roles. Live on every device.', 'Solution')
text(s, 0.6, 1.7, 5.4, 4.6, ['🙂  Patient books, tracks medicines, gets reports explained', '🏥  Hospital sees every booking, beds, doctors, roster', '🩺  Doctor: urgent-first queue → prescription in one tap',
                            '🧑‍⚕️  Nurse: ward tasks, medicine round, handover', '💊  Pharmacy: Rx inbox, bill → patient approves → rider', '🚚  Supplier: live POs, dispatch, stock updates itself',
                            'Hospitals, doctors and pharmacies register themselves; patients choose.'], 16)
shot(s, 'login', 6.3, 1.6, 6.5)

# 4 · live flow
s = base('From symptom to doorstep, in one live flow', 'Live demo')
shot(s, 'demo', 0.6, 1.6, 7.6)
text(s, 8.5, 1.7, 4.3, 5, ['1  Rahul books from symptoms', '2  City Care checks him in', '3  Dr. Bansal signs the Rx', '4  Routed to his chosen pharmacy, stock checked',
                          '5  Bill sent → Rahul approves → packed', '6  Rider → live tracking', '7  Low stock → AI PO → supplier delivers',
                          'Dr. Saathi guides it step by step; Auto-play runs it hands-free.'], 15)

# 5 · suites
s = base('Six Sehat suites, installed like apps', 'Product')
shot(s, 'market', 0.6, 1.6, 6.8)
text(s, 7.7, 1.7, 5.1, 5, ['💚 Sehat Copilot (patient) · Free', '🩺 Sehat Doctor · ₹999 / month', '🧑‍⚕️ Sehat Nurse · ₹499 / month', '💊 Sehat Pharmacy · ₹1,499 / month',
                          '🚚 Sehat Supply · ₹2,499 / month', '🏥 Sehat Hospital · ₹4,999 / month', 'Each role sees only its own suite and agents.'], 16)

# 6 · AI
s = base('AI where it saves time, in the user\'s language', 'AI')
text(s, 0.6, 1.7, 6, 4.8, ['📄  Photo or PDF of any report or prescription → read and explained in 10 Indian languages',
                          '🎙️  Dr. Saathi: voice and chat in Indian languages, answers in the same language',
                          '📦  Stock-out prediction: "Amlodipine runs out in 1 day" → purchase order drafted',
                          '🩺  Doctor recommendation by speciality and earliest slot',
                          '👵  Senior Mode: spoken reminders, double-dose lock, SOS, caregiver alert',
                          'Explains, never diagnoses. Falls back to on-device reading when AI is busy.'], 16)
shot(s, 'pharmacy', 6.9, 1.6, 5.9)

# 7 · patient
s = base('Built for patients, including elders', 'Patient experience')
shot(s, 'journal', 0.6, 1.6, 6.0); shot(s, 'patient', 6.8, 1.6, 6.0)
text(s, 0.6, 5.6, 12, 1.2, 'Daily journal with a pre-visit summary · live medicine tracker · bill approval · Senior Mode in 8 languages. Journal stays private until the patient shares it with the doctor.', 14, False, MUTED)

# 8 · business model
s = base('Business model', 'Revenue')
card(s, 0.6, 1.8, 3.9, 2.6, 'SaaS', 'Monthly suites for hospitals, doctors, nurses, pharmacies and distributors. Patients free.')
card(s, 4.7, 1.8, 3.9, 2.6, 'Network', 'Every pharmacy and distributor that joins brings its customers: each new member makes the network more useful.')
card(s, 8.8, 1.8, 3.9, 2.6, 'Add-ons', 'Delivery dispatch, supply-chain AI and Senior Mode alerts as paid agents.')
text(s, 0.6, 4.8, 12, 1.6, ['Example clinic network: 1 hospital ₹4,999 + 10 doctors ₹9,990 + 3 pharmacies ₹4,497 + 1 distributor ₹2,499 ≈ ₹22,000 / month.',
                            'Prices are our proposed launch pricing.'], 15)

# 9 · why we win
s = base('Why Sehat wins', 'Edge')
text(s, 0.6, 1.7, 12, 5, ['✓  Connected, not another single app: six roles share one live network across devices today',
                         '✓  Works in Indian languages end to end: reports, chat, voice, Senior Mode',
                         '✓  Consent built in: each role sees only what it needs; journal shared only with consent',
                         '✓  Demo-proof: runs offline on a device, AI has fallbacks, Auto-play needs no keys',
                         '✓  Honest foundation: Sehat Copilot (patient app) was our earlier project; at GRAVITON we built the network around it',
                         'Next: per-user accounts with database-level access control, WhatsApp/SMS alerts, pharmacy catalogue images'], 18)

# 10 · team + ask
s = base('Team ANTIJAREX · CGC University', 'Team & ask')
text(s, 0.6, 1.8, 6, 3, ['Team members: (add names and roles)', '', 'Built at GRAVITON 2026 (24h, open innovation).'], 18)
card(s, 7.0, 1.8, 5.7, 3.4, 'Our ask', 'Pilot with one hospital, five pharmacies and one distributor in Mohali for 30 days, and mentorship on healthcare data compliance.')
text(s, 0.6, 5.6, 12, 0.8, 'Try it: sehat-ashen.vercel.app → Live demo → ▶ Auto-play', 18, True, BLUE)

out = os.path.join(HERE, 'Sehat-GRAVITON-2026.pptx'); prs.save(out); print(out)
