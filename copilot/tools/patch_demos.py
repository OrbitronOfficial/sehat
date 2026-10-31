import re

APP_PATH = r"C:\Users\yashj\OneDrive\Documents\Claude\Tools\health-copilot-v2\public\app.js"

with open(APP_PATH, "r", encoding="utf-8") as f:
    code = f.read()

# Helper block for Demo 2 & Demo 3
HELPER_BLOCK = r'''
/* ==========================================================================
   DEMO MODES: Mode 1 (3D Patient), Mode 2 (Avanade Copilot), Mode 3 (Normal AI)
   ========================================================================== */
function getDemoMode() {
  const m = (location.search.match(/[?&]demo=([123])\b/) || [])[1];
  if (m) return m;
  try {
    const s = sessionStorage.getItem('sehat_demo_mode');
    if (s && ['1', '2', '3'].includes(s)) return s;
  } catch (e) {}
  return '1';
}

function setDemoMode(mode) {
  if (!['1', '2', '3'].includes(String(mode))) mode = '1';
  try { sessionStorage.setItem('sehat_demo_mode', mode); } catch (e) {}
  try {
    const u = new URL(location.href);
    u.searchParams.set('demo', mode);
    history.replaceState(null, '', u.toString());
  } catch (e) {}
  updateDemoPills();
  render();
}

function updateDemoPills() {
  const mode = getDemoMode();
  ['1', '2', '3'].forEach(m => {
    const el = document.getElementById('demoPill' + m);
    if (el) {
      if (m === mode) {
        el.classList.add('active');
        el.setAttribute('aria-pressed', 'true');
      } else {
        el.classList.remove('active');
        el.setAttribute('aria-pressed', 'false');
      }
    }
  });
}

function caiMarkdown(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const out = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;

  function flushTable() {
    if (!inTable) return '';
    let res = '<div style="overflow-x:auto; margin:14px 0"><table class="kv" style="width:100%; border-collapse:collapse; font-size:0.88rem;">';
    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i];
      const cells = row.split('|').slice(1, -1).map(c => c.trim());
      if (i === 1 && cells.every(c => /^[- :]+$/.test(c))) continue;
      const tag = (i === 0) ? 'th' : 'td';
      res += '<tr>' + cells.map(c => '<' + tag + ' style="padding:8px 12px; border:1px solid var(--line-light); text-align:left;">' + inlineMd(c) + '</' + tag + '>').join('') + '</tr>';
    }
    res += '</table></div>';
    inTable = false;
    tableRows = [];
    return res;
  }

  function inlineMd(str) {
    return str
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  }

  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].trim();
    if (s.startsWith('|') && s.endsWith('|')) {
      if (!inTable) {
        if (inList) { out.push('</ul>'); inList = false; }
        inTable = true;
      }
      tableRows.push(s);
      continue;
    } else if (inTable) {
      out.push(flushTable());
    }

    if (s.startsWith('* ') || s.startsWith('- ') || /^\d+\.\s/.test(s)) {
      if (!inList) {
        out.push('<ul style="margin:8px 0; padding-left:22px; line-height:1.65;">');
        inList = true;
      }
      const itemText = s.replace(/^[*\-\d\.]+\s+/, '');
      out.push('<li>' + inlineMd(itemText) + '</li>');
      continue;
    } else if (inList) {
      out.push('</ul>');
      inList = false;
    }

    if (s.startsWith('### ')) {
      out.push('<h3 style="margin:16px 0 8px; font-size:1.1rem; color:var(--ink);">' + inlineMd(s.slice(4)) + '</h3>');
    } else if (s === '---') {
      out.push('<hr style="margin:16px 0; border:0; border-top:1px solid var(--line-light);">');
    } else if (s) {
      out.push('<p style="margin:6px 0; line-height:1.65;">' + inlineMd(s) + '</p>');
    }
  }
  if (inTable) out.push(flushTable());
  if (inList) out.push('</ul>');
  return out.join('\n');
}

/* ==========================================================================
   DEMO 2: Avanade Health AI Copilot View
   ========================================================================== */
function viewAvanadeCopilot(I) {
  S.avTab = S.avTab || 'soap';

  // 1. Enterprise Hero
  const hero = `
    <div class="av-hero">
      <div class="av-hero-tag">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
        Avanade Health AI Copilot · Microsoft Azure Health Data Services
      </div>
      <h1>Be more with Copilot in Healthcare</h1>
      <p>Enterprise ambient clinical intelligence synthesizing Jay Tawri's multiformat records into automated SOAP charting, care team rounds, diagnostic telemetry, and pharmacovigilance safety shields.</p>
      <div class="av-trust-badges">
        <span class="av-badge"><span style="color:#10B981">●</span> Active Ambient Telemetry</span>
        <span class="av-badge">🛡️ HIPAA Compliant</span>
        <span class="av-badge">⚡ HL7 FHIR R4 Connected</span>
        <span class="av-badge">🔒 Azure Health Data Services Guardrails</span>
        <span class="av-badge">🩺 HITRUST Certified</span>
      </div>
    </div>
  `;

  // 2. Impact KPIs Ribbon
  const kpis = `
    <div class="av-kpis">
      <div class="av-kpi-card">
        <div class="av-kpi-num">94%</div>
        <div class="av-kpi-lbl">Charting Time Saved<br><span class="muted small">Ambient note generated in &lt; 2.4s</span></div>
      </div>
      <div class="av-kpi-card">
        <div class="av-kpi-num">0</div>
        <div class="av-kpi-lbl">Missed Contraindications<br><span class="muted small">Renal &amp; LFT safety verified</span></div>
      </div>
      <div class="av-kpi-card">
        <div class="av-kpi-num">2.8x</div>
        <div class="av-kpi-lbl">Faster Multidisciplinary Rounds<br><span class="muted small">Automated clinical briefings</span></div>
      </div>
      <div class="av-kpi-card">
        <div class="av-kpi-num">100%</div>
        <div class="av-kpi-lbl">Clinical Auditability<br><span class="muted small">Cited to source FHIR resources</span></div>
      </div>
    </div>
  `;

  // 3. Module Tabs Bar
  const tabs = `
    <div class="av-tabs-bar" role="tablist">
      <button type="button" class="av-tab-btn ${S.avTab === 'soap' ? 'active' : ''}" data-avtab="soap">
        <span>🩺</span> Ambient SOAP Note
      </button>
      <button type="button" class="av-tab-btn ${S.avTab === 'team' ? 'active' : ''}" data-avtab="team">
        <span>👥</span> Care Team Rounds
      </button>
      <button type="button" class="av-tab-btn ${S.avTab === 'telemetry' ? 'active' : ''}" data-avtab="telemetry">
        <span>📊</span> Diagnostic Telemetry
      </button>
      <button type="button" class="av-tab-btn ${S.avTab === 'safety' ? 'active' : ''}" data-avtab="safety">
        <span>🛡️</span> Pharmacovigilance Shield
      </button>
    </div>
  `;

  // 4. Tab Content
  let tabContent = '';
  if (S.avTab === 'soap') {
    tabContent = `
      <div class="stack" style="gap:16px">
        <div class="card" style="border-left: 4px solid #FF5800; background: linear-gradient(135deg, rgba(255,88,0,0.04), transparent)">
          <div class="row between" style="align-items:center; flex-wrap:wrap; gap:10px">
            <div>
              <div style="font-weight:700; font-size:1.05rem; color:var(--ink)">Ambient Clinical SOAP Note · Ready for EHR Export</div>
              <div class="muted small">Synthesized from 4 clinical records (CityCare Diagnostic Labs &amp; Dr. Anita Mehta Rx) · Per CMS / HL7 FHIR documentation standards</div>
            </div>
            <div class="row" style="gap:8px">
              <button type="button" class="btn small primary" id="btnCopySoap" style="background:#FF5800; border-color:#FF5800">📋 Copy to EHR Clipboard</button>
              <button type="button" class="btn small secondary" onclick="alert('FHIR R4 Composition resource generated and staged for Cerner/Epic/ABDM sync.')">⚡ Export FHIR Bundle</button>
            </div>
          </div>
        </div>

        <div class="av-soap-grid">
          <!-- Subjective -->
          <div class="av-soap-box">
            <div class="av-soap-head">
              <div class="row" style="gap:10px; align-items:center">
                <span class="av-soap-letter let-s">S</span>
                <div>
                  <strong style="font-size:1.05rem">Subjective</strong>
                  <div class="muted small">Patient History &amp; Reported Symptoms</div>
                </div>
              </div>
              <span class="tag green">Verified</span>
            </div>
            <div class="small" style="line-height:1.65; color:var(--ink)">
              <p><strong>Chief Complaint:</strong> Routine follow-up for Type 2 Diabetes Mellitus; follow-up after resolution of seasonal cough &amp; viral symptoms.</p>
              <p><strong>History of Present Illness:</strong> Patient reports regular compliance with oral Metformin 500 mg. No reported hypoglycemic symptoms, syncope, or gastrointestinal distress. Energy levels stable; appetite normal.</p>
              <p><strong>Allergies:</strong> No known drug allergies (NKDA).</p>
            </div>
          </div>

          <!-- Objective -->
          <div class="av-soap-box">
            <div class="av-soap-head">
              <div class="row" style="gap:10px; align-items:center">
                <span class="av-soap-letter let-o">O</span>
                <div>
                  <strong style="font-size:1.05rem">Objective</strong>
                  <div class="muted small">Diagnostic Findings &amp; Clinical Telemetry</div>
                </div>
              </div>
              <span class="tag amber">2 Attention Items</span>
            </div>
            <div class="small" style="line-height:1.65; color:var(--ink)">
              <ul style="margin:0; padding-left:18px">
                <li><strong>Fasting Blood Sugar:</strong> <span class="mono" style="color:#F59E0B; font-weight:700">118 mg/dL</span> (Ref: 70–100 mg/dL · Impaired fasting glucose)</li>
                <li><strong>HbA1c:</strong> <span class="mono" style="font-weight:700">6.9%</span> (Target for controlled diabetes: &lt; 7.0%)</li>
                <li><strong>Liver Enzymes (SGPT / ALT):</strong> <span class="mono" style="color:#EF4444; font-weight:700">88 U/L</span> (Ref: 0–45 U/L · ⚠️ 1.95x Upper Limit)</li>
                <li><strong>Serum Creatinine:</strong> <span class="mono" style="font-weight:700; color:#10B981">1.0 mg/dL</span> (Normal renal clearance, eGFR &gt;90 mL/min)</li>
                <li><strong>Platelet Count:</strong> <span class="mono" style="font-weight:700; color:#10B981">240,000 /µL</span> (Normal physiological recovery)</li>
              </ul>
            </div>
          </div>

          <!-- Assessment -->
          <div class="av-soap-box">
            <div class="av-soap-head">
              <div class="row" style="gap:10px; align-items:center">
                <span class="av-soap-letter let-a">A</span>
                <div>
                  <strong style="font-size:1.05rem">Assessment</strong>
                  <div class="muted small">Copilot Clinical Synthesis &amp; Diagnoses</div>
                </div>
              </div>
              <span class="tag blue">AI Decision Support</span>
            </div>
            <div class="small" style="line-height:1.65; color:var(--ink)">
              <p><strong>1. Type 2 Diabetes Mellitus (ICD-10: E11.9):</strong> Fair glycemic control (HbA1c 6.9%) on single-agent Metformin 500 mg. Fasting blood sugar slightly elevated at 118 mg/dL.</p>
              <p><strong>2. Isolated Transaminitis (ICD-10: R74.0):</strong> Elevated SGPT (88 U/L) without clinical jaundice. High probability of metabolic non-alcoholic fatty liver (NAFLD) given diabetic background.</p>
              <p><strong>3. Pharmacological Safety:</strong> Normal renal function (Creatinine 1.0) confirms Metformin can be safely maintained without lactic acidosis risk.</p>
            </div>
          </div>

          <!-- Plan -->
          <div class="av-soap-box">
            <div class="av-soap-head">
              <div class="row" style="gap:10px; align-items:center">
                <span class="av-soap-letter let-p">P</span>
                <div>
                  <strong style="font-size:1.05rem">Plan &amp; Orders</strong>
                  <div class="muted small">Therapeutic Protocol &amp; Care Directives</div>
                </div>
              </div>
              <span class="tag green">Actionable</span>
            </div>
            <div class="small" style="line-height:1.65; color:var(--ink)">
              <p><strong>1. Medications:</strong> Maintain Metformin Hydrochloride 500 mg once daily post-dinner.</p>
              <p><strong>2. Diagnostic Workup:</strong> Order Ultrasound Whole Abdomen to rule out hepatic steatosis; schedule repeat LFT (SGPT/SGOT) + Fasting Lipid Profile in 6 weeks.</p>
              <p><strong>3. Lifestyle Guidance:</strong> Restrict dietary simple carbohydrates (&lt;130g/day); brisk walking 30 min/day (150 min/wk).</p>
              <p><strong>4. Care Coordination:</strong> Notify Dr. Anita Mehta &amp; Nutritionist Sunita Sharma via Copilot Care Handover.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (S.avTab === 'team') {
    tabContent = `
      <div class="stack" style="gap:16px">
        <div class="card" style="border-left: 4px solid #8B5CF6">
          <div class="row between" style="align-items:center">
            <div>
              <div style="font-weight:700; font-size:1.05rem; color:var(--ink)">Multidisciplinary Care Team Rounds &amp; Virtual Handovers</div>
              <div class="muted small">Synchronized clinical collaboration powered by Microsoft 365 Copilot &amp; Azure Health Data Services</div>
            </div>
            <button type="button" class="btn small primary" style="background:#8B5CF6; border-color:#8B5CF6" onclick="alert('Virtual care round summary dispatched to Dr. Anita Mehta and care coordinators.')">🚀 Trigger Care Handover</button>
          </div>
        </div>

        <div class="av-team-grid">
          <div class="av-team-card">
            <div class="av-team-avatar">AM</div>
            <div style="flex:1">
              <strong>Dr. Anita Mehta, MD</strong>
              <div class="muted small">Lead Attending Physician · Internal Medicine</div>
              <div style="margin-top:6px"><span class="tag green">Signed Ambulatory Plan</span></div>
            </div>
          </div>

          <div class="av-team-card">
            <div class="av-team-avatar" style="background:linear-gradient(135deg, #06B6D4, #3B82F6)">SL</div>
            <div style="flex:1">
              <strong>Dr. Sarah Lin, MD</strong>
              <div class="muted small">Endocrinologist · Sub-Specialist</div>
              <div style="margin-top:6px"><span class="tag blue">Reviewed HbA1c 6.9%</span></div>
            </div>
          </div>

          <div class="av-team-card">
            <div class="av-team-avatar" style="background:linear-gradient(135deg, #10B981, #059669)">SS</div>
            <div style="flex:1">
              <strong>Sunita Sharma, RN</strong>
              <div class="muted small">Care Coordinator &amp; Diabetic Educator</div>
              <div style="margin-top:6px"><span class="tag green">Nutrition Outreach Set</span></div>
            </div>
          </div>

          <div class="av-team-card">
            <div class="av-team-avatar" style="background:linear-gradient(135deg, #F59E0B, #D97706)">RK</div>
            <div style="flex:1">
              <strong>Rajesh Kumar, PharmD</strong>
              <div class="muted small">Clinical Pharmacist · Drug Safety</div>
              <div style="margin-top:6px"><span class="tag green">Renal Clearance Cleared</span></div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-bottom:12px">Active Clinical Checklist for Jay Tawri</h3>
          <ul class="list" style="margin:0">
            <li style="padding:10px 0; border-bottom:1px solid var(--line-light)">
              <label style="display:flex; align-items:center; gap:12px; cursor:pointer">
                <input type="checkbox" checked style="width:18px; height:18px; accent-color:#10B981">
                <span><strong>Metformin 500mg Renal Clearance Audit:</strong> Serum Creatinine verified 1.0 mg/dL (eGFR normal).</span>
              </label>
            </li>
            <li style="padding:10px 0; border-bottom:1px solid var(--line-light)">
              <label style="display:flex; align-items:center; gap:12px; cursor:pointer">
                <input type="checkbox" checked style="width:18px; height:18px; accent-color:#10B981">
                <span><strong>Post-Viral Platelet Recovery:</strong> Rebounded to 240,000 /µL, no thrombocytopenia recurrence.</span>
              </label>
            </li>
            <li style="padding:10px 0; border-bottom:1px solid var(--line-light)">
              <label style="display:flex; align-items:center; gap:12px; cursor:pointer">
                <input type="checkbox" style="width:18px; height:18px; accent-color:#FF5800">
                <span><strong>Hepatic Transaminitis Workup:</strong> Schedule repeat LFT and Ultrasound Whole Abdomen for SGPT 88 U/L.</span>
              </label>
            </li>
            <li style="padding:10px 0">
              <label style="display:flex; align-items:center; gap:12px; cursor:pointer">
                <input type="checkbox" style="width:18px; height:18px; accent-color:#FF5800">
                <span><strong>Low Glycemic Index Nutrition Counseling:</strong> Sunita Sharma to schedule 1:1 consultation.</span>
              </label>
            </li>
          </ul>
        </div>
      </div>
    `;
  } else if (S.avTab === 'telemetry') {
    tabContent = `
      <div class="stack" style="gap:16px">
        <div class="card" style="border-left: 4px solid #06B6D4">
          <div style="font-weight:700; font-size:1.05rem; color:var(--ink)">Real-time Diagnostic Biomarker Telemetry</div>
          <div class="muted small">Extracted from CityCare Diagnostic Pathology Report (22-Sep-2026) · Synthesized with historical records</div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px">
          <div class="card" style="border-top:3px solid #F59E0B">
            <div class="row between">
              <strong>Fasting Blood Sugar</strong>
              <span class="tag amber">Attention</span>
            </div>
            <div style="font-size:2.2rem; font-weight:800; font-family:var(--mono); margin:8px 0; color:#F59E0B">118 <span style="font-size:1rem; color:var(--muted)">mg/dL</span></div>
            <div class="small muted">Reference: 70 – 100 mg/dL</div>
            <div class="small" style="margin-top:10px; padding:8px 10px; background:rgba(245,158,11,0.08); border-radius:8px">
              💡 <strong>Copilot Insight:</strong> Impaired fasting glucose. Reflects dawn phenomenon; well-managed by continued bedtime Metformin.
            </div>
          </div>

          <div class="card" style="border-top:3px solid #EF4444">
            <div class="row between">
              <strong>SGPT / ALT (Liver Enzyme)</strong>
              <span class="tag red">Elevated 1.95x</span>
            </div>
            <div style="font-size:2.2rem; font-weight:800; font-family:var(--mono); margin:8px 0; color:#EF4444">88 <span style="font-size:1rem; color:var(--muted)">U/L</span></div>
            <div class="small muted">Reference: 0 – 45 U/L</div>
            <div class="small" style="margin-top:10px; padding:8px 10px; background:rgba(239,68,68,0.08); border-radius:8px">
              ⚠️ <strong>Copilot Insight:</strong> Asymptomatic transaminitis. Most common differential: Non-Alcoholic Fatty Liver Disease (NAFLD). Recommend hepatic ultrasound.
            </div>
          </div>

          <div class="card" style="border-top:3px solid #10B981">
            <div class="row between">
              <strong>HbA1c (Glycated Hemoglobin)</strong>
              <span class="tag green">Within Target</span>
            </div>
            <div style="font-size:2.2rem; font-weight:800; font-family:var(--mono); margin:8px 0; color:#10B981">6.9 <span style="font-size:1rem; color:var(--muted)">%</span></div>
            <div class="small muted">Diabetic Goal: &lt; 7.0%</div>
            <div class="small" style="margin-top:10px; padding:8px 10px; background:rgba(16,185,129,0.08); border-radius:8px">
              ✅ <strong>Copilot Insight:</strong> Patient is meeting therapeutic target on 500mg Metformin monotherapy.
            </div>
          </div>

          <div class="card" style="border-top:3px solid #10B981">
            <div class="row between">
              <strong>Serum Creatinine</strong>
              <span class="tag green">Optimal Clearance</span>
            </div>
            <div style="font-size:2.2rem; font-weight:800; font-family:var(--mono); margin:8px 0; color:#10B981">1.0 <span style="font-size:1rem; color:var(--muted)">mg/dL</span></div>
            <div class="small muted">Reference: 0.7 – 1.3 mg/dL</div>
            <div class="small" style="margin-top:10px; padding:8px 10px; background:rgba(16,185,129,0.08); border-radius:8px">
              🛡️ <strong>Copilot Insight:</strong> Normal glomerular filtration clearance. Confirms complete renal safety for current prescription.
            </div>
          </div>

          <div class="card" style="border-top:3px solid #3B82F6">
            <div class="row between">
              <strong>Platelet Count</strong>
              <span class="tag blue">Normal Rebound</span>
            </div>
            <div style="font-size:2.2rem; font-weight:800; font-family:var(--mono); margin:8px 0; color:#3B82F6">240,000 <span style="font-size:1rem; color:var(--muted)">/µL</span></div>
            <div class="small muted">Reference: 150,000 – 450,000 /µL</div>
            <div class="small" style="margin-top:10px; padding:8px 10px; background:rgba(59,130,246,0.08); border-radius:8px">
              ✅ <strong>Copilot Insight:</strong> Full recovery to physiological baseline following prior viral symptom episode.
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (S.avTab === 'safety') {
    tabContent = `
      <div class="stack" style="gap:16px">
        <div class="card" style="border-left: 4px solid #10B981">
          <div style="font-weight:700; font-size:1.05rem; color:var(--ink)">Avanade Pharmacovigilance &amp; Cross-Drug Safety Shield</div>
          <div class="muted small">Continuous algorithmic monitoring of drug-disease interactions, renal clearance thresholds, and metabolic safety</div>
        </div>

        <div class="card">
          <div class="row between" style="margin-bottom:12px; align-items:center">
            <div>
              <h3 style="margin:0">Active Monitored Regimen: Metformin Hydrochloride 500 mg</h3>
              <div class="muted small">Prescribed by Dr. Anita Mehta · Oral administration, once daily post-dinner</div>
            </div>
            <span class="tag green" style="font-size:0.9rem; padding:6px 12px">🛡️ Zero Critical Conflicts</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px; margin-top:16px">
            <div style="padding:14px; border-radius:12px; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2)">
              <div style="font-weight:700; color:#10B981; margin-bottom:4px">✅ Renal Clearance Safety Shield</div>
              <p class="small" style="margin:0; line-height:1.5">Metformin clearance is 100% renal. Patient's serum creatinine is 1.0 mg/dL (estimated GFR &gt; 90 mL/min). Clinical risk of lactic acidosis is negligible (&lt; 3 cases per 100,000 patient-years).</p>
            </div>

            <div style="padding:14px; border-radius:12px; background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2)">
              <div style="font-weight:700; color:#F59E0B; margin-bottom:4px">⚠️ Hepatic Transaminitis Advisory</div>
              <p class="small" style="margin:0; line-height:1.5">SGPT is 88 U/L. While Metformin is not hepatotoxic at 500mg, avoid dosage escalation to 1000mg+ until hepatic ultrasound and repeat liver profile are confirmed stable.</p>
            </div>

            <div style="padding:14px; border-radius:12px; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2)">
              <div style="font-weight:700; color:#10B981; margin-bottom:4px">✅ Cross-Drug Interaction Screen</div>
              <p class="small" style="margin:0; line-height:1.5">Cross-referenced against Paracetamol, seasonal antihistamines, and multivitamins. No cytochrome P450 CYP3A4 inhibitors or contraindicating co-prescriptions.</p>
            </div>

            <div style="padding:14px; border-radius:12px; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2)">
              <div style="font-weight:700; color:#10B981; margin-bottom:4px">✅ Hypoglycemia Risk Profile</div>
              <p class="small" style="margin:0; line-height:1.5">Metformin is an insulin sensitizer (does not stimulate pancreatic beta-cell insulin secretion). Monotherapy carries near-zero risk of symptomatic hypoglycemia.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="stack" style="gap:24px">
      ${hero}
      ${kpis}
      ${tabs}
      ${tabContent}
    </div>
  `;
}

/* ==========================================================================
   DEMO 3: Conversational AI Workspace (ChatGPT / Claude / Gemini Style)
   ========================================================================== */
function caiSubmitPrompt(promptText) {
  if (!promptText || !promptText.trim()) return;
  const q = promptText.trim();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  S.caiMessages = S.caiMessages || [];
  S.caiMessages.push({
    role: 'user',
    time,
    text: q
  });

  const lower = q.toLowerCase();
  let thought = '';
  let reply = '';

  if (lower.includes('sgpt') || lower.includes('liver') || lower.includes('alt')) {
    thought = `1. Searched lab reports for hepatic biomarkers: SGPT / ALT found at 88 U/L (Reference 0–45 U/L).
2. Evaluated physiological context: 1.95x elevation in an ambulatory patient without clinical jaundice.
3. Cross-referenced medications: Metformin 500mg has no hepatotoxicity profile; patient is not taking hepatotoxic NSAIDs.
4. Primary differential: Metabolic dysfunction-associated steatotic liver disease (MASLD / NAFLD) linked to Type 2 diabetes.
5. Synthesized layman explanation emphasizing reassurance, ultrasound screening, and dietary steps.`;
    reply = `### Understanding Your SGPT Level (88 U/L) in Plain English

**What is SGPT?**
SGPT (also called ALT) is an enzyme found mainly inside your liver cells. When liver cells experience mild irritation, extra fat buildup, or inflammation, they release some of this enzyme into your bloodstream.

* **Your Result:** **88 U/L**
* **Standard Healthy Range:** **0 to 45 U/L**
* **What this means:** Your level is roughly **twice the normal limit**. This is a **mild-to-moderate elevation**, not an acute medical emergency.

---

### Common Causes & Context for You
1. **Fatty Liver (Metabolic Steatosis):** Because you have Type 2 Diabetes, it is very common for excess triglycerides or sugars to temporarily store as microscopic fat droplets in liver tissue.
2. **Post-viral Recovery:** Your recent seasonal viral episode can also cause transient enzyme elevations that normalize over 4–8 weeks.
3. **Medication Check:** Your **Metformin 500mg** is cleared through your kidneys (not your liver) and is **safe** to continue.

---

### Practical Next Steps to Discuss with Dr. Anita Mehta:
* **Ultrasound Whole Abdomen:** A simple 10-minute scan to confirm if mild fatty liver is present.
* **Repeat LFT in 6–8 Weeks:** To track if the numbers are returning to the normal zone.
* **Dietary Focus:** Cutting out sugary drinks, refined flour, and deep-fried foods can significantly reduce liver fat within weeks.`;
  } else if (lower.includes('diet') || lower.includes('carb') || lower.includes('food') || lower.includes('eat')) {
    thought = `1. Analyzed metabolic parameters: Fasting glucose 118 mg/dL, HbA1c 6.9%, SGPT 88 U/L.
2. Formulated nutritional prescription targeting simultaneous glycemic stabilization and hepatic steatosis reversal.
3. Designed practical meal structure aligned with Indian dietary preferences.`;
    reply = `### Personalized Nutritional Plan for Jay (HbA1c 6.9% & SGPT 88 U/L)

To lower fasting blood sugar and reduce liver fat simultaneously, the gold standard is a **low-glycemic, anti-inflammatory Mediterranean/DASH-style dietary approach**:

---

#### 🟢 Foods to Prioritize Every Day
* **High-Fiber Complex Carbs:** Whole pulses (moong, chana, rajma), steel-cut oats, quinoa, or millets (jowar, ragi) instead of white polished rice.
* **Leafy Greens & Sulfur Vegetables:** Spinach (palak), methi, broccoli, cabbage, cauliflower (these supply glutathione precursors which support liver detoxification).
* **Healthy Fats:** 5–6 soaked almonds, 2 walnuts, olive oil or cold-pressed mustard oil in moderation (rich in Omega-3 & monounsaturated fats).
* **Lean Proteins:** Tofu, paneer, sprouts, eggs, or skinless chicken/fish to preserve muscle and prevent glucose spikes.

---

#### 🔴 Foods to Strictly Minimize
* **Liquid Sugars:** Fruit juices, sweetened sodas, sweetened chai/coffee (fructose directly converts to liver fat).
* **Refined Flours & Trans Fats:** Maida breads, bakery biscuits, samosas, packaged snacks.
* **Late-night Heavy Meals:** Finish dinner by 8:00 PM; Metformin 500mg works best when not competing with heavy late-night carb loads.

---

#### 🚶 Exercise Synergy
* **The "10-Minute Post-Meal Walk":** Walking briskly for 10–15 minutes after lunch and dinner drops postprandial glucose by 20–30% and accelerates liver fat burning.`;
  } else if (lower.includes('metformin') || lower.includes('damage') || lower.includes('kidney') || lower.includes('renal')) {
    thought = `1. Pharmacovigilance screening: Metformin Hydrochloride 500mg oral OD.
2. Verified renal clearance: Serum Creatinine 1.0 mg/dL -> estimated GFR >90 mL/min (normal).
3. Evaluated hepatic contraindications: Mild transaminitis without hepatic failure is NOT a contraindication.
4. Formulated clear safety reassurance backed by pharmacological evidence.`;
    reply = `### Pharmacovigilance Assessment: Metformin 500 mg

**Direct Answer:** **No, Metformin 500 mg does not cause liver damage**, nor is it the cause of your elevated SGPT (88 U/L).

---

### Pharmacological Facts
1. **Kidney Clearance:** Metformin is **not metabolized by the liver**. It is filtered and excreted almost entirely through your kidneys.
2. **Renal Safety Confirmed:** Your **Serum Creatinine is 1.0 mg/dL**, which corresponds to an estimated glomerular filtration rate (eGFR) over **90 mL/min**. This confirms your kidneys are clearing the medication normally and safely.
3. **Lactic Acidosis Risk:** Clinical studies show that at 500 mg daily with normal renal function, the risk of lactic acidosis is practically zero (<3 in 100,000 patient-years).
4. **Protective Effects:** In many clinical trials, Metformin actually **improves** fatty liver disease over time by increasing insulin sensitivity in hepatic tissue.

---

**Clinical Takeaway:** You should **not stop taking your Metformin 500 mg** without Dr. Anita Mehta's guidance, as it is keeping your HbA1c at 6.9%.`;
  } else if (lower.includes('email') || lower.includes('draft') || lower.includes('visit') || lower.includes('doctor') || lower.includes('brief')) {
    thought = `1. Gathered patient context: Jay Tawri (28 M), Type 2 Diabetes, Metformin 500mg OD.
2. Highlighted key findings: Fasting glucose 118, SGPT 88, HbA1c 6.9%, Creatinine 1.0.
3. Drafted a structured, professional physician brief ready to copy or email.`;
    reply = `### Draft Physician Consultation Brief for Dr. Anita Mehta

**Patient:** Jay Tawri (28y Male) · **Date of Review:** 24 October 2026
**Current Medication:** Metformin Hydrochloride 500 mg OD (Post-dinner)

---

**Dear Dr. Mehta,**

I am writing to share my recent lab report from CityCare Diagnostic Pathology (dated 22-Sep-2026) ahead of our upcoming consultation.

**Current Lab Summary:**
* **Fasting Blood Sugar:** 118 mg/dL *(Reference: 70–100 mg/dL)*
* **HbA1c:** 6.9% *(Diabetic target: <7.0%)*
* **SGPT / ALT:** 88 U/L *(Reference: 0–45 U/L — 1.95x elevated)*
* **Serum Creatinine:** 1.0 mg/dL *(Normal renal clearance)*
* **Platelet Count:** 240,000 /µL *(Normal recovery post seasonal cough)*

**Questions for Our Consultation:**
1. Given the elevated SGPT (88 U/L), would you recommend an **Ultrasound of the Whole Abdomen** to check for fatty liver (steatosis)?
2. Should I continue Metformin 500 mg at the current dosage, or do you recommend repeating the LFT and Lipid profile in 6 weeks?
3. Are there specific dietary or lifestyle modifications you would advise to bring both fasting sugar and liver enzymes into the optimal range?

Thank you,  
**Jay Tawri**`;
  } else {
    thought = `1. Synthesized user inquiry: "${q}".
2. Cross-referenced Jay Tawri's health profile: 28y M, Type 2 DM (HbA1c 6.9%, Fasting Glucose 118), SGPT 88 U/L, Creatinine 1.0 mg/dL, Metformin 500mg.
3. Provided structured, evidence-based clinical guidance.`;
    reply = `### Clinical Copilot Response

Regarding your query: *"**${esc(q)}**"*

Based on Jay Tawri's clinical records (CityCare Diagnostic Pathology and Dr. Anita Mehta's prescription):

* **Current Health Status:** Type 2 Diabetes is well-controlled on Metformin 500 mg (HbA1c 6.9%). Platelets have recovered to a normal 240,000 /µL.
* **Areas for Monitoring:** Fasting blood sugar is slightly elevated at 118 mg/dL, and SGPT (liver enzyme) is 88 U/L (mild elevation requiring ultrasound evaluation).
* **Medication Safety:** Normal serum creatinine (1.0 mg/dL) confirms complete renal safety for Metformin continuation.

Feel free to ask for specific diet guidelines, medication interactions, or a summary for your doctor!`;
  }

  S.caiMessages.push({
    role: 'assistant',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    thought,
    text: reply
  });

  render();
}

function viewConversationalAI(I) {
  S.caiThread = S.caiThread || 't1';
  if (!S.caiMessages || !S.caiMessages.length) {
    S.caiMessages = [
      {
        role: 'user',
        time: '10:14 AM',
        text: 'Can you summarize Jay Tawri\'s latest medical status, abnormal lab values, and what adjustments or questions we should ask Dr. Anita Mehta?'
      },
      {
        role: 'assistant',
        time: '10:14 AM',
        thought: `1. Extracted and cross-correlated 4 primary clinical records from Jay Tawri's encrypted vault.
2. Verified CityCare Diagnostic Pathology Report (22 Sep 2026):
   • Fasting Blood Sugar: 118 mg/dL (Abnormal - Pre-diabetic baseline cutoff 100 mg/dL).
   • SGPT / ALT: 88 U/L (Elevated - 1.95x upper limit of normal 45 U/L).
   • HbA1c: 6.9% (Fair diabetic control, within ADA therapeutic target <7.0%).
   • Serum Creatinine: 1.0 mg/dL (Optimal renal clearance, validates Metformin safety).
   • Platelet Count: 240,000 /µL (Recovered, normal physiological range).
3. Evaluated Dr. Anita Mehta Prescription (10 Feb 2026):
   • Metformin Hydrochloride 500 mg OD (Oral, once daily post-dinner).
4. Formulated actionable clinical recommendations prioritizing liver enzyme monitoring and physician questions.`,
        text: `### Clinical Executive Summary: Jay Tawri (28y Male)

Jay's overall health profile demonstrates **stable glycemic management** on monotherapy, alongside an **isolated liver enzyme elevation (SGPT 88 U/L)** that warrants clinical follow-up with Dr. Anita Mehta.

---

### 🔍 Key Diagnostic Findings

| Diagnostic Biomarker | Jay's Value | Standard Clinical Range | Status / Copilot Insight | Source Document |
| :--- | :--- | :--- | :--- | :--- |
| **Fasting Blood Sugar** | **118 mg/dL** | 70 – 100 mg/dL | ⚠️ **Mild Elevation** (Impaired fasting glucose) | *CityCare Labs 22-Sep* |
| **SGPT / ALT** | **88 U/L** | 0 – 45 U/L | ⚠️ **Elevated 1.95x** (Suggestive of metabolic steatosis / NAFLD) | *CityCare Labs 22-Sep* |
| **HbA1c** | **6.9%** | &lt; 7.0% (Diabetic target) | ✅ **Controlled** (Target achieved on Metformin 500mg) | *CityCare Labs 22-Sep* |
| **Serum Creatinine** | **1.0 mg/dL** | 0.7 – 1.3 mg/dL | ✅ **Normal Clearance** (Confirms safe Biguanide use) | *CityCare Labs 22-Sep* |
| **Platelets** | **240,000 /µL** | 150k – 450k /µL | ✅ **Normal** (Rebounded from previous seasonal illness) | *CityCare Labs 22-Sep* |

---

### 💊 Current Medication Assessment
* **Metformin 500 mg (1 tab daily):** Safe to continue. Patient's normal creatinine (1.0 mg/dL) provides clear renal safety against lactic acidosis.

---

### 📋 Recommended Discussion Points for Dr. Anita Mehta
1. **Ultrasound Screening:** Request an Ultrasound of the Whole Abdomen to check for mild hepatic steatosis (fatty liver) correlating with SGPT 88 U/L.
2. **Repeat LFT Timeline:** Ask if repeat SGPT and a Fasting Lipid Profile should be performed in 6 weeks.
3. **Lifestyle Adjustments:** Maintain a lower glycemic index diet (&lt;130g carbs/day) and 30 minutes of brisk daily walking to simultaneously reduce both fasting sugar and liver triglycerides.`
      }
    ];
  }

  const threads = [
    { id: 't1', title: 'HbA1c & Fasting Glucose Plan', time: 'Today' },
    { id: 't2', title: 'Metformin 500mg Renal Clearance', time: 'Yesterday' },
    { id: 't3', title: 'CityCare Lab Diagnostic Summary', time: '22 Sep' },
    { id: 't4', title: 'Platelet Rebound from Viral Illness', time: '15 Sep' },
    { id: 't5', title: 'Prep for Dr. Anita Mehta Visit', time: '10 Feb' }
  ];

  const threadListHTML = threads.map(t => `
    <button type="button" class="cai-thread-item ${S.caiThread === t.id ? 'active' : ''}" data-thread="${t.id}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${t.title}</span>
    </button>
  `).join('');

  const msgsHTML = S.caiMessages.map(m => {
    const isUser = m.role === 'user';
    const avatar = isUser ? '<div class="cai-avatar u-av">JT</div>' : '<div class="cai-avatar ai-av">✨</div>';
    let body = '';
    if (m.thought) {
      body += `
        <details class="cai-thought-box" open>
          <summary>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a6 6 0 0 0-6 6c0 2.22 1.21 4.16 3 5.2V17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3.8c1.79-1.04 3-2.98 3-5.2a6 6 0 0 0-6-6zM10 21h4"></path></svg>
            Clinical Reasoning &amp; Audit Trail
          </summary>
          <div class="cai-thought-content">${esc(m.thought).replace(/\n/g, '<br>')}</div>
        </details>
      `;
    }
    body += caiMarkdown(m.text);
    return `
      <div class="cai-msg-row ${isUser ? 'user' : 'ai'}">
        ${avatar}
        <div class="cai-bubble">
          <div class="row between" style="margin-bottom:8px">
            <strong style="font-size:0.88rem; color:${isUser ? '#3B82F6' : '#8B5CF6'}">${isUser ? 'Jay Tawri (Patient)' : 'Medical AI Copilot'}</strong>
            <span class="muted small">${m.time || ''}</span>
          </div>
          <div class="cai-text">${body}</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="cai-workspace">
      <!-- Sidebar -->
      <aside class="cai-sidebar">
        <button type="button" class="cai-new-btn" id="caiNewChatBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          New Consultation
        </button>

        <div class="cai-patient-capsule">
          <strong>Jay Tawri</strong>
          <div class="muted small">28y · Male · ABHA: 91-8273-9912</div>
          <div class="small" style="color:#8B5CF6; font-weight:700; margin-top:4px">● 4 Encrypted Vault Records Loaded</div>
        </div>

        <div style="font-size:0.78rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); margin-top:8px; padding-left:6px">Recent Clinical Threads</div>
        <div class="cai-thread-list">
          ${threadListHTML}
        </div>

        <div style="margin-top:auto; padding-top:14px; border-top:1px solid var(--line-light); font-size:0.8rem; color:var(--muted); display:flex; align-items:center; gap:6px">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981"></span>
          <span>Claude 3.5 Sonnet / Gemini 2.5 Pro Medical Core</span>
        </div>
      </aside>

      <!-- Main Chat Area -->
      <main class="cai-chat-area">
        <div class="cai-header-bar">
          <div class="cai-model-tag">
            <span class="sparkle">✨</span>
            <span>Conversational Health Copilot</span>
            <span class="tag purple" style="font-size:0.75rem; padding:2px 8px">Standard AI Mode</span>
          </div>
          <div class="row" style="gap:8px">
            <button type="button" class="btn small ghost" id="caiClearBtn" title="Clear conversation">🗑️ Clear</button>
            <button type="button" class="btn small secondary" onclick="alert('Exporting clinical conversation brief as signed summary.')">📄 Export Brief</button>
          </div>
        </div>

        <div class="cai-stream" id="caiStream">
          ${msgsHTML}
        </div>

        <!-- Prompt Starter Pills -->
        <div style="margin-top:12px">
          <div style="font-size:0.82rem; font-weight:700; color:var(--muted); margin-bottom:8px">Suggested Clinical Queries:</div>
          <div class="cai-starters">
            <button type="button" class="cai-starter-btn" data-prompt="Explain SGPT 88 U/L in plain English for Jay">
              <span>🔬</span>
              <span>Explain SGPT 88 U/L in plain English</span>
            </button>
            <button type="button" class="cai-starter-btn" data-prompt="What dietary plan is best for HbA1c 6.9% and elevated liver enzymes?">
              <span>🥗</span>
              <span>Personalized low-carb diet for Jay</span>
            </button>
            <button type="button" class="cai-starter-btn" data-prompt="Can Metformin 500 mg cause liver damage or raise SGPT?">
              <span>💊</span>
              <span>Does Metformin damage the liver or kidneys?</span>
            </button>
            <button type="button" class="cai-starter-btn" data-prompt="Draft a physician consultation brief to email Dr. Anita Mehta">
              <span>📋</span>
              <span>Draft visit consultation brief for Dr. Mehta</span>
            </button>
          </div>
        </div>

        <!-- Sticky Floating Dock -->
        <div class="cai-input-dock">
          <form id="caiForm" class="cai-input-row">
            <button type="button" class="btn ghost" style="padding:6px; border:0" title="Attach Lab Report or Prescription" onclick="alert('Select a prescription or lab report PDF/image to upload and parse.')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            </button>
            <input type="text" id="caiInput" placeholder="Ask anything about Jay's labs, medications, or doctor visits..." autocomplete="off">
            <button type="submit" class="cai-send-btn" title="Send query" aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>
      </main>
    </div>
  `;
}
'''

