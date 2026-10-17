// Component Detail Page (#/components/:id)
import { router } from '../router.js';
import { store } from '../store.js';
import { openComponentComparisonModal } from '../components/componentComparisonModal.js';
import { openProjectBudgetBuilderModal } from '../components/projectBudgetBuilderModal.js';
import { openAdminComponentModal } from '../components/adminComponentModal.js';
import '../styles/hardwareExplorer.css';

export async function ComponentDetailPage(container, params = {}) {
  const componentId = params.id;
  container.innerHTML = `
    <div class="hw-explorer-page">
      <div class="container" style="max-width: 1240px; margin: 0 auto; padding: 100px 20px; text-align:center;">
        <div class="spinner"></div>
        <p style="color:var(--hw-cyan); font-weight:600; margin-top:16px;">Loading Component Specifications...</p>
      </div>
    </div>
  `;

  let component = null;
  let companionComponents = [];

  try {
    const res = await fetch(`/api/hardware-components/${componentId}`);
    if (!res.ok) throw new Error('Component not found');
    component = await res.json();

    // Fetch related components in same category for companion recommendations
    const relRes = await fetch(`/api/hardware-components?category=${encodeURIComponent(component.category)}`);
    const relData = await relRes.json();
    companionComponents = (relData.components || []).filter(c => c.id !== component.id).slice(0, 4);
  } catch (err) {
    container.innerHTML = `
      <div class="hw-explorer-page">
        <div class="container text-center" style="max-width: 600px; margin: 100px auto; padding: 40px; background:var(--hw-bg-card); border:1px solid var(--hw-border); border-radius:18px;">
          <i data-lucide="alert-octagon" style="width:56px; height:56px; color:#ef4444; margin-bottom:16px;"></i>
          <h2 style="color:#ffffff; margin:0 0 12px 0;">Component Not Found</h2>
          <p style="color:var(--hw-text-muted); margin-bottom:24px;">The electronic component you requested could not be located in the database.</p>
          <a href="#/components" class="hw-btn hw-btn-primary">
            <i data-lucide="arrow-left"></i>
            Back to Hardware Explorer
          </a>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Authentic local view angles
  const frontImg = `/images/components/${component.id}-front.svg`;
  const angleImg = `/images/components/${component.id}-angle.svg`;
  const backImg = `/images/components/${component.id}-back.svg`;
  const pinoutImg = `/images/components/${component.id}-pinout.svg`;

  const availableViews = [
    { id: 'front', label: 'Front Hero', icon: 'camera', src: frontImg },
    { id: 'angle', label: '3D Angle', icon: 'box', src: angleImg },
    { id: 'back', label: 'Underside', icon: 'rotate-cw', src: backImg },
    { id: 'pinout', label: 'Pinout Blueprint', icon: 'cpu', src: pinoutImg },
  ];

  // Active gallery image
  let activeImage = component.image || frontImg;

  // Best price calculation among retailers
  const sortedRetailers = [...(component.retailers || [])].sort((a, b) => a.price - b.price);
  const bestRetailer = sortedRetailers[0];

  const isAdmin = store.get('user')?.role === 'admin';

  function render() {
    container.innerHTML = `
      <div class="hw-explorer-page">
        <div class="hw-detail-container">
          
          <!-- Breadcrumbs -->
          <div class="hw-breadcrumbs">
            <a href="#/">Home</a>
            <span>/</span>
            <a href="#/components">Hardware Components Store</a>
            <span>/</span>
            <span style="color:var(--hw-text-muted);">${component.category}</span>
            <span>/</span>
            <span style="color:#ffffff; font-weight:600;">${component.name}</span>
          </div>

          <!-- Top Grid: Gallery & Primary Buy Info -->
          <div class="hw-detail-grid">
            
            <!-- Left: High-Resolution Authentic Component Gallery -->
            <div class="hw-gallery-box">
              
              <!-- Real Component View Angle Tabs -->
              <div class="hw-view-angle-tabs">
                ${availableViews.map(v => `
                  <button
                    class="hw-angle-tab-btn ${v.src === activeImage ? 'active' : ''}"
                    data-view-src="${v.src}"
                    data-view-name="${v.label}"
                    type="button"
                    title="View ${v.label} of ${component.name}"
                  >
                    <i data-lucide="${v.icon}" style="width:14px; height:14px;"></i>
                    <span>${v.label}</span>
                  </button>
                `).join('')}
              </div>

              <!-- Main High-Resolution Image Wrap with Dynamic Lens Zoom -->
              <div id="hw-zoom-wrap" class="hw-main-img-wrap" title="Hover to Magnify • Click for HD Blueprint Lightbox">
                <div id="hw-gallery-active-label" class="hw-view-badge">
                  <i data-lucide="check-circle" style="width:12px; height:12px;"></i>
                  <span>Hero Front View</span>
                </div>

                <img
                  id="hw-main-display-img"
                  src="${activeImage}"
                  alt="${component.name}"
                  class="hw-main-img"
                  onerror="this.src='${frontImg}'"
                  loading="eager"
                />

                <div class="hw-zoom-hint">
                  <i data-lucide="zoom-in" style="width:14px; height:14px;"></i>
                  <span>Hover to Magnify • Click for HD Lightbox</span>
                </div>
              </div>

              <!-- Thumbnails Strip with Angle Labels -->
              <div class="hw-thumb-strip">
                ${availableViews.map((v) => `
                  <div
                    class="hw-thumb-card ${v.src === activeImage ? 'active' : ''}"
                    data-thumb-src="${v.src}"
                    data-thumb-name="${v.label}"
                    title="Switch view to ${v.label}"
                  >
                    <img src="${v.src}" alt="${v.label}" class="hw-thumb-img" onerror="this.src='${frontImg}'" />
                    <span class="hw-thumb-label">${v.label}</span>
                  </div>
                `).join('')}
              </div>

              <!-- Technical Pinout Schematic Quick-Bar -->
              <div style="background:rgba(7, 11, 20, 0.7); border:1px solid rgba(0, 242, 254, 0.25); border-radius:12px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; margin-top:2px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <i data-lucide="circuit-board" style="color:var(--hw-cyan); width:20px; height:20px;"></i>
                  <div>
                    <div style="font-size:0.85rem; font-weight:700; color:#ffffff;">Circuit Blueprint &amp; Pinout</div>
                    <div style="font-size:0.75rem; color:var(--hw-text-muted);">Inspect GPIO, I2C, SPI &amp; Power wiring</div>
                  </div>
                </div>
                <button id="hw-btn-open-pinout" class="hw-btn hw-btn-glass" style="padding:6px 14px; font-size:0.78rem;" type="button">
                  <i data-lucide="maximize-2" style="width:12px; height:12px;"></i> Open Schematic
                </button>
              </div>

            </div>

            <!-- Right: Details, Retailer Prices, Specs, Actions -->
            <div class="hw-detail-info">
              
              <div class="hw-detail-head">
                <div class="cat-badge">${component.category}</div>
                <h1 class="hw-detail-title">${component.name}</h1>
                <div class="hw-detail-meta">
                  <span style="font-family:monospace; background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:4px;">
                    Model: ${component.model || component.id}
                  </span>
                  <span class="stars">
                    <i data-lucide="star" style="width:14px; height:14px; fill:#f59e0b;"></i>
                    ${component.rating || 4.8} (${component.reviewCount || 45} Verified Reviews)
                  </span>
                  <span style="color:${component.inStock ? 'var(--hw-accent-green)' : '#ef4444'}; font-weight:600; display:flex; align-items:center; gap:4px;">
                    <i data-lucide="${component.inStock ? 'check-circle' : 'alert-circle'}" style="width:14px; height:14px;"></i>
                    ${component.inStock ? `In Stock (${component.stockCount || 30} units)` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              <!-- Pricing Card Box -->
              <div class="hw-pricing-box">
                <div class="hw-price-large-row">
                  <span class="hw-price-large">₹${component.price.toLocaleString('en-IN')}</span>
                  ${component.mrp > component.price ? `
                    <span class="hw-price-mrp-large">₹${component.mrp.toLocaleString('en-IN')}</span>
                    <span class="hw-save-pill">Save ${Math.round(((component.mrp - component.price) / component.mrp) * 100)}%</span>
                  ` : ''}
                </div>

                <div class="hw-verify-date">
                  <i data-lucide="shield-check" style="color:var(--hw-cyan); width:15px; height:15px;"></i>
                  <span>${component.priceType === 'Verified' ? 'Verified Current Market Price' : 'Estimated Pricing'} in INR (₹)</span>
                  <span style="color:#64748b;">•</span>
                  <span>Last verified on: <b>${component.lastVerified || '16 Oct 2026'}</b></span>
                </div>

                <!-- Primary Action Buttons -->
                <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:8px;">
                  <button id="hw-detail-add-bom-btn" class="hw-btn hw-btn-purple" style="flex:1; justify-content:center; padding:12px 20px;">
                    <i data-lucide="plus-circle"></i>
                    Add to Project Budget
                  </button>
                  <a
                    href="${(component.retailers && component.retailers[0] && component.retailers[0].url) || '#'}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="hw-btn hw-btn-primary"
                    style="flex:1; justify-content:center; padding:12px 20px;"
                  >
                    <i data-lucide="external-link"></i>
                    Buy Now (${(component.retailers && component.retailers[0] && component.retailers[0].name) || 'Retailer'})
                  </a>
                  ${component.datasheetUrl ? `
                    <a href="${component.datasheetUrl}" target="_blank" rel="noopener noreferrer" class="hw-btn hw-btn-glass" title="Download Official Technical Datasheet">
                      <i data-lucide="file-text"></i>
                      Datasheet PDF
                    </a>
                  ` : ''}
                  ${isAdmin ? `
                    <button id="hw-detail-admin-edit" class="hw-btn hw-btn-glass" style="border-color:var(--hw-cyan); color:var(--hw-cyan);">
                      <i data-lucide="edit"></i> Admin Edit
                    </button>
                  ` : ''}
                </div>
              </div>

              <!-- Indian Retailers Price Comparison Table -->
              <div class="hw-retailers-comparison">
                <div class="hw-box-title">
                  <i data-lucide="shopping-bag" style="color:var(--hw-cyan); width:20px; height:20px;"></i>
                  <span>Price Comparison Across Indian Retailers</span>
                </div>

                <table class="hw-retailer-table">
                  <thead>
                    <tr>
                      <th>Retailer</th>
                      <th>Availability</th>
                      <th>Delivery Estimate</th>
                      <th style="text-align:right;">Price (₹)</th>
                      <th style="text-align:right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(component.retailers || []).map(r => {
                      const isBest = bestRetailer && r.name === bestRetailer.name;
                      return `
                        <tr class="hw-retailer-row">
                          <td>
                            <div class="hw-retailer-name">
                              ${r.name}
                              ${isBest ? `<span class="hw-retailer-best-badge">BEST PRICE</span>` : ''}
                            </div>
                          </td>
                          <td>
                            <span style="color:${r.inStock ? 'var(--hw-accent-green)' : '#ef4444'}; font-weight:600; font-size:0.85rem;">
                              ${r.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                            </span>
                          </td>
                          <td style="color:var(--hw-text-muted); font-size:0.85rem;">
                            ${r.delivery || '2-4 Days'}
                          </td>
                          <td style="text-align:right;">
                            <span class="hw-retailer-price">₹${r.price.toLocaleString('en-IN')}</span>
                          </td>
                          <td style="text-align:right;">
                            <a
                              href="${r.url}"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="hw-btn hw-btn-glass"
                              style="padding:5px 12px; font-size:0.78rem; text-decoration:none;"
                            >
                              Visit Store <i data-lucide="external-link" style="width:11px; height:11px;"></i>
                            </a>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>

              <!-- Microcontroller Compatibility Badges -->
              <div style="background:var(--hw-bg-card); border:1px solid var(--hw-border); border-radius:16px; padding:20px;">
                <div class="hw-box-title">
                  <i data-lucide="check-check" style="color:var(--hw-cyan); width:20px; height:20px;"></i>
                  <span>Architecture & Platform Compatibility</span>
                </div>
                <div class="hw-compat-badges">
                  <div class="hw-compat-badge ${component.compatibility?.arduino ? 'supported' : ''}">
                    <i data-lucide="cpu"></i>
                    <span>Arduino IDE (UNO, Mega, Nano)</span>
                  </div>
                  <div class="hw-compat-badge ${component.compatibility?.esp32 ? 'supported' : ''}">
                    <i data-lucide="wifi"></i>
                    <span>ESP32 & ESP8266 IoT</span>
                  </div>
                  <div class="hw-compat-badge ${component.compatibility?.raspberryPi ? 'supported' : ''}">
                    <i data-lucide="hard-drive"></i>
                    <span>Raspberry Pi & SBCs</span>
                  </div>
                  <div class="hw-compat-badge ${component.compatibility?.stm32 ? 'supported' : ''}">
                    <i data-lucide="microchip"></i>
                    <span>STM32 ARM Cortex</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Bottom Tabs: Working Principle, Technical Specs, Pin Connections, Code Example -->
          <div style="display:flex; flex-direction:column; gap:32px; margin-top:20px;">
            
            <!-- Working Principle & Applications -->
            <div style="background:var(--hw-bg-card); border:1px solid var(--hw-border); border-radius:18px; padding:28px;">
              <h2 style="font-size:1.4rem; color:#ffffff; margin:0 0 14px 0; display:flex; align-items:center; gap:10px;">
                <i data-lucide="info" style="color:var(--hw-cyan);"></i>
                Working Principle & Technical Overview
              </h2>
              <p style="color:#cbd5e1; font-size:0.95rem; line-height:1.75; margin-bottom:20px;">
                ${component.workingPrinciple}
              </p>

              <h3 style="font-size:1.05rem; color:#ffffff; margin:20px 0 10px 0;">Primary Engineering Applications:</h3>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
                ${(component.applications || []).map(app => `
                  <div style="display:flex; align-items:flex-start; gap:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px;">
                    <i data-lucide="arrow-right" style="color:var(--hw-cyan); width:16px; height:16px; flex-shrink:0; margin-top:2px;"></i>
                    <span style="font-size:0.88rem; color:#e2e8f0;">${app}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Full Technical Specifications Table -->
            <div>
              <h2 style="font-size:1.4rem; color:#ffffff; margin:0 0 16px 0; display:flex; align-items:center; gap:10px;">
                <i data-lucide="sliders" style="color:var(--hw-cyan);"></i>
                Complete Technical Specifications
              </h2>
              <table class="hw-specs-table">
                <tbody>
                  <tr>
                    <td class="key">Operating Voltage</td>
                    <td class="val">${component.voltage || '5V DC'}</td>
                  </tr>
                  <tr>
                    <td class="key">Current Consumption</td>
                    <td class="val">${component.current || '50mA'}</td>
                  </tr>
                  <tr>
                    <td class="key">Communication Interface</td>
                    <td class="val">${component.interface || 'Digital GPIO'}</td>
                  </tr>
                  ${Object.entries(component.keySpecs || {}).map(([k, v]) => `
                    <tr>
                      <td class="key">${k}</td>
                      <td class="val">${v}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Pin Connections Table -->
            ${(component.pinConnections && component.pinConnections.length > 0) ? `
              <div>
                <h2 style="font-size:1.4rem; color:#ffffff; margin:0 0 16px 0; display:flex; align-items:center; gap:10px;">
                  <i data-lucide="list-tree" style="color:var(--hw-cyan);"></i>
                  Pin Connections & Wiring Mapping
                </h2>
                <table class="hw-pins-table">
                  <thead>
                    <tr>
                      <th>Module Pin</th>
                      <th>Pin Type</th>
                      <th>Arduino Hookup</th>
                      <th>ESP32 Hookup</th>
                      <th>Wiring Guidance & Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${component.pinConnections.map(pin => `
                      <tr>
                        <td><span class="hw-pin-tag">${pin.pin}</span></td>
                        <td style="color:var(--hw-text-muted); font-size:0.85rem;">${pin.type}</td>
                        <td style="font-weight:700; color:#ffffff;">${pin.arduino || '—'}</td>
                        <td style="font-weight:700; color:var(--hw-cyan);">${pin.esp32 || '—'}</td>
                        <td style="color:#cbd5e1; font-size:0.85rem;">${pin.notes || ''}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <!-- Example Programming Code with Copy -->
            ${component.exampleCode ? `
              <div>
                <h2 style="font-size:1.4rem; color:#ffffff; margin:0 0 16px 0; display:flex; align-items:center; gap:10px;">
                  <i data-lucide="code-2" style="color:var(--hw-cyan);"></i>
                  Example Firmware Implementation Code
                </h2>
                <div class="hw-code-box">
                  <div class="hw-code-header">
                    <span>Arduino C++ / ESP-IDF Quickstart Snippet</span>
                    <button id="hw-copy-code-btn" class="hw-btn hw-btn-glass" style="padding:4px 10px; font-size:0.75rem;">
                      <i data-lucide="copy" style="width:12px; height:12px;"></i> Copy Code
                    </button>
                  </div>
                  <pre class="hw-code-pre"><code>${component.exampleCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                </div>
              </div>
            ` : ''}

            <!-- Companion / Compatible Components Carousel -->
            ${companionComponents.length > 0 ? `
              <div style="margin-top:20px;">
                <h2 style="font-size:1.4rem; color:#ffffff; margin:0 0 16px 0; display:flex; align-items:center; gap:10px;">
                  <i data-lucide="sparkles" style="color:var(--hw-cyan);"></i>
                  Companion Components in ${component.category}
                </h2>
                <div class="hw-components-grid">
                  ${companionComponents.map(rel => `
                    <div class="hw-card" onclick="location.hash='#/components/${rel.id}'">
                      <div class="hw-card-img-wrap">
                        <img src="${rel.image}" alt="${rel.name}" class="hw-card-img" />
                      </div>
                      <div class="hw-card-body">
                        <div class="hw-card-cat">${rel.category}</div>
                        <h4 class="hw-card-title">${rel.name}</h4>
                        <div class="hw-card-price-row">
                          <span class="hw-price-current">₹${rel.price.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Attach click events
    const copyBtn = container.querySelector('#hw-copy-code-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(component.exampleCode);
        copyBtn.innerHTML = `<i data-lucide="check" style="width:12px; height:12px;"></i> Copied!`;
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          copyBtn.innerHTML = `<i data-lucide="copy" style="width:12px; height:12px;"></i> Copy Code`;
          if (window.lucide) window.lucide.createIcons();
        }, 2000);
      };
    }

    const addBomBtn = container.querySelector('#hw-detail-add-bom-btn');
    if (addBomBtn) {
      addBomBtn.onclick = () => {
        const bom = JSON.parse(localStorage.getItem('hw_project_bom') || '[]');
        const existing = bom.find(i => i.id === component.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          bom.push({
            id: component.id,
            name: component.name,
            model: component.model,
            category: component.category,
            price: component.price,
            image: component.image,
            quantity: 1
          });
        }
        localStorage.setItem('hw_project_bom', JSON.stringify(bom));
        if (window.showToast) {
          window.showToast(`Added "${component.name}" to Project BOM!`, 'success');
        } else {
          alert(`Added "${component.name}" to your Project Budget!`);
        }
      };
    }

    // Admin Edit
    const adminEditBtn = container.querySelector('#hw-detail-admin-edit');
    if (adminEditBtn) {
      adminEditBtn.onclick = () => {
        openAdminComponentModal(component, (updated) => {
          if (updated) {
            component = updated;
            render();
          } else {
            router.navigate('/components');
          }
        });
      };
    }

    // Smooth View Switching without Full Page Reload
    function switchMainImage(newSrc, labelText) {
      activeImage = newSrc;
      const mainImg = container.querySelector('#hw-main-display-img');
      const labelSpan = container.querySelector('#hw-gallery-active-label span');

      if (labelSpan && labelText) {
        labelSpan.textContent = labelText;
      } else if (labelSpan) {
        const v = availableViews.find(item => item.src === newSrc);
        if (v) labelSpan.textContent = v.label;
      }

      if (mainImg) {
        mainImg.style.opacity = '0.3';
        mainImg.src = newSrc;
        mainImg.onload = () => {
          mainImg.style.opacity = '1';
        };
      }

      // Update active state on angle tab buttons
      container.querySelectorAll('.hw-angle-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view-src') === newSrc);
      });

      // Update active state on thumbnail cards
      container.querySelectorAll('.hw-thumb-card').forEach(card => {
        card.classList.toggle('active', card.getAttribute('data-thumb-src') === newSrc);
      });
    }

    // Attach click to Angle Tab buttons
    container.querySelectorAll('.hw-angle-tab-btn').forEach(btn => {
      btn.onclick = () => {
        const src = btn.getAttribute('data-view-src');
        const name = btn.getAttribute('data-view-name');
        switchMainImage(src, name);
      };
    });

    // Attach click to Thumbnail cards
    container.querySelectorAll('.hw-thumb-card').forEach(card => {
      card.onclick = () => {
        const src = card.getAttribute('data-thumb-src');
        const name = card.getAttribute('data-thumb-name');
        switchMainImage(src, name);
      };
    });

    // Pinout quick-open button
    const openPinoutBtn = container.querySelector('#hw-btn-open-pinout');
    if (openPinoutBtn) {
      openPinoutBtn.onclick = () => {
        switchMainImage(pinoutImg, 'Pinout Blueprint');
        window.openImageZoomModal(pinoutImg, `${component.name} - Technical Pinout Schematic`, availableViews);
      };
    }

    // Interactive Mouse Lens Magnifier on Main Image
    const zoomWrap = container.querySelector('#hw-zoom-wrap');
    const mainImg = container.querySelector('#hw-main-display-img');
    if (zoomWrap && mainImg) {
      zoomWrap.onmousemove = (e) => {
        const rect = zoomWrap.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        mainImg.style.transformOrigin = `${x}% ${y}%`;
        mainImg.style.transform = 'scale(2.2)';
      };

      zoomWrap.onmouseleave = () => {
        mainImg.style.transformOrigin = 'center center';
        mainImg.style.transform = 'scale(1)';
      };

      zoomWrap.onclick = () => {
        window.openImageZoomModal(activeImage, component.name, availableViews);
      };
    }
  }

  window.openImageZoomModal = (imgSrc, title, views = availableViews) => {
    const existing = document.getElementById('hw-zoom-modal');
    if (existing) existing.remove();

    let currentZoomSrc = imgSrc;
    let zoomLevel = 1.0;

    const m = document.createElement('div');
    m.id = 'hw-zoom-modal';
    m.className = 'hw-modal-backdrop';
    m.innerHTML = `
      <div style="background:#070b14; border:1px solid rgba(0,242,254,0.3); box-shadow:0 24px 64px rgba(0,0,0,0.85); border-radius:18px; padding:20px; max-width:92vw; width:980px; max-height:92vh; display:flex; flex-direction:column; position:relative; overflow:hidden;">
        
        <!-- Modal Top Bar -->
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
          <div>
            <div style="font-size:0.75rem; color:var(--hw-cyan); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">CIRCUITKART HD VISUAL LAB</div>
            <h3 style="margin:2px 0 0 0; color:#ffffff; font-size:1.15rem;">${title}</h3>
          </div>

          <!-- Controls: Zoom in/out, Download, Close -->
          <div style="display:flex; align-items:center; gap:8px;">
            <button id="hw-zoom-out-btn" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:8px; padding:6px 10px; cursor:pointer; font-weight:bold;" title="Zoom Out">−</button>
            <span id="hw-zoom-level-text" style="color:var(--hw-cyan); font-family:monospace; font-size:0.85rem; min-width:48px; text-align:center;">100%</span>
            <button id="hw-zoom-in-btn" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:8px; padding:6px 10px; cursor:pointer; font-weight:bold;" title="Zoom In">+</button>
            
            <a id="hw-zoom-download-btn" href="${currentZoomSrc}" download="${component.id}-schematic.svg" style="background:rgba(0,242,254,0.15); border:1px solid var(--hw-cyan); color:var(--hw-cyan); border-radius:8px; padding:6px 12px; font-size:0.8rem; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:5px;" title="Download Real SVG">
              ⬇ Download SVG
            </a>

            <button onclick="document.getElementById('hw-zoom-modal').remove()" style="background:#ef4444; color:#fff; border:none; border-radius:8px; padding:6px 12px; font-weight:bold; cursor:pointer; font-size:0.85rem;">✕ Close</button>
          </div>
        </div>

        <!-- In-Modal View Switcher Tabs -->
        <div style="display:flex; gap:8px; margin-bottom:12px; overflow-x:auto;">
          ${views.map(v => `
            <button
              class="hw-modal-angle-btn ${v.src === currentZoomSrc ? 'active' : ''}"
              data-modal-src="${v.src}"
              data-modal-name="${v.label}"
              style="padding:6px 12px; border-radius:6px; font-size:0.78rem; font-weight:600; cursor:pointer; background:${v.src === currentZoomSrc ? 'rgba(0,242,254,0.2)' : 'rgba(255,255,255,0.05)'}; color:${v.src === currentZoomSrc ? 'var(--hw-cyan)' : '#cbd5e1'}; border:1px solid ${v.src === currentZoomSrc ? 'var(--hw-cyan)' : 'rgba(255,255,255,0.1)'};"
            >
              ${v.label}
            </button>
          `).join('')}
        </div>

        <!-- Scrollable High-Res Image Display Container -->
        <div style="background:#ffffff; border-radius:12px; flex:1; min-height:460px; max-height:70vh; display:flex; align-items:center; justify-content:center; overflow:auto; padding:20px; position:relative;">
          <img
            id="hw-zoom-modal-img"
            src="${currentZoomSrc}"
            alt="${title}"
            style="max-width:100%; max-height:100%; object-fit:contain; transition:transform 0.2s ease; transform:scale(${zoomLevel});"
          />
        </div>
      </div>
    `;

    m.onclick = (e) => { if (e.target === m) m.remove(); };

    // In-modal angle switcher
    m.querySelectorAll('.hw-modal-angle-btn').forEach(btn => {
      btn.onclick = () => {
        currentZoomSrc = btn.getAttribute('data-modal-src');
        const imgEl = m.querySelector('#hw-zoom-modal-img');
        const dlBtn = m.querySelector('#hw-zoom-download-btn');
        if (imgEl) imgEl.src = currentZoomSrc;
        if (dlBtn) {
          dlBtn.href = currentZoomSrc;
          dlBtn.download = `${component.id}-${btn.getAttribute('data-modal-name').toLowerCase().replace(/\s+/g, '-')}.svg`;
        }
        m.querySelectorAll('.hw-modal-angle-btn').forEach(b => {
          const isActive = b.getAttribute('data-modal-src') === currentZoomSrc;
          b.style.background = isActive ? 'rgba(0,242,254,0.2)' : 'rgba(255,255,255,0.05)';
          b.style.color = isActive ? 'var(--hw-cyan)' : '#cbd5e1';
          b.style.borderColor = isActive ? 'var(--hw-cyan)' : 'rgba(255,255,255,0.1)';
        });
      };
    });

    // In-modal Zoom buttons
    const zoomInBtn = m.querySelector('#hw-zoom-in-btn');
    const zoomOutBtn = m.querySelector('#hw-zoom-out-btn');
    const zoomText = m.querySelector('#hw-zoom-level-text');
    const modalImg = m.querySelector('#hw-zoom-modal-img');

    if (zoomInBtn) {
      zoomInBtn.onclick = () => {
        if (zoomLevel < 3.5) zoomLevel += 0.25;
        modalImg.style.transform = `scale(${zoomLevel})`;
        zoomText.textContent = `${Math.round(zoomLevel * 100)}%`;
      };
    }

    if (zoomOutBtn) {
      zoomOutBtn.onclick = () => {
        if (zoomLevel > 0.5) zoomLevel -= 0.25;
        modalImg.style.transform = `scale(${zoomLevel})`;
        zoomText.textContent = `${Math.round(zoomLevel * 100)}%`;
      };
    }

    document.body.appendChild(m);
  };

  render();
}

