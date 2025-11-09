/* ==============================================================
   JOURNAL – ENHANCED WELLNESS TRACKING
   ============================================================= */
const JOURNAL_KEY = 'aiigood_journal';
let moodChart = null;

/* --------------------------------------------------------------
   ENHANCED DATA STRUCTURE FOR FUTURE AI/NLP INTEGRATION
   -------------------------------------------------------------- */
class JournalEntry {
    constructor(date, mood, note, emotions = [], tags = [], polishedEntry = null) {
        this.date = date;
        this.mood = mood;
        this.note = note;
        this.emotions = emotions; // For future emotion analysis
        this.tags = tags; // For future categorization
        this.polishedEntry = polishedEntry; // Ghost Writer enhanced version
        this.timestamp = new Date().toISOString();
        this.rawEmotion = note; // Keep original raw note for reference
    }
}

async function updateGhostPreview(text, mood, previewElement) {
    previewElement.innerHTML = '<div class="loading-preview">Ghost Writer is crafting your reflection...</div>';

    try {
        const preview = await ghostWriter.enhanceJournalEntry(text, mood, { preview: true });
        previewElement.textContent = preview;
    } catch (error) {
        previewElement.textContent = 'Unable to generate preview at this time.';
    }
}

/* --------------------------------------------------------------
   VOICE INPUT INTEGRATION
   -------------------------------------------------------------- */
function bindVoiceInput() {
    // The voice input button may be created inside the modal. We attach a delegated listener
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'voiceInputBtn') {
            startVoiceInput();
        }
    });
}

function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification('Voice input not supported in your browser', 'warning');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    showNotification('Listening... Speak now', 'info');
    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const ta = document.getElementById('entryNote');
        if (ta) {
            ta.value = transcript;
            const cc = document.getElementById('charCount');
            if (cc) cc.textContent = transcript.length;
        }
        showNotification('Voice input captured', 'success');
    };

    recognition.onerror = (event) => {
        showNotification('Voice input failed: ' + (event.error || 'unknown'), 'error');
    };
}

function toggleGhostWriter() {
    if (typeof ghostWriter === 'undefined') {
        showNotification('Ghost Writer not available', 'error');
        return;
    }
    ghostWriter.isEnabled = !ghostWriter.isEnabled;
    showNotification(`Ghost Writer ${ghostWriter.isEnabled ? 'enabled' : 'disabled'}`, 'info');
    // Optionally update any UI indicators
    const btns = document.querySelectorAll('.quick-action-btn');
    btns.forEach(b => {
        if (b.textContent.includes('Toggle Ghost Writer')) {
            b.textContent = ghostWriter.isEnabled ? '✨ Ghost Writer: ON' : '✨ Ghost Writer: OFF';
        }
    });
}

/* --------------------------------------------------------------
   GHOST WRITER AI SERVICE (local mock + caching)
   -------------------------------------------------------------- */
class GhostWriter {
    constructor() {
        this.isEnabled = true;
        this.cache = new Map();
    }

    async enhanceJournalEntry(rawEmotion, mood, context = {}) {
        if (!this.isEnabled) return null;

        const cacheKey = `${mood}-${(rawEmotion || '').substring(0, 50)}`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        try {
            const enhanced = await this.mockAIPolish(rawEmotion || '', mood, context);
            this.cache.set(cacheKey, enhanced);
            return enhanced;
        } catch (err) {
            console.warn('Ghost Writer failed:', err);
            return this.fallbackEnhancement(rawEmotion || '', mood);
        }
    }

