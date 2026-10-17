// src/pages/projectsHub.js
// Main Projects Showcase Portal — Hub with Clickable IoT & Web Dev Cards

const API_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API = API_URL ? `${API_URL}/api` : '/api';

export async function ProjectsHubPage(container) {
  // Skeleton / loading state
  container.innerHTML = `
    <div class="projects-hub-page">
      <div class="container">
        <div class="pj-hero">
          <div class="pj-badge-pill">
            <span class="pj-pulse-dot"></span>
            ENGINEERING & SOFTWARE SYSTEMS PORTFOLIO
          </div>
          <h1 class="pj-hero-title">
            Projects <span>Management Hub</span>
          </h1>
          <p class="pj-hero-subtitle">
            Explore dedicated dashboards for specialized smart hardware & embedded systems, and modern full-stack web applications.
          </p>
        </div>

        <div style="text-align:center; padding:40px 0;">
          <div class="spinner" style="margin:0 auto 16px;"></div>
          <p style="color:#94a3b8; font-size:14px;">Loading project systems...</p>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Fetch summary stats
  let iotCount = 7;
  let webCount = 6;
  let totalTech = 72;

  try {
    const res = await fetch(`${API}/project-dashboards`);
    if (res.ok) {
      const data = await res.json();
      const projects = data.projects || [];
      iotCount = projects.filter(p => p.category === 'iot').length;
      webCount = projects.filter(p => p.category === 'web').length;
      totalTech = data.stats?.technologiesCount || 72;
    }
  } catch (e) {
    console.warn('ProjectsHub fetch error:', e);
  }

  container.innerHTML = `
    <div class="projects-hub-page">
      <div class="container">

        <!-- Hero Header -->
        <div class="pj-hero">
          <div class="pj-badge-pill">
            <span class="pj-pulse-dot"></span>
            ENGINEERING & SOFTWARE SYSTEMS PORTFOLIO
          </div>
          <h1 class="pj-hero-title">
            Projects <span>Management Hub</span>
          </h1>
          <p class="pj-hero-subtitle">
            Select a specialized dashboard to explore our cutting-edge IoT microcontroller hardware architectures or modern web development software platforms.
          </p>
        </div>

        <!-- Two Attractive Clickable Dashboard Cards -->
        <div class="pj-hub-grid">

          <!-- Card 1: IoT Projects Dashboard -->
          <div class="pj-hub-card">
            <div>
              <div class="pj-hub-header">
                <div class="pj-hub-icon-box">
                  <i data-lucide="cpu" style="width:32px; height:32px;"></i>
                </div>
                <span class="pj-hub-count-badge">${iotCount} Hardware Systems</span>
              </div>

              <span class="pj-hub-subtitle-tag">Embedded Hardware & Telemetry</span>
              <h2 class="pj-hub-title">IoT Projects</h2>
              <p class="pj-hub-desc">
                Explore smart hardware, embedded systems, automation, sensors, and connected devices with real-time telemetry, production schematics, and firmware code.
              </p>

              <ul class="pj-hub-features-list">
                <li class="pj-hub-feature-item">
                  <i data-lucide="check-circle-2"></i>
                  <span>EchoScribe AI, Smart Autonomous Farm, 3-Phase Voltage Regulators</span>
                </li>
                <li class="pj-hub-feature-item">
                  <i data-lucide="check-circle-2"></i>
                  <span>RFID Attendance, AI Smart Parking, Radar & Rain-Sensing Roofs</span>
                </li>
                <li class="pj-hub-feature-item">
                  <i data-lucide="check-circle-2"></i>
                  <span>Hardware pinouts, circuit diagrams, component specs & firmware code</span>
                </li>
              </ul>
            </div>

            <a href="#/projects/iot" class="pj-hub-btn">
              <span>Explore IoT Projects</span>
              <i data-lucide="arrow-right" style="width:18px;"></i>
            </a>
          </div>

          <!-- Card 2: Web Development Projects Dashboard -->
          <div class="pj-hub-card web-hub">
            <div>
              <div class="pj-hub-header">
                <div class="pj-hub-icon-box">
                  <i data-lucide="globe" style="width:32px; height:32px;"></i>
                </div>
                <span class="pj-hub-count-badge">${webCount} Web Applications</span>
              </div>

              <span class="pj-hub-subtitle-tag">Full-Stack & Cloud Architecture</span>
              <h2 class="pj-hub-title">Web Development Projects</h2>
              <p class="pj-hub-desc">
                Explore modern websites, web applications, dashboards, and full-stack applications built with scalable client-server frameworks, cloud APIs, and interactive UI design.
              </p>

              <ul class="pj-hub-features-list">
                <li class="pj-hub-feature-item">
                  <i data-lucide="check-circle-2"></i>
                  <span>E-Commerce Platforms, Real-Time Monitoring Hubs, AI Portals</span>
                </li>
                <li class="pj-hub-feature-item">
                  <i data-lucide="check-circle-2"></i>
                  <span>Admin Dashboards, Engineering Portfolios & Full-Stack Systems</span>
                </li>
                <li class="pj-hub-feature-item">
                  <i data-lucide="check-circle-2"></i>
                  <span>Live website deployments, responsive UI screenshots & GitHub source code</span>
                </li>
              </ul>
            </div>

            <a href="#/projects/web" class="pj-hub-btn">
              <span>Explore Web Projects</span>
              <i data-lucide="arrow-right" style="width:18px;"></i>
            </a>
          </div>

        </div>

        <!-- Global Summary Statistics Strip -->
        <div class="pj-stats-grid">
          <div class="pj-stat-card">
            <div class="pj-stat-icon">
              <i data-lucide="layers" style="width:22px;"></i>
            </div>
            <div class="pj-stat-info">
              <h3>${iotCount + webCount}</h3>
              <p>Total Projects</p>
            </div>
          </div>

          <div class="pj-stat-card">
            <div class="pj-stat-icon green">
              <i data-lucide="check-circle-2" style="width:22px;"></i>
            </div>
            <div class="pj-stat-info">
              <h3>${iotCount + 4}</h3>
              <p>Completed Deployments</p>
            </div>
          </div>

          <div class="pj-stat-card">
            <div class="pj-stat-icon amber">
              <i data-lucide="clock" style="width:22px;"></i>
            </div>
            <div class="pj-stat-info">
              <h3>1</h3>
              <p>Active In-Progress</p>
            </div>
          </div>

          <div class="pj-stat-card">
            <div class="pj-stat-icon purple">
              <i data-lucide="terminal" style="width:22px;"></i>
            </div>
            <div class="pj-stat-info">
              <h3>${totalTech}</h3>
              <p>Technologies Stack</p>
            </div>
          </div>
        </div>

        <!-- Store Kits Callout Banner -->
        <div style="background:rgba(15, 23, 42, 0.4); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
          <div>
            <h4 style="margin:0 0 4px; font-size:15px; color:#ffffff;">Looking to buy ready-made physical hardware project kits?</h4>
            <p style="margin:0; font-size:13px; color:#94a3b8;">Browse our commercial catalog of orderable kits with verified components, wiring manuals, and home delivery.</p>
          </div>
          <a href="#/projects/all" class="pj-action-btn-secondary" style="white-space:nowrap;">
            <i data-lucide="shopping-bag" style="width:15px;"></i> Browse Store Kits
          </a>
        </div>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}
