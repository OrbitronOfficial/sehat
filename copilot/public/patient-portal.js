(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const list = value => Array.isArray(value) ? value : value ? [value] : [];
  const text = value => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  let mode = 'login', activeUser = null, consultations = [], busy = false, stateSequence = 0;
  function status(id, message = '', error = false) {
    $(id).textContent = message;
    $(id).classList.toggle('error', error);
  }
  async function api(action, payload = {}) {
    let response;
    try {
      response = await fetch('/api/clinic', {method:'POST', credentials:'same-origin', cache:'no-store', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action, ...payload}), signal:AbortSignal.timeout(25000)});
    } catch (error) { throw new Error(error.name === 'TimeoutError' ? 'The clinic is taking longer than expected. Please try again.' : 'Could not reach your clinic. Check your connection and try again.'); }
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.error) {
      const error = new Error(text(data?.error) || (response.status === 401 ? 'Your session has ended. Please sign in again.' : response.status === 404 ? 'The clinic portal is not available yet. Contact your clinic or try again later.' : `The clinic could not complete this request (${response.status}). Please try again.`));
      error.status = response.status;
      throw error;
    }
    if (!data || typeof data !== 'object') throw new Error('The clinic returned an unreadable response. Please try again.');
    return data;
  }
  function date(value, withTime = false) {
    if (!value) return 'Date not supplied';
    const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? value + 'T00:00:00' : value);
    return Number.isNaN(parsed.getTime()) ? text(value) : parsed.toLocaleString(undefined, {year:'numeric', month:'short', day:'numeric', ...(withTime ? {hour:'numeric',minute:'2-digit',timeZoneName:'short'} : {})});
  }
  function chooseMode(next) {
    mode = next;
    const claim = next === 'claim';
    $('loginTab').setAttribute('aria-pressed', String(!claim));
    $('claimTab').setAttribute('aria-pressed', String(claim));
    $('claimField').hidden = !claim;
    $('claimCode').disabled = !claim;
    $('claimCode').required = claim;
    $('password').autocomplete = claim ? 'new-password' : 'current-password';
    $('password').minLength = claim ? 10 : 1;
    $('passwordLabel').textContent = claim ? 'Choose a password' : 'Password';
    $('authTitle').textContent = claim ? 'A connection starts here.' : 'Welcome back.';
    $('authHelp').textContent = claim ? 'Use your registered email or phone, your clinic code, and a password of at least 10 characters.' : 'Use the email or phone number registered with your clinic.';
    $('authSubmit').textContent = claim ? 'Claim my patient account ↗' : 'Sign in ↗';
    status('authStatus');
  }
  function clearSession() {
    activeUser = null; consultations = [];
    $('records').replaceChildren(); $('appointments').replaceChildren(); $('consultation').replaceChildren();
    $('patientName').textContent = 'Your care overview';
    $('checkinForm').reset(); $('authForm').reset();
    $('password').type = 'password';
    ['checkinStatus','calendarStatus','authStatus'].forEach(id => status(id));
    $('dashboard').hidden = true; $('authArea').hidden = false;
  }
  function handleError(error, target) {
    if (error.status === 401) { stateSequence++; clearSession(); status('authStatus', error.message, true); }
    else status(target, error.message, true);
  }
  function section(title, content) { return `<section class="record-section"><h4>${esc(title)}</h4>${content}</section>`; }
  function prose(value, fallback) {
    const items = list(value).map(item => text(item) || text(item?.text) || text(item?.name)).filter(Boolean);
    return items.length ? items.map(item => `<p>${esc(item)}</p>`).join('') : `<p class="empty">${esc(fallback)}</p>`;
  }
  function recordHTML(c, index) {
    const r = c.record || c.prescription || c;
    const approvedAt = c.approved_at || r.approved_at;
    const recordAt = r.date || c.date || c.created_at || r.created_at;
    const meds = list(r.medicines || r.medications);
    const doctor = text(c.doctor_name) || text(c.doctor?.name) || text(r.doctor_name) || text(r.doctor);
    const medicineHTML = meds.length ? '<ul class="med-list">' + meds.map(m => {
      if (typeof m === 'string') return `<li>${esc(m)}</li>`;
      const instructions = ['strength','dose','frequency','timing','duration','instructions'].filter(key => text(m[key])).map(key => `${key[0].toUpperCase() + key.slice(1)}: ${text(m[key])}`).join(' · ');
      return `<li><strong>${esc(m.name || m.generic || 'Medicine')}</strong><p>${esc(instructions || 'No dosing instructions supplied in this record. Ask your clinic for clarification.')}</p>${m.source_text ? `<p class="source">Source instruction: ${esc(m.source_text)}</p>` : ''}</li>`;
    }).join('') + '</ul>' : '<p class="empty">No medicines listed in this approved record.</p>';
    const transcript = text(c.transcript) || text(r.transcript);
    return `<article class="panel consultation" data-record="${index}"><div class="print-heading">Sehat Copilot · Doctor-approved prescription<br>Patient: ${esc(text(activeUser?.patientName))}</div><div class="record-head"><div><span class="badge">Doctor-approved record</span><h3>${esc(r.title || 'Your consultation')}</h3><p>Prescription date: ${esc(date(recordAt))}</p><p>Approved: ${esc(date(approvedAt))}${doctor ? ` · ${esc(doctor)}` : ''}</p></div></div>${r.summary ? section('Consultation summary', prose(r.summary,'')) : ''}${r.diagnoses?.length ? section('Recorded diagnoses', prose(r.diagnoses,'')) : ''}${section('Medicines & source instructions', medicineHTML)}${section('Your doctor’s advice', prose(r.advice, 'No advice was included in this record. Contact your clinic if you expected instructions.'))}${section('Follow-up', prose(r.follow_up || r.followup, 'No follow-up instructions supplied. Check your appointments or ask your clinic.'))}${r.source_text ? section('Original source instructions',prose(r.source_text,'')) : ''}${r.tests?.length ? section('Tests requested by your doctor',prose(r.tests,'')) : ''}${r.notes ? section('Additional doctor notes',prose(r.notes,'')) : ''}${r.warnings?.length ? section('Notes from your doctor',prose(r.warnings,'')) : ''}${transcript ? `<details><summary>Consultation transcript shared by your clinic</summary><p class="record-text">${esc(transcript)}</p></details>` : ''}<div class="record-actions"><button type="button" class="button secondary small" data-print="${index}">Print prescription ↗</button></div><p class="source">Shown as supplied by your clinic. If an instruction is unclear or missing, ask your clinic before making a change.</p></article>`;
  }
  function startOf(a) { return a.start_at || a.starts_at || a.start || a.scheduled_at || a.datetime || (a.date && a.time ? a.date + 'T' + a.time + '+05:30' : a.date); }
  function googleURL(a) {
    const start = startOf(a);
    // Match the clinic's .ics export: Asia/Kolkata and a 30-minute calendar slot.
    const end = a.end_at || a.ends_at || a.end || (a.date && a.time && Number.isFinite(new Date(start).getTime()) ? new Date(new Date(start).getTime() + 30 * 60000).toISOString() : null);
    if (!start) return null;
    const allDay = /^\d{4}-\d{2}-\d{2}$/.test(String(start));
    const from = new Date(allDay ? start + 'T00:00:00Z' : start);
    // Do not infer a duration for other appointment shapes.
    if (!Number.isFinite(from.getTime()) || (!allDay && !end)) return null;
    const to = end ? new Date(allDay && /^\d{4}-\d{2}-\d{2}$/.test(String(end)) ? end + 'T00:00:00Z' : end) : new Date(from.getTime() + 86400000);
    if (!Number.isFinite(to.getTime()) || to <= from) return null;
    const stamp = d => allDay ? d.toISOString().slice(0,10).replaceAll('-','') : d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const params = new URLSearchParams({action:'TEMPLATE', text:text(a.title) || 'Clinic appointment',dates:`${stamp(from)}/${stamp(to)}`,details:'Exported from Sehat Copilot. This copy does not sync. Check the patient portal for appointment changes.'});
    if (text(a.location)) params.set('location',a.location);
    return 'https://calendar.google.com/calendar/render?' + params;
  }
  function render(data) {
    if (!data.user) throw new Error('Please sign in to view your clinic records.');
    if (data.user.role && data.user.role !== 'patient') {
      clearSession();
      throw new Error('This browser is signed in to a doctor account. Open the Doctor workspace and sign out there before signing in as a patient.');
    }
    activeUser = {...data.user, patientName:text(data.patient?.name) || text(data.user.name) || 'Patient'};
    // The state endpoint is the authority for patient-visible approved records.
    // Also suppress explicitly unapproved entries if an unexpected payload includes them.
    consultations = list(data.consultations).filter(c => c && typeof c === 'object' && c.approved !== false && c.approved_by_doctor !== false && (!c.status || c.status === 'approved'));
    $('patientName').textContent = `Hello, ${activeUser.patientName}.`;
    $('records').innerHTML = consultations.length ? consultations.map(recordHTML).join('') : '<div class="panel empty"><h3>Your care story starts here.</h3>No approved records have been shared yet. They will appear after your doctor approves and shares them. If you expected a prescription, contact your clinic.</div>';
    const previous = $('consultation').value;
    $('consultation').innerHTML = consultations.filter(c => c.id || c.consultation_id).map(c => `<option value="${esc(c.id || c.consultation_id)}">${esc(date(c.approved_at || c.created_at || c.record?.date))} · ${esc(c.record?.title || c.prescription?.title || c.title || 'Consultation')}</option>`).join('');
    if ([...$('consultation').options].some(o => o.value === previous)) $('consultation').value = previous;
    const canCheckin = $('consultation').options.length > 0;
    ['consultation','personalNote','acknowledge','checkinSubmit'].forEach(id => $(id).disabled = !canCheckin);
    if (!canCheckin) status('checkinStatus','You can send a note once your clinic shares an approved consultation.');
    else if (!previous) status('checkinStatus');
    const appointments = list(data.appointments).filter(a => a && typeof a === 'object').sort((a,b) => (new Date(startOf(a)).getTime() || Infinity) - (new Date(startOf(b)).getTime() || Infinity));
    const today = new Date();
    const upcoming = appointments.filter(a => !['cancelled','canceled','completed'].includes(a.status) && (!startOf(a) || !Number.isFinite(new Date(startOf(a)).getTime()) || new Date(startOf(a)) >= today));
    $('appointments').innerHTML = upcoming.length ? upcoming.map(a => {
      const url = googleURL(a);
      return `<article class="appointment"><h3>${esc(a.title || 'Clinic appointment')}</h3><p>${esc(date(startOf(a),!/^\d{4}-\d{2}-\d{2}$/.test(String(startOf(a)))))}</p>${a.location ? `<p>${esc(text(a.location))}</p>` : ''}${a.status ? `<p>Status: ${esc(a.status)}</p>` : ''}${a.reason ? `<p>${esc(text(a.reason))}</p>` : ''}${a.notes ? `<p>${esc(text(a.notes))}</p>` : ''}${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Export to Google Calendar ↗</a>` : '<p class="micro">Google export needs a complete date and time range from your clinic.</p>'}</article>`;
    }).join('') : '<p class="empty">No upcoming visit is listed. Follow the instructions in your approved record, or contact your clinic to arrange your next visit.</p>';
    $('calendarExport').hidden = !appointments.length;
    $('authArea').hidden = true; $('dashboard').hidden = false;
  }
  async function loadState(initial = false) {
    const sequence = ++stateSequence;
    $('retrySession').hidden = true;
    $('refresh').disabled = true;
    status('pageStatus', initial ? 'Checking your clinic session…' : 'Updating your clinic records…');
    try {
      const data = await api('state');
      if (sequence !== stateSequence) return;
      if (!data.user) { clearSession(); status('pageStatus'); return; }
      render(data); status('pageStatus');
    } catch (error) {
      if (sequence !== stateSequence) return;
      if (error.status === 401) { clearSession(); status('pageStatus'); }
      else { status('pageStatus', error.message + (activeUser ? ' Previously loaded records may be out of date.' : ''), true); $('retrySession').hidden = false; if (!activeUser) $('authArea').hidden = false; }
    } finally { if (sequence === stateSequence) $('refresh').disabled = false; }
  }
  $('loginTab').onclick = () => chooseMode('login');
  $('patientDemo').onclick = async () => {
    $('patientDemo').disabled = true;
    try { await api('patient_demo'); await loadState(); }
    catch (error) { status('authStatus', error.message, true); }
    finally { $('patientDemo').disabled = false; }
  };
  $('claimTab').onclick = () => chooseMode('claim');
  $('showPassword').onchange = e => $('password').type = e.target.checked ? 'text' : 'password';
  $('authForm').onsubmit = async e => {
    e.preventDefault(); if (busy) return;
    const identifier = $('identifier').value.trim();
    if (!identifier) return status('authStatus','Enter the email or phone number registered with your clinic.',true);
    busy = true;
    ['authSubmit','loginTab','claimTab'].forEach(id => $(id).disabled = true);
    status('authStatus',mode === 'claim' ? 'Connecting your patient account…' : 'Signing in…');
    try {
      const payload = {identifier,password:$('password').value};
      if (mode === 'claim') payload.claim_code = $('claimCode').value.trim();
      const result = await api(mode,payload);
      if (!result.user) throw new Error('Your clinic did not confirm sign-in. Please try again.');
      $('password').value = ''; $('claimCode').value = '';
      status('authStatus','Signed in. Loading your records…');
      await loadState();
      if (!$('dashboard').hidden) { status('authStatus'); $('patientName').focus(); }
      else status('authStatus','Sign-in completed, but records could not be loaded. Use “Try connecting again” above.',true);
    } catch (error) { status('authStatus',error.message,true); }
    finally { busy = false; ['authSubmit','loginTab','claimTab'].forEach(id => $(id).disabled = false); }
  };
  $('refresh').onclick = () => loadState();
  $('retrySession').onclick = () => loadState(true);
  $('logout').onclick = async () => {
    $('logout').disabled = true;
    try { await api('logout'); stateSequence++; clearSession(); status('pageStatus','You’re signed out.'); }
    catch (error) { handleError(error,'pageStatus'); }
    finally { $('logout').disabled = false; }
  };
  $('records').onclick = e => {
    const button = e.target.closest('[data-print]');
    if (!button) return;
    document.querySelectorAll('.consultation').forEach(el => el.classList.toggle('print-selected',el.dataset.record === button.dataset.print));
    window.print();
  };
  $('consultation').onchange = () => { $('acknowledge').checked = false; status('checkinStatus'); };
  $('checkinForm').onsubmit = async e => {
    e.preventDefault();
    const note = $('personalNote').value.trim(), acknowledged = $('acknowledge').checked, id = $('consultation').value;
    if (!id) return status('checkinStatus','Choose an approved consultation first.',true);
    if (!note && !acknowledged) return status('checkinStatus','Write an update or select the acknowledgment before sending.',true);
    const combined = [acknowledged ? 'Patient acknowledgment: I have read this doctor-approved record.' : '',note ? 'Personal update / pre-visit questions:\n' + note : ''].filter(Boolean).join('\n\n');
    if (combined.length > 4000) return status('checkinStatus','Please shorten your note to fit within 4,000 characters including the acknowledgment.',true);
    const sentSequence = stateSequence;
    $('checkinSubmit').disabled = true; status('checkinStatus','Sending your update…');
    try {
      const result = await api('checkin',{consultation_id:id,note:combined});
      if (sentSequence !== stateSequence) return;
      if (result.ok !== true) throw new Error('The clinic did not confirm that your note was saved. Please try again.');
      // Preserve any new text typed while the request was in flight.
      if ($('personalNote').value.trim() === note) $('personalNote').value = '';
      if ($('consultation').value === id) $('acknowledge').checked = false;
      status('checkinStatus','Saved to your clinic record. Your doctor can see your update and pre-visit questions.');
    } catch (error) { handleError(error,'checkinStatus'); }
    finally { $('checkinSubmit').disabled = !$('consultation').options.length; }
  };
  $('calendarExport').onclick = async () => {
    $('calendarExport').disabled = true; status('calendarStatus','Preparing your calendar export…');
    try {
      const response = await fetch('/api/clinic/calendar',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(25000)});
      if (!response.ok) { const error = new Error(response.status === 401 ? 'Your session has ended. Please sign in again.' : 'Could not export appointments. Please try again.'); error.status = response.status; throw error; }
      const content = await response.text();
      if (!content.includes('BEGIN:VCALENDAR')) throw new Error('The clinic did not return a calendar file. Try again or contact your clinic.');
      const url = URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));
      const link = document.createElement('a'); link.href = url; link.download = 'sehat-appointments.ics'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),10000);
      status('calendarStatus','Calendar file downloaded. Import it into your calendar; it will not update automatically.');
    } catch (error) { handleError(error,'calendarStatus'); }
    finally { $('calendarExport').disabled = false; }
  };
  window.addEventListener('beforeunload', e => { if (activeUser && $('personalNote').value.trim()) { e.preventDefault(); e.returnValue = ''; } });
  // Never persist authenticated records or notes in browser storage.
  window.addEventListener('pagehide', () => { stateSequence++; clearSession(); });
  window.addEventListener('pageshow', e => { if (e.persisted) loadState(true); });
  loadState(true);
})();
