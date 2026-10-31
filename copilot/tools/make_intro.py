"""Renders docs/intro.mp4: a narrated walkthrough of the product, one step of the user's journey
per scene (sign in, add a record, check it, read the explanation, timeline, dashboard, ask, export).

Pictures: a real recording of the app being used (docs/clips, made by tools/make_clips.py: typing,
clicking, scrolling, with the cursor drawn in), cut into the steps and fitted to each spoken line.
If there is no recording, still screenshots are used instead (docs/shots, tools/make_shots.py).
Two stock clips washed to white behind the opening and closing cards (docs/footage, see
CREDITS.md there).
Voice: docs/voice/1.mp3 ... N.mp3 if you record your own, else a neural voice through the edge-tts
package, else the offline Windows voice. Every scene lasts exactly as long as its line, and what
appears on screen is timed as a fraction of that length, so picture and voice stay together.
Needs Pillow and ffmpeg on PATH.  Run: python tools/make_intro.py"""
import json
import math
import os
import random
import subprocess
import wave
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, FPS, RATE = 1280, 720, 24, 22050
WHITE, TEAL, INK, MUTED, LINE = "#FFFFFF", "#0F766E", "#0F172A", "#5B6B68", "#E2E8E4"
FONTS = "C:/Windows/Fonts/"
VOICE = "en-IN-NeerjaNeural"  # any edge-tts voice name
LEAD, TAIL = 0.3, 0.55        # silence before and after each line


# (kind, spoken line, on-screen title, sub line, screenshot, where the pointer lands on it)
STEPS = [
    ("title", "Sehat Copilot. Understand your own health records.", None, None, None, None),
    ("step", "First, sign in. Your account stays on your own device.",
     "Sign in", "Your account stays on your device.", "login", (0.50, 0.772, 0.255, 0.052)),
    ("step", "Upload a photo or PDF of any prescription or lab report, and watch it being read.",
     "Add a record", "Photo, PDF or text. Printed or handwritten.", "add", (0.535, 0.435, 0.078, 0.052)),
    ("step", "Check what was read, side by side with the original, and fix anything before it is saved.",
     "Check it against\nthe original", "Unreadable lines are listed, never guessed.", "review", (0.84, 0.76, 0.118, 0.048)),
    ("step", "Then read it in plain words. Every high or low is checked against the range printed on your own report.",
     "Read it in\nplain words", "High and low come from the printed range.", "detail", (0.43, 0.555, 0.39, 0.125)),
    ("step", "Every record you save joins one timeline.",
     "One timeline", "Every visit and report, in order.", "timeline", (0.59, 0.395, 0.68, 0.205)),
    ("step", "Your dashboard shows what needs attention, how your values changed, and questions for your doctor.",
     "Your health\nat a glance", "Trends, home readings, doctor questions.", "health", (0.445, 0.395, 0.425, 0.36)),
    ("step", "Meet Saathi, your guide on every screen. Say hi, ask about your records, and every answer names the report it came from.",
     "Meet Saathi,\nyour guide", "Ask anything. Answers name the report they came from.", "ask", (0.50, 0.48, 0.54, 0.225)),
    ("step", "Export everything in the fire format, with a mock Aabha link that follows the national consent steps.",
     "Take it with you", "FHIR export and a mock ABHA link.", "abha", (0.31, 0.67, 0.13, 0.052)),
    ("step", "And all of it works in forty-three languages. Switch in one tap.",
     "In your language", "43 languages, ten Indian languages ready.", "lang", (0.90, 0.03, 0.10, 0.05)),
    ("end", "Sehat Copilot. A guide to your records. Not a doctor.", None, None, None, None),
]


def font(size, bold=False, mono=False):
    name = "consola.ttf" if mono else ("segoeuib.ttf" if bold else "segoeui.ttf")
    try:
        return ImageFont.truetype(FONTS + name, size)
    except OSError:
        return ImageFont.load_default()


