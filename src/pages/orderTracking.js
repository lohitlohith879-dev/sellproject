// src/pages/orderTracking.js — Real-time Order Tracking Page
import { store } from '../store.js';
import { socketManager } from '../socket/socket.js';

const API = '/api';

// Full status definitions
const STATUS_FLOW = [
  { key: 'placed',            label: 'Order Placed',        icon: 'shopping-bag',  color: '#00d4ff' },
  { key: 'payment_confirmed', label: 'Payment Confirmed',   icon: 'credit-card',   color: '#7c3aed' },
  { key: 'confirmed',         label: 'Order Confirmed',     icon: 'check-circle',  color: '#3b82f6' },
  { key: 'processing',        label: 'Processing',          icon: 'settings',      color: '#f59e0b' },
  { key: 'packed',            label: 'Packed',              icon: 'package',       color: '#f97316' },
  { key: 'shipped',           label: 'Shipped',             icon: 'truck',         color: '#8b5cf6' },
  { key: 'out_for_delivery',  label: 'Out for Delivery',    icon: 'map-pin',       color: '#06b6d4' },
  { key: 'delivered',         label: 'Delivered',           icon: 'badge-check',   color: '#10b981' },
];

const SPECIAL_STATUSES = {
  cancelled:          { label: 'Order Cancelled',       color: '#ef4444', icon: 'x-circle' },
  payment_failed:     { label: 'Payment Failed',        color: '#ef4444', icon: 'alert-circle' },
  return_requested:   { label: 'Return Requested',      color: '#f59e0b', icon: 'rotate-ccw' },
  returned:           { label: 'Returned',              color: '#f59e0b', icon: 'package-x' },
  refund_processing:  { label: 'Refund Processing',     color: '#8b5cf6', icon: 'refresh-cw' },
  refunded:           { label: 'Refunded',              color: '#10b981', icon: 'wallet' },
};

// Status labels map (incl legacy ones from old code)
const STATUS_LABEL = {};
STATUS_FLOW.forEach(s => STATUS_LABEL[s.key] = s.label);
Object.entries(SPECIAL_STATUSES).forEach(([k,v]) => STATUS_LABEL[k] = v.label);
STATUS_LABEL['received'] = 'Order Received';
STATUS_LABEL['payment_submitted'] = 'Payment Submitted';

