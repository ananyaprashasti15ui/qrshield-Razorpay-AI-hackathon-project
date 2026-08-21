// ---------- STATE ----------
let currentRecipient = null;
let simulatedData = [];
let stream = null;

const screens = {
  scanner: document.getElementById('scanner-screen'),
  result: document.getElementById('result-screen'),
  payment: document.getElementById('payment-screen'),
  confirmation: document.getElementById('confirmation-screen')
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

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

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    video.srcObject = stream;
    video.setAttribute('playsinline', true);
    video.play();
    requestAnimationFrame(scanLoop);
  } catch (err) {
    scanStatus.textContent = 'Camera access denied. Use manual entry below.';
    console.error(err);
  }
}

function scanLoop() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      handleScannedData(code.data);
      return; // stop loop once found
    }
  }
  requestAnimationFrame(scanLoop);
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

// ---------- HANDLE SCAN RESULT ----------
function handleScannedData(rawText) {
  scanStatus.textContent = 'QR detected — analyzing...';
  const vpa = extractVPA(rawText);
  stopCamera();
  setTimeout(() => runRiskCheck(vpa), 800); // small delay for real "analyzing" feel
}

function extractVPA(rawText) {
  // Handles both raw "upi://pay?pa=xxx@upi..." and plain "xxx@upi"
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
}

function scoreKnownRecipient(recipient) {
  let score = 5; // base
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
  // Deterministic pseudo-random score based on VPA string (so demo is consistent every time)
  let hash = 0;
  for (let i = 0; i < vpa.length; i++) {
    hash = (hash * 31 + vpa.charCodeAt(i)) % 1000;
  }
  const score = 10 + (hash % 70); // range ~10-79
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

  return { vpa, name, category, verified, score, level, reasons };
}

// ---------- DISPLAY RESULT ----------
function displayRiskResult(result) {
  const badge = document.getElementById('risk-badge');
  const scoreEl = document.getElementById('risk-score');
  const vpaEl = document.getElementById('recipient-vpa');
  const detailsEl = document.getElementById('recipient-details');
  const reasonsEl = document.getElementById('risk-reasons');

  badge.textContent = result.level.toUpperCase() + ' RISK';
  badge.className = 'risk-badge ' + result.level;
  scoreEl.textContent = result.score + '/100';
  vpaEl.textContent = result.vpa;

  detailsEl.innerHTML = `
    Recipient: ${result.name}<br>
    Category: ${result.category}<br>
    Verification: ${result.verified ? 'Verified' : 'Not Verified'}
  `;

  reasonsEl.innerHTML = '<strong>Why this score:</strong><ul>' +
    result.reasons.map(r => `<li>${r}</li>`).join('') +
    '</ul>';
}

// ---------- NAVIGATION ----------
document.getElementById('proceed-to-pay-btn').addEventListener('click', () => {
  document.getElementById('payment-recipient').textContent =
    `Paying: ${currentRecipient.name} (${currentRecipient.vpa})`;
  document.getElementById('amount-input').value = '';
  document.getElementById('warning-box').hidden = true;
  showScreen('payment');
});

document.getElementById('scan-again-btn').addEventListener('click', resetToScanner);
document.getElementById('cancel-btn').addEventListener('click', resetToScanner);

document.getElementById('new-payment-btn').addEventListener('click', resetToScanner);

function resetToScanner() {
  currentRecipient = null;
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
    // Require a second click to actually confirm
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

  // reset pay button for next time
  const payBtn = document.getElementById('pay-btn');
  payBtn.textContent = 'Pay';
}

// ---------- INIT ----------
startCamera();