    async mockAIPolish(rawEmotion, mood, context) {
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500));

        const moodDescriptors = {
            1: { intensity: "overwhelming", tone: "melancholic", imagery: "heavy shadows" },
            2: { intensity: "lingering", tone: "reflective", imagery: "soft rain" },
            3: { intensity: "present", tone: "contemplative", imagery: "gentle breeze" },
            4: { intensity: "bubbling", tone: "hopeful", imagery: "warm sunlight" },
            5: { intensity: "radiant", tone: "joyful", imagery: "bright skies" }
        };

        const descriptor = moodDescriptors[mood] || moodDescriptors[3];
        const emotions = this.detectEmotions(rawEmotion);
        return this.generatePoeticEntry(rawEmotion, descriptor, emotions);
    }

    detectEmotions(text) {
        const emotionKeywords = {
            lost: ['lost', 'confused', 'directionless', 'adrift'],
            heavy: ['heavy', 'weight', 'burden', 'pressure', 'crushing'],
            anxious: ['anxious', 'worried', 'nervous', 'uneasy'],
            peaceful: ['peaceful', 'calm', 'serene', 'tranquil'],
            joyful: ['happy', 'joyful', 'excited', 'elated']
        };

        const detected = [];
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            if (keywords.some(k => (text || '').toLowerCase().includes(k))) detected.push(emotion);
        }
        return detected.length ? detected : ['contemplative'];
    }

    generatePoeticEntry(rawEmotion, descriptor, emotions) {
        const templates = [
            `Today, ${descriptor.intensity} ${emotions[0]} settled in my bones. ${this.expandEmotion(rawEmotion, descriptor)} The ${descriptor.imagery} mirrors the landscape of my heart.`,
            `A ${descriptor.tone} stillness fills the space between thoughts. ${this.expandEmotion(rawEmotion, descriptor)} Each breath carries the weight and wonder of this ${emotions.join(' and ')} moment.`,
            `The day unfolded with ${descriptor.intensity} presence. ${this.expandEmotion(rawEmotion, descriptor)} In the quiet, I find ${this.findSilverLining(emotions)}.`,
            `${this.capitalizeFirst(descriptor.tone)} hues color my perception. ${this.expandEmotion(rawEmotion, descriptor)} The ${descriptor.imagery} reminds me that even ${emotions[0]} has its own beauty.`
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }

    expandEmotion(rawEmotion, descriptor) {
        const expansions = {
            lost: `I felt adrift in a sea of uncertainty, each wave carrying questions without answers.`,
            heavy: `The weight sat heavy on my chest, a silent companion to my thoughts.`,
            anxious: `Butterflies of worry danced in my stomach, their wings brushing against my peace.`,
            peaceful: `A gentle calm wrapped around me like a soft blanket, soothing the edges of the day.`,
            joyful: `Laughter bubbled up from some deep well within, painting the world in brighter colors.`
        };

        for (const [emotion, expansion] of Object.entries(expansions)) {
            if ((rawEmotion || '').toLowerCase().includes(emotion)) return expansion;
        }
        return `The ${descriptor.intensity} feeling colored everything, leaving its imprint on the hours.`;
    }

    findSilverLining(emotions) {
        const silverLinings = {
            lost: "clarity often emerges from confusion",
            heavy: "strength is forged under pressure",
            anxious: "courage lives alongside fear",
            contemplative: "wisdom grows in quiet moments"
        };
        return silverLinings[emotions[0]] || "beauty in the imperfect journey";
    }

    capitalizeFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    fallbackEnhancement(rawEmotion, mood) {
        const simple = {
            1: `A difficult day. ${rawEmotion} The weight feels real, but so does the strength to carry it.`,
            2: `Quiet reflections. ${rawEmotion} Even in sadness, there's space for gentle understanding.`,
            3: `Moments of balance. ${rawEmotion} The ordinary holds its own subtle magic.`,
            4: `Glimmers of light. ${rawEmotion} Joy finds its way through, softening the edges.`,
            5: `Radiant moments. ${rawEmotion} The heart feels full, expansive, alive.`
        };
        return simple[mood] || rawEmotion;
    }
}

const ghostWriter = new GhostWriter();

