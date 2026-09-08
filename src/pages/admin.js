import { store } from '../store.js';

const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('ck_admin_token')}`
  };
}

// ============================================================
// Main Admin Page entry point
// ============================================================
export function AdminPage(container, params) {
  const adminToken = localStorage.getItem('ck_admin_token');
  const adminUser = JSON.parse(localStorage.getItem('ck_admin_user') || '{}');

  if (!adminToken || adminUser.role !== 'admin') {
    window.location.hash = '/admin-login';
    return;
  }

  const activeTab = params.tab || 'overview';

  // -- Global admin action handlers --
  window.switchAdminTab = (tab) => { window.location.hash = `/admin?tab=${tab}`; };

  window.adminLogout = () => {
    localStorage.removeItem('ck_admin_token');
    localStorage.removeItem('ck_admin_user');
    window.location.hash = '/';
  };

  // Fetch activity feed
  store.fetchAdminFeed();

  // Render shell
  container.innerHTML = `
    <div class="admin-layout" style="min-height:100vh; display:flex; flex-direction:column;">
      <!-- Top Bar -->
      <div style="height:60px; background:var(--bg-secondary); border-bottom:1px solid var(--border-subtle); display:flex; align-items:center; padding:0 var(--space-xl); gap:var(--space-md); position:sticky; top:0; z-index:200;">
        <a href="#/" style="display:flex; align-items:center; gap:8px; text-decoration:none; margin-right:auto;">
          <div style="width:32px;height:32px;background:var(--gradient-primary);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">⚡</div>
          <span style="font-weight:700; color:var(--text-heading);">CircuitKart <span style="color:var(--primary); font-size:var(--fs-xs); font-weight:500; background:rgba(0,212,255,0.1); padding:2px 8px; border-radius:4px; border:1px solid var(--primary);">ADMIN</span></span>
        </a>
        <span style="color:var(--text-tertiary); font-size:var(--fs-sm);">Welcome, ${adminUser.name || 'Admin'}</span>
        <button onclick="window.adminLogout()" class="btn btn-ghost btn-sm" style="color:var(--text-tertiary);">
          <i data-lucide="log-out" style="width:16px;"></i> Logout
        </button>
      </div>

      <div style="display:flex; flex:1;">
        <!-- Sidebar -->
        <nav id="admin-sidebar" style="width:220px; background:var(--bg-secondary); border-right:1px solid var(--border-subtle); padding:var(--space-md) 0; display:flex; flex-direction:column; gap:2px; min-height:calc(100vh - 60px); flex-shrink:0;">
          ${[
      ['overview', 'layout-dashboard', 'Dashboard'],
      ['orders', 'shopping-bag', 'Orders'],
      ['live-tracking', 'map-pin', 'Live Tracking'],
      ['projects', 'cpu', 'Projects'],
      ['add-project', 'plus-circle', 'Add Project'],
      ['components', 'box', 'Components'],
      ['pricing', 'indian-rupee', 'Pricing'],
      ['payment', 'qr-code', 'Payment Settings'],
      ['users', 'users', 'Users'],
      ['quotes', 'file-text', 'Custom Quotes'],
      ['activity', 'activity', 'Activity Log'],
    ].map(([tab, icon, label]) => `
            <a href="#/admin?tab=${tab}" onclick="event.preventDefault(); switchAdminTab('${tab}')"
               style="display:flex; align-items:center; gap:10px; padding:10px 20px; font-size:var(--fs-sm); font-weight:500; text-decoration:none; border-radius:0; transition:all 0.2s; color:${activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)'}; background:${activeTab === tab ? 'rgba(0,212,255,0.08)' : 'transparent'}; border-left:3px solid ${activeTab === tab ? 'var(--primary)' : 'transparent'};">
              <i data-lucide="${icon}" style="width:16px;flex-shrink:0;"></i> ${label}
              ${tab === 'live-tracking' ? '<span style="background:#10b981;color:#000;font-size:9px;font-weight:700;padding:2px 5px;border-radius:4px;margin-left:auto;">LIVE</span>' : ''}
            </a>
          `).join('')}
          <div style="flex:1;"></div>
          <a href="#/" style="display:flex; align-items:center; gap:10px; padding:10px 20px; font-size:var(--fs-sm); font-weight:500; text-decoration:none; color:var(--text-tertiary);">
            <i data-lucide="external-link" style="width:16px;"></i> View Website
          </a>
        </nav>

        <!-- Main Content -->
        <main id="admin-content" style="flex:1; padding:var(--space-xl); overflow:auto; background:var(--bg-primary);">
          <div id="admin-tab-content">Loading...</div>
        </main>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  renderTab(activeTab);
}

async function renderTab(tab) {
  const content = document.getElementById('admin-tab-content');
  if (!content) return;
  content.innerHTML = `<div class="text-center text-secondary" style="padding:3rem;"><div class="auth-spinner" style="display:inline-block;"></div><br>Loading...</div>`;

  switch (tab) {
    case 'overview': content.innerHTML = await renderOverview(); break;
    case 'orders': content.innerHTML = await renderOrders(); break;
    case 'projects': content.innerHTML = await renderProjects(); break;
    case 'add-project': content.innerHTML = await renderAddProject(); break;
    case 'components': content.innerHTML = await renderComponents(); break;
    case 'pricing': content.innerHTML = await renderPricing(); break;
    case 'payment': content.innerHTML = await renderPaymentSettings(); break;
    case 'users': content.innerHTML = await renderUsers(); break;
    case 'quotes': content.innerHTML = await renderQuotes(); break;
    case 'activity': content.innerHTML = await renderActivity(); break;
    case 'live-tracking': await renderLiveTracking(content); break;
    default: content.innerHTML = `<h2>Unknown tab</h2>`;
  }
  if (window.lucide) window.lucide.createIcons();
}