export async function OrderTrackingPage(container, params) {
  const orderId = params.id;
  const token   = localStorage.getItem('ck_token');

  if (!token) {
    container.innerHTML = `
      <div class="container section text-center" style="padding-top:calc(var(--nav-height) + 4rem); min-height:70vh;">
        <h1 class="heading-xl">Sign In Required</h1>
        <p class="text-secondary" style="margin:1rem 0 2rem;">Please sign in to track your order.</p>
        <a href="#/login" class="btn btn-primary">Sign In</a>
      </div>`;
    return;
  }

  // Render loading skeleton
  container.innerHTML = `
    <div class="container section" style="padding-top:calc(var(--nav-height) + 2rem); min-height:80vh; max-width:900px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:2rem;">
        <a href="#/dashboard" class="btn btn-ghost btn-sm"><i data-lucide="arrow-left" style="width:16px;"></i> My Orders</a>
      </div>
      <div class="text-center" style="padding:4rem 0;">
        <div class="auth-spinner" style="display:inline-block;"></div>
        <p class="text-secondary" style="margin-top:1rem;">Loading order details…</p>
      </div>
    </div>`;
  if (window.lucide) window.lucide.createIcons();

  // Fetch order from backend
  let order;
  try {
    const res = await fetch(`${API}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Not found');
    order = await res.json();
  } catch (e) {
    container.innerHTML = `
      <div class="container section text-center" style="padding-top:calc(var(--nav-height) + 4rem); min-height:70vh;">
        <i data-lucide="package-x" style="width:64px;height:64px;color:var(--text-tertiary);"></i>
        <h2 class="heading-lg" style="margin:1rem 0 .5rem;">Order Not Found</h2>
        <p class="text-secondary" style="margin-bottom:2rem;">Order <strong>${orderId}</strong> doesn't exist or doesn't belong to your account.</p>
        <a href="#/dashboard" class="btn btn-primary">Back to Dashboard</a>
      </div>`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  function renderPage(o) {
    const isSpecial = !!SPECIAL_STATUSES[o.status];
    const specialInfo = SPECIAL_STATUSES[o.status];
    const currentFlowIdx = STATUS_FLOW.findIndex(s => s.key === o.status);
    const historyMap = {};
    (o.history || []).forEach(h => { historyMap[h.newStatus] = h.createdAt; });

    const payStatusColor = o.paymentStatus === 'paid' ? '#10b981' : o.paymentStatus === 'failed' ? '#ef4444' : '#f59e0b';
    const payStatusLabel = o.paymentStatus === 'paid' ? 'Paid' : o.paymentStatus === 'failed' ? 'Failed' : 'Pending';

    container.innerHTML = `
      <div class="container section" style="padding-top:calc(var(--nav-height) + 1.5rem); padding-bottom:4rem; max-width:900px;">

        <!-- Header -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:2rem;">
          <div>
            <a href="#/dashboard" class="btn btn-ghost btn-sm" style="margin-bottom:.75rem;"><i data-lucide="arrow-left" style="width:16px;"></i> My Orders</a>
            <h1 style="font-size:1.8rem;font-weight:800;color:var(--text-heading);">Track Order</h1>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap;">
              <span class="font-mono" style="color:var(--primary);font-size:1rem;font-weight:700;">${o.id}</span>
              <span style="color:var(--text-tertiary);">·</span>
              <span class="text-secondary text-sm">Placed ${new Date(o.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
            </div>
          </div>
          <div id="live-status-badge" style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
            ${isSpecial
              ? `<span style="background:${specialInfo.color}22;color:${specialInfo.color};border:1px solid ${specialInfo.color}44;padding:6px 16px;border-radius:20px;font-weight:700;font-size:.85rem;display:flex;align-items:center;gap:6px;">
                  <i data-lucide="${specialInfo.icon}" style="width:15px;"></i> ${specialInfo.label}
                </span>`
              : `<span style="background:var(--primary-10,rgba(0,212,255,.12));color:var(--primary);border:1px solid rgba(0,212,255,.3);padding:6px 16px;border-radius:20px;font-weight:700;font-size:.85rem;">
                  ${STATUS_LABEL[o.status] || o.status}
                </span>`
            }
            <span style="font-size:.75rem;color:var(--text-tertiary);display:flex;align-items:center;gap:4px;">
              <span id="live-dot" style="width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block;animation:pulse 2s infinite;"></span>
              Live Updates Active
            </span>
          </div>
        </div>

        <!-- Grid: Tracking + Details -->
        <div style="display:grid;grid-template-columns:1fr 340px;gap:1.5rem;">

          <!-- Left: Timeline -->
          <div>
            <!-- Status Timeline Card -->
            <div class="glass-card" style="padding:1.75rem;margin-bottom:1.5rem;">
              <h3 style="font-weight:700;color:var(--text-heading);margin-bottom:1.5rem;display:flex;align-items:center;gap:8px;">
                <i data-lucide="map" style="width:18px;color:var(--primary);"></i> Order Progress
              </h3>

              ${isSpecial ? `
                <div style="background:${specialInfo.color}11;border:1px solid ${specialInfo.color}44;border-radius:12px;padding:1rem 1.25rem;display:flex;align-items:center;gap:12px;">
                  <i data-lucide="${specialInfo.icon}" style="width:24px;color:${specialInfo.color};flex-shrink:0;"></i>
                  <div>
                    <div style="font-weight:600;color:${specialInfo.color};">${specialInfo.label}</div>
                    <div class="text-sm text-secondary">This order has been ${o.status.replace('_',' ')}.</div>
                  </div>
                </div>
              ` : `
                <div id="tracking-timeline" style="position:relative;">
                  ${STATUS_FLOW.map((step, idx) => {
                    const done = currentFlowIdx >= 0 && idx < currentFlowIdx;
                    const active = idx === currentFlowIdx;
                    const ts = historyMap[step.key];
                    return `
                      <div style="display:flex;gap:16px;margin-bottom:${idx < STATUS_FLOW.length-1 ? '0' : '0'};">
                        <!-- Dot + line -->
                        <div style="display:flex;flex-direction:column;align-items:center;min-width:36px;">
                          <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;
                            background:${done ? step.color : active ? step.color+'22' : 'rgba(255,255,255,0.05)'};
                            border:2px solid ${done || active ? step.color : 'var(--border-subtle)'};
                            ${active ? `box-shadow:0 0 0 4px ${step.color}22;` : ''}
                            transition:all 0.4s;">
                            ${done
                              ? `<i data-lucide="check" style="width:18px;height:18px;color:#fff;"></i>`
                              : `<i data-lucide="${step.icon}" style="width:16px;height:16px;color:${active ? step.color : 'var(--text-tertiary)'};"></i>`
                            }
                          </div>
                          ${idx < STATUS_FLOW.length-1
                            ? `<div style="width:2px;flex:1;min-height:28px;background:${done ? step.color : 'var(--border-subtle)'};transition:background 0.4s;margin:4px 0;"></div>`
                            : ''}
                        </div>
                        <!-- Label -->
                        <div style="padding-top:6px;padding-bottom:${idx < STATUS_FLOW.length-1 ? '12px' : '0'};">
                          <div style="font-weight:${active ? '700' : '500'};color:${done || active ? 'var(--text-heading)' : 'var(--text-tertiary)'};font-size:.9rem;">${step.label}</div>
                          ${ts
                            ? `<div style="font-size:.75rem;color:var(--text-tertiary);margin-top:2px;">${new Date(ts).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'})}</div>`
                            : active
                              ? `<div style="font-size:.75rem;color:${step.color};margin-top:2px;font-weight:600;">● In Progress</div>`
                              : `<div style="font-size:.75rem;color:var(--text-tertiary);margin-top:2px;">Pending</div>`
                          }
                        </div>
                      </div>`;
                  }).join('')}
                </div>
              `}
            </div>

            <!-- History Log -->
            <div class="glass-card" style="padding:1.5rem;">
              <h3 style="font-weight:700;color:var(--text-heading);margin-bottom:1rem;display:flex;align-items:center;gap:8px;">
                <i data-lucide="clock" style="width:18px;color:var(--primary);"></i> Status History
              </h3>
              <div id="history-log" style="display:flex;flex-direction:column;gap:10px;">
                ${(o.history||[]).length === 0
                  ? `<p class="text-secondary text-sm">No history yet.</p>`
                  : [...(o.history||[])].reverse().map(h => `
                    <div style="display:flex;gap:12px;align-items:flex-start;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid var(--primary);">
                      <div style="flex:1;">
                        <div style="font-size:.85rem;font-weight:600;color:var(--text-heading);">
                          ${h.previousStatus ? `<span class="text-tertiary">${STATUS_LABEL[h.previousStatus]||h.previousStatus}</span> → ` : ''}
                          <span style="color:var(--primary);">${STATUS_LABEL[h.newStatus]||h.newStatus}</span>
                        </div>
                        ${h.note ? `<div style="font-size:.8rem;color:var(--text-secondary);margin-top:2px;">Note: ${h.note}</div>` : ''}
                        <div style="font-size:.75rem;color:var(--text-tertiary);margin-top:4px;">${new Date(h.createdAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div>
                      </div>
                    </div>`).join('')
                }
              </div>
            </div>
          </div>

          <!-- Right: Order Info -->
          <div style="display:flex;flex-direction:column;gap:1.25rem;">

            <!-- Payment Status -->
            <div class="glass-card" style="padding:1.25rem;">
              <h4 style="font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-tertiary);margin-bottom:.75rem;">Payment</h4>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:.5rem;">
                <span style="width:10px;height:10px;border-radius:50%;background:${payStatusColor};display:inline-block;"></span>
                <span style="font-weight:700;color:${payStatusColor};">${payStatusLabel}</span>
              </div>
              <div style="font-size:.8rem;color:var(--text-secondary);">${o.paymentMethod || 'UPI'}</div>
              <div style="border-top:1px solid var(--border-subtle);margin-top:.75rem;padding-top:.75rem;display:flex;justify-content:space-between;align-items:center;">
                <span class="text-secondary text-sm">Total</span>
                <span class="font-mono font-bold" style="color:var(--primary);font-size:1.1rem;">₹${new Intl.NumberFormat('en-IN').format(o.total)}</span>
              </div>
            </div>

            <!-- Delivery -->
            ${o.estimatedDelivery || o.trackingNumber ? `
            <div class="glass-card" style="padding:1.25rem;">
              <h4 style="font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-tertiary);margin-bottom:.75rem;">Delivery</h4>
              ${o.estimatedDelivery ? `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:.5rem;">
                  <i data-lucide="calendar" style="width:15px;color:var(--text-secondary);"></i>
                  <span class="text-sm">Est: <strong>${o.estimatedDelivery}</strong></span>
                </div>` : ''}
              ${o.trackingNumber ? `
                <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border-radius:8px;padding:8px 10px;margin-top:.5rem;">
                  <i data-lucide="truck" style="width:15px;color:var(--primary);"></i>
                  <span class="font-mono text-sm" style="color:var(--primary);">${o.trackingNumber}</span>
                </div>` : ''}
            </div>` : ''}

            <!-- Items -->
            <div class="glass-card" style="padding:1.25rem;">
              <h4 style="font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-tertiary);margin-bottom:.75rem;">Items Ordered</h4>
              ${(o.items||[]).map(item => `
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:.5rem 0;border-bottom:1px solid var(--border-subtle);">
                  <div>
                    <div style="font-weight:500;font-size:.85rem;color:var(--text-heading);">${item.name}</div>
                    <div style="font-size:.75rem;color:var(--text-tertiary);">Qty: ${item.quantity||1}</div>
                  </div>
                  <div class="font-mono text-sm">₹${new Intl.NumberFormat('en-IN').format(item.price*(item.quantity||1))}</div>
                </div>`).join('')}
            </div>

            <!-- Shipping -->
            ${o.shippingInfo?.name ? `
            <div class="glass-card" style="padding:1.25rem;">
              <h4 style="font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-tertiary);margin-bottom:.75rem;">Ship To</h4>
              <div style="font-weight:600;font-size:.9rem;color:var(--text-heading);">${o.shippingInfo.name}</div>
              <div style="font-size:.8rem;color:var(--text-secondary);line-height:1.6;">
                ${[o.shippingInfo.address1, o.shippingInfo.address2, o.shippingInfo.city, o.shippingInfo.state, o.shippingInfo.zip, o.shippingInfo.country].filter(Boolean).join(', ')}
              </div>
            </div>` : ''}

            <!-- Need Help -->
            <div class="glass-card" style="padding:1.25rem;text-align:center;">
              <i data-lucide="headphones" style="width:28px;height:28px;color:var(--primary);margin-bottom:.5rem;"></i>
              <p class="text-sm text-secondary">Need help with your order?</p>
              <a href="#/contact" class="btn btn-ghost btn-sm" style="margin-top:.5rem;">Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  // Initial render
  renderPage(order);

  // Real-time listener for this specific order
  function handleStatusUpdate(data) {
    if (data.id !== orderId) return;

    // Merge updates into our local order object
    order.status = data.status || order.status;
    if (data.trackingNumber !== undefined) order.trackingNumber = data.trackingNumber;
    if (data.estimatedDelivery !== undefined) order.estimatedDelivery = data.estimatedDelivery;
    if (data.history) order.history = data.history;
    if (data.paymentStatus) order.paymentStatus = data.paymentStatus;

    // Re-render with updated state
    renderPage(order);

    // Show toast notification
    const label = STATUS_LABEL[data.status] || data.status;
    showTrackingToast(`Your order is now: <strong>${label}</strong>`, '🎉');
  }

  socketManager.on('order:status_update', handleStatusUpdate);

  // On reconnect, re-fetch latest state
  socketManager.on('connection', async (connected) => {
    if (connected) {
      try {
        const res = await fetch(`${API}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          order = await res.json();
          renderPage(order);
        }
      } catch(e) {}
    }
  });
}

function showTrackingToast(msg, emoji = '📦') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast toast-order';
  t.style.cssText = 'animation:slideInRight 0.35s forwards;';
  t.innerHTML = `
    <div class="toast-icon">${emoji}</div>
    <div class="toast-content">${msg}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'slideOutRight 0.3s forwards';
    setTimeout(() => t.remove(), 300);
  }, 6000);
}
