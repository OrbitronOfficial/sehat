"""Safety gate for questions. Runs before any model call.

Order: emergency first, then medication-change, then the normal path.
A match returns a fixed reply written here; the model is not called at all.

Hindi templates are DRAFT and need review by a clinician before real use.
"""
import re

LANGS = ("en", "hi")

_EMERGENCY = re.compile(
    r"chest pain|pain in (my |the )?chest|heart attack|"
    r"can'?t breathe|cannot breathe|not able to breathe|unable to breathe|"
    r"(difficulty|trouble|problem) (in )?breathing|"
    r"unconscious|passed out|fainted|not responding|seizure|convulsion|\bfits?\b|"
    r"stroke|face (is )?drooping|slurred speech|"
    r"suicid|kill (myself|himself|herself)|end my life|self[- ]?harm|hurt myself|"
    r"overdose|vomiting blood|coughing (up )?blood|bleeding (heavily|a lot|won'?t stop)|"
    # Hindi
    r"सीने में दर्द|छाती में दर्द|दिल का दौरा|हार्ट अटैक|"
    r"सांस नहीं|साँस नहीं|सांस लेने में|साँस लेने में|दम घुट|"
    r"बेहोश|होश नहीं|दौरा पड़|दौरे पड़|मिर्गी|लकवा|"
    r"आत्महत्या|खुदकुशी|जान दे|मरना चाहत|खुद को नुकसान|"
    r"खून की उल्टी|खून बंद नहीं|"
    # chest pain in Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Punjabi
    r"বুকে ব্যথা|ఛాతీ నొప్పి|ఛాతీలో నొప్పి|छातीत दुख|நெஞ்சு வலி|છાતીમાં દુખાવો|ಎದೆ ನೋವು|നെഞ്ചുവേദന|നെഞ്ച് വേദന|ਛਾਤੀ ਵਿੱਚ ਦਰਦ|"
    # Hindi typed in Latin letters
    r"seene (me|mein) dard|chhati (me|mein) dard|saans nahi|sans nahi|behosh|khudkushi|aatmahatya",
    re.I)

_MED = (r"dose|dosage|tablets?|pills?|capsules?|medicines?|medications?|meds|drugs?|insulin|"
        r"injection|syrup|metformin|statin|antibiotics?|blood thinner|bp medicine")
_CHANGE = (r"stop(ping)?|skip(ping)?|quit|discontinue|double|doubling|increase|reduce|decrease|"
           r"lower|halve|cut down|change|switch|replace|take (more|less|extra|two|2)|miss(ed)?")
_MED_HI = r"दवा|दवाई|दवाइ|गोली|गोलियां|गोलियाँ|खुराक|डोज़|डोज|इंसुलिन|इन्सुलिन|टैबलेट|कैप्सूल"
_CHANGE_HI = r"बंद|छोड़|रोक|दोगुन|दुगुन|बढ़ा|घटा|कम कर|ज़्यादा ले|ज्यादा ले|बदल|न लूं|ना लूं|नहीं लूं"
_MED_ROMAN = r"dawa|dawai|dava|davai|goli|khurak"
_CHANGE_ROMAN = r"band|chhod|chod|rok|double|badha|ghata|kam kar|badal"

_MEDICATION = re.compile(
    rf"\b({_CHANGE})\b.{{0,40}}\b({_MED})\b|\b({_MED})\b.{{0,40}}\b({_CHANGE})\b|"
    rf"({_MED_HI}).{{0,40}}({_CHANGE_HI})|({_CHANGE_HI}).{{0,40}}({_MED_HI})|"
    rf"\b({_MED_ROMAN})\b.{{0,40}}\b({_CHANGE_ROMAN})|\b({_CHANGE_ROMAN})\b.{{0,40}}\b({_MED_ROMAN})\b",
    re.I | re.S)

# Change intent: a stop/skip/dose change that names ANY medicine (or says medicine/tablet/dawa/goli).
_INTENT = (r"stop(ping|ped)?|quit(ting)?|skip(ping)?|discontinu\w*|reduc\w*|increas\w*|doubl\w*|halv\w*|"
           r"chang\w*|switch\w*|start(ing)?|take (more|less|extra|double|half)|taking (more|less|extra|double|half)|"
           r"cut (down|back)|lower(ing)? the|raise|up the")