// ===== OVERVIEW =====
async function renderOverview() {
  let orders = [], users = [], quotes = [], projects = [];
  try {
    const [oRes, uRes, qRes, pRes] = await Promise.all([
      fetch(`${API}/orders/all`, { headers: authHeaders() }),
      fetch(`${API}/admin/users`, { headers: authHeaders() }),
      fetch(`${API}/admin/quotes`, { headers: authHeaders() }),
      fetch(`${API}/admin/projects`, { headers: authHeaders() }),
    ]);
    orders = await oRes.json(); if (!Array.isArray(orders)) orders = [];
    users = await uRes.json(); if (!Array.isArray(users)) users = [];
    quotes = await qRes.json(); if (!Array.isArray(quotes)) quotes = [];
    projects = await pRes.json(); if (!Array.isArray(projects)) projects = [];
  } catch (e) { console.error(e); }

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'received').length;
  const activeProjects = projects.filter(p => p.active).length;
  const recentOrders = orders.slice(0, 5);

  return `
    <div>
      <div style="margin-bottom:var(--space-xl);">
        <h1 style="font-size:var(--fs-2xl); font-weight:700; color:var(--text-heading);">Dashboard</h1>
        <p class="text-secondary">CircuitKart Admin Overview</p>
      </div>

      <!-- Stats Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:var(--space-md); margin-bottom:var(--space-xl);">
        ${[
      ['Total Revenue', `₹${(totalRevenue / 1000).toFixed(1)}k`, 'indian-rupee', '#00d4ff'],
      ['Total Orders', orders.length, 'shopping-bag', '#7c3aed'],
      ['Customers', users.filter(u => u.role === 'customer').length, 'users', '#f59e0b'],
      ['Custom Quotes', quotes.length, 'file-text', '#10b981'],
      ['Active Projects', activeProjects, 'cpu', '#3b82f6'],
      ['Pending Orders', pendingOrders, 'clock', '#ef4444'],
    ].map(([label, val, icon, color]) => `
          <div class="glass-card" style="padding:var(--space-lg);">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:var(--space-sm);">
              <div style="width:40px;height:40px;border-radius:10px;background:${color}22;display:flex;align-items:center;justify-content:center;color:${color};">
                <i data-lucide="${icon}" style="width:20px;"></i>
              </div>
              <span class="text-secondary text-sm">${label}</span>
            </div>
            <div style="font-size:var(--fs-2xl); font-weight:700; color:var(--text-heading);">${val}</div>
          </div>
        `).join('')}
      </div>

      <!-- Recent Orders -->
      <div class="glass-card" style="padding:0; overflow:hidden; margin-bottom:var(--space-xl);">
        <div style="padding:var(--space-lg); border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-weight:600;">Recent Orders</h3>
          <a href="#/admin?tab=orders" onclick="switchAdminTab('orders'); event.preventDefault()" class="text-accent text-sm">View All →</a>
        </div>
        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr></thead>
            <tbody>
              ${recentOrders.length > 0 ? recentOrders.map(o => `
                <tr>
                  <td class="font-mono text-accent">${o.id}</td>
                  <td>${(o.contactInfo?.name || o.contactInfo?.email || 'Guest').split('@')[0]}</td>
                  <td>${new Date(o.date).toLocaleDateString('en-IN')}</td>
                  <td><span class="badge badge-${o.status === 'delivered' ? 'green' : o.status === 'received' ? 'blue' : 'orange'}">${o.status}</span></td>
                  <td class="font-mono">₹${new Intl.NumberFormat('en-IN').format(o.total)}</td>
                </tr>
              `).join('') : `<tr><td colspan="5" class="text-center text-secondary" style="padding:2rem;">No orders yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ===== ORDERS =====