def ease(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def mix(a, b, k):
    a, b = [int(a[i:i + 2], 16) for i in (1, 3, 5)], [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return tuple(round(a[i] + (b[i] - a[i]) * k) for i in range(3))


def text(d, xy, s, size, fill, t, delay=0.0, bold=False, mono=False, anchor="la", bg=WHITE):
    """Text that fades in from the background and rises 14 px."""
    k = ease((t - delay) / 0.55)
    if k > 0:
        d.text((xy[0], xy[1] + (1 - k) * 14), s, font=font(size, bold, mono), fill=mix(bg, fill, k), anchor=anchor)


# ---------------- depth: drifting backdrop, particles, helix, floating screens, camera ----------------

def _backdrop():
    im = Image.new("RGB", (W + 240, H + 240), WHITE)
    d = ImageDraw.Draw(im)
    for x, y, r, c in [(240, 190, 330, "#E4F3F0"), (1300, 780, 400, "#EAF4EC"), (1150, 100, 260, "#EEF3FB")]:
        d.ellipse((x - r, y - r, x + r, y + r), fill=c)
    return im.filter(ImageFilter.GaussianBlur(150))


BACK = _backdrop()
random.seed(7)
DOTS = [(random.random(), random.random(), random.random()) for _ in range(40)]


def backdrop(T):
    x, y = 120 + 90 * math.sin(T * 0.21), 120 + 70 * math.cos(T * 0.17)
    return BACK.crop((round(x), round(y), round(x) + W, round(y) + H))


def particles(d, T):
    for x, y, z in DOTS:
        px = (x * W + 40 * z * math.sin(T * 0.5 + x * 9)) % W
        py = (y * H - T * (10 + 34 * z)) % H
        r = 1.5 + 4 * z
        d.ellipse((px - r, py - r, px + r, py + r), fill=mix(WHITE, TEAL, 0.06 + 0.12 * z))


def helix(d, cx, top, height, radius, T, k=1.0):
    """A double helix turning about its vertical axis, drawn back to front."""
    if k <= 0:
        return
    n, balls = 26, []
    for i in range(n):
        y = top + height * i / (n - 1)
        ang = i * 0.52 + T * 1.3
        x, z = math.cos(ang) * radius, math.sin(ang)
        if i % 2 == 0:
            d.line((cx + x, y, cx - x, y), fill=mix(WHITE, TEAL, 0.18 * k), width=2)
        balls += [(z, cx + x, y, TEAL), (-z, cx - x, y, "#7FB8B0")]
    for z, x, y, c in sorted(balls):
        r = 5 + 4.5 * (z + 1) / 2
        d.ellipse((x - r, y - r, x + r, y + r), fill=mix(WHITE, c, k * (0.3 + 0.7 * (z + 1) / 2)))


def _coeffs(dst, src):
    """Perspective coefficients mapping output points dst back to source points src."""
    m = []
    for (x, y), (u, v) in zip(dst, src):
        m.append([x, y, 1, 0, 0, 0, -u * x, -u * y, u])
        m.append([0, 0, 0, x, y, 1, -v * x, -v * y, v])
    for c in range(8):  # Gauss-Jordan
        piv = max(range(c, 8), key=lambda r: abs(m[r][c]))
        m[c], m[piv] = m[piv], m[c]
        m[c] = [v / m[c][c] for v in m[c]]
        for r in range(8):
            if r != c:
                f = m[r][c]
                m[r] = [a - f * b for a, b in zip(m[r], m[c])]
    return [m[i][8] for i in range(8)]


def card3d(im, src, x, y, yaw):
    """Paste an image turned about its left edge by yaw (0 = flat) on a soft shadow.
    Returns a function mapping a point on the flat image to where it lands on the frame."""
    w, h = src.size
    wd, inset = w * math.cos(yaw), h * 0.5 * math.sin(yaw) * 0.42
    quad = [(0, 0), (wd, inset), (wd, h - inset), (0, h)]
    shadow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shadow).polygon([(x + px + 10, y + py + 26) for px, py in quad], fill=70)
    im.paste(Image.new("RGB", (W, H), "#5B7B75"), (0, 0), shadow.filter(ImageFilter.GaussianBlur(24)))
    warped = src.convert("RGBA").transform((w, h), Image.PERSPECTIVE, _coeffs(quad, [(0, 0), (w, 0), (w, h), (0, h)]), Image.BICUBIC)
    im.paste(warped, (round(x), round(y)), warped)
    ImageDraw.Draw(im).line([(x + px, y + py) for px, py in quad] + [(x, y)], fill="#CBD5D1", width=2)
    return lambda fx, fy: (x + fx * wd, y + inset * fx + fy * (h - 2 * inset * fx))


def _framed(name, width):
    """A screenshot inside a light browser frame, scaled to `width`. Returns (image, share taken by the bar)."""
    path = os.path.join(ROOT, "docs", "shots", name + ".png")
    shot = Image.open(path).convert("RGB") if os.path.exists(path) else Image.new("RGB", (1440, 900), "#F4F7F5")
    h = round(width * shot.height / shot.width)
    bar = 26
    im = Image.new("RGB", (width, h + bar), "#EEF2F0")
    d = ImageDraw.Draw(im)
    for i, c in enumerate(("#E0605A", "#E6B44C", "#5FBF77")):
        d.ellipse((14 + i * 18, 8, 24 + i * 18, 18), fill=c)
    d.rounded_rectangle((90, 6, width - 90, 20), 7, fill=WHITE)
    im.paste(shot.resize((width, h), Image.LANCZOS), (0, bar))
    return im, bar / (h + bar)


SHOTS = {s[4]: _framed(s[4], 770) for s in STEPS if s[4]}
SHOTS["trends"] = _framed("trends", 420)
for _name in ("login", "health", "timeline"):
    SHOTS.setdefault(_name, _framed(_name, 770))


def _smooth(size, paint, scale=3):
    """Draw at 3x and scale down, so edges come out smooth."""
    im = Image.new("RGBA", (size[0] * scale, size[1] * scale), (0, 0, 0, 0))
    paint(ImageDraw.Draw(im), scale)
    return im.resize(size, Image.LANCZOS)


def _cursor():
    pts = [(4, 3), (4, 33), (11, 26), (16, 38), (21, 36), (16, 24), (26, 24)]

    def paint(d, k):
        d.polygon([((x + 2) * k, (y + 3) * k) for x, y in pts], fill=(15, 23, 42, 70))  # shadow
        d.polygon([(x * k, y * k) for x, y in pts], fill=(255, 255, 255, 255))
        d.line([(x * k, y * k) for x, y in pts + pts[:1]], fill=(15, 23, 42, 255), width=2 * k, joint="curve")
    return _smooth((34, 46), paint, 4)


CURSOR = _cursor()
RGB_TEAL = (15, 118, 110)


def outline(im, box, k):
    """The thing being clicked: a soft tinted box that stays once the click lands."""
    if k <= 0:
        return
    x0, y0, x1, y1 = [round(v) for v in box]
    pad = 8
    w, h = x1 - x0 + 2 * pad, y1 - y0 + 2 * pad

    def paint(d, s):
        d.rounded_rectangle((2 * s, 2 * s, (w - 2) * s, (h - 2) * s), 10 * s, fill=RGB_TEAL + (round(26 * k),),
                            outline=RGB_TEAL + (round(235 * k),), width=3 * s)
    patch = _smooth((w, h), paint)
    im.paste(patch, (x0 - pad, y0 - pad), patch)


def ripple(im, cx, cy, p):
    """One soft ring spreading from the click point."""
    if not 0 < p < 1:
        return
    r, size = 10 + 46 * ease(p), 130

    def paint(d, s):
        c = size * s / 2
        d.ellipse((c - r * s, c - r * s, c + r * s, c + r * s), fill=RGB_TEAL + (round(70 * (1 - p)),),
                  outline=RGB_TEAL + (round(200 * (1 - p)),), width=2 * s)
    patch = _smooth((size, size), paint)
    im.paste(patch, (round(cx - size / 2), round(cy - size / 2)), patch)


def click(im, box, t, at):
    """The cursor glides to the target, presses once, and the target stays outlined."""
    move = 0.9
    if t < at:
        return
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    m = min(1.0, (t - at) / move)
    k = m * m * (3 - 2 * m)  # ease in and out
    outline(im, box, ease((t - at - move) / 0.35))
    ripple(im, cx, cy, (t - at - move) / 0.7)
    press = 3 if 0 <= t - at - move < 0.14 else 0  # a small dip as it clicks
    px, py = cx + (1 - k) * 230, cy + (1 - k) * 150
    im.paste(CURSOR, (round(px - 4 + press), round(py - 3 + press)), CURSOR)


def progress(d, n, total, k, y=662, x=64):
    """Where this step sits in the journey."""
    for i in range(total):
        fill = TEAL if i < n - 1 else (mix(LINE, TEAL, k) if i == n - 1 else LINE)
        d.rounded_rectangle((x + i * 52, y, x + 44 + i * 52, y + 6), 3, fill=fill)


# ---------------- scenes: everything is placed as a fraction of the line's length ----------------

def s_step(im, d, t, secs, n, total, title, sub, shot, at):
    src, bar = SHOTS[shot]
    k = ease(t / 1.0)
    place = card3d(im, src, 470 + round((1 - k) * 140), 112, math.radians(38 * (1 - k)))
    text(d, (64, 150), f"STEP {n} OF {total}", 22, TEAL, t, 0.0, mono=True)
    lines = title.split("\n")
    for i, line in enumerate(lines):
        text(d, (64, 186 + i * 58), line, 48, INK, t, 0.1 + i * 0.12, bold=True)
    y, row, rows = 186 + 58 * len(lines) + 22, "", []
    for wd in sub.split():  # wrap the sub line into the left column
        if row and d.textlength(row + " " + wd, font=font(24)) > 380:
            rows.append(row)
            row = wd
        else:
            row = (row + " " + wd).strip()
    rows.append(row)
    for i, r in enumerate(rows):
        text(d, (64, y + i * 34), r, 24, MUTED, t, secs * 0.30)
    progress(d, n, total, ease(t / 0.6))
    if k >= 1:  # the screen is flat now, so the box maps straight onto it
        cx, cy, bw, bh = at
        x0, y0 = place(cx - bw / 2, bar + (cy - bh / 2) * (1 - bar))
        x1, y1 = place(cx + bw / 2, bar + (cy + bh / 2) * (1 - bar))
        click(im, (x0, y0, x1, y1), t, max(1.1, secs * 0.36))


# ---------------- the recorded session, cut into steps ----------------

def _marks():
    try:
        with open(os.path.join(ROOT, "docs", "clips", "marks.json"), encoding="utf-8") as f:
            m = json.load(f)
        return m if os.path.exists(os.path.join(ROOT, "docs", "clips", "session.webm")) else None
    except (OSError, ValueError):
        return None


MARKS = _marks()
# where the camera leans in during each step: (centre x, centre y, zoom), as shares of the recording
ZOOM = {"ask": (0.80, 0.60, 1.55)}
CLIP_W, CLIP_H, BAR, RADIUS = 1008, 630, 26, 14


def clip(name, n):
    """Yields n frames of one step of the recording: its waiting stretches cut out, and the rest
    slowed or sped up to last exactly as long as the spoken line."""
    names = [m[0] for m in MARKS["marks"]]
    if name not in names:
        return
    i = names.index(name)
    a, b = MARKS["marks"][i][1], MARKS["marks"][i + 1][1]
    keep, at = [], a
    for c0, c1 in sorted(MARKS["cuts"]):
        if c1 <= at or c0 >= b:
            continue
        if c0 > at:
            keep.append((at, min(c0, b)))
        at = max(at, c1)
    if at < b:
        keep.append((at, b))
    total = sum(y - x for x, y in keep)
    if total <= 0:
        return
    w, h = MARKS["size"]
    pick = "+".join(f"between(t,{x:.2f},{y:.2f})" for x, y in keep)
    vf = f"select='{pick}',setpts=N/(25*TB),setpts={(n / FPS) / total:.4f}*PTS,fps={FPS}"
    ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-i", os.path.join(ROOT, "docs", "clips", "session.webm"), "-vf", vf,
                           "-frames:v", str(n), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    size, last = w * h * 3, None
    for _ in range(n):
        buf = ff.stdout.read(size)
        if len(buf) == size:
            last = Image.frombytes("RGB", (w, h), buf)
            last.paste(last.crop((12, 0, 24, 10)), (0, 0))  # cover the corner stamp the recorder uses for timing
        if last is None:
            break
        yield last
    ff.stdout.close()
    ff.wait()


def _window():
    """The empty browser window the recording plays inside, with its shadow, drawn once."""
    im = Image.new("RGB", (CLIP_W, CLIP_H + BAR), "#EEF2F0")
    d = ImageDraw.Draw(im)
    for i, c in enumerate(("#E0605A", "#E6B44C", "#5FBF77")):
        d.ellipse((14 + i * 18, 8, 24 + i * 18, 18), fill=c)
    d.rounded_rectangle((90, 6, CLIP_W - 90, 20), 7, fill=WHITE)
    d.text((CLIP_W // 2, 13), "sehat-copilot.vercel.app", font=font(11), fill=MUTED, anchor="mm")
    return im


WINDOW = _window()
WIN_X, WIN_Y = (W - CLIP_W) // 2, 60


def _rounded(size, radius, blur=0, grow=0, alpha=255):
    """A rounded-rectangle mask, optionally grown and blurred into a soft shadow."""
    pad = blur * 3 + grow
    m = Image.new("L", (size[0] + pad * 2, size[1] + pad * 2), 0)
    ImageDraw.Draw(m).rounded_rectangle((pad - grow, pad - grow, pad + size[0] + grow, pad + size[1] + grow), radius + grow, fill=alpha)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m


WIN_MASK = _rounded((CLIP_W, CLIP_H + BAR), RADIUS)
WIN_SHADOW = _rounded((CLIP_W, CLIP_H + BAR), RADIUS, blur=22, grow=2, alpha=120)
SHADOW_INK = Image.new("RGB", WIN_SHADOW.size, "#2F4F4A")


def s_clip(im, d, t, secs, n, total, title, sub, frame, shot):
    """One step: the real recording of it, whole, in a browser window. Each arrives differently."""
    backdrop_now = im.copy()
    cx, cy, z = ZOOM.get(shot, (0.5, 0.5, 1.0))
    m = max(0.0, min(1.0, (t - secs * 0.12) / (secs * 0.30)))
    k = 1 + (z - 1) * (m * m * (3 - 2 * m))
    fw, fh = frame.size
    w, h = fw / k, fh / k
    x0 = max(0, min(fw - w, cx * fw - w / 2))
    y0 = max(0, min(fh - h, cy * fh - h / 2))
    view = frame.resize((CLIP_W, CLIP_H), Image.LANCZOS, box=(x0, y0, x0 + w, y0 + h))
    win = WINDOW.copy()
    win.paste(view, (0, BAR))
    e = ease(t / 0.65)
    dx, dy, scale = [(0, 34, 1), (150, 0, 1), (0, 0, 0.90), (-150, 0, 1), (0, -34, 1)][n % 5]  # rise, from right, grow, from left, drop
    dx, dy = round(dx * (1 - e)), round(dy * (1 - e))
    off = (WIN_SHADOW.size[0] - CLIP_W) // 2
    if scale != 1 and e < 1:  # grows into place
        k = scale + (1 - scale) * e
        size = (round(CLIP_W * k), round((CLIP_H + BAR) * k))
        x, y = WIN_X + (CLIP_W - size[0]) // 2, WIN_Y + (CLIP_H + BAR - size[1]) // 2
        im.paste(win.resize(size, Image.BICUBIC), (x, y), WIN_MASK.resize(size))
    else:
        im.paste(SHADOW_INK, (WIN_X + dx - off, WIN_Y + dy - off + 16), WIN_SHADOW)  # soft shadow, then the rounded window
        im.paste(win, (WIN_X + dx, WIN_Y + dy), WIN_MASK)
    if e < 1:  # and fades up from the page as it arrives
        im.paste(Image.blend(im, backdrop_now, 1 - e), (0, 0))
    text(d, (WIN_X, 5), f"STEP {n} OF {total}", 15, TEAL, t, 0.0, mono=True)
    text(d, (WIN_X, 22), title.replace("\n", " "), 27, INK, t, 0.1, bold=True)
    text(d, (WIN_X + CLIP_W, 34), sub, 18, MUTED, t, secs * 0.25, anchor="ra")
    progress(d, n, total, ease(t / 0.6), y=10, x=WIN_X + CLIP_W - total * 52 + 8)


def project(w, h, cx, cy, yaw, pitch, scale, f=1500):
    """Where the corners of a w x h card land when it is turned (yaw), tipped back (pitch) and
    seen through a simple camera. Positive yaw sends the right edge away from the viewer."""
    pts = []
    for x, y in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)):
        x, y = x * scale, y * scale
        z = x * math.sin(yaw) + y * math.sin(pitch)
        k = f / (f + z)
        pts.append((cx + x * math.cos(yaw) * k, cy + y * math.cos(pitch) * k))
    return pts


def place(im, src, quad):
    """Paste a card into an arbitrary four-corner shape, on a soft shadow."""
    w, h = src.size
    shadow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shadow).polygon([(x + 8, y + 30) for x, y in quad], fill=95)
    im.paste(Image.new("RGB", (W, H), "#4B6B66"), (0, 0), shadow.filter(ImageFilter.GaussianBlur(26)))
    warped = src.convert("RGBA").transform((W, H), Image.PERSPECTIVE, _coeffs(quad, [(0, 0), (w, 0), (w, h), (0, h)]), Image.BICUBIC)
    im.paste(warped, (0, 0), warped)
    ImageDraw.Draw(im).line(quad + quad[:1], fill="#C9D4D0", width=2)


