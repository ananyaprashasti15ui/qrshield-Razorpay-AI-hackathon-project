
Claude finished the response

Thought for 27s
Thought for 27s
Bilkul sahi observation bhai — abhi sirf Hindi/English fallback hai. Ek proper language selector add karte hain jisse user apni pasand ki bhasha choose kar sake (Hindi, English, Tamil, Telugu, Bengali, Marathi) — voice warning usi bhasha mein bolegi.


Edited 3 files, ran 2 commands · 3 notes
Edited 3 files, ran 2 commands · 3 notes
Syntax clean hai. Kya samajhna zaroori hai: Zyada tar desktop browsers mein sirf Hindi/English voice hoti hai by default — Tamil/Telugu/Bengali/Marathi voice sirf tab bolegi jab device mein wo voice actually installed ho (kai Android phones mein hoti hai, laptops mein kam). Isliye maine automatic fallback to English rakha hai — agar selected language ki voice available nahi hai, silently English mein bolega instead of crash/silent fail hone ke.

Ab teeno complete files deta hu:


Full index.html
Full index.html

Full index.html
File 1/3 — index.html:

html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QRShield — Pre-Payment Risk Detection</title>
<link rel="stylesheet" href="style.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
</head>
<body>

<header class="app-header">
  <h1>QRShield</h1>
  <p class="tagline">Don't just verify where your money is going. Verify the risk before it gets there.</p>
  <select id="lang-select" class="lang-select">
    <option value="hi-IN">हिंदी</option>
    <option value="en-US">English</option>
    <option value="ta-IN">தமிழ்</option>
    <option value="te-IN">తెలుగు</option>
    <option value="bn-IN">বাংলা</option>
    <option value="mr-IN">मराठी</option>
  </select>
</header>

<nav class="bottom-nav">
  <button id="nav-scan" class="nav-btn active">Scan</button>
  <button id="nav-dashboard" class="nav-btn">Dashboard</button>
  <button id="nav-guardian" class="nav-btn">Guardian</button>
  <button id="nav-enterprise" class="nav-btn">Enterprise</button>
</nav>

