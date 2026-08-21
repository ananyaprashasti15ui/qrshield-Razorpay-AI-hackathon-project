// ---------- STATE ----------
let currentRecipient = null;
let simulatedData = [];
let stream = null;
let trendChartInstance = null;
let history = JSON.parse(localStorage.getItem('qrshield_history') || '[]');
let guardian = JSON.parse(localStorage.getItem('qrshield_guardian') || 'null');
let guardianLog = JSON.parse(localStorage.getItem('qrshield_guardian_log') || '[]');

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
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    video.srcObject = stream;
    video.setAttribute('playsinline', true);
    video.play();
    scanning = true;
    requestAnimationFrame(scanLoop);
  } catch (err) {
    scanStatus.textContent = 'Camera access denied. Use manual entry below.';
    console.error(err);
  }
}

function scanLoop() {
  if (!scanning) return;
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
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
  currentRecipient = result;
  displayRiskResult(result);
  showScreen('result');
  logHistory(result);
  if (result.level === 'high' || result.level === 'medium') {
    speakWarning(result);
    notifyGuardian(result);
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
  const detailsEl = document.getElementById('recipient-details');
  const reasonsEl = document.getElementById('risk-reasons');

  badge.textContent = result.level.toUpperCase() + ' RISK';
  badge.className = 'risk-badge ' + result.level;
  vpaEl.textContent = result.vpa;

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

// ---------- VOICE ALERT ----------
function speakWarning(result) {
  if (!('speechSynthesis' in window)) return;
  const message = result.level === 'high'
    ? 'Sawdhan. Yeh payment high risk ho sakta hai. Kripya dhyan se aage badhein.'
    : 'Dhyan dein. Yeh recipient medium risk category mein hai.';
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = 'hi-IN';
  utterance.rate = 0.95;
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
