import { store } from '../store.js';

const API = import.meta.env.VITE_API_URL || '';

export function LoginPage(container) {

  window.switchAuthTab = (tab) => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + tab).classList.add('active');
  };

  window.handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const error = document.getElementById('login-error');

    if (!email || !password) {
      error.textContent = 'Please fill in all fields.';
      error.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="auth-spinner"></span> Signing in...';
    error.style.display = 'none';

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        error.textContent = data.error || 'Login failed. Please try again.';
        error.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
        return;
      }

      // Save JWT and user to localStorage
      localStorage.setItem('ck_token', data.token);
      localStorage.setItem('ck_user', JSON.stringify(data.user));
      store.set('user', { ...data.user, loggedIn: true });

      window.location.hash = '/dashboard';
    } catch (err) {
      error.textContent = 'Cannot connect to server. Please try again.';
      error.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = 'Sign In';
    }
  };

  window.handleRegister = async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const phone = document.getElementById('reg-phone')?.value.trim() || '';
    const college = document.getElementById('reg-college')?.value.trim() || '';
    const address = document.getElementById('reg-address')?.value.trim() || '';
    const btn = document.getElementById('reg-btn');
    const error = document.getElementById('reg-error');

    error.style.display = 'none';

    if (!name || !email || !password || !confirm) {
      error.textContent = 'Please fill in all required fields (Name, Email, Password).';
      error.style.display = 'block';
      return;
    }
    if (password !== confirm) {
      error.textContent = 'Passwords do not match.';
      error.style.display = 'block';
      return;
    }
    if (password.length < 6) {
      error.textContent = 'Password must be at least 6 characters.';
      error.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="auth-spinner"></span> Creating account...';

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, college, address })
      });

      const data = await res.json();

      if (!res.ok) {
        error.textContent = data.error || 'Registration failed. Please try again.';
        error.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
        return;
      }

      // Save JWT and user
      localStorage.setItem('ck_token', data.token);
      localStorage.setItem('ck_user', JSON.stringify(data.user));
      store.set('user', { ...data.user, loggedIn: true });

      window.location.hash = '/dashboard';
    } catch (err) {
      error.textContent = 'Cannot connect to server. Please try again.';
      error.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = 'Create Account';
    }
  };

  window.togglePassword = (id, iconId) => {
    const input = document.getElementById(id);
    const icon = document.getElementById(iconId);
    if (input.type === 'password') {
      input.type = 'text';
      icon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      icon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) window.lucide.createIcons();
  };

  container.innerHTML = `
    <div class="login-page">
      <!-- Background decoration -->
      <div class="login-bg-decoration">
        <div class="login-orb login-orb-1"></div>
        <div class="login-orb login-orb-2"></div>
        <div class="login-orb login-orb-3"></div>
        <div class="login-grid"></div>
      </div>

      <div class="login-container">
        <!-- Left Panel - Branding -->
        <div class="login-left reveal">
          <div class="login-brand">
            <div class="logo-icon" style="width: 56px; height: 56px; background: var(--gradient-primary); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: var(--space-lg);">⚡</div>
            <h1 class="login-brand-title">Circuit<span>Kart</span></h1>
            <p class="login-brand-sub">Your gateway to professional embedded systems, IoT, and robotics projects.</p>
          </div>

          <div class="login-features">
            <div class="login-feature-item">
              <div class="login-feature-icon" style="background: rgba(0,212,255,0.1); color: var(--accent-cyan);">
                <i data-lucide="zap"></i>
              </div>
              <div>
                <div class="login-feature-title">Real-time Tracking</div>
                <div class="login-feature-desc">Monitor your orders live from placement to delivery</div>
              </div>
            </div>
            <div class="login-feature-item">
              <div class="login-feature-icon" style="background: rgba(0,102,255,0.1); color: #6699ff;">
                <i data-lucide="shield-check"></i>
              </div>
              <div>
                <div class="login-feature-title">Secure Payments</div>
                <div class="login-feature-desc">UPI, cards, net banking — all protected</div>
              </div>
            </div>
            <div class="login-feature-item">
              <div class="login-feature-icon" style="background: rgba(0,230,118,0.1); color: var(--accent-green);">
                <i data-lucide="cpu"></i>
              </div>
              <div>
                <div class="login-feature-title">Expert Projects</div>
                <div class="login-feature-desc">300+ production-ready kits for every skill level</div>
              </div>
            </div>
          </div>

          <div class="login-stats">
            <div class="login-stat"><span class="login-stat-num">10K+</span><span class="login-stat-label">Customers</span></div>
            <div class="login-stat"><span class="login-stat-num">300+</span><span class="login-stat-label">Projects</span></div>
            <div class="login-stat"><span class="login-stat-num">4.9★</span><span class="login-stat-label">Rating</span></div>
          </div>
        </div>

        <!-- Right Panel - Auth Form -->
        <div class="login-right reveal delay-1">
          <div class="auth-card glass-card">
            <div class="auth-header">
              <h2 class="auth-title">Welcome Back</h2>
              <p class="auth-subtitle">Sign in to access your dashboard and orders</p>
            </div>

            <!-- Tabs -->
            <div class="auth-tabs">
              <button id="tab-login" class="auth-tab active" onclick="switchAuthTab('login')">Sign In</button>
              <button id="tab-register" class="auth-tab" onclick="switchAuthTab('register')">Create Account</button>
            </div>

            <!-- Login Panel -->
            <div id="panel-login" class="auth-panel active">
              <form onsubmit="handleLogin(event)">
                <div class="auth-error" id="login-error" style="display:none;"></div>

                <div class="form-group" style="margin-bottom: var(--space-lg);">
                  <label class="auth-label">Email Address</label>
                  <div class="auth-input-wrap">
                    <i data-lucide="mail" class="auth-input-icon"></i>
                    <input id="login-email" type="email" class="auth-input" placeholder="you@example.com" required autocomplete="email">
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: var(--space-sm);">
                  <label class="auth-label">Password</label>
                  <div class="auth-input-wrap">
                    <i data-lucide="lock" class="auth-input-icon"></i>
                    <input id="login-password" type="password" class="auth-input" placeholder="Enter your password" required autocomplete="current-password">
                    <button type="button" class="auth-eye-btn" onclick="togglePassword('login-password', 'login-eye')">
                      <i id="login-eye" data-lucide="eye"></i>
                    </button>
                  </div>
                </div>

                <div class="auth-row" style="margin-bottom: var(--space-xl);">
                  <label class="auth-remember">
                    <input type="checkbox"> <span>Remember me</span>
                  </label>
                  <a href="#" class="auth-forgot">Forgot password?</a>
                </div>

                <button id="login-btn" type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: var(--fs-md);">
                  Sign In
                </button>

                <div class="auth-divider"><span>or continue with</span></div>

                <div class="auth-social-row">
                  <button type="button" class="auth-social-btn" onclick="alert('Google login coming soon!')">
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google
                  </button>
                  <button type="button" class="auth-social-btn" onclick="alert('GitHub login coming soon!')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    GitHub
                  </button>
                </div>
              </form>
            </div>

            <!-- Register Panel -->
            <div id="panel-register" class="auth-panel">
              <form onsubmit="handleRegister(event)">
                <div class="auth-error" id="reg-error" style="display:none;"></div>

                <div class="form-group" style="margin-bottom: var(--space-md);">
                  <label class="auth-label">Full Name *</label>
                  <div class="auth-input-wrap">
                    <i data-lucide="user" class="auth-input-icon"></i>
                    <input id="reg-name" type="text" class="auth-input" placeholder="Lohith R" required autocomplete="name">
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: var(--space-md);">
                  <label class="auth-label">Email Address *</label>
                  <div class="auth-input-wrap">
                    <i data-lucide="mail" class="auth-input-icon"></i>
                    <input id="reg-email" type="email" class="auth-input" placeholder="you@example.com" required autocomplete="email">
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: var(--space-md);">
                  <label class="auth-label">Phone Number (Optional)</label>
                  <div class="auth-input-wrap">
                    <i data-lucide="phone" class="auth-input-icon"></i>
                    <input id="reg-phone" type="tel" class="auth-input" placeholder="+91 9876543210">
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: var(--space-md);">
                  <label class="auth-label">College / Institution (Optional)</label>
                  <div class="auth-input-wrap">
                    <i data-lucide="building" class="auth-input-icon"></i>
                    <input id="reg-college" type="text" class="auth-input" placeholder="e.g. NIT Trichy">
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: var(--space-md);">
                  <label class="auth-label">Delivery Address (Optional)</label>
                  <div class="auth-input-wrap">
                    <i data-lucide="map-pin" class="auth-input-icon"></i>
                    <input id="reg-address" type="text" class="auth-input" placeholder="Full address for shipping">
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: var(--space-md);">
                  <label class="auth-label">Password *</label>
                  <div class="auth-input-wrap">
                    <i data-lucide="lock" class="auth-input-icon"></i>
                    <input id="reg-password" type="password" class="auth-input" placeholder="Min. 6 characters" required>
                    <button type="button" class="auth-eye-btn" onclick="togglePassword('reg-password', 'reg-eye')">
                      <i id="reg-eye" data-lucide="eye"></i>
                    </button>
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: var(--space-xl);">
                  <label class="auth-label">Confirm Password</label>
                  <div class="auth-input-wrap">
                    <i data-lucide="lock" class="auth-input-icon"></i>
                    <input id="reg-confirm" type="password" class="auth-input" placeholder="Re-enter password" required>
                  </div>
                </div>

                <button id="reg-btn" type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: var(--fs-md);">
                  Create Account
                </button>

                <p class="auth-terms">
                  By registering, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                </p>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}