<main>

  <!-- SCREEN 1: SCANNER -->
  <section id="scanner-screen" class="screen active">
    <h2>Scan UPI QR Code</h2>
    <div class="video-wrapper">
    <video id="video" playsinline muted autoplay></video>
      <canvas id="canvas" hidden></canvas>
    </div>
    <p id="scan-status">Point your camera at a QR code</p>
    <button id="manual-btn" class="secondary-btn">Enter UPI ID Manually</button>
    <button id="scam-check-btn" class="secondary-btn">Check a Suspicious Message Instead</button>
  </section>

  <!-- SCREEN 2: RISK RESULT -->
  <section id="result-screen" class="screen">
    <div id="risk-card" class="risk-card">
      <div id="risk-badge" class="risk-badge">LOW RISK</div>

      <svg id="gauge" viewBox="0 0 200 110" class="gauge-svg">
        <path d="M10,100 A90,90 0 0,1 190,100" fill="none" stroke="#30363d" stroke-width="14"/>
        <path id="gauge-fill" d="M10,100 A90,90 0 0,1 190,100" fill="none" stroke="#3fb950" stroke-width="14" stroke-dasharray="283" stroke-dashoffset="283"/>
        <text id="gauge-number" x="100" y="90" text-anchor="middle" class="gauge-number">0</text>
      </svg>

      <p id="recipient-vpa" class="recipient-vpa"></p>
      <span id="verified-badge" class="verified-badge" hidden>✓ Verified Merchant</span>
      <div id="recipient-details" class="recipient-details"></div>

      <canvas id="trend-chart" height="120"></canvas>

      <div id="risk-reasons" class="risk-reasons"></div>
    </div>
    <button id="proceed-to-pay-btn" class="primary-btn">Continue to Pay</button>
    <button id="report-btn" class="secondary-btn">🚩 Report this recipient as suspicious</button>
    <button id="scan-again-btn" class="secondary-btn">Scan Another QR</button>
  </section>

  <!-- SCREEN 3: PAYMENT SIMULATION -->
  <section id="payment-screen" class="screen">
    <h2>Enter Amount</h2>
    <p id="payment-recipient" class="recipient-vpa"></p>
    <input type="number" id="amount-input" placeholder="₹ Enter amount" />
    <div id="warning-box" class="warning-box" hidden></div>
    <button id="pay-btn" class="primary-btn">Pay</button>
    <button id="cancel-btn" class="secondary-btn">Cancel</button>
  </section>

  <!-- SCREEN 4: CONFIRMATION -->
  <section id="confirmation-screen" class="screen">
    <div id="confirmation-icon" class="confirmation-icon"></div>
    <h2 id="confirmation-title">Payment Successful</h2>
    <p id="confirmation-text"></p>
    <button id="new-payment-btn" class="primary-btn">New Payment</button>
  </section>

  <!-- SCREEN 5: DASHBOARD -->
  <section id="dashboard-screen" class="screen">
    <h2>Your Safety Dashboard</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number" id="stat-total">0</div>
        <div class="stat-label">Total Scans</div>
      </div>
      <div class="stat-card safe">
        <div class="stat-number" id="stat-safe">0</div>
        <div class="stat-label">Safe Payments</div>
      </div>
      <div class="stat-card risky">
        <div class="stat-number" id="stat-risky">0</div>
        <div class="stat-label">Risky Flagged</div>
      </div>
      <div class="stat-card avoided">
        <div class="stat-number" id="stat-avoided">0</div>
        <div class="stat-label">Payments Avoided</div>
      </div>
    </div>
    <h3 class="history-heading">Recent Activity</h3>
    <div id="history-list" class="history-list"></div>
  </section>

  <!-- SCREEN 6: GUARDIAN MODE -->
  <section id="guardian-screen" class="screen">
    <h2>Guardian Mode</h2>
    <p class="section-subtext">Add a trusted contact who gets alerted if a high-risk payment is attempted — built for protecting parents and elderly family members from digital fraud.</p>

    <div id="guardian-setup" class="guardian-card">
      <label>Trusted Contact Name</label>
      <input type="text" id="guardian-name" placeholder="e.g. Rohan (Son)" />
      <label>Trusted Contact Phone</label>
      <input type="tel" id="guardian-phone" placeholder="e.g. 98765xxxxx" />
      <button id="save-guardian-btn" class="primary-btn">Enable Guardian Mode</button>
    </div>

    <div id="guardian-active" class="guardian-card" hidden>
      <p class="guardian-status">Guardian Mode Active</p>
      <p id="guardian-info" class="guardian-info"></p>
      <button id="remove-guardian-btn" class="secondary-btn">Turn Off</button>
    </div>

    <h3 class="history-heading">Guardian Alert Log</h3>
    <div id="guardian-log" class="history-list"></div>
  </section>

  <!-- SCREEN 7: SCAM MESSAGE ANALYZER -->
  <section id="scam-screen" class="screen">
    <h2>Suspicious Message Check</h2>
    <p class="section-subtext">Paste a message, SMS, or WhatsApp text you received — QRShield will analyze it for common scam patterns.</p>
    <textarea id="scam-input" rows="6" placeholder="Paste the message here..."></textarea>
    <button id="analyze-scam-btn" class="primary-btn">Analyze Message</button>
    <div id="scam-result" class="risk-reasons" hidden></div>
    <button id="scam-back-btn" class="secondary-btn">Back to Scanner</button>
  </section>

  <!-- SCREEN 8: ENTERPRISE / RAZORPAY INTEGRATION -->
  <section id="enterprise-screen" class="screen">
    <h2>Enterprise Integration</h2>
    <p class="section-subtext">QRShield's risk engine is designed API-first — it can plug directly into existing payment infrastructure as a pre-transaction safety layer.</p>

    <div class="mockup-card">
      <p class="mockup-label">Concept: Razorpay Checkout Widget</p>
      <div class="mock-checkout">
        <div class="mock-checkout-header">Razorpay Checkout</div>
        <div class="mock-checkout-body">
          <div class="mock-row">
            <span>Paying to</span>
            <span>merchant@razorpay</span>
          </div>
          <div class="mock-row">
            <span>Amount</span>
            <span>₹2,499</span>
          </div>
          <div class="mock-risk-tag low">QRShield: Verified Merchant — Low Risk</div>
          <button class="mock-pay-btn">Pay Now</button>
        </div>
      </div>
      <p class="mockup-caption">A lightweight risk badge, shown automatically before checkout completes — no extra step for the user.</p>
    </div>

    <div class="mockup-card">
      <p class="mockup-label">Concept: RazorpayX Bulk Payout Screening</p>
      <p class="section-subtext" style="text-align:left;">
        For businesses issuing bulk vendor/payroll payouts via RazorpayX, QRShield's engine can pre-screen beneficiary accounts at scale — flagging suspicious accounts before a batch payout is approved, reducing exposure to mule-account fraud.
      </p>
    </div>
  </section>

