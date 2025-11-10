// Family Circle Management - Fully Functional Version
class FamilyCircle {
    constructor() {
        this.familyMembers = [];
        this.currentPlan = 'free';
        this.charts = {};
        this.isInitialized = false;
        this.eventListeners = new Map();
        this.currentCheckinMember = null;
        
        // Configuration
        this.config = {
            storageKey: 'aiigood_family_circle',
            maxMembers: {
                free: 1,
                premium: 10
            },
            checkinTemplates: {
                gentle: "Just checking in, how are you feeling? 💭",
                activity: "How did your wellness activities go today? 🌟",
                support: "I'm here for you. Want to talk about anything? 💝"
            },
            notificationDuration: 3000
        };
    }

    async initializeFamilyCircle() {
        try {
            await this.loadFamilyData();
            this.initializeUI();
            this.bindEventListeners();
            await this.initializeCharts();
            this.startRealTimeUpdates();
            this.isInitialized = true;
            
            console.log('Family Circle initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Family Circle:', error);
            this.showNotification('Failed to load family data', 'error');
        }
    }

    async loadFamilyData() {
        return new Promise((resolve) => {
            try {
                const savedData = localStorage.getItem(this.config.storageKey);
                if (savedData) {
                    const data = JSON.parse(savedData);
                    this.familyMembers = this.validateMemberData(data.members) || [];
                    this.currentPlan = data.plan || 'free';
                    this.lastUpdated = data.lastUpdated;
                } else {
                    this.initializeSampleData();
                }
                resolve();
            } catch (error) {
                console.error('Error loading family data:', error);
                this.initializeSampleData();
                resolve();
            }
        });
    }

    validateMemberData(members) {
        if (!Array.isArray(members)) return null;
        
        return members.filter(member => 
            member && 
            member.id && 
            member.name && 
            member.role && 
            typeof member.wellnessScore === 'number'
        );
    }

    initializeSampleData() {
        this.familyMembers = [
            {
                id: 'parent_1',
                name: 'Dad',
                role: 'parent',
                age: null,
                wellnessScore: 72,
                moodTrend: 'up',
                moodHistory: this.generateMoodHistory(72, 'up'),
                recentActivity: [
                    'Completed 5 wellness tasks',
                    'Journal entry yesterday',
                    'Mood: Generally positive'
                ],
                status: 'online',
                lastActive: new Date().toISOString(),
                joinDate: new Date().toISOString()
            },
            {
                id: 'child_1',
                name: 'Alex',
                role: 'child',
                age: 12,
                wellnessScore: 65,
                moodTrend: 'down',
                moodHistory: this.generateMoodHistory(65, 'down'),
                status: 'away',
                privacyProtected: true,
                lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                joinDate: new Date().toISOString()
            },
            {
                id: 'elderly_1',
                name: 'Grandma',
                role: 'elderly',
                age: 78,
                wellnessScore: 58,
                moodTrend: 'stable',
                moodHistory: this.generateMoodHistory(58, 'stable'),
                status: 'online',
                checkins: [
                    { 
                        id: this.generateId(),
                        time: '2 hours ago', 
                        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                        status: 'responded',
                        message: 'How are you feeling today?',
                        response: 'Doing well, just finished my walk!'
                    },
                    { 
                        id: this.generateId(),
                        time: 'Yesterday', 
                        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        status: 'pending',
                        message: 'Remember to take your medication'
                    }
                ],
                lastActive: new Date().toISOString(),
                joinDate: new Date().toISOString()
            }
        ];
        this.saveFamilyData();
    }