# 1. Insert helper block right before function viewHealth()
target_before_health = "function viewHealth() {"
assert target_before_health in code, "Could not find function viewHealth() {"

code = code.replace(target_before_health, HELPER_BLOCK + "\n" + target_before_health, 1)

# 2. Inside viewHealth(), route based on getDemoMode()
target_inside_health = "  const I = g.data, ov = S.overview[lang];"
assert target_inside_health in code, "Could not find target_inside_health in code"

routing_code = """  const I = g.data, ov = S.overview[lang];
  const demoMode = getDemoMode();
  if (demoMode === '2') return headV + viewAvanadeCopilot(I);
  if (demoMode === '3') return viewConversationalAI(I);"""

code = code.replace(target_inside_health, routing_code, 1)

# 3. Inside applyStatic(), call updateDemoPills()
target_apply_static = "function applyStatic() {"
assert target_apply_static in code, "Could not find function applyStatic() {"
code = code.replace(target_apply_static, "function applyStatic() {\n  updateDemoPills();", 1)

# 4. In demoFromLink, accept demo=1, demo=2, or demo=3
target_demo_link = "if (!/[?&]demo=1\\b/.test(location.search)) return;"
assert target_demo_link in code, "Could not find target_demo_link"
replacement_demo_link = """if (!/[?&]demo=[123]\\b/.test(location.search)) return;
  const demoMatch = (location.search.match(/[?&]demo=([123])\\b/) || [])[1];
  if (demoMatch) {
    try { sessionStorage.setItem('sehat_demo_mode', demoMatch); } catch (e) {}
  }"""
