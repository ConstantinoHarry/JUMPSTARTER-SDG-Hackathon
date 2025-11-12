/* ==============================================================
   AUTHENTICATION LOGIC
   ============================================================== */

// Guard DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLanguage();
    initAuthTabs();
    initFormHandlers();
    initPasswordStrength();
    initStatsCounters();
    bindCrisis();
});

/* THEME & LANGUAGE (reuse from main script) */
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

/* AUTH TABS */
function initAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update forms
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${targetTab}Form`) {
                    form.classList.add('active');
                }
            });
        });
    });
}

/* FORM HANDLERS */
function initFormHandlers() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Password visibility toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', togglePasswordVisibility);
    });
    
    // Social auth buttons
    document.querySelectorAll('.btn-social').forEach(btn => {
        btn.addEventListener('click', handleSocialAuth);
    });
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Basic validation
    if (!email || !password) {
        showFormMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showFormMessage('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.classList.add('loading');
    
    // Simulate API call
    setTimeout(() => {
        submitBtn.classList.remove('loading');
        
        // Mock authentication - in real app, this would be an API call
        if (authenticateUser(email, password)) {
            showFormMessage('Login successful! Redirecting...', 'success');
            
            // Store user session
            const userSession = {
                email: email,
                name: email.split('@')[0],
                userType: 'adult', // Default, would come from actual user data
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe
            };
            
            localStorage.setItem('aiigood_user', JSON.stringify(userSession));
            
            // Redirect to main page after short delay (from login_page -> root)
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1500);
        } else {
            showFormMessage('Invalid email or password', 'error');
        }
    }, 1500);
}

function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const userType = document.getElementById('userType').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validation
    if (!name || !email || !password || !confirmPassword || !userType) {
        showFormMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showFormMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showFormMessage('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 8) {
        showFormMessage('Password must be at least 8 characters long', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showFormMessage('Please agree to the Terms of Service and Privacy Policy', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.classList.add('loading');
    
    // Simulate API call
    setTimeout(() => {
        submitBtn.classList.remove('loading');
        
        // Mock registration - in real app, this would be an API call
        if (registerUser({ name, email, password, userType })) {
            showFormMessage('Account created successfully! Redirecting...', 'success');
            
            // Auto-login after registration
            const userSession = {
                email: email,
                name: name,
                userType: userType,
                loginTime: new Date().toISOString(),
                rememberMe: false
            };
            
            localStorage.setItem('aiigood_user', JSON.stringify(userSession));
            
            // Update global stats (mock)
            updateGlobalStats();
            
            // Redirect to main page (from signup in login_page -> root index)
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1500);
        } else {
            showFormMessage('Email already exists. Please try logging in instead.', 'error');
        }
    }, 2000);
}

function handleSocialAuth(e) {
    const provider = e.target.classList.contains('google') ? 'google' : 'apple';
    showFormMessage(`${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication coming soon!`, 'info');
}

/* PASSWORD STRENGTH */
function initPasswordStrength() {
    const passwordInput = document.getElementById('signupPassword');
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', updatePasswordStrength);
}

function updatePasswordStrength() {
    const password = document.getElementById('signupPassword').value;
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    let feedback = '';
    
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    
    // Update visual indicator
    strengthBar.style.setProperty('--strength-width', `${strength}%`);
    
    // Update color and text based on strength
    if (strength === 0) {
        strengthBar.style.backgroundColor = '#e9ecef';
        strengthText.textContent = 'Password strength';
    } else if (strength <= 25) {
        strengthBar.style.backgroundColor = '#ff4757';
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#ff4757';
    } else if (strength <= 50) {
        strengthBar.style.backgroundColor = '#ffa502';
        strengthText.textContent = 'Fair';
        strengthText.style.color = '#ffa502';
    } else if (strength <= 75) {
        strengthBar.style.backgroundColor = '#2ed573';
        strengthText.textContent = 'Good';
        strengthText.style.color = '#2ed573';
    } else {
        strengthBar.style.backgroundColor = '#1e90ff';
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#1e90ff';
    }
}

/* PASSWORD VISIBILITY */
function togglePasswordVisibility(e) {
    const button = e.target;
    const input = button.parentElement.querySelector('input[type="password"], input[type="text"]');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
        button.setAttribute('aria-label', 'Hide password');
    } else {
        input.type = 'password';
        button.textContent = '👁️';
        button.setAttribute('aria-label', 'Show password');
    }
}

/* FORM MESSAGES */
function showFormMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.form-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageEl = document.createElement('div');
    messageEl.className = `form-message ${type}`;
    messageEl.textContent = message;
    
    // Insert after active form
    const activeForm = document.querySelector('.auth-form.active');
    if (activeForm) {
        activeForm.insertBefore(messageEl, activeForm.firstChild);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 5000);
}

/* STATS COUNTERS */
function initStatsCounters() {
    const duration = 2000; // ms total
    const ease = t => 1 - Math.pow(1 - t, 3); // easeOutCubic
    
    document.querySelectorAll('.stat-number').forEach(stat => {
        const targetText = stat.dataset.target;
        let targetValue;
        
        if (targetText.includes('%')) {
            targetValue = parseFloat(targetText);
        } else if (targetText === '24/7') {
            // Special case for 24/7 stat
            stat.textContent = '24/7';
            return;
        } else {
            targetValue = parseInt(targetText.replace(/,/g, ''));
        }
        
        const startTime = performance.now();
        
        const step = now => {
            const p = Math.min(1, (now - startTime) / duration);
            const v = targetValue * ease(p);
            
            if (targetText.includes('%')) {
                stat.textContent = v.toFixed(1) + '%';
            } else {
                stat.textContent = Math.floor(v).toLocaleString();
            }
            
            if (p < 1) {
                requestAnimationFrame(step);
            } else {
                // Snap to exact target at the end
                if (targetText.includes('%')) {
                    stat.textContent = targetValue.toFixed(1) + '%';
                } else {
                    stat.textContent = Math.round(targetValue).toLocaleString();
                }
            }
        };
        
        requestAnimationFrame(step);
    });
}

/* MOCK AUTHENTICATION */
function authenticateUser(email, password) {
    // Mock authentication - in real app, this would validate against a backend
    const users = JSON.parse(localStorage.getItem('aiigood_users') || '[]');
    return users.some(user => user.email === email && user.password === password);
}

function registerUser(userData) {
    // Mock registration - in real app, this would send to a backend
    const users = JSON.parse(localStorage.getItem('aiigood_users') || '[]');
    
    // Check if user already exists
    if (users.some(user => user.email === userData.email)) {
        return false;
    }
    
    // Add new user (in real app, password would be hashed)
    users.push(userData);
    localStorage.setItem('aiigood_users', JSON.stringify(users));
    
    return true;
}

function updateGlobalStats() {
    // Mock function to update global user count
    // In real app, this would be handled by backend analytics
    console.log('New user registered - stats updated');
}

/* UTILITY FUNCTIONS */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/* CRISIS BUTTON */
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

/* SESSION MANAGEMENT */
function checkExistingSession() {
    const userSession = localStorage.getItem('aiigood_user');
    if (userSession) {
        // If user is already logged in, redirect to main page
        window.location.href = '../index.html';
    }
}

// Check for existing session on page load
checkExistingSession();