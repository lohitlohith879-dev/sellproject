// src/pages/webDashboard.js
// Dedicated Web Development Projects Dashboard (#/projects/web)
import { store } from '../store.js';
import { openAddProjectModal } from '../components/addProjectModal.js';

const API_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API = API_URL ? `${API_URL}/api` : '/api';

export const WEB_CATEGORIES = [
  'All Categories',
  'Portfolio Websites',
  'E-Commerce Applications',
  'AI-Powered Web Applications',
  'Admin Dashboards',
  'Real-Time Monitoring Websites',
  'Full-Stack Web Applications'
];

export async function WebDashboardPage(container) {
  let projects = [];
  let stats = { total: 0, completed: 0, ongoing: 0, technologiesCount: 0, technologiesList: [] };
  let searchQuery = '';
  let activeCategory = 'All Categories';
  let activeStatus = 'all';

  const user = store.get('user') || {};
  const isAdmin = user.role === 'admin' || !!localStorage.getItem('ck_admin_token');

  async function loadData() {
    try {
      const res = await fetch(`${API}/project-dashboards/cat/web`);
      if (res.ok) {
        const data = await res.json();
        projects = data.projects || [];
        stats = data.stats || stats;
      }
    } catch (e) {
      console.warn('Error loading Web dashboard data:', e);
    }
    render();
  }

  function getFilteredProjects() {
    let list = [...projects];

    if (activeStatus !== 'all') {
      const s = activeStatus.toLowerCase();
      list = list.filter(p => (p.status || '').toLowerCase() === s);
    }

    if (activeCategory !== 'All Categories') {
      list = list.filter(p => (p.subcategory || '').toLowerCase() === activeCategory.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.shortDescription || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.technologies || []).some(tech => tech.toLowerCase().includes(q)) ||
        (p.subcategory || '').toLowerCase().includes(q)
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
              <span class="current">Web Development Projects Dashboard</span>
            </div>
          </div>

          <!-- Hero Section -->
          <div class="pj-hero">
            <div class="pj-badge-pill" style="background:rgba(139, 92, 246, 0.12); border-color:rgba(139, 92, 246, 0.3); color:#c084fc;">
              <span class="pj-pulse-dot" style="background:#a855f7; box-shadow:0 0 8px #a855f7;"></span>
              FULL-STACK WEB & CLOUD ARCHITECTURE
            </div>
            <h1 class="pj-hero-title">
              Web Development <span>Projects Dashboard</span>
            </h1>
            <p class="pj-hero-subtitle">
              Explore modern websites, e-commerce architectures, AI-integrated portals, admin command consoles, and real-time WebSocket monitoring hubs.
            </p>
          </div>

          <!-- Summary Statistics Strip -->
          <div class="pj-stats-grid">
            <div class="pj-stat-card">
              <div class="pj-stat-icon purple">
                <i data-lucide="globe" style="width:22px;"></i>
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
                <p>Live Deployed</p>
              </div>
            </div>

            <div class="pj-stat-card">
              <div class="pj-stat-icon amber">
                <i data-lucide="clock" style="width:22px;"></i>
              </div>
              <div class="pj-stat-info">
                <h3>${stats.ongoing}</h3>
                <p>In Active Development</p>
              </div>
            </div>

            <div class="pj-stat-card">
              <div class="pj-stat-icon">
                <i data-lucide="layers" style="width:22px;"></i>
              </div>
              <div class="pj-stat-info">
                <h3>${stats.technologiesCount}</h3>
                <p>Frameworks & Tools</p>
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
                  placeholder="Search web applications by title, framework, tech stack (React, Node, Python, SQLite)..." 
                  value="${searchQuery}" 
                  id="pj-web-search-input"
                />
              </div>

              ${isAdmin ? `
                <button class="pj-admin-add-btn" id="pj-web-add-btn" style="background:linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); box-shadow:0 4px 14px rgba(139, 92, 246, 0.3);">
                  <i data-lucide="plus" style="width:16px;"></i> Add Web Project
                </button>
              ` : ''}
            </div>

            <!-- Category Pills -->
            <div class="pj-chips-row">
              <div class="pj-filter-chips">
                ${WEB_CATEGORIES.map(cat => `
                  <div class="pj-chip ${activeCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}" data-category="${cat}">
                    ${cat}
                  </div>
                `).join('')}
              </div>

              <!-- Status Dropdown -->
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:12px; color:#94a3b8; font-weight:600;">Status:</span>
                <select class="pj-select-control" id="pj-web-status-select">
                  <option value="all">All Statuses (${stats.total})</option>
                  <option value="completed" ${activeStatus === 'completed' ? 'selected' : ''}>Completed (${stats.completed})</option>
                  <option value="in progress" ${activeStatus === 'in progress' ? 'selected' : ''}>In Progress (${stats.ongoing})</option>
                  <option value="planned" ${activeStatus === 'planned' ? 'selected' : ''}>Planned (${stats.planned || 0})</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Projects Grid -->
          <div class="pj-cards-grid">
            ${filtered.map(p => {
              const statusClass = (p.status || '').toLowerCase() === 'completed' 
                ? 'pj-status-completed' 
                : ((p.status || '').toLowerCase() === 'in progress' ? 'pj-status-ongoing' : 'pj-status-planned');
              
              const techList = Array.isArray(p.technologies) ? p.technologies : [];
              const featuresList = Array.isArray(p.features) ? p.features : [];
              const cover = p.coverImage || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';

              return `
                <div class="pj-card">
                  <!-- Thumbnail & Status -->
                  <div class="pj-card-thumb-wrap">
                    <img src="${cover}" alt="${p.title}" class="pj-card-img" onerror="this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'" />
                    <span class="pj-cat-badge">${p.subcategory || 'Web Application'}</span>
                    <span class="pj-status-badge ${statusClass}">
                      ● ${p.status || 'Completed'}
                    </span>
                  </div>

                  <!-- Card Body -->
                  <div class="pj-card-body">
                    <h3 class="pj-card-title">${p.title}</h3>
                    <p class="pj-card-desc">${p.shortDescription || p.description || ''}</p>

                    <!-- Tech Stack Tags -->
                    <div class="pj-spec-block">
                      <div class="pj-spec-label">
                        <i data-lucide="layers"></i> Tech Stack:
                      </div>
                      <div class="pj-spec-tags">
                        ${techList.slice(0, 5).map(t => `
                          <span class="pj-tag tech-tag">${t}</span>
                        `).join('')}
                        ${techList.length > 5 ? `<span class="pj-tag tech-tag">+${techList.length - 5}</span>` : ''}
                      </div>
                    </div>

                    <!-- Key Features -->
                    ${featuresList.length > 0 ? `
                      <div class="pj-spec-block">
                        <div class="pj-spec-label">
                          <i data-lucide="check-circle-2"></i> Key Features:
                        </div>
                        <ul style="margin:0; padding-left:18px; font-size:12px; color:#94a3b8; line-height:1.5;">
                          ${featuresList.slice(0, 2).map(f => `<li>${f}</li>`).join('')}
                        </ul>
                      </div>
                    ` : ''}

                    <!-- Card Actions -->
                    <div class="pj-card-footer">
                      <div class="pj-links-group">
                        ${p.liveWebsiteUrl ? `
                          <a href="${p.liveWebsiteUrl}" target="_blank" rel="noopener noreferrer" class="pj-icon-link" title="Live Website Deployment" style="color:#00f2fe; border-color:rgba(0,242,254,0.3);">
                            <i data-lucide="external-link"></i>
                          </a>
                        ` : ''}
                        ${p.githubUrl ? `
                          <a href="${p.githubUrl}" target="_blank" rel="noopener noreferrer" class="pj-icon-link" title="GitHub Repository">
                            <i data-lucide="github"></i>
                          </a>
                        ` : ''}
                      </div>

                      <a href="#/projects/web/${p.slug || p.id}" class="pj-btn-details">
                        <span>View Details</span>
                        <i data-lucide="arrow-right" style="width:14px;"></i>
                      </a>
                    </div>

                    <!-- Admin Controls -->
                    ${isAdmin ? `
                      <div class="pj-card-admin-actions">
                        <button class="pj-admin-action-btn" onclick="window.editWebProject('${p.id}')">
                          <i data-lucide="edit-3" style="width:12px;"></i> Edit
                        </button>
                        <button class="pj-admin-action-btn delete" onclick="window.deleteWebProject('${p.id}', '${p.title.replace(/'/g, "\\'")}')">
                          <i data-lucide="trash-2" style="width:12px;"></i> Delete
                        </button>
                      </div>
                    ` : ''}

                  </div>
                </div>
              `;
            }).join('')}

            <!-- Add Project / Placeholder Card -->
            ${isAdmin ? `
              <div class="pj-card" style="border:2px dashed rgba(139, 92, 246, 0.4); background:rgba(15, 23, 42, 0.35); align-items:center; justify-content:center; text-align:center; padding:40px 24px; cursor:pointer;" onclick="window.openNewWebProjectModal()">
                <div style="width:56px; height:56px; border-radius:50%; background:rgba(139, 92, 246, 0.15); color:#a855f7; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
                  <i data-lucide="plus" style="width:28px; height:28px;"></i>
                </div>
                <h4 style="margin:0 0 6px; font-size:16px; color:#ffffff;">Add Web Development Project</h4>
                <p style="margin:0; font-size:13px; color:#94a3b8; max-width:260px;">
                  Upload portfolio websites, full-stack web apps, dashboards, or AI tools.
                </p>
              </div>
            ` : ''}
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Attach search input
    const searchInput = document.getElementById('pj-web-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        searchQuery = e.target.value;
        render();
        const inputRef = document.getElementById('pj-web-search-input');
        if (inputRef) {
          inputRef.focus();
          inputRef.selectionStart = inputRef.selectionEnd = inputRef.value.length;
        }
      };
    }

    // Attach category chip clicks
    document.querySelectorAll('.pj-filter-chips .pj-chip').forEach(chip => {
      chip.onclick = () => {
        activeCategory = chip.dataset.category;
        render();
      };
    });

    // Attach status select
    const statusSelect = document.getElementById('pj-web-status-select');
    if (statusSelect) {
      statusSelect.onchange = (e) => {
        activeStatus = e.target.value;
        render();
      };
    }

    // Add project button
    const addBtn = document.getElementById('pj-web-add-btn');
    if (addBtn) {
      addBtn.onclick = () => window.openNewWebProjectModal();
    }
  }

  // Global helper functions
  window.openNewWebProjectModal = () => {
    openAddProjectModal({ defaultCategory: 'web', onSaved: loadData });
  };

  window.editWebProject = (id) => {
    const proj = projects.find(p => p.id === id);
    if (proj) {
      openAddProjectModal({ defaultCategory: 'web', project: proj, onSaved: loadData });
    }
  };

  window.deleteWebProject = async (id, title) => {
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
        alert('Failed to delete project.');
      }
    } catch (e) {
      alert('Network error while deleting project.');
    }
  };

  loadData();
}