_INTENT_HI = r"बंद|छोड़|छोड|रोक|कम|कम कर|बढ़ा|बढा|दोगुन|दुगुन|आधा|बदल|शुरू"
_INTENT_ROMAN = (r"band\s*(kar|karna|karu|kr)|bandh|chhod\w*|chod\w*|kam\s*(kar|karna|karu|kr)|"
                 r"badha\w*|badhana|ghata\w*|rok\w*|badal\w*")
_INTENT_RE = re.compile(rf"\b({_INTENT})\b|({_INTENT_HI})|\b({_INTENT_ROMAN})", re.I)
_ANY_MED = re.compile(rf"\b({_MED}|{_MED_ROMAN}|medicine|tablet|dawa)\b|{_MED_HI}", re.I)


def _names_in(q, names):
    low = " " + re.sub(r"[^a-z0-9ऀ-ॿ]+", " ", q.lower()) + " "
    for n in names or ():
        n = re.sub(r"[^a-z0-9ऀ-ॿ]+", " ", str(n or "").lower()).strip()
        if len(n) >= 3 and " " + n + " " in low:
            return True
    return False


TEMPLATES = {
    "emergency": {
        "en": "This sounds like it could be an emergency. If it is happening right now, call 112 "
              "(or 108 for an ambulance) or go to the nearest emergency department. Do not wait for "
              "an answer here.\n\nIf you are having thoughts of harming yourself, you can call "
              "Tele-MANAS on 14416, free, at any hour.\n\nIf you were asking about a past event or a "
              "value in your reports, please ask again in those words, for example: "
              "\"What does my cholesterol result mean?\"",
        "hi": "यह आपातकालीन स्थिति हो सकती है। अगर यह अभी हो रहा है, तो तुरंत 112 पर कॉल करें "
              "(एम्बुलेंस के लिए 108) या नज़दीकी अस्पताल के आपातकालीन विभाग में जाएँ। यहाँ जवाब का "
              "इंतज़ार न करें।\n\nअगर आपके मन में खुद को नुकसान पहुँचाने के विचार आ रहे हैं, तो "
              "टेली-मानस 14416 पर किसी भी समय मुफ़्त कॉल कर सकते हैं।\n\nअगर आप किसी पुरानी घटना या "
              "अपनी रिपोर्ट के किसी मान के बारे में पूछ रहे थे, तो कृपया उसी तरह दोबारा पूछें, जैसे: "
              "\"मेरे कोलेस्ट्रॉल के नतीजे का क्या मतलब है?\"",
    },
    "medication": {
        "en": "I can't advise on stopping, skipping or changing the dose of a medicine. Please ask "
              "the doctor who prescribed it, or your pharmacist, before making any change. Stopping "
              "some medicines suddenly can be harmful.\n\nI can tell you what your records say about "
              "a medicine: its name, strength and how it was prescribed.",
        "hi": "मैं किसी दवा को बंद करने, छोड़ने या उसकी खुराक बदलने की सलाह नहीं दे सकता। कोई भी "
              "बदलाव करने से पहले कृपया उस डॉक्टर से पूछें जिन्होंने दवा लिखी है, या अपने फार्मासिस्ट "
              "से। कुछ दवाएँ अचानक बंद करना नुकसानदेह हो सकता है।\n\nमैं यह बता सकता हूँ कि आपके "
              "रिकॉर्ड में उस दवा के बारे में क्या लिखा है: नाम, मात्रा और लेने का तरीका।",
    },
}

