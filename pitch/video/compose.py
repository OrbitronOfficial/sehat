"""Builds pitch/sehat-demo.mp4: each section shows a heading, the screen recording in a rounded frame and captions for
each point underneath; it opens with three recordings side by side and crossfades between sections.
Inputs: clips/*.webm from rec.py. Voice: edge-tts (Indian English). Graphics: Pillow."""
import asyncio, os, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "sehat-demo.mp4")
VOICE = "en-IN-NeerjaNeural"
BLUE, LIGHT, INK, MUTED = "#0774C4", "#8EBEF9", "#0F172A", "#5B6B80"
W, H, FPS, XF = 1920, 1080, 30, 0.6          # canvas, frame rate, crossfade seconds
FX, FY, FW, FH, R = 240, 150, 1440, 810, 30  # the framed recording
for d in ("seg", "audio", "cards"): os.makedirs(os.path.join(HERE, d), exist_ok=True)

SCRIPT = [
    ("intro", "card", ("Sehat", "Care that connects itself.", "GRAVITON 2026 · Team ANTIJAREX"), [],
     "This is Sehat: care that connects itself. One live network for patients, hospitals, doctors, nurses, pharmacies and distributors, built by team ANTIJAREX at GRAVITON 2026."),
    ("trio", ["tp", "td", "tph"], "Three people. Three devices. One live network.",
     ["Patient books a visit from his symptoms", "Doctor sees him in the queue and signs the prescription", "Pharmacy receives it instantly, with a stock check"],
     "Watch three people on three devices. The patient books from his symptoms. The doctor sees him in the queue and signs the prescription. And the pharmacy receives it instantly, with a live stock check."),
    ("home", "home", "Why Sehat",
     ["India: about 1 allopathic doctor per 1,200 people", "2 in 3 chronic patients not taking medicines as prescribed (Chennai study)", "AI agents every role installs like apps"],
     "India has roughly one allopathic doctor for every twelve hundred people, and in one study, two in three chronic patients were not taking their medicines as prescribed. Sehat closes these gaps with AI agents that every role installs like apps."),
    ("login", "login", "Sign in as your role",
     ["Six roles: patient, hospital, doctor, nurse, pharmacy, supplier", "Hospitals, doctors and pharmacies register themselves", "Patients choose who treats them"],
     "Everyone signs in to their own workspace. Hospitals, doctors and pharmacies register themselves, so patients can choose who treats them."),
    ("demo", "demo", "The whole flow, live across devices",
     ["Rahul books: Sehat picks the right doctor and earliest slot", "City Care sees it instantly and checks him in", "Dr. Bansal signs: sent to Rahul's chosen pharmacy", "Bill sent: packed only after Rahul approves",
      "A rider delivers while Rahul tracks it live", "Low stock: AI drafts a PO, the distributor restocks"],
     "Here the whole network runs live across devices. Rahul books from his symptoms, and Sehat recommends the right doctor and the earliest slot. City Care sees the booking instantly and checks him in. "
     "Doctor Bansal signs the prescription, and it goes to Rahul's chosen pharmacy with a live stock check. The pharmacy sends a bill, and nothing is packed until Rahul approves it. "
     "A rider takes it to his door while he tracks it. When shelves run low, the AI drafts a purchase order, the distributor delivers, and the stock updates itself."),
    ("records", "records", "AI reads any report", ["Photo or PDF of a report or prescription", "Read by AI and explained in 10 Indian languages"],
     "Any report or prescription photo is read by AI and explained in the patient's own language, in ten Indian languages."),
    ("journal", "journal", "Daily journal", ["Mood, symptoms and sleep in a minute", "Pre-visit summary with diet, activity and sleep guidance", "Private until the patient shares it with the doctor"],
     "A daily journal builds a pre-visit summary, with simple diet, activity and sleep guidance. It stays private until the patient chooses to share it with the doctor."),
    ("senior", "senior", "Senior Mode for elders", ["Three big buttons, nothing else", "Spoken reminders and a double-dose lock", "SOS alerts the hospital and family, in 8 languages"],
     "Senior Mode gives elders three big buttons: medicines with spoken reminders and a double-dose lock, a voice assistant, and an SOS that alerts the hospital and family, in their own language."),
    ("outro", "card", ("Sehat", "One network. Every role. Every language.", "sehat-ashen.vercel.app"), [],
     "Sehat. One network, every role, every language. Try it today at sehat ashen dot vercel dot app."),
]


