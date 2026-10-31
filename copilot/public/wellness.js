'use strict';
/* ================= Views split out of "My health", Wellness graphs, steps and reading guidance =================
   Loaded after app.js / reminders.js / journal.js. app.js calls viewMeds / viewVisits / viewJournal /
   viewWellness / viewFamily from render(), hubTiles() from viewHealth(), and SehatWell.* from wellnessCard().
   Not a diagnosis tool: the guidance below is first-aid style advice only, never names a medicine or a dose. */

/* ---- thresholds that trigger the "what to do now" guidance (mmHg and mg/dL) ---- */
const WL_BP_LOW_UP = 90, WL_BP_LOW_LO = 60;      // low blood pressure: upper < 90 or lower < 60
const WL_BP_HIGH_UP = 180, WL_BP_HIGH_LO = 120;  // very high blood pressure: 180/120 or more
const WL_SUGAR_LOW = 70, WL_SUGAR_HIGH = 300;    // low sugar: < 70, "very high" at 300 or more (with a high reading)
/* Sugar tiers follow the American Diabetes Association (ADA) diagnostic cut-offs in mg/dL, as [borderline from, high from]:
   fasting <100 normal, 100-125 borderline (prediabetes range), >=126 high (diabetes range);
   after a meal (2 h) and random: <140 normal, 140-199 borderline, >=200 high. Shown as a guide only, never as a diagnosis. */
const WL_ADA = { sugar_fasting: [100, 126], sugar_pp: [140, 200], sugar_random: [140, 200] };
const WL_SYM_VERY_HIGH = 2;                       // 2 or more ticked symptoms turn a high reading into "very high"
const WL_RECHECK_TIME = '08:00';
/* usual adult ranges drawn as the dashed band on the graphs (a general guide, not a personal target) */
const WL_USUAL = { bp_up: [90, 120], bp_lo: [60, 80], sugar_fasting: [70, 100], sugar_pp: [70, 140], sugar_random: [70, 140], pulse: [60, 100] };

Object.assign(STR.en, {
  nav_meds: 'Medicines', nav_visits: 'Visits', nav_journal: 'Journal', nav_wellness: 'Wellness', nav_family: 'Family', nav_more: 'More',
  meds_sub: 'Today\'s doses, the medicines found in your records, and what to ask your pharmacist.',
  visits_sub: 'Doctor visits, follow-ups and reminders.', journal_sub: 'How you feel each day, and a summary to show your doctor.',
  wellness_sub: 'Home readings, steps and everyday habits.', family_sub: 'Everyone whose records are kept on this device.',
  hub_meds_n: '{x} of {y} taken today', hub_meds_rec: '{n} recorded', hub_meds_none: 'No medicines yet', hub_visits: 'Appointments and reminders', hub_journal: 'Log how you feel today',
  hub_wellness: 'Readings, graphs and steps', visit_card_t: 'Preparing for a visit?', visit_card_p: 'Make a one-page summary of your records to show your doctor.',
  pet_tip_meds: 'Tick each dose as you take it. Confirm which medicines you really take.', pet_tip_visits: 'Your appointments and follow-ups are here.',
  pet_tip_journal: 'A few taps a day. The summary helps you tell your doctor what changed.', pet_tip_wellness: 'Log blood pressure, sugar, weight and steps and see them on a graph.',
  pet_tip_family: 'One card for each person whose records you keep here.',
  /* wellness graphs */
  wl_graph: 'Home readings over time', wl_7: '7 days', wl_30: '30 days', wl_nodata: 'No home readings in the last {n} days. Add one in the log.',
  wl_usual: 'Dashed band: the usual adult range, a general guide and not your personal target.', wl_upper: 'Upper', wl_lower: 'Lower', wl_range: 'Usual: {a} to {b}',
  wl_foryou: 'For you: everyday habits', wl_period: 'Show', wl_pt: '{d}: {v} {u}',
  /* steps */
  st_title: 'Daily steps', st_date: 'Date', st_count: 'Steps', st_add: 'Save steps', st_note: 'Phone step counters and Google Fit can\'t be read by a website, so enter your steps here.',
  st_err_date: 'Please pick a date that is not in the future.', st_err_num: 'Steps must be a whole number from 0 to 100000.', st_empty: 'No steps entered for these days yet.',
  st_avg: 'Average {n} steps a day (on days entered)', st_total: 'Total {n} steps', st_del: 'Remove', st_saved: 'Steps saved.', st_list: 'Entered steps ({n})', st_unit: 'steps',
  /* guidance */
  g_low_bp_t: 'This blood pressure is on the low side', g_low_bp: 'Sit or lie down and raise your legs; drink a glass of water; stand up slowly.',
  g_low_sugar_t: 'This sugar reading is low', g_low_sugar: 'Take 15 g of fast-acting sugar (half a glass of juice or 3 teaspoons of sugar in water), recheck in 15 minutes, repeat if still low, then eat a snack.',
  g_high_bp_t: 'This blood pressure is very high', g_high_bp: 'Rest for 5 minutes and measure again; if it stays this high, contact a doctor today.',
  g_high_sugar_t: 'This sugar reading is very high', g_high_sugar: 'Drink water and check again; contact your doctor today, especially if you feel unwell.',
  g_doctor: 'Please consult your doctor about this reading.', g_112: 'Call 112 now if you have fainting, chest pain, breathlessness, confusion or one-sided weakness.',
  g_saved_h: 'Reading saved. What to do now'
});
Object.assign(STR.hi, {
  nav_meds: 'दवाइयाँ', nav_visits: 'मुलाक़ातें', nav_journal: 'डायरी', nav_wellness: 'तंदुरुस्ती', nav_family: 'परिवार', nav_more: 'और',
  meds_sub: 'आज की खुराकें, आपके रिकॉर्ड में मिली दवाइयाँ, और केमिस्ट से क्या पूछें।',
  visits_sub: 'डॉक्टर से मुलाक़ातें, फ़ॉलो-अप और याद दिलाने वाले संदेश।', journal_sub: 'हर दिन आप कैसा महसूस करते हैं, और डॉक्टर को दिखाने के लिए सारांश।',
  wellness_sub: 'घर पर लिए गए माप, क़दम और रोज़ की अच्छी आदतें।', family_sub: 'वे सभी लोग जिनके रिकॉर्ड इस डिवाइस पर रखे हैं।',
  hub_meds_n: 'आज {y} में से {x} ली गईं', hub_meds_rec: '{n} दर्ज', hub_meds_none: 'अभी कोई दवा नहीं', hub_visits: 'अपॉइंटमेंट और याद दिलाना', hub_journal: 'आज कैसा लग रहा है, दर्ज करें',
  hub_wellness: 'माप, ग्राफ़ और क़दम', visit_card_t: 'डॉक्टर से मिलने जा रहे हैं?', visit_card_p: 'डॉक्टर को दिखाने के लिए अपने रिकॉर्ड का एक पन्ने का सारांश बनाएँ।',
  pet_tip_meds: 'हर खुराक लेने पर टिक करें। पक्का करें कि आप कौन-सी दवाइयाँ सच में ले रहे हैं।', pet_tip_visits: 'आपके अपॉइंटमेंट और फ़ॉलो-अप यहाँ हैं।',
  pet_tip_journal: 'दिन में बस कुछ टैप। सारांश से डॉक्टर को बताना आसान होता है कि क्या बदला।', pet_tip_wellness: 'ब्लड प्रेशर, शुगर, वज़न और क़दम दर्ज करें और ग्राफ़ में देखें।',
  pet_tip_family: 'जिन लोगों के रिकॉर्ड आप यहाँ रखते हैं, हर एक के लिए एक कार्ड।',
  wl_graph: 'घर पर लिए माप, समय के साथ', wl_7: '7 दिन', wl_30: '30 दिन', wl_nodata: 'पिछले {n} दिनों में घर का कोई माप नहीं है। डायरी में एक जोड़ें।',
  wl_usual: 'धारीदार पट्टी: वयस्कों की आम सीमा। यह सिर्फ़ एक सामान्य अंदाज़ा है, आपका अपना लक्ष्य नहीं।', wl_upper: 'ऊपरी', wl_lower: 'निचला', wl_range: 'आम तौर पर: {a} से {b}',
  wl_foryou: 'आपके लिए: रोज़ की अच्छी आदतें', wl_period: 'दिखाएँ', wl_pt: '{d}: {v} {u}',
  st_title: 'रोज़ के क़दम', st_date: 'तारीख़', st_count: 'क़दम', st_add: 'क़दम सहेजें', st_note: 'फ़ोन का स्टेप काउंटर और Google Fit को कोई वेबसाइट नहीं पढ़ सकती, इसलिए अपने क़दम यहाँ खुद लिखें।',
  st_err_date: 'कृपया आज या उससे पहले की तारीख़ चुनें।', st_err_num: 'क़दम 0 से 100000 के बीच की पूरी संख्या होनी चाहिए।', st_empty: 'इन दिनों के लिए अभी कोई क़दम दर्ज नहीं हैं।',
  st_avg: 'औसत {n} क़दम रोज़ (दर्ज किए गए दिनों में)', st_total: 'कुल {n} क़दम', st_del: 'हटाएँ', st_saved: 'क़दम सहेज लिए गए।', st_list: 'दर्ज क़दम ({n})', st_unit: 'क़दम',
  g_low_bp_t: 'यह ब्लड प्रेशर कम है', g_low_bp: 'बैठ जाएँ या लेट जाएँ और पैर ऊपर उठाएँ; एक गिलास पानी पिएँ; धीरे-धीरे खड़े हों।',
  g_low_sugar_t: 'यह शुगर का माप कम है', g_low_sugar: '15 ग्राम तेज़ असर वाली चीनी लें (आधा गिलास जूस या पानी में 3 चम्मच चीनी), 15 मिनट बाद फिर जाँचें, अब भी कम हो तो दोहराएँ, फिर कुछ खा लें।',
  g_high_bp_t: 'यह ब्लड प्रेशर बहुत ऊँचा है', g_high_bp: '5 मिनट आराम करें और फिर से नापें; अगर इतना ही ऊँचा रहे तो आज ही डॉक्टर से संपर्क करें।',
  g_high_sugar_t: 'यह शुगर का माप बहुत ऊँचा है', g_high_sugar: 'पानी पिएँ और फिर से जाँचें; आज ही अपने डॉक्टर से संपर्क करें, ख़ासकर अगर तबीयत ठीक न लग रही हो।',
  g_doctor: 'कृपया इस माप के बारे में अपने डॉक्टर से सलाह लें।', g_112: 'बेहोशी, सीने में दर्द, साँस फूलना, भ्रम या शरीर के एक तरफ़ कमज़ोरी हो तो अभी 112 पर कॉल करें।',
  g_saved_h: 'माप सहेजा गया। अब क्या करें'
});