/* --------------------------------------------------------------
   INITIALISATION
   -------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLanguage();
    initJournal();
    setupEventListeners();
});

/* --------------------------------------------------------------
   THEME & LANGUAGE
   -------------------------------------------------------------- */
function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
}

function initLanguage() {
    document.querySelectorAll('.lang-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            document.documentElement.setAttribute('data-lang', lang);
            document.querySelectorAll('.lang-toggle').forEach(b => {
                b.classList.toggle('active', b.dataset.lang === lang);
            });
        });
    });
}

/* --------------------------------------------------------------
   JOURNAL CORE INITIALIZATION
   -------------------------------------------------------------- */
function initJournal() {
    loadEntries();
    renderAll();
    checkTodaysEntry();
}

function setupEventListeners() {
    bindMoodButtons();
    bindAddEntry();
    bindVoiceInput();
    
    // Quick mood selection (double-click opens enhanced entry modal)
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('dblclick', () => {
            const mood = parseInt(btn.dataset.mood);
            showEntryModal(mood);
        });
    });
}

function renderAll() {
    renderEntries();
    renderMetrics();
    renderChart();
    renderEmotionTrends();
}

/* --------------------------------------------------------------
   ENHANCED STORAGE MANAGEMENT
   -------------------------------------------------------------- */
function getEntries() {
    try {
        const raw = localStorage.getItem(JOURNAL_KEY);
        const entries = raw ? JSON.parse(raw) : [];
        
        // Migrate old entries to new structure if needed
        return entries.map(entry => {
            if (!entry.timestamp) {
                return new JournalEntry(entry.date, entry.mood, entry.note);
            }
            return entry;
        });
    } catch (error) {
        console.error('Error loading entries:', error);
        return [];
    }
}

function saveEntries(entries) {
    try {
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
    } catch (error) {
        console.error('Error saving entries:', error);
        alert('Error saving entry. Storage might be full.');
    }
}

/* --------------------------------------------------------------
   ENHANCED ENTRY MANAGEMENT
   -------------------------------------------------------------- */
function loadEntries() {
    const entries = getEntries();
    if (!entries.length) {
        // Create sample data for demonstration
        const sampleEntries = generateSampleData();
        saveEntries(sampleEntries);
    }
}

function generateSampleData() {
    const entries = [];
    const today = new Date();
    
    // Generate 14 days of sample data
    for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Random mood with some pattern
        const baseMood = 3 + Math.sin(i * 0.5) * 1.5;
        const mood = Math.max(1, Math.min(5, Math.round(baseMood + (Math.random() - 0.5))));
        
        const notes = [
            "Productive day at work",
            "Feeling a bit tired today",
            "Great workout session",
            "Spent time with family",
            "Working on personal projects",
            "Restful day at home",
            "Social gathering with friends"
        ];
        
        const note = notes[Math.floor(Math.random() * notes.length)];
        
        entries.push(new JournalEntry(dateStr, mood, note));
    }
    
    return entries;
}

function checkTodaysEntry() {
    const today = new Date().toISOString().split('T')[0];
    const entries = getEntries();
    const todaysEntry = entries.find(entry => entry.date === today);
    
    if (todaysEntry) {
        // Highlight today's mood if already logged
        const moodBtn = document.querySelector(`.mood-btn[data-mood="${todaysEntry.mood}"]`);
        if (moodBtn) {
            moodBtn.classList.add('selected');
            moodBtn.innerHTML = `✓<br>${moodBtn.textContent}`;
        }
        
        // Update button text
        document.getElementById('addEntryBtn').textContent = 'Edit Today\'s Entry';
    }
}

/* --------------------------------------------------------------
   ENHANCED RENDERING
   -------------------------------------------------------------- */
