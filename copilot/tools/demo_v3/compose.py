"""Builds demo/sehat-copilot-demo-v3.mp4 from clips/*.webm (rec.py), edge-tts voice and Pillow cards."""
import asyncio, json, os, subprocess
from PIL import Image, ImageDraw, ImageFont
import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "demo", "sehat-copilot-demo-v3.mp4")
VOICE = "en-IN-NeerjaNeural"
BLUE, LIGHT, INK = "#0774C4", "#8EBEF9", "#0F172A"
W, H, FPS = 1920, 1080, 30
for d in ("seg", "audio", "cards"):
    os.makedirs(os.path.join(HERE, d), exist_ok=True)


def run(*a):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *a], check=True)


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                capture_output=True, text=True).stdout.strip())


def marks(name):
    m = dict(json.load(open(os.path.join(HERE, "clips", name + ".json"))))
    ratio = dur(os.path.join(HERE, "clips", name + ".webm")) / m["end"]
    return {k: v * ratio for k, v in m.items()}, ratio


def font(sz, bold=True):
    return ImageFont.truetype("C:/Windows/Fonts/" + ("segoeuib.ttf" if bold else "segoeui.ttf"), sz)


def card(name, title, sub=None, small=None):
    im = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 16], fill=BLUE)
    d.rectangle([0, H - 16, W, H], fill=LIGHT)
    d.ellipse([W // 2 - 55, 250, W // 2 + 55, 360], fill=BLUE)
    d.rectangle([W // 2 - 8, 275, W // 2 + 8, 335], fill="white")
    d.rectangle([W // 2 - 30, 297, W // 2 + 30, 313], fill="white")
    d.text((W // 2, 470), title, font=font(78), fill=INK, anchor="mm")
    if sub:
        d.text((W // 2, 570), sub, font=font(40, False), fill=BLUE, anchor="mm")
    if small:
        d.text((W // 2, 700), small, font=font(32, False), fill="#4B5563", anchor="mm")
    p = os.path.join(HERE, "cards", name + ".png")
    im.save(p)
    return p


async def tts(text, path):
    await edge_tts.Communicate(text, VOICE, rate="-4%").save(path)


# (id, kind, ...) kind clip: (clip, start, end) ; kind card: (png)
def build():
    F, FR = marks("front")
    P, PR = marks("patient")
    U, UR = marks("upload")
    D, DR = marks("doctor")
    segs = [
        ("c_intro", "card", card("intro", "Sehat Copilot", "Your health records, explained", "Understand prescriptions and lab reports in plain words"),
         "Sehat Copilot. Your health records, explained."),
        ("landing", "clip", "front", F["landing"], F["signin"],
         "This is Sehat Copilot. You add a prescription or a lab report, and it explains it in plain words. It explains your records. It is not a diagnosis."),
        ("signin", "clip", "front", F["signin"] + 0.8, F["end"] - 0.5,
         "You can sign in as a patient, or as a doctor. For this demo we use the built-in demo accounts, so no password is needed."),
        ("c_pat", "card", card("pat", "For patients", "A demo account with sample records"), None),
        ("dash", "clip", "patient", P["dash"] - 1.2, P["dash"] + 15,
         "This is the patient dashboard. The blue card has a three D DNA helix. It follows the cursor and tilts as the mouse moves. Below it you see the values that need attention."),
        ("timeline", "clip", "patient", P["timeline"], P["health"] - 0.6,
         "The timeline puts every saved report, prescription and discharge summary in date order."),
        ("health", "clip", "patient", P["health"], P["meds"] - 0.6,
         "My health shows what needs attention, and how each value has changed. High and low are judged against the range printed on your own report."),
        ("meds", "clip", "patient", P["meds"], P["visits"] - 0.6,
         "Medicines turns your prescriptions into reminders. Mark a dose as taken, remind me in fifteen minutes or an hour, or skip it."),
        ("visits", "clip", "patient", P["visits"], P["journal"] - 0.6,
         "Visits keeps track of your doctor appointments, and helps you prepare for the next one."),
        ("journal", "clip", "patient", P["journal"], P["wellness"] - 0.6,
         "The journal records how you feel each day, and draws charts of your entries."),
        ("wellness", "clip", "patient", P["wellness"], P["family"] - 0.6,
         "Wellness is where you log home readings, and see simple everyday habit tips."),
        ("family", "clip", "patient", P["family"], P["ask"] - 0.6,
         "Family lets you keep records for the people you look after, each in their own profile."),
        ("ask", "clip", "patient", P["ask"], P["abha"] - 0.6,
         "Ask lets you question your own records. Here we ask what the latest H b A one c means. The answer names the report it came from."),
        ("abha", "clip", "patient", P["abha"], P["end"],
         "ABHA and export lets you take your records with you in the FHIR format. The ABHA link is a mock of the national consent steps."),
        ("c_up", "card", card("up", "Add a report", "Upload a photo of a lab report"), None),
        ("upload", "clip", "upload", U["add"], U["wait_b"] - 0.8,
         "Now we add a real report. We choose a photo of a lab report. The app reads it, which can take up to a minute, so we skip ahead here."),
        ("review", "clip", "upload", U["wait_b"] - 0.2, U["end"],
         "Here is what it read, next to the original. You check the values and fix anything before saving. Nothing is saved until you confirm."),
        ("c_doc", "card", card("doc", "For doctors", "Sehat Doctor workspace"), None),
        ("docdemo", "clip", "doctor", D["docdemo"] - 0.5, D["queue"] + 0.5,
         "On the sign-in page, choose I am a doctor, then continue with the doctor demo."),
        ("queue", "clip", "doctor", D["queue"] + 0.5, D["sorted"],
         "In today's patients, we add three people with different complaints. Routine follow-up, fever for two days, and chest pain since morning."),
        ("sorted", "clip", "doctor", D["sorted"], D["start"],
         "The list sorts itself by urgency. Chest pain is Major, fever is Moderate, and the follow-up is Minor. The reason is shown, and the doctor can change any priority."),
        ("notes", "clip", "doctor", D["start"], D["draft_click"] + 0.5,
         "Start the most urgent patient. Without a microphone, the consultation notes can simply be typed."),
        ("draft", "clip", "doctor", D["draft_click"] + 0.5, D["approve"],
         "Then Write prescription from this creates an editable draft. The doctor checks the diagnosis, the medicines and the advice."),
        ("approve", "clip", "doctor", D["approve"], D["end"] - 0.2,
         "Approve and send to patient. It then appears in the patient's app. The doctor always has the final say."),
        ("c_out", "card", card("out", "Thank you", "Sehat Copilot explains records. It is not a diagnosis.",
                               "Built with an AI coding assistant  \u00b7  Team ANTIJAREX  \u00b7  HacXLerate 2026"),
         "Built with an AI coding assistant. Team Anti Jarex. Hacks Elerate twenty twenty six."),
    ]
    clipf = {k: os.path.join(HERE, "clips", k + ".webm") for k in ("front", "patient", "upload", "doctor")}
    outs, log, t = [], [], 0.0
    for s in segs:
        sid, kind = s[0], s[1]
        text = s[-1]
        seg = os.path.join(HERE, "seg", sid + ".mp4")
        apath = os.path.join(HERE, "audio", sid + ".mp3")
        ad = 0.0
        if text:
            if not os.path.exists(apath):
                asyncio.run(tts(text, apath))
            ad = dur(apath)
        if kind == "card":
            target = max(ad + 0.9, 2.4)
            vin = ["-loop", "1", "-framerate", str(FPS), "-i", s[2]]
            vf = f"fade=t=in:d=0.4,fade=t=out:st={target-0.4:.2f}:d=0.4,format=yuv420p"
        else:
            clip, a, b = s[2], max(0, s[3]), s[4]
            part = b - a
            target = ad + 0.7
            f = part / target
            f = max(f, 0.9)
            vin = ["-ss", f"{a:.2f}", "-t", f"{part:.2f}", "-i", clipf[clip]]
            vf = (f"setpts=PTS/{f:.4f},fps={FPS},scale={W}:{H}:flags=lanczos,tpad=stop_mode=clone:stop_duration=6,"
                  f"trim=duration={target:.2f},fade=t=in:d=0.25,fade=t=out:st={target-0.25:.2f}:d=0.25,format=yuv420p")
            if f > 3.5:
                print("WARN speed", sid, round(f, 2))
        if text:
            ain = ["-i", apath]
            af = f"adelay=350|350,apad,atrim=duration={target:.2f},aresample=44100,aformat=channel_layouts=stereo"
        else:
            ain = ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"]
            af = f"atrim=duration={target:.2f}"
        run(*vin, *ain, "-filter_complex", f"[0:v]{vf}[v];[1:a]{af}[a]", "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-t", f"{target:.2f}", seg)
        outs.append(seg)
        log.append((sid, round(t, 1), round(t + dur(seg), 1)))
        t += dur(seg)
    lst = os.path.join(HERE, "list.txt")
    open(lst, "w").write("".join(f"file '{o.replace(chr(92), '/')}'\n" for o in outs))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    run("-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", OUT)
    json.dump(log, open(os.path.join(HERE, "sections.json"), "w"))
    for l in log:
        print(l)
    print("total", round(dur(OUT), 1), OUT)


build()
