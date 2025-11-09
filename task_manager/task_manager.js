/* ==============================================================
   WELLNESS TASK MANAGER
   ============================================================== */

const TASK_MANAGER_KEY = 'aiigood_tasks';
const USER_CHECKINS_KEY = 'aiigood_checkins';
let tasks = [];
let charts = {};

// Task categories with points and descriptions
const CATEGORY_CONFIG = {
    physical: { 
        name: 'Physical Health', 
        points: 10, 
        color: '#FF6B9D',
        description: 'Exercise, nutrition, sleep, and physical wellbeing activities'
    },
    mental: { 
        name: 'Mental Health', 
        points: 15, 
        color: '#4ECDC4',
        description: 'Therapy, meditation, stress management, and mental wellness'
    },
    social: { 
        name: 'Social Connection', 
        points: 12, 
        color: '#45B7D1',
        description: 'Social interactions, relationships, and community engagement'
    },
    productivity: { 
        name: 'Productivity', 
        points: 8, 
        color: '#96CEB4',
        description: 'Work, studies, chores, and productive tasks'
    },
    selfcare: { 
        name: 'Self Care', 
        points: 10, 
        color: '#FECA57',
        description: 'Personal care, relaxation, and nurturing activities'
    },
    mindfulness: { 
        name: 'Mindfulness', 
        points: 12, 
        color: '#FF9FF3',
        description: 'Mindfulness, reflection, and present-moment awareness'
    }
};

// AI Wellness Recommendations
const AI_RECOMMENDATIONS = [
    {
        title: "5-Minute Breathing Exercise",
        description: "Practice box breathing to reduce stress and increase focus",
        category: "mindfulness",
        difficulty: 1,
        points: 5,
        reason: "Based on your recent stress levels"
    },
    {
        title: "10-Minute Walk Outside",
        description: "Get some fresh air and sunlight to boost your mood",
        category: "physical",
        difficulty: 1,
        points: 8,
        reason: "You've been indoors most of the day"
    },
    {
        title: "Gratitude Journaling",
        description: "Write down 3 things you're grateful for today",
        category: "mental",
        difficulty: 1,
        points: 10,
        reason: "Helps shift focus to positive aspects"
    },
    {
        title: "Digital Detox - 1 Hour",
        description: "Take a break from screens and devices",
        category: "selfcare",
        difficulty: 2,
        points: 12,
        reason: "High screen time detected"
    },
    {
        title: "Reach Out to a Friend",
        description: "Send a message or call someone you care about",
        category: "social",
        difficulty: 2,
        points: 15,
        reason: "Social connections improve wellbeing"
    },
    {
        title: "Healthy Meal Prep",
        description: "Prepare a nutritious meal for yourself",
        category: "physical",
        difficulty: 2,
        points: 10,
        reason: "Good nutrition supports mental health"
    },
    {
        title: "Progressive Muscle Relaxation",
        description: "Tense and relax muscle groups to release tension",
        category: "mental",
        difficulty: 1,
        points: 8,
        reason: "You reported physical tension"
    },
    {
        title: "Declutter One Space",
        description: "Organize a small area of your living space",
        category: "productivity",
        difficulty: 2,
        points: 12,
        reason: "Clean environment reduces anxiety"
    }
];

/* --------------------------------------------------------------
   INITIALIZATION
   -------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    initTaskManager();
    bindEventListeners();
    generateAIRecommendations();
    renderDailyCheckin();
});

function initTaskManager() {
    loadTasks();
    renderTasks();
    updateStats();
    renderCharts();
    updateAIInsights();
}

/* --------------------------------------------------------------
   TASK MANAGEMENT
   -------------------------------------------------------------- */
function loadTasks() {
    const saved = localStorage.getItem(TASK_MANAGER_KEY);
    tasks = saved ? JSON.parse(saved) : [];
    
    // Add sample tasks for first-time users
    if (tasks.length === 0) {
        tasks = generateSampleTasks();
        saveTasks();
    }
}

function saveTasks() {
    localStorage.setItem(TASK_MANAGER_KEY, JSON.stringify(tasks));
}

function generateSampleTasks() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return [
        {
            id: '1',
            title: 'Morning meditation - 5 minutes',
            category: 'mindfulness',
            difficulty: 1,
            priority: 'medium',
            dueDate: today.toISOString().split('T')[0],
            completed: false,
            createdAt: new Date().toISOString(),
            notes: 'Focus on breath awareness'
        },
        {
            id: '2',
            title: '30-minute walk in nature',
            category: 'physical',
            difficulty: 2,
            priority: 'high',
            dueDate: today.toISOString().split('T')[0],
            completed: true,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
        },
        {
            id: '3',
            title: 'Call a friend or family member',
            category: 'social',
            difficulty: 2,
            priority: 'medium',
            dueDate: tomorrow.toISOString().split('T')[0],
            completed: false,
            createdAt: new Date().toISOString()
        }
    ];
}