function renderEntries() {
    const list = document.getElementById('entriesList');
    const entries = getEntries();
    
    if (entries.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No entries yet</h3>
                <p>Share your feelings and let Ghost Writer transform them into poetic reflections.</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = '';
    
    entries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(entry => {
            const div = document.createElement('div');
            div.className = 'entry';
            div.innerHTML = createEntryHTML(entry);
            list.appendChild(div);
        });
}

function createEntryHTML(entry) {
    const hasEnhanced = entry.polishedEntry && entry.polishedEntry !== entry.note;
    
    return `
        <div class="entry-header">
            <div class="date">${formatDate(entry.date)}</div>
            <div class="mood-display mood-${entry.mood}">
                ${getMoodEmoji(entry.mood)} ${entry.mood}/5
                ${hasEnhanced ? '<span class="ghost-badge">Ghost Written</span>' : ''}
            </div>
        </div>
        
        ${hasEnhanced ? `
            <div class="polished-entry">
                <div class="polished-icon">✨</div>
                <div class="polished-text">${escapeHtml(entry.polishedEntry)}</div>
            </div>
            <details class="raw-emotion">
                <summary>Your original words</summary>
                <div class="raw-text">${escapeHtml(entry.note) || '<em>No additional notes</em>'}</div>
            </details>
        ` : `
            <div class="note">${escapeHtml(entry.note) || '<em>No note</em>'}</div>
        `}
        
        <div class="entry-actions">
            ${hasEnhanced ? `<button class="btn-regenerate" onclick="regenerateEntry('${entry.date}')">🔄 Regenerate</button>` : ''}
            <button class="btn-edit" onclick="editEntry('${entry.date}')">Edit</button>
            <button class="btn-delete" onclick="deleteEntry('${entry.date}')">Delete</button>
        </div>
    `;
}

async function regenerateEntry(date) {
    const entries = getEntries();
    const entryIndex = entries.findIndex(e => e.date === date);
    if (entryIndex === -1) return;

    const entry = entries[entryIndex];
    showNotification('Ghost Writer is reimagining your entry...', 'info');

    try {
        const newPolishedEntry = await ghostWriter.enhanceJournalEntry(entry.note, entry.mood, { regeneration: true });
        entries[entryIndex].polishedEntry = newPolishedEntry;
        saveEntries(entries);
        renderEntries();
        showNotification('Entry regenerated with new perspective', 'success');
    } catch (error) {
        showNotification('Failed to regenerate entry', 'error');
    }
}

function renderMetrics() {
    const entries = getEntries();
    if (!entries.length) {
        document.querySelectorAll('.metric span').forEach(span => span.textContent = '-');
        document.getElementById('aiInsight').style.display = 'none';
        return;
    }

    // Average mood
    const avg = (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1);
    document.getElementById('avgMood').textContent = avg;

    // Enhanced streaks
    const streakInfo = calcEnhancedStreaks(entries);
    document.getElementById('streak').textContent = streakInfo.current;
    document.getElementById('longestStreak').textContent = streakInfo.longest;

    // Mood distribution
    const distribution = calculateMoodDistribution(entries);
    document.getElementById('distro').textContent = distribution;

    // Enhanced AI insights
    const insight = generateEnhancedInsight(entries);
    const insightBox = document.getElementById('aiInsight');
    if (insight) {
        insightBox.innerHTML = `
            <div class="insight-header">
                <span class="insight-icon">💡</span>
                <strong>AI Insight</strong>
            </div>
            <div class="insight-content">${insight}</div>
        `;
        insightBox.style.display = 'block';
        insightBox.classList.add('show');
    } else {
        insightBox.style.display = 'none';
        insightBox.classList.remove('show');
    }
}

/* --------------------------------------------------------------
   ENHANCED ANALYTICS
   -------------------------------------------------------------- */
function calcEnhancedStreaks(entries) {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    let currentStreak = 0;
    let longestStreak = 0;
    let prevDate = null;

    for (const entry of sorted) {
        const currentDate = new Date(entry.date);
        
        if (prevDate) {
            const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
            
            if (dayDiff === 1) {
                // Consecutive day
                currentStreak++;
            } else if (dayDiff > 1) {
                // Gap in entries, reset streak
                currentStreak = 1;
            }
            // If same day, don't change streak
        } else {
            // First entry
            currentStreak = 1;
        }
        
        longestStreak = Math.max(longestStreak, currentStreak);
        prevDate = currentDate;
    }

    return {
        current: currentStreak,
        longest: longestStreak
    };
}

function calculateMoodDistribution(entries) {
    const dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    entries.forEach(e => dist[e.mood]++);
    
    const total = entries.length;
    return Object.entries(dist)
        .filter(([_, count]) => count > 0)
        .map(([mood, count]) => {
            const percentage = Math.round((count / total) * 100);
            return `${getMoodEmoji(parseInt(mood))} ${percentage}%`;
        })
        .join(' ');
}

function renderEmotionTrends() {
    // Placeholder for future emotion trend visualization
    const entries = getEntries();
    if (entries.length >= 7) {
        // Could add additional trend analysis here
        console.log('Enough data for trend analysis');
    }
}

/* --------------------------------------------------------------
   ENHANCED AI INSIGHTS
   -------------------------------------------------------------- */
function generateEnhancedInsight(entries) {
    if (entries.length < 3) {
        return "Keep logging your mood to unlock personalized insights!";
    }

    const recent = entries.slice(-7); // Last 7 entries
    const moods = recent.map(e => e.mood);
    const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;

    // Trend analysis
    const trend = analyzeMoodTrend(moods);
    const consistency = calculateConsistency(moods);

    // Generate insights based on patterns
    if (avgMood <= 2) {
        return "You've been feeling low recently. Consider reaching out to friends or trying mindfulness exercises.";
    } else if (avgMood >= 4) {
        return "Great consistent positive mood! Whatever you're doing, keep it up!";
    }

    if (trend === 'improving') {
        return "Your mood is trending upward! Reflect on what's been working well for you.";
    } else if (trend === 'declining') {
        return "Noticing a downward trend. Maybe time for some self-care activities?";
    }

    if (consistency > 0.7) {
        return "You maintain very consistent moods. This stability can be a great foundation for building habits.";
    }

    return "Your mood patterns show normal variation. Regular journaling helps build self-awareness.";
}

function analyzeMoodTrend(moods) {
    if (moods.length < 3) return 'stable';
    
    const firstHalf = moods.slice(0, Math.floor(moods.length / 2));
    const secondHalf = moods.slice(Math.floor(moods.length / 2));
    
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (avgSecond > avgFirst + 0.5) return 'improving';
    if (avgSecond < avgFirst - 0.5) return 'declining';
    return 'stable';
}

function calculateConsistency(moods) {
    const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
    const variance = moods.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / moods.length;
    return 1 - (variance / 4); // Normalize to 0-1 scale
}

/* --------------------------------------------------------------
   ENHANCED CHART WITH MORE FEATURES
   -------------------------------------------------------------- */
function renderChart() {
    const ctx = document.getElementById('moodChart');
    if (!ctx) return;

    const entries = getEntries();
    const last14 = entries.slice(-14); // Last 14 days
    
    if (last14.length === 0) {
        ctx.parentElement.innerHTML = `
            <div class="chart-placeholder">
                <div class="placeholder-icon">📊</div>
                <p>Log more entries to see your mood chart</p>
            </div>
        `;
        return;
    }

    const labels = last14.map(e => formatDateShort(e.date));
    const data = last14.map(e => e.mood);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#EEE' : '#333';

    if (moodChart) moodChart.destroy();

    moodChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Mood',
                data,
                borderColor: '#4ECDC4',
                backgroundColor: 'rgba(78, 205, 196, 0.15)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointBackgroundColor: '#4ECDC4',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Mood: ${context.parsed.y}/5`
                    }
                }
            },
            scales: {
                y: {
                    min: 1,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        color: textColor,
                        callback: function(value) {
                            return getMoodEmoji(value) + ' ' + value;
                        }
                    },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

/* --------------------------------------------------------------
   MODAL & UI INTERACTIONS
   -------------------------------------------------------------- */
function bindMoodButtons() {
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mood-btn').forEach(b => {
                b.classList.remove('selected');
                b.innerHTML = b.getAttribute('data-original-text') || b.textContent;
            });
            
            this.classList.add('selected');
            this.setAttribute('data-original-text', this.textContent);
            this.innerHTML = `✓<br>${this.textContent}`;
        });
    });
}

