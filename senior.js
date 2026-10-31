// Sehat Senior Mode ("the Dadi / Nani test"): a patient setting that turns the patient app into three big buttons
// for an elder (medicines now, talk to Dr. Saathi, SOS), with spoken reminders in their language, double-dose
// lock, a caregiver alert when a dose is missed and a photo-to-spoken report explainer.
// Settings live in the shared store (prefs[member]), so a doctor can switch it on from the consult too.
const VLANGS = [['hi', 'हिन्दी', 'hi-IN'], ['pa', 'ਪੰਜਾਬੀ', 'pa-IN'], ['ta', 'தமிழ்', 'ta-IN'], ['bn', 'বাংলা', 'bn-IN'], ['te', 'తెలుగు', 'te-IN'], ['mr', 'मराठी', 'mr-IN'], ['gu', 'ગુજરાતી', 'gu-IN'], ['en', 'English', 'en-IN']];
const pOf = n => (Store.db.prefs || {})[n] || {};
function setP(n, k, v) { act(`${k === 'senior' ? (v ? 'turned on' : 'turned off') + ' Senior Mode for' : 'updated settings for'} ${n}`, d => { d.prefs = d.prefs || {}; d.prefs[n] = { ...(d.prefs[n] || {}), [k]: v }; }); }
const seniorAs = () => { try { return localStorage.getItem('sehat_senior_as'); } catch { return null; } };
function useSenior(n, on) { try { on ? localStorage.setItem('sehat_senior_as', n) : localStorage.removeItem('sehat_senior_as'); } catch {} setP(n, 'senior', on); }
const seniorOn = () => { const n = seniorAs(); return n && pOf(n).senior && role === 'patient'; };
function say(text, n) {
  if (!('speechSynthesis' in window)) return toast(text);
  const lang = (VLANGS.find(l => l[0] === (pOf(n).vlang || 'hi')) || VLANGS[0])[2], v = speechSynthesis.getVoices().find(x => x.lang.replace('_', '-').toLowerCase().startsWith(lang.slice(0, 2)));
  const u = new SpeechSynthesisUtterance(text); u.lang = lang; if (v) u.voice = v; u.rate = .9; speechSynthesis.cancel(); speechSynthesis.speak(u);
}
const medsFor = n => Store.db.reminders.filter(r => r.who === n);

// ---------- Settings tab (patient) ----------
V.psettings = () => {
  const fam = Store.db.family, as = seniorAs(), alerts = (Store.db.alerts || []).slice(0, 5);
  return head('Settings', 'Senior Mode, voice and caregiver for each family member.') + `<div class="grid g2"><div class="card"><span class="eyebrow">👵 Senior Mode</span><h3 style="margin:6px 0">Big buttons for elders</h3>
    <p class="muted">Turns the app into three large buttons: medicines now, talk to Dr. Saathi, and SOS. Reminders are spoken aloud and a missed dose alerts the caregiver.</p>
    ${fam.map(m => { const on = !!pOf(m.name).senior; return `<div class="row" style="padding:12px 0;border-bottom:1px solid var(--line)"><span style="font-size:24px">${m.age > 55 ? '👵' : m.age < 12 ? '🧒' : '🧑'}</span><div><b>${esc(m.name)}</b><br><span class="muted">${m.rel} · ${m.age} y${on && as === m.name ? ' · on this device' : ''}</span></div><span class="sp"></span>
      <button class="btn sm ${on ? '' : 'ghost'}" role="switch" aria-checked="${on}" onclick="useSenior(Store.db.family[${fam.indexOf(m)}].name, ${!on})">${on ? '● Senior Mode on' : 'Turn on'}</button></div>`; }).join('')}
    ${as && pOf(as).senior ? `<button class="btn" style="margin-top:14px" onclick="go('sehat_copilot')">Open Senior Mode for ${esc(as)} →</button>` : ''}</div>
   <div class="card"><span class="eyebrow">Voice & caregiver</span>${fam.map((m, i) => { const p = pOf(m.name); return `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><b>${esc(m.name)}</b>
     <div class="grid g3" style="gap:8px;margin-top:6px"><select onchange="setP(Store.db.family[${i}].name,'vlang',this.value)">${VLANGS.map(([k, l]) => `<option value="${k}" ${(p.vlang || 'hi') === k ? 'selected' : ''}>🔊 ${l}</option>`).join('')}</select>
     <input placeholder="Caregiver (e.g. Rahul)" value="${esc(p.cgName || (m.rel === 'Self' ? '' : fam[0].name.split(' ')[0]))}" onchange="setP(Store.db.family[${i}].name,'cgName',this.value)"><input placeholder="Caregiver phone" inputmode="tel" value="${esc(p.cgPhone || '')}" onchange="setP(Store.db.family[${i}].name,'cgPhone',this.value)"></div></div>`; }).join('')}
     <h3 style="margin-top:16px">Caregiver alerts</h3>${alerts.map(a => `<p>🔔 <b>${esc(a.who)}</b> has not logged ${esc(a.med)} (${a.slot}) · alerted ${esc(a.to)} · ${ago(a.t)}</p>`).join('') || '<p class="muted">No alerts.</p>'}
     <p class="muted" style="font-size:.8rem">Alerts appear here and in the caregiver's Sehat app. Sending WhatsApp or SMS needs a messaging provider, which this prototype does not have yet.</p></div></div>`;
};

