"""Builds pitch/sehat-demo.mp4 (fast cut): an opening with the title on top and the patient, doctor and pharmacy
screens fanned out in 16:9, then sections with a heading, the recording in a rounded frame and per-point captions.
Clips are re-timed to fit each section exactly, so a recording never freezes. Inputs: clips/*.webm from rec.py."""
import asyncio, os, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "sehat-demo.mp4")
VOICE, RATE = "en-IN-NeerjaNeural", "+14%"
BLUE, LIGHT, INK, MUTED = "#0774C4", "#8EBEF9", "#0F172A", "#5B6B80"
W, H, FPS, XF = 1920, 1080, 30, 0.4
FX, FY, FW, FH, R = 240, 150, 1440, 810, 30
SKIP = {"home": 2.5, "login": 2.0, "demo": 4.5, "records": 2.5, "journal": 2.0, "senior": 3.0, "tp": 2.0, "td": 2.5, "tph": 2.5}  # page-load seconds to cut
for d in ("seg", "audio", "cards"): os.makedirs(os.path.join(HERE, d), exist_ok=True)

SCRIPT = [
    ("open", "open", ("Sehat", "Care that connects itself  ·  GRAVITON 2026  ·  Team ANTIJAREX"),
     ["Patient books from symptoms", "Doctor signs the prescription", "Pharmacy gets it instantly"],
     "This is Sehat: one live network. The patient books, the doctor signs, and the pharmacy gets it instantly."),
    ("home", "home", "Why Sehat", ["About 1 doctor per 1,200 people in India", "2 in 3 chronic patients skip prescribed medicines"],
     "India has about one doctor for every twelve hundred people, and two in three chronic patients skip prescribed medicines."),
    ("login", "login", "Every role, one login", ["Six roles · hospitals, doctors and pharmacies register themselves"],
     "Hospitals, doctors and pharmacies register themselves, and everyone signs in to their own workspace."),
    ("demo", "demo", "The full flow, live across devices",
     ["Rahul books: doctor and slot picked for him", "City Care checks him in", "Dr. Bansal signs: sent to Rahul's pharmacy", "Rahul approves the bill", "A rider delivers, tracked live", "Low stock: AI reorders from the distributor"],
     "Rahul books, and Sehat picks the doctor and the slot. City Care checks him in. Doctor Bansal signs, and it reaches Rahul's chosen pharmacy. "
     "Rahul approves the bill, a rider delivers, and when stock runs low, the AI reorders from the distributor."),
    ("records", "records", "AI reads any report", ["Report photo explained in 10 Indian languages"],
     "Any report photo is read by AI and explained in ten Indian languages."),
    ("journal", "journal", "Private daily journal", ["Pre-visit summary and daily guidance", "Shared with the doctor only with consent"],
     "A daily journal builds a pre-visit summary, and it is shared with the doctor only with consent."),
    ("senior", "senior", "Senior Mode", ["Big buttons · spoken reminders · SOS, in 8 languages"],
     "Senior Mode gives elders big buttons, spoken reminders and an SOS, in their own language."),
    ("outro", "card", ("Sehat", "One network. Every role. Every language.", "sehat-ashen.vercel.app"), [],
     "Sehat. Try it today at sehat ashen dot vercel dot app."),
]


def run(*a): subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *a], check=True)
def dur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout.strip())
def font(sz, bold=True): return ImageFont.truetype("C:/Windows/Fonts/" + ("segoeuib.ttf" if bold else "segoeui.ttf"), sz)
P = lambda *x: os.path.join(HERE, *x)


def mark(d, cx, cy, s=1.0):
    d.rounded_rectangle([cx - 70 * s, cy - 70 * s, cx + 70 * s, cy + 70 * s], radius=40 * s, fill=BLUE)
    d.rounded_rectangle([cx - 12 * s, cy - 45 * s, cx + 12 * s, cy + 45 * s], radius=6 * s, fill="white")
    d.rounded_rectangle([cx - 45 * s, cy - 12 * s, cx + 45 * s, cy + 12 * s], radius=6 * s, fill="white")


def backdrop(brand=True):
    top, bot = (247, 250, 254), (232, 241, 252)
    g = Image.linear_gradient("L").resize((W, H))
    im = Image.merge("RGB", [g.point(lambda v, a=a, b=b: int(a + (b - a) * v / 255)) for a, b in zip(top, bot)])
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(glow).ellipse([1300, -300, 2300, 600], fill=(142, 190, 249, 90)); glow = glow.filter(ImageFilter.GaussianBlur(120))
    im.paste(glow, (0, 0), glow); d = ImageDraw.Draw(im)
    if brand: mark(d, 70, 62, .32); d.text((104, 44), "Sehat", font=font(30), fill=INK)
    return im


