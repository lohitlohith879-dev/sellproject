// ============================================================
// CircuitKart — IoT & Embedded Systems Projects Marketplace Page
// ============================================================
import { IoTCard } from '../components/iotCard.js';
import { store } from '../store.js';

const API_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API = API_URL ? `${API_URL}/api` : '/api';

export const IOT_CATEGORIES = [
  'All Categories',
  'Arduino Projects',
  'ESP32 and ESP8266 Projects',
  'Embedded Systems',
  'Sensor-Based Projects',
  'Home Automation',
  'Smart Agriculture',
  'Robotics',
  'Industrial IoT',
  'VLSI and Digital Electronics',
  'AI + IoT Projects'
];

export async function IoTProjectsPage(container, params = {}) {
  // Loading skeleton state
  container.innerHTML = `
    <div class="iot-marketplace-page">
      <div class="iot-hero">
        <div class="iot-hero-inner">
          <div class="iot-hero-badge">
            <span class="pulse-dot"></span>
            NEXT-GEN HARDWARE ENGINEERING HUB
          </div>
          <h1 class="iot-hero-title">
            IoT & Embedded Systems <span>Marketplace</span>
          </h1>
          <p class="iot-hero-subtitle">
            Explore cutting-edge microcontroller projects, live simulated sensor dashboards, production wiring schematics, and complete ready-to-assemble hardware kits for students, makers, and IoT engineers.
          </p>
        </div>
      </div>
      <div class="container section">
        <div class="iot-loading-state">
          <div class="spinner"></div>
          <p>Loading IoT Projects catalog...</p>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Load projects from API
  let projects = [];
  let userFavorites = new Set();

  try {
    const res = await fetch(`${API}/iot-projects`);
    if (res.ok) {
      projects = await res.json();
    } else {
      console.warn('Failed to fetch from API, falling back to empty list', res.status);
    }
  } catch (err) {
    console.error('Network error fetching IoT projects:', err);
  }

  // Load user favorites if logged in
  const token = localStorage.getItem('ck_token');
  if (token) {
    try {
      const favRes = await fetch(`${API}/iot-projects/user/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (favRes.ok) {
        const favIds = await favRes.json();
        userFavorites = new Set(favIds);
      }
    } catch (e) {
      // Non-critical favorite loading error
    }
  }

  // State management
  let activeCategory = params.category || 'All Categories';
  let activeDifficulty = 'all';
  let searchQuery = params.q || '';
  let activeSort = 'popular';
  let activeAvailability = 'all';

  // Global actions for card clicks
  window.toggleIotFavorite = async (projectId, btnEl, e) => {
    e.stopPropagation();
    e.preventDefault();
    const userToken = localStorage.getItem('ck_token');
    if (!userToken) {
      alert('Please sign in to save projects to your favorites.');
      window.location.hash = '#/login';
      return;
    }

    try {
      const res = await fetch(`${API}/iot-projects/${projectId}/favorite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isFavorite) {
          userFavorites.add(projectId);
          btnEl.classList.add('favorited');
          const heartIcon = btnEl.querySelector('i');
          if (heartIcon) {
            heartIcon.style.fill = '#ef4444';
            heartIcon.style.stroke = '#ef4444';
          }
        } else {
          userFavorites.delete(projectId);
          btnEl.classList.remove('favorited');
          const heartIcon = btnEl.querySelector('i');
          if (heartIcon) {
            heartIcon.style.fill = 'none';
            heartIcon.style.stroke = 'currentColor';
          }
        }
      }
    } catch (err) {
      console.error('Favorite toggle failed', err);
    }
  };

  window.quickBuyIotKit = (projectId, e) => {
    e.stopPropagation();
    e.preventDefault();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    if (proj.isKitAvailable) {
      // Add kit directly to cart
      store.addToCart({
        id: `iot-kit-${proj.id}`,
        name: `${proj.title} - Complete Project Kit`,
        price: proj.estimatedCost || 1999,
        image: proj.image,
        quantity: 1,
        isKit: true,
        category: 'IoT Kit'
      });
      window.location.hash = '#/cart';
    } else {
      // Navigate to project detail code tab
      window.location.hash = `#/iot-project/${proj.slug}#code`;
    }
  };

  function renderMarketplace() {
    // Filter projects
    let filtered = projects.filter(p => {
      // Category filter
      if (activeCategory !== 'All Categories' && p.category !== activeCategory) {
        return false;
      }
      // Difficulty filter
      if (activeDifficulty !== 'all' && (p.difficulty || '').toLowerCase() !== activeDifficulty.toLowerCase()) {
        return false;
      }
      // Availability filter
      if (activeAvailability === 'kit' && !p.isKitAvailable) return false;
      if (activeAvailability === 'demo' && !p.isDemo) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = (p.title || '').toLowerCase().includes(q);
        const inDesc = (p.shortDescription || p.description || '').toLowerCase().includes(q);
        const inPlatform = (p.platform || '').toLowerCase().includes(q);
        const inTags = (p.tags || []).some(t => t.toLowerCase().includes(q));
        const inComponents = (p.components || []).some(c => {
          const cName = typeof c === 'string' ? c : (c.name || '');
          return cName.toLowerCase().includes(q);
        });

        if (!inTitle && !inDesc && !inPlatform && !inTags && !inComponents) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (activeSort === 'cost-asc') return (a.estimatedCost || 0) - (b.estimatedCost || 0);
      if (activeSort === 'cost-desc') return (b.estimatedCost || 0) - (a.estimatedCost || 0);
      if (activeSort === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (activeSort === 'difficulty') {
        const order = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
        return (order[a.difficulty] || 2) - (order[b.difficulty] || 2);
      }
      // Default: popularity / featured
      return (b.visits || 0) - (a.visits || 0);
    });

    container.innerHTML = `
      <div class="iot-marketplace-page">
        <!-- Hero Banner with Tech Aesthetics -->
        <header class="iot-hero">
          <div class="iot-hero-inner">
            <div class="iot-hero-badge">
              <span class="pulse-dot"></span>
              NEXT-GEN HARDWARE ENGINEERING HUB
            </div>
            <h1 class="iot-hero-title">
              IoT & Embedded Systems <span>Marketplace</span>
            </h1>
            <p class="iot-hero-subtitle">
              Explore cutting-edge microcontroller projects, live simulated sensor dashboards, verified pinout schematics, and complete ready-to-assemble hardware kits for students, makers, and IoT developers.
            </p>

            <div class="iot-hero-stats">
              <div class="stat-pill">
                <i data-lucide="cpu"></i>
                <span><strong>15+</strong> Verified Projects</span>
              </div>
              <div class="stat-pill">
                <i data-lucide="layers"></i>
                <span><strong>10</strong> Engineering Disciplines</span>
              </div>
              <div class="stat-pill">
                <i data-lucide="activity"></i>
                <span><strong>Live</strong> Telemetry Simulator</span>
              </div>
              <div class="stat-pill">
                <i data-lucide="package-check"></i>
                <span><strong>Plug & Play</strong> Component Kits</span>
              </div>
            </div>
          </div>
        </header>

        <div class="container section">
          <!-- Category Filter Bar (Horizontal scrolling pill buttons) -->
          <div class="iot-category-chips-wrapper">
            <div class="iot-category-chips" id="iot-category-chips">
              ${IOT_CATEGORIES.map(cat => `
                <button 
                  class="cat-chip ${activeCategory === cat ? 'active' : ''}" 
                  data-cat="${cat}"
                >
                  ${cat}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Controls Bar: Search, Difficulty, Availability, Sort -->
          <div class="iot-controls-bar">
            <div class="iot-search-box">
              <i data-lucide="search"></i>
              <input 
                type="text" 
                id="iot-search-input" 
                placeholder="Search projects by sensor (DHT11, MQ135), platform (ESP32, Arduino), or keywords..." 
                value="${searchQuery}"
              />
              ${searchQuery ? `
                <button id="clear-search-btn" class="clear-search" title="Clear search">
                  <i data-lucide="x" style="width:14px;height:14px;"></i>
                </button>
              ` : ''}
            </div>

            <div class="iot-filters-group">
              <!-- Difficulty Filter -->
              <div class="filter-select-wrapper">
                <label for="diff-select">Difficulty:</label>
                <select id="diff-select" class="iot-select">
                  <option value="all" ${activeDifficulty === 'all' ? 'selected' : ''}>All Levels</option>
                  <option value="beginner" ${activeDifficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
                  <option value="intermediate" ${activeDifficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                  <option value="advanced" ${activeDifficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
                </select>
              </div>

              <!-- Sort Filter -->
              <div class="filter-select-wrapper">
                <label for="sort-select">Sort By:</label>
                <select id="sort-select" class="iot-select">
                  <option value="popular" ${activeSort === 'popular' ? 'selected' : ''}>Most Popular</option>
                  <option value="rating" ${activeSort === 'rating' ? 'selected' : ''}>Highest Rated</option>
                  <option value="cost-asc" ${activeSort === 'cost-asc' ? 'selected' : ''}>Cost: Low to High</option>
                  <option value="cost-desc" ${activeSort === 'cost-desc' ? 'selected' : ''}>Cost: High to Low</option>
                  <option value="difficulty" ${activeSort === 'difficulty' ? 'selected' : ''}>Difficulty Order</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Active Filters & Result Count -->
          <div class="iot-results-header">
            <div class="results-text">
              Showing <strong>${filtered.length}</strong> of <strong>${projects.length}</strong> projects
              ${activeCategory !== 'All Categories' ? `in <span class="tag-accent">${activeCategory}</span>` : ''}
              ${searchQuery ? `matching "<span class="tag-accent">${searchQuery}</span>"` : ''}
            </div>

            <div class="iot-demo-notice">
              <i data-lucide="info" style="width:14px;height:14px;"></i>
              <span>All sample project listings contain comprehensive schematics, open-source code & realistic simulated IoT telemetry.</span>
            </div>
          </div>

          <!-- Projects Grid -->
          ${filtered.length > 0 ? `
            <div class="iot-grid">
              ${filtered.map(proj => IoTCard(proj, { isFavorite: userFavorites.has(proj.id) })).join('')}
            </div>
          ` : `
            <div class="iot-empty-state">
              <div class="empty-icon">
                <i data-lucide="circuit-board" style="width:64px;height:64px;stroke:#00f3ff;opacity:0.6;"></i>
              </div>
              <h3 class="empty-title">No Projects Found</h3>
              <p class="empty-desc">
                No IoT projects matched your filter criteria for "<strong>${searchQuery || activeCategory}</strong>".
                Try selecting "All Categories" or searching for common components like Arduino, ESP32, or DHT11.
              </p>
              <button id="reset-filters-btn" class="btn-iot btn-iot-primary">
                <i data-lucide="rotate-ccw" style="width:16px;height:16px;"></i>
                Reset All Filters
              </button>
            </div>
          `}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Attach event listeners
    // Category chips
    document.querySelectorAll('.cat-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderMarketplace();
      });
    });

    // Search input with debounce
    const searchInput = document.getElementById('iot-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        // Don't re-render full page immediately to preserve focus
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          renderMarketplace();
        }
      });
      searchInput.addEventListener('blur', () => {
        renderMarketplace();
      });
    }

    // Clear search button
    const clearBtn = document.getElementById('clear-search-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchQuery = '';
        renderMarketplace();
      });
    }

    // Difficulty select
    const diffSelect = document.getElementById('diff-select');
    if (diffSelect) {
      diffSelect.addEventListener('change', (e) => {
        activeDifficulty = e.target.value;
        renderMarketplace();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        activeSort = e.target.value;
        renderMarketplace();
      });
    }

    // Reset filters
    const resetBtn = document.getElementById('reset-filters-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        activeCategory = 'All Categories';
        activeDifficulty = 'all';
        searchQuery = '';
        activeSort = 'popular';
        renderMarketplace();
      });
    }
  }

  renderMarketplace();
}