# the opening: (screenshot, final centre x, centre y, yaw, scale, delay)
STAGE = [("health", 262, 486, 0.52, 0.60, 0.80), ("timeline", 1018, 486, -0.52, 0.60, 0.95), ("login", 640, 478, 0.0, 0.80, 0.45)]


def s_title(im, d, t, secs):
    """The product arrives: three real screens fly up from below, turn to face the viewer and
    settle with the sign-in page in front, while the camera keeps drifting in."""
    push = 1 + 0.06 * t / secs
    for name, cx, cy, yaw, scale, delay in STAGE:
        k = ease((t - delay) / 1.5)
        if k <= 0:
            continue
        src = SHOTS[name][0]
        sway = 0.035 * math.sin(t * 0.9 + cx)  # never quite still
        quad = project(src.size[0], src.size[1], cx + (640 - cx) * (1 - k) * 0.5, cy + (1 - k) * 520,
                       yaw * (0.4 + 0.6 * k) + sway, 1.05 * (1 - k) + 0.10, scale * (0.72 + 0.28 * k) * push)
        place(im, src, quad)
    cx = W // 2
    f = font(64, True)
    wide = d.textlength("Sehat Copilot", font=f)
    k = ease(t / 0.7)
    x0 = cx - (wide + 74) / 2
    d.rounded_rectangle((x0, 34 + (1 - k) * 14, x0 + 56, 90 + (1 - k) * 14), 14, fill=mix(WHITE, TEAL, k))
    d.rectangle((x0 + 23, 46 + (1 - k) * 14, x0 + 33, 78 + (1 - k) * 14), fill=WHITE)
    d.rectangle((x0 + 12, 57 + (1 - k) * 14, x0 + 44, 67 + (1 - k) * 14), fill=WHITE)
    text(d, (x0 + 74, 22), "Sehat Copilot", 64, INK, t, 0.0, bold=True)
    words, f2 = "Understand your own health records.".split(), font(30)
    total = sum(d.textlength(w + " ", font=f2) for w in words)
    x = cx - total / 2
    for n, w in enumerate(words):  # the line lands a word at a time
        text(d, (x, 112), w, 30, TEAL, t, secs * 0.30 + n * 0.16)
        x += d.textlength(w + " ", font=f2)


