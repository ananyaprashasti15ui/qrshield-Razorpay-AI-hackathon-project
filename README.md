# QRShield — AI-Powered Pre-Payment Cyber Risk Detection

> "Don't just verify where your money is going. Verify the risk before it gets there."

---

## Problem Statement

Every day, thousands of UPI users scan a QR code, pay instantly, and move on — with zero visibility into who they're actually paying. Days or weeks later, some of these users discover their bank account has been frozen because the money they sent ended up linked to a fraud investigation, a mule account, or a suspicious recipient chain.

The current UPI ecosystem verifies identity (is this a real bank account?) but does not verify risk (is this a safe account to pay?). By the time red flags surface, the payment has already happened — and the sender has no way to undo it.

NPCI's own fraud-prevention guidance highlights beneficiary-account profiling, unusual transaction-pattern detection, and AI/ML-based mule-account identification as critical fraud controls — but today, none of this intelligence is shown to the end user at the moment that matters most: right before they pay.

---

## Our Solution

QRShield is a real-time, AI-powered risk screening layer that sits between scanning a QR code and completing a payment. It analyzes the recipient before money moves, gives a clear explainable risk score, and lets the user make an informed decision — instead of finding out the hard way.

How it works, in one line:
Scan QR → AI analyzes recipient → Risk Score + Explanation shown → User decides to Pay or Cancel

---

## Core Features

### 1. Real-Time QR Scanning
- Live camera-based UPI QR code scanner
- Instant extraction of UPI ID (VPA), payee name, and amount (if present)
- Works entirely in real time — no manual entry needed

### 2. AI Risk Engine
- Every scanned recipient is analyzed against behavioral and account-level signals:
  - Recipient transaction history and frequency
  - Unusual amount patterns
  - Sudden transaction-volume spikes
  - Multiple-user payment patterns to the same recipient
  - Suspicious behavioral indicators
  - QR/account verification status
- Outputs a Risk Score (0–100) with a clear color-coded verdict:
  - Low Risk — safe to proceed
  - Medium Risk — proceed with caution
  - High Risk — strong warning before payment

### 3. Explainable AI ("Why is this risky?")
- Unlike a black-box score, QRShield tells the user why in plain language
- Example: "Risk is high because this recipient shows unusually rapid incoming transactions and behavior that differs from typical merchant patterns."
- Builds trust and helps users (and judges) understand the reasoning, not just the number

### 4. "What Happens If I Pay?" Simulation
- Before confirming payment, the user sees a simulated consequence preview:
  - Transaction risk level
  - Potential consequences (e.g., "payment may be associated with a suspicious recipient", "recipient may be under investigation")
  - Clear [Cancel Payment] / [Proceed Anyway] choice
- QRShield never falsely guarantees an outcome — it communicates potential risk responsibly, avoiding false alarm or false reassurance

### 5. Merchant Verification Badge
- Verified, trusted merchants get a visible trust badge, reducing unnecessary friction for legitimate payments

### 6. Risk Trend Visibility
- Recipient's recent activity pattern shown visually, so spikes or anomalies are easy to spot at a glance

### 7. Community Reporting
- Users can flag a QR/recipient as suspicious
- Reports contribute to the recipient's risk profile, adding a crowdsourced safety layer

### 8. Post-Payment Trail
- If a user chooses to proceed despite a warning, a timestamped record is logged — useful for future traceability if an issue arises later

---

## How It's Built (Architecture)

QRShield is currently built as a fully client-side web app — no backend server is required to run the demo, which keeps it lightweight and easy to deploy on GitHub Pages.

**Tech Stack:**
- **Frontend:** Vanilla HTML, CSS, JavaScript (no framework — kept intentionally lightweight for fast load times)
- **QR Scanning:** [jsQR](https://github.com/cozmo/jsQR) — real-time QR decoding directly from the device camera feed via the `getUserMedia` API
- **Risk Visualization:** [Chart.js](https://www.chartjs.org/) for the recipient's transaction trend graph
- **Voice Alerts:** Web Speech API (`SpeechSynthesisUtterance`) for spoken high/medium-risk warnings in Hindi
- **Data Persistence:** Browser `localStorage` — stores scan history, Guardian Mode settings, and guardian alert logs locally on the user's device
- **Simulated Risk Data:** A local JSON dataset (`data/simulated_dataset.json`) stands in for real recipient/transaction data that would come from NPCI/bank rails in production

**Data Flow:**
Camera Feed → jsQR decodes UPI QR → VPA extracted
     ↓
VPA matched against simulated_dataset.json (or scored via fallback heuristic if unknown)
     ↓
Risk Engine computes score (0–100) + explanation reasons
     ↓
Result rendered: Risk Gauge + Trend Chart + Explanation
     ↓
User decides: Cancel / Proceed to Pay (simulated)


**Production Roadmap:**
The current risk engine is rule-based and runs entirely on simulated data, built this way for a fast, dependency-free hackathon demo. In a production deployment, this would connect to:
- Real transaction/beneficiary data via bank or NPCI-integrated APIs
- A trained ML model (e.g. gradient-boosted trees or a lightweight neural net) for mule-account and anomaly detection, replacing the current rule-based scoring
- Razorpay's Checkout and RazorpayX APIs for real payment execution and bulk payout screening, as outlined in the Enterprise Integration section