code = code.replace(target_demo_link, replacement_demo_link, 1)

# In demoFromLink replaceState, keep the demo mode in URL
target_replace_state = "try { history.replaceState(null, '', '/app'); } catch (e) { /* ignore */ }"
assert target_replace_state in code, "Could not find target_replace_state"
replacement_replace_state = """try {
    const keep = demoMatch || getDemoMode();
    history.replaceState(null, '', '/app?demo=' + keep);
  } catch (e) { /* ignore */ }"""
code = code.replace(target_replace_state, replacement_replace_state, 1)

# 5. Add global click and submit event listeners for Demo 2 & Demo 3
EVENT_LISTENERS = r'''
/* Global Event Listeners for Demo 2 & Demo 3 */
document.addEventListener('click', e => {
  const pill = e.target.closest('.demo-pill');
  if (pill && pill.dataset.mode) {
    setDemoMode(pill.dataset.mode);
    return;
  }
  const avTabBtn = e.target.closest('.av-tab-btn');
  if (avTabBtn && avTabBtn.dataset.avtab) {
    S.avTab = avTabBtn.dataset.avtab;
    render();
    return;
  }
  const copySoapBtn = e.target.closest('#btnCopySoap');
  if (copySoapBtn) {
    const soapText = `CLINICAL SOAP NOTE - JAY TAWRI (28y M)
SUBJECTIVE:
Type 2 Diabetes follow-up. Compliant with Metformin 500mg OD. Seasonal symptoms resolved. No hypoglycemia.

OBJECTIVE:
Fasting Glucose: 118 mg/dL (Elevated)
HbA1c: 6.9% (Controlled)
SGPT/ALT: 88 U/L (Elevated 1.95x)
Serum Creatinine: 1.0 mg/dL (Normal)
Platelets: 240,000 /µL (Normal)

ASSESSMENT:
1. Type 2 Diabetes Mellitus - Controlled on Metformin 500mg.
2. Isolated Transaminitis (SGPT 88 U/L) - Likely metabolic steatosis (NAFLD).
3. Renal clearance confirmed safe for Biguanide continuation.

PLAN:
1. Continue Metformin 500mg OD post-dinner.
2. Order USG Abdomen & repeat LFT in 6 weeks.
3. Dietary carbohydrate restriction (<130g/day) + 30 min daily walking.`;
    navigator.clipboard.writeText(soapText).then(() => {
      copySoapBtn.textContent = '✅ Copied to EHR Clipboard!';
      setTimeout(() => { copySoapBtn.textContent = '📋 Copy to EHR Clipboard'; }, 2000);
    });
    return;
  }
  const starterBtn = e.target.closest('.cai-starter-btn');
  if (starterBtn && starterBtn.dataset.prompt) {
    caiSubmitPrompt(starterBtn.dataset.prompt);
    return;
  }
  const threadBtn = e.target.closest('.cai-thread-item');
  if (threadBtn && threadBtn.dataset.thread) {
    S.caiThread = threadBtn.dataset.thread;
    render();
    return;
  }
  const newChatBtn = e.target.closest('#caiNewChatBtn');
  if (newChatBtn) {
    S.caiMessages = [
      {
        role: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'New consultation started for Jay Tawri. How can I assist you with clinical evaluation, diagnostic interpretation, or treatment planning?'
      }
    ];
    render();
    return;
  }
  const clearBtn = e.target.closest('#caiClearBtn');
  if (clearBtn) {
    S.caiMessages = [];
    render();
    return;
  }
});

document.addEventListener('submit', e => {
  const form = e.target.closest('#caiForm');
  if (form) {
    e.preventDefault();
    const input = form.querySelector('#caiInput');
    if (input && input.value.trim()) {
      caiSubmitPrompt(input.value.trim());
      input.value = '';
    }
  }
});
'''

code += "\n" + EVENT_LISTENERS

with open(APP_PATH, "w", encoding="utf-8") as f:
    f.write(code)

print("patch_demos.py completed successfully!")