function addTask(taskData) {
    const task = {
        id: generateId(),
        title: taskData.title,
        category: taskData.category,
        difficulty: parseInt(taskData.difficulty),
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        notes: taskData.notes,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(task);
    saveTasks();
    renderTasks();
    updateStats();
    renderCharts();
    updateAIInsights();
    
    showNotification('Wellness task added successfully!', 'success');
}

function completeTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = true;
        task.completedAt = new Date().toISOString();
        saveTasks();
        renderTasks();
        updateStats();
        renderCharts();
        updateAIInsights();
        
        // Award points
        awardPoints(task);
        
        showNotification('Great job completing your task!', 'success');
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
    updateStats();
    updateAIInsights();
    
    showNotification('Task removed', 'info');
}

function awardPoints(task) {
    const basePoints = CATEGORY_CONFIG[task.category].points;
    const difficultyMultiplier = task.difficulty;
    const pointsEarned = basePoints * difficultyMultiplier;
    
    // Update user points in localStorage
    const userStats = JSON.parse(localStorage.getItem('aiigood_user_stats') || '{}');
    userStats.totalPoints = (userStats.totalPoints || 0) + pointsEarned;
    userStats.tasksCompleted = (userStats.tasksCompleted || 0) + 1;
    
    // Update streak
    updateStreak();
    
    localStorage.setItem('aiigood_user_stats', JSON.stringify(userStats));
}

function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const userStats = JSON.parse(localStorage.getItem('aiigood_user_stats') || '{}');
    const lastCompletion = userStats.lastCompletion;
    
    if (lastCompletion === today) {
        return; // Already updated today
    }
    
    if (!lastCompletion) {
        userStats.currentStreak = 1;
    } else {
        const lastDate = new Date(lastCompletion);
        const todayDate = new Date(today);
        const dayDiff = (todayDate - lastDate) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
            userStats.currentStreak = (userStats.currentStreak || 0) + 1;
        } else if (dayDiff > 1) {
            userStats.currentStreak = 1; // Broken streak
        }
    }
    
    userStats.lastCompletion = today;
    userStats.longestStreak = Math.max(userStats.longestStreak || 0, userStats.currentStreak || 0);
    
    localStorage.setItem('aiigood_user_stats', JSON.stringify(userStats));
}

/* --------------------------------------------------------------
   RENDERING
   -------------------------------------------------------------- */