</main>

<script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js" onerror="window.jsQRFailed = true;"></script>
<script src="script.js"></script>
</body>
</html>
Ise commit karke bata do, phir script.js (bada file — multilingual logic) aur style.css agle messages mein bhejta hu.

abety ye bilingual wale voice ko fix krte hai pehle

Theek hai, chalo yehi complete karte hain pehle. index.html toh de diya — ab bacha hua script.js (voice logic) aur style.css (dropdown styling) dete hain, phir ye feature done ho jayega.


Ran 4 commands
Ran 4 commands
Poora content mil gaya. File 2/3 — script.js (multilingual voice ke saath complete):

javascript
// ---------- STATE ----------
let currentRecipient = null;
let simulatedData = [];
let stream = null;
let trendChartInstance = null;
let history = JSON.parse(localStorage.getItem('qrshield_history') || '[]');
let guardian = JSON.parse(localStorage.getItem('qrshield_guardian') || 'null');
let guardianLog = JSON.parse(localStorage.getItem('qrshield_guardian_log') || '[]');
let reportedVPAs = JSON.parse(localStorage.getItem('qrshield_reported') || '[]');

const screens = {
  scanner: document.getElementById('scanner-screen'),
  result: document.getElementById('result-screen'),
  payment: document.getElementById('payment-screen'),
  confirmation: document.getElementById('confirmation-screen'),
  dashboard: document.getElementById('dashboard-screen'),
  guardian: document.getElementById('guardian-screen'),
  scam: document.getElementById('scam-screen'),
  enterprise: document.getElementById('enterprise-screen')
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ---------- NAVIGATION ----------
const navButtons = {
  scan: document.getElementById('nav-scan'),
  dashboard: document.getElementById('nav-dashboard'),
  guardian: document.getElementById('nav-guardian'),
  enterprise: document.getElementById('nav-enterprise')
};

function setActiveNav(key) {
  Object.values(navButtons).forEach(b => b.classList.remove('active'));
  navButtons[key].classList.add('active');
}

navButtons.scan.addEventListener('click', () => {
  setActiveNav('scan');
  resetToScanner();
});

navButtons.dashboard.addEventListener('click', () => {
  setActiveNav('dashboard');
  stopCamera();
  renderDashboard();
  showScreen('dashboard');
});

navButtons.guardian.addEventListener('click', () => {
  setActiveNav('guardian');
  stopCamera();
  renderGuardianScreen();
  showScreen('guardian');
});

navButtons.enterprise.addEventListener('click', () => {
  setActiveNav('enterprise');
  stopCamera();
  showScreen('enterprise');
});

// ---------- LOAD SIMULATED DATASET ----------
fetch('data/simulated_dataset.json')
  .then(res => res.json())
  .then(data => { simulatedData = data.recipients; })
  .catch(err => console.error('Dataset load failed:', err));

// ---------- CAMERA + QR SCANNING ----------
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scanStatus = document.getElementById('scan-status');
let scanning = false;

async function startCamera() {
  if (typeof jsQR === 'undefined' || window.jsQRFailed) {
    scanStatus.textContent = 'Scanner failed to load. Please check your internet connection and refresh, or use manual entry below.';
    return;
  }
  scanStatus.textContent = 'Requesting camera access...';
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });
  } catch (err) {
    console.error('Camera error:', err);
    scanStatus.textContent = 'Camera not available (' + err.name + '). Use manual entry below.';
    return;
  }

  video.srcObject = stream;
  video.setAttribute('playsinline', 'true');
  video.muted = true;

  video.onloadedmetadata = () => {
    video.play().then(() => {
      scanning = true;
      scanStatus.textContent = 'Scanning...';
      requestAnimationFrame(scanLoop);
    }).catch(err => {
      console.error('Play error:', err);
      scanStatus.textContent = 'Could not start video preview.';
    });
  };
}

