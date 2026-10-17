// src/pages/iotDashboard.js
// Dedicated IoT & Embedded Systems Projects Dashboard (#/projects/iot)
import { store } from '../store.js';
import { openAddProjectModal } from '../components/addProjectModal.js';

const API_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API = API_URL ? `${API_URL}/api` : '/api';

export async function IoTDashboardPage(container) {
  // State
  let projects = [];
  let stats = { total: 0, completed: 0, ongoing: 0, technologiesCount: 0, technologiesList: [] };
  let searchQuery = '';
  let activeTech = 'all';
  let activeStatus = 'all';

  // Check admin
  const user = store.get('user') || {};
  const isAdmin = user.role === 'admin' || !!localStorage.getItem('ck_admin_token');

  // Load from API
  async function loadData() {
    try {
      const res = await fetch(`${API}/project-dashboards/cat/iot`);
      if (res.ok) {
        const data = await res.json();
        projects = data.projects || [];
        stats = data.stats || stats;
      }
    } catch (e) {
      console.warn('Error loading IoT dashboard data:', e);
    }
    render();
  }

  // Filter function
  function getFilteredProjects() {
    let list = [...projects];

    if (activeStatus !== 'all') {
      const s = activeStatus.toLowerCase();
      list = list.filter(p => (p.status || '').toLowerCase() === s);
    }

    if (activeTech !== 'all') {
      const t = activeTech.toLowerCase();
      list = list.filter(p => (p.technologies || []).some(tech => tech.toLowerCase() === t));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.shortDescription || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.hardwareComponents || []).some(h => (typeof h === 'string' ? h : h.name || '').toLowerCase().includes(q)) ||
        (p.technologies || []).some(tech => tech.toLowerCase().includes(q))
      );
    }

    return list;
  }

  function render() {
    const filtered = getFilteredProjects();

    container.innerHTML = `
      <div class="dashboard-projects-page">
        <div class="container">

          <!-- Top Navigation Bar -->
          <div class="pj-top-bar">
            <a href="#/projects" class="pj-back-btn">
              <i data-lucide="arrow-left" style="width:16px;"></i>
              <span>Back to Projects Hub</span>
            </a>

            <div class="pj-breadcrumb">
              <a href="#/projects">Projects</a>
              <i data-lucide="chevron-right" style="width:14px;"></i>
              <span class="current">IoT Projects Dashboard</span>
            </div>
          </div>

          <!-- Hero Section -->
          <div class="pj-hero">
            <div class="pj-badge-pill">
              <span class="pj-pulse-dot"></span>
              HARDWARE ENGINEERING & TELEMETRY
            </div>
            <h1 class="pj-hero-title">
              IoT Projects <span>Dashboard</span>
            </h1>
            <p class="pj-hero-subtitle">
              Explore production-grade microcontroller architectures, smart agriculture nodes, AI edge computing, acoustic radar sweep systems, and environmental telemetry.
            </p>
          </div>

          <!-- Summary Statistics Strip -->
          <div class="pj-stats-grid">
            <div class="pj-stat-card">
              <div class="pj-stat-icon">
                <i data-lucide="cpu" style="width:22px;"></i>
              </div>
              <div class="pj-stat-info">
                <h3>${stats.total}</h3>
                <p>Total Projects</p>
              </div>
            </div>

            <div class="pj-stat-card">
              <div class="pj-stat-icon green">
                <i data-lucide="check-circle" style="width:22px;"></i>
              </div>
              <div class="pj-stat-info">
                <h3>${stats.completed}</h3>
                <p>Completed Systems</p>
              </div>
            </div>

            <div class="pj-stat-card">
              <div class="pj-stat-icon amber">
                <i data-lucide="activity" style="width:22px;"></i>
              </div>
              <div class="pj-stat-info">
                <h3>${stats.ongoing}</h3>
                <p>Ongoing Research</p>
              </div>
            </div>

            <div class="pj-stat-card">
              <div class="pj-stat-icon purple">
                <i data-lucide="microchip" style="width:22px;"></i>
              </div>
              <div class="pj-stat-info">
                <h3>${stats.technologiesCount}</h3>
                <p>Technologies Used</p>
              </div>
            </div>
          </div>

          <!-- Search & Filter Control Bar -->
          <div class="pj-control-bar">
            <div class="pj-search-row">
              <div class="pj-search-box">
                <i data-lucide="search"></i>
                <input 
                  type="text" 
                  class="pj-search-input" 
                  placeholder="Search IoT projects by name, sensor, microcontroller, or keyword..." 
                  value="${searchQuery}" 
                  id="pj-iot-search-input"
                />
              </div>

              ${isAdmin ? `
                <button class="pj-admin-add-btn" id="pj-iot-add-btn">
                  <i data-lucide="plus" style="width:16px;"></i> Add New Project
                </button>
              ` : ''}
            </div>

            <!-- Chips & Selectors -->
            <div class="pj-chips-row">
              <div class="pj-filter-chips">
                <div class="pj-chip ${activeStatus === 'all' ? 'active' : ''}" data-status="all">
                  All Status (${stats.total})
                </div>
                <div class="pj-chip ${activeStatus === 'completed' ? 'active' : ''}" data-status="completed">
                  Completed (${stats.completed})
                </div>
                <div class="pj-chip ${activeStatus === 'in progress' ? 'active' : ''}" data-status="in progress">
                  In Progress (${stats.ongoing})
                </div>
                <div class="pj-chip ${activeStatus === 'planned' ? 'active' : ''}" data-status="planned">
                  Planned (${stats.planned || 0})
                </div>
              </div>

              <!-- Technology Dropdown -->
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:12px; color:#94a3b8; font-weight:600;">Technology:</span>
                <select class="pj-select-control" id="pj-iot-tech-select">
                  <option value="all">All Technologies (${stats.technologiesCount})</option>
                  ${(stats.technologiesList || []).map(t => `
                    <option value="${t}" ${activeTech.toLowerCase() === t.toLowerCase() ? 'selected' : ''}>${t}</option>
                  `).join('')}
                </select>
              </div>
            </div>
          </div>

          <!-- Projects Grid -->
          ${filtered.length === 0 ? `
            <div style="text-align:center; padding:60px 20px; background:rgba(15,23,42,0.4); border:1px solid rgba(255,255,255,0.08); border-radius:14px;">
              <i data-lucide="cpu" style="width:54px; height:54px; color:#64748b; margin:0 auto 16px; display:block;"></i>
              <h3 style="margin:0 0 8px; font-size:18px; color:#ffffff;">No Matching IoT Projects Found</h3>
              <p style="margin:0 0 20px; font-size:13.5px; color:#94a3b8;">Try clearing search filters or selecting all technologies.</p>
              <button class="pj-action-btn-primary" onclick="window.resetIoTFilters()">
                Reset All Filters
              </button>
            </div>
          ` : `
            <div class="pj-cards-grid">
              ${filtered.map(p => {
                const statusClass = (p.status || '').toLowerCase() === 'completed' 
                  ? 'pj-status-completed' 
                  : ((p.status || '').toLowerCase() === 'in progress' ? 'pj-status-ongoing' : 'pj-status-planned');
                
                const hwList = Array.isArray(p.hardwareComponents) ? p.hardwareComponents : [];
                const techList = Array.isArray(p.technologies) ? p.technologies : [];
                const cover = p.coverImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80';

                return `
                  <div class="pj-card">
                    <!-- Thumbnail & Status -->
                    <div class="pj-card-thumb-wrap">
                      <img src="${cover}" alt="${p.title}" class="pj-card-img" onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'" />
                      <span class="pj-cat-badge">${p.subcategory || 'IoT Hardware'}</span>
                      <span class="pj-status-badge ${statusClass}">
                        ● ${p.status || 'Completed'}
                      </span>
                    </div>

                    <!-- Card Body -->
                    <div class="pj-card-body">
                      <h3 class="pj-card-title">${p.title}</h3>
                      <p class="pj-card-desc">${p.shortDescription || p.description || ''}</p>

                      <!-- Hardware Components Used -->
                      <div class="pj-spec-block">
                        <div class="pj-spec-label">
                          <i data-lucide="cpu"></i> Hardware Components:
                        </div>
                        <div class="pj-spec-tags">
                          ${hwList.slice(0, 4).map(h => `
                            <span class="pj-tag">${typeof h === 'string' ? h : h.name}</span>
                          `).join('')}
                          ${hwList.length > 4 ? `<span class="pj-tag" style="color:#00f2fe;">+${hwList.length - 4} more</span>` : ''}
                        </div>
                      </div>

                      <!-- Software & Tech Used -->
                      <div class="pj-spec-block">
                        <div class="pj-spec-label">
                          <i data-lucide="code-2"></i> Software & Tech:
                        </div>
                        <div class="pj-spec-tags">
                          ${techList.slice(0, 4).map(t => `
                            <span class="pj-tag tech-tag">${t}</span>
                          `).join('')}
                          ${techList.length > 4 ? `<span class="pj-tag tech-tag">+${techList.length - 4}</span>` : ''}
                        </div>
                      </div>

                      <!-- Card Actions -->
                      <div class="pj-card-footer">
                        <div class="pj-links-group">
                          ${p.githubUrl ? `
                            <a href="${p.githubUrl}" target="_blank" rel="noopener noreferrer" class="pj-icon-link" title="GitHub Repository">
                              <i data-lucide="github"></i>
                            </a>
                          ` : ''}
                          ${p.demoVideoUrl ? `
                            <a href="${p.demoVideoUrl}" target="_blank" rel="noopener noreferrer" class="pj-icon-link" title="Watch Demo Video">
                              <i data-lucide="video"></i>
                            </a>
                          ` : ''}
                        </div>

                        <a href="#/projects/iot/${p.slug || p.id}" class="pj-btn-details">
                          <span>View Details</span>
                          <i data-lucide="arrow-right" style="width:14px;"></i>
                        </a>
                      </div>

                      <!-- Admin Controls -->
                      ${isAdmin ? `
                        <div class="pj-card-admin-actions">
                          <button class="pj-admin-action-btn" onclick="window.editIoTProject('${p.id}')">
                            <i data-lucide="edit-3" style="width:12px;"></i> Edit
                          </button>
                          <button class="pj-admin-action-btn delete" onclick="window.deleteIoTProject('${p.id}', '${p.title.replace(/'/g, "\\'")}')">
                            <i data-lucide="trash-2" style="width:12px;"></i> Delete
                          </button>
                        </div>
                      ` : ''}

                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Attach search input event
    const searchInput = document.getElementById('pj-iot-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        searchQuery = e.target.value;
        render();
        const inputRef = document.getElementById('pj-iot-search-input');
        if (inputRef) {
          inputRef.focus();
          inputRef.selectionStart = inputRef.selectionEnd = inputRef.value.length;
        }
      };
    }

    // Attach status chip clicks
    document.querySelectorAll('.pj-filter-chips .pj-chip').forEach(chip => {
      chip.onclick = () => {
        activeStatus = chip.dataset.status;
        render();
      };
    });

    // Attach technology select
    const techSelect = document.getElementById('pj-iot-tech-select');
    if (techSelect) {
      techSelect.onchange = (e) => {
        activeTech = e.target.value;
        render();
      };
    }

    // Add project button
    const addBtn = document.getElementById('pj-iot-add-btn');
    if (addBtn) {
      addBtn.onclick = () => {
        openAddProjectModal({ defaultCategory: 'iot', onSaved: loadData });
      };
    }
  }

  // Global helpers
  window.resetIoTFilters = () => {
    searchQuery = '';
    activeTech = 'all';
    activeStatus = 'all';
    render();
  };

  window.editIoTProject = (id) => {
    const proj = projects.find(p => p.id === id);
    if (proj) {
      openAddProjectModal({ defaultCategory: 'iot', project: proj, onSaved: loadData });
    }
  };

  window.deleteIoTProject = async (id, title) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    const token = localStorage.getItem('ck_admin_token') || localStorage.getItem('ck_token');
    try {
      const res = await fetch(`${API}/project-dashboards/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        projects = projects.filter(p => p.id !== id);
        stats.total = Math.max(0, stats.total - 1);
        render();
      } else {
        alert('Failed to delete project. Admin permissions required.');
      }
    } catch (e) {
      alert('Network error while deleting project.');
    }
  };

  // Initial load
  loadData();
}
