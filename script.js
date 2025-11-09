// Guard DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanguage();
  initCounters();
  initCharts();
  bindCrisis();
});

/* THEME */
function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn();
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch {}
      updateThemeBtn();
      // Re-render charts to adapt grid/tick colors if needed
      refreshChartsColors();
    });
  }
}
function updateThemeBtn() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  btn.classList.toggle('active', isDark);
}

/* LANGUAGE TOGGLE (UI only here, ready for content swapping if added later) */
function initLanguage() {
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      document.documentElement.setAttribute('data-lang', lang);
      document.querySelectorAll('.lang-toggle').forEach(b => {
        const active = b.dataset.lang === lang;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
    });
  });
}

/* KPI COUNTERS */
function initCounters() {
  const duration = 1600; // ms total
  const ease = t => 1 - Math.pow(1 - t, 3); // easeOutCubic
  document.querySelectorAll('.kpi-card').forEach(card => {
    const h3 = card.querySelector('h3');
    if (!h3) return;
    const target = parseFloat(card.dataset.target || '0');
    const format = card.dataset.format || 'int';
    const startTime = performance.now();

    const step = now => {
      const p = Math.min(1, (now - startTime) / duration);
      const v = target * ease(p);
      let text;
      if (format === 'pct') text = v.toFixed(1) + '%';
      else if (format === 'fixed1') text = v.toFixed(1);
      else text = Math.floor(v).toLocaleString();
      h3.textContent = text;
      if (p < 1) requestAnimationFrame(step);
      else {
        // Snap to exact target at the end
        if (format === 'pct') h3.textContent = target.toFixed(1) + '%';
        else if (format === 'fixed1') h3.textContent = Number(target).toFixed(1);
        else h3.textContent = Math.round(target).toLocaleString();
      }
    };
    requestAnimationFrame(step);
  });
}

/* CHARTS */
let charts = [];

function chartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    grid: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    ticks: isDark ? '#EEE' : '#333',
  };
}

function initCharts() {
  const userEl = document.getElementById('userChart');
  const moodEl = document.getElementById('moodChart');
  const colors = chartColors();

  if (userEl) {
    charts.push(new Chart(userEl.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [{
          label: 'Users',
          data: [3200, 4100, 5200, 6100, 7300, 8247],
          borderColor: '#FF6B9D',
          backgroundColor: 'rgba(255,107,157,0.15)',
          tension: .4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#FF6B9D'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: colors.grid }, ticks: { color: colors.ticks } },
          y: { grid: { color: colors.grid }, ticks: { color: colors.ticks } }
        }
      }
    }));
  }

  if (moodEl) {
    charts.push(new Chart(moodEl.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets: [{
          label: 'Avg Mood',
          data: [3.2, 3.5, 3.1, 4.0, 4.2, 3.8, 4.1],
          borderColor: '#4ECDC4',
          backgroundColor: 'rgba(78,205,196,0.15)',
          tension: .4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#4ECDC4'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: colors.grid }, ticks: { color: colors.ticks } },
          y: {
            min: 0, max: 5, ticks: { stepSize: 1, color: colors.ticks },
            grid: { color: colors.grid }
          }
        }
      }
    }));
  }

  // Resize observer to keep canvas height responsive in cards
  const ro = new ResizeObserver(() => charts.forEach(ch => ch.resize()));
  document.querySelectorAll('.chart-card').forEach(card => ro.observe(card));
}

function refreshChartsColors() {
  const colors = chartColors();
  charts.forEach(ch => {
    if (!ch.options.scales) return;
    const { x, y } = ch.options.scales;
    if (x && x.grid) x.grid.color = colors.grid;
    if (x && x.ticks) x.ticks.color = colors.ticks;
    if (y && y.grid) y.grid.color = colors.grid;
    if (y && y.ticks) y.ticks.color = colors.ticks;
    ch.update();
  });
}

/* CRISIS */
function bindCrisis() {
  const btn = document.querySelector('.crisis');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const hotline = 'Hong Kong Samaritan Befrienders: 2389 2222\n\nOpen Phone app now?';
    if (confirm(hotline)) {
      window.location.href = 'tel:+85223892222';
    }
  });
}