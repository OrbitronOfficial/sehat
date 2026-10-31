"""Builds pitch/sehat-demo.mp4 from clips/*.webm (rec.py), an edge-tts Indian-English voiceover and Pillow title cards."""
import asyncio, os, subprocess
from PIL import Image, ImageDraw, ImageFont
import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "sehat-demo.mp4")
VOICE = "en-IN-NeerjaNeural"
BLUE, LIGHT, INK, MUTED = "#0774C4", "#8EBEF9", "#0F172A", "#5B6B80"
W, H, FPS = 1920, 1080, 30
for d in ("seg", "audio", "cards"): os.makedirs(os.path.join(HERE, d), exist_ok=True)

# (segment, clip or card, narration)
SCRIPT = [
    ("intro", ("card", "Sehat", "Care that connects itself.", "GRAVITON 2026 · Team ANTIJAREX"),
     "This is Sehat: care that connects itself. One live network for patients, hospitals, doctors, nurses, pharmacies and distributors, built by team ANTIJAREX at GRAVITON 2026."),
    ("home", "home", "India has roughly one allopathic doctor for every twelve hundred people, and in one study, two in three chronic patients were not taking their medicines as prescribed. "
                     "Sehat closes these gaps with AI agents that every role installs like apps."),
    ("login", "login", "Everyone signs in to their own workspace. Hospitals, doctors and pharmacies register themselves, so patients can choose who treats them."),
    ("demo", "demo", "Here the whole network runs live across devices. Rahul books from his symptoms, and Sehat recommends the right doctor and the earliest slot. "
                     "City Care sees the booking instantly and checks him in. Doctor Bansal signs the prescription, and it goes to Rahul's chosen pharmacy with a live stock check. "
                     "The pharmacy sends a bill, and nothing is packed until Rahul approves it. A rider takes it to his door while he tracks it. "
                     "When shelves run low, the AI drafts a purchase order, the distributor delivers, and the stock updates itself."),
    ("records", "records", "Any report or prescription photo is read by AI and explained in the patient's own language, in ten Indian languages."),
    ("journal", "journal", "A daily journal builds a pre-visit summary, with simple diet, activity and sleep guidance. It stays private until the patient chooses to share it with the doctor."),
    ("senior", "senior", "Senior Mode gives elders three big buttons: medicines with spoken reminders and a double-dose lock, a voice assistant, and an SOS that alerts the hospital and family, in their own language."),
    ("outro", ("card", "Sehat", "One network. Every role. Every language.", "sehat-ashen.vercel.app"),
     "Sehat. One network, every role, every language. Try it today at sehat ashen dot vercel dot app."),
]


def run(*a): subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *a], check=True)
def dur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout.strip())
def font(sz, bold=True): return ImageFont.truetype("C:/Windows/Fonts/" + ("segoeuib.ttf" if bold else "segoeui.ttf"), sz)


def card(name, title, sub, small):
    im = Image.new("RGB", (W, H), "#F3F7FC"); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 16], fill=BLUE); d.rectangle([0, H - 16, W, H], fill=LIGHT)
    d.rounded_rectangle([W // 2 - 70, 230, W // 2 + 70, 370], radius=40, fill=BLUE)   # the Sehat mark
    d.rounded_rectangle([W // 2 - 12, 255, W // 2 + 12, 345], radius=6, fill="white"); d.rounded_rectangle([W // 2 - 45, 288, W // 2 + 45, 312], radius=6, fill="white")
    for txt, f, y, col in ((title, font(120), 440, INK), (sub, font(56, False), 600, BLUE), (small, font(34, False), 720, MUTED)):
        w = d.textlength(txt, font=f); d.text(((W - w) / 2, y), txt, font=f, fill=col)
    p = os.path.join(HERE, "cards", name + ".png"); im.save(p); return p


async def voice(name, text):
    p = os.path.join(HERE, "audio", name + ".mp3"); await edge_tts.Communicate(text, VOICE, rate="+4%").save(p); return p


def segment(name, src, text):
    a = asyncio.run(voice(name, text)); ad = dur(a); L = ad + 0.9; out = os.path.join(HERE, "seg", name + ".mp4")
    if isinstance(src, tuple):
        img = card(name, *src[1:])
        run("-loop", "1", "-t", f"{L:.2f}", "-i", img, "-i", a, "-vf", f"scale={W}:{H},fps={FPS},fade=in:0:12,format=yuv420p", "-af", "apad", "-t", f"{L:.2f}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", out)
    else:
        clip = os.path.join(HERE, "clips", src + ".webm"); cd = dur(clip)
        speed = cd / L if cd > L else 1.0                     # speed a long clip up to fit the voice (no faster than 3x; the waiting parts are still)
        if speed > 3.0: speed = 3.0
        vf = f"setpts=PTS/{speed:.3f},scale={W}:{H}:flags=lanczos,fps={FPS},tpad=stop_mode=clone:stop_duration=30,format=yuv420p"
        run("-i", clip, "-i", a, "-vf", vf, "-af", "apad", "-t", f"{L:.2f}", "-map", "0:v", "-map", "1:a",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", out)
    print(f"{name}: {L:.1f}s"); return out


if __name__ == "__main__":
    segs = [segment(n, s, t) for n, s, t in SCRIPT]
    lst = os.path.join(HERE, "seg", "list.txt")
    open(lst, "w").write("".join(f"file '{s}'\n".replace("\\", "/") for s in segs))
    run("-f", "concat", "-safe", "0", "-i", lst, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", OUT)
    print(OUT, f"{dur(OUT):.1f}s")