def run(*a): subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *a], check=True)
def dur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout.strip())
def font(sz, bold=True): return ImageFont.truetype("C:/Windows/Fonts/" + ("segoeuib.ttf" if bold else "segoeui.ttf"), sz)
P = lambda *x: os.path.join(HERE, *x)


def mark(d, cx, cy, s=1.0):  # the Sehat logo: blue rounded square with a white cross
    d.rounded_rectangle([cx - 70 * s, cy - 70 * s, cx + 70 * s, cy + 70 * s], radius=40 * s, fill=BLUE)
    d.rounded_rectangle([cx - 12 * s, cy - 45 * s, cx + 12 * s, cy + 45 * s], radius=6 * s, fill="white")
    d.rounded_rectangle([cx - 45 * s, cy - 12 * s, cx + 45 * s, cy + 12 * s], radius=6 * s, fill="white")


def backdrop():
    im = Image.new("RGB", (W, H), "#F3F7FC"); px = im.load()
    for y in range(H):  # soft vertical gradient
        c = tuple(int(a + (b - a) * y / H) for a, b in zip((247, 250, 254), (232, 241, 252)))
        for x in range(0, W): px[x, y] = c
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(glow).ellipse([1300, -300, 2300, 600], fill=(142, 190, 249, 90))
    im.paste(glow.filter(ImageFilter.GaussianBlur(120)), (0, 0), glow.filter(ImageFilter.GaussianBlur(120)))
    d = ImageDraw.Draw(im); mark(d, 70, 62, .32); d.text((104, 44), "Sehat", font=font(30), fill=INK)
    return im


def shadow(im, box, r):
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle([box[0], box[1] + 18, box[2], box[3] + 18], radius=r, fill=(7, 40, 80, 70))
    sh = sh.filter(ImageFilter.GaussianBlur(26)); im.paste(sh, (0, 0), sh)
    ImageDraw.Draw(im).rounded_rectangle([box[0] - 3, box[1] - 3, box[2] + 3, box[3] + 3], radius=r + 3, fill="white")


def frame_bg(name, heading, boxes, labels=()):
    im = backdrop(); d = ImageDraw.Draw(im); f = font(54); w = d.textlength(heading, font=f); d.text(((W - w) / 2, 52), heading, font=f, fill=INK)
    for b in boxes: shadow(im, b, R)
    d = ImageDraw.Draw(im)
    for (b, lab) in zip(boxes, labels):
        lf = font(34); lw = d.textlength(lab, font=lf); d.text(((b[0] + b[2] - lw) / 2, b[3] + 26), lab, font=lf, fill=BLUE)
    p = P("cards", name + "_bg.png"); im.save(p); return p


def mask(w, h, r, name):
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255); p = P("cards", name); m.save(p); return p


def caption(name, i, text):
    f = font(34); tw = int(ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(text, font=f)); w, h = tw + 110, 68
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=34, fill=(255, 255, 255, 245), outline=(220, 231, 245, 255), width=2)
    d.ellipse([28, 24, 48, 44], fill=BLUE); d.text((66, 12), text, font=f, fill=INK)
    p = P("cards", f"{name}_cap{i}.png"); im.save(p); return p