def s_end(im, d, t, secs):
    cx, k = W // 2, ease(t / 0.8)
    helix(d, 170, 60, 600, 62, t + 1, k)
    helix(d, W - 170, 60, 600, 62, t + 3, k)
    text(d, (cx, 190), "Sehat Copilot", 84, INK, t, 0.0, bold=True, anchor="ma")
    text(d, (cx, 310), "A guide to your records. Not a doctor.", 34, TEAL, t, secs * 0.28, anchor="ma")
    text(d, (cx, 420), "sehat-copilot.vercel.app", 40, INK, t, secs * 0.5, mono=True, anchor="ma")
    text(d, (cx, 500), "Open it and upload any prescription or lab report", 26, MUTED, t, secs * 0.6, anchor="ma")
    text(d, (cx, 630), "43 languages  ·  FHIR export  ·  ABDM consent flow with a mock ABHA", 20, MUTED, t, secs * 0.7, mono=True, anchor="ma")


def footage(name, n, start=1.0):
    """Yields n frames of a stock clip, cropped to fill the frame. Nothing if the clip is missing."""
    path = os.path.join(ROOT, "docs", "footage", name + ".mp4")
    if not os.path.exists(path):
        return
    ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-ss", str(start), "-i", path, "-frames:v", str(n), "-vf",
                           f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS}",
                           "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    size = W * H * 3
    while True:
        buf = ff.stdout.read(size)
        if len(buf) < size:
            break
        yield Image.frombytes("RGB", (W, H), buf)
    ff.stdout.close()
    ff.wait()