function renderTasks(filter = 'all') {
    const taskList = document.getElementById('taskList');
    let filteredTasks = [...tasks];
    
    // Apply filter
    switch (filter) {
        case 'pending':
            filteredTasks = tasks.filter(task => !task.completed && !isOverdue(task));
            break;
        case 'completed':
            filteredTasks = tasks.filter(task => task.completed);
            break;
        case 'overdue':
            filteredTasks = tasks.filter(task => !task.completed && isOverdue(task));
            break;
    }
    
    // Apply sorting
    const sortBy = document.getElementById('taskSort').value;
    filteredTasks.sort((a, b) => {
        switch (sortBy) {
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            case 'difficulty':
                return b.difficulty - a.difficulty;
            case 'category':
                return a.category.localeCompare(b.category);
            default: // dueDate
                return new Date(a.dueDate) - new Date(b.dueDate);
        }
    });
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No tasks found</h3>
                <p>${filter === 'all' ? 'Add your first wellness task to get started!' : `No ${filter} tasks at the moment.`}</p>
            </div>
        `;
    } else {
        taskList.innerHTML = filteredTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''} ${!task.completed && isOverdue(task) ? 'overdue' : ''}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="completeTask('${task.id}')">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title ${task.completed ? 'completed' : ''}">
                        ${task.title}
                        ${task.priority === 'high' ? '🚨' : task.priority === 'medium' ? '⚠️' : '📋'}
                    </div>
                    <div class="task-meta">
                        <span class="task-category">${CATEGORY_CONFIG[task.category].name}</span>
                        <span class="task-difficulty">${'⭐'.repeat(task.difficulty)}</span>
                        <span class="task-due">Due: ${formatDate(task.dueDate)}</span>
                        ${isOverdue(task) && !task.completed ? '<span class="task-overdue">Overdue</span>' : ''}
                    </div>
                    ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="btn-action" onclick="deleteTask('${task.id}')" title="Delete task">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    
    document.getElementById('taskCount').textContent = `${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'}`;
}

function generateAIRecommendations() {
    const container = document.getElementById('aiSuggestions');
    const shuffled = [...AI_RECOMMENDATIONS].sort(() => 0.5 - Math.random()).slice(0, 4);
    
    container.innerHTML = shuffled.map(rec => `
        <div class="recommendation-item" onclick="addAIRecommendation('${rec.title}')">
            <div class="recommendation-title">${rec.title}</div>
            <div class="recommendation-desc">${rec.description}</div>
            <div class="recommendation-meta">
                <span>${CATEGORY_CONFIG[rec.category].name}</span>
                <span>${'⭐'.repeat(rec.difficulty)}</span>
                <span>${rec.points} pts</span>
            </div>
        </div>
    `).join('');
}

function addAIRecommendation(title) {
    const recommendation = AI_RECOMMENDATIONS.find(rec => rec.title === title);
    if (recommendation) {
        // Pre-fill the form with AI recommendation
        document.getElementById('taskTitle').value = recommendation.title;
        document.getElementById('taskCategory').value = recommendation.category;
        document.getElementById('taskDifficulty').value = recommendation.difficulty.toString();
        document.getElementById('taskNotes').value = `AI Suggestion: ${recommendation.description}`;
        
        // Set due date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('taskDueDate').value = today;
        
        showNotification('AI recommendation added to form!', 'info');
        
        // Scroll to form
        document.getElementById('taskForm').scrollIntoView({ behavior: 'smooth' });
    }
}

/* --------------------------------------------------------------
   STATS & ANALYTICS
   -------------------------------------------------------------- */
function updateStats() {
    const userStats = JSON.parse(localStorage.getItem('aiigood_user_stats') || '{}');
    const completedTasks = tasks.filter(task => task.completed);
    const totalTasks = tasks.length;
    
    // Completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
    
    // Current streak
    const currentStreak = userStats.currentStreak || 0;
    document.getElementById('currentStreak').textContent = currentStreak;
    
    // Total points
    const totalPoints = userStats.totalPoints || 0;
    document.getElementById('totalPoints').textContent = totalPoints;
    
    // Mood impact (simplified - would integrate with journal data)
    const moodImpact = calculateMoodImpact();
    document.getElementById('moodImpact').textContent = `+${moodImpact}%`;
}

function calculateMoodImpact() {
    // Simplified calculation - in real app, this would analyze journal entries
    const completedCount = tasks.filter(task => task.completed).length;
    const baseImprovement = Math.min(completedCount * 2, 20); // Max 20% improvement
    return baseImprovement;
}

function renderCharts() {
    renderCompletionChart();
    renderCategoryChart();
}

function renderCompletionChart() {
    const ctx = document.getElementById('completionChart');
    if (!ctx) return;
    
    const last7Days = getLast7Days();
    const completionData = last7Days.map(date => {
        const dayTasks = tasks.filter(task => {
            const taskDate = task.completedAt ? task.completedAt.split('T')[0] : null;
            return taskDate === date;
        });
        return dayTasks.length;
    });
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const colors = isDark ? {
        grid: 'rgba(255,255,255,0.1)',
        ticks: '#EEE',
        primary: '#FF8A80'
    } : {
        grid: 'rgba(0,0,0,0.06)',
        ticks: '#333',
        primary: '#FF6B9D'
    };
    
    if (charts.completion) charts.completion.destroy();
    
    charts.completion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days.map(date => formatDateShort(date)),
            datasets: [{
                label: 'Tasks Completed',
                data: completionData,
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: colors.grid },
                    ticks: { color: colors.ticks }
                },
                x: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.ticks }
                }
            }
        }
    });
}

function renderCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    const categoryData = {};
    Object.keys(CATEGORY_CONFIG).forEach(category => {
        categoryData[category] = tasks.filter(task => 
            task.category === category && task.completed
        ).length;
    });
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (charts.category) charts.category.destroy();
    
    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.values(CATEGORY_CONFIG).map(cat => cat.name),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: Object.values(CATEGORY_CONFIG).map(cat => cat.color),
                borderWidth: 2,
                borderColor: isDark ? '#2d2d2d' : '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#EEE' : '#333',
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