# Languages without a full reviewed template get one short native line followed by the
# full English reply, so the message is never silently English-only. DRAFT translations.
SHORT = {
    "emergency": {
        "bn": "এটি জরুরি অবস্থা হতে পারে। এখনই 112 নম্বরে ফোন করুন অথবা নিকটতম হাসপাতালে যান।",
        "te": "ఇది అత్యవసర పరిస్థితి కావచ్చు. వెంటనే 112కు కాల్ చేయండి లేదా దగ్గరలోని ఆసుపత్రికి వెళ్లండి.",
        "mr": "ही आपत्कालीन स्थिती असू शकते. लगेच 112 वर कॉल करा किंवा जवळच्या रुग्णालयात जा.",
        "ta": "இது அவசர நிலையாக இருக்கலாம். உடனே 112 ஐ அழையுங்கள் அல்லது அருகிலுள்ள மருத்துவமனைக்குச் செல்லுங்கள்.",
        "gu": "આ કટોકટી હોઈ શકે છે. તરત જ 112 પર કૉલ કરો અથવા નજીકની હોસ્પિટલમાં જાઓ.",
        "kn": "ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿ ಆಗಿರಬಹುದು. ತಕ್ಷಣ 112 ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗೆ ಹೋಗಿ.",
        "ml": "ഇത് അടിയന്തര സാഹചര്യമാകാം. ഉടൻ 112-ൽ വിളിക്കുക അല്ലെങ്കിൽ അടുത്തുള്ള ആശുപത്രിയിൽ പോകുക.",
        "pa": "ਇਹ ਐਮਰਜੈਂਸੀ ਹੋ ਸਕਦੀ ਹੈ। ਤੁਰੰਤ 112 'ਤੇ ਕਾਲ ਕਰੋ ਜਾਂ ਨੇੜਲੇ ਹਸਪਤਾਲ ਜਾਓ।",
    },
    "medication": {
        "bn": "ডাক্তারকে না জিজ্ঞেস করে কোনো ওষুধ বন্ধ বা পরিবর্তন করবেন না।",
        "te": "మీ డాక్టర్‌ను అడగకుండా ఏ మందునూ ఆపవద్దు లేదా మార్చవద్దు.",
        "mr": "डॉक्टरांना विचारल्याशिवाय कोणतेही औषध बंद करू नका किंवा बदलू नका.",
        "ta": "மருத்துவரிடம் கேட்காமல் எந்த மருந்தையும் நிறுத்தவோ மாற்றவோ வேண்டாம்.",
        "gu": "ડૉક્ટરને પૂછ્યા વિના કોઈ દવા બંધ કરશો નહીં કે બદલશો નહીં.",
        "kn": "ವೈದ್ಯರನ್ನು ಕೇಳದೆ ಯಾವುದೇ ಔಷಧಿಯನ್ನು ನಿಲ್ಲಿಸಬೇಡಿ ಅಥವಾ ಬದಲಾಯಿಸಬೇಡಿ.",
        "ml": "ഡോക്ടറോട് ചോദിക്കാതെ ഒരു മരുന്നും നിർത്തുകയോ മാറ്റുകയോ ചെയ്യരുത്.",
        "pa": "ਡਾਕਟਰ ਨੂੰ ਪੁੱਛੇ ਬਿਨਾਂ ਕੋਈ ਦਵਾਈ ਬੰਦ ਨਾ ਕਰੋ ਜਾਂ ਨਾ ਬਦਲੋ।",
    },
}

LABELS = ("records", "general", "doctor", "emergency")


def reply(kind, lang):
    """Text shown to the user: the full template, or a short native line plus full English."""
    if lang in TEMPLATES[kind]:
        return TEMPLATES[kind][lang]
    short = SHORT[kind].get(lang)
    return (short + "\n\n" if short else "") + TEMPLATES[kind]["en"]


def template(kind, lang):
    """Fixed reply text. Raises KeyError for a missing language: the tests rely on this so
    a missing translation is caught before release, never shown as silent English."""
    return TEMPLATES[kind][lang]


def classify(question, names=()):
    """'emergency', 'medication' or None. Emergency always wins. `names` are medicine names
    (generic, brand, or from the user's records): a change request naming one is a medication question."""
    q = question or ""
    if _EMERGENCY.search(q):
        return "emergency"
    if _MEDICATION.search(q):
        return "medication"
    if _INTENT_RE.search(q) and (_ANY_MED.search(q) or _names_in(q, names)):
        return "medication"
    return None


def gate(question, lang, names=()):
    """Returns a complete fixed answer, or None when the question may go to the model."""
    kind = classify(question, names)
    if not kind:
        return None
    return {"answer": reply(kind, lang), "sources": [], "gate": kind,
            "label": "emergency" if kind == "emergency" else "doctor"}


# ---- numeric guard -------------------------------------------------------

_NUM = re.compile(r"\d+(?:[.,]\d+)*")
_DEVANAGARI = str.maketrans("०१२३४५६७८९", "0123456789")


def numbers(text):
    """Every number in a text as floats. Thousands separators and Devanagari digits handled."""
    out = set()
    for m in _NUM.findall(str(text or "").translate(_DEVANAGARI)):
        m = m.rstrip(".,")
        parts = m.split(",")
        if len(parts) > 1 and all(len(p.split(".")[0]) in (2, 3) for p in parts[1:]):
            m = "".join(parts)  # 1,50,000 or 150,000
        else:
            m = m.replace(",", ".")
        try:
            out.add(float(m))
        except ValueError:
            for piece in re.findall(r"\d+(?:\.\d+)?", m):
                out.add(float(piece))
    return out


def unverified(text, allowed):
    """Numbers in `text` that are not in the verified set."""
    return {n for n in numbers(text) if n not in allowed}