function scanLoop() {
  if (!scanning) return;

  if (video.videoWidth > 0 && video.videoHeight > 0) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code && code.data) {
      handleScannedData(code.data);
      return;
    }
  }
  requestAnimationFrame(scanLoop);
}

function stopCamera() {
  scanning = false;
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  video.srcObject = null;
}
// ---------- HANDLE SCAN RESULT ----------
function handleScannedData(rawText) {
  scanStatus.textContent = 'QR detected — analyzing...';
  const vpa = extractVPA(rawText);
  stopCamera();
  setTimeout(() => runRiskCheck(vpa), 800);
}

function extractVPA(rawText) {
  const match = rawText.match(/pa=([^&]+)/);
  if (match) return decodeURIComponent(match[1]);
  return rawText.trim();
}

// ---------- MANUAL ENTRY ----------
document.getElementById('manual-btn').addEventListener('click', () => {
  const vpa = prompt('Enter UPI ID (e.g. someone@upi):');
  if (vpa) {
    stopCamera();
    runRiskCheck(vpa.trim());
  }
});

// ---------- RISK ENGINE ----------
function runRiskCheck(vpa) {
  const known = simulatedData.find(r => r.vpa.toLowerCase() === vpa.toLowerCase());
  const result = known ? scoreKnownRecipient(known) : scoreUnknownRecipient(vpa);
  applyCommunityReports(result);
  currentRecipient = result;
  displayRiskResult(result);
  showScreen('result');
  logHistory(result);
  if (result.level === 'high' || result.level === 'medium') {
    speakWarning(result);
    notifyGuardian(result);
  }
}

function applyCommunityReports(result) {
  if (reportedVPAs.includes(result.vpa.toLowerCase())) {
    result.score = Math.min(result.score + 20, 99);
    result.reasons.push('This recipient has been reported as suspicious by other QRShield users.');
    if (result.score >= 60) result.level = 'high';
    else if (result.score >= 30) result.level = 'medium';
  }
}

function scoreKnownRecipient(recipient) {
  let score = 5;
  const reasons = [];

  if (!recipient.verified) { score += 30; reasons.push('Recipient account is not verified.'); }
  if (recipient.txn_frequency === 'sudden_spike') { score += 25; reasons.push('Unusually rapid incoming transaction volume detected.'); }
  if (recipient.txn_frequency === 'unusual_pattern') { score += 20; reasons.push('Transaction amount pattern differs from typical merchant behaviour.'); }
  if (recipient.txn_frequency === 'high_volume') { score += 20; reasons.push('High volume of incoming payments from multiple users in a short time.'); }
  if (recipient.account_age_days < 15) { score += 20; reasons.push('Recipient account was created very recently.'); }
  if (recipient.risk_flags.includes('possible_mule_pattern')) { score += 15; reasons.push('Account shows characteristics associated with mule-account patterns.'); }
  if (recipient.risk_flags.includes('multiple_user_reports')) { score += 10; reasons.push('Multiple users have flagged this recipient as suspicious.'); }

  score = Math.min(score, 99);

  if (reasons.length === 0) {
    reasons.push('Recipient is a verified, long-standing account with normal transaction behaviour.');
  }

  return buildResultObject(recipient.vpa, recipient.merchant_name, recipient.category, recipient.verified, score, reasons);
}