BLANK = Image.new("RGB", (W, H), WHITE)


def camera(im, t, secs):
    """A quick fade to white into the next step. The picture itself never moves."""
    left = secs - t
    if left >= 0.3:
        return im
    return Image.blend(im, BLANK, (1 - left / 0.3) ** 2)


# ---------------- voice ----------------

def _lengths(tmp):
    out = []
    for i in range(len(STEPS)):
        with wave.open(os.path.join(tmp, f"line{i}.wav")) as w:
            out.append(w.getnframes() / w.getframerate())
    return out


def _to_wav(src, dst):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", str(RATE), "-sample_fmt", "s16", dst], check=True)


def _own_voice(tmp):
    """docs/voice/1.mp3 ... N.mp3 (or .wav / .m4a), one per line: your own recording wins."""
    folder = os.path.join(ROOT, "docs", "voice")
    files = [next((os.path.join(folder, f"{i + 1}{e}") for e in (".mp3", ".wav", ".m4a")
                   if os.path.exists(os.path.join(folder, f"{i + 1}{e}"))), None) for i in range(len(STEPS))]
    if not all(files):
        return []
    for i, f in enumerate(files):
        _to_wav(f, os.path.join(tmp, f"line{i}.wav"))
    print("voice: docs/voice")
    return _lengths(tmp)