def panel(im, box, r, angle=0.0):
    """White border + soft shadow behind a (possibly tilted) screen."""
    x0, y0, x1, y1 = box; w, h = x1 - x0, y1 - y0; pad = 60
    layer = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    d.rounded_rectangle([pad, pad + 18, pad + w, pad + h + 18], radius=r, fill=(7, 40, 80, 75)); sh = layer.filter(ImageFilter.GaussianBlur(24))
    ImageDraw.Draw(sh).rounded_rectangle([pad - 4, pad - 4, pad + w + 4, pad + h + 4], radius=r + 4, fill=(255, 255, 255, 255))
    sh = sh.rotate(angle, resample=Image.BICUBIC, expand=True); cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    im.paste(sh, (cx - sh.width // 2, cy - sh.height // 2), sh)


def mask(w, h, r):
    p = P("cards", f"mask_{w}x{h}.png"); m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255); m.save(p); return p


def caption(name, i, text):
    f = font(34); tw = int(ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(text, font=f)); w, h = tw + 110, 68
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=34, fill=(255, 255, 255, 248), outline=(220, 231, 245, 255), width=2)
    d.ellipse([28, 24, 48, 44], fill=BLUE); d.text((66, 12), text, font=f, fill=INK)
    p = P("cards", f"{name}_cap{i}.png"); im.save(p); return p


async def voice(name, text):
    p = P("audio", name + ".mp3"); await edge_tts.Communicate(text, VOICE, rate=RATE).save(p); return p


def times(caps, L):
    tot = sum(len(c) for c in caps); t, out = 0.25, []
    for c in caps: d = (L - 0.5) * len(c) / tot; out.append((t, t + d)); t += d
    return out


def clip_in(c, L):
    """Input args + speed so clip c (after its load-time cut) fills exactly L seconds: never frozen, never cut short."""
    cp = P("clips", c + ".webm"); s = SKIP.get(c, 1.5); cd = max(dur(cp) - s, 1.0)
    return ["-ss", f"{s}", "-i", cp], cd / L


def captions_fc(name, caps, L, base, first_input, y):
    ins, fc = [], []
    for j, ((t0, t1), c) in enumerate(zip(times(caps, L), caps)):
        ins += ["-loop", "1", "-i", caption(name, j, c)]; k = first_input + j
        fc.append(f"[{k}:v]format=rgba,fade=in:st={t0:.2f}:d=0.25:alpha=1,fade=out:st={max(t0, t1 - 0.25):.2f}:d=0.25:alpha=1[k{j}];"
                  f"[{base}][k{j}]overlay=(W-w)/2:{y}:enable='between(t,{t0:.2f},{t1:.2f})'[p{j}]"); base = f"p{j}"
    return ins, fc, base