function scoreUnknownRecipient(vpa) {
  let hash = 0;
  for (let i = 0; i < vpa.length; i++) {
    hash = (hash * 31 + vpa.charCodeAt(i)) % 1000;
  }
  const score = 10 + (hash % 70);
  const reasons = [];

  if (score > 55) {
    reasons.push('This UPI ID is not in our verified merchant database.');
    reasons.push('No prior transaction history found for this recipient.');
    reasons.push('Unable to confirm recipient identity or merchant category.');
  } else {
    reasons.push('No major risk indicators found, though recipient is not in our verified database.');
    reasons.push('Proceed with normal caution as you would with any new recipient.');
  }

  return buildResultObject(vpa, 'Unknown Recipient', 'Unverified', false, score, reasons);
}

function buildResultObject(vpa, name, category, verified, score, reasons) {
  let level = 'low';
  if (score >= 60) level = 'high';
  else if (score >= 30) level = 'medium';

  return { vpa, name, category, verified, score, level, reasons, time: new Date().toISOString() };
}

// ---------- DISPLAY RESULT ----------
function displayRiskResult(result) {
  const badge = document.getElementById('risk-badge');
  const vpaEl = document.getElementById('recipient-vpa');
  const verifiedBadgeEl = document.getElementById('verified-badge');
  const detailsEl = document.getElementById('recipient-details');
  const reasonsEl = document.getElementById('risk-reasons');

  badge.textContent = result.level.toUpperCase() + ' RISK';
  badge.className = 'risk-badge ' + result.level;
  vpaEl.textContent = result.vpa;
  verifiedBadgeEl.hidden = !result.verified;

  detailsEl.innerHTML = `
    Recipient: ${result.name}<br>
    Category: ${result.category}<br>
    Verification: ${result.verified ? 'Verified' : 'Not Verified'}
  `;

  reasonsEl.innerHTML = '<strong>Why this score:</strong><ul>' +
    result.reasons.map(r => `<li>${r}</li>`).join('') +
    '</ul>';

  animateGauge(result.score, result.level);
  renderTrendChart(result);

  const reportBtn = document.getElementById('report-btn');
  const alreadyReported = reportedVPAs.includes(result.vpa.toLowerCase());
  reportBtn.textContent = alreadyReported ? '🚩 Already Reported' : '🚩 Report this recipient as suspicious';
  reportBtn.disabled = alreadyReported;
}

// ---------- GAUGE ANIMATION ----------
function animateGauge(score, level) {
  const fill = document.getElementById('gauge-fill');
  const numberEl = document.getElementById('gauge-number');
  const circumference = 283;
  const offset = circumference - (circumference * score / 100);

  const colors = { low: '#3fb950', medium: '#d29922', high: '#f85149' };
  fill.style.stroke = colors[level];

  setTimeout(() => {
    fill.style.strokeDashoffset = offset;
  }, 100);

  let current = 0;
  const step = Math.max(1, Math.round(score / 30));
  const interval = setInterval(() => {
    current += step;
    if (current >= score) {
      current = score;
      clearInterval(interval);
    }
    numberEl.textContent = current;
  }, 30);
}

// ---------- TREND CHART ----------
function renderTrendChart(result) {
  const ctxChart = document.getElementById('trend-chart').getContext('2d');
  let seed = 0;
  for (let i = 0; i < result.vpa.length; i++) seed += result.vpa.charCodeAt(i);

  const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
  const baseline = result.level === 'high' ? 20 : result.level === 'medium' ? 10 : 5;
  const spike = result.level === 'high' ? 6 : 5;

  const data = days.map((_, i) => {
    const isSpikeDay = result.level !== 'low' && i === spike - 1;
    const noise = (seed + i * 7) % 5;
    return isSpikeDay ? baseline + 30 + noise : baseline + noise;
  });

  if (trendChartInstance) trendChartInstance.destroy();

  trendChartInstance = new Chart(ctxChart, {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label: 'Transaction Volume',
        data: data,
        borderColor: result.level === 'high' ? '#f85149' : result.level === 'medium' ? '#d29922' : '#3fb950',
        backgroundColor: 'rgba(47,129,247,0.08)',
        tension: 0.35,
        fill: true,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8b949e', font: { size: 10 } }, grid: { color: '#21262d' } },
        y: { ticks: { color: '#8b949e', font: { size: 10 } }, grid: { color: '#21262d' } }
      }
    }
  });
}