    generateMoodHistory(baseScore, trend) {
        const days = 7;
        const history = [];
        const variation = 5;
        
        for (let i = days - 1; i >= 0; i--) {
            let score;
            if (trend === 'up') {
                score = baseScore - (days - i - 1) * 2 + (Math.random() * variation - variation/2);
            } else if (trend === 'down') {
                score = baseScore + (days - i - 1) * 2 + (Math.random() * variation - variation/2);
            } else {
                score = baseScore + (Math.random() * variation - variation/2);
            }
            
            history.push(Math.max(0, Math.min(100, Math.round(score))));
        }
        
        return history;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    initializeUI() {
        this.updateDashboard();
        this.updatePricingUI();
        this.updateMemberStatuses();
    }

    bindEventListeners() {
        // Remove existing listeners to prevent duplicates
        this.removeEventListeners();

        const listeners = [
            ['#inviteMember', 'click', () => this.showInviteModal()],
            ['#cancelInvite', 'click', () => this.hideModal('inviteModal')],
            ['#sendInvite', 'click', () => this.sendInvitation()],
            ['#cancelCheckin', 'click', () => this.hideModal('checkinModal')],
            ['#sendCheckin', 'click', () => this.sendCheckin()],
            ['#timeRange', 'change', (e) => this.updateCharts(e.target.value)],
            ['input[name="checkinType"]', 'change', (e) => this.toggleCustomMessage(e.target.value)],
            ['input[name="inviteType"]', 'change', (e) => this.toggleInviteMethod(e.target.value)],
            ['.theme-toggle', 'click', () => this.handleThemeChange()]
        ];

        listeners.forEach(([selector, event, handler]) => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener(event, handler);
                this.eventListeners.set(`${selector}-${event}`, { element, event, handler });
            }
        });

        // Dynamic event listeners for member actions
        this.delegateEvent('.btn-action.check-in', 'click', (e) => {
            const button = e.target.closest('.btn-action');
            const memberId = button.dataset.member;
            this.showCheckinModal(memberId);
        });

        this.delegateEvent('.pricing-card .btn-primary', 'click', (e) => {
            const card = e.target.closest('.pricing-card');
            const planType = Array.from(card.classList).find(cls => 
                ['free', 'premium', 'school'].includes(cls)
            );
            if (planType) {
                this.handleUpgrade(planType);
            }
        });

