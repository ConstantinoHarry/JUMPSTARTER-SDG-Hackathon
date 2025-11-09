// Standalone journal page script (mood chart + entries)
function switchLanguage(lang) {
  document.documentElement.setAttribute('data-lang', lang);
  document.querySelectorAll('[data-lang-en]').forEach(el => {
    el.textContent = lang === 'en' ? el.dataset.langEn : el.dataset.langYue;
  });
  document.querySelectorAll('.lang-toggle').forEach(b => {
    const active = b.dataset.lang === lang;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
}

function updateThemeToggle() {
  // This page has no theme toggle button in markup, but we keep the helper in case you add it.
}

function initTheme() {
  const el = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch {}
  if (saved) el.setAttribute('data-theme', saved);
  else if (!el.getAttribute('data-theme')) el.setAttribute('data-theme', 'light');
}

let moodChart;
function renderChart() {
  if (moodChart) moodChart.destroy();
  const el = document.getElementById('moodChart');
  if (!el) return;
  const ctx = el.getContext('2d');

  // Example data; you can wire to localStorage like in interface script
  moodChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Mood',
        data: [3, 4, 2, 5, 4, 3, 5],
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
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      interaction: { mode: 'index', intersect: false },
      scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } }
    }
  });
}

function setTodayDate() {
  const d = new Date();
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  const s = d.toLocaleDateString(undefined, opts);
  const today = document.getElementById('today-date');
  if (today) today.textContent = s;
}

function bindMoodPicker() {
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = Number(btn.dataset.mood);
      try {
        const key = 'moods';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.push({ ts: Date.now(), mood });
        localStorage.setItem(key, JSON.stringify(arr));
      } catch {}
      alert(`Mood recorded: ${mood}/5`);
    });
  });
}

function bindAddEntry() {
  const addBtn = document.getElementById('addEntryBtn');
  if (!addBtn) return;
  addBtn.addEventListener('click', () => {
    const text = prompt('New journal entry:');
    if (!text) return;
    const wrap = document.createElement('div');
    wrap.className = 'journal-entry';
    const date = new Date().toLocaleDateString();
    const p = document.createElement('p');
    p.textContent = text;
    wrap.innerHTML = `<h4>${date}</h4>`;
    wrap.appendChild(p);
    document.getElementById('entries').appendChild(wrap);
  });
}

function init() {
  initTheme();
  setTodayDate();
  renderChart();
  bindMoodPicker();
  bindAddEntry();
}
document.addEventListener('DOMContentLoaded', init);