Object.assign(STR.en, {
  sg_sym: 'Any of these today? (optional)', sg_sym_thirst: 'Thirsty or urinating often', sg_sym_tired: 'Unusually tired or weak', sg_sym_blur: 'Blurred vision or dizziness',
  sg_badge_low: 'Low', sg_badge_normal: 'Normal', sg_badge_border: 'Borderline', sg_badge_high: 'High', sg_badge_vhigh: 'Very high',
  sg_t_normal: 'In the usual range', sg_t_border: 'A little above the usual range', sg_t_high: 'High, please talk to your doctor', sg_t_vhigh: 'Very high, contact a doctor today',
  sg_n_normal: 'This is in the usual range for this kind of test. The lower the number within the normal range, the better.',
  sg_n_border: 'This is above the usual range but not very high. One reading is not a diagnosis; discuss it with your doctor, especially if it keeps showing up.',
  sg_n_high: 'This is above the usual range. Please discuss it with your doctor soon and take your readings along. This is not a diagnosis.',
  sg_n_vhigh: 'This is well above the usual range, or it comes with symptoms. Drink water, rest, and contact a doctor today. Do not wait for it to settle on its own.',
  sg_rng_fasting: 'Fasting sugar: good below {a}, borderline {a} to {b}, high {c} or above. Your reading: {v} mg/dL.',
  sg_rng_pp: 'Sugar after a meal: good below {a}, borderline {a} to {b}, high {c} or above. Your reading: {v} mg/dL.',
  sg_rng_random: 'Random sugar: good below {a}, borderline {a} to {b}, high {c} or above. Your reading: {v} mg/dL.',
  sg_rng_low: 'Low sugar is below {a} mg/dL. Your reading: {v} mg/dL.',
  sg_rem1: 'Remind me to recheck in 1 day', sg_rem2: 'Remind me to recheck in 2 days', sg_ask: 'Ask Saathi about this',
  sg_rem_set: 'Recheck reminder set for {date}, 8:00 AM', sg_rem_see: 'See it in Visits', sg_rem_title: 'Recheck blood sugar', sg_rem_note: 'Last reading: {type} {v} mg/dL on {d}.',
  sg_q: 'My {type} was {v} mg/dL {when}. What does that mean?', sg_qt_fasting: 'fasting sugar', sg_qt_pp: 'sugar after a meal', sg_qt_random: 'random sugar', sg_today: 'today', sg_on: 'on {d}',
  sg_guide_show: 'Show full sugar guide', sg_guide_hide: 'Hide full sugar guide',
  sg_tbl_fasting: 'Fasting (no food for 8 hours)', sg_tbl_pp: 'After a meal (2 hours)', sg_tbl_random: 'Random (any time)',
  sg_c_good: 'Good', sg_c_border: 'Borderline', sg_c_high: 'High, see a doctor', sg_below: 'below {a}', sg_between: '{a} to {b}', sg_above: '{c} or above',
  sg_lower_better: 'The lower the number within the normal range, the better; under 100 fasting is the goal.',
  sg_urgent: 'Get help right away if sugar is around 300 or above, or the person feels very weak or confused, is vomiting, or has trouble breathing. Call 112.',
  sg_foot: 'This supports conversations with your doctor. It is not a diagnosis. Targets may differ in pregnancy or for specific conditions.'
});

