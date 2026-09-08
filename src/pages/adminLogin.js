import { store } from '../store.js';

const API = import.meta.env.VITE_API_URL || '';

export function AdminLoginPage(container) {

  window.handleAdminLogin = async (e) => {
    e.preventDefault();

    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const btn = document.getElementById('admin-login-btn');
    const error = document.getElementById('admin-error');

    if (!email || !password) {
      error.textContent = 'Please enter your admin credentials.';
      error.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="auth-spinner"></span> Authenticating...';
    error.style.display = 'none';

    try {
      const res = await fetch(`${API}/api/auth/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        error.textContent =
          data.error || 'Authentication failed.';

        error.style.display = 'block';
        btn.disabled = false;

        btn.innerHTML =
          '<i data-lucide="shield" style="width:18px;"></i> Admin Sign In';

        if (window.lucide) {
          window.lucide.createIcons();
        }

        return;
      }

      // Save admin JWT and user
      localStorage.setItem(
        'ck_admin_token',
        data.token
      );

      localStorage.setItem(
        'ck_admin_user',
        JSON.stringify(data.user)
      );

      // Keep normal token/user in sync
      localStorage.setItem(
        'ck_token',
        data.token
      );

      localStorage.setItem(
        'ck_user',
        JSON.stringify(data.user)
      );

      store.set('user', {
        ...data.user,
        loggedIn: true
      });

      // Success feedback
      btn.innerHTML = '✓ Access Granted';

      btn.style.background =
        'linear-gradient(135deg, #00c896, #00e676)';

      setTimeout(() => {
        window.location.hash = '/admin';
      }, 600);

    } catch (err) {
      console.error(
        'Admin login error:',
        err
      );

      error.textContent =
        'Cannot connect to server. Please try again.';

      error.style.display = 'block';

      btn.disabled = false;

      btn.innerHTML =
        '<i data-lucide="shield" style="width:18px;"></i> Admin Sign In';

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };

  window.toggleAdminPassword = () => {
    const input =
      document.getElementById('admin-password');

    const icon =
      document.getElementById('admin-eye-icon');

    if (input.type === 'password') {
      input.type = 'text';
      icon.setAttribute(
        'data-lucide',
        'eye-off'
      );
    } else {
      input.type = 'password';
      icon.setAttribute(
        'data-lucide',
        'eye'
      );
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  container.innerHTML = `
    <div class="admin-login-page">

      <!-- Animated background -->
      <div class="admin-bg">
        <div class="admin-bg-grid"></div>
        <div class="admin-bg-orb orb-1"></div>
        <div class="admin-bg-orb orb-2"></div>
        <div class="admin-bg-scan"></div>
      </div>

      <div class="admin-login-wrap">

        <!-- Top badge -->
        <div class="admin-badge reveal">
          <i data-lucide="shield-alert" style="width:16px;"></i>
          RESTRICTED ACCESS — ADMIN ONLY
        </div>

        <!-- Card -->
        <div class="admin-card glass-card reveal delay-1">

          <!-- Header -->
          <div class="admin-card-header">

            <div class="admin-logo-wrap">
              <div class="admin-logo-icon">⚡</div>
              <div class="admin-logo-ring"></div>
            </div>

            <h1 class="admin-card-title">
              Admin Control Panel
            </h1>

            <p class="admin-card-sub">
              CircuitKart — Backend Administration
            </p>

          </div>

          <!-- Form -->
          <form onsubmit="handleAdminLogin(event)">

            <div
              class="admin-error"
              id="admin-error"
              style="display:none;"
            ></div>

            <div class="admin-field">

              <label class="admin-label">
                <i data-lucide="mail" style="width:14px;"></i>
                Admin Email
              </label>

              <div class="auth-input-wrap">

                <i
                  data-lucide="mail"
                  class="auth-input-icon"
                ></i>

                <input
                  id="admin-email"
                  type="email"
                  class="auth-input admin-input"
                  placeholder="admin@circuitkart.com"
                  required
                  autocomplete="email"
                >

              </div>
            </div>

            <div class="admin-field">

              <label class="admin-label">
                <i data-lucide="lock" style="width:14px;"></i>
                Admin Password
              </label>

              <div class="auth-input-wrap">

                <i
                  data-lucide="lock"
                  class="auth-input-icon"
                ></i>

                <input
                  id="admin-password"
                  type="password"
                  class="auth-input admin-input"
                  placeholder="Enter admin password"
                  required
                  autocomplete="current-password"
                >

                <button
                  type="button"
                  class="auth-eye-btn"
                  onclick="toggleAdminPassword()"
                >
                  <i
                    id="admin-eye-icon"
                    data-lucide="eye"
                  ></i>
                </button>

              </div>
            </div>

            <button
              id="admin-login-btn"
              type="submit"
              class="admin-submit-btn"
            >
              <i
                data-lucide="shield"
                style="width:18px;"
              ></i>
              Admin Sign In
            </button>

          </form>

          <!-- Footer info -->
          <div class="admin-card-footer">

            <i
              data-lucide="info"
              style="width:13px; color: var(--text-tertiary);"
            ></i>

            <span>
              This portal is for authorized administrators only.
              All access attempts are logged.
            </span>

          </div>

        </div>

        <!-- Back link -->
        <a
          href="#/login"
          class="admin-back-link reveal delay-2"
        >
          <i
            data-lucide="arrow-left"
            style="width:14px;"
          ></i>
          Back to Customer Login
        </a>

      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }
}