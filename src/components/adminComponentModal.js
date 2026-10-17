// Admin Component Management Modal (Add / Edit Component)
import { store } from '../store.js';

const CATEGORIES = [
  "Arduino and Microcontrollers",
  "ESP32, ESP8266 and IoT Boards",
  "Raspberry Pi and Single-Board Computers",
  "Sensors and Modules",
  "Displays, LCD and OLED",
  "Motors, Servo and Actuators",
  "Wireless Communication, GPS and GSM",
  "Power Supplies, Batteries and DC-DC Converters",
  "Relays, Motor Drivers and Controllers",
  "Electronic Components and ICs",
  "RFID, NFC and Biometric Modules",
  "Robotics Components",
  "Cameras and Audio Modules",
  "Transformers and Electrical Equipment",
  "Embedded Programming and Debugging Tools",
  "Breadboards, PCBs, Wires and Connectors",
  "IoT Project Kits",
  "Testing Equipment and Tools"
];

export function openAdminComponentModal(component = null, onSaved = null) {
  const existing = document.getElementById('hw-admin-modal');
  if (existing) existing.remove();

  const isEdit = Boolean(component && component.id);
  const modal = document.createElement('div');
  modal.id = 'hw-admin-modal';
  modal.className = 'hw-modal-backdrop';

  modal.innerHTML = `
    <div class="hw-modal-content" style="max-width: 780px;">
      <div class="hw-modal-header">
        <div style="display:flex; align-items:center; gap:12px;">
          <i data-lucide="shield" style="color:var(--hw-cyan);"></i>
          <h3 style="margin:0; font-size:1.3rem; color:#ffffff;">
            ${isEdit ? 'Edit Component: ' + component.name : 'Add New Hardware Component'}
          </h3>
        </div>
        <button id="hw-admin-close-btn" class="hw-btn-glass" style="padding:6px 12px; border-radius:8px;">
          <i data-lucide="x"></i>
        </button>
      </div>

      <form id="hw-admin-form" class="hw-modal-body" style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:14px;">
          <div>
            <label style="display:block; font-size:0.75rem; color:var(--hw-text-muted); font-weight:700; text-transform:uppercase; margin-bottom:4px;">
              Component Name *
            </label>
            <input type="text" name="name" required class="hw-search-input" style="padding:10px 14px;" value="${component?.name || ''}" placeholder="e.g. ESP32-CAM AI-Thinker Module" />
          </div>
          <div>
            <label style="display:block; font-size:0.75rem; color:var(--hw-text-muted); font-weight:700; text-transform:uppercase; margin-bottom:4px;">
              Model / Part No
            </label>
            <input type="text" name="model" class="hw-search-input" style="padding:10px 14px;" value="${component?.model || ''}" placeholder="e.g. OV2640-CAM" />
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
          <div>
            <label style="display:block; font-size:0.75rem; color:var(--hw-text-muted); font-weight:700; text-transform:uppercase; margin-bottom:4px;">
              Category *
            </label>
            <select name="category" required class="hw-select" style="width:100%; padding:10px 14px;">
              ${CATEGORIES.map(cat => `
                <option value="${cat}" ${component?.category === cat ? 'selected' : ''}>${cat}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label style="display:block; font-size:0.75rem; color:var(--hw-text-muted); font-weight:700; text-transform:uppercase; margin-bottom:4px;">
              Price Status
            </label>
            <select name="priceType" class="hw-select" style="width:100%; padding:10px 14px;">
              <option value="Verified" ${component?.priceType === 'Verified' ? 'selected' : ''}>Verified Live Price</option>
              <option value="Estimated" ${component?.priceType === 'Estimated' ? 'selected' : ''}>Estimated Price</option>
            </select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:14px;">
          <div>
            <label style="display:block; font-size:0.75rem; color:var(--hw-text-muted); font-weight:700; text-transform:uppercase; margin-bottom:4px;">
              Selling Price (₹) *
            </label>
            <input type="number" name="price" required min="1" class="hw-search-input" style="padding:10px 14px;" value="${component?.price || ''}" placeholder="299" />
          </div>
          <div>
            <label style="display:block; font-size:0.75rem; color:var(--hw-text-muted); font-weight:700; text-transform:uppercase; margin-bottom:4px;">
              Original MRP (₹)
            </label>
            <input type="number" name="mrp" min="1" class="hw-search-input" style="padding:10px 14px;" value="${component?.mrp || ''}" placeholder="399" />
          </div>
          <div>
            <label style="display:block; font-size:0.75rem; color:var(--hw-text-muted); font-weight:700; text-transform:uppercase; margin-bottom:4px;">
              Stock Units
            </label>
            <input type="number" name="stockCount" min="0" class="hw-search-input" style="padding:10px 14px;" value="${component?.stockCount || 25}" />
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:14px;">
          <div>
            <label style="display:block; font-size:0.75rem; color:var(--hw-text-muted); font-weight:700; text-transform:uppercase; margin-bottom:4px;">
              Operating Voltage
            </label>
            <input type="text" name="voltage" class="hw-search-input" style="padding:10px 14px;" value="${component?.voltage || '5V'}" placeholder="3.3V / 5V" />
          </div>
          <div>
            <label style="display:block; font-size:0.75rem; color:var(--hw-text-muted); font-weight:700; text-transform:uppercase; margin-bottom:4px;">
              Current Consumption
            </label>
            <input type="text" name="current" class="hw-search-input" style="padding:10px 14px;" value="${component?.current || '50mA'}" placeholder="e.g. 80mA" />
          </div>
          <div>
            <label style="display:block; font-size:0.75rem; color:var(--hw-text-muted); font-weight:700; text-transform:uppercase; margin-bottom:4px;">
              Interface Protocol
            </label>
            <input type="text" name="interface" class="hw-search-input" style="padding:10px 14px;" value="${component?.interface || 'I2C / SPI'}" placeholder="I2C / UART / GPIO" />
          </div>
        </div>

        <div>
          <label style="display:block; font-size:0.75rem; color:var(--hw-text-muted); font-weight:700; text-transform:uppercase; margin-bottom:4px;">
            Product Image URL (Clean White Background) *
          </label>
          <input type="url" name="image" required class="hw-search-input" style="padding:10px 14px;" value="${component?.image || ''}" placeholder="https://..." />
        </div>

        <div>
          <label style="display:block; font-size:0.75rem; color:var(--hw-text-muted); font-weight:700; text-transform:uppercase; margin-bottom:4px;">
            Technical Description / Working Principle
          </label>
          <textarea name="workingPrinciple" rows="3" class="hw-search-input" style="padding:10px 14px; resize:vertical;" placeholder="Describe internal operation, sensor physics, or features...">${component?.workingPrinciple || ''}</textarea>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" id="hw-instock-chk" name="inStock" ${component?.inStock !== false ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--hw-cyan);" />
          <label for="hw-instock-chk" style="color:#ffffff; font-size:0.9rem; font-weight:600; cursor:pointer;">
            Currently In Stock for Immediate Dispatch
          </label>
        </div>
      </form>

      <div class="hw-modal-footer">
        ${isEdit ? `
          <button id="hw-admin-delete-btn" class="hw-btn-glass" style="color:#ef4444; border-color:rgba(239,68,68,0.3);">
            <i data-lucide="trash-2"></i> Delete
          </button>
        ` : '<div></div>'}
        <div style="display:flex; gap:10px;">
          <button id="hw-admin-cancel-btn" class="hw-btn-glass">Cancel</button>
          <button id="hw-admin-save-btn" class="hw-btn hw-btn-primary">
            <i data-lucide="check"></i> ${isEdit ? 'Update Component' : 'Save Component'}
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  const close = () => modal.remove();
  modal.querySelector('#hw-admin-close-btn').onclick = close;
  modal.querySelector('#hw-admin-cancel-btn').onclick = close;

  // Save logic
  modal.querySelector('#hw-admin-save-btn').onclick = async () => {
    const form = modal.querySelector('#hw-admin-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      model: formData.get('model'),
      category: formData.get('category'),
      priceType: formData.get('priceType'),
      price: Number(formData.get('price')),
      mrp: Number(formData.get('mrp') || Math.round(Number(formData.get('price')) * 1.35)),
      stockCount: Number(formData.get('stockCount') || 20),
      voltage: formData.get('voltage'),
      current: formData.get('current'),
      interface: formData.get('interface'),
      image: formData.get('image'),
      workingPrinciple: formData.get('workingPrinciple'),
      inStock: form.querySelector('#hw-instock-chk').checked
    };

    const token = store.get('token') || localStorage.getItem('token');
    const url = isEdit ? `/api/hardware-components/${component.id}` : '/api/hardware-components';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        alert('Error saving component: ' + (err.error || 'Server error'));
        return;
      }

      const saved = await res.json();
      alert(`Component ${isEdit ? 'updated' : 'created'} successfully!`);
      close();
      if (onSaved) onSaved(saved);
    } catch (e) {
      alert('Network error: ' + e.message);
    }
  };

  // Delete logic
  const delBtn = modal.querySelector('#hw-admin-delete-btn');
  if (delBtn) {
    delBtn.onclick = async () => {
      if (!confirm(`Are you sure you want to permanently delete "${component.name}"?`)) return;
      const token = store.get('token') || localStorage.getItem('token');
      try {
        const res = await fetch(`/api/hardware-components/${component.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Delete failed');
        alert('Component deleted.');
        close();
        if (onSaved) onSaved(null);
      } catch (e) {
        alert('Error deleting: ' + e.message);
      }
    };
  }
}