def _neural_voice(tmp):
    try:
        import asyncio
        import edge_tts

        async def run():
            for i, s in enumerate(STEPS):
                await edge_tts.Communicate(s[1], VOICE, rate="+8%").save(os.path.join(tmp, f"line{i}.mp3"))
        asyncio.run(run())
        for i in range(len(STEPS)):
            _to_wav(os.path.join(tmp, f"line{i}.mp3"), os.path.join(tmp, f"line{i}.wav"))
    except Exception as e:  # package missing or no network: fall back to the offline voice
        print("neural voice unavailable:", str(e)[:120])
        return []
    print("voice:", VOICE)
    return _lengths(tmp)


def _system_voice(tmp):
    import json
    with open(os.path.join(tmp, "lines.json"), "w", encoding="utf-8") as f:
        json.dump([s[1] for s in STEPS], f)
    ps = os.path.join(tmp, "speak.ps1")
    with open(ps, "w", encoding="utf-8") as f:
        f.write("""param($dir)
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.Rate = 2
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$lines = Get-Content -Raw -Encoding UTF8 (Join-Path $dir 'lines.json') | ConvertFrom-Json
for ($i = 0; $i -lt $lines.Count; $i++) {
  $s.SetOutputToWaveFile((Join-Path $dir ("line$i.wav")), $fmt)
  $s.Speak($lines[$i])
}
$s.SetOutputToNull()
""")
    try:
        subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps, tmp], capture_output=True, timeout=180)
        print("voice: Windows system voice")
        return _lengths(tmp)
    except (OSError, subprocess.SubprocessError, wave.Error):
        return []


