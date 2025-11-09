// Standalone chatbot page script (chat only)
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
  const btn = document.getElementById('themeToggle');
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  btn.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
  btn.classList.toggle('active', theme === 'dark');
  btn.setAttribute('aria-pressed', String(theme === 'dark'));
}

function toggleTheme() {
  const el = document.documentElement;
  const newTheme = el.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  el.setAttribute('data-theme', newTheme);
  try { localStorage.setItem('theme', newTheme); } catch {}
  updateThemeToggle();
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch {}
  const el = document.documentElement;
  if (saved) el.setAttribute('data-theme', saved);
  else if (!el.getAttribute('data-theme')) el.setAttribute('data-theme', 'light');
  updateThemeToggle();
}

function escapeHTML(str) {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  const chat = document.getElementById('chat');
  if (chat) chat.scrollTop = chat.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('msgInput');
  if (!input.value.trim()) return;
  const msg = document.createElement('div');
  msg.className = 'msg user';
  msg.innerHTML = `${escapeHTML(input.value)}<span class="time">${getTime()}</span>`;
  document.getElementById('chat').appendChild(msg);
  input.value = '';

  const typing = document.querySelector('.typing');
  typing.style.display = 'flex';
  setTimeout(() => {
    typing.style.display = 'none';
    const bot = document.createElement('div');
    bot.className = 'msg bot';
    const lang = document.documentElement.getAttribute('data-lang');
    const reply = lang === 'en' ? "Thanks for sharing. I'm here to help." : "多謝你分享。我會一直喺度幫你。";
    bot.innerHTML = `${reply}<span class="time">${getTime()}</span>`;
    document.getElementById('chat').appendChild(bot);
    scrollToBottom();
  }, 1200);
}

function bindControls() {
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('msgInput').addEventListener('keypress', e => e.key === 'Enter' && sendMessage());
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.querySelectorAll('.lang-toggle').forEach(btn =>
    btn.addEventListener('click', () => switchLanguage(btn.dataset.lang))
  );
}

function init() {
  initTheme();
  bindControls();
  scrollToBottom();
}
document.addEventListener('DOMContentLoaded', init);