// ---------- Senior home ----------
// Every word on this screen, and every spoken line, comes from the elder's own voice language.
const ST = {
  hi: { hello: 'नमस्ते, {n} जी', slots: ['सुबह', 'दोपहर', 'रात'], meds: '{s} की दवाइयां', took: 'मैंने ले ली', done: 'आज {s} की दवा हो चुकी है', listen: 'सुनिए', none: 'इस समय कोई दवा नहीं है', ask_t: 'डॉक्टर साथी से बात करें', ask_s: 'बस बोलिए, हम सुन रहे हैं…', sos_t: 'मदद चाहिए / आपातकाल', sos_s: 'एक बार दबाएं: {cg} और 112 को कॉल, City Care को सूचना', rep_t: 'रिपोर्ट की फोटो → सुनिए', rep_s: 'फोटो लीजिए, डॉक्टर साथी पढ़कर सुनाएंगे।', reading: 'पढ़ रहे हैं…', fail: 'अभी पढ़ नहीं पाए। थोड़ी देर बाद फिर कोशिश करें।', alert: '{m} अभी तक नहीं ली गई, इसलिए {cg} को सूचना भेजी गई है।', std: 'सामान्य मोड', sending: 'मदद भेज रहे हैं…', cancel: 'रद्द करें', er: 'City Care ER को सूचना भेज दी गई', call112: '112 पर कॉल करें', callcg: '{cg} को कॉल करें', addnum: '{cg} का नंबर Settings में जोड़ें', ok: 'ठीक है', sp_time: '{n} जी, {s} की दवा का समय हो गया है: {m}।', sp_none: '{n} जी, अभी कोई दवा नहीं है।', sp_done: 'बहुत अच्छे। आज {s} की दवा हो गई।', sp_help: 'मदद आ रही है। घबराइए मत।', for: '{p} की', p: { bp: 'बीपी', sugar: 'शुगर', chol: 'कोलेस्ट्रॉल', stomach: 'पेट', fever: 'बुखार', allergy: 'एलर्जी' } },
  en: { hello: 'Hello, {n}', slots: ['Morning', 'Afternoon', 'Night'], meds: '{s} medicines', took: 'I have taken them', done: '{s} medicines done for today', listen: 'Listen', none: 'No medicines right now', ask_t: 'Talk to Dr. Saathi', ask_s: 'Just speak, we are listening…', sos_t: 'Need help / Emergency', sos_s: 'One tap: calls {cg} and 112, alerts City Care', rep_t: 'Photo of a report → listen', rep_s: 'Take a photo and Dr. Saathi reads it out to you.', reading: 'Reading…', fail: "Couldn't read it now. Please try again in a little while.", alert: '{m} has not been taken yet, so {cg} has been alerted.', std: 'Standard mode', sending: 'Sending help…', cancel: 'Cancel', er: 'City Care ER has been alerted', call112: 'Call 112', callcg: 'Call {cg}', addnum: "Add {cg}'s number in Settings", ok: 'OK', sp_time: '{n}, it is time for your {s} medicines: {m}.', sp_none: '{n}, there are no medicines right now.', sp_done: 'Well done. Your {s} medicines are done for today.', sp_help: 'Help is on the way. Please stay calm.', for: 'for {p}', p: { bp: 'BP', sugar: 'sugar', chol: 'cholesterol', stomach: 'stomach', fever: 'fever', allergy: 'allergy' } },
  pa: { hello: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, {n} ਜੀ', slots: ['ਸਵੇਰ', 'ਦੁਪਹਿਰ', 'ਰਾਤ'], meds: '{s} ਦੀਆਂ ਦਵਾਈਆਂ', took: 'ਮੈਂ ਲੈ ਲਈਆਂ', done: 'ਅੱਜ {s} ਦੀ ਦਵਾਈ ਹੋ ਗਈ ਹੈ', listen: 'ਸੁਣੋ', none: 'ਇਸ ਵੇਲੇ ਕੋਈ ਦਵਾਈ ਨਹੀਂ', ask_t: 'ਡਾਕਟਰ ਸਾਥੀ ਨਾਲ ਗੱਲ ਕਰੋ', ask_s: 'ਬੱਸ ਬੋਲੋ, ਅਸੀਂ ਸੁਣ ਰਹੇ ਹਾਂ…', sos_t: 'ਮਦਦ ਚਾਹੀਦੀ ਹੈ / ਐਮਰਜੈਂਸੀ', sos_s: 'ਇੱਕ ਵਾਰ ਦਬਾਓ: {cg} ਅਤੇ 112 ਨੂੰ ਕਾਲ, City Care ਨੂੰ ਸੂਚਨਾ', rep_t: 'ਰਿਪੋਰਟ ਦੀ ਫੋਟੋ → ਸੁਣੋ', rep_s: 'ਫੋਟੋ ਲਓ, ਡਾਕਟਰ ਸਾਥੀ ਪੜ੍ਹ ਕੇ ਸੁਣਾਉਣਗੇ।', reading: 'ਪੜ੍ਹ ਰਹੇ ਹਾਂ…', fail: 'ਹੁਣੇ ਪੜ੍ਹ ਨਹੀਂ ਸਕੇ। ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।', alert: '{m} ਅਜੇ ਨਹੀਂ ਲਈ ਗਈ, ਇਸ ਲਈ {cg} ਨੂੰ ਸੂਚਨਾ ਭੇਜੀ ਗਈ ਹੈ।', std: 'ਆਮ ਮੋਡ', sending: 'ਮਦਦ ਭੇਜ ਰਹੇ ਹਾਂ…', cancel: 'ਰੱਦ ਕਰੋ', er: 'City Care ER ਨੂੰ ਸੂਚਨਾ ਭੇਜ ਦਿੱਤੀ ਗਈ', call112: '112 ਤੇ ਕਾਲ ਕਰੋ', callcg: '{cg} ਨੂੰ ਕਾਲ ਕਰੋ', addnum: '{cg} ਦਾ ਨੰਬਰ Settings ਵਿੱਚ ਜੋੜੋ', ok: 'ਠੀਕ ਹੈ', sp_time: '{n} ਜੀ, {s} ਦੀ ਦਵਾਈ ਦਾ ਸਮਾਂ ਹੋ ਗਿਆ ਹੈ: {m}।', sp_none: '{n} ਜੀ, ਹੁਣ ਕੋਈ ਦਵਾਈ ਨਹੀਂ ਹੈ।', sp_done: 'ਬਹੁਤ ਵਧੀਆ। ਅੱਜ {s} ਦੀ ਦਵਾਈ ਹੋ ਗਈ।', sp_help: 'ਮਦਦ ਆ ਰਹੀ ਹੈ। ਘਬਰਾਓ ਨਾ।', for: '{p} ਲਈ', p: { bp: 'ਬੀਪੀ', sugar: 'ਸ਼ੂਗਰ', chol: 'ਕੋਲੈਸਟ੍ਰੋਲ', stomach: 'ਪੇਟ', fever: 'ਬੁਖ਼ਾਰ', allergy: 'ਐਲਰਜੀ' } },
  ta: { hello: 'வணக்கம், {n}', slots: ['காலை', 'மதியம்', 'இரவு'], meds: '{s} மருந்துகள்', took: 'நான் எடுத்துக்கொண்டேன்', done: 'இன்று {s} மருந்து எடுத்தாகிவிட்டது', listen: 'கேளுங்கள்', none: 'இப்போது மருந்து இல்லை', ask_t: 'டாக்டர் சாத்தியுடன் பேசுங்கள்', ask_s: 'பேசுங்கள், நாங்கள் கேட்கிறோம்…', sos_t: 'உதவி வேண்டும் / அவசரம்', sos_s: 'ஒருமுறை அழுத்தவும்: {cg} மற்றும் 112-க்கு அழைப்பு, City Care-க்கு தகவல்', rep_t: 'அறிக்கையின் புகைப்படம் → கேளுங்கள்', rep_s: 'புகைப்படம் எடுங்கள், டாக்டர் சாத்தி படித்துச் சொல்வார்.', reading: 'படிக்கிறது…', fail: 'இப்போது படிக்க முடியவில்லை. சிறிது நேரம் கழித்து முயற்சிக்கவும்.', alert: '{m} இன்னும் எடுக்கப்படவில்லை, எனவே {cg}-க்கு தகவல் அனுப்பப்பட்டது.', std: 'சாதாரண முறை', sending: 'உதவி அனுப்புகிறோம்…', cancel: 'ரத்து செய்', er: 'City Care அவசர பிரிவுக்கு தகவல் அனுப்பப்பட்டது', call112: '112-ஐ அழைக்கவும்', callcg: '{cg}-ஐ அழைக்கவும்', addnum: '{cg}-இன் எண்ணை Settings-இல் சேர்க்கவும்', ok: 'சரி', sp_time: '{n}, {s} மருந்து எடுக்கும் நேரம்: {m}.', sp_none: '{n}, இப்போது மருந்து இல்லை.', sp_done: 'நன்று. இன்று {s} மருந்து எடுத்தாகிவிட்டது.', sp_help: 'உதவி வருகிறது. பயப்பட வேண்டாம்.', for: '{p}-க்கு', p: { bp: 'இரத்த அழுத்தம்', sugar: 'சர்க்கரை', chol: 'கொலஸ்ட்ரால்', stomach: 'வயிறு', fever: 'காய்ச்சல்', allergy: 'ஒவ்வாமை' } },
  bn: { hello: 'নমস্কার, {n}', slots: ['সকাল', 'দুপুর', 'রাত'], meds: '{s}-এর ওষুধ', took: 'আমি খেয়ে নিয়েছি', done: 'আজ {s}-এর ওষুধ খাওয়া হয়ে গেছে', listen: 'শুনুন', none: 'এখন কোনো ওষুধ নেই', ask_t: 'ডাক্তার সাথীর সঙ্গে কথা বলুন', ask_s: 'শুধু বলুন, আমরা শুনছি…', sos_t: 'সাহায্য চাই / জরুরি', sos_s: 'একবার চাপুন: {cg} ও 112-এ কল, City Care-কে খবর', rep_t: 'রিপোর্টের ছবি → শুনুন', rep_s: 'ছবি তুলুন, ডাক্তার সাথী পড়ে শোনাবে।', reading: 'পড়ছি…', fail: 'এখন পড়া গেল না। একটু পরে আবার চেষ্টা করুন।', alert: '{m} এখনও খাওয়া হয়নি, তাই {cg}-কে জানানো হয়েছে।', std: 'সাধারণ মোড', sending: 'সাহায্য পাঠানো হচ্ছে…', cancel: 'বাতিল', er: 'City Care জরুরি বিভাগকে জানানো হয়েছে', call112: '112-এ কল করুন', callcg: '{cg}-কে কল করুন', addnum: 'Settings-এ {cg}-এর নম্বর যোগ করুন', ok: 'ঠিক আছে', sp_time: '{n}, {s}-এর ওষুধের সময় হয়েছে: {m}।', sp_none: '{n}, এখন কোনো ওষুধ নেই।', sp_done: 'খুব ভালো। আজ {s}-এর ওষুধ হয়ে গেছে।', sp_help: 'সাহায্য আসছে। ভয় পাবেন না।', for: '{p}-এর', p: { bp: 'প্রেশার', sugar: 'সুগার', chol: 'কোলেস্টেরল', stomach: 'পেট', fever: 'জ্বর', allergy: 'অ্যালার্জি' } },
  te: { hello: 'నమస్కారం, {n} గారు', slots: ['ఉదయం', 'మధ్యాహ్నం', 'రాత్రి'], meds: '{s} మందులు', took: 'నేను వేసుకున్నాను', done: 'ఈరోజు {s} మందులు అయిపోయాయి', listen: 'వినండి', none: 'ఇప్పుడు మందులు లేవు', ask_t: 'డాక్టర్ సాథితో మాట్లాడండి', ask_s: 'మాట్లాడండి, మేము వింటున్నాం…', sos_t: 'సహాయం కావాలి / అత్యవసరం', sos_s: 'ఒక్కసారి నొక్కండి: {cg} మరియు 112కి కాల్, City Careకి సమాచారం', rep_t: 'రిపోర్ట్ ఫోటో → వినండి', rep_s: 'ఫోటో తీయండి, డాక్టర్ సాథి చదివి వినిపిస్తారు.', reading: 'చదువుతున్నాం…', fail: 'ఇప్పుడు చదవలేకపోయాం. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.', alert: '{m} ఇంకా వేసుకోలేదు, అందుకే {cg}కి సమాచారం పంపాం.', std: 'సాధారణ మోడ్', sending: 'సహాయం పంపుతున్నాం…', cancel: 'రద్దు చేయండి', er: 'City Care అత్యవసర విభాగానికి సమాచారం పంపాం', call112: '112కి కాల్ చేయండి', callcg: '{cg}కి కాల్ చేయండి', addnum: 'Settingsలో {cg} నంబర్ జోడించండి', ok: 'సరే', sp_time: '{n} గారు, {s} మందుల సమయం అయింది: {m}.', sp_none: '{n} గారు, ఇప్పుడు మందులు లేవు.', sp_done: 'బాగుంది. ఈరోజు {s} మందులు అయిపోయాయి.', sp_help: 'సహాయం వస్తోంది. భయపడకండి.', for: '{p} కోసం', p: { bp: 'బీపీ', sugar: 'షుగర్', chol: 'కొలెస్ట్రాల్', stomach: 'కడుపు', fever: 'జ్వరం', allergy: 'అలర్జీ' } },
  mr: { hello: 'नमस्कार, {n}', slots: ['सकाळ', 'दुपार', 'रात्र'], meds: '{s}ची औषधे', took: 'मी घेतली', done: 'आज {s}ची औषधे घेऊन झाली', listen: 'ऐका', none: 'आत्ता कोणतेही औषध नाही', ask_t: 'डॉक्टर साथींशी बोला', ask_s: 'फक्त बोला, आम्ही ऐकत आहोत…', sos_t: 'मदत हवी / आपत्कालीन', sos_s: 'एकदा दाबा: {cg} आणि 112 ला कॉल, City Care ला सूचना', rep_t: 'रिपोर्टचा फोटो → ऐका', rep_s: 'फोटो काढा, डॉक्टर साथी वाचून दाखवतील.', reading: 'वाचत आहोत…', fail: 'आत्ता वाचता आले नाही. थोड्या वेळाने पुन्हा प्रयत्न करा.', alert: '{m} अजून घेतले नाही, म्हणून {cg} ला सूचना पाठवली आहे.', std: 'सामान्य मोड', sending: 'मदत पाठवत आहोत…', cancel: 'रद्द करा', er: 'City Care आपत्कालीन विभागाला सूचना पाठवली', call112: '112 ला कॉल करा', callcg: '{cg} ला कॉल करा', addnum: 'Settings मध्ये {cg} चा नंबर जोडा', ok: 'ठीक आहे', sp_time: '{n}, {s}च्या औषधांची वेळ झाली आहे: {m}.', sp_none: '{n}, आत्ता कोणतेही औषध नाही.', sp_done: 'छान. आज {s}ची औषधे झाली.', sp_help: 'मदत येत आहे. घाबरू नका.', for: '{p}साठी', p: { bp: 'बीपी', sugar: 'शुगर', chol: 'कोलेस्टेरॉल', stomach: 'पोट', fever: 'ताप', allergy: 'ऍलर्जी' } },
  gu: { hello: 'નમસ્તે, {n}', slots: ['સવાર', 'બપોર', 'રાત'], meds: '{s}ની દવાઓ', took: 'મેં લઈ લીધી', done: 'આજે {s}ની દવા થઈ ગઈ છે', listen: 'સાંભળો', none: 'અત્યારે કોઈ દવા નથી', ask_t: 'ડૉક્ટર સાથી સાથે વાત કરો', ask_s: 'બસ બોલો, અમે સાંભળીએ છીએ…', sos_t: 'મદદ જોઈએ / કટોકટી', sos_s: 'એક વાર દબાવો: {cg} અને 112ને કૉલ, City Careને જાણ', rep_t: 'રિપોર્ટનો ફોટો → સાંભળો', rep_s: 'ફોટો લો, ડૉક્ટર સાથી વાંચીને સંભળાવશે.', reading: 'વાંચી રહ્યા છીએ…', fail: 'હમણાં વાંચી ન શક્યા. થોડી વાર પછી ફરી પ્રયાસ કરો.', alert: '{m} હજુ લીધી નથી, તેથી {cg}ને જાણ કરવામાં આવી છે.', std: 'સામાન્ય મોડ', sending: 'મદદ મોકલી રહ્યા છીએ…', cancel: 'રદ કરો', er: 'City Care ઇમરજન્સીને જાણ કરી દીધી', call112: '112 પર કૉલ કરો', callcg: '{cg}ને કૉલ કરો', addnum: 'Settingsમાં {cg}નો નંબર ઉમેરો', ok: 'ઠીક છે', sp_time: '{n}, {s}ની દવાનો સમય થઈ ગયો છે: {m}.', sp_none: '{n}, અત્યારે કોઈ દવા નથી.', sp_done: 'સરસ. આજે {s}ની દવા થઈ ગઈ.', sp_help: 'મદદ આવી રહી છે. ગભરાશો નહીં.', for: '{p} માટે', p: { bp: 'બીપી', sugar: 'સુગર', chol: 'કોલેસ્ટ્રોલ', stomach: 'પેટ', fever: 'તાવ', allergy: 'એલર્જી' } },
};
// what each demo medicine is for (shown with its pill colour)
const PILLS = { 'Amlodipine 5mg': ['⚪', 'bp'], 'Metformin 500mg': ['⚪', 'sugar'], 'Atorvastatin 10mg': ['🔵', 'chol'], 'Pantoprazole 40mg': ['🟡', 'stomach'], 'Paracetamol 650mg': ['⚪', 'fever'], 'Cetirizine 10mg': ['🟢', 'allergy'] };
const SLOTS = [['morning', '🌅', 0, 12], ['afternoon', '☀️', 12, 17], ['night', '🌙', 17, 24]];
const slotOf = t => SLOTS.find(s => +t.slice(0, 2) >= s[2] && +t.slice(0, 2) < s[3]) || SLOTS[0];
const vl = n => ST[pOf(n).vlang] ? pOf(n).vlang : 'hi';
const tr = (n, k, v = {}) => { const s = (ST[vl(n)][k] ?? ST.en[k]); return typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '') : s; };
const slotName = (n, key) => ST[vl(n)].slots[SLOTS.findIndex(s => s[0] === key)];
const pillTxt = (n, r) => { const p = PILLS[r.med]; return p ? `${r.med.split(' ')[0]} · ${tr(n, 'for', { p: ST[vl(n)].p[p[1]] })}` : r.med; };
let sosT = null;
function seniorHome() {
  const n = seniorAs(), first = n.split(' ')[0], p = pOf(n), hr = new Date().getHours(), cur = SLOTS.find(s => hr >= s[2] && hr < s[3]);
  const mine = medsFor(n), slot = [cur, ...SLOTS].find(s => mine.some(r => slotOf(r.time) === s)) || cur, due = mine.filter(r => slotOf(r.time) === slot);
  const done = due.length && due.every(r => r.taken.includes(today())), cg = p.cgName || Store.db.family[0].name.split(' ')[0];
  const alert = (Store.db.alerts || []).find(a => a.who === n && a.day === today()), m = Store.db.family.find(f => f.name === n) || {};
  const state = s => { const L = mine.filter(r => slotOf(r.time) === s); return !L.length ? '' : L.every(r => r.taken.includes(today())) ? 'ok' : s === cur ? 'due' : ''; };
  return `<style>
   .sr{font-size:19px;max-width:980px}.sr .hd{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:18px}.sr .av{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;font-size:34px;background:var(--teal-tint)}
   .sr h1{font-size:2.1rem;margin:2px 0 0}.sr .hd select{width:auto;font-size:1rem;padding:10px 14px;border-radius:999px}
   .sr .g{display:grid;grid-template-columns:1fr 1fr;gap:16px}.sr .full{grid-column:1/-1}
   .sr .big{display:block;width:100%;text-align:left;border-radius:26px;padding:22px 24px;border:2px solid var(--line);background:var(--card-solid);color:var(--ink);font:inherit;cursor:pointer;box-shadow:var(--shadow);transition:transform .2s,box-shadow .2s}
   .sr button.big:hover,.sr label.big:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg)}.sr .big h2{font-size:1.5rem;margin:0 0 6px;display:flex;gap:10px;align-items:center}.sr .big p{margin:0;color:var(--muted);font-size:1.05rem}
   .sr .ok{background:#ECFDF5;border-color:#059669}.sr .sos{background:#FEF2F2;border-color:#DC2626}.sr .sos h2{color:#B91C1C}.sr .ask{background:linear-gradient(135deg,#EAF3FE,#fff);border-color:#8EBEF9}
   .sr .slots{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}.sr .slots span{padding:6px 14px;border-radius:999px;border:1px solid var(--line);font-size:.95rem;background:var(--card-solid)}.sr .slots .ok{border-color:#059669;color:#047857}.sr .slots .due{border-color:#D97706;color:#B45309;font-weight:700}
   .sr .pills{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 4px}.sr .pl{padding:10px 16px;border-radius:16px;background:var(--teal-tint);font-size:1.1rem;font-weight:600}.sr .pl small{display:block;font-weight:400;color:var(--muted);font-size:.85rem}
   .sr .acts{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:14px}.sr .tk{padding:16px 30px;border-radius:999px;background:#059669;color:#fff;font-weight:800;font-size:1.3rem;border:0;cursor:pointer;box-shadow:0 12px 26px -12px rgba(5,150,105,.8)}
   .sr .lis{padding:14px 22px;border-radius:999px;border:2px solid var(--line);background:var(--card-solid);font-size:1.1rem;cursor:pointer;color:var(--ink)}
   .sr .donel{color:#047857;font-weight:800;font-size:1.2rem;margin-top:10px}
   :root[data-theme="dark"] .sr .ok{background:rgba(5,150,105,.15)}:root[data-theme="dark"] .sr .sos{background:rgba(220,38,38,.15)}:root[data-theme="dark"] .sr .ask{background:var(--teal-tint)}
   @media(max-width:720px){.sr .g{grid-template-columns:1fr}.sr h1{font-size:1.7rem}}
   .sosx{position:fixed;inset:0;z-index:99;background:rgba(127,29,29,.94);color:#fff;display:grid;place-items:center;text-align:center;font-size:22px;padding:20px}.sosx b{font-size:5rem;display:block}.sosx a{color:#fff}.sosx button{margin-top:18px;font-size:1.2rem;padding:16px 30px;border-radius:999px;border:2px solid #fff;background:transparent;color:#fff;cursor:pointer}</style>
  <div class="sr"><div class="hd"><span class="av">${m.age > 55 ? '👵' : '🧑'}</span><div><span class="eyebrow">👵 Senior Mode</span><h1>${esc(tr(n, 'hello', { n: first }))}</h1></div><span class="sp"></span>
    <select aria-label="Language" onchange="setP('${esc(n)}','vlang',this.value)">${VLANGS.map(([k, l]) => `<option value="${k}" ${vl(n) === k ? 'selected' : ''}>🔊 ${l}</option>`).join('')}</select>
    <button class="btn sm ghost" onclick="useSenior('${esc(n)}', false);render()">${esc(tr(n, 'std'))}</button></div>
   ${alert ? `<div class="ai">🔔 ${esc(tr(n, 'alert', { m: alert.med.split(' ')[0], cg: alert.to }))}</div>` : ''}
   <div class="g"><div class="big full ${done ? 'ok' : ''}">
     <div class="slots">${SLOTS.map(s => `<span class="${state(s)}">${s[1]} ${slotName(n, s[0])}${state(s) === 'ok' ? ' ✓' : ''}</span>`).join('')}</div>
     <h2>${slot[1]} ${esc(tr(n, 'meds', { s: slotName(n, slot[0]) }))}</h2>
     ${due.length ? `<div class="pills">${due.map(r => `<span class="pl">${(PILLS[r.med] || ['💊'])[0]} ${esc(pillTxt(n, r))}<small>${r.time}</small></span>`).join('')}</div>` : `<p>${esc(tr(n, 'none'))}</p>`}
     <div class="acts">${due.length ? (done ? `<span class="donel">✅ ${esc(tr(n, 'done', { s: slotName(n, slot[0]) }))}</span>` : `<button class="tk" onclick="srTake('${slot[0]}')">✅ ${esc(tr(n, 'took'))}</button>`) : ''}<button class="lis" onclick="srSpeak('${slot[0]}')">🔊 ${esc(tr(n, 'listen'))}</button></div></div>
    <button class="big ask" onclick="srAsk()"><h2>🎙️ ${esc(tr(n, 'ask_t'))}</h2><p>"${esc(tr(n, 'ask_s'))}"</p></button>
    <button class="big sos" onclick="srSOS()"><h2>🆘 ${esc(tr(n, 'sos_t'))}</h2><p>${esc(tr(n, 'sos_s', { cg }))}</p></button>
    <label class="big full" style="cursor:pointer"><h2>📄 ${esc(tr(n, 'rep_t'))}</h2><p id="srRep">${esc(tr(n, 'rep_s'))}</p><input type="file" accept="image/*,application/pdf" style="display:none" onchange="srReport(this.files[0])"></label></div></div>`;
}
function srTake(slot) {
  const n = seniorAs(); act(`${n} took the ${slot} medicines`, d => d.reminders.forEach(r => { if (r.who === n && slotOf(r.time)[0] === slot && !r.taken.includes(today())) r.taken.push(today()); }));
  say(tr(n, 'sp_done', { s: slotName(n, slot) }), n);
}
function srSpeak(slot) {
  const n = seniorAs(), first = n.split(' ')[0], due = medsFor(n).filter(r => slotOf(r.time)[0] === slot);
  say(due.length ? tr(n, 'sp_time', { n: first, s: slotName(n, slot), m: due.map(r => pillTxt(n, r)).join(', ') }) : tr(n, 'sp_none', { n: first }), n);
}
function srAsk() { const f = document.querySelector('.sx-fab'); if (f) { f.click(); setTimeout(() => document.getElementById('sxMic')?.click(), 400); } else toast('Dr. Saathi is loading…'); }
function srSOS() {
  const n = seniorAs(); let s = 3; const o = document.createElement('div'); o.className = 'sosx';
  o.innerHTML = `<div>${esc(tr(n, 'sending'))}<b id="sosN">3</b><button onclick="srCancel()">${esc(tr(n, 'cancel'))}</button></div>`; document.body.appendChild(o);
  sosT = setInterval(() => { s--; const e = document.getElementById('sosN'); if (e) e.textContent = s; if (s <= 0) { clearInterval(sosT); o.remove(); srSend(n); } }, 1000);
}
function srCancel() { clearInterval(sosT); document.querySelector('.sosx')?.remove(); toast('Cancelled'); }
function srSend(n) {
  const p = pOf(n), cg = p.cgName || Store.db.family[0].name.split(' ')[0], m = Store.db.family.find(f => f.name === n) || {};
  act(`🆘 SOS from ${n} · City Care ER alerted`, d => { d.sos = d.sos || []; d.sos.unshift({ who: n, t: Date.now(), age: m.age, cond: m.cond, meds: [...new Set(d.reminders.filter(r => r.who === n).map(r => r.med))], to: 'City Care Hospital', ack: false }); }, ['patient', 'hospital'], ['City Care Hospital']);
  const o = document.createElement('div'); o.className = 'sosx';
  o.innerHTML = `<div>✅ ${esc(tr(n, 'er'))}<br><br><a href="tel:112" style="font-size:2rem;font-weight:800">📞 ${esc(tr(n, 'call112'))}</a><br><br>${p.cgPhone ? `<a href="tel:${esc(p.cgPhone)}" style="font-size:1.6rem">📞 ${esc(tr(n, 'callcg', { cg }))}</a>` : `<span style="font-size:1rem">${esc(tr(n, 'addnum', { cg }))}</span>`}<br><button onclick="this.closest('.sosx').remove()">${esc(tr(n, 'ok'))}</button></div>`;
  document.body.appendChild(o); say(tr(n, 'sp_help'), n);
}
async function srReport(f) {
  if (!f) return; const n = seniorAs(), lang = vl(n), out = document.getElementById('srRep');
  out.textContent = tr(n, 'reading');
  try {
    const { mime, data } = await fileToData(f), rec = (await postJSON('/api/extract', { filename: f.name, mime, data, lang })).record;
    const x = (await postJSON('/api/explain', { record: rec, lang })).explanation || {};
    out.textContent = x.summary || '✓'; say(x.summary || '', n);
  } catch (e) { out.textContent = tr(n, 'fail'); }
}

