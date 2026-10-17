// Component Comparison Modal (Up to 4 components side-by-side)
import { router } from '../router.js';

export function openComponentComparisonModal(components, onRemove, onClear) {
  const existing = document.getElementById('hw-compare-modal');
  if (existing) existing.remove();

  if (!components || components.length === 0) {
    alert('Please select at least one component to compare.');
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'hw-compare-modal';
  modal.className = 'hw-modal-backdrop';

  // Gather all unique spec keys across compared components
  const allSpecKeys = new Set();
  components.forEach(c => {
    if (c.keySpecs) {
      Object.keys(c.keySpecs).forEach(k => allSpecKeys.add(k));
    }
  });
  const specKeysList = Array.from(allSpecKeys);

  modal.innerHTML = `
    <div class="hw-modal-content" style="max-width: 1100px;">
      <div class="hw-modal-header">
        <div style="display:flex; align-items:center; gap:12px;">
          <i data-lucide="scale" style="color:var(--hw-cyan);"></i>
          <h3 style="margin:0; font-size:1.3rem; color:#ffffff;">Component Side-by-Side Comparison</h3>
          <span style="background:rgba(0,242,254,0.15); color:var(--hw-cyan); font-size:0.75rem; padding:2px 8px; border-radius:999px; font-weight:700;">
            ${components.length} / 4 Components
          </span>
        </div>
        <button id="hw-compare-close-btn" class="hw-btn-glass" style="padding:6px 12px; border-radius:8px;">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="hw-modal-body" style="padding:0;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; min-width:650px;">
            <thead>
              <tr style="background:rgba(255,255,255,0.02); border-bottom:1px solid rgba(255,255,255,0.08);">
                <th style="padding:16px 20px; width:200px; color:var(--hw-text-muted); font-size:0.8rem; text-transform:uppercase; text-align:left;">
                  Feature
                </th>
                ${components.map(c => `
                  <th style="padding:16px 20px; min-width:200px; text-align:center; vertical-align:top; border-left:1px solid rgba(255,255,255,0.06);">
                    <div style="position:relative; width:120px; height:120px; background:#ffffff; border-radius:12px; margin:0 auto 12px; padding:10px; display:flex; align-items:center; justify-content:center;">
                      <img src="${c.image}" alt="${c.name}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='/images/components/${c.id}-front.svg'" />
                      <button data-remove-id="${c.id}" title="Remove" style="position:absolute; top:-6px; right:-6px; background:#ef4444; color:#fff; border:none; border-radius:50%; width:22px; height:22px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;">
                        ✕
                      </button>
                    </div>
                    <div style="font-size:0.95rem; font-weight:700; color:#ffffff; margin-bottom:4px; line-height:1.3;">${c.name}</div>
                    <div style="font-size:0.75rem; color:var(--hw-text-muted); font-family:monospace; margin-bottom:8px;">${c.model}</div>
                    <div style="font-size:1.25rem; font-weight:800; color:var(--hw-cyan);">₹${c.price.toLocaleString('en-IN')}</div>
                    <div style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
                      <a href="#/components/${c.id}" class="hw-btn hw-btn-glass" style="font-size:0.75rem; padding:6px 10px; justify-content:center;">
                        View Full Specs
                      </a>
                    </div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              <!-- Category -->
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:12px 20px; font-weight:600; color:var(--hw-text-muted); font-size:0.85rem; background:rgba(255,255,255,0.01);">Category</td>
                ${components.map(c => `
                  <td style="padding:12px 20px; text-align:center; font-size:0.85rem; color:#cbd5e1; border-left:1px solid rgba(255,255,255,0.06);">
                    ${c.category}
                  </td>
                `).join('')}
              </tr>

              <!-- Voltage -->
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:12px 20px; font-weight:600; color:var(--hw-text-muted); font-size:0.85rem; background:rgba(255,255,255,0.01);">Operating Voltage</td>
                ${components.map(c => `
                  <td style="padding:12px 20px; text-align:center; font-size:0.88rem; font-weight:700; color:var(--hw-cyan); border-left:1px solid rgba(255,255,255,0.06);">
                    ${c.voltage || 'N/A'}
                  </td>
                `).join('')}
              </tr>

              <!-- Current -->
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:12px 20px; font-weight:600; color:var(--hw-text-muted); font-size:0.85rem; background:rgba(255,255,255,0.01);">Operating Current</td>
                ${components.map(c => `
                  <td style="padding:12px 20px; text-align:center; font-size:0.85rem; color:#cbd5e1; border-left:1px solid rgba(255,255,255,0.06);">
                    ${c.current || 'N/A'}
                  </td>
                `).join('')}
              </tr>

              <!-- Interface -->
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:12px 20px; font-weight:600; color:var(--hw-text-muted); font-size:0.85rem; background:rgba(255,255,255,0.01);">Interface / Protocol</td>
                ${components.map(c => `
                  <td style="padding:12px 20px; text-align:center; font-size:0.85rem; color:#cbd5e1; border-left:1px solid rgba(255,255,255,0.06);">
                    ${c.interface || 'Standard I/O'}
                  </td>
                `).join('')}
              </tr>

              <!-- Stock Availability -->
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:12px 20px; font-weight:600; color:var(--hw-text-muted); font-size:0.85rem; background:rgba(255,255,255,0.01);">Stock Availability</td>
                ${components.map(c => `
                  <td style="padding:12px 20px; text-align:center; font-size:0.85rem; font-weight:700; color:${c.inStock ? 'var(--hw-accent-green)' : '#ef4444'}; border-left:1px solid rgba(255,255,255,0.06);">
                    ${c.inStock ? `✓ In Stock (${c.stockCount || 20}+ units)` : '✗ Out of Stock'}
                  </td>
                `).join('')}
              </tr>

              <!-- Detailed Key Specs -->
              ${specKeysList.slice(0, 6).map(specKey => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                  <td style="padding:12px 20px; font-weight:600; color:var(--hw-text-muted); font-size:0.85rem; background:rgba(255,255,255,0.01);">${specKey}</td>
                  ${components.map(c => `
                    <td style="padding:12px 20px; text-align:center; font-size:0.85rem; color:#f1f5f9; border-left:1px solid rgba(255,255,255,0.06);">
                      ${(c.keySpecs && c.keySpecs[specKey]) || '—'}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="hw-modal-footer">
        <button id="hw-compare-clear-all" class="hw-btn-glass" style="color:#ef4444; border-color:rgba(239,68,68,0.3);">
          Clear Comparison
        </button>
        <button id="hw-compare-close-bottom" class="hw-btn hw-btn-primary">
          Done
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  // Close handlers
  const close = () => modal.remove();
  modal.querySelector('#hw-compare-close-btn').onclick = close;
  modal.querySelector('#hw-compare-close-bottom').onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };

  // Remove individual component
  modal.querySelectorAll('[data-remove-id]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.dataset.removeId;
      if (onRemove) onRemove(id);
      const remaining = components.filter(c => c.id !== id);
      if (remaining.length > 0) {
        openComponentComparisonModal(remaining, onRemove, onClear);
      } else {
        close();
      }
    };
  });

  // Clear all
  modal.querySelector('#hw-compare-clear-all').onclick = () => {
    if (onClear) onClear();
    close();
  };
}
