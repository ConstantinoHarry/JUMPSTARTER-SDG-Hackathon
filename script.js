// Guard DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanguage();
  initCounters();
  initCharts();
  bindLogout();
  bindCrisis();
  removeBlockingOverlays();
});

// Global error capture to help diagnose initialization errors after redirects (saved to localStorage)
window.addEventListener('error', function(ev) {
  try {
    const payload = {
      message: ev.message,
      filename: ev.filename,
      lineno: ev.lineno,
      colno: ev.colno,
      stack: ev.error && ev.error.stack ? ev.error.stack : null,
      time: new Date().toISOString()
    };
    localStorage.setItem('__lastClientError', JSON.stringify(payload));
    console.error('Captured client error (saved to localStorage __lastClientError):', payload);
  } catch (e) { /* ignore */ }
});

window.addEventListener('unhandledrejection', function(ev){
  try {
    const payload = {
      reason: ev.reason && ev.reason.stack ? ev.reason.stack : (ev.reason || String(ev)),
      time: new Date().toISOString()
    };
    localStorage.setItem('__lastClientError', JSON.stringify(payload));
    console.error('Captured unhandled promise rejection (saved to localStorage __lastClientError):', payload);
  } catch(e) {}
});

// If there's a captured error from a prior navigation, show it in console for debugging and remove it afterwards
try {
  const prev = localStorage.getItem('__lastClientError');
  if (prev) {
    console.warn('Previous client error found (from last navigation):', JSON.parse(prev));
    // keep it for inspection but also expose on the page briefly
    // create a small non-blocking banner so user can copy the error if needed
    document.addEventListener('DOMContentLoaded', ()=>{
      try {
        const info = document.createElement('div');
        info.id = '__clientErrorBanner';
        info.textContent = 'Client error detected during last load — open DevTools Console and check `__lastClientError` in localStorage.';
        Object.assign(info.style, { position: 'fixed', bottom: '1rem', left: '1rem', background: '#f59e0b', color: '#111', padding: '0.5rem 0.9rem', borderRadius: '6px', zIndex: 13000, fontWeight: '600' });
        document.body.appendChild(info);
        setTimeout(()=>{ try{ const el=document.getElementById('__clientErrorBanner'); if(el) el.remove(); }catch(e){} }, 7000);
      } catch(e){}
    });
    // keep the key so user/developer can inspect, do not delete automatically
  }
} catch(e){}

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

/* LOGOUT */
function bindLogout() {
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    logout();
  });
}

function logout() {
  try {
    // Remove session and app-specific data but preserve user preferences like theme
    const keysToRemove = [
      'aiigood_user',
      'aiigood_family_circle',
      'aiigood_family_invitations',
      'aiigood_family_checkins',
      'aiigood_journal',
      'aiigood_tasks'
    ];
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch(e){}
    });
  } catch (e) {
    console.warn('Failed to remove session:', e);
  }
  // Give a tiny visual cue then redirect to login page
  try {
    const notice = document.createElement('div');
    notice.textContent = 'Logged out. Redirecting to login…';
    Object.assign(notice.style, {
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      padding: '0.5rem 0.9rem',
      background: '#111',
      color: '#fff',
      borderRadius: '6px',
      zIndex: 12000,
      fontWeight: 600
    });
    document.body.appendChild(notice);
    setTimeout(() => {
      try { if (notice.parentNode) notice.parentNode.removeChild(notice); } catch(e){}
    }, 1200);
  } catch (e) {}

  // Redirect to login page
  window.location.href = '/login_page/login.html';
}

/* Diagnose & mitigate accidental full-screen overlays that block clicks
   Runs early on page load and will disable pointer events for large,
   visible fixed/absolute elements that are likely modal/backdrop bugs.
   This is defensive — it logs any changes to the console.
*/
function removeBlockingOverlays() {
  try {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const area = vw * vh;
    const candidates = Array.from(document.querySelectorAll('body *'));

    candidates.forEach(el => {
      try {
        const cs = window.getComputedStyle(el);
        if (!cs) return;
        const pos = cs.position;
        if (pos !== 'fixed' && pos !== 'absolute' && pos !== 'sticky') return;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const visibleArea = rect.width * rect.height;
        const coversMost = visibleArea / area > 0.45 || (rect.top <= 0 && rect.left <= 0 && rect.right >= vw && rect.bottom >= vh);
        const isFloatingControls = el.classList && (el.classList.contains('floating-controls') || el.classList.contains('crisis') || el.classList.contains('modal-card'));

        // More aggressive: if element covers most of viewport and is visible, disable pointer events so underlying UI works.
        if (coversMost && !isFloatingControls) {
          if (!el.dataset.__pointerDisabled) {
            el.dataset.__pointerDisabled = '1';
            el.style.pointerEvents = 'none';
            el.style.outline = '2px dashed rgba(255,0,0,0.15)';
            el.style.transition = 'outline 0.2s ease';
            console.warn('Disabled pointer-events on blocking element:', el);
          }
        }
      } catch (inner) {
        // ignore per-element errors
      }
    });
  } catch (err) {
    console.warn('removeBlockingOverlays failed', err);
  }
}

// Run again a few times after load to catch overlays created dynamically
setTimeout(removeBlockingOverlays, 400);
setTimeout(removeBlockingOverlays, 1200);
window.addEventListener('resize', removeBlockingOverlays);