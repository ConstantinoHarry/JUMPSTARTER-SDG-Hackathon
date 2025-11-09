/* ---------- helpers ---------- */
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

/* ---------- language ---------- */
function switchLanguage(lang) {
  document.documentElement.setAttribute('data-lang', lang);
  $$('[data-lang-en]').forEach(el =>
    el.textContent = lang === 'en' ? el.dataset.langEn : el.dataset.langYue
  );
  $$('.lang-toggle').forEach(b => {
    const active = b.dataset.lang === lang;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
}

/* ---------- theme ---------- */
function initTheme() {
  const el = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch {}
  if (saved) el.setAttribute('data-theme', saved);
  else if (!el.getAttribute('data-theme')) el.setAttribute('data-theme', 'light');
}

/* ---------- chart ---------- */
let moodChart;
function renderChart() {
  if (moodChart) moodChart.destroy();
  const canvas = $('#moodChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  moodChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Mood',
        data: loadWeeklyMoods(),
        borderColor: 'rgba(255,107,157,1)',
        backgroundColor: 'rgba(255,107,157,0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#FF6B9D'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } }
    }
  });
}

/* ---------- mood storage ---------- */
function loadWeeklyMoods() {
  // simplistic: return last 7 saved moods or fallback
  try {
    const arr = JSON.parse(localStorage.getItem('moods') || '[]');
    return arr.slice(-7).map(o => o.mood);
  } catch { return [3, 4, 2, 5, 4, 3, 5]; }
}

function saveMood(value) {
  try {
    const key = 'moods';
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.push({ ts: Date.now(), mood: value });
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {}
}

/* ---------- ui bindings ---------- */
function setTodayDate() {
  const today = $('#today-date');
  if (!today) return;
  const s = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  today.textContent = s;
}

function bindMoodPicker() {
  $$('.mood-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      const mood = Number(btn.dataset.mood);
      saveMood(mood);
      renderChart();          // refresh chart
      alert(`Mood recorded: ${mood}/5`);
    })
  );
}

function bindAddEntry() {
  const btn = $('#addEntryBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const text = prompt('New journal entry:');
    if (!text || !text.trim()) return;
    const wrap = document.createElement('div');
    wrap.className = 'journal-entry';
    wrap.innerHTML = `
      <h4>${new Date().toLocaleDateString()}</h4>
      <p>${text.trim()}</p>
    `;
    $('#entries').appendChild(wrap);
  });
}

/* ---------- boot ---------- */
function init() {
  initTheme();
  setTodayDate();
  renderChart();
  bindMoodPicker();
  bindAddEntry();
}

document.addEventListener('DOMContentLoaded', init);