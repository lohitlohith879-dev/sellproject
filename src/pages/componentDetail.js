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

  // Active gallery image
  let activeImage = component.image;
  const galleryImages = [component.image, ...(component.gallery || [])].filter((v, i, a) => a.indexOf(v) === i);

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
            
            <!-- Left: High-Resolution Gallery with Zoom -->
            <div class="hw-gallery-box">
              <div id="hw-zoom-wrap" class="hw-main-img-wrap" title="Click to zoom image">
                <img
                  id="hw-main-display-img"
                  src="${activeImage}"
                  alt="${component.name}"
                  class="hw-main-img"
                  onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'"
                />
                <div class="hw-zoom-hint">
                  <i data-lucide="zoom-in" style="width:14px; height:14px;"></i>
                  <span>Hover / Click to Zoom</span>
                </div>
              </div>

              <!-- Thumbnails -->
              <div class="hw-thumb-strip">
                ${galleryImages.map((img, idx) => `
                  <img
                    src="${img}"
                    alt="Thumbnail ${idx + 1}"
                    class="hw-thumb-item ${img === activeImage ? 'active' : ''}"
                    onclick="window.selectHwDetailImg('${img}')"
                  />
                `).join('')}
              </div>

              <!-- Pinout Schematic Preview -->
              ${component.pinoutDiagram ? `
                <div style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.08); padding-top:14px;">
                  <div style="font-size:0.8rem; font-weight:700; color:var(--hw-text-muted); text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                    <i data-lucide="circuit-board" style="color:var(--hw-cyan); width:14px; height:14px;"></i>
                    Pinout Diagram Preview
                  </div>
                  <div style="background:#ffffff; border-radius:10px; padding:12px; height:160px; display:flex; align-items:center; justify-content:center; cursor:zoom-in;" onclick="window.zoomPinout('${component.pinoutDiagram}')">
                    <img src="${component.pinoutDiagram}" alt="Pinout Diagram" style="max-width:100%; max-height:100%; object-fit:contain;" />
                  </div>
                </div>
              ` : ''}
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

    // Zoom Image click modal
    const zoomWrap = container.querySelector('#hw-zoom-wrap');
    if (zoomWrap) {
      zoomWrap.onclick = () => {
        window.openImageZoomModal(activeImage, component.name);
      };
    }
  }

  window.selectHwDetailImg = (img) => {
    activeImage = img;
    render();
  };

  window.zoomPinout = (img) => {
    window.openImageZoomModal(img, `${component.name} Pinout Diagram`);
  };

  window.openImageZoomModal = (imgSrc, title) => {
    const existing = document.getElementById('hw-zoom-modal');
    if (existing) existing.remove();

    const m = document.createElement('div');
    m.id = 'hw-zoom-modal';
    m.className = 'hw-modal-backdrop';
    m.innerHTML = `
      <div style="background:#ffffff; border-radius:16px; padding:24px; max-width:90vw; max-height:90vh; position:relative; display:flex; flex-direction:column; align-items:center;">
        <button onclick="this.parentElement.parentElement.remove()" style="position:absolute; top:12px; right:12px; background:#070b14; color:#fff; border:none; border-radius:50%; width:32px; height:32px; font-weight:bold; cursor:pointer;">✕</button>
        <h4 style="margin:0 0 16px 0; color:#0f172a;">${title}</h4>
        <img src="${imgSrc}" alt="${title}" style="max-width:80vw; max-height:75vh; object-fit:contain;" />
      </div>
    `;
    m.onclick = (e) => { if (e.target === m) m.remove(); };
    document.body.appendChild(m);
  };

  render();
}
