// src/pages/projectShowcaseDetail.js
// Dedicated Project Details Showcase Page (Overview, Problem, Solution, Components, Circuit Diagram, Working Principle, Gallery, Results)

import { store } from '../store.js';
import { openAddProjectModal } from '../components/addProjectModal.js';

const API_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API = API_URL ? `${API_URL}/api` : '/api';

export async function ProjectShowcaseDetailPage(container, params = {}, defaultCategory = 'iot') {
  const idOrSlug = params.id || params.slug;
  const user = store.get('user') || {};
  const isAdmin = user.role === 'admin' || !!localStorage.getItem('ck_admin_token');

  // Loading state
  container.innerHTML = `
    <div class="project-detail-showcase-page">
      <div class="container">
        <div style="text-align:center; padding:80px 0;">
          <div class="spinner" style="margin:0 auto 16px;"></div>
          <p style="color:#94a3b8; font-size:14px;">Loading project architecture...</p>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  let project = null;

  try {
    const res = await fetch(`${API}/project-dashboards/item/${idOrSlug}`);
    if (res.ok) {
      project = await res.json();
    }
  } catch (e) {
    console.error('Error fetching project details:', e);
  }

  if (!project) {
    container.innerHTML = `
      <div class="project-detail-showcase-page">
        <div class="container" style="text-align:center; padding:80px 20px;">
          <i data-lucide="alert-triangle" style="width:54px; height:54px; color:#f59e0b; margin:0 auto 16px; display:block;"></i>
          <h2 style="font-size:24px; color:#ffffff; margin:0 0 8px;">Project Not Found</h2>
          <p style="color:#94a3b8; font-size:14px; margin-bottom:24px;">The requested engineering project could not be found or has not yet been published.</p>
          <a href="#/projects" class="pj-back-btn">
            <i data-lucide="arrow-left" style="width:16px;"></i> Return to Projects Hub
          </a>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const category = project.category || defaultCategory;
  const parentUrl = category === 'web' ? '#/projects/web' : '#/projects/iot';
  const parentLabel = category === 'web' ? 'Web Development Projects' : 'IoT Projects';

  const hwList = Array.isArray(project.hardwareComponents) ? project.hardwareComponents : [];
  const techList = Array.isArray(project.technologies) ? project.technologies : [];
  const compList = Array.isArray(project.componentList) ? project.componentList : [];
  const gallery = Array.isArray(project.screenshots) ? project.screenshots : [];
  const cover = project.coverImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80';

  const statusClass = (project.status || '').toLowerCase() === 'completed' 
    ? 'pj-status-completed' 
    : ((project.status || '').toLowerCase() === 'in progress' ? 'pj-status-ongoing' : 'pj-status-planned');

  container.innerHTML = `
    <div class="project-detail-showcase-page">
      <div class="container">

        <!-- Top Navigation -->
        <div class="pj-top-bar">
          <a href="${parentUrl}" class="pj-back-btn">
            <i data-lucide="arrow-left" style="width:16px;"></i>
            <span>Back to ${parentLabel}</span>
          </a>

          <div class="pj-breadcrumb">
            <a href="#/projects">Projects</a>
            <i data-lucide="chevron-right" style="width:14px;"></i>
            <a href="${parentUrl}">${parentLabel}</a>
            <i data-lucide="chevron-right" style="width:14px;"></i>
            <span class="current">${project.title}</span>
          </div>
        </div>

        <!-- Header Card -->
        <div class="pj-detail-header-card">
          <div class="pj-detail-title-row">
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <span class="pj-cat-badge" style="position:static;">${project.subcategory || (category === 'web' ? 'Web Application' : 'IoT Hardware')}</span>
                <span class="pj-status-badge ${statusClass}">
                  ● ${project.status || 'Completed'}
                </span>
              </div>
              <h1 class="pj-detail-title">${project.title}</h1>
            </div>

            <!-- Action Buttons -->
            <div class="pj-detail-actions">
              ${project.liveWebsiteUrl ? `
                <a href="${project.liveWebsiteUrl}" target="_blank" rel="noopener noreferrer" class="pj-action-btn-primary">
                  <i data-lucide="globe" style="width:16px;"></i> Live Website
                </a>
              ` : ''}

              ${project.githubUrl ? `
                <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer" class="pj-action-btn-secondary">
                  <i data-lucide="github" style="width:16px;"></i> View Repository
                </a>
              ` : ''}

              ${project.demoVideoUrl ? `
                <a href="${project.demoVideoUrl}" target="_blank" rel="noopener noreferrer" class="pj-action-btn-secondary">
                  <i data-lucide="video" style="width:16px;"></i> Video Demo
                </a>
              ` : ''}

              ${isAdmin ? `
                <button class="pj-action-btn-secondary" onclick="window.editCurrentProject()">
                  <i data-lucide="edit-3" style="width:16px;"></i> Edit Project
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Meta Strip -->
          <div class="pj-detail-meta-strip">
            <div class="pj-detail-meta-item">
              <i data-lucide="layers" style="width:16px; color:#00f2fe;"></i>
              <span>Category: <strong>${category === 'web' ? 'Web Development' : 'IoT & Embedded Systems'}</strong></span>
            </div>
            <div class="pj-detail-meta-item">
              <i data-lucide="calendar" style="width:16px; color:#00f2fe;"></i>
              <span>Published: <strong>${project.created_at ? new Date(project.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recent'}</strong></span>
            </div>
            <div class="pj-detail-meta-item">
              <i data-lucide="shield-check" style="width:16px; color:#10b981;"></i>
              <span>Verification: <strong>Lab Tested & Verified</strong></span>
            </div>
          </div>
        </div>

        <!-- 2-Column Detail Breakdown -->
        <div class="pj-detail-layout">

          <!-- Left Column: Core Documentation Sections -->
          <div class="pj-detail-main">

            <!-- 1. Overview -->
            <div class="pj-detail-section-card">
              <h3 class="pj-section-heading">
                <i data-lucide="info"></i> Project Overview
              </h3>
              <p class="pj-section-text">${project.overview || project.description || project.shortDescription || ''}</p>
              
              <!-- Cover Showcase Banner -->
              <div style="border-radius:10px; overflow:hidden; border:1px solid rgba(59,130,246,0.25); max-height:360px; margin-top:16px;">
                <img src="${cover}" alt="${project.title}" style="width:100%; height:100%; object-fit:cover;" />
              </div>
            </div>

            <!-- 2. Problem Statement -->
            ${project.problemStatement ? `
              <div class="pj-detail-section-card">
                <h3 class="pj-section-heading" style="color:#f59e0b;">
                  <i data-lucide="alert-circle"></i> Problem Statement
                </h3>
                <p class="pj-section-text">${project.problemStatement}</p>
              </div>
            ` : ''}

            <!-- 3. Proposed Solution -->
            ${project.proposedSolution ? `
              <div class="pj-detail-section-card">
                <h3 class="pj-section-heading" style="color:#10b981;">
                  <i data-lucide="check-circle-2"></i> Proposed Solution & Architecture
                </h3>
                <p class="pj-section-text">${project.proposedSolution}</p>
              </div>
            ` : ''}

            <!-- 4. Circuit Diagram / System Diagram -->
            <div class="pj-detail-section-card">
              <h3 class="pj-section-heading">
                <i data-lucide="cpu"></i> ${category === 'web' ? 'System & API Architecture' : 'Circuit Diagram & Wiring Schematic'}
              </h3>
              <p class="pj-section-text">
                ${category === 'web' 
                  ? 'High-level block architecture illustrating client presentation, REST/WebSocket API layer, and SQLite database storage.'
                  : 'Complete schematic wiring diagram showing microcontroller pin connections, sensor signals, pull-up resistors, and power isolation.'}
              </p>

              <div class="pj-circuit-box">
                <img src="${project.circuitDiagram || cover}" alt="Schematic Diagram" onerror="this.src='${cover}'" />
                <div style="margin-top:10px; font-size:12px; color:#64748b;">
                  Schematic view: Click to expand or download high-resolution pinout diagram
                </div>
              </div>
            </div>

            <!-- 5. Working Principle -->
            ${project.workingPrinciple ? `
              <div class="pj-detail-section-card">
                <h3 class="pj-section-heading">
                  <i data-lucide="git-merge"></i> Working Principle & Operational Flow
                </h3>
                <p class="pj-section-text">${project.workingPrinciple}</p>
              </div>
            ` : ''}

            <!-- 6. Project Gallery / Screenshots -->
            <div class="pj-detail-section-card">
              <h3 class="pj-section-heading">
                <i data-lucide="image"></i> Project Gallery & Visualizations
              </h3>
              <div class="pj-gallery-grid">
                <div class="pj-gallery-thumb" onclick="window.openImageZoom('${cover}')">
                  <img src="${cover}" alt="Showcase 1" />
                </div>
                ${gallery.map(img => `
                  <div class="pj-gallery-thumb" onclick="window.openImageZoom('${img}')">
                    <img src="${img}" alt="Showcase" onerror="this.parentElement.remove()" />
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 7. Results & Impact -->
            ${project.results ? `
              <div class="pj-detail-section-card">
                <h3 class="pj-section-heading" style="color:#a855f7;">
                  <i data-lucide="award"></i> Results & Performance Milestones
                </h3>
                <p class="pj-section-text">${project.results}</p>
              </div>
            ` : ''}

          </div>

          <!-- Right Column: Specs, Components & Tech Stack -->
          <div class="pj-detail-sidebar">

            <!-- Software & Tech Stack Box -->
            <div class="pj-detail-section-card">
              <h4 style="margin:0 0 12px; font-size:14px; color:#00f2fe; text-transform:uppercase; letter-spacing:0.8px; font-weight:700;">
                <i data-lucide="code-2" style="width:16px; vertical-align:middle; margin-right:6px;"></i>
                Technologies Used
              </h4>
              <div class="pj-spec-tags">
                ${techList.map(t => `<span class="pj-tag tech-tag">${t}</span>`).join('')}
              </div>
            </div>

            <!-- Hardware Components Box (IoT only) -->
            ${hwList.length > 0 ? `
              <div class="pj-detail-section-card">
                <h4 style="margin:0 0 12px; font-size:14px; color:#00f2fe; text-transform:uppercase; letter-spacing:0.8px; font-weight:700;">
                  <i data-lucide="microchip" style="width:16px; vertical-align:middle; margin-right:6px;"></i>
                  Hardware Components
                </h4>
                <div style="display:flex; flex-direction:column; gap:8px;">
                  ${hwList.map(h => `
                    <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:#e2e8f0; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                      <i data-lucide="check" style="width:14px; color:#10b981; flex-shrink:0;"></i>
                      <span>${typeof h === 'string' ? h : h.name}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Bill of Materials / Component List Table -->
            ${compList.length > 0 ? `
              <div class="pj-detail-section-card">
                <h4 style="margin:0 0 12px; font-size:14px; color:#00f2fe; text-transform:uppercase; letter-spacing:0.8px; font-weight:700;">
                  <i data-lucide="list" style="width:16px; vertical-align:middle; margin-right:6px;"></i>
                  Component Specifications
                </h4>
                <table class="pj-components-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${compList.map(c => `
                      <tr>
                        <td>
                          <strong>${c.name}</strong>
                          <div style="font-size:11px; color:#94a3b8;">${c.specs || ''}</div>
                        </td>
                        <td>${c.qty || 1}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <!-- Repository & External Resources -->
            <div class="pj-detail-section-card">
              <h4 style="margin:0 0 14px; font-size:14px; color:#00f2fe; text-transform:uppercase; letter-spacing:0.8px; font-weight:700;">
                <i data-lucide="share-2" style="width:16px; vertical-align:middle; margin-right:6px;"></i>
                Project Resources
              </h4>

              <div style="display:flex; flex-direction:column; gap:10px;">
                ${project.githubUrl ? `
                  <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer" class="pj-action-btn-primary" style="justify-content:center; text-decoration:none;">
                    <i data-lucide="github" style="width:16px;"></i> View GitHub Source Code
                  </a>
                ` : ''}

                ${project.demoVideoUrl ? `
                  <a href="${project.demoVideoUrl}" target="_blank" rel="noopener noreferrer" class="pj-action-btn-secondary" style="justify-content:center; text-decoration:none;">
                    <i data-lucide="video" style="width:16px;"></i> Watch Demonstration
                  </a>
                ` : ''}

                ${project.liveWebsiteUrl ? `
                  <a href="${project.liveWebsiteUrl}" target="_blank" rel="noopener noreferrer" class="pj-action-btn-secondary" style="justify-content:center; text-decoration:none; color:#00f2fe; border-color:rgba(0,242,254,0.3);">
                    <i data-lucide="external-link" style="width:16px;"></i> Open Live Deployment
                  </a>
                ` : ''}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  window.editCurrentProject = () => {
    openAddProjectModal({
      defaultCategory: project.category,
      project,
      onSaved: () => ProjectShowcaseDetailPage(container, params, defaultCategory)
    });
  };

  window.openImageZoom = (url) => {
    window.open(url, '_blank');
  };
}
