// Project Budget Builder (Bill of Materials - BOM Tool)
export function openProjectBudgetBuilderModal(bomItems, onUpdateItem, onRemoveItem, onClearBom) {
  const existing = document.getElementById('hw-bom-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'hw-bom-modal';
  modal.className = 'hw-modal-backdrop';

  function calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gst = Math.round(subtotal * 0.18); // 18% standard Indian GST on electronics
    const total = subtotal + gst;
    return { subtotal, gst, total };
  }

  function render() {
    const { subtotal, gst, total } = calculateTotals(bomItems);

    modal.innerHTML = `
      <div class="hw-modal-content" style="max-width: 960px;">
        <div class="hw-modal-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg, var(--hw-purple), #6366f1); display:flex; align-items:center; justify-content:center; color:#fff;">
              <i data-lucide="calculator"></i>
            </div>
            <div>
              <h3 style="margin:0; font-size:1.3rem; color:#ffffff;">Project Budget Builder (BOM)</h3>
              <p style="margin:2px 0 0 0; font-size:0.8rem; color:var(--hw-text-muted);">
                Calculate complete electronic project hardware costs & export bills of materials
              </p>
            </div>
          </div>
          <button id="hw-bom-close-btn" class="hw-btn-glass" style="padding:6px 12px; border-radius:8px;">
            <i data-lucide="x"></i>
          </button>
        </div>

        <div class="hw-modal-body">
          <!-- Project Info Field -->
          <div style="display:flex; gap:16px; margin-bottom:20px; flex-wrap:wrap;">
            <div style="flex:2; min-width:240px;">
              <label style="display:block; font-size:0.78rem; text-transform:uppercase; color:var(--hw-text-muted); font-weight:700; margin-bottom:6px;">
                Project Title / Client Name
              </label>
              <input
                id="hw-bom-project-title"
                type="text"
                class="hw-search-input"
                style="padding:10px 14px; font-size:0.9rem;"
                placeholder="e.g. Smart IoT Weather Station & Irrigation Controller"
                value="${localStorage.getItem('hw_bom_project_title') || 'Smart Embedded IoT Project'}"
              />
            </div>
            <div style="flex:1; min-width:180px;">
              <label style="display:block; font-size:0.78rem; text-transform:uppercase; color:var(--hw-text-muted); font-weight:700; margin-bottom:6px;">
                Currency & Taxes
              </label>
              <div style="padding:10px 14px; background:rgba(7,11,20,0.8); border:1px solid rgba(255,255,255,0.1); border-radius:10px; font-size:0.88rem; color:var(--hw-cyan); font-weight:600;">
                INR (₹) + 18% GST Breakdown
              </div>
            </div>
          </div>

          <!-- Items Table -->
          ${bomItems.length === 0 ? `
            <div style="text-align:center; padding:48px 20px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.12); border-radius:14px;">
              <i data-lucide="package-open" style="width:48px; height:48px; color:var(--hw-cyan); margin-bottom:12px; opacity:0.6;"></i>
              <h4 style="margin:0 0 8px 0; color:#ffffff;">Your Project Bill of Materials is Empty</h4>
              <p style="margin:0; font-size:0.88rem; color:var(--hw-text-muted); max-width:420px; margin:0 auto 16px;">
                Click "Add to Project" on any component card to add it to your project hardware budget.
              </p>
            </div>
          ` : `
            <div style="overflow-x:auto; margin-bottom:24px;">
              <table class="hw-bom-table">
                <thead>
                  <tr>
                    <th style="width:60px;">Image</th>
                    <th>Component & Model</th>
                    <th style="width:130px;">Unit Price</th>
                    <th style="width:130px; text-align:center;">Quantity</th>
                    <th style="width:130px; text-align:right;">Subtotal</th>
                    <th style="width:50px;"></th>
                  </tr>
                </thead>
                <tbody>
                  ${bomItems.map((item, idx) => `
                    <tr>
                      <td>
                        <div style="width:44px; height:44px; background:#ffffff; border-radius:8px; padding:3px; display:flex; align-items:center; justify-content:center;">
                          <img src="${item.image}" alt="${item.name}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='/images/components/${item.id}-front.svg'" />
                        </div>
                      </td>
                      <td>
                        <div style="font-weight:700; color:#ffffff; font-size:0.92rem;">${item.name}</div>
                        <div style="font-size:0.75rem; color:var(--hw-text-muted); font-family:monospace;">${item.model || item.id}</div>
                      </td>
                      <td style="font-weight:600; color:#e2e8f0;">
                        ₹${item.price.toLocaleString('en-IN')}
                      </td>
                      <td style="text-align:center;">
                        <div class="hw-qty-ctrl">
                          <button class="hw-qty-btn" data-action="dec" data-id="${item.id}">−</button>
                          <span class="hw-qty-val">${item.quantity}</span>
                          <button class="hw-qty-btn" data-action="inc" data-id="${item.id}">+</button>
                        </div>
                      </td>
                      <td style="text-align:right; font-weight:800; color:var(--hw-cyan); font-size:1rem;">
                        ₹${(item.price * item.quantity).toLocaleString('en-IN')}
                      </td>
                      <td style="text-align:center;">
                        <button data-action="del" data-id="${item.id}" title="Remove item" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:6px;">
                          <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Cost Summary Box -->
            <div style="background:rgba(7,11,20,0.85); border:1px solid var(--hw-border); border-radius:14px; padding:18px 22px; display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; justify-content:space-between; font-size:0.9rem; color:var(--hw-text-muted);">
                <span>Component Subtotal (${bomItems.reduce((acc, i) => acc + i.quantity, 0)} units):</span>
                <span style="font-weight:700; color:#ffffff;">₹${subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.9rem; color:var(--hw-text-muted);">
                <span>Estimated Indian GST (18% on Electronics):</span>
                <span style="font-weight:600; color:#cbd5e1;">₹${gst.toLocaleString('en-IN')}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:1.25rem; font-weight:800; color:#ffffff; padding-top:8px; border-top:1px solid rgba(255,255,255,0.1); margin-top:4px;">
                <span>Total Project Estimated Cost:</span>
                <span style="color:var(--hw-cyan);">₹${total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          `}
        </div>

        <div class="hw-modal-footer">
          <div style="display:flex; gap:10px;">
            <button id="hw-bom-clear-btn" class="hw-btn-glass" style="color:#ef4444; border-color:rgba(239,68,68,0.3);" ${bomItems.length === 0 ? 'disabled' : ''}>
              <i data-lucide="trash"></i>
              Clear BOM
            </button>
          </div>
          
          <div style="display:flex; gap:12px;">
            <button id="hw-bom-export-csv" class="hw-btn hw-btn-glass" ${bomItems.length === 0 ? 'disabled' : ''}>
              <i data-lucide="file-spreadsheet" style="color:#10b981;"></i>
              Export Excel / CSV
            </button>
            <button id="hw-bom-print-pdf" class="hw-btn hw-btn-primary" ${bomItems.length === 0 ? 'disabled' : ''}>
              <i data-lucide="printer"></i>
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Attach event listeners
    const titleInput = modal.querySelector('#hw-bom-project-title');
    if (titleInput) {
      titleInput.oninput = (e) => {
        localStorage.setItem('hw_bom_project_title', e.target.value);
      };
    }

    const close = () => modal.remove();
    modal.querySelector('#hw-bom-close-btn').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };

    // Quantity buttons
    modal.querySelectorAll('[data-action="inc"]').forEach(btn => {
      btn.onclick = () => {
        const item = bomItems.find(i => i.id === btn.dataset.id);
        if (item) {
          item.quantity += 1;
          if (onUpdateItem) onUpdateItem(item.id, item.quantity);
          render();
        }
      };
    });

    modal.querySelectorAll('[data-action="dec"]').forEach(btn => {
      btn.onclick = () => {
        const item = bomItems.find(i => i.id === btn.dataset.id);
        if (item) {
          if (item.quantity > 1) {
            item.quantity -= 1;
            if (onUpdateItem) onUpdateItem(item.id, item.quantity);
          } else {
            if (onRemoveItem) onRemoveItem(item.id);
            const idx = bomItems.findIndex(i => i.id === item.id);
            if (idx > -1) bomItems.splice(idx, 1);
          }
          render();
        }
      };
    });

    modal.querySelectorAll('[data-action="del"]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        if (onRemoveItem) onRemoveItem(id);
        const idx = bomItems.findIndex(i => i.id === id);
        if (idx > -1) bomItems.splice(idx, 1);
        render();
      };
    });

    // Clear
    const clearBtn = modal.querySelector('#hw-bom-clear-btn');
    if (clearBtn) {
      clearBtn.onclick = () => {
        if (confirm('Are you sure you want to clear all components from this BOM?')) {
          if (onClearBom) onClearBom();
          bomItems.length = 0;
          render();
        }
      };
    }

    // CSV / Excel Export
    const csvBtn = modal.querySelector('#hw-bom-export-csv');
    if (csvBtn) {
      csvBtn.onclick = () => {
        const title = (modal.querySelector('#hw-bom-project-title')?.value || 'Project_BOM').replace(/[^a-zA-Z0-9_-]/g, '_');
        const rows = [
          ['Sl No', 'Component Name', 'Model / Part No', 'Category', 'Unit Price (INR)', 'Quantity', 'Line Total (INR)']
        ];

        bomItems.forEach((item, index) => {
          rows.push([
            index + 1,
            `"${item.name.replace(/"/g, '""')}"`,
            `"${(item.model || '').replace(/"/g, '""')}"`,
            `"${(item.category || '').replace(/"/g, '""')}"`,
            item.price,
            item.quantity,
            item.price * item.quantity
          ]);
        });

        const { subtotal, gst, total } = calculateTotals(bomItems);
        rows.push([]);
        rows.push(['', '', '', 'Subtotal', '', '', subtotal]);
        rows.push(['', '', '', 'GST (18%)', '', '', gst]);
        rows.push(['', '', '', 'Grand Total (INR)', '', '', total]);

        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${title}_CircuitKart_BOM.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      };
    }

    // Print / PDF View
    const printBtn = modal.querySelector('#hw-bom-print-pdf');
    if (printBtn) {
      printBtn.onclick = () => {
        const projectTitle = modal.querySelector('#hw-bom-project-title')?.value || 'Hardware Project Bill of Materials';
        const { subtotal, gst, total } = calculateTotals(bomItems);
        const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

        const printWin = window.open('', '_blank', 'width=900,height=700');
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${projectTitle} - Bill of Materials</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00f2fe; padding-bottom: 20px; margin-bottom: 24px; }
                .logo { font-size: 24px; font-weight: 800; color: #0f172a; }
                .logo span { color: #00b4d8; }
                h1 { margin: 0 0 6px 0; font-size: 20px; color: #0f172a; }
                .meta { font-size: 13px; color: #64748b; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #f8fafc; padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
                td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
                .total-box { margin-top: 30px; margin-left: auto; width: 320px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #f8fafc; }
                .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                .grand-total { font-weight: 800; font-size: 18px; color: #0284c7; border-top: 1px solid #cbd5e1; padding-top: 10px; margin-top: 8px; }
                @media print { button { display: none; } }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <div class="logo">Circuit<span>Kart</span></div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Hardware Components Store & Explorer</div>
                </div>
                <div style="text-align: right;">
                  <h1>Bill of Materials (BOM)</h1>
                  <div class="meta">Date: ${dateStr}</div>
                  <div class="meta">Status: Estimated Pricing (INR ₹)</div>
                </div>
              </div>

              <div>
                <h2 style="font-size: 16px; margin: 0 0 4px 0;">Project: ${projectTitle}</h2>
                <div style="font-size: 13px; color: #64748b;">Total Line Items: ${bomItems.length}</div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Component Name</th>
                    <th>Model</th>
                    <th>Category</th>
                    <th style="text-align: right;">Unit Price (₹)</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Line Subtotal (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${bomItems.map((item, idx) => `
                    <tr>
                      <td>${idx + 1}</td>
                      <td><b>${item.name}</b></td>
                      <td><code>${item.model || '—'}</code></td>
                      <td>${item.category}</td>
                      <td style="text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="total-box">
                <div class="total-row">
                  <span>Components Subtotal:</span>
                  <span>₹${subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row">
                  <span>GST (18% on Electronics):</span>
                  <span>₹${gst.toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row grand-total">
                  <span>Total Project Cost:</span>
                  <span>₹${total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style="margin-top: 40px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 24px; background: #0284c7; color: #fff; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">
                  Print / Save as PDF
                </button>
              </div>
            </body>
          </html>
        `);
        printWin.document.close();
      };
    }
  }

  document.body.appendChild(modal);
  render();
}
