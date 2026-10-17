// Hardware Components Store & Explorer Dashboard
import { router } from '../router.js';
import { store } from '../store.js';
import { openComponentComparisonModal } from '../components/componentComparisonModal.js';
import { openProjectBudgetBuilderModal } from '../components/projectBudgetBuilderModal.js';
import { openAdminComponentModal } from '../components/adminComponentModal.js';
import '../styles/hardwareExplorer.css';

// 18 Category icons & metadata
const CATEGORY_META = {
  "Arduino and Microcontrollers": { icon: "cpu", color: "#00f2fe" },
  "ESP32, ESP8266 and IoT Boards": { icon: "wifi", color: "#38bdf8" },
  "Raspberry Pi and Single-Board Computers": { icon: "hard-drive", color: "#e11d48" },
  "Sensors and Modules": { icon: "radio", color: "#10b981" },
  "Displays, LCD and OLED": { icon: "tv", color: "#8b5cf6" },
  "Motors, Servo and Actuators": { icon: "rotate-cw", color: "#f59e0b" },
  "Wireless Communication, GPS and GSM": { icon: "signal", color: "#06b6d4" },
  "Power Supplies, Batteries and DC-DC Converters": { icon: "battery-charging", color: "#eab308" },
  "Relays, Motor Drivers and Controllers": { icon: "toggle-right", color: "#ec4899" },
  "Electronic Components and ICs": { icon: "binary", color: "#6366f1" },
  "RFID, NFC and Biometric Modules": { icon: "fingerprint", color: "#14b8a6" },
  "Robotics Components": { icon: "bot", color: "#3b82f6" },
  "Cameras and Audio Modules": { icon: "camera", color: "#a855f7" },
  "Transformers and Electrical Equipment": { icon: "zap", color: "#f97316" },
  "Embedded Programming and Debugging Tools": { icon: "terminal", color: "#84cc16" },
  "Breadboards, PCBs, Wires and Connectors": { icon: "grid", color: "#64748b" },
  "IoT Project Kits": { icon: "box", color: "#f43f5e" },
  "Testing Equipment and Tools": { icon: "wrench", color: "#d946ef" }
};

// Global BOM & Comparison state in localStorage
function getBom() {
  try {
    return JSON.parse(localStorage.getItem('hw_project_bom') || '[]');
  } catch {
    return [];
  }
}

function saveBom(items) {
  localStorage.setItem('hw_project_bom', JSON.stringify(items));
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('hw_favorites') || '[]');
  } catch {
    return [];
  }
}

function saveFavorites(favs) {
  localStorage.setItem('hw_favorites', JSON.stringify(favs));
}