def card_img(name, title, sub, small):
    im = backdrop(); d = ImageDraw.Draw(im); mark(d, W // 2, 300)
    for txt, f, y, col in ((title, font(120), 420, INK), (sub, font(56, False), 590, BLUE), (small, font(34, False), 710, MUTED)):
        w = d.textlength(txt, font=f); d.text(((W - w) / 2, y), txt, font=f, fill=col)
    p = P("cards", name + ".png"); im.save(p); return p


async def voice(name, text):
    p = P("audio", name + ".mp3"); await edge_tts.Communicate(text, VOICE, rate="+4%").save(p); return p


def times(caps, L):  # each caption shows for a share of the section proportional to its length
    tot = sum(len(c) for c in caps); t, out = 0.3, []
    for c in caps: d = (L - 0.6) * len(c) / tot; out.append((t, t + d)); t += d
    return out


def segment(name, src, heading, caps, text):
    a = asyncio.run(voice(name, text)); L = dur(a) + 1.0; out = P("seg", name + ".mp4")
    enc = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-t", f"{L:.2f}"]
    if src == "card":
        run("-loop", "1", "-i", card_img(name, *heading), "-i", a, "-filter_complex", f"[0:v]scale={W}:{H},fps={FPS}[v];[1:a]apad[a]", "-map", "[v]", "-map", "[a]", *enc, out)
        print(f"{name}: {L:.1f}s"); return out, L
    clips = src if isinstance(src, list) else [src]
    if len(clips) == 1:
        boxes, labels, size = [(FX, FY, FX + FW, FY + FH)], [], (FW, FH)
    else:  # three side by side
        bw, bh, gap = 560, 315, 40; x0 = (W - 3 * bw - 2 * gap) // 2; y0 = 300
        boxes = [(x0 + i * (bw + gap), y0, x0 + i * (bw + gap) + bw, y0 + bh) for i in range(3)]; labels, size = ["Patient", "Doctor", "Pharmacy"], (bw, bh)
    bg, mk = frame_bg(name, heading, boxes, labels), mask(size[0], size[1], R if len(clips) == 1 else 22, f"mask_{size[0]}.png")
    ins, fc = ["-loop", "1", "-i", bg, "-loop", "1", "-i", mk], ["[1:v]format=gray,split=%d%s" % (len(clips), "".join(f"[m{i}]" for i in range(len(clips))))]
    for i, c in enumerate(clips):
        cp = P("clips", c + ".webm"); cd = dur(cp); sp = min(max(cd / L, 1.0), 3.0)  # speed a long clip up to fit (max 3x)
        ins += ["-i", cp]
        fc.append(f"[{2 + i}:v]setpts=PTS/{sp:.3f},scale={size[0]}:{size[1]}:flags=lanczos,fps={FPS},tpad=stop_mode=clone:stop_duration=60,format=rgba[c{i}];"
                  f"[c{i}][m{i}]alphamerge[r{i}]")
    base = "0:v"
    for i, b in enumerate(boxes):
        fc.append(f"[{base}][r{i}]overlay={b[0]}:{b[1]}:shortest=0[o{i}]"); base = f"o{i}"
    cap_y = boxes[0][3] + (36 if len(clips) == 1 else 110)
    for j, ((t0, t1), c) in enumerate(zip(times(caps, L), caps)):
        ins += ["-loop", "1", "-i", caption(name, j, c)]; k = 2 + len(clips) + j
        fc.append(f"[{k}:v]format=rgba,fade=in:st={t0:.2f}:d=0.35:alpha=1,fade=out:st={max(t0, t1 - 0.35):.2f}:d=0.35:alpha=1[k{j}];[{base}][k{j}]overlay=(W-w)/2:{cap_y}:enable='between(t,{t0:.2f},{t1:.2f})'[p{j}]"); base = f"p{j}"
    ins += ["-i", a]; ai = 2 + len(clips) + len(caps)
    fc.append(f"[{base}]format=yuv420p[v];[{ai}:a]apad[a]")
    run(*ins, "-filter_complex", ";".join(fc), "-map", "[v]", "-map", "[a]", *enc, out)
    print(f"{name}: {L:.1f}s"); return out, L


if __name__ == "__main__":
    segs = [(P("seg", n + ".mp4"), dur(P("seg", n + ".mp4"))) for n, *_ in SCRIPT] if os.environ.get("JOIN_ONLY") else [segment(n, s, h, c, t) for n, s, h, c, t in SCRIPT]
    # crossfade every section into the next (video xfade + audio acrossfade)
    ins, fv, fa, off = [], [], [], 0.0
    for i, (p, L) in enumerate(segs): ins += ["-i", p]
    norm = [f"[{i}:v]settb=AVTB,fps={FPS},format=yuv420p,setsar=1[n{i}];[{i}:a]aresample=48000,aformat=channel_layouts=stereo[s{i}]" for i in range(len(segs))]
    pv, pa = "n0", "s0"
    for i in range(1, len(segs)):
        off += segs[i - 1][1] - XF
        fv.append(f"[{pv}][n{i}]xfade=transition=fade:duration={XF}:offset={off:.2f}[v{i}]"); pv = f"v{i}"
        fa.append(f"[{pa}][s{i}]acrossfade=d={XF}[a{i}]"); pa = f"a{i}"
    run(*ins, "-filter_complex", ";".join(norm + fv + fa), "-map", f"[{pv}]", "-map", f"[{pa}]", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", OUT)
    print(OUT, f"{dur(OUT):.1f}s")