def segment(name, kind, head, caps, text):
    a = asyncio.run(voice(name, text)); L = dur(a) + 0.5; out = P("seg", name + ".mp4")
    enc = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-t", f"{L:.2f}"]
    if kind == "card":
        im = backdrop(False); d = ImageDraw.Draw(im); mark(d, W // 2, 300)
        for txt, f, y, col in ((head[0], font(120), 420, INK), (head[1], font(56, False), 590, BLUE), (head[2], font(34, False), 710, MUTED)):
            w = d.textlength(txt, font=f); d.text(((W - w) / 2, y), txt, font=f, fill=col)
        img = P("cards", name + ".png"); im.save(img)
        run("-loop", "1", "-i", img, "-i", a, "-filter_complex", f"[0:v]scale={W}:{H},fps={FPS}[v];[1:a]apad[a]", "-map", "[v]", "-map", "[a]", *enc, out)
        print(f"{name}: {L:.1f}s"); return out, L
    if kind == "open":   # title on top, three 16:9 screens fanned out below
        im = backdrop(False); d = ImageDraw.Draw(im); mark(d, W // 2 - 205, 112, .55)
        d.text((W // 2 - 150, 52), head[0], font=font(92), fill=INK); f = font(34, False); w = d.textlength(head[1], font=f); d.text(((W - w) / 2, 190), head[1], font=f, fill=MUTED)
        lay = [("tp", 470, 590, 640, 360, 7), ("tph", 1450, 590, 640, 360, -7), ("td", 960, 555, 800, 450, 0)]  # back two first, front last
        labels = {"tp": "Patient", "td": "Doctor", "tph": "Pharmacy"}
        for c, cx, cy, w_, h_, ang in lay: panel(im, (cx - w_ // 2, cy - h_ // 2, cx + w_ // 2, cy + h_ // 2), 22, ang)
        bg = P("cards", name + "_bg.png"); im.save(bg)
        ins, fc, base = ["-loop", "1", "-i", bg], [], "0:v"
        for i, (c, cx, cy, w_, h_, ang) in enumerate(lay):
            cin, sp = clip_in(c, L); ins += cin + ["-loop", "1", "-i", mask(w_, h_, 22)]; vi, mi = 1 + 2 * i, 2 + 2 * i
            rot = f",rotate=a={-ang}*PI/180:c=none:ow=rotw({-ang}*PI/180):oh=roth({-ang}*PI/180)" if ang else ""
            fc.append(f"[{vi}:v]setpts=PTS/{sp:.3f},scale={w_}:{h_}:flags=lanczos,fps={FPS},format=rgba[c{i}];[{mi}:v]format=gray[m{i}];[c{i}][m{i}]alphamerge{rot}[r{i}];"
                      f"[{base}][r{i}]overlay=x={cx}-w/2:y={cy}-h/2:shortest=0[o{i}]"); base = f"o{i}"
        lab = Image.new("RGBA", (W, 60), (0, 0, 0, 0)); dl = ImageDraw.Draw(lab)  # role labels under the fan
        for c, cx, *_ in lay: t = labels[c]; tw = dl.textlength(t, font=font(30)); dl.text((cx - tw / 2, 8), t, font=font(30), fill=BLUE)
        lp = P("cards", "open_labels.png"); lab.save(lp); ins += ["-loop", "1", "-i", lp]; li = 1 + 2 * len(lay)
        fc.append(f"[{base}][{li}:v]overlay=0:830[lb]"); base = "lb"
        cins, cfc, base = captions_fc(name, caps, L, base, li + 1, 940); ins += cins; fc += cfc
    else:                # heading, framed recording, captions
        im = backdrop(); d = ImageDraw.Draw(im); f = font(54); w = d.textlength(head, font=f); d.text(((W - w) / 2, 52), head, font=f, fill=INK)
        panel(im, (FX, FY, FX + FW, FY + FH), R); bg = P("cards", name + "_bg.png"); im.save(bg)
        cin, sp = clip_in(kind, L)
        ins = ["-loop", "1", "-i", bg, "-loop", "1", "-i", mask(FW, FH, R)] + cin
        fc = [f"[2:v]setpts=PTS/{sp:.3f},scale={FW}:{FH}:flags=lanczos,fps={FPS},format=rgba[c];[1:v]format=gray[m];[c][m]alphamerge[r];[0:v][r]overlay={FX}:{FY}:shortest=0[o]"]
        cins, cfc, base = captions_fc(name, caps, L, "o", 3, FY + FH + 34); ins += cins; fc += cfc
    ins += ["-i", a]; ai = sum(1 for x in ins if x == "-i") - 1
    fc.append(f"[{base}]format=yuv420p[v];[{ai}:a]apad[a]")
    run(*ins, "-filter_complex", ";".join(fc), "-map", "[v]", "-map", "[a]", *enc, out)
    print(f"{name}: {L:.1f}s"); return out, L


if __name__ == "__main__":
    segs = [segment(*row) for row in SCRIPT]
    ins = sum((["-i", p] for p, _ in segs), [])
    norm = [f"[{i}:v]settb=AVTB,fps={FPS},format=yuv420p,setsar=1[n{i}];[{i}:a]aresample=48000,aformat=channel_layouts=stereo[s{i}]" for i in range(len(segs))]
    fv, fa, pv, pa, off = [], [], "n0", "s0", 0.0
    for i in range(1, len(segs)):
        off += segs[i - 1][1] - XF
        fv.append(f"[{pv}][n{i}]xfade=transition=smoothleft:duration={XF}:offset={off:.2f}[v{i}]"); pv = f"v{i}"
        fa.append(f"[{pa}][s{i}]acrossfade=d={XF}[a{i}]"); pa = f"a{i}"
    run(*ins, "-filter_complex", ";".join(norm + fv + fa), "-map", f"[{pv}]", "-map", f"[{pa}]", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", OUT)
    print(OUT, f"{dur(OUT):.1f}s")
