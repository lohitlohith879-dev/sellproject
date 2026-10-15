// ============================================================
// CircuitKart — IoT Project Detail Page with Live Dashboard & Specs
// ============================================================
import { store } from '../store.js';

const API_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API = API_URL ? `${API_URL}/api` : '/api';

export async function IoTProjectDetailPage(container, params = {}) {
  const slug = params.slug;

  // Initial loading skeleton
  container.innerHTML = `
    <div class="iot-detail-page">
      <div class="container section">
        <div class="iot-loading-state">
          <div class="spinner"></div>
          <p>Loading project schematics, firmware and IoT telemetry...</p>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  let project = null;
  let reviews = [];
  let isFavorite = false;
  let telemetryInterval = null;

  try {
    const res = await fetch(`${API}/iot-projects/${slug}`);
    if (res.ok) {
      project = await res.json();
    }
  } catch (err) {
    console.error('Failed to load IoT project detail:', err);
  }

  if (!project) {
    container.innerHTML = `
      <div class="container section text-center" style="padding-top: calc(var(--nav-height) + var(--space-4xl)); min-height: 80vh;">
        <div class="iot-empty-state">
          <h1 class="heading-xl" style="color:#00f3ff;">Project Not Found</h1>
          <p class="text-secondary" style="margin: var(--space-md) 0 var(--space-xl);">
            We couldn't locate the requested IoT project specifications for slug "<strong>${slug}</strong>".
          </p>
          <a href="#/iot-projects" class="btn-iot btn-iot-primary">
            <i data-lucide="arrow-left" style="width:16px;height:16px;"></i>
            Back to IoT Projects Marketplace
          </a>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Fetch reviews
  try {
    const revRes = await fetch(`${API}/iot-projects/${project.id}/reviews`);
    if (revRes.ok) {
      reviews = await revRes.json();
    }
  } catch (e) {
    console.warn('Could not fetch reviews:', e);
  }

  // Check user favorite
  const userToken = localStorage.getItem('ck_token');
  if (userToken) {
    try {
      const favRes = await fetch(`${API}/iot-projects/user/favorites`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (favRes.ok) {
        const favIds = await favRes.json();
        isFavorite = favIds.includes(project.id);
      }
    } catch (e) {}
  }

  // Format parsed data
  const componentsList = Array.isArray(project.components)
    ? project.components
    : (typeof project.components === 'string' ? JSON.parse(project.components || '[]') : []);

  const pinouts = Array.isArray(project.pinout)
    ? project.pinout
    : (typeof project.pinout === 'string' ? JSON.parse(project.pinout || '[]') : []);

  const libraries = Array.isArray(project.libraries)
    ? project.libraries
    : (typeof project.libraries === 'string' ? JSON.parse(project.libraries || '[]') : []);

  const troubleshooting = Array.isArray(project.troubleshooting)
    ? project.troubleshooting
    : (typeof project.troubleshooting === 'string' ? JSON.parse(project.troubleshooting || '[]') : []);

  const safetyPrecautions = Array.isArray(project.safetyPrecautions)
    ? project.safetyPrecautions
    : (typeof project.safetyPrecautions === 'string' ? JSON.parse(project.safetyPrecautions || '[]') : []);

  const testingSteps = Array.isArray(project.testingSteps)
    ? project.testingSteps
    : (typeof project.testingSteps === 'string' ? JSON.parse(project.testingSteps || '[]') : []);

  let telemetryConfig = project.telemetryConfig;
  if (typeof telemetryConfig === 'string') {
    try { telemetryConfig = JSON.parse(telemetryConfig); } catch (e) { telemetryConfig = {}; }
  }

  let activeTab = 'overview';
  // Check hash for direct tab navigation, e.g. #/iot-project/slug#dashboard
  const hashParts = window.location.hash.split('#');
  if (hashParts.length > 2 && ['overview', 'schematic', 'firmware', 'dashboard', 'testing', 'components', 'reviews'].includes(hashParts[2])) {
    activeTab = hashParts[2];
  }

  // Simulated telemetry state
  let telemetryState = {
    metrics: telemetryConfig?.metrics || {},
    actuators: telemetryConfig?.actuators || {},
    history: [],
    lastUpdated: new Date().toLocaleTimeString(),
    status: 'ONLINE (DEMO)'
  };

  // Helper functions
  window.downloadIotCode = async (projId) => {
    try {
      await fetch(`${API}/iot-projects/${projId}/download`, { method: 'POST' });
    } catch (e) {}

    const blob = new Blob([project.firmwareCode || '// No firmware code available'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.slug}_firmware.ino`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  window.downloadIotReport = () => {
    const reportText = `# Project Specification Report: ${project.title}
Generated by CircuitKart IoT Marketplace
Category: ${project.category}
Platform: ${project.platform}
Difficulty: ${project.difficulty}
Estimated Budget: INR ${project.estimatedCost}

## Project Overview
${project.description}

## Hardware Bill of Materials
${componentsList.map(c => `- ${c.name || c} (Qty: ${c.qty || 1}, Est. INR ${c.estPrice || 'N/A'})`).join('\n')}

## Pinout Mapping
${pinouts.map(p => `- ${p.component} [${p.pin}] ---> MCU [${p.mcuPin}] (${p.note || 'Signal'})`).join('\n')}

## Libraries Required
${libraries.map(l => `- ${l}`).join('\n')}

## Testing Procedure
${testingSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Safety Precautions
${safetyPrecautions.map(sp => `- ${sp}`).join('\n')}

---
Notice: Educational specification with simulated telemetry demonstration.
`;
    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.slug}_Project_Report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  window.copyIotCode = () => {
    navigator.clipboard.writeText(project.firmwareCode || '');
    const copyBtn = document.getElementById('copy-code-btn');
    if (copyBtn) {
      const original = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;"></i> Copied!';
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        copyBtn.innerHTML = original;
        if (window.lucide) window.lucide.createIcons();
      }, 2000);
    }
  };

  window.addIotKitToCart = () => {
    store.addToCart({
      id: `iot-kit-${project.id}`,
      name: `${project.title} - Complete Hardware Kit`,
      price: project.estimatedCost || 1999,
      image: project.image,
      quantity: 1,
      isKit: true,
      category: 'IoT Kit'
    });
    window.location.hash = '#/cart';
  };

  window.addSingleComponentToCart = (compName, compPrice) => {
    store.addToCart({
      id: `comp-${encodeURIComponent(compName.toLowerCase().replace(/[^a-z0-9]/g, '-'))}`,
      name: compName,
      price: compPrice || 249,
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
      quantity: 1,
      category: 'Component'
    });
    alert(`Added "${compName}" to your cart!`);
  };

  window.toggleActuatorSimulation = async (actuatorKey) => {
    const currentState = telemetryState.actuators[actuatorKey] || 'OFF';
    const newState = currentState === 'ON' ? 'OFF' : 'ON';

    try {
      const res = await fetch(`${API}/iot-projects/${project.id}/actuator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actuator: actuatorKey, state: newState })
      });
      if (res.ok) {
        const data = await res.json();
        telemetryState.actuators = data.actuators;
      } else {
        telemetryState.actuators[actuatorKey] = newState;
      }
    } catch (e) {
      telemetryState.actuators[actuatorKey] = newState;
    }
    updateDashboardDOM();
  };

  // Telemetry Poller & Canvas Chart Engine
  async function fetchTelemetryUpdate() {
    try {
      const res = await fetch(`${API}/iot-projects/${project.id}/telemetry`);
      if (res.ok) {
        const data = await res.json();
        telemetryState.metrics = data.telemetry.metrics || telemetryState.metrics;
        telemetryState.actuators = data.telemetry.actuators || telemetryState.actuators;
        telemetryState.lastUpdated = new Date().toLocaleTimeString();

        // Push to history for charts
        const primaryKey = Object.keys(telemetryState.metrics)[0];
        if (primaryKey) {
          const val = telemetryState.metrics[primaryKey].value;
          telemetryState.history.push(typeof val === 'number' ? val : 50);
          if (telemetryState.history.length > 25) {
            telemetryState.history.shift();
          }
        }
        updateDashboardDOM();
      }
    } catch (e) {
      // Offline fallback: slight simulated drift
      driftTelemetryLocally();
      updateDashboardDOM();
    }
  }

  function driftTelemetryLocally() {
    telemetryState.lastUpdated = new Date().toLocaleTimeString();
    Object.keys(telemetryState.metrics).forEach(k => {
      const m = telemetryState.metrics[k];
      if (typeof m.value === 'number') {
        const delta = (Math.random() - 0.5) * 1.5;
        m.value = Math.round((m.value + delta) * 10) / 10;
      }
    });
    const firstMetric = Object.values(telemetryState.metrics)[0];
    if (firstMetric && typeof firstMetric.value === 'number') {
      telemetryState.history.push(firstMetric.value);
      if (telemetryState.history.length > 25) telemetryState.history.shift();
    }
  }

  function drawTelemetryChart() {
    const canvas = document.getElementById('iot-telemetry-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 600;
    const h = canvas.height = 180;

    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const data = telemetryState.history;
    if (data.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillText('Accumulating sensor stream packets...', 20, h / 2);
      return;
    }

    const min = Math.min(...data) * 0.9;
    const max = Math.max(...data) * 1.1 || 100;
    const range = (max - min) || 1;

    // Draw gradient area
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(0, 243, 255, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 243, 255, 0.0)');

    ctx.beginPath();
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * (w - 40) + 20;
      const y = h - 20 - ((val - min) / range) * (h - 40);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.lineTo((w - 20), h - 10);
    ctx.lineTo(20, h - 10);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw stroke line
    ctx.beginPath();
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2.5;
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * (w - 40) + 20;
      const y = h - 20 - ((val - min) / range) * (h - 40);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw data points
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * (w - 40) + 20;
      const y = h - 20 - ((val - min) / range) * (h - 40);
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#050b14';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    });
  }

  function updateDashboardDOM() {
    const timestampEl = document.getElementById('iot-live-timestamp');
    if (timestampEl) timestampEl.textContent = telemetryState.lastUpdated;

    // Update metric cards
    Object.keys(telemetryState.metrics).forEach(key => {
      const metric = telemetryState.metrics[key];
      const valEl = document.getElementById(`metric-val-${key}`);
      const barEl = document.getElementById(`metric-bar-${key}`);
      if (valEl) {
        valEl.textContent = `${metric.value} ${metric.unit || ''}`;
      }
      if (barEl && typeof metric.value === 'number') {
        const percent = Math.min(Math.max((metric.value / (metric.max || 100)) * 100, 0), 100);
        barEl.style.width = `${percent}%`;
      }
    });

    // Update actuator buttons
    Object.keys(telemetryState.actuators).forEach(key => {
      const state = telemetryState.actuators[key];
      const btn = document.getElementById(`actuator-btn-${key}`);
      const indicator = document.getElementById(`actuator-ind-${key}`);
      if (btn) {
        btn.setAttribute('data-state', state);
      }
      if (indicator) {
        indicator.textContent = state;
        indicator.className = `actuator-state-label ${state === 'ON' ? 'active' : 'inactive'}`;
      }
    });

    drawTelemetryChart();
  }

  function renderPage() {
    const formattedCost = new Intl.NumberFormat('en-IN').format(project.estimatedCost || 0);
    const diff = (project.difficulty || 'Intermediate').toLowerCase();
    let diffBadge = 'badge-intermediate';
    if (diff === 'beginner') diffBadge = 'badge-beginner';
    if (diff === 'advanced') diffBadge = 'badge-advanced';

    container.innerHTML = `
      <div class="iot-detail-page">
        <!-- Breadcrumbs Navigation -->
        <div class="iot-breadcrumbs container">
          <a href="#/">Home</a>
          <i data-lucide="chevron-right" style="width:12px;height:12px;"></i>
          <a href="#/iot-projects">IoT Projects</a>
          <i data-lucide="chevron-right" style="width:12px;height:12px;"></i>
          <a href="#/iot-projects?category=${encodeURIComponent(project.category)}">${project.category}</a>
          <i data-lucide="chevron-right" style="width:12px;height:12px;"></i>
          <span>${project.title}</span>
        </div>

        <!-- Project Hero Bar -->
        <header class="iot-project-hero container">
          <div class="iot-hero-grid">
            <div class="iot-hero-media">
              <img 
                src="${project.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'}" 
                alt="${project.title}" 
                class="iot-detail-hero-img"
              />
              <div class="iot-image-overlay-chips">
                <span class="iot-badge ${diffBadge}">
                  <i data-lucide="gauge" style="width:12px;height:12px;"></i>
                  ${project.difficulty}
                </span>
                <span class="iot-badge badge-demo">
                  <i data-lucide="flask-conical" style="width:12px;height:12px;"></i>
                  DEMO SPECIFICATION
                </span>
              </div>
            </div>

            <div class="iot-hero-info">
              <div class="iot-meta-row">
                <span class="iot-cat-tag">${project.category}</span>
                <span class="iot-platform-pill">
                  <i data-lucide="cpu" style="width:12px;height:12px;"></i>
                  ${project.platform}
                </span>
                <span class="iot-status-tag ${project.isKitAvailable ? 'available' : 'digital'}">
                  ${project.isKitAvailable ? 'Kit Ready to Ship' : 'Complete Digital Blueprint'}
                </span>
              </div>

              <h1 class="iot-detail-title">${project.title}</h1>
              <p class="iot-detail-lead">${project.shortDescription || project.description}</p>

              <div class="iot-ratings-bar">
                <div class="stars" style="color:#f59e0b; display:inline-flex; gap:2px;">
                  ${'<i data-lucide="star" fill="currentColor" style="width:16px;height:16px;"></i>'.repeat(Math.floor(project.rating || 5))}
                  ${(project.rating || 5) % 1 > 0 ? '<i data-lucide="star-half" fill="currentColor" style="width:16px;height:16px;"></i>' : ''}
                </div>
                <span class="rating-num"><strong>${project.rating || '4.8'}</strong> (${project.reviewCount || reviews.length} reviews)</span>
                <span class="divider">|</span>
                <span class="stats-item"><i data-lucide="eye" style="width:14px;height:14px;"></i> ${project.visits || 120} views</span>
                <span class="stats-item"><i data-lucide="download" style="width:14px;height:14px;"></i> ${project.downloads || 45} code downloads</span>
              </div>

              <div class="iot-pricing-panel">
                <div class="iot-price-box">
                  <span class="price-label">ESTIMATED COMPONENT COST</span>
                  <div class="price-amount">₹${formattedCost} <span class="tax-note">(approx. bill of materials)</span></div>
                </div>

                <div class="iot-cta-buttons">
                  <button class="btn-iot btn-iot-primary btn-lg" onclick="window.addIotKitToCart()">
                    <i data-lucide="shopping-cart" style="width:18px;height:18px;"></i>
                    <span>Get Complete Kit</span>
                  </button>

                  <button class="btn-iot btn-iot-secondary btn-lg" onclick="window.downloadIotCode('${project.id}')">
                    <i data-lucide="code" style="width:18px;height:18px;"></i>
                    <span>Download Code (.ino)</span>
                  </button>

                  <button class="btn-iot btn-iot-outline" onclick="window.downloadIotReport()" title="Export complete documentation">
                    <i data-lucide="file-text" style="width:16px;height:16px;"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Main Tab Navigation -->
        <div class="iot-tabs-nav container">
          <div class="iot-tabs-wrapper">
            <button class="iot-tab-btn ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
              <i data-lucide="file-text" style="width:16px;height:16px;"></i>
              Overview & BOM
            </button>
            <button class="iot-tab-btn ${activeTab === 'schematic' ? 'active' : ''}" data-tab="schematic">
              <i data-lucide="git-merge" style="width:16px;height:16px;"></i>
              Circuit & Pinout
            </button>
            <button class="iot-tab-btn ${activeTab === 'firmware' ? 'active' : ''}" data-tab="firmware">
              <i data-lucide="terminal" style="width:16px;height:16px;"></i>
              Firmware & IDE
            </button>
            <button class="iot-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
              <i data-lucide="activity" style="width:16px;height:16px;color:#00f3ff;"></i>
              Live IoT Demo
            </button>
            <button class="iot-tab-btn ${activeTab === 'testing' ? 'active' : ''}" data-tab="testing">
              <i data-lucide="check-circle-2" style="width:16px;height:16px;"></i>
              Testing & Safety
            </button>
            <button class="iot-tab-btn ${activeTab === 'components' ? 'active' : ''}" data-tab="components">
              <i data-lucide="package" style="width:16px;height:16px;"></i>
              Buy Parts
            </button>
            <button class="iot-tab-btn ${activeTab === 'reviews' ? 'active' : ''}" data-tab="reviews">
              <i data-lucide="message-square" style="width:16px;height:16px;"></i>
              Reviews (${reviews.length})
            </button>
          </div>
        </div>

        <!-- Tab Content Container -->
        <main class="iot-tab-content-container container">

          <!-- TAB 1: OVERVIEW & BOM -->
          <section id="tab-overview" class="iot-tab-panel ${activeTab === 'overview' ? 'active' : ''}">
            <div class="iot-section-card">
              <h2 class="card-heading">
                <i data-lucide="info"></i>
                Project Overview & Objectives
              </h2>
              <div class="iot-text-content">
                <p style="white-space: pre-line; line-height: 1.8; color: var(--text-secondary);">${project.description}</p>
              </div>

              <div class="iot-callout-grid">
                <div class="callout-card">
                  <h4><i data-lucide="target" style="width:16px;height:16px;color:#00f3ff;"></i> Core Objectives</h4>
                  <ul>
                    <li>Real-time sensor data acquisition and edge preprocessing on ${project.platform}.</li>
                    <li>Secure data transmission over local Wi-Fi / Cellular / Serial telemetry channels.</li>
                    <li>Automated threshold monitoring and closed-loop relay actuator triggering.</li>
                    <li>Low-power engineering practices and reliable fail-safe operation.</li>
                  </ul>
                </div>

                <div class="callout-card">
                  <h4><i data-lucide="cpu" style="width:16px;height:16px;color:#00f3ff;"></i> System Architecture</h4>
                  <ul>
                    <li><strong>Controller:</strong> ${project.platform} (Dual-Core or RISC Architecture)</li>
                    <li><strong>Sensors:</strong> High precision analog and I2C digital transducers</li>
                    <li><strong>Actuators:</strong> Opto-isolated relay modules and indicator buzzers</li>
                    <li><strong>Protocol:</strong> HTTP RESTful JSON telemetry & MQTT stream ready</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Bill of Materials (BOM) Table -->
            <div class="iot-section-card">
              <div class="card-header-flex">
                <h2 class="card-heading">
                  <i data-lucide="clipboard-list"></i>
                  Hardware Bill of Materials & Budget Breakdown
                </h2>
                <button class="btn-iot btn-iot-primary btn-sm" onclick="window.addIotKitToCart()">
                  <i data-lucide="shopping-bag" style="width:14px;height:14px;"></i>
                  Order Complete Kit (₹${formattedCost})
                </button>
              </div>

              <p class="section-subtext">Estimated component pricing based on standard Indian electronics distributor pricing.</p>

              <div class="iot-table-wrapper">
                <table class="iot-bom-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Component Name</th>
                      <th>Specification / Details</th>
                      <th>Qty</th>
                      <th>Est. Unit Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${componentsList.map((comp, idx) => {
                      const name = typeof comp === 'string' ? comp : (comp.name || 'Component');
                      const desc = comp.specs || 'Industrial Grade standard maker module';
                      const qty = comp.qty || 1;
                      const estPrice = comp.estPrice || Math.round((project.estimatedCost || 2000) / (componentsList.length || 1));
                      return `
                        <tr>
                          <td><strong>${idx + 1}</strong></td>
                          <td><span class="comp-name">${name}</span></td>
                          <td><span class="comp-desc">${desc}</span></td>
                          <td><span class="comp-qty">${qty}</span></td>
                          <td><span class="comp-price">₹${estPrice}</span></td>
                          <td>
                            <button class="btn-iot-mini" onclick="window.addSingleComponentToCart('${name.replace(/'/g, "\\'")}', ${estPrice})">
                              <i data-lucide="plus" style="width:12px;height:12px;"></i> Add
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: 700;">TOTAL ESTIMATED HARDWARE BUDGET:</td>
                      <td colspan="2" style="font-weight: 700; color: #00f3ff; font-size: 1.1rem;">₹${formattedCost} INR</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </section>

          <!-- TAB 2: SCHEMATIC & PINOUT -->
          <section id="tab-schematic" class="iot-tab-panel ${activeTab === 'schematic' ? 'active' : ''}">
            <div class="iot-section-card">
              <h2 class="card-heading">
                <i data-lucide="git-merge"></i>
                Circuit Diagram & Block Diagram
              </h2>
              <p class="section-subtext">Verified schematic topology for ${project.platform}. Follow proper ground sharing and power decoupling.</p>

              <div class="iot-schematic-box">
                <img 
                  src="${project.circuitDiagram || project.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80'}" 
                  alt="${project.title} Circuit Diagram" 
                  class="schematic-view-img"
                />
                <div class="schematic-caption">
                  <i data-lucide="shield-check" style="width:14px;height:14px;color:#10b981;"></i>
                  <span>Engineering Schematic & Block Architecture (CircuitKart Hardware Verified)</span>
                </div>
              </div>
            </div>

            <!-- Pinout Mapping Table -->
            <div class="iot-section-card">
              <h2 class="card-heading">
                <i data-lucide="cpu"></i>
                Microcontroller GPIO Pinout Connections
              </h2>
              <p class="section-subtext">Make connections with the MCU unpowered. Verify 3.3V vs 5V logic tolerance.</p>

              <div class="iot-table-wrapper">
                <table class="iot-pinout-table">
                  <thead>
                    <tr>
                      <th>Module / Component</th>
                      <th>Module Pin</th>
                      <th>Microcontroller Pin</th>
                      <th>Signal Type & Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${pinouts.map(p => `
                      <tr>
                        <td><strong>${p.component}</strong></td>
                        <td><span class="pin-badge module-pin">${p.pin}</span></td>
                        <td><span class="pin-badge mcu-pin">${p.mcuPin}</span></td>
                        <td><span class="pin-note">${p.note || 'Digital I/O connection with decoupling'}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- TAB 3: FIRMWARE & IDE -->
          <section id="tab-firmware" class="iot-tab-panel ${activeTab === 'firmware' ? 'active' : ''}">
            <!-- IDE & Library Instructions -->
            <div class="iot-section-card">
              <h2 class="card-heading">
                <i data-lucide="settings"></i>
                Development Environment & Library Setup
              </h2>

              <div class="iot-setup-grid">
                <div class="setup-col">
                  <h4>1. Arduino IDE Setup</h4>
                  <ol>
                    <li>Open Arduino IDE (v2.0 or later recommended).</li>
                    <li>Go to <code>File > Preferences</code> and enter board manager URL for ESP32 / Arduino if needed.</li>
                    <li>Select Board: <code>${project.platform}</code> from <code>Tools > Board</code>.</li>
                    <li>Set Serial Monitor baud rate to <code>115200 baud</code>.</li>
                  </ol>
                </div>

                <div class="setup-col">
                  <h4>2. Required Libraries</h4>
                  <div class="library-tags-list">
                    ${libraries.map(lib => `
                      <div class="lib-pill">
                        <i data-lucide="box" style="width:14px;height:14px;color:#00f3ff;"></i>
                        <span>${lib}</span>
                      </div>
                    `).join('')}
                  </div>
                  <p class="lib-install-note">Install via <code>Sketch > Include Library > Manage Libraries</code>.</p>
                </div>
              </div>
            </div>

            <!-- Complete Firmware Code Box -->
            <div class="iot-section-card">
              <div class="card-header-flex">
                <h2 class="card-heading">
                  <i data-lucide="terminal"></i>
                  Complete Firmware Source Code (.ino)
                </h2>

                <div class="code-actions">
                  <button id="copy-code-btn" class="btn-iot-mini" onclick="window.copyIotCode()">
                    <i data-lucide="copy" style="width:14px;height:14px;"></i> Copy Code
                  </button>
                  <button class="btn-iot-mini" onclick="window.downloadIotCode('${project.id}')">
                    <i data-lucide="download" style="width:14px;height:14px;"></i> Download .ino
                  </button>
                </div>
              </div>

              <div class="terminal-window">
                <div class="terminal-header">
                  <div class="terminal-dots">
                    <span class="dot red"></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                  </div>
                  <span class="terminal-filename">${project.slug}_firmware.ino</span>
                  <span class="terminal-badge">C++ / Arduino</span>
                </div>
                <pre class="terminal-code"><code id="firmware-code-block">${escapeHtml(project.firmwareCode || '// Firmware code')}</code></pre>
              </div>
            </div>
          </section>

          <!-- TAB 4: LIVE IOT DEMO DASHBOARD -->
          <section id="tab-dashboard" class="iot-tab-panel ${activeTab === 'dashboard' ? 'active' : ''}">
            <div class="iot-dashboard-container">
              <!-- Notice Banner -->
              <div class="iot-demo-banner">
                <div class="banner-icon">
                  <i data-lucide="flask-conical" style="width:24px;height:24px;color:#00f3ff;"></i>
                </div>
                <div class="banner-text">
                  <h3>Interactive Live IoT Dashboard Simulator</h3>
                  <p>
                    <strong>DEMO DATA NOTICE:</strong> The telemetry shown below is simulated in real time based on physics and mathematical models for <em>${project.title}</em>.
                    No physical device is currently paired. Toggle the actuators below to inspect closed-loop feedback.
                  </p>
                </div>
                <div class="banner-status-badge">
                  <span class="live-dot"></span>
                  <span id="iot-conn-status">ONLINE (DEMO STREAM)</span>
                </div>
              </div>

              <!-- Top Telemetry Cards -->
              <div class="telemetry-cards-grid">
                ${Object.keys(telemetryState.metrics).map(key => {
                  const m = telemetryState.metrics[key];
                  const percent = typeof m.value === 'number' ? Math.min(Math.max((m.value / (m.max || 100)) * 100, 0), 100) : 50;
                  return `
                    <div class="telemetry-card">
                      <div class="card-top">
                        <span class="metric-title">${m.label || key}</span>
                        <i data-lucide="${getMetricIcon(key)}" style="width:18px;height:18px;color:#00f3ff;"></i>
                      </div>
                      <div class="metric-value-row">
                        <span class="metric-val" id="metric-val-${key}">${m.value} ${m.unit || ''}</span>
                        <span class="metric-tag">${m.status || 'NORMAL'}</span>
                      </div>
                      <div class="metric-bar-bg">
                        <div class="metric-bar-fill" id="metric-bar-${key}" style="width: ${percent}%;"></div>
                      </div>
                      <div class="metric-range">
                        <span>Min: ${m.min || 0} ${m.unit || ''}</span>
                        <span>Max: ${m.max || 100} ${m.unit || ''}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Real-time Chart Section -->
              <div class="iot-section-card chart-card">
                <div class="card-header-flex">
                  <div>
                    <h3 class="card-heading" style="margin-bottom: 4px;">
                      <i data-lucide="line-chart"></i>
                      Real-Time Sensor Telemetry Stream
                    </h3>
                    <p class="section-subtext" style="margin:0;">Sampling at ~3000ms intervals. Buffer depth: 25 frames.</p>
                  </div>
                  <div class="last-sync">
                    <span>Last packet: </span>
                    <strong id="iot-live-timestamp">${telemetryState.lastUpdated}</strong>
                  </div>
                </div>

                <div class="canvas-chart-wrapper">
                  <canvas id="iot-telemetry-canvas"></canvas>
                </div>
              </div>

              <!-- Actuator Controls & Remote Triggering -->
              <div class="iot-section-card actuators-card">
                <h3 class="card-heading">
                  <i data-lucide="toggle-left"></i>
                  Device Actuator & Relay Controls (Simulated)
                </h3>
                <p class="section-subtext">Click any toggle to dispatch a simulated hardware state trigger.</p>

                <div class="actuators-grid">
                  ${Object.keys(telemetryState.actuators).map(key => {
                    const st = telemetryState.actuators[key];
                    return `
                      <div class="actuator-control-item">
                        <div class="actuator-info">
                          <span class="actuator-name">${formatActuatorName(key)}</span>
                          <span class="actuator-state-label ${st === 'ON' ? 'active' : 'inactive'}" id="actuator-ind-${key}">${st}</span>
                        </div>
                        <button 
                          class="toggle-switch-btn" 
                          id="actuator-btn-${key}" 
                          data-state="${st}"
                          onclick="window.toggleActuatorSimulation('${key}')"
                        >
                          <span class="slider"></span>
                        </button>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Threshold & Alert Feed -->
              <div class="iot-section-card alert-feed-card">
                <h3 class="card-heading">
                  <i data-lucide="bell-ring"></i>
                  System Event & Threshold Log
                </h3>
                <div class="alert-feed-list">
                  <div class="feed-item normal">
                    <span class="feed-time">10:04:12</span>
                    <span class="feed-tag">TELEMETRY</span>
                    <span class="feed-msg">Sensor heartbeat acknowledged. Signal RSSI: -54 dBm (Excellent).</span>
                  </div>
                  <div class="feed-item alert">
                    <span class="feed-time">10:02:40</span>
                    <span class="feed-tag">ALERT</span>
                    <span class="feed-msg">Simulated parameter threshold monitored. Automatic failsafe armed.</span>
                  </div>
                  <div class="feed-item success">
                    <span class="feed-time">09:58:15</span>
                    <span class="feed-tag">BOOT</span>
                    <span class="feed-msg">Microcontroller initialized with firmware v1.0.4. Watchdog timer active.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- TAB 5: TESTING & SAFETY -->
          <section id="tab-testing" class="iot-tab-panel ${activeTab === 'testing' ? 'active' : ''}">
            <div class="iot-section-card">
              <h2 class="card-heading">
                <i data-lucide="check-circle-2"></i>
                Testing Procedure & Validation Steps
              </h2>

              <div class="testing-steps-list">
                ${testingSteps.map((step, idx) => `
                  <div class="test-step-item">
                    <div class="step-num">${idx + 1}</div>
                    <div class="step-content">
                      <p>${step}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Troubleshooting Matrix -->
            <div class="iot-section-card">
              <h2 class="card-heading">
                <i data-lucide="wrench"></i>
                Diagnostic & Troubleshooting Matrix
              </h2>

              <div class="iot-table-wrapper">
                <table class="iot-troubleshoot-table">
                  <thead>
                    <tr>
                      <th>Symptom / Issue</th>
                      <th>Root Cause</th>
                      <th>Resolution / Fix</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${troubleshooting.map(t => `
                      <tr>
                        <td><strong style="color:#ef4444;">${t.symptom}</strong></td>
                        <td>${t.cause}</td>
                        <td><span style="color:#10b981;">${t.fix}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Safety Precautions -->
            <div class="iot-section-card safety-card">
              <h2 class="card-heading" style="color:#f59e0b;">
                <i data-lucide="alert-triangle"></i>
                Engineering Safety Precautions
              </h2>

              <ul class="safety-list">
                ${safetyPrecautions.map(sp => `
                  <li>
                    <i data-lucide="shield-alert" style="width:16px;height:16px;color:#f59e0b;flex-shrink:0;"></i>
                    <span>${sp}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </section>

          <!-- TAB 6: BUY COMPATIBLE COMPONENTS -->
          <section id="tab-components" class="iot-tab-panel ${activeTab === 'components' ? 'active' : ''}">
            <div class="iot-section-card">
              <div class="card-header-flex">
                <div>
                  <h2 class="card-heading">
                    <i data-lucide="package"></i>
                    Compatible Components from CircuitKart Store
                  </h2>
                  <p class="section-subtext">Add verified parts individually or get the full bundle with free schematics and testing jumper cables.</p>
                </div>
                <button class="btn-iot btn-iot-primary" onclick="window.addIotKitToCart()">
                  <i data-lucide="shopping-cart" style="width:16px;height:16px;"></i>
                  Add Complete Kit to Cart (₹${formattedCost})
                </button>
              </div>

              <div class="compatible-parts-grid">
                ${componentsList.map(comp => {
                  const name = typeof comp === 'string' ? comp : (comp.name || 'Component');
                  const price = comp.estPrice || 249;
                  return `
                    <div class="part-item-card">
                      <div class="part-info">
                        <h4>${name}</h4>
                        <span class="part-desc">${comp.specs || 'Compatible maker hardware module'}</span>
                        <div class="part-price">₹${price}</div>
                      </div>
                      <button class="btn-iot btn-iot-outline btn-sm" onclick="window.addSingleComponentToCart('${name.replace(/'/g, "\\'")}', ${price})">
                        <i data-lucide="plus" style="width:14px;height:14px;"></i> Add to Cart
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </section>

          <!-- TAB 7: REVIEWS & RATINGS -->
          <section id="tab-reviews" class="iot-tab-panel ${activeTab === 'reviews' ? 'active' : ''}">
            <div class="iot-section-card">
              <div class="card-header-flex">
                <h2 class="card-heading">
                  <i data-lucide="message-square"></i>
                  Community Reviews & Ratings (${reviews.length})
                </h2>
              </div>

              <!-- Add Review Form -->
              <div class="iot-add-review-box">
                <h4>Submit a Technical Review</h4>
                <p class="section-subtext">Share your hardware build experience, wiring tips, or code enhancements.</p>
                <form id="iot-review-form" class="iot-review-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Your Name</label>
                      <input type="text" id="review-user-name" required placeholder="e.g. Jane Doe" class="iot-input" />
                    </div>
                    <div class="form-group">
                      <label>Rating (1-5 Stars)</label>
                      <select id="review-rating" class="iot-select">
                        <option value="5">5 - Excellent (Verified & Working)</option>
                        <option value="4">4 - Good (Minor wiring adjustments)</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Challenging</option>
                        <option value="1">1 - Needs Review</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Review & Feedback</label>
                    <textarea id="review-comment" required rows="3" placeholder="Describe your experience assembling this circuit or running the firmware..." class="iot-textarea"></textarea>
                  </div>
                  <button type="submit" class="btn-iot btn-iot-primary">
                    <i data-lucide="send" style="width:14px;height:14px;"></i>
                    Submit Review
                  </button>
                </form>
              </div>

              <!-- Reviews List -->
              <div class="iot-reviews-list">
                ${reviews.length > 0 ? reviews.map(rev => `
                  <div class="review-item">
                    <div class="review-top">
                      <div class="reviewer-meta">
                        <span class="reviewer-avatar">${(rev.userName || 'U')[0].toUpperCase()}</span>
                        <div>
                          <strong>${rev.userName || 'Anonymous User'}</strong>
                          <span class="review-date">${new Date(rev.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div class="stars" style="color:#f59e0b;">
                        ${'<i data-lucide="star" fill="currentColor" style="width:14px;height:14px;"></i>'.repeat(rev.rating || 5)}
                      </div>
                    </div>
                    <p class="review-text">${rev.comment}</p>
                  </div>
                `).join('') : `
                  <div class="no-reviews-note">
                    <p>Be the first maker to review <strong>${project.title}</strong>!</p>
                  </div>
                `}
              </div>
            </div>
          </section>

        </main>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Attach Tab Switching
    document.querySelectorAll('.iot-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        activeTab = tab;
        document.querySelectorAll('.iot-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.iot-tab-panel').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const panel = document.getElementById(`tab-${tab}`);
        if (panel) panel.classList.add('active');

        // If switched to dashboard, kick off canvas drawing and polling
        if (tab === 'dashboard') {
          setTimeout(updateDashboardDOM, 50);
        }
      });
    });

    // Review Submission
    const reviewForm = document.getElementById('iot-review-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userName = document.getElementById('review-user-name').value;
        const rating = parseInt(document.getElementById('review-rating').value, 10);
        const comment = document.getElementById('review-comment').value;

        try {
          const res = await fetch(`${API}/iot-projects/${project.id}/reviews`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('ck_token') || ''}`
            },
            body: JSON.stringify({ userName, rating, comment })
          });
          if (res.ok) {
            const newRev = await res.json();
            reviews.unshift(newRev);
            alert('Thank you! Your review has been recorded.');
            renderPage();
          } else {
            alert('Could not submit review. Please ensure you are logged in.');
          }
        } catch (err) {
          alert('Network error submitting review.');
        }
      });
    }

    // Canvas resize handler
    window.addEventListener('resize', drawTelemetryChart);

    // Initial canvas chart draw if on dashboard
    if (activeTab === 'dashboard') {
      setTimeout(updateDashboardDOM, 100);
    }
  }

  // Escape HTML helper
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getMetricIcon(key) {
    const k = key.toLowerCase();
    if (k.includes('temp')) return 'thermometer';
    if (k.includes('humid') || k.includes('moisture')) return 'droplets';
    if (k.includes('air') || k.includes('gas') || k.includes('aqi') || k.includes('co2')) return 'wind';
    if (k.includes('level') || k.includes('water') || k.includes('tank')) return 'waves';
    if (k.includes('power') || k.includes('energy') || k.includes('voltage') || k.includes('current')) return 'zap';
    if (k.includes('slot') || k.includes('park')) return 'car';
    if (k.includes('speed') || k.includes('rpm')) return 'gauge';
    return 'activity';
  }

  function formatActuatorName(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase());
  }

  // Start real-time telemetry polling interval (every 3.5s)
  if (telemetryInterval) clearInterval(telemetryInterval);
  telemetryInterval = setInterval(() => {
    if (activeTab === 'dashboard') {
      fetchTelemetryUpdate();
    }
  }, 3500);

  // Render first time
  renderPage();
}