function bindAddEntry() {
    document.getElementById('addEntryBtn').addEventListener('click', () => {
        const selected = document.querySelector('.mood-btn.selected');
        if (!selected) {
            showNotification('Please select a mood first', 'warning');
            return;
        }
        const mood = parseInt(selected.dataset.mood);
        showEntryModal(mood);
    });
}

function showEntryModal(mood) {
    const today = new Date().toISOString().split('T')[0];
    const entries = getEntries();
    const existingEntry = entries.find(entry => entry.date === today);
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-card ghost-modal">
            <div class="modal-header">
                <h3>${existingEntry ? 'Edit' : 'New'} Reflection</h3>
                <div class="selected-mood">
                    <span class="mood-preview mood-${mood}">
                        ${getMoodEmoji(mood)} ${getMoodText(mood)} (${mood}/5)
                    </span>
                </div>
            </div>
            
            <div class="modal-body">
                <div class="input-methods">
                    <label for="entryNote">How are you feeling right now?</label>
                    <div class="voice-input-container">
                        <textarea 
                            id="entryNote" 
                            placeholder="Speak or type your raw feelings... 'I feel lost today' or 'The weight feels heavy'"
                            maxlength="500"
                        >${existingEntry ? existingEntry.note : ''}</textarea>
                        <button type="button" id="voiceInputBtn" class="voice-btn" title="Voice Input">
                            🎤
                        </button>
                    </div>
                    <div class="char-count"><span id="charCount">0</span>/500 characters</div>
                </div>
                
                <div class="ghost-preview" id="ghostPreview">
                    <div class="preview-header">
                        <span class="preview-icon">✨</span>
                        <strong>Ghost Writer Preview</strong>
                    </div>
                    <div class="preview-text" id="previewText">
                        Your poetic reflection will appear here...
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <div class="ai-toggle">
                    <label class="toggle-label">
                        <input type="checkbox" id="aiEnhance" checked>
                        <span class="toggle-slider"></span>
                        <span class="toggle-text">Enable Ghost Writer AI</span>
                    </label>
                </div>
                <div class="modal-actions">
                    <button class="btn-cancel" type="button">Cancel</button>
                    <button class="btn-save" type="button">
                        ${existingEntry ? 'Update' : 'Save'} Reflection
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    const textarea = modal.querySelector('#entryNote');
    const charCount = modal.querySelector('#charCount');
    const previewText = modal.querySelector('#previewText');
    const aiToggle = modal.querySelector('#aiEnhance');
    
    // Character count and real-time preview
    textarea.addEventListener('input', async () => {
        const length = textarea.value.length;
        charCount.textContent = length;
        
        // Real-time Ghost Writer preview
        if (length > 10 && aiToggle.checked) {
            await updateGhostPreview(textarea.value, mood, previewText);
        } else if (length === 0) {
            previewText.textContent = 'Your poetic reflection will appear here...';
        }
    });
    
    charCount.textContent = textarea.value.length;
    
    // AI toggle
    aiToggle.addEventListener('change', () => {
        const ghostPreview = modal.querySelector('.ghost-preview');
        ghostPreview.style.opacity = aiToggle.checked ? '1' : '0.5';
        
        if (!aiToggle.checked) {
            previewText.textContent = 'Ghost Writer is disabled...';
        } else if (textarea.value.length > 10) {
            updateGhostPreview(textarea.value, mood, previewText);
        }
    });
    
    textarea.focus();
    
    // Event listeners
    modal.querySelector('.btn-cancel').addEventListener('click', () => closeModal(modal));
    modal.querySelector('.btn-save').addEventListener('click', () => {
        const useAI = aiToggle.checked;
        ghostWriter.isEnabled = useAI;
        saveJournalEntry(mood, textarea.value, modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });
    
    // ESC key to close
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal(modal);
    });
}

