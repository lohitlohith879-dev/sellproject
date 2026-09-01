import { router } from './router.js';
import { store } from './store.js';
import { HomePage } from './pages/home.js';
import { ProjectsPage } from './pages/projects.js';
import { ProjectDetailPage } from './pages/projectDetail.js';
import { CustomizerPage } from './pages/customizer.js';
import { CartPage } from './pages/cart.js';
import { CheckoutPage } from './pages/checkout.js';
import { CustomProjectPage } from './pages/customProject.js';
import { DashboardPage } from './pages/dashboard.js';
import { AdminPage } from './pages/admin.js';
import { LoginPage } from './pages/login.js';
import { AdminLoginPage } from './pages/adminLogin.js';
import { OrderTrackingPage } from './pages/orderTracking.js';
import { socketManager } from './socket/socket.js';

// Setup basic app shell
const app = document.getElementById('app');

// Inject toast notification container
const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} reveal`;
  
  let icon = 'info';
  if (type === 'order') icon = 'package';
  if (type === 'quote') icon = 'file-text';
  if (type === 'success') icon = 'check-circle';
  
  toast.innerHTML = `
    <div class="toast-icon"><i data-lucide="${icon}"></i></div>
    <div class="toast-content">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()"><i data-lucide="x"></i></button>
  `;
  toastContainer.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function renderNavbar() {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.innerHTML = `
      <div class="nav-inner">
        <a href="#/" class="logo">
          <div class="logo-icon">⚡</div>
          <div class="logo-text">Circuit<span>Kart</span></div>
        </a>
        <div class="nav-links">
          <a href="#/" class="nav-link ${router.currentRoute === '/' ? 'active' : ''}">Home</a>
          <a href="#/projects" class="nav-link ${router.currentRoute && router.currentRoute.startsWith('/project') ? 'active' : ''}">Projects</a>
          <a href="#/customizer" class="nav-link ${router.currentRoute === '/customizer' ? 'active' : ''}">Build Your Project</a>
          <a href="#/custom-project" class="nav-link ${router.currentRoute === '/custom-project' ? 'active' : ''}">Custom Project</a>
        </div>
        <div class="nav-actions">
          ${store.get('user')?.loggedIn 
            ? `
              <a href="#/dashboard" class="btn btn-ghost btn-sm" title="Dashboard"><i data-lucide="user"></i></a>
              <button id="notif-bell-btn" class="btn btn-ghost btn-sm" style="position:relative;" onclick="window.toggleNotifPanel()" title="Notifications">
                <i data-lucide="bell" style="width:18px;"></i>
                ${store.get('unreadNotifCount') > 0
                  ? `<span style="position:absolute;top:2px;right:2px;background:#ef4444;color:#fff;border-radius:50%;width:16px;height:16px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;">${store.get('unreadNotifCount')}</span>`
                  : ''}
              </button>`
            : `<a href="#/login" class="btn btn-ghost btn-sm" style="font-size:var(--fs-sm); gap: 6px;"><i data-lucide="log-in"></i> Sign In</a>`
          }
          <a href="#/cart" class="cart-btn" title="Cart">
            <i data-lucide="shopping-cart"></i>
            ${store.getCartCount() > 0 ? `<span class="cart-badge">${store.getCartCount()}</span>` : ''}
          </a>
          <!-- Added simple mobile menu toggle for demo -->
          <div class="mobile-menu-btn" onclick="this.classList.toggle('active'); document.getElementById('mobile-nav').classList.toggle('open');">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      <!-- Mobile Nav -->
      <div id="mobile-nav" class="mobile-nav">
        <a href="#/" class="nav-link" onclick="document.querySelector('.mobile-menu-btn').click()">Home</a>
        <a href="#/projects" class="nav-link" onclick="document.querySelector('.mobile-menu-btn').click()">Projects</a>
        <a href="#/customizer" class="nav-link" onclick="document.querySelector('.mobile-menu-btn').click()">Build Your Project</a>
        <a href="#/custom-project" class="nav-link" onclick="document.querySelector('.mobile-menu-btn').click()">Custom Project</a>
        <a href="#/dashboard" class="nav-link" onclick="document.querySelector('.mobile-menu-btn').click()">Dashboard</a>
        <a href="#" class="nav-link" onclick="window.logout(); document.querySelector('.mobile-menu-btn').click()">Logout</a>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

