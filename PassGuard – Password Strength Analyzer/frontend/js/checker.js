/**
 * PassGuard – Password Strength Checker
 * All logic runs 100% client-side. Nothing is transmitted.
 */

/* ═══════════════════════════════════════
   DOM REFERENCES
   ═══════════════════════════════════════ */
const passwordInput  = document.getElementById('passwordInput');
const toggleBtn      = document.getElementById('toggleBtn');
const eyeIcon        = document.getElementById('eyeIcon');
const generateBtn    = document.getElementById('generateBtn');
const copyBtn        = document.getElementById('copyBtn');
const clearBtn       = document.getElementById('clearBtn');
const themeToggle    = document.getElementById('themeToggle');
const themeIcon      = document.querySelector('.theme-icon');
const scoreNumber    = document.getElementById('scoreNumber');
const ringFill       = document.getElementById('ringFill');
const strengthBar    = document.getElementById('strengthBar');
const strengthBadge  = document.getElementById('strengthBadge');
const badgeEmoji     = document.getElementById('badgeEmoji');
const badgeText      = document.getElementById('badgeText');
const feedbackList   = document.getElementById('feedbackList');
const toast          = document.getElementById('toast');
const levelDots      = document.querySelectorAll('.level-dot');

/* Ring math: circumference = 2π × 52 ≈ 326.73 */
const RING_CIRCUMFERENCE = 326.73;

/* ═══════════════════════════════════════
   THEME TOGGLE
   ═══════════════════════════════════════ */
const savedTheme = localStorage.getItem('passguard-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  themeIcon.textContent = next === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('passguard-theme', next);
});

/* ═══════════════════════════════════════
   SHOW / HIDE PASSWORD
   ═══════════════════════════════════════ */
let isVisible = false;
toggleBtn.addEventListener('click', () => {
  isVisible = !isVisible;
  passwordInput.type = isVisible ? 'text' : 'password';
  eyeIcon.textContent = isVisible ? '🙈' : '👁️';
});

/* ═══════════════════════════════════════
   PASSWORD ANALYSIS ENGINE
   ═══════════════════════════════════════ */

/**
 * Analyze a password and return a detailed result object.
 * @param {string} pw
 * @returns {{ score: number, level: 0|1|2|3|4, rules: object }}
 */