Object.assign(STR.hi, {
  sg_sym: 'आज इनमें से कुछ हुआ? (वैकल्पिक)', sg_sym_thirst: 'बहुत प्यास या बार-बार पेशाब', sg_sym_tired: 'असामान्य थकान या कमज़ोरी', sg_sym_blur: 'धुंधला दिखना या चक्कर',
  sg_badge_low: 'कम', sg_badge_normal: 'सामान्य', sg_badge_border: 'सीमा पर', sg_badge_high: 'ज़्यादा', sg_badge_vhigh: 'बहुत ज़्यादा',
  sg_t_normal: 'आम सीमा में', sg_t_border: 'आम सीमा से थोड़ा ऊपर', sg_t_high: 'ज़्यादा है, कृपया डॉक्टर से बात करें', sg_t_vhigh: 'बहुत ज़्यादा है, आज ही डॉक्टर से संपर्क करें',
  sg_n_normal: 'इस तरह की जाँच के लिए यह आम सीमा में है। सामान्य सीमा के अंदर संख्या जितनी कम, उतना अच्छा।',
  sg_n_border: 'यह आम सीमा से ऊपर है पर बहुत ज़्यादा नहीं। एक माप निदान नहीं है; डॉक्टर से बात करें, ख़ासकर अगर ऐसा बार-बार आए।',
  sg_n_high: 'यह आम सीमा से ऊपर है। कृपया जल्द अपने डॉक्टर से बात करें और अपने माप साथ ले जाएँ। यह निदान नहीं है।',
  sg_n_vhigh: 'यह आम सीमा से काफ़ी ऊपर है, या साथ में लक्षण हैं। पानी पिएँ, आराम करें और आज ही डॉक्टर से संपर्क करें। अपने आप ठीक होने का इंतज़ार न करें।',
  sg_rng_fasting: 'खाली पेट शुगर: {a} से कम अच्छा, {a} से {b} सीमा पर, {c} या ऊपर ज़्यादा। आपका माप: {v} mg/dL।',
  sg_rng_pp: 'खाने के बाद शुगर: {a} से कम अच्छा, {a} से {b} सीमा पर, {c} या ऊपर ज़्यादा। आपका माप: {v} mg/dL।',
  sg_rng_random: 'किसी भी समय की शुगर: {a} से कम अच्छा, {a} से {b} सीमा पर, {c} या ऊपर ज़्यादा। आपका माप: {v} mg/dL।',
  sg_rng_low: 'शुगर {a} mg/dL से कम हो तो कम मानी जाती है। आपका माप: {v} mg/dL।',
  sg_rem1: '1 दिन बाद दोबारा जाँचने की याद दिलाएँ', sg_rem2: '2 दिन बाद दोबारा जाँचने की याद दिलाएँ', sg_ask: 'साथी से इस बारे में पूछें',
  sg_rem_set: '{date} को सुबह 8:00 बजे दोबारा जाँच का रिमाइंडर लगा दिया गया', sg_rem_see: 'मुलाक़ातें में देखें', sg_rem_title: 'शुगर दोबारा जाँचें', sg_rem_note: 'पिछला माप: {type} {v} mg/dL, {d}।',
  sg_q: '{when} मेरी {type} {v} mg/dL थी। इसका क्या मतलब है?', sg_qt_fasting: 'खाली पेट शुगर', sg_qt_pp: 'खाने के बाद की शुगर', sg_qt_random: 'किसी भी समय की शुगर', sg_today: 'आज', sg_on: '{d} को',
  sg_guide_show: 'पूरी शुगर गाइड दिखाएँ', sg_guide_hide: 'शुगर गाइड छिपाएँ',
  sg_tbl_fasting: 'खाली पेट (8 घंटे कुछ नहीं खाया)', sg_tbl_pp: 'खाने के बाद (2 घंटे)', sg_tbl_random: 'किसी भी समय',
  sg_c_good: 'अच्छा', sg_c_border: 'सीमा पर', sg_c_high: 'ज़्यादा, डॉक्टर को दिखाएँ', sg_below: '{a} से कम', sg_between: '{a} से {b}', sg_above: '{c} या ऊपर',
  sg_lower_better: 'सामान्य सीमा के अंदर संख्या जितनी कम, उतना अच्छा; खाली पेट 100 से कम लक्ष्य है।',
  sg_urgent: 'अगर शुगर लगभग 300 या उससे ऊपर हो, या व्यक्ति बहुत कमज़ोर या भ्रमित हो, उल्टी हो रही हो, या साँस लेने में तकलीफ़ हो तो तुरंत मदद लें। 112 पर कॉल करें।',
  sg_foot: 'यह डॉक्टर से बातचीत में मदद के लिए है। यह निदान नहीं है। गर्भावस्था या किसी ख़ास स्थिति में लक्ष्य अलग हो सकते हैं।'
});

Object.assign(STR.en, {
  wl_90: '90 days', wl_365: '1 year', wl_noperiod: 'No data in this period', wl_agg_w: 'Each point is a weekly average.', wl_agg_m: 'Each point is a monthly average.',
  wl_wk: 'Week of {d}', wl_own: 'From your log',
  jt_title: 'How you\'ve been', jt_sub: 'From your journal entries. Averages are for the period shown.', jt_none: 'No journal entries in this period. Add a few days above.',
  jt_avg_sleep: 'Average sleep {a} / 5', jt_avg_mood: 'Average mood {a} / 5', jt_avg_energy: 'Average energy {a} / 5', jt_avg_pain: 'Average pain {a} / 10',
  jt_meds: 'Medicines', jt_taken: 'Taken', jt_missed: 'Missed', jt_unsure: 'Not sure', jt_meds_sum: 'Taken {a}, missed {b}, not sure {c}',
  wd_sleep_tip: 'Try a regular bedtime, a dark and quiet room, and keeping screens away for the last hour before bed.',
  wd_sleep_why: 'Your sleep has averaged {a} / 5 over the last 30 days ({n} entries).',
  wd_steps_tip: 'Short walks add up. Try an extra 10 minutes after a meal and build up slowly.',
  wd_steps_why: 'Your steps averaged {a} a day over the last 30 days ({n} days entered).',
  wd_bp_tip: 'Going easy on salt (pickles, papad, packaged snacks), staying active and keeping a regular routine can help. Take your readings along to your doctor.',
  wd_bp_why: 'Your home blood pressure averaged {a} over the last 30 days ({n} readings).',
  wd_sugar_tip: 'Choosing whole grains and vegetables, and fewer sweet drinks and sweets, may help. Share these readings with your doctor.',
  wd_sugar_why: 'Your fasting sugar averaged {a} mg/dL over the last 30 days ({n} readings).',
  wd_energy_tip: 'Drink water through the day, keep regular meal times and take short rests. If tiredness stays, mention it to your doctor.',
  wd_energy_why: 'Your energy has averaged {a} / 5 over the last 30 days ({n} entries).',
  wd_pain_tip: 'Pain that keeps coming back is worth mentioning to your doctor. Note when it happens and what you were doing.',
  wd_pain_why: 'You noted pain of 6 or more on {n} days in the last 30 days.',
  wd_missed_tip: 'A phone alarm or a pill box can help you remember. If the timing is hard for you, ask your doctor whether it can be changed.',
  wd_missed_why: 'You marked your medicines as missed on {n} days in the last 30 days.',
  wd_walk_tip: 'You walked over 8,000 steps on {n} of the last 7 days. Keep it up!',
  wd_walk_why: 'Steps entered: over 8,000 on {n} of the last 7 days.',
  wd_meds_tip: 'You took your medicines on every day you made a note in the last 7 days. Keep it up!',
  wd_meds_why: '{n} journal entries in the last 7 days, all marked "Yes".'
});
Object.assign(STR.hi, {
  wl_90: '90 दिन', wl_365: '1 साल', wl_noperiod: 'इस अवधि में कोई डेटा नहीं', wl_agg_w: 'हर बिंदु एक हफ़्ते का औसत है।', wl_agg_m: 'हर बिंदु एक महीने का औसत है।',
  wl_wk: '{d} वाला हफ़्ता', wl_own: 'आपके रिकॉर्ड से',
  jt_title: 'आप कैसे रहे हैं', jt_sub: 'आपकी डायरी की एंट्री से। औसत दिखाई गई अवधि का है।', jt_none: 'इस अवधि में डायरी की कोई एंट्री नहीं। ऊपर कुछ दिन जोड़ें।',
  jt_avg_sleep: 'औसत नींद {a} / 5', jt_avg_mood: 'औसत मूड {a} / 5', jt_avg_energy: 'औसत ऊर्जा {a} / 5', jt_avg_pain: 'औसत दर्द {a} / 10',
  jt_meds: 'दवाइयाँ', jt_taken: 'ली', jt_missed: 'छूटी', jt_unsure: 'पक्का नहीं', jt_meds_sum: 'ली {a}, छूटी {b}, पक्का नहीं {c}',
  wd_sleep_tip: 'सोने का समय तय रखें, कमरा अँधेरा और शांत रखें, और सोने से पहले आख़िरी घंटे में स्क्रीन से दूर रहें।',
  wd_sleep_why: 'पिछले 30 दिनों में आपकी नींद का औसत {a} / 5 रहा ({n} एंट्री)।',
  wd_steps_tip: 'छोटी सैर भी जुड़ती जाती है। खाने के बाद 10 मिनट और चलें और धीरे-धीरे बढ़ाएँ।',
  wd_steps_why: 'पिछले 30 दिनों में आपके क़दम औसतन {a} रोज़ रहे ({n} दिन दर्ज)।',
  wd_bp_tip: 'नमक कम लें (अचार, पापड़, पैकेट वाले नमकीन), सक्रिय रहें और दिनचर्या नियमित रखें। अपने माप डॉक्टर के पास ले जाएँ।',
  wd_bp_why: 'पिछले 30 दिनों में घर पर आपका ब्लड प्रेशर औसतन {a} रहा ({n} माप)।',
  wd_sugar_tip: 'साबुत अनाज और सब्ज़ियाँ चुनें, मीठे पेय और मिठाई कम लें। ये माप अपने डॉक्टर को दिखाएँ।',
  wd_sugar_why: 'पिछले 30 दिनों में आपकी खाली पेट शुगर औसतन {a} mg/dL रही ({n} माप)।',
  wd_energy_tip: 'दिन भर पानी पिएँ, खाने का समय नियमित रखें और बीच-बीच में थोड़ा आराम करें। थकान बनी रहे तो डॉक्टर को बताएँ।',
  wd_energy_why: 'पिछले 30 दिनों में आपकी ऊर्जा का औसत {a} / 5 रहा ({n} एंट्री)।',
  wd_pain_tip: 'बार-बार लौटने वाला दर्द डॉक्टर को बताने लायक है। लिखें कि यह कब होता है और तब आप क्या कर रहे थे।',
  wd_pain_why: 'आपने पिछले 30 दिनों में {n} दिन 6 या उससे ज़्यादा दर्द लिखा।',
  wd_missed_tip: 'फ़ोन का अलार्म या दवा का डिब्बा याद रखने में मदद करता है। अगर समय निभाना मुश्किल है तो डॉक्टर से पूछें कि क्या समय बदला जा सकता है।',
  wd_missed_why: 'आपने पिछले 30 दिनों में {n} दिन दवाइयाँ छूटी लिखीं।',
  wd_walk_tip: 'आप पिछले 7 में से {n} दिन 8,000 से ज़्यादा क़दम चले। ऐसे ही चलते रहें!',
  wd_walk_why: 'दर्ज क़दम: पिछले 7 में से {n} दिन 8,000 से ज़्यादा।',
  wd_meds_tip: 'पिछले 7 दिनों में जिस भी दिन आपने नोट लिखा, उस दिन दवाइयाँ ली। ऐसे ही चलते रहें!',
  wd_meds_why: 'पिछले 7 दिनों में {n} डायरी एंट्री, सभी में "हाँ"।'
});