export async function HardwareExplorerPage(container, params = {}) {
  container.innerHTML = `
    <div class="hw-explorer-page">
      <div class="container" style="max-width: 1440px; margin: 0 auto; padding: 0 20px;">
        <div style="text-align:center; padding: 100px 0;">
          <div class="spinner"></div>
          <p style="color:var(--hw-cyan); font-weight:600; margin-top:16px;">Loading Hardware Components Database...</p>
        </div>
      </div>
    </div>
  `;

  let selectedCategory = params.category ? decodeURIComponent(params.category) : 'all';
  let searchQuery = '';
  let selectedVoltage = 'all';
  let selectedPriceRange = 'all';
  let filterInStock = false;
  let filterVerified = false;
  let filterFavorites = false;
  let sortBy = 'featured';

  let comparisonItems = [];
  let bomItems = getBom();
  let favorites = getFavorites();

  // Fetch all components & categories from backend
  let allComponents = [];
  let categoriesSummary = [];

  try {
    const res = await fetch('/api/hardware-components');
    const data = await res.json();
    allComponents = data.components || [];
    categoriesSummary = data.categories || [];
  } catch (err) {
    console.error('Failed to load components:', err);
  }

  function getFilteredComponents() {
    return allComponents.filter(c => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (c.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesModel = (c.model || '').toLowerCase().includes(q);
        const matchesCat = (c.category || '').toLowerCase().includes(q);
        const matchesSpecs = JSON.stringify(c.keySpecs || {}).toLowerCase().includes(q);
        const matchesPrin = (c.workingPrinciple || '').toLowerCase().includes(q);
        if (!matchesName && !matchesModel && !matchesCat && !matchesSpecs && !matchesPrin) return false;
      }

      // Voltage filter
      if (selectedVoltage !== 'all') {
        const v = (c.voltage || '').toLowerCase();
        if (!v.includes(selectedVoltage.toLowerCase())) return false;
      }

      // Price range
      if (selectedPriceRange !== 'all') {
        const p = c.price;
        if (selectedPriceRange === 'under200' && p >= 200) return false;
        if (selectedPriceRange === '200to500' && (p < 200 || p > 500)) return false;
        if (selectedPriceRange === '500to1500' && (p < 500 || p > 1500)) return false;
        if (selectedPriceRange === '1500to5000' && (p < 1500 || p > 5000)) return false;
        if (selectedPriceRange === 'above5000' && p <= 5000) return false;
      }

      // In stock
      if (filterInStock && !c.inStock) return false;

      // Verified
      if (filterVerified && c.priceType !== 'Verified') return false;

      // Favorites
      if (filterFavorites && !favorites.includes(c.id)) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return (b.rating || 0) - (a.rating || 0);
    });
  }

  function render() {
    const filtered = getFilteredComponents();
    const totalBomCost = bomItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalBomCount = bomItems.reduce((sum, item) => sum + item.quantity, 0);

    const isAdmin = store.get('user')?.role === 'admin';

    container.innerHTML = `
      <div class="hw-explorer-page">
        <div class="container" style="max-width: 1440px; margin: 0 auto; padding: 0 20px;">
          
          <!-- Header Hero Banner -->
          <div class="hw-header-banner">
            <div class="hw-banner-top">
              <div>
                <div class="hw-badge-live">
                  <span class="pulse-dot"></span>
                  Verified Indian Electronics Market — Live INR (₹)
                </div>
                <h1 class="hw-title">Hardware Components Store & Explorer</h1>
                <p class="hw-subtitle">
                  Explore genuine microcontrollers, IoT boards, sensors, actuators, and electronic modules with real product photography, verified Indian retailer prices, detailed pinouts, and an automated project budget builder.
                </p>
              </div>

              <!-- Live Stats & Admin Action -->
              <div class="hw-header-stats">
                <div class="hw-stat-chip">
                  <span class="val">${allComponents.length}+</span>
                  <span class="lbl">Components</span>
                </div>
                <div class="hw-stat-chip">
                  <span class="val">18</span>
                  <span class="lbl">Categories</span>
                </div>
                <div class="hw-stat-chip">
                  <span class="val">4 Retailers</span>
                  <span class="lbl">Robu, Comp, Craze</span>
                </div>

                ${isAdmin ? `
                  <button id="hw-btn-add-comp" class="hw-btn hw-btn-primary" style="margin-left: 8px;">
                    <i data-lucide="plus-circle"></i>
                    Add Component
                  </button>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Main Layout Grid -->
          <div class="hw-layout">
            
            <!-- Sidebar: 18 Categories -->
            <aside class="hw-sidebar">
              <div class="hw-sidebar-title">
                <span>Hardware Categories</span>
                <span style="color:var(--hw-cyan); font-size:0.75rem;">18 Pages</span>
              </div>

              <div class="hw-cat-list">
                <button
                  class="hw-cat-item ${selectedCategory === 'all' ? 'active' : ''}"
                  data-category="all"
                >
                  <span class="cat-name">
                    <i data-lucide="layout-grid" class="cat-icon"></i>
                    <span>All Components</span>
                  </span>
                  <span class="hw-cat-count">${allComponents.length}</span>
                </button>

                ${categoriesSummary.map(cat => {
                  const meta = CATEGORY_META[cat.category] || { icon: 'cpu', color: '#00f2fe' };
                  const isActive = selectedCategory.toLowerCase() === cat.category.toLowerCase();
                  return `
                    <button
                      class="hw-cat-item ${isActive ? 'active' : ''}"
                      data-category="${cat.category}"
                    >
                      <span class="cat-name">
                        <i data-lucide="${meta.icon}" class="cat-icon" style="color:${meta.color};"></i>
                        <span>${cat.category}</span>
                      </span>
                      <span class="hw-cat-count">${cat.count}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </aside>

            <!-- Main Content Area -->
            <main class="hw-main-content">
              
              <!-- Search & Control Bar -->
              <div class="hw-controls-bar">
                <!-- Search Input Row with Live Image Preview Dropdown -->
                <div class="hw-search-row">
                  <div class="hw-search-input-wrap">
                    <i data-lucide="search"></i>
                    <input
                      id="hw-search-input"
                      type="text"
                      class="hw-search-input"
                      placeholder="Search component name, model (e.g. ESP32, DHT22, MPU6050, SG90, LM2596)..."
                      value="${searchQuery}"
                      autocomplete="off"
                    />

                    <!-- Dropdown Image Preview Container -->
                    <div id="hw-search-dropdown" class="hw-search-dropdown"></div>
                  </div>

                  <button id="hw-open-bom-btn" class="hw-btn hw-btn-purple" title="Open Project Budget Builder">
                    <i data-lucide="calculator"></i>
                    <span>Project Budget (${bomItems.length})</span>
                  </button>
                </div>

                <!-- Filters & Sorting Row -->
                <div class="hw-filters-row">
                  <div class="hw-chips-group">
                    <!-- Voltage Filter -->
                    <select id="hw-voltage-select" class="hw-select">
                      <option value="all" ${selectedVoltage === 'all' ? 'selected' : ''}>Voltage: All</option>
                      <option value="3.3v" ${selectedVoltage === '3.3v' ? 'selected' : ''}>3.3V Logic</option>
                      <option value="5v" ${selectedVoltage === '5v' ? 'selected' : ''}>5V Standard</option>
                      <option value="12v" ${selectedVoltage === '12v' ? 'selected' : ''}>12V Industrial</option>
                      <option value="24v" ${selectedVoltage === '24v' ? 'selected' : ''}>24V Power</option>
                    </select>

                    <!-- Price Range -->
                    <select id="hw-price-select" class="hw-select">
                      <option value="all" ${selectedPriceRange === 'all' ? 'selected' : ''}>Price: All Ranges</option>
                      <option value="under200" ${selectedPriceRange === 'under200' ? 'selected' : ''}>Under ₹200</option>
                      <option value="200to500" ${selectedPriceRange === '200to500' ? 'selected' : ''}>₹200 - ₹500</option>
                      <option value="500to1500" ${selectedPriceRange === '500to1500' ? 'selected' : ''}>₹500 - ₹1,500</option>
                      <option value="1500to5000" ${selectedPriceRange === '1500to5000' ? 'selected' : ''}>₹1,500 - ₹5,000</option>
                      <option value="above5000" ${selectedPriceRange === 'above5000' ? 'selected' : ''}>Above ₹5,000</option>
                    </select>

                    <!-- Quick Toggles -->
                    <div id="hw-toggle-instock" class="hw-filter-toggle ${filterInStock ? 'active' : ''}">
                      <i data-lucide="check-circle" style="width:14px; height:14px;"></i>
                      <span>In Stock Only</span>
                    </div>

                    <div id="hw-toggle-verified" class="hw-filter-toggle ${filterVerified ? 'active' : ''}">
                      <i data-lucide="shield-check" style="width:14px; height:14px;"></i>
                      <span>Verified Live Prices</span>
                    </div>

                    <div id="hw-toggle-favs" class="hw-filter-toggle ${filterFavorites ? 'active' : ''}">
                      <i data-lucide="heart" style="width:14px; height:14px;"></i>
                      <span>Favorites (${favorites.length})</span>
                    </div>
                  </div>

                  <!-- Sort Dropdown -->
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:0.8rem; color:var(--hw-text-muted);">Sort By:</span>
                    <select id="hw-sort-select" class="hw-select">
                      <option value="featured" ${sortBy === 'featured' ? 'selected' : ''}>Featured / Rating</option>
                      <option value="price_asc" ${sortBy === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
                      <option value="price_desc" ${sortBy === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
                      <option value="name_asc" ${sortBy === 'name_asc' ? 'selected' : ''}>Name: A to Z</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Results Status -->
              <div class="hw-results-status">
                <div>
                  Showing <b>${filtered.length}</b> of <b>${allComponents.length}</b> components
                  ${selectedCategory !== 'all' ? `in <span style="color:var(--hw-cyan); font-weight:600;">${selectedCategory}</span>` : ''}
                </div>
                ${searchQuery ? `
                  <button id="hw-clear-search-btn" style="background:none; border:none; color:var(--hw-cyan); font-size:0.85rem; cursor:pointer;">
                    Clear search "${searchQuery}"
                  </button>
                ` : ''}
              </div>

              <!-- Component Cards Grid -->
              ${filtered.length === 0 ? `
                <div style="text-align:center; padding:80px 20px; background:var(--hw-bg-card); border:1px dashed var(--hw-border); border-radius:18px;">
                  <i data-lucide="search-x" style="width:56px; height:56px; color:var(--hw-cyan); margin-bottom:16px; opacity:0.6;"></i>
                  <h3 style="margin:0 0 8px 0; color:#ffffff;">No Components Found</h3>
                  <p style="margin:0; font-size:0.9rem; color:var(--hw-text-muted);">
                    Try adjusting your filters, selecting another category, or clearing the search query.
                  </p>
                </div>
              ` : `
                <div class="hw-components-grid">
                  ${filtered.map(c => {
                    const isCompared = comparisonItems.some(i => i.id === c.id);
                    const isFav = favorites.includes(c.id);
                    const buyLink = (c.retailers && c.retailers[0] && c.retailers[0].url) || `https://robu.in/?s=${encodeURIComponent(c.name)}&post_type=product`;
                    const retailerName = (c.retailers && c.retailers[0] && c.retailers[0].name) || 'Robu.in';

                    return `
                      <div class="hw-card" data-component-id="${c.id}">
                        <!-- White-Background Product Image -->
                        <div class="hw-card-img-wrap" onclick="location.hash='#/components/${c.id}'">
                          <img
                            src="${c.image}"
                            alt="${c.name}"
                            class="hw-card-img"
                            loading="lazy"
                            onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'"
                          />
                          
                          <!-- Price Verified/Estimated Tag -->
                          <div class="hw-badge-price-status ${c.priceType === 'Verified' ? 'verified' : 'estimated'}">
                            ${c.priceType === 'Verified' ? '✓ Verified Price' : 'Estimated'}
                          </div>

                          <!-- Wishlist Toggle -->
                          <button
                            class="hw-card-fav-btn ${isFav ? 'active' : ''}"
                            data-fav-id="${c.id}"
                            title="Add to Favorites"
                            onclick="event.stopPropagation(); window.toggleHwFav('${c.id}')"
                          >
                            <i data-lucide="heart" style="width:16px; height:16px;"></i>
                          </button>
                        </div>

                        <!-- Card Body -->
                        <div class="hw-card-body">
                          <div class="hw-card-cat">${c.category}</div>
                          <h3 class="hw-card-title" onclick="location.hash='#/components/${c.id}'">${c.name}</h3>
                          <div class="hw-card-model">${c.model || c.id}</div>

                          <!-- Specs Tags -->
                          <div class="hw-card-specs-row">
                            <span class="hw-spec-pill voltage">
                              <i data-lucide="zap" style="width:11px; height:11px;"></i>
                              ${c.voltage || '5V'}
                            </span>
                            <span class="hw-spec-pill">
                              <i data-lucide="activity" style="width:11px; height:11px;"></i>
                              ${c.current || '50mA'}
                            </span>
                            <span class="hw-spec-pill">
                              ${c.interface || 'GPIO'}
                            </span>
                          </div>

                          <!-- Price Box -->
                          <div class="hw-card-price-row">
                            <span class="hw-price-current">₹${c.price.toLocaleString('en-IN')}</span>
                            ${c.mrp > c.price ? `
                              <span class="hw-price-mrp">₹${c.mrp.toLocaleString('en-IN')}</span>
                            ` : ''}
                            <span class="hw-stock-badge ${c.inStock ? 'instock' : 'lowstock'}">
                              <i data-lucide="${c.inStock ? 'check-circle' : 'alert-circle'}" style="width:12px; height:12px;"></i>
                              ${c.inStock ? 'In Stock' : 'Limited'}
                            </span>
                          </div>

                          <!-- Card Action Buttons -->
                          <div class="hw-card-actions">
                            <a href="#/components/${c.id}" class="hw-card-btn btn-view">
                              <i data-lucide="eye" style="width:14px; height:14px;"></i>
                              View Details
                            </a>
                            <button
                              class="hw-card-btn btn-compare ${isCompared ? 'active' : ''}"
                              onclick="window.toggleHwCompare('${c.id}')"
                            >
                              <i data-lucide="scale" style="width:14px; height:14px;"></i>
                              ${isCompared ? 'Compared' : 'Compare'}
                            </button>
                            <button
                              class="hw-card-btn btn-bom"
                              onclick="window.addHwToBom('${c.id}')"
                            >
                              <i data-lucide="plus" style="width:14px; height:14px;"></i>
                              Add to Project
                            </button>
                            <a
                              href="${buyLink}"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="hw-card-btn btn-buy"
                              title="Buy from ${retailerName}"
                            >
                              <i data-lucide="shopping-cart" style="width:14px; height:14px;"></i>
                              Buy Now
                            </a>
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </main>
          </div>
        </div>

        <!-- Floating Comparison Drawer -->
        <div id="hw-compare-tray" class="hw-compare-tray ${comparisonItems.length > 0 ? 'active' : ''}">
          <div style="font-weight:700; color:#ffffff; font-size:0.9rem;">
            Comparing (${comparisonItems.length}/4):
          </div>
          <div class="hw-compare-thumbs">
            ${comparisonItems.map(item => `
              <img src="${item.image}" alt="${item.name}" class="hw-compare-thumb" title="${item.name}" />
            `).join('')}
          </div>
          <button id="hw-compare-open-btn" class="hw-btn hw-btn-primary" style="padding:8px 16px; font-size:0.85rem;">
            Compare Side-by-Side
          </button>
          <button id="hw-compare-tray-clear" class="hw-btn-glass" style="padding:8px 12px; font-size:0.8rem; color:#ef4444;">
            Clear
          </button>
        </div>

        <!-- Floating Project Budget Builder (BOM) Pill Button -->
        ${totalBomCount > 0 ? `
          <div id="hw-bom-floating-btn" class="hw-bom-floating-btn" onclick="window.openProjectBomModal()">
            <div class="hw-bom-count-badge">${totalBomCount}</div>
            <div style="display:flex; flex-direction:column; line-height:1.2;">
              <span style="font-size:0.75rem; color:var(--hw-text-muted); text-transform:uppercase; font-weight:700;">Project BOM</span>
              <span class="hw-bom-total-amount">₹${totalBomCost.toLocaleString('en-IN')}</span>
            </div>
            <i data-lucide="chevron-right" style="width:18px; height:18px; color:var(--hw-cyan);"></i>
          </div>
        ` : ''}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    attachEvents();
  }

  function attachEvents() {
    // Category Click
    container.querySelectorAll('.hw-cat-item').forEach(btn => {
      btn.onclick = () => {
        selectedCategory = btn.dataset.category;
        render();
      };
    });

    // Search Input with Real-time Image Preview
    const searchInput = container.querySelector('#hw-search-input');
    const searchDropdown = container.querySelector('#hw-search-dropdown');

    if (searchInput && searchDropdown) {
      searchInput.oninput = (e) => {
        searchQuery = e.target.value;
        if (searchQuery.trim().length >= 2) {
          const matches = allComponents.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.model || '').toLowerCase().includes(searchQuery.toLowerCase())
          ).slice(0, 6);

          if (matches.length > 0) {
            searchDropdown.innerHTML = matches.map(m => `
              <a href="#/components/${m.id}" class="hw-search-preview-item">
                <img src="${m.image}" alt="${m.name}" class="hw-search-thumb" />
                <div class="hw-search-info">
                  <div class="p-name">${m.name}</div>
                  <div class="p-cat">${m.category} • ${m.model || ''}</div>
                </div>
                <div class="hw-search-price">₹${m.price.toLocaleString('en-IN')}</div>
              </a>
            `).join('');
            searchDropdown.classList.add('active');
          } else {
            searchDropdown.classList.remove('active');
          }
        } else {
          searchDropdown.classList.remove('active');
        }
      };

      searchInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          searchDropdown.classList.remove('active');
          render();
        }
      };

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
          searchDropdown.classList.remove('active');
        }
      });
    }

    // Clear search
    const clearSearch = container.querySelector('#hw-clear-search-btn');
    if (clearSearch) {
      clearSearch.onclick = () => {
        searchQuery = '';
        render();
      };
    }

    // Filters
    const voltSelect = container.querySelector('#hw-voltage-select');
    if (voltSelect) {
      voltSelect.onchange = (e) => { selectedVoltage = e.target.value; render(); };
    }

    const priceSelect = container.querySelector('#hw-price-select');
    if (priceSelect) {
      priceSelect.onchange = (e) => { selectedPriceRange = e.target.value; render(); };
    }

    const toggleStock = container.querySelector('#hw-toggle-instock');
    if (toggleStock) {
      toggleStock.onclick = () => { filterInStock = !filterInStock; render(); };
    }

    const toggleVerified = container.querySelector('#hw-toggle-verified');
    if (toggleVerified) {
      toggleVerified.onclick = () => { filterVerified = !filterVerified; render(); };
    }

    const toggleFavs = container.querySelector('#hw-toggle-favs');
    if (toggleFavs) {
      toggleFavs.onclick = () => { filterFavorites = !filterFavorites; render(); };
    }

    const sortSelect = container.querySelector('#hw-sort-select');
    if (sortSelect) {
      sortSelect.onchange = (e) => { sortBy = e.target.value; render(); };
    }

    // Open BOM
    const bomBtn = container.querySelector('#hw-open-bom-btn');
    if (bomBtn) {
      bomBtn.onclick = () => window.openProjectBomModal();
    }

    // Compare Tray Open
    const compareOpenBtn = container.querySelector('#hw-compare-open-btn');
    if (compareOpenBtn) {
      compareOpenBtn.onclick = () => {
        openComponentComparisonModal(
          comparisonItems,
          (removeId) => {
            comparisonItems = comparisonItems.filter(i => i.id !== removeId);
            render();
          },
          () => {
            comparisonItems = [];
            render();
          }
        );
      };
    }

    const compareClearBtn = container.querySelector('#hw-compare-tray-clear');
    if (compareClearBtn) {
      compareClearBtn.onclick = () => {
        comparisonItems = [];
        render();
      };
    }

    // Admin Add Component
    const adminAddBtn = container.querySelector('#hw-btn-add-comp');
    if (adminAddBtn) {
      adminAddBtn.onclick = () => {
        openAdminComponentModal(null, (created) => {
          if (created) {
            allComponents.unshift(created);
            render();
          }
        });
      };
    }
  }

  // Global window functions for cards
  window.toggleHwFav = (id) => {
    if (favorites.includes(id)) {
      favorites = favorites.filter(f => f !== id);
    } else {
      favorites.push(id);
    }
    saveFavorites(favorites);
    render();
  };

  window.toggleHwCompare = (id) => {
    const existingIdx = comparisonItems.findIndex(i => i.id === id);
    if (existingIdx > -1) {
      comparisonItems.splice(existingIdx, 1);
    } else {
      if (comparisonItems.length >= 4) {
        alert('You can compare a maximum of 4 components simultaneously.');
        return;
      }
      const item = allComponents.find(c => c.id === id);
      if (item) comparisonItems.push(item);
    }
    render();
  };

  window.addHwToBom = (id) => {
    const item = allComponents.find(c => c.id === id);
    if (!item) return;

    const existing = bomItems.find(i => i.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      bomItems.push({
        id: item.id,
        name: item.name,
        model: item.model,
        category: item.category,
        price: item.price,
        image: item.image,
        quantity: 1
      });
    }
    saveBom(bomItems);
    render();

    // Trigger toast notification
    if (window.showToast) {
      window.showToast(`Added "${item.name}" to Project BOM!`, 'success');
    }
  };

  window.openProjectBomModal = () => {
    openProjectBudgetBuilderModal(
      bomItems,
      (id, qty) => {
        const it = bomItems.find(i => i.id === id);
        if (it) it.quantity = qty;
        saveBom(bomItems);
      },
      (id) => {
        bomItems = bomItems.filter(i => i.id !== id);
        saveBom(bomItems);
        render();
      },
      () => {
        bomItems = [];
        saveBom(bomItems);
        render();
      }
    );
  };

  render();
}
