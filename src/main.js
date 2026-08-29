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

// Setup basic app shell
const app = document.getElementById('app');

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
          <a href="#/dashboard" class="btn btn-ghost btn-sm" title="Dashboard">
            <i data-lucide="user"></i>
          </a>
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
        <a href="#/admin" class="nav-link" onclick="document.querySelector('.mobile-menu-btn').click()">Admin (Demo)</a>
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
            <a href="#/admin" class="hover-text text-tertiary">Admin</a>
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

function initApp() {
  // Add a hook to update navbar active state on route change
  router.after(() => renderNavbar());
  
  renderNavbar();
  renderFooter();
  store.on('cart', () => renderNavbar());

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
  
  // Placeholder routes for remaining static pages
  ['/about', '/contact', '/login'].forEach(path => {
    router.on(path, (container, params) => {
      container.innerHTML = `<div class="container section text-center" style="padding-top: calc(var(--nav-height) + var(--space-4xl)); min-height: 100vh;">
        <h1 class="heading-xl" style="text-transform: capitalize;">${path.substring(1)} Page</h1>
        <p class="text-secondary" style="margin-top: var(--space-md);">This page is coming soon.</p>
        <a href="#/" class="btn btn-primary" style="margin-top: var(--space-lg);">Back to Home</a>
      </div>`;
    });
  });

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