const SehatWell = (function () {
  const W = { period: 7, justId: null, sform: null, guide: false, rem: {} };

  /* ---------- guidance on a reading ---------- */
  function guideKind(e) {
    if (!e) return null;
    if (e.type === 'bp') {
      if (e.value >= WL_BP_HIGH_UP || (e.value2 != null && e.value2 >= WL_BP_HIGH_LO)) return 'high_bp';
      if (e.value < WL_BP_LOW_UP || (e.value2 != null && e.value2 < WL_BP_LOW_LO)) return 'low_bp';
    } else if (isSugar(e.type)) return 'sugar';   // the sugar result card (sugarCard) covers every tier
    return null;
  }
  /* ---------- sugar result card ---------- */
  const SG_TYPE = { sugar_fasting: 'fasting', sugar_pp: 'pp', sugar_random: 'random' };
  function sugarTier(e) {
    const v = e.value, c = WL_ADA[e.type] || WL_ADA.sugar_random, n = arr(e.symptoms).length;
    if (v < WL_SUGAR_LOW) return 'low';
    if (v >= c[1]) return (v >= WL_SUGAR_HIGH || n >= WL_SYM_VERY_HIGH) ? 'vhigh' : 'high';
    return v >= c[0] ? 'border' : 'normal';
  }
  function futureDay(n) { const d = new Date(parseDay(todayKey())); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); }
  function sugarQuestion(e) {
    return t('sg_q', { type: t('sg_qt_' + SG_TYPE[e.type]), v: fmtNum(e.value), when: e.date === todayKey() ? t('sg_today') : t('sg_on', { d: fmtDate(e.date) }) });
  }
  function sugarTable(ty) {
    const c = WL_ADA[ty], a = c[0], b = c[1] - 1, h = c[1];
    return '<table class="data sg-tbl"><caption>' + esc(t('sg_tbl_' + SG_TYPE[ty])) + '</caption><thead><tr><th>' + esc(t('sg_c_good')) + '</th><th>' + esc(t('sg_c_border')) + '</th><th>' + esc(t('sg_c_high')) + '</th></tr></thead><tbody><tr>' +
      '<td>' + esc(t('sg_below', { a })) + '</td><td>' + esc(t('sg_between', { a, b })) + '</td><td>' + esc(t('sg_above', { c: h })) + '</td></tr></tbody></table>';
  }
  function sugarCard(e, saved) {
    const tier = sugarTier(e), ty = SG_TYPE[e.type], c = WL_ADA[e.type], low = tier === 'low';
    const rng = low ? t('sg_rng_low', { a: WL_SUGAR_LOW, v: fmtNum(e.value) }) : t('sg_rng_' + ty, { a: c[0], b: c[1] - 1, c: c[1], v: fmtNum(e.value) });
    const rem = W.rem[e.id];
    return '<div class="wl-sugar t-' + tier + '" role="region" aria-label="' + esc(t('vit_' + e.type)) + '" data-guide="' + esc(e.id) + '">' +
      (saved ? '<div class="muted small">' + esc(t('g_saved_h')) + '</div>' : '') +
      '<div class="sg-head"><span class="sg-badge">' + esc(t('sg_badge_' + tier)) + '</span><h4>' + esc(low ? t('g_low_sugar_t') : t('sg_t_' + tier)) + '</h4></div>' +
      '<p class="sg-range">' + esc(rng) + '</p>' +
      '<p>' + esc(low ? t('g_low_sugar') : t('sg_n_' + tier)) + '</p>' +
      (low ? '<p><strong>' + esc(t('g_doctor')) + '</strong></p><p class="wl-danger">' + esc(t('g_112')) + '</p>' : '') +
      (tier === 'vhigh' ? '<p class="wl-danger">' + esc(t('sg_urgent')) + '</p>' : '') +
      '<div class="sg-btns"><button type="button" class="btn small secondary" data-wl="sgrem" data-d="1" data-id="' + esc(e.id) + '">' + esc(t('sg_rem1')) + '</button>' +
      '<button type="button" class="btn small secondary" data-wl="sgrem" data-d="2" data-id="' + esc(e.id) + '">' + esc(t('sg_rem2')) + '</button>' +
      '<button type="button" class="btn small" data-wl="sgask" data-id="' + esc(e.id) + '">' + esc(t('sg_ask')) + '</button></div>' +
      (rem ? '<p class="small sg-ok" role="status">' + esc(t('sg_rem_set', { date: fmtDate(rem) })) + ' <button type="button" class="btn small link" data-act="nav" data-view="visits">' + esc(t('sg_rem_see')) + '</button></p>' : '') +
      '<button type="button" class="chip" data-wl="sgguide" aria-expanded="' + W.guide + '">' + esc(t(W.guide ? 'sg_guide_hide' : 'sg_guide_show')) + '</button>' +
      (W.guide ? '<div class="sg-guide">' + sugarTable('sugar_fasting') + sugarTable('sugar_pp') + sugarTable('sugar_random') +
        '<p class="small">' + esc(t('sg_lower_better')) + '</p><p class="wl-danger sg-urgent">' + esc(t('sg_urgent')) + '</p></div>' : '') +
      '<p class="muted small sg-foot">' + esc(t('sg_foot')) + '</p></div>';
  }
  function guideBox(e, heading) {
    const k = guideKind(e);
    if (!k) return '';
    if (k === 'sugar') return sugarCard(e, !!heading);
    return '<div class="wl-guide' + (k.indexOf('high') === 0 ? ' hi' : '') + '" role="alert" data-guide="' + esc(e.id) + '"><h4>' + esc(heading || t('g_' + k + '_t')) + ' <span class="mono small">(' + esc(vitText(e)) + ' ' + esc(VIT_UNIT[e.type]) + ')</span></h4>' +
      '<p>' + esc(t('g_' + k)) + '</p><p><strong>' + esc(t('g_doctor')) + '</strong></p><p class="wl-danger">' + esc(t('g_112')) + '</p></div>';
  }
  function onSaved(e) {
    W.justId = e && guideKind(e) ? e.id : null;  // sugar always (result card), bp only when out of range
    if (W.justId) setTimeout(() => { const b = document.querySelector('.wl-guide[data-guide="' + W.justId + '"]'); if (b && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 60);
  }
  function savedBox() {
    const e = W.justId && S.vitals.find(x => x.id === W.justId);
    return e ? guideBox(e, t('g_saved_h')) : '';
  }
  function latestBox(e) { return e && e.id !== W.justId && S.vitals.find(x => x.id === e.id) ? guideBox(e) : ''; }

  /* ---------- steps (per profile, on this device) ---------- */
  function stepsGet() {
    try { return arr(JSON.parse(localStorage.getItem(profKey('sehat_steps')) || '[]')).filter(x => x && /^\d{4}-\d{2}-\d{2}$/.test(x.date) && isNum(x.steps)).map(x => ({ date: x.date, steps: Math.round(Number(x.steps)) })); } catch (e) { return []; }
  }
  function stepsSave(list) { try { localStorage.setItem(profKey('sehat_steps'), JSON.stringify(list)); } catch (e) { /* storage blocked */ } }
  function sf() { if (!W.sform) W.sform = { date: '', steps: '', err: null, ok: false }; if (!W.sform.date) W.sform.date = todayKey(); return W.sform; }
  function addSteps() {
    const f = sf(), n = String(f.steps).trim().replace(/[,\s]/g, '');
    f.ok = false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date) || f.date > todayKey()) { f.err = 'st_err_date'; return render(); }
    if (!/^\d{1,6}$/.test(n) || Number(n) > 100000) { f.err = 'st_err_num'; return render(); }
    const list = stepsGet().filter(x => x.date !== f.date);
    list.push({ date: f.date, steps: Number(n) });
    list.sort((a, b) => a.date.localeCompare(b.date));
    stepsSave(list);
    f.steps = ''; f.err = null; f.ok = true;
    render();
  }

  /* ---------- date helpers for the period graphs ---------- */
  const dayMs = 864e5;
  const parseDay = d => { const p = String(d).split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getTime(); };
  const dayKey = ms => new Date(ms).toLocaleDateString('en-CA');
  const shortDate = d => fmtDate(d, { day: 'numeric', month: 'short' });
  const RANGES = [7, 30, 90, 365];
  const curRange = () => (RANGES.indexOf(S.wlRange) >= 0 ? S.wlRange : 7);
  const r1 = x => Math.round(x * 10) / 10;
  const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
  /* 7 / 30 days: one point per day. 90 days: weekly averages. 1 year: monthly averages. */
  function period() {
    const n = curRange(), end = parseDay(todayKey()), start = end - (n - 1) * dayMs;
    const mode = n <= 30 ? 'd' : (n === 90 ? 'w' : 'm');
    const sd = new Date(start), ed = new Date(end), mBase = sd.getFullYear() * 12 + sd.getMonth();
    const nb = mode === 'd' ? n : (mode === 'w' ? Math.ceil(n / 7) : ed.getFullYear() * 12 + ed.getMonth() - mBase + 1);
    const startKey = dayKey(start), endKey = todayKey();
    const idx = d => {
      if (!d || d < startKey || d > endKey) return -1;
      const di = Math.round((parseDay(d) - start) / dayMs);
      if (mode === 'd') return di;
      if (mode === 'w') return Math.floor(di / 7);
      const x = new Date(parseDay(d)); return x.getFullYear() * 12 + x.getMonth() - mBase;
    };
    const mStart = i => dayKey(new Date(sd.getFullYear(), sd.getMonth() + i, 1).getTime());
    const label = i => mode === 'd' ? shortDate(dayKey(start + i * dayMs))
      : (mode === 'w' ? shortDate(dayKey(start + i * 7 * dayMs)) : fmtDate(mStart(i), { month: 'short', year: '2-digit' }));
    const tip = i => mode === 'w' ? t('wl_wk', { d: label(i) }) : (mode === 'm' ? fmtDate(mStart(i), { month: 'long', year: 'numeric' }) : label(i));
    return { n, start, end, mode, nb, startKey, endKey, idx, label, tip };
  }
  /* rows [{date, v}] -> points [{i, v, tip}], averaged per week / month when the range is long */
  function bucketAvg(rows, P) {
    if (P.mode === 'd') return rows.map(r => ({ i: P.idx(r.date), v: r.v, tip: fmtDate(r.date) })).filter(p => p.i >= 0).sort((a, b) => a.i - b.i);
    const m = {};
    rows.forEach(r => { const i = P.idx(r.date); if (i >= 0) (m[i] = m[i] || []).push(r.v); });
    return Object.keys(m).map(Number).sort((a, b) => a - b).map(i => ({ i, v: r1(mean(m[i])), tip: P.tip(i) }));
  }
  function xTicks(P, xc, H, pl, Wd, pr) {
    const last = P.nb - 1;
    const ix = P.nb <= 1 ? [0] : (P.mode === 'd' ? [0, last] : Array.from(new Set([0, Math.round(last / 3), Math.round(2 * last / 3), last])));
    return ix.map(i => {
      const first = i === 0, end = i === last && last > 0;
      return '<text x="' + (first ? pl : (end ? Wd - pr : xc(i).toFixed(1))) + '" y="' + (H - 9) + '" text-anchor="' + (first ? 'start' : (end ? 'end' : 'middle')) + '">' + esc(P.label(i)) + '</text>';
    }).join('');
  }
  const aggNote = P => (P.mode === 'w' ? '<p class="muted small" style="margin:6px 0 0">' + esc(t('wl_agg_w')) + '</p>' : (P.mode === 'm' ? '<p class="muted small" style="margin:6px 0 0">' + esc(t('wl_agg_m')) + '</p>' : ''));

  /* ---------- SVG line chart (one per reading type) ---------- */
  function lineChart(c, P) {
    const Wd = 360, H = 176, pl = 38, pr = 16, pt = 18, pb = 28;
    let all = [];
    c.lines.forEach(l => { all = all.concat(l.pts.map(p => p.v)); });
    c.bands.forEach(b => { all.push(b[0], b[1]); });
    let mn = Math.min.apply(null, all), mx = Math.max.apply(null, all);
    if (c.fixed) { mn = c.fixed[0]; mx = c.fixed[1]; } else { const padv = (mx - mn) * 0.1 || 1; mn -= padv; mx += padv; }
    const X = i => pl + (P.nb === 1 ? 0.5 : i / (P.nb - 1)) * (Wd - pl - pr);
    const Y = v => pt + (1 - (v - mn) / (mx - mn)) * (H - pt - pb);
    let g = '';
    c.bands.forEach(b => {
      g += '<rect class="wl-band" x="' + pl + '" y="' + Y(b[1]).toFixed(1) + '" width="' + (Wd - pl - pr) + '" height="' + Math.max(1, Y(b[0]) - Y(b[1])).toFixed(1) + '" fill="#055A99" fill-opacity="0.10" stroke="#055A99" stroke-opacity="0.55" stroke-dasharray="4 3"/>';
    });
    g += '<line x1="' + pl + '" y1="' + (H - pb) + '" x2="' + (Wd - pr) + '" y2="' + (H - pb) + '" stroke="var(--line)"/>';
    c.lines.forEach(l => {
      const pts = l.pts.map(p => [X(p.i), Y(p.v)]);
      if (pts.length > 1) g += '<polyline fill="none" stroke="' + l.color + '" stroke-width="1.8" points="' + pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + '"/>';
      const labelAll = l.pts.length <= 9;
      l.pts.forEach((p, k) => {
        const x = X(p.i).toFixed(1), y = Y(p.v);
        g += '<circle cx="' + x + '" cy="' + y.toFixed(1) + '" r="' + (l.pts.length > 40 ? 3 : 4.5) + '" fill="' + (p.out ? '#B45309' : l.color) + '" stroke="var(--card)" stroke-width="1.5"><title>' + esc(t('wl_pt', { d: p.tip, v: fmtNum(p.v), u: c.unit }) + (l.label ? ' (' + l.label + ')' : '')) + '</title></circle>';
        if (labelAll || k === l.pts.length - 1) g += '<text class="' + (k === l.pts.length - 1 ? 'last' : '') + '" x="' + x + '" y="' + (y + (l.below ? 15 : -8)).toFixed(1) + '" text-anchor="middle">' + esc(fmtNum(p.v)) + '</text>';
      });
    });
    g += '<text x="' + (pl - 5) + '" y="' + (pt + 4) + '" text-anchor="end">' + esc(fmtNum(mx)) + '</text>';
    g += '<text x="' + (pl - 5) + '" y="' + (H - pb) + '" text-anchor="end">' + esc(fmtNum(mn)) + '</text>';
    g += xTicks(P, X, H, pl, Wd, pr);
    return '<svg viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="' + esc(c.name) + '">' + g + '</svg>';
  }
  function readingCharts(P) {
    const out = [];
    const inP = ty => S.vitals.filter(e => e.type === ty && e.date >= P.startKey && e.date <= P.endKey).sort((a, b) => a.date.localeCompare(b.date));
    VIT_TYPES.forEach(ty => {
      const es = inP(ty);
      if (!es.length) return;
      const mk = (rows, band) => bucketAvg(rows, P).map(p => Object.assign(p, { out: band ? (p.v < band[0] || p.v > band[1]) : false }));
      let c;
      if (ty === 'bp') {
        c = { name: t('vit_bp'), unit: 'mmHg', bands: [WL_USUAL.bp_up, WL_USUAL.bp_lo], lines: [
          { label: t('wl_upper'), color: '#055A99', pts: mk(es.map(e => ({ date: e.date, v: e.value })), WL_USUAL.bp_up) },
          { label: t('wl_lower'), color: '#475569', below: true, pts: mk(es.filter(e => e.value2 != null).map(e => ({ date: e.date, v: e.value2 })), WL_USUAL.bp_lo) }], range: WL_USUAL.bp_up[0] + '/' + WL_USUAL.bp_lo[0] + ' to ' + WL_USUAL.bp_up[1] + '/' + WL_USUAL.bp_lo[1], legend: true };
      } else {
        const b = WL_USUAL[ty] || null;
        c = { name: t('vit_' + ty), unit: VIT_UNIT[ty], bands: b ? [b] : [], lines: [{ label: '', color: '#055A99', pts: mk(es.map(e => ({ date: e.date, v: e.value })), b) }], range: b ? b[0] + ' to ' + b[1] : '' };
      }
      out.push('<div class="trend wl-chart"><h4><span>' + esc(c.name) + '</span><span class="mono muted small">' + esc(c.unit) + '</span></h4>' + lineChart(c, P) +
        (c.legend ? '<p class="wl-legend small"><span class="wl-key u"></span>' + esc(t('wl_upper')) + ' <span class="wl-key l"></span>' + esc(t('wl_lower')) + '</p>' : '') +
        (c.range ? '<p class="muted small" style="margin:2px 0 0">' + esc(t('wl_range', { a: c.range.split(' to ')[0], b: c.range.split(' to ')[1] })) + '</p>' : '') + '</div>');
    });
    return out;
  }
  function toggleHTML() {
    return '<div class="wl-toggle" role="group" aria-label="' + esc(t('wl_period')) + '">' + RANGES.map(n => '<button type="button" class="chip" data-wl="r' + n + '" aria-pressed="' + (curRange() === n) + '">' + esc(t('wl_' + n)) + '</button>').join('') + '</div>';
  }
  function graphCard() {
    const P = period(), cs = readingCharts(P);
    return '<div class="card" id="wlGraph"><div class="row between"><h2>' + esc(t('wl_graph')) + '</h2>' + toggleHTML() + '</div>' + aggNote(P) +
      (cs.length ? '<div class="trends wl-charts" style="margin-top:12px">' + cs.join('') + '</div><p class="muted small" style="margin:10px 0 0">' + esc(t('wl_usual')) + '</p>'
        : '<p class="muted" style="margin:10px 0 0">' + esc(t('wl_noperiod')) + '</p>') + '</div>';
  }

  /* ---------- journal graphs ("How you've been") ---------- */
  function trendCard() {
    const J = window.SehatJournal; if (!J) return '';
    const P = period(), ents = J.load().filter(e => P.idx(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
    const head = '<div class="row between"><h2>' + esc(t('jt_title')) + '</h2>' + toggleHTML() + '</div><p class="muted small" style="margin:4px 0 0">' + esc(t('jt_sub')) + '</p>' + aggNote(P);
    if (!ents.length) return '<div class="card" id="jrTrend">' + head + '<p class="muted" style="margin:10px 0 0">' + esc(t('jt_none')) + '</p></div>';
    const defs = [['sleep', [1, 5], '/ 5', '#055A99'], ['mood', [1, 5], '/ 5', '#055A99'], ['energy', [1, 5], '/ 5', '#055A99'], ['pain', [0, 10], '/ 10', '#475569']];
    const charts = defs.map(d => {
      const k = d[0], rows = ents.filter(e => typeof e[k] === 'number' && e[k] >= d[1][0] && (k === 'pain' || e[k] > 0)).map(e => ({ date: e.date, v: e[k] }));
      const h = '<h4><span>' + esc(t('jr_' + k)) + '</span>' + (rows.length ? '<span class="mono small">' + esc(t('jt_avg_' + k, { a: mean(rows.map(r => r.v)).toFixed(1) })) + '</span>' : '') + '</h4>';
      if (!rows.length) return '<div class="trend wl-chart">' + h + '<p class="muted small" style="margin:6px 0 0">' + esc(t('wl_noperiod')) + '</p></div>';
      const c = { name: t('jr_' + k), unit: d[2], bands: [], fixed: d[1], lines: [{ label: '', color: d[3], pts: bucketAvg(rows, P) }] };
      return '<div class="trend wl-chart">' + h + lineChart(c, P) + '</div>';
    });
    return '<div class="card" id="jrTrend">' + head + '<div class="trends wl-charts" style="margin-top:12px">' + charts.join('') + medsStrip(ents, P) + '</div></div>';
  }
  function medsStrip(ents, P) {
    const rows = ents.filter(e => e.meds_taken === 'yes' || e.meds_taken === 'no' || e.meds_taken === 'unsure');
    const h = '<h4><span>' + esc(t('jt_meds')) + '</span></h4>';
    if (!rows.length) return '<div class="trend wl-chart">' + h + '<p class="muted small" style="margin:6px 0 0">' + esc(t('wl_noperiod')) + '</p></div>';
    const b = {}, tot = { yes: 0, no: 0, unsure: 0 };
    rows.forEach(e => { const i = P.idx(e.date); const o = b[i] || (b[i] = { yes: 0, no: 0, unsure: 0 }); o[e.meds_taken]++; tot[e.meds_taken]++; });
    const keys = Object.keys(b).map(Number), mx = Math.max.apply(null, keys.map(i => b[i].yes + b[i].no + b[i].unsure));
    const Wd = 360, H = 110, pl = 38, pr = 10, pt = 10, pb = 28, slot = (Wd - pl - pr) / P.nb, bw = Math.max(3, slot * 0.7), hh = H - pt - pb;
    const COL = { yes: '#055A99', unsure: '#94A3B8', no: '#B45309' };
    let g = '<line x1="' + pl + '" y1="' + (H - pb) + '" x2="' + (Wd - pr) + '" y2="' + (H - pb) + '" stroke="var(--line)"/>';
    keys.forEach(i => {
      const x = pl + i * slot + (slot - bw) / 2; let y = H - pb;
      ['yes', 'unsure', 'no'].forEach(k => {
        if (!b[i][k]) return;
        const h2 = b[i][k] / mx * hh; y -= h2;
        g += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h2.toFixed(1) + '" fill="' + COL[k] + '"><title>' + esc((P.mode === 'd' ? fmtDate(rows.find(e => P.idx(e.date) === i).date) : P.tip(i)) + ': ' + t(k === 'yes' ? 'jt_taken' : (k === 'no' ? 'jt_missed' : 'jt_unsure')) + ' ' + b[i][k]) + '</title></rect>';
      });
    });
    g += '<text x="' + (pl - 5) + '" y="' + (pt + 8) + '" text-anchor="end">' + mx + '</text><text x="' + (pl - 5) + '" y="' + (H - pb) + '" text-anchor="end">0</text>';
    g += xTicks(P, i => pl + (i + 0.5) * slot, H, pl, Wd, pr);
    const key = (k, lbl) => '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' + COL[k] + ';margin:0 4px -1px 8px"></span>' + esc(lbl);
    return '<div class="trend wl-chart">' + h + '<svg viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="' + esc(t('jt_meds')) + '">' + g + '</svg><p class="small" style="margin:4px 0 0">' + key('yes', t('jt_taken')) + key('no', t('jt_missed')) + key('unsure', t('jt_unsure')) + '</p>' +
      '<p class="muted small" style="margin:2px 0 0">' + esc(t('jt_meds_sum', { a: tot.yes, b: tot.no, c: tot.unsure })) + '</p></div>';
  }

  /* ---------- tips that follow the person's own logged data (last 30 days) ---------- */
  function dataTips() {
    const out = [], today = todayKey(), lo30 = dayKey(parseDay(today) - 29 * dayMs), lo7 = dayKey(parseDay(today) - 6 * dayMs);
    const J = window.SehatJournal, ents = (J ? J.load() : []).filter(e => e.date >= lo30 && e.date <= today);
    const steps = stepsGet().filter(x => x.date >= lo30 && x.date <= today);
    const vit = ty => S.vitals.filter(e => e.type === ty && e.date >= lo30 && e.date <= today && isNum(e.value));
    const add = (area, k, p) => out.push({ area, tip: t('wd_' + k + '_tip', p), why: t('wd_' + k + '_why', p), records: [], own: true });
    const num = k => ents.filter(e => typeof e[k] === 'number' && e[k] > 0).map(e => e[k]);
    const sl = num('sleep'); if (sl.length >= 5 && mean(sl) < 3) add('sleep', 'sleep', { a: mean(sl).toFixed(1), n: sl.length });
    if (steps.length >= 5) { const a = mean(steps.map(x => x.steps)); if (a < 5000) add('activity', 'steps', { a: Math.round(a).toLocaleString(), n: steps.length }); }
    const walk = steps.filter(x => x.date >= lo7 && x.steps > 8000).length; if (walk >= 5) add('activity', 'walk', { n: walk });
    const bp = vit('bp');
    if (bp.length >= 3) {
      const sy = mean(bp.map(e => Number(e.value))), dv = bp.filter(e => e.value2 != null).map(e => Number(e.value2)), di = dv.length ? mean(dv) : null;
      if (sy >= 135 || (di != null && di >= 85)) add('diet', 'bp', { a: Math.round(sy) + '/' + (di == null ? '-' : Math.round(di)), n: bp.length });
    }
    const sg = vit('sugar_fasting'); if (sg.length >= 3) { const a = mean(sg.map(e => Number(e.value))); if (a >= 100) add('diet', 'sugar', { a: Math.round(a), n: sg.length }); }
    const en = num('energy'); if (en.length >= 5 && mean(en) < 3) add('habits', 'energy', { a: mean(en).toFixed(1), n: en.length });
    const pn = ents.filter(e => typeof e.pain === 'number' && e.pain >= 6).length; if (pn >= 3) add('habits', 'pain', { n: pn });
    const ms = ents.filter(e => e.meds_taken === 'no').length; if (ms >= 3) add('habits', 'missed', { n: ms });
    const w7 = ents.filter(e => e.date >= lo7 && e.meds_taken); if (w7.length >= 5 && w7.every(e => e.meds_taken === 'yes')) add('habits', 'meds', { n: w7.length });
    return out;
  }

  /* ---------- steps bar chart ---------- */
  function stepsChart(P) {
    const rows = stepsGet().filter(x => P.idx(x.date) >= 0);
    if (!rows.length) return { html: '', n: 0 };
    const bars = bucketAvg(rows.map(x => ({ date: x.date, v: x.steps })), P).map(p => ({ i: p.i, steps: Math.round(p.v), tip: p.tip }));
    const Wd = 360, H = 176, pl = 40, pr = 10, pt = 18, pb = 28, mx = Math.max.apply(null, bars.map(b => b.steps)) * 1.1 || 1;
    const slot = (Wd - pl - pr) / P.nb, bw = Math.max(3, slot * 0.7);
    let g = '<line x1="' + pl + '" y1="' + (H - pb) + '" x2="' + (Wd - pr) + '" y2="' + (H - pb) + '" stroke="var(--line)"/>';
    bars.forEach(b => {
      const x = pl + b.i * slot + (slot - bw) / 2, h = b.steps / mx * (H - pt - pb), y = H - pb - h;
      g += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, h).toFixed(1) + '" rx="2" fill="#055A99"><title>' + esc(t('wl_pt', { d: b.tip, v: b.steps.toLocaleString(), u: t('st_unit') })) + '</title></rect>';
      if (P.n <= 7) g += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 4).toFixed(1) + '" text-anchor="middle">' + esc(b.steps >= 10000 ? (b.steps / 1000).toFixed(1) + 'k' : b.steps) + '</text>';
    });
    g += '<text x="' + (pl - 5) + '" y="' + (pt + 4) + '" text-anchor="end">' + esc(Math.round(mx).toLocaleString()) + '</text><text x="' + (pl - 5) + '" y="' + (H - pb) + '" text-anchor="end">0</text>';
    g += xTicks(P, i => pl + (i + 0.5) * slot, H, pl, Wd, pr);
    const total = rows.reduce((a, x) => a + x.steps, 0);
    return { n: rows.length, total, avg: Math.round(total / rows.length), html: '<div class="trend wl-chart"><svg viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="' + esc(t('st_title')) + '">' + g + '</svg></div>' };
  }

  function stepsCard() {
    const f = sf(), P = period(), ch = stepsChart(P), list = stepsGet().slice().reverse();
    const form = '<form id="stepForm" class="vit-form" novalidate>' +
      '<label class="fld"><span>' + esc(t('st_date')) + '</span><input type="date" id="stDate" max="' + esc(todayKey()) + '" value="' + esc(f.date) + '"></label>' +
      '<label class="fld"><span>' + esc(t('st_count')) + '</span><input type="text" inputmode="numeric" id="stCount" class="mono" autocomplete="off" value="' + esc(f.steps) + '"></label>' +
      '<div class="vit-act"><button type="submit" class="btn">' + esc(t('st_add')) + '</button></div>' +
      '<p class="vit-err" role="alert"' + (f.err ? '' : ' hidden') + '>' + esc(f.err ? t(f.err) : '') + '</p></form>';
    return '<div class="card" id="wlSteps"><div class="row between"><h2>' + esc(t('st_title')) + '</h2>' + toggleHTML() + '</div>' +
      '<p class="muted small" style="margin:6px 0 10px">' + esc(t('st_note')) + '</p>' + form + (f.ok ? '<p class="small" role="status" style="color:var(--ok);margin:6px 0 0">' + esc(t('st_saved')) + '</p>' : '') +
      aggNote(P) + (ch.n ? '<div style="margin-top:12px">' + ch.html + '<p class="small" style="margin:8px 0 0"><strong>' + esc(t('st_avg', { n: ch.avg.toLocaleString() })) + '</strong> · ' + esc(t('st_total', { n: ch.total.toLocaleString() })) + '</p></div>' : '<p class="muted" style="margin:12px 0 0">' + esc(list.length ? t('wl_noperiod') : t('st_empty')) + '</p>') +
      (list.length ? '<details class="vit-all" style="margin-top:10px"><summary>' + esc(t('st_list', { n: list.length })) + '</summary><ul class="list">' + list.map(x => '<li><span class="l"><span class="mono">' + esc(x.steps.toLocaleString()) + '</span> ' + esc(t('st_unit')) + '<br><span class="muted small">' + esc(fmtDate(x.date)) + '</span></span><span class="r"><button type="button" class="btn small danger" data-wl="stepdel" data-date="' + esc(x.date) + '">' + esc(t('st_del')) + '</button></span></li>').join('') + '</ul></details>' : '') + '</div>';
  }

  function sugarRemind(id, days) {
    const e = S.vitals.find(x => x.id === id), R = window.SehatRem;
    if (!e || !R || !R.addAppt || (days !== 1 && days !== 2)) return;
    const date = futureDay(days);
    if (!R.addAppt({ title: t('sg_rem_title'), date, time: WL_RECHECK_TIME, note: t('sg_rem_note', { type: t('sg_qt_' + SG_TYPE[e.type]), v: fmtNum(e.value), d: fmtDate(e.date) }) })) return;
    W.rem[id] = date;
    render();
  }
  function sugarAsk(id) {
    const e = S.vitals.find(x => x.id === id); if (!e) return;
    PET.open = true; PET.seen[petScreen()] = true; renderPet();
    const i = document.getElementById('petInput');
    if (i) { i.value = sugarQuestion(e); i.focus(); }
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const el = e.target && e.target.closest ? e.target.closest('[data-wl]') : null;
    if (S.moreOpen && e.target.isConnected && !(e.target.closest && e.target.closest('.nav'))) { S.moreOpen = false; applyStatic(); }
    if (e.target && e.target.closest && e.target.closest('[data-act="nav"]')) W.justId = null;
    if (!el) return;
    const a = el.getAttribute('data-wl');
    if (/^r(7|30|90|365)$/.test(a)) { S.wlRange = Number(a.slice(1)); render(); }
    else if (a === 'sgguide') { W.guide = !W.guide; render(); }
    else if (a === 'sgrem') sugarRemind(el.getAttribute('data-id'), Number(el.getAttribute('data-d')));
    else if (a === 'sgask') sugarAsk(el.getAttribute('data-id'));
    else if (a === 'stepdel') { stepsSave(stepsGet().filter(x => x.date !== el.getAttribute('data-date'))); render(); }
  });
  document.addEventListener('submit', e => { if (e.target && e.target.id === 'stepForm') { e.preventDefault(); addSteps(); } });
  document.addEventListener('input', e => {
    const el = e.target; if (!el || !W.sform) return;
    if (el.id === 'stDate') W.sform.date = el.value; else if (el.id === 'stCount') W.sform.steps = el.value;
  });
  document.addEventListener('change', e => { if (e.target && e.target.id === 'stDate') sf().date = e.target.value; });
  document.addEventListener('sehat:profile', () => { W.justId = null; W.sform = null; W.rem = {}; });

  return { onSaved, savedBox, latestBox, graphCard, stepsCard, guideKind, trendCard, dataTips };
})();
window.SehatWell = SehatWell;