async function saveJournalEntry(mood, note, modal) {
    const today = new Date().toISOString().split('T')[0];
    const entries = getEntries();
    const existingIndex = entries.findIndex(entry => entry.date === today);
    
    // Show loading state for AI enhancement
    const saveBtn = modal.querySelector('.btn-save');
    const originalText = saveBtn ? saveBtn.textContent : '';
    if (saveBtn) {
        saveBtn.innerHTML = '<div class="loading-spinner"></div> Enhancing...';
        saveBtn.disabled = true;
    }

    try {
        // Get AI-enhanced version (may be null if AI disabled)
        const polishedEntry = await ghostWriter.enhanceJournalEntry(note, mood, { previousEntries: entries.slice(-3), timeOfDay: new Date().getHours() });

        const newEntry = new JournalEntry(today, mood, note.trim(), [], [], polishedEntry);
        
        if (existingIndex !== -1) {
            entries[existingIndex] = newEntry;
            showNotification(polishedEntry ? 'Entry updated with poetic reflection' : 'Entry updated', 'success');
        } else {
            entries.push(newEntry);
            showNotification(polishedEntry ? 'Entry saved with poetic reflection' : 'Entry saved', 'success');
        }
        
        saveEntries(entries);
        closeModal(modal);
        renderAll();
        checkTodaysEntry();
        
    } catch (error) {
        console.error('Error enhancing entry:', error);
        // Fallback to basic save
        const newEntry = new JournalEntry(today, mood, note.trim());
        
        if (existingIndex !== -1) entries[existingIndex] = newEntry;
        else entries.push(newEntry);
        
        saveEntries(entries);
        closeModal(modal);
        renderAll();
        checkTodaysEntry();
        showNotification('Entry saved (AI enhancement unavailable)', 'info');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText || (existingIndex !== -1 ? 'Update Entry' : 'Save Entry');
        }
    }
}

