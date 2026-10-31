# Sehat — healthcare agent marketplace

One marketplace of AI agents for the whole healthcare network: hospitals, doctors, pharmacies and patients. Each organisation installs only the agents it needs, and the agents pass work to each other.

Built by team **ANTIJAREX** at **GRAVITON 2026** (CGC University).

## The flow it automates
1. **Patient** describes symptoms → Appointment Desk picks the specialist and earliest slot.
2. **Doctor** signs an e-prescription → it is routed to the nearest pharmacy that has every medicine in stock, and logged in the patient's journal.
3. **Pharmacist** sees it in the Prescription Inbox with a live stock check, can chat or call the doctor about it, packs it (stock is deducted).
4. **Delivery Dispatch** assigns a rider; the patient tracks it step by step in My Medicines.
5. **Supply Chain AI** predicts run-outs from daily usage and drafts purchase orders per distributor.

## Agents
| Agent | For |
|---|---|
| Appointment Desk | Hospital, Patient |
| ER Triage | Hospital |
| e-Prescription Writer | Doctor |
| Doctor ↔ Pharmacy Connect | Doctor, Pharmacy |
| Prescription Inbox | Pharmacy |
| Supply Chain AI | Pharmacy, Hospital |
| Delivery Dispatch | Pharmacy |
| Health Journal | Patient |
| Lab Report Explainer | Patient, Doctor |
| My Medicines | Patient |
| Emergency Check | Patient, Hospital |

## Run
```bash
python -m http.server 2400 --directory .
```
Open http://localhost:2400 and pick a demo role. Open a second tab as another role (for example Doctor and Pharmacy): the tabs share one store and update live through `BroadcastChannel`.

## Stack
Plain HTML, CSS and JavaScript, no build step. `data.js` holds the agent catalogue, demo data and the shared store (localStorage + BroadcastChannel). `app.js` holds the workspace and every agent. Light and dark themes follow the system.

## Prototype limits
Demo data and demo roles only; no real accounts, payments, calls or deliveries. Lab ranges and emergency rules give explanations, not diagnoses. The rule set builds on our team's earlier Sehat Copilot health-records project.