function updateAIInsights() {
    const completedCount = tasks.filter(task => task.completed).length;
    const totalCount = tasks.length;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    let insight = '';
    let productivityScore = 0;
    let wellnessBalance = 0;
    let consistencyScore = 0;
    
    if (completedCount === 0) {
        insight = "Start with small, manageable tasks to build momentum. Even completing one task can boost your mood!";
    } else if (completionRate < 30) {
        insight = "You're making a start! Try breaking larger tasks into smaller steps to make progress feel more achievable.";
        productivityScore = 40;
        wellnessBalance = 35;
        consistencyScore = 25;
    } else if (completionRate < 70) {
        insight = "Good progress! You're building consistent habits. Remember to balance different types of wellness activities.";
        productivityScore = 65;
        wellnessBalance = 55;
        consistencyScore = 60;
    } else {
        insight = "Excellent consistency! You're maintaining strong wellness habits. Consider challenging yourself with new activities.";
        productivityScore = 85;
        wellnessBalance = 75;
        consistencyScore = 80;
    }
    
    // Calculate category balance
    const categoryCounts = {};
    tasks.forEach(task => {
        if (task.completed) {
            categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
        }
    });
    
    const uniqueCategories = Object.keys(categoryCounts).length;
    wellnessBalance = Math.min(uniqueCategories * 20, 100);
    
    document.getElementById('mainInsight').textContent = insight;
    document.getElementById('productivityScore').textContent = productivityScore;
    document.getElementById('wellnessBalance').textContent = `${wellnessBalance}%`;
    document.getElementById('consistencyScore').textContent = `${consistencyScore}%`;
}

/* --------------------------------------------------------------
   DAILY CHECK-IN
   -------------------------------------------------------------- */
function renderDailyCheckin() {
    const today = new Date().toISOString().split('T')[0];
    const checkins = JSON.parse(localStorage.getItem(USER_CHECKINS_KEY) || '{}');
    const todayCheckin = checkins[today];
    
    if (todayCheckin) {
        document.getElementById('checkinStatus').textContent = 'Completed today';
        document.getElementById('checkinStatus').classList.add('completed');
        
        // Pre-fill with today's data
        const moodOption = document.querySelector(`.mood-option[data-mood="${todayCheckin.mood}"]`);
        if (moodOption) moodOption.classList.add('active');
        
        document.getElementById('energyLevel').value = todayCheckin.energy;
    }
}

function submitDailyCheckin() {
    const selectedMood = document.querySelector('.mood-option.active');
    const energyLevel = document.getElementById('energyLevel').value;
    
    if (!selectedMood) {
        showNotification('Please select how you are feeling today', 'error');
        return;
    }
    
    const mood = parseInt(selectedMood.dataset.mood);
    const today = new Date().toISOString().split('T')[0];
    
    const checkins = JSON.parse(localStorage.getItem(USER_CHECKINS_KEY) || '{}');
    checkins[today] = {
        mood: mood,
        energy: parseInt(energyLevel),
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(USER_CHECKINS_KEY, JSON.stringify(checkins));
    
    document.getElementById('checkinStatus').textContent = 'Completed today';
    document.getElementById('checkinStatus').classList.add('completed');
    
    showNotification('Daily check-in completed!', 'success');
    updateAIInsights(); // Refresh insights with new mood data
}

/* --------------------------------------------------------------
   EVENT LISTENERS
   -------------------------------------------------------------- */
function bindEventListeners() {
    // Task form
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    
    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderTasks(e.target.dataset.filter);
        });
    });
    
    // Sort
    document.getElementById('taskSort').addEventListener('change', () => {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        renderTasks(activeFilter);
    });
    
    // AI refresh
    document.getElementById('refreshAI').addEventListener('click', generateAIRecommendations);
    
    // Mood options
    document.querySelectorAll('.mood-option').forEach(option => {
        option.addEventListener('click', (e) => {
            document.querySelectorAll('.mood-option').forEach(opt => opt.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
    
    // Daily check-in
    document.getElementById('submitCheckin').addEventListener('click', submitDailyCheckin);
    
    // Theme change handling for charts
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            setTimeout(() => {
                renderCharts();
                updateAIInsights();
            }, 100);
        });
    }
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('taskTitle').value,
        category: document.getElementById('taskCategory').value,
        difficulty: document.getElementById('taskDifficulty').value,
        priority: document.getElementById('taskPriority').value,
        dueDate: document.getElementById('taskDueDate').value,
        notes: document.getElementById('taskNotes').value
    };
    
    addTask(formData);
    
    // Reset form
    e.target.reset();
    document.getElementById('taskDueDate').value = new Date().toISOString().split('T')[0];
}

/* --------------------------------------------------------------
   UTILITY FUNCTIONS
   -------------------------------------------------------------- */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function isOverdue(task) {
    if (task.completed) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate < today;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
    }
    return days;
}

function showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        padding: 0.75rem 1.25rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    if (type === 'success') notification.style.background = '#10b981';
    else if (type === 'error') notification.style.background = '#ef4444';
    else notification.style.background = '#3b82f6';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize with today's date
document.getElementById('taskDueDate').value = new Date().toISOString().split('T')[0];