function editEntry(date) {
    const entries = getEntries();
    const entry = entries.find(e => e.date === date);
    if (entry) {
        // Select the mood
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
            btn.innerHTML = btn.getAttribute('data-original-text') || btn.textContent;
        });
        
        const moodBtn = document.querySelector(`.mood-btn[data-mood="${entry.mood}"]`);
        if (moodBtn) {
            moodBtn.classList.add('selected');
            moodBtn.setAttribute('data-original-text', moodBtn.textContent);
            moodBtn.innerHTML = `✓<br>${moodBtn.textContent}`;
        }
        
        showEntryModal(entry.mood);
    }
}

function deleteEntry(date) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    const entries = getEntries();
    const filteredEntries = entries.filter(entry => entry.date !== date);
    saveEntries(filteredEntries);
    renderAll();
    checkTodaysEntry();
    showNotification('Entry deleted', 'info');
}

function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }, 250);
}

function showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/* --------------------------------------------------------------
   UTILITY FUNCTIONS
   -------------------------------------------------------------- */
function getMoodEmoji(mood) {
    const emojis = ['😢', '😔', '😐', '😊', '😄'];
    return emojis[mood - 1] || '❓';
}

function getMoodText(mood) {
    const texts = ['Bad', 'Sad', 'Neutral', 'Happy', 'Great'];
    return texts[mood - 1] || 'Unknown';
}

function formatDate(iso) {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return d.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatDateShort(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}