        // Modal close handlers
        this.setupModalHandlers();
    }

    delegateEvent(selector, event, handler) {
        document.addEventListener(event, (e) => {
            if (e.target.matches(selector) || e.target.closest(selector)) {
                handler(e);
            }
        });
    }

    setupModalHandlers() {
        document.querySelectorAll('.modal').forEach(modal => {
            // Close buttons
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideModal(modal.id);
                });
            }

            // Click outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Escape key for all modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    this.hideModal(activeModal.id);
                }
            }
        });
    }

    removeEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();
    }

    showInviteModal() {
        if (this.familyMembers.length >= this.config.maxMembers[this.currentPlan]) {
            this.showUpgradePrompt();
            return;
        }
        document.getElementById('inviteModal').classList.add('active');
    }

    showCheckinModal(memberId) {
        const member = this.familyMembers.find(m => m.id === memberId);
        if (member) {
            document.getElementById('checkinMemberName').textContent = `Send Check-in to ${member.name}`;
            document.getElementById('checkinModal').classList.add('active');
            
            // Store current member for later use
            this.currentCheckinMember = member;
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Reset forms
        if (modalId === 'inviteModal') {
            document.getElementById('inviteEmail').value = '';
        } else if (modalId === 'checkinModal') {
            document.getElementById('checkinMessage').value = '';
            this.currentCheckinMember = null;
        }
    }

    toggleCustomMessage(checkinType) {
        const customSection = document.getElementById('customMessageSection');
        if (customSection) {
            customSection.style.display = checkinType === 'custom' ? 'block' : 'none';
        }
    }

    toggleInviteMethod(method) {
        const emailField = document.getElementById('inviteEmail');
        const emailGroup = emailField?.closest('.form-group');
        if (emailGroup) {
            emailGroup.style.display = method === 'email' ? 'block' : 'none';
            emailField.required = method === 'email';
        }
    }

    async sendInvitation() {
        const inviteType = document.querySelector('input[name="inviteType"]:checked')?.value;
        const email = document.getElementById('inviteEmail')?.value;
        const role = document.getElementById('memberRole')?.value;

        if (!inviteType || !role) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (inviteType === 'email' && !this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        try {
            // Simulate API call
            await this.simulateAPICall(1000);
            
            const invitation = {
                id: this.generateId(),
                type: inviteType,
                email: inviteType === 'email' ? email : null,
                role: role,
                status: 'pending',
                created: new Date().toISOString(),
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };

            this.saveInvitation(invitation);
            this.showNotification('Invitation sent successfully!', 'success');
            this.hideModal('inviteModal');

        } catch (error) {
            this.showNotification('Failed to send invitation. Please try again.', 'error');
        }
    }

    async sendCheckin() {
        const checkinType = document.querySelector('input[name="checkinType"]:checked')?.value;
        const urgency = document.querySelector('input[name="urgency"]:checked')?.value;
        
        if (!checkinType || !urgency || !this.currentCheckinMember) {
            this.showNotification('Please complete all check-in fields', 'error');
            return;
        }

        let message = '';

        if (checkinType === 'custom') {
            message = document.getElementById('checkinMessage')?.value.trim() || '';
            if (!message) {
                this.showNotification('Please enter a check-in message', 'error');
                return;
            }
        } else {
            message = this.config.checkinTemplates[checkinType] || 'Just checking in on you!';
        }

        try {
            // Simulate API call
            await this.simulateAPICall(800);

            const checkin = {
                id: this.generateId(),
                memberId: this.currentCheckinMember.id,
                message: message,
                urgency: urgency,
                timestamp: new Date().toISOString(),
                status: 'sent'
            };

            this.saveCheckin(checkin);
            this.showNotification('Check-in sent! You\'ll be notified when they respond.', 'success');
            this.hideModal('checkinModal');

            // Update UI
            this.updateMemberCheckins(this.currentCheckinMember.id, checkin);

        } catch (error) {
            this.showNotification('Failed to send check-in. Please try again.', 'error');
        }
    }

    saveInvitation(invitation) {
        try {
            const invitations = JSON.parse(localStorage.getItem('aiigood_family_invitations') || '[]');
            invitations.push(invitation);
            localStorage.setItem('aiigood_family_invitations', JSON.stringify(invitations));
        } catch (error) {
            console.error('Failed to save invitation:', error);
        }
    }

    saveCheckin(checkin) {
        try {
            const checkins = JSON.parse(localStorage.getItem('aiigood_family_checkins') || '[]');
            checkins.push(checkin);
            localStorage.setItem('aiigood_family_checkins', JSON.stringify(checkins));
        } catch (error) {
            console.error('Failed to save checkin:', error);
        }
    }

    simulateAPICall(delay) {
        return new Promise((resolve) => {
            setTimeout(resolve, delay);
        });
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    updateDashboard() {
        this.updateMemberCards();
        this.updateFamilyStats();
        this.updateInsights();
        this.updateDashboardHeader();
    }

    updateDashboardHeader() {
        const headerText = document.querySelector('.family-info p');
        if (headerText) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            headerText.textContent = `${this.familyMembers.length} members connected • Last updated: ${timeString}`;
        }
    }

    updateMemberCards() {
        const membersGrid = document.querySelector('.members-grid');
        if (!membersGrid) return;

        // Clear existing cards except the template structure
        membersGrid.innerHTML = this.familyMembers.map(member => 
            this.createMemberCardHTML(member)
        ).join('');

        // Re-bind event listeners for the new cards
        this.bindMemberCardEvents();
    }

    bindMemberCardEvents() {
        // Re-bind check-in buttons
        document.querySelectorAll('.btn-action.check-in').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memberId = e.target.closest('.btn-action').dataset.member;
                this.showCheckinModal(memberId);
            });
        });
    }

    createMemberCardHTML(member) {
        const trendIcons = { up: '↗', down: '↘', stable: '→' };
        const statusClasses = { online: 'online', away: 'away' };
        
        return `
            <div class="member-card ${member.role}" data-member-id="${member.id}">
                <div class="member-header">
                    <div class="member-avatar">${this.getRoleEmoji(member.role)}</div>
                    <div class="member-info">
                        <h3>${member.name}${member.age ? ` (${member.age})` : ''}</h3>
                        <span class="member-role">${this.formatRole(member.role)}</span>
                    </div>
                    <div class="member-status ${statusClasses[member.status] || 'away'}">
                        ${this.getStatusText(member)}
                    </div>
                </div>
                
                ${member.privacyProtected ? this.createPrivacyShieldHTML() : ''}
                
                <div class="wellness-overview">
                    <div class="wellness-score">
                        <div class="score-value">${member.wellnessScore}</div>
                        <div class="score-label">Wellness Score</div>
                    </div>
                    <div class="mood-trend">
                        <span class="trend-indicator ${member.moodTrend}">${trendIcons[member.moodTrend]}</span>
                        <span class="trend-text">${this.getTrendText(member.moodTrend)}</span>
                    </div>
                </div>

                ${member.recentActivity && member.recentActivity.length > 0 ? this.createActivityHTML(member.recentActivity) : ''}
                ${member.checkins && member.checkins.length > 0 ? this.createCheckinsHTML(member.checkins) : ''}

                <div class="caregiver-actions">
                    ${this.createActionButtonsHTML(member)}
                </div>
            </div>
        `;
    }

    getRoleEmoji(role) {
        const emojis = { parent: '👨', child: '👦', elderly: '👵', general: '👤' };
        return emojis[role] || '👤';
    }

    formatRole(role) {
        const roles = { 
            parent: 'Parent • Admin', 
            child: 'Child • Protected', 
            elderly: 'Elderly • Care Recipient',
            general: 'Family Member'
        };
        return roles[role] || 'Family Member';
    }

    getStatusText(member) {
        if (member.status === 'online') return 'Online';
        if (member.lastActive) {
            const lastActive = new Date(member.lastActive);
            const diffHours = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
            if (diffHours < 1) return 'Active recently';
            if (diffHours < 24) return `Active ${Math.round(diffHours)}h ago`;
        }
        return 'Away';
    }

    getTrendText(trend) {
        const texts = { 
            up: 'Improved this week', 
            down: 'Needs attention', 
            stable: 'Stable this week' 
        };
        return texts[trend] || 'No trend data';
    }

    createPrivacyShieldHTML() {
        return `
            <div class="privacy-shield">
                <div class="shield-icon">🛡️</div>
                <div class="shield-text">
                    <strong>Privacy Protected</strong>
                    <span>Aggregated data only for children under 13</span>
                </div>
            </div>
        `;
    }

    createActivityHTML(activities) {
        return `
            <div class="recent-activity">
                <h4>Recent Activity</h4>
                <ul class="activity-list">
                    ${activities.map(activity => `<li>${activity}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    createCheckinsHTML(checkins) {
        const recentCheckins = checkins.slice(0, 2);
        return `
            <div class="care-checkins">
                <h4>Recent Check-ins</h4>
                <div class="checkin-list">
                    ${recentCheckins.map(checkin => `
                        <div class="checkin-item">
                            <span class="checkin-time">${checkin.time}</span>
                            <span class="checkin-status ${checkin.status}">
                                ${checkin.status === 'responded' ? '✅ Responded' : '⏰ No response'}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createActionButtonsHTML(member) {
        const buttons = [];
        
        if (member.role === 'child' || member.role === 'elderly') {
            buttons.push(`
                <button class="btn-action check-in" data-member="${member.id}">
                    <span class="action-icon">💬</span>
                    Send Check-in
                </button>
            `);
        }
        
        if (member.role === 'child') {
            buttons.push(`
                <button class="btn-action view-insights" data-member="${member.id}">
                    <span class="action-icon">📊</span>
                    View Insights
                </button>
            `);
        }
        
        if (member.role === 'elderly') {
            buttons.push(`
                <button class="btn-action urgent" data-member="${member.id}">
                    <span class="action-icon">🚨</span>
                    Urgent Check-in
                </button>
            `);
        }
        
        return buttons.join('');
    }

    updateMemberCheckins(memberId, newCheckin) {
        const member = this.familyMembers.find(m => m.id === memberId);
        if (member) {
            if (!member.checkins) {
                member.checkins = [];
            }
            member.checkins.unshift({
                id: newCheckin.id,
                time: 'Just now',
                timestamp: new Date().toISOString(),
                status: 'sent',
                message: newCheckin.message
            });
            this.saveFamilyData();
            this.updateDashboard();
        }
    }

    updateFamilyStats() {
        const totalScore = this.familyMembers.reduce((sum, member) => sum + member.wellnessScore, 0);
        const averageScore = Math.round(totalScore / this.familyMembers.length);
        
        // Update wellness balance chart
        this.updateWellnessBalance();
        
        // Update family stats display
        const statsElement = document.querySelector('.family-stats');
        if (statsElement) {
            statsElement.textContent = `Family Average: ${averageScore}/100`;
            statsElement.style.display = 'block';
        }
    }

    updateInsights() {
        const insights = this.generateWeeklyInsights();
        const insightsGrid = document.querySelector('.insights-grid');
        
        if (insightsGrid) {
            insightsGrid.innerHTML = insights.map(insight => `
                <div class="insight-card ${insight.type}">
                    <div class="insight-icon">${insight.icon}</div>
                    <div class="insight-content">
                        <h4>${insight.title}</h4>
                        <p>${insight.message}</p>
                    </div>
                </div>
            `).join('');
        }
    }

    generateWeeklyInsights() {
        const lowScoreMembers = this.familyMembers.filter(m => m.wellnessScore < 60);
        const improvingMembers = this.familyMembers.filter(m => m.moodTrend === 'up');
        const highScoreMembers = this.familyMembers.filter(m => m.wellnessScore >= 80);
        
        const insights = [];
        
        if (improvingMembers.length > 0) {
            insights.push({
                type: 'positive',
                icon: '💪',
                title: 'Positive Progress',
                message: `${improvingMembers.length} family member${improvingMembers.length > 1 ? 's' : ''} showing improvement this week!`
            });
        }
        
        if (lowScoreMembers.length > 0) {
            insights.push({
                type: 'attention',
                icon: '👀',
                title: 'Needs Support',
                message: `${lowScoreMembers[0].name} could use some extra care and check-ins.`
            });
        }

        if (highScoreMembers.length > 0) {
            insights.push({
                type: 'positive',
                icon: '⭐',
                title: 'Wellness Champions',
                message: `${highScoreMembers.length} family member${highScoreMembers.length > 1 ? 's' : ''} maintaining excellent wellness scores!`
            });
        }
        
        // Always include a wellness tip
        insights.push({
            type: 'suggestion',
            icon: '💡',
            title: 'Family Wellness Tip',
            message: 'Try a 5-minute family mindfulness session together this week.'
        });
        
        return insights.slice(0, 3); // Limit to 3 insights
    }

    updateMemberStatuses() {
        // Simulate real-time status updates
        this.familyMembers.forEach(member => {
            if (Math.random() > 0.7) { // 30% chance to change status
                member.status = Math.random() > 0.5 ? 'online' : 'away';
                member.lastActive = new Date().toISOString();
            }
        });
        
        this.saveFamilyData();
        this.updateDashboard();
        
        // Schedule next update
        setTimeout(() => this.updateMemberStatuses(), 30000); // Every 30 seconds
    }

    startRealTimeUpdates() {
        // Update charts periodically with new data
        setInterval(() => {
            this.updateCharts('7d');
        }, 60000); // Every minute
    }

    initializeCharts() {
        return new Promise((resolve) => {
            // Destroy existing charts
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
            
            this.charts = {};
            
            // Initialize new charts
            this.createMoodTrendChart();
            this.createActivityChart();
            this.createWellnessBalanceChart();
            
            resolve();
        });
    }

    createMoodTrendChart() {
        const ctx = document.getElementById('moodTrendChart');
        if (!ctx) return;

        const isDark = this.isDarkTheme();
        const colors = this.getChartColors(isDark);

        // Ensure all members have mood history
        this.familyMembers.forEach(member => {
            if (!member.moodHistory) {
                member.moodHistory = this.generateMoodHistory(member.wellnessScore, member.moodTrend);
            }
        });

        this.charts.moodTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: this.familyMembers.map((member, index) => ({
                    label: member.name,
                    data: member.moodHistory,
                    borderColor: [colors.primary, colors.secondary, '#FFD166'][index] || colors.primary,
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: [colors.primary, colors.secondary, '#FFD166'][index] || colors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { 
                            color: colors.text,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#2d2d2d' : '#fff',
                        titleColor: colors.text,
                        bodyColor: colors.text,
                        borderColor: colors.primary,
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 0,
                        max: 100,
                        grid: { 
                            color: colors.grid,
                            drawBorder: false
                        },
                        ticks: { 
                            color: colors.text,
                            font: { size: 10 }
                        }
                    },
                    x: {
                        grid: { 
                            color: colors.grid,
                            drawBorder: false
                        },
                        ticks: { 
                            color: colors.text,
                            font: { size: 10 }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    createActivityChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        const isDark = this.isDarkTheme();

        this.charts.activity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Physical', 'Mental', 'Social', 'Mindfulness', 'Self-Care'],
                datasets: [{
                    label: 'Activities Completed',
                    data: [12, 8, 5, 7, 9],
                    backgroundColor: [
                        'rgba(255,107,157,0.8)',
                        'rgba(78,205,196,0.8)',
                        'rgba(69,183,209,0.8)',
                        'rgba(255,159,243,0.8)',
                        'rgba(255,215,0,0.8)'
                    ],
                    borderColor: [
                        '#FF6B9D',
                        '#4ECDC4',
                        '#45B7D1',
                        '#FF9FF3',
                        '#FFD166'
                    ],
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? '#2d2d2d' : '#fff',
                        titleColor: isDark ? '#EEE' : '#333',
                        bodyColor: isDark ? '#EEE' : '#333'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                            drawBorder: false
                        },
                        ticks: {
                            color: isDark ? '#EEE' : '#333',
                            font: { size: 10 }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: isDark ? '#EEE' : '#333',
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    createWellnessBalanceChart() {
        const ctx = document.getElementById('wellnessBalanceChart');
        if (!ctx) return;

        const isDark = this.isDarkTheme();
        const scores = this.calculateWellnessDistribution();

        this.charts.wellnessBalance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Excellent (80-100)', 'Good (60-79)', 'Needs Attention (40-59)', 'Concern (0-39)'],
                datasets: [{
                    data: scores,
                    backgroundColor: [
                        '#10b981',
                        '#4ECDC4',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 2,
                    borderColor: isDark ? '#2d2d2d' : '#fff',
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: isDark ? '#EEE' : '#333',
                            font: { size: 10 },
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const count = context.parsed;
                                return `${context.label}: ${count} family member${count !== 1 ? 's' : ''}`;
                            }
                        }
                    }
                }
            }
        });
    }

    calculateWellnessDistribution() {
        const distribution = [0, 0, 0, 0]; // Excellent, Good, Needs Attention, Concern
        
        this.familyMembers.forEach(member => {
            if (member.wellnessScore >= 80) distribution[0]++;
            else if (member.wellnessScore >= 60) distribution[1]++;
            else if (member.wellnessScore >= 40) distribution[2]++;
            else distribution[3]++;
        });
        
        return distribution;
    }

    updateWellnessBalance() {
        if (this.charts.wellnessBalance) {
            const newData = this.calculateWellnessDistribution();
            this.charts.wellnessBalance.data.datasets[0].data = newData;
            this.charts.wellnessBalance.update('none');
        }
    }

    updateCharts(timeRange) {
        // Simulate data update based on time range
        this.familyMembers.forEach(member => {
            member.moodHistory = this.generateMoodHistory(member.wellnessScore, member.moodTrend);
        });

        // Update mood trend chart
        if (this.charts.moodTrend) {
            this.charts.moodTrend.data.datasets.forEach((dataset, index) => {
                if (this.familyMembers[index]) {
                    dataset.data = this.familyMembers[index].moodHistory;
                }
            });
            this.charts.moodTrend.update();
        }

        this.showNotification(`Charts updated for ${timeRange}`, 'info');
    }

    isDarkTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    getChartColors(isDark) {
        return isDark ? {
            grid: 'rgba(255,255,255,0.1)',
            text: '#EEE',
            primary: '#FF8A80',
            secondary: '#80DEEA'
        } : {
            grid: 'rgba(0,0,0,0.06)',
            text: '#333',
            primary: '#FF6B9D',
            secondary: '#4ECDC4'
        };
    }

    handleUpgrade(planType) {
        const upgradeFlow = {
            premium: () => {
                this.showNotification('Redirecting to secure payment...', 'info');
                // Simulate payment processing
                setTimeout(() => {
                    this.currentPlan = 'premium';
                    this.saveFamilyData();
                    this.updatePricingUI();
                    this.showNotification('Welcome to Family Premium! 🎉', 'success');
                }, 2000);
            },
            school: () => {
                this.showNotification('Opening email client...', 'info');
                setTimeout(() => {
                    window.open('mailto:sales@aiigood.com?subject=School License Inquiry', '_blank');
                }, 500);
            }
        };

        if (upgradeFlow[planType]) {
            upgradeFlow[planType]();
        }
    }

    updatePricingUI() {
        // Update pricing UI based on current plan
        document.querySelectorAll('.pricing-card').forEach(card => {
            const planType = Array.from(card.classList).find(cls => 
                ['free', 'premium', 'school'].includes(cls)
            );
            if (!planType) return;

            const button = card.querySelector('button');
            if (!button) return;
            
            if (planType === this.currentPlan) {
                button.disabled = true;
                button.textContent = 'Current Plan';
                button.className = 'btn-secondary';
            } else if (planType === 'free' && this.currentPlan === 'premium') {
                button.disabled = true;
                button.textContent = 'Downgrade';
                button.className = 'btn-secondary';
            } else {
                button.disabled = false;
                button.textContent = planType === 'premium' ? 'Upgrade Now' : 'Contact Sales';
                button.className = planType === 'premium' ? 'btn-primary' : 'btn-secondary';
            }
        });
    }

    showUpgradePrompt() {
        this.showNotification(
            `Upgrade to Family Premium to add more members. Current limit: ${this.config.maxMembers[this.currentPlan]}`, 
            'error'
        );
    }

    handleThemeChange() {
        // Reinitialize charts when theme changes
        setTimeout(() => {
            this.initializeCharts();
        }, 100);
    }

    saveFamilyData() {
        const data = {
            members: this.familyMembers,
            plan: this.currentPlan,
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        };
        
        try {
            localStorage.setItem(this.config.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save family data:', error);
            this.showNotification('Failed to save changes', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.5rem',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            background: this.getNotificationColor(type),
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        });

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Auto remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, this.config.notificationDuration);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        return icons[type] || 'ℹ️';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        return colors[type] || '#3b82f6';
    }

    // Public methods for external access
    getFamilySummary() {
        return {
            totalMembers: this.familyMembers.length,
            averageWellness: Math.round(
                this.familyMembers.reduce((sum, m) => sum + m.wellnessScore, 0) / this.familyMembers.length
            ),
            plan: this.currentPlan,
            lastUpdated: this.lastUpdated
        };
    }

    addFamilyMember(memberData) {
        if (this.familyMembers.length >= this.config.maxMembers[this.currentPlan]) {
            throw new Error('Member limit reached. Please upgrade your plan.');
        }

        const newMember = {
            id: this.generateId(),
            ...memberData,
            joinDate: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            status: 'online'
        };

        this.familyMembers.push(newMember);
        this.saveFamilyData();
        this.updateDashboard();
        
        return newMember;
    }

    // Cleanup method
    destroy() {
        this.removeEventListeners();
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.isInitialized = false;
    }
}

// Enhanced initialization with error handling
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.familyCircle = new FamilyCircle();
        await window.familyCircle.initializeFamilyCircle();
        
        // Export to global scope for debugging
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.debugFamilyCircle = window.familyCircle;
        }
    } catch (error) {
        console.error('Failed to initialize Family Circle:', error);
        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 2rem;
            border-radius: 0.5rem;
            text-align: center;
            z-index: 10000;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <h3>😔 Unable to Load Family Circle</h3>
            <p>Please refresh the page or check your connection.</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #ef4444;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 0.25rem;
                cursor: pointer;
                margin-top: 1rem;
            ">Try Again</button>
        `;
        document.body.appendChild(errorDiv);
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.familyCircle) {
        window.familyCircle.updateMemberStatuses();
    }
});

// Click diagnostic tool
(function(){
  document.addEventListener('click', function handler(e){
    setTimeout(()=>{
      const x = e.clientX, y = e.clientY;
      const topEl = document.elementFromPoint(x, y);
      console.group('%cClick diagnostic', 'color: #fff; background: #6b7280; padding: 2px 6px; border-radius:4px;');
      console.log('Clicked coords:', x, y);
      console.log('Top element at point:', topEl);
      try { console.log('Top element snapshot:', topEl && topEl.outerHTML ? topEl.outerHTML.slice(0,300) : topEl); } catch {}
      // Find large/fixed elements that could be blocking
      const vw = window.innerWidth, vh = window.innerHeight, area = vw * vh;
      const blockers = Array.from(document.querySelectorAll('*')).map(el=>{
        try {
          const cs = getComputedStyle(el);
          if (!cs) return null;
          if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return null;
          const pos = cs.position;
          if (!['fixed','absolute','sticky'].includes(pos)) return null;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return null;
          const visibleArea = rect.width * rect.height;
          const coversMost = visibleArea / area > 0.20 || (rect.top <= 0 && rect.left <= 0 && rect.right >= vw && rect.bottom >= vh);
          if (coversMost) {
            return {
              tag: el.tagName,
              id: el.id || null,
              className: el.className || null,
              rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
              zIndex: getComputedStyle(el).zIndex,
              pointerEvents: getComputedStyle(el).pointerEvents,
              visibleAreaRatio: +(visibleArea/area).toFixed(3),
              element: el
            };
          }
        } catch (err) { return null; }
        return null;
      }).filter(Boolean);
      if (blockers.length) {
        console.warn('Potential blocking elements (covers >20% viewport or full-screen):', blockers);
        blockers.forEach(b => {
          console.log('→ element snapshot:', b.tag, 'id=', b.id, 'class=', b.className, 'zIndex=', b.zIndex, 'pointerEvents=', b.pointerEvents);
        });
      } else {
        console.log('No obvious large fixed/absolute blockers found.');
      }
      console.groupEnd();
      // remove this single-use handler so future clicks aren't noisy
      document.removeEventListener('click', handler, true);
    }, 10);
  }, true);
  console.log('Click diagnostic installed: click the broken button now (handler removes itself after first click).');
})();

(function(){
  const vw = innerWidth, vh = innerHeight, area = vw * vh;
  const candidates = Array.from(document.querySelectorAll('*')).filter(el=>{
    try {
      const cs = getComputedStyle(el);
      if (!cs || cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      if (!['fixed','absolute','sticky'].includes(cs.position)) return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const visibleArea = r.width * r.height;
      return visibleArea/area > 0.20 || (r.top <= 0 && r.left <= 0 && r.right >= vw && r.bottom >= vh);
    } catch (err) { return false; }
  });
  candidates.forEach(el=>{
    el.dataset.__ptrSaved = el.style.pointerEvents || '';
    el.style.pointerEvents = 'none';
    el.style.outline = '3px dashed rgba(255,0,0,0.25)';
    console.warn('Disabled pointer-events on', el);
  });
  console.log('Quick-fix applied to', candidates.length, 'elements. To revert run:');
  console.log(`document.querySelectorAll('[data-__ptrSaved]').forEach(el=>{ el.style.pointerEvents = el.dataset.__ptrSaved || ''; el.style.outline=''; delete el.dataset.__ptrSaved; });`);
})();