// a dose still not taken 45 minutes after its time alerts the caregiver once that day
function srWatch() {
  const n = seniorAs(); if (!n || !pOf(n).senior) return; const now = new Date(), cg = pOf(n).cgName || Store.db.family[0].name.split(' ')[0];
  medsFor(n).forEach(r => { const [h, m] = r.time.split(':').map(Number), due = new Date(); due.setHours(h, m + 45, 0, 0);
    if (now > due && !r.taken.includes(today()) && !(Store.db.alerts || []).some(a => a.who === n && a.med === r.med && a.day === today()))
      act(`🔔 alerted ${cg}: ${n} has not logged ${r.med}`, d => { d.alerts = d.alerts || []; d.alerts.unshift({ who: n, med: r.med, slot: slotOf(r.time)[0], to: cg, day: today(), t: Date.now() }); }); });
}

// ---------- hook into the patient suite, the doctor's consult and City Care's command centre ----------
const baseCopilot = V.sehat_copilot, baseCopilotAfter = V.sehat_copilot.after;
V.sehat_copilot = () => {
  if (seniorOn()) return seniorHome();
  const al = (Store.db.alerts || []).filter(a => a.day === today()), so = (Store.db.sos || []).filter(s => Date.now() - s.t < 864e5 && Store.db.family.some(f => f.name === s.who));
  return (so.length ? `<div class="ai" style="border-color:#DC2626">🆘 <b>SOS from ${esc(so[0].who)}</b> ${ago(so[0].t)} · City Care ER alerted</div>` : '') +
    (al.length ? `<div class="ai">🔔 <b>Caregiver alert:</b> ${al.map(a => `${esc(a.who)} has not logged ${esc(a.med)}`).join('; ')}</div>` : '') + baseCopilot();
};
V.sehat_copilot.after = () => { if (seniorOn()) { setTimeout(srWatch, 300); return; } baseCopilotAfter && baseCopilotAfter(); };
const baseConsult = V.consult;
V.consult = () => baseConsult().replace('<button class="btn" style="margin-top:10px" onclick="csSave()">',
  '<label style="display:flex;gap:8px;margin:10px 0 0;color:var(--txt)"><input type="checkbox" id="cs_senior" style="width:auto"> 👵 Enable Senior Mode &amp; voice reminders for this patient</label><button class="btn" style="margin-top:10px" onclick="csSave()">');
const baseCsSave = csSave;
csSave = function () { const p = $('#cs_p')?.value, on = $('#cs_senior')?.checked; if (p && on) act(`turned on Senior Mode for ${p}`, d => { d.prefs = d.prefs || {}; d.prefs[p] = { ...(d.prefs[p] || {}), senior: true }; }); baseCsSave(); };
const baseCommand = V.command;
V.command = () => { const so = (Store.db.sos || []).filter(s => !s.ack && (s.to === R.org || role !== 'hospital')).slice(0, 3);
  return so.map((s, i) => `<div class="ai" style="border-color:#DC2626"><span style="font-size:24px">🆘</span><div style="flex:1"><b>SOS · ${esc(s.who)}</b>${s.age ? ', ' + s.age + ' y' : ''} · ${ago(s.t)}<br><span class="muted">${esc(s.cond || '')}${s.meds.length ? ' · on ' + esc(s.meds.join(', ')) : ''}</span></div><button class="btn sm red" onclick="act('acknowledged the SOS from ${esc(s.who)}',d=>{const x=d.sos.find(y=>y.t===${s.t});if(x)x.ack=true})">Ambulance sent ✓</button></div>`).join('') + baseCommand(); };
render();