// Global footer renderer
function renderFooter() {
  const footer = document.getElementById('footer-content');
  if (footer) {
    footer.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="#/" class="logo flex gap-sm align-center text-heading font-bold text-xl" style="margin-bottom: var(--space-md);">
              <div class="logo-icon" style="width: 32px; height: 32px; background: var(--gradient-primary); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 16px;">⚡</div>
              CircuitKart
            </a>
            <p>Your ultimate destination for professional embedded systems, IoT, and robotics projects. Build, learn, and innovate with our production-ready kits.</p>
            <div class="footer-social">
              <a href="#"><i data-lucide="twitter"></i></a>
              <a href="#"><i data-lucide="github"></i></a>
              <a href="#"><i data-lucide="youtube"></i></a>
              <a href="#"><i data-lucide="linkedin"></i></a>
            </div>
          </div>
          
          <div class="footer-col">
            <h4>Projects</h4>
            <a href="#/projects?category=arduino">Arduino</a>
            <a href="#/projects?category=esp32">ESP32 & NodeMCU</a>
            <a href="#/projects?category=raspberry-pi">Raspberry Pi</a>
            <a href="#/projects?category=iot">Internet of Things</a>
            <a href="#/projects?category=robotics">Robotics</a>
          </div>
          
          <div class="footer-col">
            <h4>Services</h4>
            <a href="#/customizer">Project Customizer</a>
            <a href="#/custom-project">Custom Project Request</a>
            <a href="#">PCB Design</a>
            <a href="#">3D Printing</a>
            <a href="#">Student Discounts</a>
          </div>
          
          <div class="footer-col">
            <h4>Company</h4>
            <a href="#/about">About Us</a>
            <a href="#/contact">Contact Us</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">FAQ</a>
          </div>
        </div>
        
        <div class="footer-bottom">
          <div>&copy; ${new Date().getFullYear()} CircuitKart. All rights reserved.</div>
          <div class="flex gap-md">
            <span><i data-lucide="shield-check" style="width:14px; vertical-align:middle;"></i> Secure Checkout</span>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

// Add scroll listener for navbar blur effect
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// App-level events
window.appEvents = {
  saveProject: (id) => {
    alert('Project saved: ' + id);
  }
};

async function initApp() {
  // Restore user session from localStorage
  const savedUser = localStorage.getItem('ck_user');
  const savedAdmin = localStorage.getItem('ck_admin_user');
  const isAdminRoute = window.location.hash.startsWith('#/admin');
  
  // Connect socket based on context
  if (isAdminRoute && savedAdmin) {
    try {
      const user = JSON.parse(savedAdmin);
      store.set('user', { ...user, loggedIn: true });
      socketManager.connect(localStorage.getItem('ck_admin_token'), 'admin');
    } catch (e) {}
  } else if (!isAdminRoute && savedUser) {
    try {
      const user = JSON.parse(savedUser);
      store.set('user', { ...user, loggedIn: true });
      socketManager.connect(localStorage.getItem('ck_token'), 'customer');
    } catch (e) {}
  }

  // Global logout function
  window.logout = () => {
    localStorage.removeItem('ck_token');
    localStorage.removeItem('ck_user');
    localStorage.removeItem('ck_admin_token');
    localStorage.removeItem('ck_admin_user');
    store.set('user', null);
    socketManager.disconnect();
    window.location.hash = '/login';
  };

  // Add a hook to update navbar active state on route change
  router.after(() => renderNavbar());
  
  renderNavbar();
  renderFooter();
  store.on('cart', () => renderNavbar());
  
  // Listen for global notifications
  store.on('notification', (notif) => {
    showToast(notif.message || notif.title, notif.type || 'info');
  });

  // Notification bell toggle
  window.toggleNotifPanel = async () => {
    let panel = document.getElementById('notif-panel');
    if (panel) { panel.remove(); return; }

    const token = localStorage.getItem('ck_token');
    if (!token) return;
    let notifs = [];
    try {
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) notifs = await res.json();
    } catch(e) {}

    panel = document.createElement('div');
    panel.id = 'notif-panel';
    panel.style.cssText = 'position:fixed;top:60px;right:16px;width:340px;max-height:420px;overflow-y:auto;background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:14px;z-index:9998;box-shadow:0 8px 32px rgba(0,0,0,.4);padding:0;';
    panel.innerHTML = `
      <div style="padding:14px 16px;border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;">
        <h4 style="font-weight:700;font-size:.9rem;color:var(--text-heading);">Notifications</h4>
        <button onclick="document.getElementById('notif-panel').remove()" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;font-size:18px;">✕</button>
      </div>
      ${notifs.length === 0 
        ? '<div style="padding:2rem;text-align:center;color:var(--text-tertiary);font-size:.85rem;">No notifications</div>'
        : notifs.map(n => `
          <div style="padding:12px 16px;border-bottom:1px solid var(--border-subtle);background:${n.isRead ? 'transparent' : 'rgba(0,212,255,0.05)'};" onclick="this.style.background='transparent';">
            <div style="font-size:.83rem;font-weight:${n.isRead ? '400' : '600'};color:var(--text-heading);">${n.title || 'Update'}</div>
            <div style="font-size:.78rem;color:var(--text-secondary);margin-top:3px;">${n.message}</div>
            <div style="font-size:.72rem;color:var(--text-tertiary);margin-top:4px;">${new Date(n.date).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'})}</div>
          </div>`).join('')
      }
    `;
    document.body.appendChild(panel);
    // Mark all as read
    if (token) {
      notifs.filter(n => !n.isRead).forEach(n => {
        fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
      });
      store.set('unreadNotifCount', 0);
      renderNavbar();
    }
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function outside(e) {
        if (!panel.contains(e.target) && e.target.id !== 'notif-bell-btn') {
          panel.remove();
          document.removeEventListener('click', outside);
        }
      });
    }, 50);
  };

  // Setup Routes
  router.on('/', HomePage);
  router.on('/projects', ProjectsPage);
  router.on('/project/:slug', ProjectDetailPage);
  router.on('/customizer', CustomizerPage);
  router.on('/cart', CartPage);
  router.on('/checkout', CheckoutPage);
  router.on('/custom-project', CustomProjectPage);
  router.on('/dashboard', DashboardPage);
  router.on('/admin', AdminPage);
  router.on('/login', LoginPage);
  router.on('/admin-login', AdminLoginPage);
  router.on('/track/:id', OrderTrackingPage);
  
  // Placeholder routes for remaining static pages
  ['/about', '/contact'].forEach(path => {
    router.on(path, (container, params) => {
      container.innerHTML = `<div class="container section text-center" style="padding-top: calc(var(--nav-height) + var(--space-4xl)); min-height: 100vh;">
        <h1 class="heading-xl" style="text-transform: capitalize;">${path.substring(1)} Page</h1>
        <p class="text-secondary" style="margin-top: var(--space-md);">This page is coming soon.</p>
        <a href="#/" class="btn btn-primary" style="margin-top: var(--space-lg);">Back to Home</a>
      </div>`;
    });
  });

  // Fetch all base data from the backend before rendering any page
  await store.init();

  router.resolve();
  
  // Global scroll observer for reveal animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  
  // Setup MutationObserver to watch for new `.reveal` elements since this is a SPA
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
      }
    });
  });
  
  mutationObserver.observe(document.getElementById('main-content'), { childList: true, subtree: true });
}

// Start app
document.addEventListener('DOMContentLoaded', initApp);