/* ================= The views ================= */
function viewHead(titleKey, subKey, extra) {
  return '<div class="page-head row between"><div><h1>' + esc(t(titleKey)) + '</h1><p>' + esc(t(subKey)) + '</p></div>' + (extra || '') + '</div>';
}
/* common wrapper: shows the skeleton while the first insights load, else calls fn(insights) */
function withInsights(head, fn) {
  const g = getInsights();
  if (g.loading) return head + '<div class="stack">' + skelCard(3) + skelCard(4) + '</div><p class="muted small" role="status">' + esc(t('ins_loading')) + '</p>';
  return head + fn(g.data);
}

function hubTiles() {
  const doses = buildDoses(schedMeds()).filter(d => isTickable(d.slot)), tk = takenGet();
  const medSub = doses.length ? t('hub_meds_n', { x: doses.filter(d => tk[d.key]).length, y: doses.length }) : (curInsights().medicines.length ? t('hub_meds_rec', { n: curInsights().medicines.length }) : t('hub_meds_none'));
  const tile = (icon, view, label, sub) => '<button type="button" class="qa hub" data-act="nav" data-view="' + view + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[icon] + '</svg><span><strong>' + esc(label) + '</strong><small>' + esc(sub) + '</small></span></button>';
  return '<div class="quick hubs">' + tile('meds', 'meds', t('nav_meds'), medSub) + tile('visits', 'visits', t('nav_visits'), t('hub_visits')) +
    tile('journal', 'journal', t('nav_journal'), t('hub_journal')) + tile('wellness', 'wellness', t('nav_wellness'), t('hub_wellness')) + '</div>';
}