// ---------- VOICE ALERT / LANGUAGE ----------
let cachedVoices = [];
let selectedLang = localStorage.getItem('qrshield_lang') || 'hi-IN';

const voiceMessages = {
  'hi-IN': {
    high: 'Sawdhan. Yeh payment high risk ho sakta hai. Kripya dhyan se aage badhein.',
    medium: 'Dhyan dein. Yeh recipient medium risk category mein hai.'
  },
  'en-US': {
    high: 'Warning. This payment may be high risk. Please proceed with caution.',
    medium: 'Please note. This recipient falls under the medium risk category.'
  },
  'ta-IN': {
    high: 'எச்சரிக்கை. இந்தப் பணம் செலுத்துதல் அதிக ஆபத்துடையதாக இருக்கலாம். தயவுசெய்து கவனமாக தொடரவும்.',
    medium: 'கவனிக்கவும். இந்த பெறுநர் நடுத்தர ஆபத்து பிரிவில் உள்ளார்.'
  },
  'te-IN': {
    high: 'హెచ్చరిక. ఈ చెల్లింపు అధిక ప్రమాదకరంగా ఉండవచ్చు. దయచేసి జాగ్రత్తగా కొనసాగండి.',
    medium: 'దయచేసి గమనించండి. ఈ గ్రహీత మధ్యస్థ ప్రమాద వర్గంలో ఉన్నారు.'
  },
  'bn-IN': {
    high: 'সতর্কতা। এই পেমেন্টটি উচ্চ ঝুঁকিপূর্ণ হতে পারে। অনুগ্রহ করে সতর্কতার সাথে এগিয়ে যান।',
    medium: 'অনুগ্রহ করে লক্ষ্য করুন। এই প্রাপক মাঝারি ঝুঁকির বিভাগে রয়েছেন।'
  },
  'mr-IN': {
    high: 'सावधान. हे पेमेंट उच्च जोखमीचे असू शकते. कृपया काळजीपूर्वक पुढे जा.',
    medium: 'कृपया लक्षात घ्या. हा प्राप्तकर्ता मध्यम जोखीम श्रेणीत आहे.'
  }
};

const langSelect = document.getElementById('lang-select');
langSelect.value = selectedLang;
langSelect.addEventListener('change', () => {
  selectedLang = langSelect.value;
  localStorage.setItem('qrshield_lang', selectedLang);
});

