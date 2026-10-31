/* Saathi's product knowledge, shared by the site pages and the app.

   Fixed answers about what the product is, how it works, pricing and privacy. No network
   and no model: every sentence here is written by the team, so the guide cannot invent a
   claim. Questions about a person's own reports are not answered here at all; they are
   routed to sign-in, because only the app can answer from saved records. */
(function () {
  var EMERGENCY = /chest pain|can'?t breathe|cannot breathe|unconscious|passed out|seizure|stroke|heart attack|suicid|kill myself|overdose|सीने में दर्द|सांस नहीं|साँस नहीं|बेहोश|आत्महत्या/i;
  var REPORT = /\b(my|mine|meri|mera|mere)\b.*\b(report|result|value|level|test|medicine|tablet|prescription|sugar|hba1c|cholesterol|thyroid|bp|dose)|\b(hba1c|hemoglobin|haemoglobin|cholesterol|creatinine|tsh|vitamin|platelet|ldl|hdl|triglyceride|sgpt|sgot|bilirubin)\b|\b(report|prescription|lab|discharge|result)s?\b.*\b(mean|say|show|normal|high|low|explain)|\bis (it|this|that) (normal|high|low|serious|dangerous)|\bshould i (take|stop|start|worry)|रिपोर्ट|दवा|नतीज/i;

  var FAQ = [
    { re: /^\s*(hi+|hello+|hey+|hiya|namaste|namaskar|good (morning|afternoon|evening)|नमस्ते|नमस्कार|हेलो|हाय)[\s!.,]*$/i,
      text: "Hi, I'm Saathi. I'm here to help you on your health journey. I can explain your reports and medicines in plain words, show what has changed over time, and help you prepare questions for your doctor. Add a document or ask me about your records. I'm a guide, not a doctor." },
    { re: /\b(what|who)\b.*\b(is|are|does)\b.*\b(this|sehat|site|website|app|it|you)\b|what.*(do|does).*(do|for)|tell me about|about (this|sehat)|kya (hai|karta)|क्या है/i,
      text: "Sehat Copilot reads your prescriptions, lab reports and discharge summaries, explains them in plain language, and keeps them in one timeline. It is a guide to your records, not a doctor." },
    { re: /how.*(work|use|start|begin|upload)|steps|get started|kaise/i,
      text: "Three steps. Upload a photo or PDF of a report or prescription. Check what was read against the original, on the same screen. Then read the plain-language summary and see it added to your timeline." },
    { re: /why.*(price|cost|charge|pay|₹|rupee)|justif|worth|expensive|how.*(price|priced)|value for money/i,
      text: "Our thinking on pricing: reading one person's documents should cost nothing, so the Free plan has everything an individual needs. Reading documents with AI does cost us per page, and the planned Family and Clinic plans are how that would be paid for. Family is priced for a household sharing one plan; Clinic is priced for a practice that would use it with many patients." },
    { re: /price|pricing|cost|free|paid|plan|subscription|₹|rupee|charge|kitna|कीमत/i,
      text: "It is free while Sehat Copilot is a prototype. The Free plan covers records, summaries, timeline, trends and export for one person. Family at ₹149 a month and Clinic at ₹1,999 a month are on the roadmap, not on sale yet." },
    { re: /safe|secure|privacy|private|data|store|stored|delete|who can see|share|upload.*where|kahan|सुरक्षित/i,
      text: "Your records stay in this browser on this device. A document is sent to third-party AI services only to be read and explained, and our server stores nothing. You can delete any record, or everything, from the app at any time." },
    { re: /account|sign ?in|sign ?up|log ?in|register|password|guest|demo/i,
      text: "An account is optional and lives only in this browser. You can upload and read your records as a guest. The demo account opens a sample patient in one click. Asking questions about your reports needs a sign-in." },
    { re: /language|hindi|tamil|telugu|bengali|marathi|gujarati|kannada|malayalam|punjabi|urdu|spanish|french|arabic|translate|भाषा/i,
      text: "The app works in 43 languages. Ten ship ready, including Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam and Punjabi. Others are translated the first time you pick them. Summaries and answers are written in the language you choose." },
    { re: /replace (my|a|the|your) doctor|instead of (a|my|the) doctor|(are|is) (you|it|this) a doctor|diagnos|medical advice|can (it|you) (treat|cure)|trust (it|this|you|the app)|how accurate|is (it|this) accurate|accuracy|can (it|you|this) be wrong|make mistakes?/i,
      text: "Sehat Copilot does not diagnose and does not replace your doctor. Software, not the AI, decides whether a value is high or low, using the range printed on your report. Every value shows the line it was read from so you can check it, and handwritten documents are always marked for checking." },
    { re: /handwrit|photo|pdf|scan|camera|which (document|file)|what (document|file)|format|kind of (report|document)/i,
      text: "Photos, PDFs and text files work. Printed documents read best. Handwritten prescriptions are read too, but every item is marked for you to check against the original." },
    { re: /abha|abdm|fhir|export|download|backup|another device|share with (my )?doctor|print/i,
      text: "You can export all records as a FHIR R4 bundle shaped on ABDM profiles, download a backup file to move to another device, and print a one-page summary for your doctor. The ABHA link in the app is a mock for demonstration." },
    { re: /reminder|schedule|medicine.*(time|today)|interaction|family|profile/i,
      text: "Inside the app, My health shows today's medicine schedule from your prescriptions, with optional reminders while the app is open, and a check for the same ingredient under two brand names." },
    { re: /who (made|built|created)|team|hackathon|student|open source|github|contact/i,
      text: "Sehat Copilot is a student prototype built by team ANTIJAREX for HacXLerate 2026, for the Altrix Labs challenge. The code is on GitHub." },
    { re: /saathi|who are you|your name|are you (a )?(bot|ai|human|doctor)/i,
      text: "I am Saathi, the guide for Sehat Copilot. I can explain what the product does, how it works and what it costs. Inside the app I answer questions from your saved records. I am not a doctor." }
  ];

  var TEXT = {
    emergency: "If this is happening right now, call 112 or go to the nearest emergency department. Do not wait for an answer here.",
    signin: "To ask about your reports, please sign in first. It takes one click with the demo account.",
    inapp: "I answer questions about your reports inside the app, from your saved records.",
    unknown: "I can tell you what Sehat Copilot does, how it works, what it costs and how your data is handled. For questions about your own reports, sign in and ask inside the app."
  };

  /* Returns { kind: "emergency" | "faq" | "report" | "unknown", text }.
     "report" means: do not answer here; ask the person to sign in (or open the app). */
  function answer(question) {
    var q = String(question || "").trim();
    if (EMERGENCY.test(q)) return { kind: "emergency", text: TEXT.emergency };
    if (REPORT.test(q)) return { kind: "report", text: TEXT.signin };
    for (var i = 0; i < FAQ.length; i++) if (FAQ[i].re.test(q)) return { kind: "faq", text: FAQ[i].text };
    return { kind: "unknown", text: TEXT.unknown };
  }

  window.SehatFAQ = { answer: answer, TEXT: TEXT, all: FAQ.map(function (f) { return f.text; }) };
})();