function viewMeds() {
  return withInsights(viewHead('nav_meds', 'meds_sub'), I => {
    const sched = I.medicines.filter(m => m.status !== 'course_ended').map(m => ({ m, date: m.date }));
    return '<div class="stack">' + medsTodayCard(schedMeds()) + confirmMedsCard() + medsRecordedCard(I) + pharmacistCard(sched) + '</div>';
  });
}
function viewVisits() {
  const head = viewHead('nav_visits', 'visits_sub');
  const R = window.SehatRem;
  const body = R ? (typeof R.visitsCard === 'function' ? R.visitsCard() : R.apptCard()) : '';  // reminders.js
  return head + '<div class="stack">' + body + '<div class="card"><h2 style="margin-bottom:6px">' + esc(t('visit_card_t')) + '</h2><p class="muted">' + esc(t('visit_card_p')) + '</p>' +
    '<button type="button" class="btn secondary" data-act="visit">' + esc(t('visit_btn')) + '</button></div></div>';
}
function viewJournal() {
  return withInsights(viewHead('nav_journal', 'journal_sub'), I => jrH(I, 'top'));
}
function viewWellness() {
  return withInsights(viewHead('nav_wellness', 'wellness_sub'), I => {
    const habits = jrH(I, 'habits');
    return '<div class="stack">' + wellnessCard(I) + SehatWell.graphCard() + SehatWell.stepsCard() + '</div>' +
      (habits ? '<section class="hsec"><div class="kicker">' + esc(t('wl_foryou')) + '</div>' + habits.replace(/^<section class="hsec">/, '').replace(/<\/section>$/, '') + '</section>' : '');
  });
}
function viewFamily() {
  return viewHead('nav_family', 'family_sub') + (window.SehatFamily && SehatFamily.view ? SehatFamily.view() : '');
}

// labels above arrive after app.js first paints the nav; paint again so they show at once
if (typeof render === "function") render();