function loadVoices() {
  if ('speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
}

if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

function speakWarning(result) {
  if (!('speechSynthesis' in window)) return;

  const langPrefix = selectedLang.split('-')[0];
  const hasSelectedVoice = cachedVoices.some(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));

  const finalLang = hasSelectedVoice ? selectedLang : 'en-US';
  const messages = voiceMessages[finalLang] || voiceMessages['en-US'];
  const message = result.level === 'high' ? messages.high : messages.medium;

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = finalLang;
  utterance.rate = 0.95;
  utterance.onerror = (e) => console.error('Speech synthesis error:', e);

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

// ---------- HISTORY / DASHBOARD ----------
function logHistory(result) {
  history.unshift(result);
  history = history.slice(0, 20);
  localStorage.setItem('qrshield_history', JSON.stringify(history));
}

function renderDashboard() {
  const total = history.length;
  const safe = history.filter(h => h.level === 'low').length;
  const risky = history.filter(h => h.level !== 'low').length;
  const avoided = history.filter(h => h.avoided).length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-safe').textContent = safe;
  document.getElementById('stat-risky').textContent = risky;
  document.getElementById('stat-avoided').textContent = avoided;

  const listEl = document.getElementById('history-list');
  if (history.length === 0) {
    listEl.innerHTML = '<div class="empty-state">No scans yet. Scan a QR to get started.</div>';
    return;
  }

  listEl.innerHTML = history.map(h => `
    <div class="history-item">
      <span>${h.vpa}</span>
      <span class="h-level ${h.level}">${h.level.toUpperCase()}</span>
    </div>
  `).join('');
}

// ---------- GUARDIAN MODE ----------
function renderGuardianScreen() {
  const setupEl = document.getElementById('guardian-setup');
  const activeEl = document.getElementById('guardian-active');
  const infoEl = document.getElementById('guardian-info');
  const logEl = document.getElementById('guardian-log');

  if (guardian) {
    setupEl.hidden = true;
    activeEl.hidden = false;
    infoEl.textContent = `${guardian.name} will be alerted for medium/high risk payments — ${guardian.phone}`;
  } else {
    setupEl.hidden = false;
    activeEl.hidden = true;
  }

  if (guardianLog.length === 0) {
    logEl.innerHTML = '<div class="empty-state">No alerts sent yet.</div>';
  } else {
    logEl.innerHTML = guardianLog.map(g => `
      <div class="history-item">
        <span>Alert sent for ${g.vpa}</span>
        <span class="h-level ${g.level}">${g.level.toUpperCase()}</span>
      </div>
    `).join('');
  }
}

document.getElementById('save-guardian-btn').addEventListener('click', () => {
  const name = document.getElementById('guardian-name').value.trim();
  const phone = document.getElementById('guardian-phone').value.trim();
  if (!name || !phone) {
    alert('Please enter both name and phone number.');
    return;
  }
  guardian = { name, phone };
  localStorage.setItem('qrshield_guardian', JSON.stringify(guardian));
  renderGuardianScreen();
});

document.getElementById('remove-guardian-btn').addEventListener('click', () => {
  guardian = null;
  localStorage.removeItem('qrshield_guardian');
  renderGuardianScreen();
});

function notifyGuardian(result) {
  if (!guardian) return;
  guardianLog.unshift({ vpa: result.vpa, level: result.level, time: result.time });
  guardianLog = guardianLog.slice(0, 20);
  localStorage.setItem('qrshield_guardian_log', JSON.stringify(guardianLog));
}

// ---------- SCAM MESSAGE ANALYZER ----------
document.getElementById('scam-check-btn').addEventListener('click', () => {
  stopCamera();
  document.getElementById('scam-result').hidden = true;
  document.getElementById('scam-input').value = '';
  showScreen('scam');
});

document.getElementById('scam-back-btn').addEventListener('click', resetToScanner);

document.getElementById('analyze-scam-btn').addEventListener('click', () => {
  const text = document.getElementById('scam-input').value.trim();
  const resultEl = document.getElementById('scam-result');

  if (!text) {
    alert('Please paste a message to analyze.');
    return;
  }

  const analysis = analyzeScamText(text);
  resultEl.hidden = false;
  resultEl.innerHTML = `
    <strong>${analysis.verdict}</strong>
    <ul>${analysis.reasons.map(r => `<li>${r}</li>`).join('')}</ul>
  `;
});

function analyzeScamText(text) {
  const lower = text.toLowerCase();
  const flags = [];

  const patterns = [
    { key: 'kyc', label: 'Mentions urgent KYC update — a very common phishing tactic.' },
    { key: 'lottery', label: 'Mentions winning a lottery or prize — classic advance-fee scam pattern.' },
    { key: 'otp', label: 'Asks for OTP — legitimate services never ask you to share your OTP.' },
    { key: 'block', label: 'Threatens account block/suspension to create urgency — a common pressure tactic.' },
    { key: 'click here', label: 'Contains a generic "click here" link — often used in phishing links.' },
    { key: 'refund', label: 'Mentions unexpected refund — commonly used to lure victims into fake payment apps.' },
    { key: 'job offer', label: 'Mentions a job offer requiring upfront payment — a known scam pattern.' },
    { key: 'digital arrest', label: 'References "digital arrest" or legal action — a well-known impersonation scam tactic.' },
    { key: 'send otp', label: 'Explicitly asks to send OTP — extremely high risk indicator.' },
    { key: 'verify your account', label: 'Asks to "verify account" via link — common phishing language.' }
  ];

  patterns.forEach(p => {
    if (lower.includes(p.key)) flags.push(p.label);
  });

  if (flags.length === 0) {
    return {
      verdict: 'No strong scam indicators found',
      reasons: ['This message does not match common scam patterns we check for. Still, never share OTPs or personal banking details with anyone.']
    };
  }

  return {
    verdict: flags.length >= 2 ? 'High Likelihood of Scam' : 'Possible Scam Indicators Found',
    reasons: flags
  };
}

// ---------- NAVIGATION BETWEEN CORE SCREENS ----------
document.getElementById('proceed-to-pay-btn').addEventListener('click', () => {
  document.getElementById('payment-recipient').textContent =
    `Paying: ${currentRecipient.name} (${currentRecipient.vpa})`;
  document.getElementById('amount-input').value = '';
  document.getElementById('warning-box').hidden = true;
  showScreen('payment');
});

document.getElementById('scan-again-btn').addEventListener('click', resetToScanner);

document.getElementById('report-btn').addEventListener('click', () => {
  if (!currentRecipient) return;
  const vpaLower = currentRecipient.vpa.toLowerCase();
  if (!reportedVPAs.includes(vpaLower)) {
    reportedVPAs.push(vpaLower);
    localStorage.setItem('qrshield_reported', JSON.stringify(reportedVPAs));
    const reportBtn = document.getElementById('report-btn');
    reportBtn.textContent = '🚩 Already Reported';
    reportBtn.disabled = true;
    alert('Thank you — this recipient has been flagged. Future scans of this UPI ID will show an elevated risk score for other users.');
  }
});
document.getElementById('cancel-btn').addEventListener('click', () => {
  if (currentRecipient) {
    currentRecipient.avoided = true;
    if (history[0] && history[0].vpa === currentRecipient.vpa) {
      history[0].avoided = true;
      localStorage.setItem('qrshield_history', JSON.stringify(history));
    }
  }
  resetToScanner();
});

document.getElementById('new-payment-btn').addEventListener('click', resetToScanner);

function resetToScanner() {
  currentRecipient = null;
  setActiveNav('scan');
  showScreen('scanner');
  scanStatus.textContent = 'Point your camera at a QR code';
  startCamera();
}

// ---------- PAYMENT SIMULATION ----------
document.getElementById('pay-btn').addEventListener('click', () => {
  const amount = document.getElementById('amount-input').value;
  const warningBox = document.getElementById('warning-box');

  if (!amount || amount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }

  if (currentRecipient.level === 'high' || currentRecipient.level === 'medium') {
    warningBox.hidden = false;
    warningBox.innerHTML = `
      <strong>Transaction Risk: ${currentRecipient.level.toUpperCase()}</strong>
      <p>Potential consequences:</p>
      <ul>
        <li>Payment may be associated with a suspicious recipient.</li>
        <li>Recipient may be under review or investigation.</li>
        <li>Your transaction could potentially become part of a fraud trail.</li>
      </ul>
      <p>We cannot guarantee your account will or won't be affected. Proceed only if you trust this recipient.</p>
    `;
    const payBtn = document.getElementById('pay-btn');
    payBtn.textContent = 'Proceed Anyway';
    payBtn.onclick = () => completePayment(amount);
  } else {
    completePayment(amount);
  }
});

function completePayment(amount) {
  showScreen('confirmation');
  const icon = document.getElementById('confirmation-icon');
  const title = document.getElementById('confirmation-title');
  const text = document.getElementById('confirmation-text');

  icon.textContent = currentRecipient.level === 'high' ? '⚠️' : '✔️';
  title.textContent = currentRecipient.level === 'high'
    ? 'Payment Sent — Proceed with Caution'
    : 'Payment Successful';
  text.textContent = `₹${amount} sent to ${currentRecipient.vpa}. This is a simulated transaction for demo purposes.`;

  const payBtn = document.getElementById('pay-btn');
  payBtn.textContent = 'Pay';
}

// ---------- INIT ----------
startCamera();