async function renderOrders() {
  let orders = [];
  try {
    const res = await fetch(`${API}/orders/all`, { headers: authHeaders() });
    orders = await res.json(); if (!Array.isArray(orders)) orders = [];
  } catch (e) { }

  const ALL_STATUSES = [
    'placed', 'payment_confirmed', 'confirmed', 'processing', 'packed',
    'shipped', 'out_for_delivery', 'delivered',
    'cancelled', 'payment_failed', 'return_requested', 'returned', 'refund_processing', 'refunded'
  ];

  const STATUS_LABELS = {
    placed: 'Order Placed', payment_confirmed: 'Payment Confirmed', confirmed: 'Order Confirmed',
    processing: 'Processing', packed: 'Packed', shipped: 'Shipped', out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered', cancelled: 'Cancelled', payment_failed: 'Payment Failed',
    return_requested: 'Return Requested', returned: 'Returned', refund_processing: 'Refund Processing',
    refunded: 'Refunded', received: 'Order Received', payment_submitted: 'Payment Submitted',
  };

  const STATUS_COLORS = {
    placed: '#00d4ff', payment_confirmed: '#7c3aed', confirmed: '#3b82f6',
    processing: '#f59e0b', packed: '#f97316', shipped: '#8b5cf6',
    out_for_delivery: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444',
    payment_failed: '#ef4444', return_requested: '#f59e0b', returned: '#f59e0b',
    refund_processing: '#8b5cf6', refunded: '#10b981', received: '#3b82f6', payment_submitted: '#f59e0b',
  };

  // ---- Handlers ----
  window.filterOrders = () => {
    const q = (document.getElementById('order-search')?.value || '').toLowerCase();
    const filterStatus = document.getElementById('order-filter-status')?.value || '';
    document.querySelectorAll('#orders-tbody tr[data-order-id]').forEach(row => {
      const text = (row.dataset.search || '').toLowerCase();
      const status = row.dataset.status || '';
      const matchQ = !q || text.includes(q);
      const matchS = !filterStatus || status === filterStatus;
      row.style.display = matchQ && matchS ? '' : 'none';
    });
  };

  window.openOrderModal = async (orderId) => {
    const existing = document.getElementById('admin-order-modal');
    if (existing) existing.remove();

    // Fetch order details + history from API
    let order = orders.find(o => o.id === orderId);
    let history = [];
    try {
      const res = await fetch(`${API}/orders/${orderId}/history`, { headers: authHeaders() });
      if (res.ok) history = await res.json();
    } catch (e) { }

    // If no dedicated history endpoint, try fetching from /api/admin/orders/:id
    if (history.length === 0) {
      try {
        const res = await fetch(`${API}/admin/orders/${orderId}`, { headers: authHeaders() });
        if (res.ok) { const d = await res.json(); history = d.history || []; }
      } catch (e) { }
    }

    if (!order) return;

    const modal = document.createElement('div');
    modal.id = 'admin-order-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);overflow-y:auto;padding:20px;';
    modal.innerHTML = `
      <div style="background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:16px;width:min(760px,95vw);max-height:90vh;overflow-y:auto;padding:var(--space-2xl);position:relative;">
        <button onclick="document.getElementById('admin-order-modal').remove()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,.05);border:1px solid var(--border-subtle);color:var(--text-secondary);border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:18px;">✕</button>

        <h2 style="font-size:var(--fs-xl);font-weight:700;color:var(--text-heading);margin-bottom:4px;">Order Details</h2>
        <p class="text-secondary text-sm" style="margin-bottom:1.5rem;">
          <span class="font-mono" style="color:var(--primary);">${order.id}</span> ·
          ${new Date(order.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
          <!-- Customer Info -->
          <div style="background:rgba(255,255,255,.03);border:1px solid var(--border-subtle);border-radius:10px;padding:1rem;">
            <h4 style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-tertiary);margin-bottom:.75rem;">Customer</h4>
            <div style="font-weight:600;color:var(--text-heading);">${order.contactInfo?.name || '—'}</div>
            <div style="font-size:.82rem;color:var(--text-secondary);margin-top:2px;">${order.contactInfo?.email || ''}</div>
            <div style="font-size:.82rem;color:var(--text-secondary);">${order.contactInfo?.phone || ''}</div>
          </div>
          <!-- Payment -->
          <div style="background:rgba(255,255,255,.03);border:1px solid var(--border-subtle);border-radius:10px;padding:1rem;">
            <h4 style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-tertiary);margin-bottom:.75rem;">Payment</h4>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:1.1rem;font-weight:800;color:var(--primary);">₹${new Intl.NumberFormat('en-IN').format(order.total)}</span>
              <span style="background:${order.paymentStatus === 'paid' ? '#10b98122' : '#f59e0b22'};color:${order.paymentStatus === 'paid' ? '#10b981' : '#f59e0b'};border-radius:8px;padding:2px 8px;font-size:.75rem;font-weight:700;">${order.paymentStatus || 'pending'}</span>
            </div>
            <div style="font-size:.82rem;color:var(--text-secondary);margin-top:4px;">${order.paymentMethod || '—'}</div>
          </div>
        </div>

        <!-- Items -->
        <div style="background:rgba(255,255,255,.03);border:1px solid var(--border-subtle);border-radius:10px;padding:1rem;margin-bottom:1.5rem;">
          <h4 style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-tertiary);margin-bottom:.75rem;">Items</h4>
          ${(order.items || []).map(item => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-subtle);">
              <div>
                <div style="font-size:.85rem;font-weight:500;color:var(--text-heading);">${item.name}</div>
                <div style="font-size:.75rem;color:var(--text-tertiary);">Qty: ${item.quantity || 1}</div>
              </div>
              <div class="font-mono text-sm">₹${new Intl.NumberFormat('en-IN').format(item.price * (item.quantity || 1))}</div>
            </div>`).join('')}
        </div>

        <!-- Shipping -->
        ${order.shippingInfo?.name ? `
        <div style="background:rgba(255,255,255,.03);border:1px solid var(--border-subtle);border-radius:10px;padding:1rem;margin-bottom:1.5rem;">
          <h4 style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-tertiary);margin-bottom:.75rem;">Shipping Address</h4>
          <div style="font-size:.85rem;color:var(--text-secondary);line-height:1.7;">
            <strong style="color:var(--text-heading);">${order.shippingInfo.name}</strong><br>
            ${[order.shippingInfo.address1, order.shippingInfo.address2, order.shippingInfo.city, order.shippingInfo.state, order.shippingInfo.zip, order.shippingInfo.country].filter(Boolean).join(', ')}
          </div>
        </div>` : ''}

        <!-- Status History -->
        <div style="background:rgba(255,255,255,.03);border:1px solid var(--border-subtle);border-radius:10px;padding:1rem;margin-bottom:1.5rem;">
          <h4 style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-tertiary);margin-bottom:.75rem;">Status History</h4>
          ${history.length === 0
        ? '<p class="text-secondary text-sm">No history recorded yet.</p>'
        : [...history].reverse().map(h => `
              <div style="display:flex;gap:10px;align-items:flex-start;padding:8px;background:rgba(255,255,255,.02);border-radius:6px;margin-bottom:6px;border-left:3px solid var(--primary);">
                <div style="flex:1;">
                  <div style="font-size:.83rem;font-weight:600;color:var(--text-heading);">
                    ${h.previousStatus ? `<span style="color:var(--text-tertiary);">${STATUS_LABELS[h.previousStatus] || h.previousStatus}</span> → ` : ''}
                    <span style="color:var(--primary);">${STATUS_LABELS[h.newStatus] || h.newStatus}</span>
                  </div>
                  ${h.note ? `<div style="font-size:.78rem;color:var(--text-secondary);margin-top:2px;">Note: ${h.note}</div>` : ''}
                  <div style="font-size:.72rem;color:var(--text-tertiary);margin-top:3px;">${new Date(h.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · by ${h.changedBy}</div>
                </div>
              </div>`).join('')
      }
        </div>

        <!-- Update Status Form -->
        <div style="background:rgba(0,212,255,.05);border:1px solid rgba(0,212,255,.2);border-radius:12px;padding:1.25rem;">
          <h4 style="font-weight:700;color:var(--text-heading);margin-bottom:1rem;"><i data-lucide="edit" style="width:16px;display:inline;vertical-align:middle;"></i> Update Order Status</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
            <div class="form-group">
              <label class="form-label">New Status *</label>
              <select id="modal-status-select" class="form-input">
                ${ALL_STATUSES.map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${STATUS_LABELS[s] || s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tracking Number</label>
              <input type="text" id="modal-tracking" class="form-input" placeholder="e.g. DTDC123456789" value="${order.trackingNumber || ''}">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
            <div class="form-group">
              <label class="form-label">Estimated Delivery</label>
              <input type="text" id="modal-est-delivery" class="form-input" placeholder="e.g. 3-5 Business Days" value="${order.estimatedDelivery || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Admin Note (sent to customer)</label>
              <input type="text" id="modal-note" class="form-input" placeholder="Optional note for the customer">
            </div>
          </div>
          <button onclick="window.saveOrderStatusFromModal('${order.id}')" class="btn btn-primary" style="width:100%;" id="modal-save-btn">
            <i data-lucide="save" style="width:16px;"></i> Save & Notify Customer
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    if (window.lucide) window.lucide.createIcons();
  };

  window.saveOrderStatusFromModal = async (orderId) => {
    const btn = document.getElementById('modal-save-btn');
    const status = document.getElementById('modal-status-select')?.value;
    const note = document.getElementById('modal-note')?.value;
    const trackingNumber = document.getElementById('modal-tracking')?.value;
    const estimatedDelivery = document.getElementById('modal-est-delivery')?.value;

    if (!status) return;
    btn.disabled = true; btn.textContent = 'Saving…';

    const res = await fetch(`${API}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, note, trackingNumber, estimatedDelivery })
    });

    if (res.ok) {
      showAdminToast(`Order ${orderId} updated to "${STATUS_LABELS[status] || status}"`, 'success');
      document.getElementById('admin-order-modal').remove();

      // Update row in table without full reload
      const row = document.querySelector(`tr[data-order-id="${orderId}"]`);
      if (row) {
        const color = STATUS_COLORS[status] || '#9ca3af';
        const badge = row.querySelector('.status-badge');
        if (badge) {
          badge.textContent = STATUS_LABELS[status] || status;
          badge.style.background = color + '22';
          badge.style.color = color;
        }
        row.dataset.status = status;
      }
    } else {
      showAdminToast('Failed to update status', 'error');
      btn.disabled = false; btn.innerHTML = '<i data-lucide="save" style="width:16px;"></i> Save & Notify Customer';
    }
  };

  return `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xl);">
        <div>
          <h1 style="font-size:var(--fs-2xl);font-weight:700;color:var(--text-heading);">Orders</h1>
          <span class="text-secondary text-sm">${orders.length} total · ${orders.filter(o => o.status === 'placed' || o.status === 'received').length} new</span>
        </div>
      </div>

      <!-- Filters -->
      <div style="display:flex;gap:12px;margin-bottom:var(--space-md);flex-wrap:wrap;">
        <input id="order-search" type="text" placeholder="🔍 Search by order ID, customer…" class="form-input" style="max-width:280px;" oninput="filterOrders()">
        <select id="order-filter-status" class="form-input" style="max-width:200px;" onchange="filterOrders()">
          <option value="">All Statuses</option>
          ${ALL_STATUSES.map(s => `<option value="${s}">${STATUS_LABELS[s] || s}</option>`).join('')}
        </select>
      </div>

      <div class="glass-card" style="padding:0;overflow:hidden;">
        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Customer</th><th>Items</th>
                <th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody id="orders-tbody">
              ${orders.length > 0 ? orders.map(o => {
    const color = STATUS_COLORS[o.status] || '#9ca3af';
    const searchText = `${o.id} ${o.contactInfo?.name || ''} ${o.contactInfo?.email || ''} ${o.contactInfo?.phone || ''}`;
    return `
                <tr data-order-id="${o.id}" data-status="${o.status}" data-search="${searchText.toLowerCase()}">
                  <td class="font-mono" style="white-space:nowrap;color:var(--primary);font-weight:700;">${o.id}</td>
                  <td>
                    <div style="font-weight:500;">${o.contactInfo?.name || '—'}</div>
                    <div style="font-size:.75rem;color:var(--text-tertiary);">${o.contactInfo?.email || ''}</div>
                  </td>
                  <td style="font-size:.78rem;max-width:180px;">${(o.items || []).map(i => i.name).join(', ').substring(0, 50)}${((o.items || []).length > 1) ? '…' : ''}</td>
                  <td class="font-mono font-bold">₹${new Intl.NumberFormat('en-IN').format(o.total)}</td>
                  <td>
                    <span style="font-size:.75rem;background:${o.paymentStatus === 'paid' ? '#10b98122' : '#f59e0b22'};color:${o.paymentStatus === 'paid' ? '#10b981' : '#f59e0b'};border-radius:6px;padding:2px 8px;font-weight:600;">${o.paymentStatus || 'pending'}</span>
                    ${o.paymentMethod && o.paymentMethod.includes('Txn') ? `<div style="font-size:.68rem;color:var(--text-tertiary);font-family:monospace;margin-top:2px;">${o.paymentMethod.match(/\((.*?)\)/)?.[1] || ''}</div>` : ''}
                  </td>
                  <td>
                    <span class="status-badge" style="background:${color}22;color:${color};border-radius:8px;padding:3px 8px;font-size:.75rem;font-weight:700;">${STATUS_LABELS[o.status] || o.status}</span>
                  </td>
                  <td style="font-size:.75rem;white-space:nowrap;color:var(--text-secondary);">${new Date(o.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="openOrderModal('${o.id}')" style="font-size:11px;">
                      <i data-lucide="edit" style="width:13px;"></i> Manage
                    </button>
                  </td>
                </tr>`;
  }).join('') : `<tr><td colspan="8" class="text-center text-secondary" style="padding:2rem;">No orders found</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}


// ===== PROJECTS =====
async function renderProjects() {
  let projects = [];
  try {
    const res = await fetch(`${API}/admin/projects`, { headers: authHeaders() });
    projects = await res.json(); if (!Array.isArray(projects)) projects = [];
  } catch (e) { }

  window.toggleProjectActive = async (id, btn) => {
    const current = btn.dataset.active === '1';
    const res = await fetch(`${API}/admin/projects/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ active: !current })
    });
    if (res.ok) {
      btn.dataset.active = current ? '0' : '1';
      btn.textContent = current ? 'Enable' : 'Disable';
      btn.style.color = current ? 'var(--accent-green)' : 'var(--accent-red, #ef4444)';
      showAdminToast(`Project ${current ? 'disabled' : 'enabled'}`, 'success');
    }
  };

  window.showEditPriceModal = (id, currentPrice) => {
    const newPrice = prompt(`Enter new price for project (current: ₹${currentPrice}):`, currentPrice);
    if (newPrice === null) return;
    const parsed = parseInt(newPrice);
    if (isNaN(parsed) || parsed < 0) { alert('Invalid price'); return; }

    fetch(`${API}/admin/projects/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ price: parsed })
    }).then(r => {
      if (r.ok) {
        showAdminToast(`Price updated to ₹${parsed.toLocaleString('en-IN')}`, 'success');
        switchAdminTab('projects');
      }
    });
  };

  window.deleteProject = async (id) => {
    if (!confirm('Are you sure you want to completely delete this project?')) return;
    const res = await fetch(`${API}/admin/projects/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.ok) {
      showAdminToast('Project deleted', 'success');
      switchAdminTab('projects');
    }
  };

  window.sendNotification = async () => {
    const msg = prompt('Enter notification message to broadcast to all customers:');
    if (!msg) return;
    const res = await fetch(`${API}/admin/notifications`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ message: msg, type: 'info' })
    });
    if (res.ok) showAdminToast('Broadcast sent to all customers!', 'success');
  };

  window.filterProjects = (query) => {
    const q = query.toLowerCase();
    document.querySelectorAll('#projects-tbody tr').forEach(row => {
      const name = row.querySelector('.proj-name')?.textContent.toLowerCase() || '';
      const cat = row.querySelector('.proj-cat')?.textContent.toLowerCase() || '';
      row.style.display = (!q || name.includes(q) || cat.includes(q)) ? '' : 'none';
    });
  };

  // ---- Edit Modal ----
  window.openEditModal = (projectJson) => {
    const p = JSON.parse(decodeURIComponent(projectJson));
    const existing = document.getElementById('admin-edit-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'admin-edit-modal';
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);`;
    modal.innerHTML = `
      <div style="background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:16px;width:min(700px,95vw);max-height:90vh;overflow-y:auto;padding:var(--space-2xl);position:relative;">
        <button onclick="document.getElementById('admin-edit-modal').remove()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.05);border:1px solid var(--border-subtle);color:var(--text-secondary);border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">✕</button>
        
        <h2 style="font-size:var(--fs-xl);font-weight:700;color:var(--text-heading);margin-bottom:4px;">Edit Project</h2>
        <p class="text-secondary text-sm" style="margin-bottom:var(--space-xl);">ID: <span class="font-mono" style="color:var(--primary);">${p.id}</span></p>

        <form id="edit-project-form" onsubmit="saveProjectEdit(event)" style="display:flex;flex-direction:column;gap:var(--space-md);">
          <input type="hidden" name="id" value="${p.id}">

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div class="form-group">
              <label class="form-label">Project Name *</label>
              <input name="name" class="form-input" required value="${(p.name || '').replace(/"/g, '&quot;')}" placeholder="e.g. Smart Home System">
            </div>
            <div class="form-group">
              <label class="form-label">Slug (URL) *</label>
              <input name="slug" class="form-input" required value="${(p.slug || '').replace(/"/g, '&quot;')}" placeholder="e.g. smart-home-system">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-md);">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select name="category" class="form-input">
                ${['arduino', 'esp32', 'esp8266', 'raspberry-pi', 'robotics', 'iot', 'misc'].map(c =>
      `<option value="${c}" ${p.category === c ? 'selected' : ''}>${c}</option>`
    ).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Price (₹) *</label>
              <input name="price" type="number" class="form-input" required min="0" value="${p.price || 0}">
            </div>
            <div class="form-group">
              <label class="form-label">Difficulty</label>
              <select name="difficulty" class="form-input">
                ${['Beginner', 'Intermediate', 'Advanced'].map(d =>
      `<option value="${d}" ${p.difficulty === d ? 'selected' : ''}>${d}</option>`
    ).join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Short Description</label>
            <input name="shortDescription" class="form-input" value="${(p.shortDescription || '').replace(/"/g, '&quot;')}" placeholder="One-line summary shown in cards">
          </div>

          <div class="form-group">
            <label class="form-label">Full Description</label>
            <textarea name="description" class="form-input" rows="4" placeholder="Detailed project description...">${p.description || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Main Image URL</label>
            <input name="image" type="url" class="form-input" value="${(p.image || '').replace(/"/g, '&quot;')}" placeholder="https://example.com/image.jpg">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div class="form-group" style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:10px;padding:14px 16px;">
              <input type="checkbox" name="featured" id="edit-featured" ${p.featured ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--primary);cursor:pointer;">
              <label for="edit-featured" style="cursor:pointer;font-weight:500;color:var(--text-heading);">⭐ Mark as Featured</label>
            </div>
            <div class="form-group" style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:10px;padding:14px 16px;">
              <input type="checkbox" name="active" id="edit-active" ${p.active ? 'checked' : ''} style="width:18px;height:18px;accent-color:#10b981;cursor:pointer;">
              <label for="edit-active" style="cursor:pointer;font-weight:500;color:var(--text-heading);">✅ Active (visible to customers)</label>
            </div>
          </div>

          <div style="display:flex;gap:var(--space-md);margin-top:var(--space-md);">
            <button type="button" onclick="document.getElementById('admin-edit-modal').remove()" class="btn btn-secondary" style="flex:1;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="flex:2;" id="save-edit-btn">
              <i data-lucide="save" style="width:16px;"></i> Save Changes
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    if (window.lucide) window.lucide.createIcons();
  };

  window.saveProjectEdit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-edit-btn');
    btn.disabled = true; btn.textContent = 'Saving...';

    const form = e.target;
    const data = {
      name: form.name.value,
      slug: form.slug.value,
      category: form.category.value,
      price: parseFloat(form.price.value) || 0,
      difficulty: form.difficulty.value,
      shortDescription: form.shortDescription.value,
      description: form.description.value,
      image: form.image.value,
      featured: form.featured.checked ? 1 : 0,
      active: form.active.checked ? 1 : 0,
    };

    const id = form.id.value;
    const res = await fetch(`${API}/admin/projects/${id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify(data)
    });

    if (res.ok) {
      showAdminToast('Project updated successfully!', 'success');
      document.getElementById('admin-edit-modal').remove();
      switchAdminTab('projects');
    } else {
      showAdminToast('Failed to save changes', 'error');
      btn.disabled = false; btn.innerHTML = '<i data-lucide="save" style="width:16px;"></i> Save Changes';
    }
  };

  // ---- Render HTML ----
  return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-xl);">
        <div>
          <h1 style="font-size:var(--fs-2xl); font-weight:700; color:var(--text-heading);">Projects</h1>
          <span class="text-secondary text-sm">${projects.length} total · ${projects.filter(p => p.active).length} active</span>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <button class="btn btn-secondary btn-sm" onclick="sendNotification()">
            <i data-lucide="bell" style="width:16px;"></i> Broadcast Alert
          </button>
          <a href="#/admin?tab=add-project" onclick="event.preventDefault();switchAdminTab('add-project')" class="btn btn-primary btn-sm">
            <i data-lucide="plus" style="width:16px;"></i> Add Project
          </a>
        </div>
      </div>

      <div style="display:flex;gap:12px;margin-bottom:var(--space-md);">
        <input type="text" placeholder="🔍  Search projects by name or category..." class="form-input" oninput="filterProjects(this.value)" style="max-width:360px;">
      </div>

      <div class="glass-card" style="padding:0; overflow:hidden;">
        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Name</th><th>Category</th><th>Price</th><th>Difficulty</th>
                <th>Featured</th><th>Status</th><th style="min-width:180px;">Actions</th>
              </tr>
            </thead>
            <tbody id="projects-tbody">
              ${projects.map(p => {
    const safe = encodeURIComponent(JSON.stringify({
      id: p.id, name: p.name, slug: p.slug, category: p.category,
      price: p.price, difficulty: p.difficulty, shortDescription: p.shortDescription,
      description: p.description, image: p.image, featured: p.featured, active: p.active
    }));
    return `
                <tr data-project-id="${p.id}">
                  <td style="font-weight:600; max-width:220px;">
                    <span class="proj-name">${p.name}</span>
                    ${p.image ? `<br><span class="text-xs text-tertiary font-mono">${p.image.substring(0, 30)}…</span>` : ''}
                  </td>
                  <td><span class="badge badge-blue proj-cat">${p.category}</span></td>
                  <td class="font-mono" style="font-weight:600;">₹${new Intl.NumberFormat('en-IN').format(p.price)}</td>
                  <td>${p.difficulty || '—'}</td>
                  <td>${p.featured ? '<span class="badge badge-green">⭐ Yes</span>' : '<span style="color:var(--text-tertiary);">—</span>'}</td>
                  <td><span class="badge badge-${p.active ? 'green' : 'orange'} status-badge">${p.active ? 'Active' : 'Disabled'}</span></td>
                  <td>
                    <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                      <button class="btn btn-primary btn-sm" onclick="openEditModal('${safe}')" title="Edit all fields" style="font-size:12px;">
                        <i data-lucide="pencil" style="width:13px;"></i> Edit
                      </button>
                      <button class="btn btn-ghost btn-sm"
                              data-active="${p.active ? '1' : '0'}"
                              onclick="toggleProjectActive('${p.id}', this)"
                              style="color:${p.active ? 'var(--accent-red,#ef4444)' : 'var(--accent-green)'}; font-size:12px;">
                        ${p.active ? 'Disable' : 'Enable'}
                      </button>
                      <button class="btn btn-ghost btn-sm" onclick="deleteProject('${p.id}')" title="Delete" style="color:var(--accent-red,#ef4444);">
                        <i data-lucide="trash-2" style="width:14px;"></i>
                      </button>
                    </div>
                  </td>
                </tr>`;
  }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ===== ADD PROJECT =====
async function renderAddProject() {
  window.submitNewProject = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Format basic fields
    data.price = parseFloat(data.price) || 0;

    try {
      const res = await fetch(`${API}/admin/projects`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showAdminToast('Project added successfully!', 'success');
        form.reset();
        setTimeout(() => switchAdminTab('projects'), 1000);
      } else {
        showAdminToast('Failed to add project', 'error');
      }
    } catch (err) {
      showAdminToast('Error adding project', 'error');
    }
  };

  return `
    <div style="max-width:800px;">
      <div style="margin-bottom:var(--space-xl);">
        <h1 style="font-size:var(--fs-2xl); font-weight:700; color:var(--text-heading);">Add New Project</h1>
        <p class="text-secondary">Create a new project entry for the store.</p>
      </div>
      
      <div class="glass-card" style="padding:var(--space-2xl);">
        <form onsubmit="submitNewProject(event)" style="display:flex; flex-direction:column; gap:var(--space-md);">
          <div style="display:flex; gap:var(--space-md);">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Project Name *</label>
              <input type="text" name="name" class="form-input" required placeholder="e.g. Smart Home System">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Slug (URL friendly) *</label>
              <input type="text" name="slug" class="form-input" required placeholder="e.g. smart-home-system">
            </div>
          </div>
          
          <div style="display:flex; gap:var(--space-md);">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Category</label>
              <select name="category" class="form-input">
                <option value="arduino">Arduino</option>
                <option value="esp32">ESP32</option>
                <option value="raspberry-pi">Raspberry Pi</option>
                <option value="robotics">Robotics</option>
                <option value="iot">IoT</option>
                <option value="misc">Miscellaneous</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Price (₹) *</label>
              <input type="number" name="price" class="form-input" required min="0" placeholder="0">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Difficulty</label>
              <select name="difficulty" class="form-input">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Short Description</label>
            <input type="text" name="shortDescription" class="form-input" placeholder="Brief summary of the project">
          </div>
          
          <div class="form-group">
            <label class="form-label">Full Description</label>
            <textarea name="description" class="form-input" rows="4" placeholder="Detailed project description..."></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">Main Image URL</label>
            <input type="url" name="image" class="form-input" placeholder="https://example.com/image.jpg">
          </div>
          
          <div style="margin-top:var(--space-md);">
            <button type="submit" class="btn btn-primary" style="width:100%;">
              <i data-lucide="plus-circle" style="width:18px;"></i> Add Project
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// ===== COMPONENTS / PRICING =====
async function renderComponents() {
  let components = [];
  try {
    const res = await fetch(`${API}/admin/components`, { headers: authHeaders() });
    components = await res.json(); if (!Array.isArray(components)) components = [];
  } catch (e) { }

  const grouped = {};
  components.forEach(c => {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  });

  window.saveComponentPrice = async (id, inputEl) => {
    const price = parseInt(inputEl.value);
    if (isNaN(price)) { alert('Invalid price'); return; }
    const res = await fetch(`${API}/admin/components/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ price })
    });
    if (res.ok) showAdminToast('Price saved!', 'success');
  };

  return `
    <div>
      <div style="margin-bottom:var(--space-xl);">
        <h1 style="font-size:var(--fs-2xl); font-weight:700; color:var(--text-heading);">Components</h1>
        <p class="text-secondary">Edit component prices used in the Build Your Project customizer</p>
      </div>
      ${Object.entries(grouped).map(([category, items]) => `
        <div class="glass-card" style="margin-bottom:var(--space-lg); padding:0; overflow:hidden;">
          <div style="padding:var(--space-md) var(--space-lg); border-bottom:1px solid var(--border-subtle); background:rgba(0,212,255,0.04);">
            <h3 style="font-weight:600; text-transform:capitalize;">${category}</h3>
          </div>
          <table class="admin-table">
            <thead><tr><th>Name</th><th>Current Price</th><th>Edit Price</th><th>Save</th></tr></thead>
            <tbody>
              ${items.map(c => `
                <tr>
                  <td style="font-weight:500;">${c.name}</td>
                  <td class="font-mono text-accent">₹${c.price.toLocaleString('en-IN')}</td>
                  <td>
                    <input type="number" id="comp-price-${c.id}" value="${c.price}" min="0"
                           class="form-input" style="width:110px; padding:4px 8px; font-size:13px;" />
                  </td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="saveComponentPrice(${c.id}, document.getElementById('comp-price-${c.id}'))">
                      Save
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>
  `;
}

// ===== PRICING (project prices quick edit) =====
async function renderPricing() {
  let projects = [];
  try {
    const res = await fetch(`${API}/admin/projects`, { headers: authHeaders() });
    projects = await res.json(); if (!Array.isArray(projects)) projects = [];
  } catch (e) { }

  window.saveProjectPrice = async (id, inputEl) => {
    const price = parseInt(inputEl.value);
    if (isNaN(price) || price < 0) { alert('Invalid price'); return; }
    const res = await fetch(`${API}/admin/projects/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ price })
    });
    if (res.ok) showAdminToast(`Price saved → ₹${price.toLocaleString('en-IN')}`, 'success');
  };

  return `
    <div>
      <div style="margin-bottom:var(--space-xl);">
        <h1 style="font-size:var(--fs-2xl); font-weight:700; color:var(--text-heading);">Pricing Management</h1>
        <p class="text-secondary">Set project prices. Changes appear on the customer website immediately.</p>
      </div>
      <div class="glass-card" style="padding:0; overflow:hidden;">
        <table class="admin-table">
          <thead>
            <tr><th>Project Name</th><th>Category</th><th>Current Price</th><th>New Price</th><th>Save</th></tr>
          </thead>
          <tbody>
            ${projects.map(p => `
              <tr>
                <td style="font-weight:500;">${p.name}</td>
                <td><span class="badge badge-blue">${p.category}</span></td>
                <td class="font-mono text-accent">₹${p.price.toLocaleString('en-IN')}</td>
                <td>
                  <input type="number" id="proj-price-${p.id}" value="${p.price}" min="0"
                         class="form-input" style="width:130px; padding:4px 8px; font-size:13px;" />
                </td>
                <td>
                  <button class="btn btn-primary btn-sm" onclick="saveProjectPrice('${p.id}', document.getElementById('proj-price-${p.id}'))">
                    Save
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ===== PAYMENT SETTINGS =====
async function renderPaymentSettings() {
  let settings = {};
  try {
    const res = await fetch(`${API}/settings`);
    settings = await res.json();
  } catch (e) { }

  const upiId = settings.upi_id || '8123670980@ybl';

  window.savePaymentSettings = async () => {
    const upi_id = document.getElementById('admin-upi-id').value.trim();
    if (!upi_id) { alert('UPI ID cannot be empty'); return; }

    const res = await fetch(`${API}/admin/settings`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ upi_id })
    });
    if (res.ok) {
      showAdminToast('Payment settings saved! Customer checkout will use the new UPI ID.', 'success');
      // Force store refresh
      await store.init();
    } else {
      showAdminToast('Failed to save settings', 'error');
    }
  };

  return `
    <div style="max-width:600px;">
      <div style="margin-bottom:var(--space-xl);">
        <h1 style="font-size:var(--fs-2xl); font-weight:700; color:var(--text-heading);">Payment Settings</h1>
        <p class="text-secondary">Changes here appear on the customer checkout page immediately.</p>
      </div>

      <div class="glass-card" style="padding:var(--space-2xl); margin-bottom:var(--space-xl);">
        <h3 style="font-weight:600; margin-bottom:var(--space-lg);">UPI Payment</h3>
        
        <div class="form-group" style="margin-bottom:var(--space-xl);">
          <label class="form-label">UPI ID</label>
          <input type="text" id="admin-upi-id" class="form-input" value="${upiId}" placeholder="yourupi@ybl" />
          <p class="text-xs text-tertiary" style="margin-top:var(--space-xs);">This UPI ID will be shown on the checkout QR code</p>
        </div>

        <div style="margin-bottom:var(--space-xl);">
          <label class="form-label">Current QR Code Preview</label>
          <div style="background:white; padding:12px; border-radius:var(--radius-md); display:inline-block;">
            <img id="upi-qr-preview" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=CircuitKart&cu=INR`)}" 
                 alt="UPI QR Code" style="width:200px; height:200px; display:block;" />
          </div>
          <p class="text-xs text-tertiary" style="margin-top:var(--space-xs);">QR code updates automatically when you change the UPI ID and save.</p>
        </div>

        <button class="btn btn-primary" onclick="savePaymentSettings()">
          <i data-lucide="save" style="width:16px;"></i> Save Payment Settings
        </button>
      </div>
    </div>
  `;
}

// ===== USERS =====
async function renderUsers() {
  let users = [];
  try {
    const res = await fetch(`${API}/admin/users`, { headers: authHeaders() });
    users = await res.json(); if (!Array.isArray(users)) users = [];
  } catch (e) { }

  const customers = users.filter(u => u.role === 'customer');
  const admins = users.filter(u => u.role === 'admin');

  return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-xl);">
        <h1 style="font-size:var(--fs-2xl); font-weight:700; color:var(--text-heading);">Users</h1>
        <div style="display:flex; gap:var(--space-sm);">
          <span class="badge badge-blue">${customers.length} customers</span>
          <span class="badge badge-orange">${admins.length} admins</span>
        </div>
      </div>
      <div class="glass-card" style="padding:0; overflow:hidden;">
        <table class="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
          </thead>
          <tbody>
            ${users.length > 0 ? users.map(u => `
              <tr>
                <td style="font-weight:500;">${u.name}</td>
                <td>${u.email}</td>
                <td><span class="badge badge-${u.role === 'admin' ? 'orange' : 'blue'}">${u.role}</span></td>
                <td style="font-size:var(--fs-xs); color:var(--text-tertiary);">${new Date(u.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            `).join('') : `<tr><td colspan="4" class="text-center text-secondary" style="padding:2rem;">No users found</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ===== CUSTOM QUOTES =====
async function renderQuotes() {
  let quotes = [];
  try {
    const res = await fetch(`${API}/admin/quotes`, { headers: authHeaders() });
    quotes = await res.json(); if (!Array.isArray(quotes)) quotes = [];
  } catch (e) { }

  window.updateQuoteStatus = async (id, selectEl) => {
    const status = selectEl.value;
    const res = await fetch(`${API}/admin/quotes/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
    if (res.ok) showAdminToast(`Quote status updated to "${status}"`, 'success');
  };

  return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-xl);">
        <h1 style="font-size:var(--fs-2xl); font-weight:700; color:var(--text-heading);">Custom Project Quotes</h1>
        <span class="text-secondary text-sm">${quotes.length} total · ${quotes.filter(q => q.status === 'pending').length} pending</span>
      </div>
      <div class="glass-card" style="padding:0; overflow:hidden;">
        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead>
              <tr><th>ID</th><th>Customer</th><th>Project</th><th>Budget</th><th>Timeline</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              ${quotes.length > 0 ? quotes.map(q => `
                <tr>
                  <td class="font-mono text-accent">${q.id}</td>
                  <td>
                    <div style="font-weight:500;">${q.name}</div>
                    <div style="font-size:var(--fs-xs); color:var(--text-tertiary);">${q.email}</div>
                  </td>
                  <td style="max-width:200px;">${q.projectName}</td>
                  <td class="font-mono">${q.budget || '—'}</td>
                  <td>${q.timeline || '—'}</td>
                  <td>
                    <select class="form-input" style="padding:4px 8px;font-size:12px;min-width:150px;" onchange="updateQuoteStatus('${q.id}', this)">
                      ${['pending', 'under_review', 'approved', 'quotation_sent', 'customer_confirmed', 'in_progress', 'completed', 'rejected'].map(s =>
    `<option ${q.status === s ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`
  ).join('')}
                    </select>
                  </td>
                  <td style="font-size:var(--fs-xs);">${new Date(q.date).toLocaleDateString('en-IN')}</td>
                </tr>
              `).join('') : `<tr><td colspan="7" class="text-center text-secondary" style="padding:2rem;">No quotes yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ===== ACTIVITY LOG =====
async function renderActivity() {
  let activities = [];
  try {
    const res = await fetch(`${API}/admin/feed`, { headers: authHeaders() });
    activities = await res.json(); if (!Array.isArray(activities)) activities = [];
  } catch (e) { }

  return `
    <div>
      <div style="margin-bottom:var(--space-xl);">
        <h1 style="font-size:var(--fs-2xl); font-weight:700; color:var(--text-heading);">Activity Log</h1>
        <p class="text-secondary">All admin actions and system events</p>
      </div>
      <div class="glass-card" style="padding:var(--space-xl);">
        ${activities.length > 0 ? activities.map(a => `
          <div style="display:flex; gap:var(--space-md); padding:var(--space-sm) 0; border-bottom:1px solid var(--border-subtle);">
            <div style="color:var(--text-tertiary); font-family:monospace; white-space:nowrap; font-size:var(--fs-xs); padding-top:2px;">
              ${new Date(a.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
            <div>
              <span class="badge badge-${a.type === 'order' ? 'blue' : a.type === 'project' ? 'orange' : 'green'}" style="margin-right:8px;">${a.type}</span>
              ${a.description}
            </div>
          </div>
        `).join('') : `<div class="text-center text-secondary" style="padding:var(--space-2xl);">No activity recorded yet</div>`}
      </div>
    </div>
  `;
}

function showAdminToast(message, type = 'success') {
  const tc = document.getElementById('toast-container') || document.body;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;';
  el.innerHTML = `<div class="toast-content">${message}</div>`;
  tc.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