function analyzePassword(pw) {
  const rules = {
    length:    pw.length >= 8,
    upper:     /[A-Z]/.test(pw),
    lower:     /[a-z]/.test(pw),
    number:    /[0-9]/.test(pw),
    special:   /[!@#$%^&*()_\-+=\[\]{};':",.<>?/\\|`~]/.test(pw),
    length16:  pw.length >= 16,
  };

  /* Each core rule is worth 20 points (5 rules = 100) */
  const coreRules = ['length','upper','lower','number','special'];
  let score = 0;
  coreRules.forEach(r => { if (rules[r]) score += 20; });

  /* Bonus: length 16+ grants extra 10 (cap at 100) */
  if (rules.length16) score = Math.min(100, score + 10);

  /* If input is empty, score = 0 */
  if (pw.length === 0) score = 0;

  /* Determine level */
  let level = 0;
  if (pw.length === 0) level = 0;
  else if (score <= 20)  level = 1; // Weak
  else if (score <= 60)  level = 2; // Medium
  else if (score <= 85)  level = 3; // Strong
  else                   level = 4; // Excellent

  return { score, level, rules };
}

/* Level metadata */
const LEVELS = {
  0: { emoji: '🔒', text: 'Enter password',  color: 'var(--text-muted)', barColor: 'var(--text-muted)' },
  1: { emoji: '❌', text: 'Weak',             color: 'var(--clr-weak)',    barColor: 'var(--clr-weak)' },
  2: { emoji: '⚠️', text: 'Medium',           color: 'var(--clr-medium)',  barColor: 'var(--clr-medium)' },
  3: { emoji: '✅', text: 'Strong',           color: 'var(--clr-strong)',  barColor: 'var(--clr-strong)' },
  4: { emoji: '🔥', text: 'Excellent',        color: 'var(--clr-excellent)', barColor: 'var(--clr-excellent)' },
};

/* ═══════════════════════════════════════
   UI UPDATE FUNCTIONS
   ═══════════════════════════════════════ */

function updateRing(score) {
  const offset = RING_CIRCUMFERENCE - (score / 100) * RING_CIRCUMFERENCE;
  ringFill.style.strokeDashoffset = offset;
  scoreNumber.textContent = score;
}

function updateRingColor(level) {
  const colors = ['var(--text-muted)', 'var(--clr-weak)', 'var(--clr-medium)', 'var(--clr-strong)', 'var(--clr-excellent)'];
  ringFill.style.stroke = colors[level];
  scoreNumber.style.color = colors[level];
}

function updateBar(score, level) {
  strengthBar.style.width = score + '%';
  const colors = ['transparent', 'var(--clr-weak)', 'var(--clr-medium)', 'var(--clr-strong)', 'var(--clr-excellent)'];
  strengthBar.style.background = colors[level];
}

function updateBadge(level) {
  const meta = LEVELS[level];
  badgeEmoji.textContent = meta.emoji;
  badgeText.textContent  = meta.text;
  badgeText.style.color  = meta.color;
}

function updateLevelDots(level) {
  levelDots.forEach((dot, i) => {
    dot.className = 'level-dot';
    if (i < level) dot.classList.add(`active-${i + 1}`);
  });
}

function updateRules(rules) {
  const mapping = {
    'rule-length':  rules.length,
    'rule-upper':   rules.upper,
    'rule-lower':   rules.lower,
    'rule-number':  rules.number,
    'rule-special': rules.special,
    'rule-length16':rules.length16,
  };

  Object.entries(mapping).forEach(([id, pass]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('pass', 'fail');
    const iconEl = el.querySelector('.rule-icon');
    iconEl.textContent = '';  // Let CSS handle icon via ::after pseudo
    if (pass) {
      el.classList.add('pass');
    } else {
      el.classList.add('fail');
    }
  });
}

function buildFeedback(pw, level, rules) {
  feedbackList.innerHTML = '';

  if (pw.length === 0) {
    feedbackList.innerHTML = '<p class="feedback-placeholder">Start typing to get personalized suggestions…</p>';
    return;
  }

  const suggestions = [];
  const positives   = [];

  /* Suggestions */
  if (!rules.length)   suggestions.push('Increase password length to at least 8 characters');
  if (!rules.upper)    suggestions.push('Add uppercase letters (A–Z) for variety');
  if (!rules.lower)    suggestions.push('Include lowercase letters (a–z)');
  if (!rules.number)   suggestions.push('Add numbers (0–9) to improve complexity');
  if (!rules.special)  suggestions.push('Use special characters like !@#$%^&*');
  if (!rules.length16) suggestions.push('Aim for 16+ characters for maximum security');

  /* Positives */
  if (rules.length)    positives.push('Good length – meets the minimum requirement');
  if (rules.upper)     positives.push('Uppercase letters detected ✓');
  if (rules.lower)     positives.push('Lowercase letters detected ✓');
  if (rules.number)    positives.push('Numbers present ✓');
  if (rules.special)   positives.push('Special characters present ✓');
  if (rules.length16)  positives.push('Excellent length (16+ characters) 🏆');

  /* Render suggestions first */
  suggestions.forEach(msg => {
    const item = document.createElement('div');
    item.className = 'feedback-item suggestion';
    item.innerHTML = `<span>💡</span><span>${msg}</span>`;
    feedbackList.appendChild(item);
  });

  /* Final overall verdict */
  if (level === 4) {
    const verdict = ['Excellent password – nearly uncrackable! 🔥',
                     'This password is extremely strong 💪',
                     'Outstanding security score! 🎯'][Math.floor(Math.random() * 3)];
    const item = document.createElement('div');
    item.className = 'feedback-item positive';
    item.innerHTML = `<span>🏆</span><span>${verdict}</span>`;
    feedbackList.appendChild(item);
  } else if (level === 3) {
    const item = document.createElement('div');
    item.className = 'feedback-item positive';
    item.innerHTML = `<span>👍</span><span>Good password – fix the suggestions above to make it excellent!</span>`;
    feedbackList.appendChild(item);
  } else if (level === 2) {
    const item = document.createElement('div');
    item.className = 'feedback-item info';
    item.innerHTML = `<span>ℹ️</span><span>Moderate security – apply the suggestions to strengthen further.</span>`;
    feedbackList.appendChild(item);
  } else if (level === 1) {
    const item = document.createElement('div');
    item.className = 'feedback-item suggestion';
    item.innerHTML = `<span>⚠️</span><span>Very weak – this password could be cracked almost instantly.</span>`;
    feedbackList.appendChild(item);
  }
}

/* ═══════════════════════════════════════
   MAIN: REAL-TIME CHECKING
   ═══════════════════════════════════════ */
passwordInput.addEventListener('input', () => {
  const pw = passwordInput.value;
  const { score, level, rules } = analyzePassword(pw);

  updateRing(score);
  updateRingColor(level);
  updateBar(score, level);
  updateBadge(level);
  updateLevelDots(level);
  updateRules(rules);
  buildFeedback(pw, level, rules);
});

/* ═══════════════════════════════════════
   PASSWORD GENERATOR
   ═══════════════════════════════════════ */
const CHARSET = {
  upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower:   'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  special: '!@#$%^&*()-_+=[]{}',
};

function generatePassword(length = 20) {
  /* Guarantee at least one of each category */
  const mandatory = [
    randomChar(CHARSET.upper),
    randomChar(CHARSET.lower),
    randomChar(CHARSET.numbers),
    randomChar(CHARSET.special),
  ];

  const allChars = Object.values(CHARSET).join('');
  const rest = Array.from({ length: length - mandatory.length },
    () => randomChar(allChars));

  /* Shuffle and join */
  return shuffle([...mandatory, ...rest]).join('');
}

function randomChar(str) {
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  return str[arr[0] % str.length];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

generateBtn.addEventListener('click', () => {
  const pw = generatePassword(20);
  passwordInput.value = pw;
  /* Trigger analysis */
  passwordInput.dispatchEvent(new Event('input'));
  showToast('🔑 Secure password generated!');
});

/* ═══════════════════════════════════════
   COPY TO CLIPBOARD
   ═══════════════════════════════════════ */
copyBtn.addEventListener('click', async () => {
  const pw = passwordInput.value;
  if (!pw) { showToast('⚠️ Nothing to copy!'); return; }
  try {
    await navigator.clipboard.writeText(pw);
    showToast('✅ Copied to clipboard!');
  } catch {
    /* Fallback */
    passwordInput.select();
    document.execCommand('copy');
    showToast('✅ Copied to clipboard!');
  }
});

/* ═══════════════════════════════════════
   CLEAR
   ═══════════════════════════════════════ */
clearBtn.addEventListener('click', () => {
  passwordInput.value = '';
  passwordInput.dispatchEvent(new Event('input'));
  showToast('🗑️ Cleared!');
});

/* ═══════════════════════════════════════
   TOAST UTILITY
   ═══════════════════════════════════════ */
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ═══════════════════════════════════════
   KEYBOARD SHORTCUT: Ctrl/Cmd+G → generate
   ═══════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
    e.preventDefault();
    generateBtn.click();
  }
});