def soundtrack(tmp, lengths):
    """One WAV as long as the video: each line starts just after its scene does."""
    path = os.path.join(tmp, "voice.wav")
    with wave.open(path, "wb") as o:
        o.setnchannels(1)
        o.setsampwidth(2)
        o.setframerate(RATE)
        for i, secs in enumerate(lengths):
            with wave.open(os.path.join(tmp, f"line{i}.wav")) as w:
                data = w.readframes(w.getnframes())
            total, lead = round(secs * FPS) * RATE // FPS, int(LEAD * RATE)
            o.writeframes(bytes(2) * lead + data + bytes(2) * max(0, total - lead - len(data) // 2))
    return path


def main():
    out = os.path.join(ROOT, "docs", "intro.mp4")
    tmp = os.path.join(os.environ.get("TEMP", "."), "sehat_intro")
    os.makedirs(tmp, exist_ok=True)
    spoken = _own_voice(tmp) or _neural_voice(tmp) or _system_voice(tmp)
    # a scene lasts exactly as long as its line (5 s each if there is no voice at all)
    lengths = [round((LEAD + x + TAIL) * FPS) / FPS for x in spoken] if spoken else [5.0] * len(STEPS)
    video = os.path.join(tmp, "silent.mp4") if spoken else out
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20",
                           "-movflags", "+faststart", video], stdin=subprocess.PIPE)
    total, T, n_step = sum(1 for s in STEPS if s[0] == "step"), 0.0, 0
    for (kind, _, title, sub, shot, at), secs in zip(STEPS, lengths):
        n = round(secs * FPS)
        n_step += kind == "step"
        reel = footage("pills", n) if kind == "end" else None
        moving = clip(shot, n) if kind == "step" and MARKS else None
        for i in range(n):
            t = i / FPS
            frame = next(reel, None) if reel else None
            # stock footage is washed almost to white so it reads as texture, not as a picture
            im = Image.blend(frame, BLANK, 0.84) if frame else backdrop(T)
            d = ImageDraw.Draw(im)
            particles(d, T)
            if kind == "title":
                s_title(im, d, t, secs)
            elif kind == "end":
                s_end(im, d, t, secs)
            else:
                live = next(moving, None) if moving else None
                if live:
                    s_clip(im, d, t, secs, n_step, total, title, sub, live, shot)
                else:
                    s_step(im, d, t, secs, n_step, total, title, sub, shot, at)
            ff.stdin.write(camera(im, t, secs).tobytes())
            T += 1 / FPS
    ff.stdin.close()
    ff.wait()
    if spoken:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-i", soundtrack(tmp, lengths), "-c:v", "copy",
                        "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", out], check=True)
    print(out, round(sum(lengths), 1), "seconds", [round(x, 1) for x in lengths])


if __name__ == "__main__":
    main()
