import { store } from '../store.js';

const API_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API = API_URL;

export function DashboardPage(container, params = {}) {
  const token = localStorage.getItem('ck_token');
  if (!token) {
    sessionStorage.setItem('ck_redirect_after_login', '/dashboard');
    window.location.hash = '/login';
    return;
  }

  // Active navigation tab (default: 'profile')
  const validTabs = ['profile', 'orders', 'wishlist', 'addresses', 'payments', 'rewards', 'notifications', 'security', 'support'];
  let currentTab = params.tab || 'profile';
  if (!validTabs.includes(currentTab)) {
    currentTab = 'profile';
  }

  // State caches
  let userProfile = store.get('user') || {};
  let addressesList = [];
  let wishlistItems = [];
  let paymentMethods = [];
  let rewardsData = { superCoins: 120, coupons: [] };
  let notificationsList = [];
  let userOrders = store.get('orders') || [];

  // Edit states
  let isEditingProfile = false;
  let orderSearchFilter = '';
  let orderStatusFilter = 'all';

  // Helper: show toast
  function showLocalToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      alert(message);
      return;
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} reveal`;
    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-triangle';

    toast.innerHTML = `
      <div class="toast-icon"><i data-lucide="${icon}"></i></div>
      <div class="toast-content">${message}</div>
      <button class="toast-close" onclick="this.parentElement.remove()"><i data-lucide="x"></i></button>
    `;
    toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Fetch initial data
  async function loadInitialData() {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Parallel fetch for speed
      const [profRes, addrRes, wishRes, payRes, rewRes, notifRes, ordersRes] = await Promise.allSettled([
        fetch(`${API}/api/users/profile`, { headers }),
        fetch(`${API}/api/users/addresses`, { headers }),
        fetch(`${API}/api/users/wishlist`, { headers }),
        fetch(`${API}/api/users/payment-methods`, { headers }),
        fetch(`${API}/api/users/rewards`, { headers }),
        fetch(`${API}/api/notifications`, { headers }),
        fetch(`${API}/api/orders`, { headers })
      ]);

      if (profRes.status === 'fulfilled' && profRes.value.ok) {
        userProfile = await profRes.value.json();
        const storedUser = JSON.parse(localStorage.getItem('ck_user') || '{}');
        const merged = { ...storedUser, ...userProfile, loggedIn: true };
        localStorage.setItem('ck_user', JSON.stringify(merged));
        store.set('user', merged);
      }

      if (addrRes.status === 'fulfilled' && addrRes.value.ok) {
        addressesList = await addrRes.value.json();
      }

      if (wishRes.status === 'fulfilled' && wishRes.value.ok) {
        wishlistItems = await wishRes.value.json();
      }

      if (payRes.status === 'fulfilled' && payRes.value.ok) {
        paymentMethods = await payRes.value.json();
      }

      if (rewRes.status === 'fulfilled' && rewRes.value.ok) {
        rewardsData = await rewRes.value.json();
      }

      if (notifRes.status === 'fulfilled' && notifRes.value.ok) {
        notificationsList = await notifRes.value.json();
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        userOrders = await ordersRes.value.json();
        store.set('orders', userOrders);
      }
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      render();
    }
  }

  // Navigation switch
  window.switchProfileTab = (tab) => {
    currentTab = tab;
    isEditingProfile = false;
    window.location.hash = `/dashboard?tab=${tab}`;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Avatar presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80'
  ];

  // ==========================================================
  // TAB RENDERERS
  // ==========================================================

  // 1. My Profile Tab
  function renderProfileTab() {
    const name = userProfile.name || 'Maker';
    const email = userProfile.email || '—';
    const phone = userProfile.phone || '';
    const gender = userProfile.gender || '';
    const dob = userProfile.dob || '';
    const college = userProfile.college || '';
    const address = userProfile.address || '';

    return `
      <div class="fk-content-card">
        <div class="fk-card-header">
          <div>
            <h3 class="fk-card-title">
              <i data-lucide="user" style="width:20px; color:#2874f0;"></i>
              Personal Information
            </h3>
            <p class="fk-card-subtitle">Manage your personal details, verified contacts, and organization.</p>
          </div>
          <div>
            ${!isEditingProfile
              ? `<button class="fk-btn-secondary" onclick="window.toggleEditProfile(true)">
                  <i data-lucide="edit-3" style="width:14px;"></i> Edit Details
                 </button>`
              : `<button class="fk-btn-secondary" onclick="window.toggleEditProfile(false)" style="color:#6b7280; border-color:#d1d5db;">
                  Cancel
                 </button>`
            }
          </div>
        </div>

        <form id="fk-profile-form" onsubmit="window.saveProfileForm(event)">
          <!-- Name Section -->
          <div class="fk-form-section">
            <div class="fk-form-section-header">
              <span class="fk-form-section-title">
                <i data-lucide="badge-check" style="width:16px; color:#2874f0;"></i>
                Full Name
              </span>
            </div>
            <div class="fk-form-grid-2">
              <div class="fk-form-group">
                <label class="fk-label">Full Name</label>
                <input 
                  type="text" 
                  id="prof-name" 
                  class="fk-input" 
                  value="${name}" 
                  ${!isEditingProfile ? 'disabled' : ''} 
                  required 
                  placeholder="Enter full name"
                />
              </div>
              <div class="fk-form-group">
                <label class="fk-label">College / Organization</label>
                <input 
                  type="text" 
                  id="prof-college" 
                  class="fk-input" 
                  value="${college}" 
                  ${!isEditingProfile ? 'disabled' : ''} 
                  placeholder="e.g. IIT Bombay / Robotics Club"
                />
              </div>
            </div>

            <!-- Gender -->
            <div class="fk-form-group" style="margin-top:10px;">
              <label class="fk-label">Your Gender</label>
              <div class="fk-gender-selector">
                <div 
                  class="fk-gender-pill ${gender === 'Male' ? 'selected' : ''}" 
                  onclick="${isEditingProfile ? "window.selectGender('Male')" : ''}"
                  style="${!isEditingProfile ? 'cursor:default; opacity:0.85;' : ''}"
                >
                  Male
                </div>
                <div 
                  class="fk-gender-pill ${gender === 'Female' ? 'selected' : ''}" 
                  onclick="${isEditingProfile ? "window.selectGender('Female')" : ''}"
                  style="${!isEditingProfile ? 'cursor:default; opacity:0.85;' : ''}"
                >
                  Female
                </div>
                <div 
                  class="fk-gender-pill ${gender === 'Other' ? 'selected' : ''}" 
                  onclick="${isEditingProfile ? "window.selectGender('Other')" : ''}"
                  style="${!isEditingProfile ? 'cursor:default; opacity:0.85;' : ''}"
                >
                  Other
                </div>
              </div>
              <input type="hidden" id="prof-gender" value="${gender}" />
            </div>

            <!-- Date of Birth -->
            <div class="fk-form-group" style="margin-top:14px; max-width:320px;">
              <label class="fk-label">Date of Birth (Optional)</label>
              <input 
                type="date" 
                id="prof-dob" 
                class="fk-input" 
                value="${dob}" 
                ${!isEditingProfile ? 'disabled' : ''} 
              />
            </div>
          </div>

          <!-- Email Section -->
          <div class="fk-form-section">
            <div class="fk-form-section-header">
              <span class="fk-form-section-title">
                <i data-lucide="mail" style="width:16px; color:#2874f0;"></i>
                Email Address
              </span>
              <span class="fk-verified-chip">
                <i data-lucide="shield-check" style="width:12px;"></i> Verified
              </span>
            </div>
            <div class="fk-form-group" style="max-width:440px;">
              <input type="email" class="fk-input" value="${email}" disabled />
              <small style="color:#6b7280; font-size:11.5px; margin-top:4px; display:block;">
                Your primary login email cannot be directly changed here. Contact support if needed.
              </small>
            </div>
          </div>

          <!-- Phone Number Section -->
          <div class="fk-form-section">
            <div class="fk-form-section-header">
              <span class="fk-form-section-title">
                <i data-lucide="phone" style="width:16px; color:#2874f0;"></i>
                Mobile Number
              </span>
              <span class="fk-verified-chip">
                <i data-lucide="check" style="width:12px;"></i> Verified
              </span>
            </div>
            <div class="fk-form-group" style="max-width:440px;">
              <div style="display:flex; gap:8px;">
                <input type="text" class="fk-input" value="+91" disabled style="width:64px; text-align:center;" />
                <input 
                  type="tel" 
                  id="prof-phone" 
                  class="fk-input" 
                  value="${phone}" 
                  ${!isEditingProfile ? 'disabled' : ''} 
                  placeholder="10-digit mobile number"
                  maxlength="10"
                />
              </div>
            </div>
          </div>

          <!-- Primary Delivery Address Note -->
          <div class="fk-form-section">
            <div class="fk-form-section-header">
              <span class="fk-form-section-title">
                <i data-lucide="map-pin" style="width:16px; color:#2874f0;"></i>
                Primary Address Summary
              </span>
              <a href="#/dashboard?tab=addresses" class="fk-edit-trigger-link">Manage All Addresses →</a>
            </div>
            <div class="fk-form-group">
              <textarea 
                id="prof-address" 
                class="fk-input" 
                rows="2" 
                ${!isEditingProfile ? 'disabled' : ''} 
                placeholder="House / Flat / Area, City, Pincode"
              >${address}</textarea>
            </div>
          </div>

          ${isEditingProfile ? `
            <div class="fk-form-actions" style="border-top:1px solid #f1f5f9; padding-top:18px;">
              <button type="submit" id="prof-save-btn" class="fk-btn-primary">
                <i data-lucide="save" style="width:15px;"></i> Save Changes
              </button>
              <button type="button" class="fk-btn-secondary" onclick="window.toggleEditProfile(false)">
                Cancel
              </button>
            </div>
          ` : ''}
        </form>

        <!-- FAQs Section like Flipkart -->
        <div class="fk-profile-faq">
          <h4>FAQs about Profile Information</h4>
          <div class="fk-faq-item">
            <div class="fk-faq-q">What happens when I update my email address or mobile number?</div>
            <div class="fk-faq-a">Your login email remains linked with your account history and past orders. Mobile number updates take effect immediately for SMS dispatch notifications and OTP verifications.</div>
          </div>
          <div class="fk-faq-item">
            <div class="fk-faq-q">What is CircuitKart Plus Membership?</div>
            <div class="fk-faq-a">Plus members receive priority hardware testing, early access to new IoT releases, free express shipping on orders over ₹499, and 2x SuperCoins rewards.</div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. My Orders Tab
  function renderOrdersTab() {
    let filteredOrders = [...userOrders];

    // Status filter
    if (orderStatusFilter !== 'all') {
      if (orderStatusFilter === 'active') {
        filteredOrders = filteredOrders.filter(o => ['placed', 'payment_confirmed', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'].includes(o.status));
      } else if (orderStatusFilter === 'delivered') {
        filteredOrders = filteredOrders.filter(o => o.status === 'delivered');
      } else if (orderStatusFilter === 'cancelled') {
        filteredOrders = filteredOrders.filter(o => ['cancelled', 'payment_failed', 'returned', 'refunded'].includes(o.status));
      }
    }

    // Search filter
    if (orderSearchFilter.trim()) {
      const q = orderSearchFilter.toLowerCase();
      filteredOrders = filteredOrders.filter(o => {
        const idMatch = o.id.toLowerCase().includes(q);
        const itemMatch = Array.isArray(o.items) && o.items.some(i => (i.name || '').toLowerCase().includes(q));
        return idMatch || itemMatch;
      });
    }

    const STATUS_MAP = {
      placed: { label: 'Order Placed', color: '#0284c7', bg: '#e0f2fe' },
      payment_confirmed: { label: 'Payment Confirmed', color: '#7c3aed', bg: '#ede9fe' },
      confirmed: { label: 'Confirmed', color: '#2563eb', bg: '#eff6ff' },
      processing: { label: 'Processing Circuit', color: '#d97706', bg: '#fef3c7' },
      packed: { label: 'Packed & Ready', color: '#ea580c', bg: '#ffedd5' },
      shipped: { label: 'Shipped', color: '#9333ea', bg: '#f3e8ff' },
      out_for_delivery: { label: 'Out for Delivery', color: '#0891b2', bg: '#cffafe' },
      delivered: { label: 'Delivered', color: '#16a34a', bg: '#dcfce7' },
      cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' },
      returned: { label: 'Returned', color: '#d97706', bg: '#fef3c7' },
      refunded: { label: 'Refunded', color: '#16a34a', bg: '#dcfce7' },
    };

    return `
      <div class="fk-content-card">
        <div class="fk-card-header">
          <div>
            <h3 class="fk-card-title">
              <i data-lucide="package" style="width:20px; color:#2874f0;"></i>
              My Orders (${userOrders.length})
            </h3>
            <p class="fk-card-subtitle">Track orders, download GST invoices, or request technical support.</p>
          </div>
          <div>
            <a href="#/projects" class="fk-btn-primary">
              <i data-lucide="shopping-bag" style="width:14px;"></i> Explore Kits
            </a>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="fk-orders-filter-bar">
          <div class="fk-order-search-box">
            <i data-lucide="search" class="fk-order-search-icon" style="width:16px;"></i>
            <input 
              type="text" 
              placeholder="Search by Order ID or Project name..." 
              value="${orderSearchFilter}" 
              oninput="window.handleOrderSearch(this.value)"
            />
          </div>
          <div class="fk-order-status-tabs">
            <button class="fk-status-tab-btn ${orderStatusFilter === 'all' ? 'active' : ''}" onclick="window.filterOrdersByStatus('all')">
              All Orders
            </button>
            <button class="fk-status-tab-btn ${orderStatusFilter === 'active' ? 'active' : ''}" onclick="window.filterOrdersByStatus('active')">
              On the Way
            </button>
            <button class="fk-status-tab-btn ${orderStatusFilter === 'delivered' ? 'active' : ''}" onclick="window.filterOrdersByStatus('delivered')">
              Delivered
            </button>
            <button class="fk-status-tab-btn ${orderStatusFilter === 'cancelled' ? 'active' : ''}" onclick="window.filterOrdersByStatus('cancelled')">
              Cancelled
            </button>
          </div>
        </div>

        ${filteredOrders.length === 0 ? `
          <div class="fk-empty-state">
            <i data-lucide="package" class="fk-empty-icon"></i>
            <h3>No Orders Found</h3>
            <p>${orderSearchFilter ? 'No orders matched your search criteria.' : "You haven't placed any electronics orders yet."}</p>
            <a href="#/projects" class="fk-btn-primary">
              <i data-lucide="arrow-right" style="width:14px;"></i> Browse Store Catalog
            </a>
          </div>
        ` : `
          <div class="fk-orders-list">
            ${filteredOrders.map(order => {
              const statusCfg = STATUS_MAP[order.status] || { label: order.status, color: '#4b5563', bg: '#f3f4f6' };
              const items = Array.isArray(order.items) ? order.items : [];
              const firstItem = items[0] || {};
              const defaultImg = firstItem.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&q=80';
              const formattedDate = order.date ? new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';

              return `
                <div class="fk-order-card">
                  <div class="fk-order-header">
                    <div class="fk-order-id-meta">
                      <span class="fk-order-id-badge">${order.id}</span>
                      <span>Placed on ${formattedDate}</span>
                    </div>
                    <div>
                      <span class="fk-order-status-pill" style="color:${statusCfg.color}; background:${statusCfg.bg};">
                        <span style="width:7px; height:7px; border-radius:50%; background:${statusCfg.color};"></span>
                        ${statusCfg.label}
                      </span>
                    </div>
                  </div>

                  <div class="fk-order-body">
                    <img src="${defaultImg}" alt="Product" class="fk-order-thumb" onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&q=80'" />
                    <div>
                      <h4 class="fk-order-title">${firstItem.name || 'Hardware Project Kit'}</h4>
                      <p class="fk-order-desc">
                        ${items.length > 1 ? `+ ${items.length - 1} other item${items.length > 2 ? 's' : ''} • ` : ''}
                        Payment: <strong>${order.paymentMethod || 'UPI'}</strong> • Status: <strong>${order.paymentStatus || 'Paid'}</strong>
                      </p>
                      <div class="fk-order-price">₹${Number(order.total || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div class="fk-order-actions-col">
                      <a href="#/track/${order.id}" class="fk-btn-primary" style="padding:7px 14px; font-size:12.5px; text-decoration:none;">
                        <i data-lucide="navigation" style="width:13px;"></i> Track Delivery
                      </a>
                      <a href="#/invoice/${order.id}" class="fk-btn-secondary" style="padding:6px 12px; font-size:12px; text-decoration:none;">
                        <i data-lucide="file-text" style="width:13px;"></i> Invoice
                      </a>
                      <button class="fk-address-action-btn" onclick="window.openReviewModal('${order.id}', '${(firstItem.name || 'Project Kit').replace(/'/g, "\\'")}')">
                        <i data-lucide="star" style="width:13px;"></i> Rate & Review
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  // 3. My Wishlist Tab
  function renderWishlistTab() {
    return `
      <div class="fk-content-card">
        <div class="fk-card-header">
          <div>
            <h3 class="fk-card-title">
              <i data-lucide="heart" style="width:20px; color:#ef4444;"></i>
              My Wishlist (${wishlistItems.length})
            </h3>
            <p class="fk-card-subtitle">Saved IoT projects, DIY circuits, and component bundles.</p>
          </div>
          <div>
            <a href="#/projects" class="fk-btn-secondary">
              <i data-lucide="plus" style="width:14px;"></i> Add More Projects
            </a>
          </div>
        </div>

        ${wishlistItems.length === 0 ? `
          <div class="fk-empty-state">
            <i data-lucide="heart" class="fk-empty-icon" style="color:#fca5a5;"></i>
            <h3>Your Wishlist is Empty</h3>
            <p>Save items you'd love to build later and they will appear here.</p>
            <a href="#/projects" class="fk-btn-primary">
              <i data-lucide="compass" style="width:14px;"></i> Explore Trending DIY Projects
            </a>
          </div>
        ` : `
          <div class="fk-wishlist-grid">
            ${wishlistItems.map(item => {
              const origPrice = Math.round(item.price * 1.3);
              const link = item.type === 'iot' ? `#/iot-project/${item.slug || item.id}` : `#/project/${item.slug || item.id}`;

              return `
                <div class="fk-wishlist-card">
                  <div class="fk-wishlist-img-wrap">
                    <img 
                      src="${item.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80'}" 
                      alt="${item.name}" 
                      class="fk-wishlist-img"
                      onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80'"
                    />
                    <button 
                      class="fk-wishlist-delete-btn" 
                      title="Remove from Wishlist" 
                      onclick="window.confirmDeleteWishlist('${item.projectId || item.id}', '${item.name.replace(/'/g, "\\'")}')"
                    >
                      <i data-lucide="trash-2" style="width:15px;"></i>
                    </button>
                  </div>

                  <div>
                    <a href="${link}" style="text-decoration:none;">
                      <h4 class="fk-wishlist-title">${item.name}</h4>
                    </a>
                    <div class="fk-wishlist-price-row">
                      <span class="fk-wishlist-price">₹${Number(item.price).toLocaleString('en-IN')}</span>
                      <span class="fk-wishlist-original-price">₹${origPrice.toLocaleString('en-IN')}</span>
                      <span class="fk-wishlist-discount">25% off</span>
                    </div>
                  </div>

                  <button 
                    class="fk-btn-primary" 
                    style="width:100%; justify-content:center; padding:9px; font-size:13px;"
                    onclick="window.moveWishlistToCart('${item.projectId || item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price}, '${item.image || ''}')"
                  >
                    <i data-lucide="shopping-cart" style="width:14px;"></i> Move to Cart
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  // 4. Saved Addresses Tab
  function renderAddressesTab() {
    return `
      <div class="fk-content-card">
        <div class="fk-card-header">
          <div>
            <h3 class="fk-card-title">
              <i data-lucide="map-pin" style="width:20px; color:#2874f0;"></i>
              Manage Addresses (${addressesList.length})
            </h3>
            <p class="fk-card-subtitle">Manage shipping addresses for fast and seamless checkout.</p>
          </div>
        </div>

        <!-- Add Address Button / Trigger -->
        <div class="fk-add-address-card-trigger" onclick="window.openAddressModal()">
          <i data-lucide="plus-circle" style="width:18px;"></i>
          <span>ADD A NEW ADDRESS</span>
        </div>

        ${addressesList.length === 0 ? `
          <div class="fk-empty-state">
            <i data-lucide="map-pin" class="fk-empty-icon"></i>
            <h3>No Addresses Saved</h3>
            <p>Save your home and college/lab addresses for 1-click order placement.</p>
          </div>
        ` : `
          <div class="fk-addresses-list">
            ${addressesList.map(addr => `
              <div class="fk-address-card ${addr.isDefault ? 'is-default' : ''}">
                <div class="fk-address-header">
                  <div>
                    <span class="fk-address-tag">${addr.type || 'HOME'}</span>
                    ${addr.isDefault ? `<span class="fk-address-default-badge">DEFAULT ADDRESS</span>` : ''}
                  </div>
                  <div>
                    ${!addr.isDefault ? `
                      <button class="fk-address-action-btn" onclick="window.setDefaultAddress(${addr.id})">
                        Set as Default
                      </button>
                    ` : ''}
                  </div>
                </div>

                <div class="fk-address-name-row">
                  <span class="fk-address-name">${addr.name}</span>
                  <span class="fk-address-phone">+91 ${addr.phone}</span>
                </div>

                <div class="fk-address-text">
                  ${addr.address}${addr.locality ? `, ${addr.locality}` : ''}${addr.landmark ? `, Near ${addr.landmark}` : ''}, 
                  <strong>${addr.city}</strong>, ${addr.state} - <strong>${addr.pincode}</strong>
                </div>

                <div class="fk-address-actions">
                  <button class="fk-address-action-btn" onclick="window.editAddressModal(${addr.id})">
                    <i data-lucide="edit-2" style="width:13px;"></i> Edit
                  </button>
                  <button class="fk-address-action-btn danger" onclick="window.confirmDeleteAddress(${addr.id}, '${addr.name.replace(/'/g, "\\'")}')">
                    <i data-lucide="trash-2" style="width:13px;"></i> Delete
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  // 5. Payment Methods Tab
  function renderPaymentsTab() {
    return `
      <div class="fk-content-card">
        <div class="fk-card-header">
          <div>
            <h3 class="fk-card-title">
              <i data-lucide="credit-card" style="width:20px; color:#2874f0;"></i>
              Payment Methods & UPI
            </h3>
            <p class="fk-card-subtitle">Manage saved debit/credit cards and verified UPI IDs for instant checkout.</p>
          </div>
          <div>
            <button class="fk-btn-secondary" onclick="window.openPaymentModal()">
              <i data-lucide="plus" style="width:14px;"></i> Add Payment Method
            </button>
          </div>
        </div>

        ${paymentMethods.length === 0 ? `
          <div class="fk-payment-card" style="background:#fbfdff;">
            <div class="fk-payment-left">
              <div class="fk-payment-icon" style="color:#0284c7; background:#e0f2fe;">UPI</div>
              <div class="fk-payment-info">
                <h4>Verified UPI (Instant Payment)</h4>
                <p>Support for Google Pay, PhonePe, Paytm, and BHIM QR</p>
              </div>
            </div>
            <div>
              <span class="fk-verified-chip"><i data-lucide="check" style="width:12px;"></i> Ready</span>
            </div>
          </div>

          <div class="fk-empty-state" style="padding:24px 10px;">
            <i data-lucide="credit-card" class="fk-empty-icon" style="width:48px; height:48px;"></i>
            <h3>No Custom Cards Saved Yet</h3>
            <p>Save cards securely according to RBI Tokenization Guidelines for fast checkouts.</p>
          </div>
        ` : `
          <div class="fk-payments-list">
            ${paymentMethods.map(pm => `
              <div class="fk-payment-card">
                <div class="fk-payment-left">
                  <div class="fk-payment-icon">${pm.type === 'upi' ? 'UPI' : 'CARD'}</div>
                  <div class="fk-payment-info">
                    <h4>${pm.title || 'Payment Method'}</h4>
                    <p>${pm.maskedNumber} ${pm.expiry ? `• Exp: ${pm.expiry}` : ''}</p>
                  </div>
                </div>
                <div>
                  <button class="fk-address-action-btn danger" onclick="window.deletePaymentMethod(${pm.id})">
                    <i data-lucide="trash-2" style="width:14px;"></i> Delete
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}

        <div class="fk-pci-badge-box">
          <i data-lucide="shield-check" style="width:20px; color:#16a34a; flex-shrink:0;"></i>
          <span>
            <strong>100% PCI-DSS Compliant & Encrypted:</strong> CircuitKart never stores your full card number, CVV, or net banking passwords. Your data is protected by bank-grade 256-bit SSL encryption.
          </span>
        </div>
      </div>
    `;
  }

  // 6. Coupons & Rewards Tab
  function renderRewardsTab() {
    const coins = rewardsData.superCoins || 120;
    const coupons = rewardsData.coupons || [];

    return `
      <div class="fk-content-card">
        <!-- Rewards Hero Banner -->
        <div class="fk-rewards-hero">
          <div class="fk-rewards-hero-left">
            <h3>SuperCoins Balance</h3>
            <p>Use SuperCoins to get instant discounts on IoT project components and firmware codes.</p>
          </div>
          <div class="fk-coins-big-stat">
            <span class="fk-plus-coin-icon" style="width:40px; height:40px; font-size:20px;">🪙</span>
            <span>${coins} Coins</span>
          </div>
        </div>

        <div class="fk-card-header" style="margin-top:10px;">
          <div>
            <h3 class="fk-card-title">
              <i data-lucide="ticket" style="width:20px; color:#ea580c;"></i>
              Available Coupons & Vouchers (${coupons.length})
            </h3>
            <p class="fk-card-subtitle">Apply these promo codes at checkout to unlock savings on your orders.</p>
          </div>
        </div>

        <div class="fk-coupons-list">
          ${coupons.map(c => `
            <div class="fk-coupon-card">
              <div>
                <span class="fk-coupon-code-chip">${c.code}</span>
                <h4 style="margin:2px 0 4px; font-size:14.5px; font-weight:700; color:#111827;">${c.title}</h4>
                <p style="margin:0; font-size:12.5px; color:#6b7280;">${c.desc}</p>
                <div style="font-size:11.5px; color:#9ca3af; margin-top:6px;">
                  Expires on: <strong>${c.expiry}</strong> • Min order: <strong>₹${c.minOrder}</strong>
                </div>
              </div>
              <div>
                <button class="fk-copy-code-btn" onclick="window.copyCouponCode('${c.code}')">
                  TAP TO COPY
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 7. Notifications Tab
  function renderNotificationsTab() {
    return `
      <div class="fk-content-card">
        <div class="fk-card-header">
          <div>
            <h3 class="fk-card-title">
              <i data-lucide="bell" style="width:20px; color:#2874f0;"></i>
              Notifications & Alerts
            </h3>
            <p class="fk-card-subtitle">Stay updated on your hardware dispatches and tech alerts.</p>
          </div>
          <div>
            <button class="fk-btn-secondary" onclick="window.markAllNotifsRead()">
              <i data-lucide="check-check" style="width:14px;"></i> Mark All as Read
            </button>
          </div>
        </div>

        <!-- Notification Preferences -->
        <div style="background:#fafafa; border:1px solid #f1f5f9; border-radius:10px; padding:16px 20px; margin-bottom:24px;">
          <h4 style="margin:0 0 10px; font-size:13.5px; font-weight:700; color:#111827;">Notification Channels</h4>
          
          <div class="fk-switch-row">
            <div class="fk-switch-label">
              <h4>Order & Dispatch Alerts</h4>
              <p>Receive real-time courier tracking updates via SMS & Email</p>
            </div>
            <label class="fk-toggle-switch">
              <input type="checkbox" checked onchange="window.showToggleToast('Order alerts updated')" />
              <span class="fk-slider"></span>
            </label>
          </div>

          <div class="fk-switch-row">
            <div class="fk-switch-label">
              <h4>WhatsApp Updates</h4>
              <p>Instant tracking link and delivery status on WhatsApp</p>
            </div>
            <label class="fk-toggle-switch">
              <input type="checkbox" checked onchange="window.showToggleToast('WhatsApp notifications updated')" />
              <span class="fk-slider"></span>
            </label>
          </div>

          <div class="fk-switch-row" style="border-bottom:none;">
            <div class="fk-switch-label">
              <h4>Maker News & Flash Discounts</h4>
              <p>Weekly updates on new ESP32, Arduino & Raspberry Pi projects</p>
            </div>
            <label class="fk-toggle-switch">
              <input type="checkbox" onchange="window.showToggleToast('Promotional alerts updated')" />
              <span class="fk-slider"></span>
            </label>
          </div>
        </div>

        <!-- Notifications List -->
        <h4 style="margin:0 0 12px; font-size:14px; font-weight:700; color:#111827;">Recent Activity</h4>
        ${notificationsList.length === 0 ? `
          <div class="fk-empty-state" style="padding:32px 10px;">
            <i data-lucide="bell" class="fk-empty-icon"></i>
            <h3>No New Notifications</h3>
            <p>You're all caught up! Order dispatches and alerts will appear here.</p>
          </div>
        ` : `
          <div class="fk-notifs-list">
            ${notificationsList.map(n => `
              <div class="fk-notif-item ${!n.isRead ? 'unread' : ''}">
                <div class="fk-notif-icon">
                  <i data-lucide="${n.type === 'order' ? 'package' : 'info'}" style="width:18px;"></i>
                </div>
                <div class="fk-notif-content" style="flex:1;">
                  <h4>${n.title || 'CircuitKart Notification'}</h4>
                  <p>${n.message}</p>
                  <span class="fk-notif-time">${new Date(n.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  // 8. Login & Security Tab
  function renderSecurityTab() {
    return `
      <div class="fk-content-card">
        <div class="fk-card-header">
          <div>
            <h3 class="fk-card-title">
              <i data-lucide="shield" style="width:20px; color:#16a34a;"></i>
              Login & Security
            </h3>
            <p class="fk-card-subtitle">Manage your password, two-factor authentication, and active sessions.</p>
          </div>
        </div>

        <!-- Change Password Box -->
        <div class="fk-security-item">
          <div class="fk-security-item-header">
            <span class="fk-security-title">
              <i data-lucide="key" style="width:16px; color:#2874f0;"></i> Change Password
            </span>
          </div>
          <form id="fk-change-pwd-form" onsubmit="window.submitChangePassword(event)" style="max-width:440px; margin-top:14px;">
            <div class="fk-form-group">
              <label class="fk-label">Current Password</label>
              <div style="position:relative;">
                <input type="password" id="sec-curr-pwd" class="fk-input" required placeholder="Enter current password" />
              </div>
            </div>
            <div class="fk-form-group">
              <label class="fk-label">New Password (min 6 characters)</label>
              <input type="password" id="sec-new-pwd" class="fk-input" required minlength="6" placeholder="Enter new password" />
            </div>
            <div class="fk-form-group">
              <label class="fk-label">Confirm New Password</label>
              <input type="password" id="sec-conf-pwd" class="fk-input" required minlength="6" placeholder="Confirm new password" />
            </div>
            <button type="submit" id="sec-pwd-btn" class="fk-btn-primary" style="margin-top:8px;">
              <i data-lucide="lock" style="width:14px;"></i> Update Password
            </button>
          </form>
        </div>

        <!-- 2FA Box -->
        <div class="fk-security-item">
          <div class="fk-security-item-header">
            <span class="fk-security-title">
              <i data-lucide="smartphone" style="width:16px; color:#2874f0;"></i> Two-Factor Authentication (2FA)
            </span>
            <span class="fk-verified-chip" style="background:#e0f2fe; color:#0284c7; border-color:#bae6fd;">
              SMS OTP Enabled
            </span>
          </div>
          <p style="margin:4px 0 10px; font-size:13px; color:#6b7280;">
            Protect your CircuitKart account from unauthorized access with SMS verification during checkout and profile modifications.
          </p>
        </div>

        <!-- Active Sessions Box -->
        <div class="fk-security-item">
          <div class="fk-security-item-header">
            <span class="fk-security-title">
              <i data-lucide="laptop" style="width:16px; color:#2874f0;"></i> Active Logged-in Devices
            </span>
            <button class="fk-btn-secondary" style="font-size:11.5px; padding:4px 10px;" onclick="window.logoutOtherSessions()">
              Log out other devices
            </button>
          </div>
          <table class="fk-sessions-table">
            <thead>
              <tr>
                <th>Device & Browser</th>
                <th>Location / IP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Windows PC • Chrome</strong></td>
                <td>India (Current Device)</td>
                <td><span class="fk-verified-chip"><i data-lucide="circle" style="width:8px; fill:#16a34a;"></i> Active Now</span></td>
              </tr>
              <tr>
                <td><strong>Android Mobile • Chrome</strong></td>
                <td>Bangalore, India</td>
                <td><span style="color:#6b7280; font-size:12px;">Active 2 hrs ago</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 9. Help & Support Tab
  function renderSupportTab() {
    return `
      <div class="fk-content-card">
        <div class="fk-card-header">
          <div>
            <h3 class="fk-card-title">
              <i data-lucide="help-circle" style="width:20px; color:#2874f0;"></i>
              24x7 Customer Support & Help Desk
            </h3>
            <p class="fk-card-subtitle">Get instant help with order delivery, circuit assembly, and hardware troubleshooting.</p>
          </div>
        </div>

        <!-- Support Channels Grid -->
        <div class="fk-support-grid">
          <div class="fk-support-card">
            <div class="fk-support-icon"><i data-lucide="phone-call" style="width:22px;"></i></div>
            <h4>Toll-Free Helpline</h4>
            <p>Speak directly with our technical support and shipping engineers.</p>
            <a href="tel:18002089898" class="fk-btn-secondary" style="text-decoration:none; justify-content:center;">
              1800-208-9898
            </a>
          </div>

          <div class="fk-support-card">
            <div class="fk-support-icon"><i data-lucide="mail" style="width:22px;"></i></div>
            <h4>Email Support</h4>
            <p>Send project schematic or tracking queries. Response within 2 hours.</p>
            <a href="mailto:support@circuitkart.com" class="fk-btn-secondary" style="text-decoration:none; justify-content:center;">
              support@circuitkart.com
            </a>
          </div>

          <div class="fk-support-card">
            <div class="fk-support-icon"><i data-lucide="message-square" style="width:22px;"></i></div>
            <h4>Live Chat Support</h4>
            <p>Chat with a hardware specialist for circuit advice & order status.</p>
            <button class="fk-btn-primary" style="width:100%; justify-content:center;" onclick="window.startLiveSupportChat()">
              Start Live Chat
            </button>
          </div>
        </div>

        <!-- FAQs Accordion -->
        <h4 style="margin:20px 0 14px; font-size:15px; font-weight:700; color:#111827;">Frequently Asked Questions</h4>
        <div class="fk-faq-accordion">
          <div class="fk-faq-accordion-item">
            <div class="fk-faq-accordion-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
              <span>How do I track my delivery status in real-time?</span>
              <i data-lucide="chevron-down" style="width:16px;"></i>
            </div>
            <div class="fk-faq-accordion-body">
              Click on the "My Orders" tab on your profile, then click the "Track Delivery" button beside your order. You can view the live GPS driver location, order status milestones, and tracking number.
            </div>
          </div>

          <div class="fk-faq-accordion-item">
            <div class="fk-faq-accordion-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
              <span>What if a component or microcontroller in my kit is damaged?</span>
              <i data-lucide="chevron-down" style="width:16px;"></i>
            </div>
            <div class="fk-faq-accordion-body">
              CircuitKart provides a 7-day hassle-free replacement warranty on all electronics modules and microcontrollers. Contact support with your Order ID for a free immediate replacement.
            </div>
          </div>

          <div class="fk-faq-accordion-item">
            <div class="fk-faq-accordion-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
              <span>Where can I download the source code and circuit diagram?</span>
              <i data-lucide="chevron-down" style="width:16px;"></i>
            </div>
            <div class="fk-faq-accordion-body">
              All project documentation, circuit wiring guides, and firmware code can be downloaded directly from the IoT Projects portal or Project Details page once your order is confirmed.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================
  // MAIN RENDER FUNCTION
  // ==========================================================
  function render() {
    const fullName = userProfile.name || 'Maker';
    const email = userProfile.email || '—';
    const phone = userProfile.phone || '9876543210';
    const avatarUrl = userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2874f0&color=fff&size=150`;

    // Counts
    const ordersCount = userOrders.length;
    const pendingCount = userOrders.filter(o => ['placed', 'payment_confirmed', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'].includes(o.status)).length;
    const wishlistCount = wishlistItems.length;
    const coinsCount = rewardsData.superCoins || 120;

    container.innerHTML = `
      <div class="fk-profile-page">
        <div class="fk-container">

          <!-- Top Loyalty / SuperCoin Bar -->
          <div class="fk-top-banner">
            <div class="fk-top-banner-left">
              <div class="fk-plus-coin-icon">🪙</div>
              <div class="fk-top-banner-text">
                <h4>
                  CircuitKart Plus Member
                  <span style="font-size:11px; background:rgba(255,255,255,0.25); padding:1px 6px; border-radius:10px;">VIP</span>
                </h4>
                <p>Enjoy Free Priority Shipping & 2x SuperCoins on Embedded & IoT projects.</p>
              </div>
            </div>
            <div class="fk-coin-pill">
              <span>🪙 ${coinsCount} SuperCoins</span>
            </div>
          </div>

          <!-- Profile Header Card -->
          <div class="fk-profile-header-card">
            <div class="fk-header-user-info">
              <div class="fk-avatar-container">
                <img 
                  src="${avatarUrl}" 
                  alt="${fullName}" 
                  class="fk-avatar-img"
                  onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2874f0&color=fff&size=150'"
                />
                <button class="fk-avatar-edit-btn" title="Edit Profile Photo" onclick="window.openAvatarModal()">
                  <i data-lucide="camera" style="width:13px;"></i>
                </button>
              </div>

              <div class="fk-header-details">
                <h2>
                  Hello, ${fullName} 👋
                  <span class="fk-verified-chip">
                    <i data-lucide="shield-check" style="width:12px;"></i> Verified
                  </span>
                  <span class="fk-membership-chip">
                    <i data-lucide="star" style="width:11px; fill:#b45309;"></i> Plus Member
                  </span>
                </h2>
                <div class="fk-header-meta">
                  <div class="fk-header-meta-item">
                    <i data-lucide="mail" style="width:13px;"></i> ${email}
                  </div>
                  <div class="fk-header-meta-item">
                    <i data-lucide="phone" style="width:13px;"></i> +91 ${phone}
                  </div>
                  <div class="fk-header-meta-item">
                    <i data-lucide="calendar" style="width:13px;"></i> Joined ${userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'recently'}
                  </div>
                </div>
              </div>
            </div>

            <div class="fk-header-actions">
              <button class="fk-btn-primary" onclick="window.switchProfileTab('profile'); window.toggleEditProfile(true);">
                <i data-lucide="edit-3" style="width:14px;"></i> Edit Profile
              </button>
              <button class="fk-btn-secondary" onclick="window.confirmLogoutModal()">
                <i data-lucide="log-out" style="width:14px;"></i> Logout
              </button>
            </div>
          </div>

          <!-- Shopping Dashboard: 4 Compact KPI Summary Cards -->
          <div class="fk-kpi-grid">
            <div class="fk-kpi-card" onclick="window.switchProfileTab('orders')">
              <div class="fk-kpi-icon-box fk-kpi-icon-blue">
                <i data-lucide="package" style="width:22px;"></i>
              </div>
              <div class="fk-kpi-details">
                <h3>${ordersCount}</h3>
                <p>Total Orders</p>
              </div>
            </div>

            <div class="fk-kpi-card" onclick="window.switchProfileTab('orders'); window.filterOrdersByStatus('active');">
              <div class="fk-kpi-icon-box fk-kpi-icon-orange">
                <i data-lucide="truck" style="width:22px;"></i>
              </div>
              <div class="fk-kpi-details">
                <h3>${pendingCount}</h3>
                <p>Pending Deliveries</p>
              </div>
            </div>

            <div class="fk-kpi-card" onclick="window.switchProfileTab('wishlist')">
              <div class="fk-kpi-icon-box fk-kpi-icon-rose">
                <i data-lucide="heart" style="width:22px;"></i>
              </div>
              <div class="fk-kpi-details">
                <h3>${wishlistCount}</h3>
                <p>Wishlist Items</p>
              </div>
            </div>

            <div class="fk-kpi-card" onclick="window.switchProfileTab('rewards')">
              <div class="fk-kpi-icon-box fk-kpi-icon-amber">
                <i data-lucide="award" style="width:22px;"></i>
              </div>
              <div class="fk-kpi-details">
                <h3>${coinsCount}</h3>
                <p>SuperCoins Available</p>
              </div>
            </div>
          </div>

          <!-- Mobile Tab Navigation Bar -->
          <div class="fk-mobile-nav-bar">
            <div class="fk-mobile-nav-item ${currentTab === 'profile' ? 'active' : ''}" onclick="window.switchProfileTab('profile')">
              <i data-lucide="user" style="width:15px;"></i> Profile
            </div>
            <div class="fk-mobile-nav-item ${currentTab === 'orders' ? 'active' : ''}" onclick="window.switchProfileTab('orders')">
              <i data-lucide="package" style="width:15px;"></i> Orders (${ordersCount})
            </div>
            <div class="fk-mobile-nav-item ${currentTab === 'wishlist' ? 'active' : ''}" onclick="window.switchProfileTab('wishlist')">
              <i data-lucide="heart" style="width:15px;"></i> Wishlist (${wishlistCount})
            </div>
            <div class="fk-mobile-nav-item ${currentTab === 'addresses' ? 'active' : ''}" onclick="window.switchProfileTab('addresses')">
              <i data-lucide="map-pin" style="width:15px;"></i> Addresses
            </div>
            <div class="fk-mobile-nav-item ${currentTab === 'payments' ? 'active' : ''}" onclick="window.switchProfileTab('payments')">
              <i data-lucide="credit-card" style="width:15px;"></i> Payments
            </div>
            <div class="fk-mobile-nav-item ${currentTab === 'rewards' ? 'active' : ''}" onclick="window.switchProfileTab('rewards')">
              <i data-lucide="gift" style="width:15px;"></i> Rewards
            </div>
            <div class="fk-mobile-nav-item ${currentTab === 'notifications' ? 'active' : ''}" onclick="window.switchProfileTab('notifications')">
              <i data-lucide="bell" style="width:15px;"></i> Notifications
            </div>
            <div class="fk-mobile-nav-item ${currentTab === 'security' ? 'active' : ''}" onclick="window.switchProfileTab('security')">
              <i data-lucide="shield" style="width:15px;"></i> Security
            </div>
            <div class="fk-mobile-nav-item ${currentTab === 'support' ? 'active' : ''}" onclick="window.switchProfileTab('support')">
              <i data-lucide="help-circle" style="width:15px;"></i> Support
            </div>
          </div>

          <!-- Main Layout: Left Sidebar + Content Area -->
          <div class="fk-main-layout">
            <!-- Sidebar -->
            <div class="fk-sidebar">
              <div class="fk-sidebar-user-mini">
                <img 
                  src="${avatarUrl}" 
                  alt="${fullName}" 
                  onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2874f0&color=fff&size=150'"
                />
                <div class="fk-sidebar-user-mini-text">
                  <h5>Hello,</h5>
                  <h4>${fullName}</h4>
                </div>
              </div>

              <!-- Menu Items -->
              <div class="fk-sidebar-section-title">Account Settings</div>
              <ul class="fk-sidebar-menu">
                <li class="fk-sidebar-item ${currentTab === 'profile' ? 'active' : ''}" onclick="window.switchProfileTab('profile')">
                  <span class="fk-sidebar-item-left">
                    <i data-lucide="user"></i> My Profile
                  </span>
                </li>
                <li class="fk-sidebar-item ${currentTab === 'orders' ? 'active' : ''}" onclick="window.switchProfileTab('orders')">
                  <span class="fk-sidebar-item-left">
                    <i data-lucide="package"></i> My Orders
                  </span>
                  ${ordersCount > 0 ? `<span class="fk-sidebar-badge">${ordersCount}</span>` : ''}
                </li>
                <li class="fk-sidebar-item ${currentTab === 'wishlist' ? 'active' : ''}" onclick="window.switchProfileTab('wishlist')">
                  <span class="fk-sidebar-item-left">
                    <i data-lucide="heart"></i> My Wishlist
                  </span>
                  ${wishlistCount > 0 ? `<span class="fk-sidebar-badge fk-sidebar-badge-orange">${wishlistCount}</span>` : ''}
                </li>
                <li class="fk-sidebar-item ${currentTab === 'addresses' ? 'active' : ''}" onclick="window.switchProfileTab('addresses')">
                  <span class="fk-sidebar-item-left">
                    <i data-lucide="map-pin"></i> Saved Addresses
                  </span>
                </li>
                <li class="fk-sidebar-item ${currentTab === 'payments' ? 'active' : ''}" onclick="window.switchProfileTab('payments')">
                  <span class="fk-sidebar-item-left">
                    <i data-lucide="credit-card"></i> Payment Methods
                  </span>
                </li>
              </ul>

              <div class="fk-sidebar-section-title">Rewards & Updates</div>
              <ul class="fk-sidebar-menu">
                <li class="fk-sidebar-item ${currentTab === 'rewards' ? 'active' : ''}" onclick="window.switchProfileTab('rewards')">
                  <span class="fk-sidebar-item-left">
                    <i data-lucide="award"></i> Coupons & Rewards
                  </span>
                  <span class="fk-sidebar-badge" style="background:#ff9f00; color:#fff;">🪙 ${coinsCount}</span>
                </li>
                <li class="fk-sidebar-item ${currentTab === 'notifications' ? 'active' : ''}" onclick="window.switchProfileTab('notifications')">
                  <span class="fk-sidebar-item-left">
                    <i data-lucide="bell"></i> Notifications
                  </span>
                </li>
              </ul>

              <div class="fk-sidebar-section-title">Security & Support</div>
              <ul class="fk-sidebar-menu">
                <li class="fk-sidebar-item ${currentTab === 'security' ? 'active' : ''}" onclick="window.switchProfileTab('security')">
                  <span class="fk-sidebar-item-left">
                    <i data-lucide="shield"></i> Login & Security
                  </span>
                </li>
                <li class="fk-sidebar-item ${currentTab === 'support' ? 'active' : ''}" onclick="window.switchProfileTab('support')">
                  <span class="fk-sidebar-item-left">
                    <i data-lucide="help-circle"></i> Help & Support
                  </span>
                </li>
              </ul>

              <div class="fk-sidebar-logout" onclick="window.confirmLogoutModal()">
                <i data-lucide="log-out" style="width:17px;"></i>
                <span>Logout</span>
              </div>
            </div>

            <!-- Content Panel -->
            <div class="fk-content-area">
              ${currentTab === 'profile' ? renderProfileTab() : ''}
              ${currentTab === 'orders' ? renderOrdersTab() : ''}
              ${currentTab === 'wishlist' ? renderWishlistTab() : ''}
              ${currentTab === 'addresses' ? renderAddressesTab() : ''}
              ${currentTab === 'payments' ? renderPaymentsTab() : ''}
              ${currentTab === 'rewards' ? renderRewardsTab() : ''}
              ${currentTab === 'notifications' ? renderNotificationsTab() : ''}
              ${currentTab === 'security' ? renderSecurityTab() : ''}
              ${currentTab === 'support' ? renderSupportTab() : ''}
            </div>
          </div>

        </div>
      </div>

      <!-- Modals Container -->
      <div id="fk-modal-slot"></div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ==========================================================
  // EVENT HANDLERS & ACTIONS
  // ==========================================================

  window.toggleEditProfile = (editState) => {
    isEditingProfile = editState;
    render();
    if (editState) {
      setTimeout(() => {
        const nameInput = document.getElementById('prof-name');
        if (nameInput) nameInput.focus();
      }, 50);
    }
  };

  window.selectGender = (g) => {
    const input = document.getElementById('prof-gender');
    if (input) input.value = g;
    document.querySelectorAll('.fk-gender-pill').forEach(p => {
      p.classList.toggle('selected', p.textContent.trim() === g);
    });
  };

  window.saveProfileForm = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('prof-save-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = 'Saving...';
    }

    const payload = {
      name: document.getElementById('prof-name').value.trim(),
      phone: document.getElementById('prof-phone').value.trim(),
      college: document.getElementById('prof-college').value.trim(),
      address: document.getElementById('prof-address').value.trim(),
      gender: document.getElementById('prof-gender').value,
      dob: document.getElementById('prof-dob').value
    };

    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        userProfile = await res.json();
        const storedUser = JSON.parse(localStorage.getItem('ck_user') || '{}');
        const merged = { ...storedUser, ...userProfile, loggedIn: true };
        localStorage.setItem('ck_user', JSON.stringify(merged));
        store.set('user', merged);

        showLocalToast('Profile updated successfully!', 'success');
        isEditingProfile = false;
        render();
      } else {
        showLocalToast('Failed to update profile.', 'error');
      }
    } catch (err) {
      showLocalToast('Network error while updating profile.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="save" style="width:15px;"></i> Save Changes';
        if (window.lucide) window.lucide.createIcons();
      }
    }
  };

  // Orders Search & Filter
  window.handleOrderSearch = (val) => {
    orderSearchFilter = val;
    render();
  };

  window.filterOrdersByStatus = (status) => {
    orderStatusFilter = status;
    render();
  };

  // Wishlist Actions
  window.confirmDeleteWishlist = (projectId, name) => {
    openModal({
      title: 'Remove from Wishlist',
      body: `<p>Are you sure you want to remove <strong>${name}</strong> from your wishlist?</p>`,
      confirmText: 'Remove',
      confirmClass: 'fk-btn-primary" style="background:#dc2626;',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/api/users/wishlist/${projectId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            wishlistItems = wishlistItems.filter(i => String(i.projectId || i.id) !== String(projectId));
            showLocalToast('Item removed from wishlist', 'info');
            render();
          }
        } catch (e) {
          showLocalToast('Failed to remove item', 'error');
        }
      }
    });
  };

  window.moveWishlistToCart = async (projectId, name, price, image) => {
    store.addToCart({
      id: projectId,
      name,
      price,
      image,
      quantity: 1
    });

    // Also remove from wishlist
    try {
      await fetch(`${API}/api/users/wishlist/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      wishlistItems = wishlistItems.filter(i => String(i.projectId || i.id) !== String(projectId));
    } catch (e) {}

    showLocalToast(`Added "${name}" to cart!`, 'success');
    render();
  };

  // Address Actions
  window.openAddressModal = (addr = null) => {
    const isEdit = !!addr;
    const name = addr ? addr.name : (userProfile.name || '');
    const phone = addr ? addr.phone : (userProfile.phone || '');
    const pincode = addr ? addr.pincode : '';
    const locality = addr ? addr.locality : '';
    const street = addr ? addr.address : '';
    const city = addr ? addr.city : '';
    const state = addr ? addr.state : '';
    const landmark = addr ? addr.landmark : '';
    const altPhone = addr ? addr.alternatePhone : '';
    const type = addr ? addr.type : 'HOME';
    const isDef = addr ? addr.isDefault : false;

    const modalHtml = `
      <form id="fk-address-form" onsubmit="window.saveAddressSubmit(event, ${isEdit ? addr.id : 'null'})">
        <div class="fk-form-grid-2">
          <div class="fk-form-group">
            <label class="fk-label">Full Name *</label>
            <input type="text" id="addr-name" class="fk-input" required value="${name}" placeholder="Recipient name" />
          </div>
          <div class="fk-form-group">
            <label class="fk-label">10-Digit Mobile *</label>
            <input type="tel" id="addr-phone" class="fk-input" required maxlength="10" value="${phone}" placeholder="Phone number" />
          </div>
        </div>

        <div class="fk-form-grid-2">
          <div class="fk-form-group">
            <label class="fk-label">Pincode *</label>
            <input type="text" id="addr-pincode" class="fk-input" required maxlength="6" value="${pincode}" placeholder="6 digits PIN" />
          </div>
          <div class="fk-form-group">
            <label class="fk-label">Locality / Sector</label>
            <input type="text" id="addr-locality" class="fk-input" value="${locality}" placeholder="e.g. HSR Layout Sector 2" />
          </div>
        </div>

        <div class="fk-form-group">
          <label class="fk-label">Address (House No, Building, Street) *</label>
          <textarea id="addr-street" class="fk-input" rows="2" required placeholder="Flat/Room, Building, Street">${street}</textarea>
        </div>

        <div class="fk-form-grid-2">
          <div class="fk-form-group">
            <label class="fk-label">City / District *</label>
            <input type="text" id="addr-city" class="fk-input" required value="${city}" placeholder="City" />
          </div>
          <div class="fk-form-group">
            <label class="fk-label">State *</label>
            <input type="text" id="addr-state" class="fk-input" required value="${state}" placeholder="State" />
          </div>
        </div>

        <div class="fk-form-grid-2">
          <div class="fk-form-group">
            <label class="fk-label">Landmark (Optional)</label>
            <input type="text" id="addr-landmark" class="fk-input" value="${landmark}" placeholder="e.g. Near Metro Station" />
          </div>
          <div class="fk-form-group">
            <label class="fk-label">Alternate Phone</label>
            <input type="tel" id="addr-altphone" class="fk-input" maxlength="10" value="${altPhone}" placeholder="Optional alternate number" />
          </div>
        </div>

        <div class="fk-form-group">
          <label class="fk-label">Address Type</label>
          <div style="display:flex; gap:16px; align-items:center;">
            <label style="display:flex; align-items:center; gap:6px; font-size:13px; cursor:pointer;">
              <input type="radio" name="addr_type" value="HOME" ${type === 'HOME' ? 'checked' : ''} /> Home (All-day delivery)
            </label>
            <label style="display:flex; align-items:center; gap:6px; font-size:13px; cursor:pointer;">
              <input type="radio" name="addr_type" value="WORK" ${type === 'WORK' ? 'checked' : ''} /> Work (10 AM - 5 PM)
            </label>
          </div>
        </div>

        <div class="fk-form-group">
          <label style="display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer;">
            <input type="checkbox" id="addr-default" ${isDef ? 'checked' : ''} /> Make this my default shipping address
          </label>
        </div>

        <div class="fk-modal-footer" style="padding-left:0; padding-right:0; margin-top:20px; background:none;">
          <button type="button" class="fk-btn-secondary" onclick="window.closeAnyModal()">Cancel</button>
          <button type="submit" class="fk-btn-primary">
            ${isEdit ? 'Update Address' : 'Save Address'}
          </button>
        </div>
      </form>
    `;

    openModal({
      title: isEdit ? 'Edit Address' : 'Add New Delivery Address',
      body: modalHtml,
      hideDefaultButtons: true
    });
  };

  window.editAddressModal = (addrId) => {
    const addr = addressesList.find(a => a.id === addrId);
    if (addr) window.openAddressModal(addr);
  };

  window.saveAddressSubmit = async (e, editId) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('addr-name').value.trim(),
      phone: document.getElementById('addr-phone').value.trim(),
      pincode: document.getElementById('addr-pincode').value.trim(),
      locality: document.getElementById('addr-locality').value.trim(),
      address: document.getElementById('addr-street').value.trim(),
      city: document.getElementById('addr-city').value.trim(),
      state: document.getElementById('addr-state').value.trim(),
      landmark: document.getElementById('addr-landmark').value.trim(),
      alternatePhone: document.getElementById('addr-altphone').value.trim(),
      type: document.querySelector('input[name="addr_type"]:checked')?.value || 'HOME',
      isDefault: document.getElementById('addr-default').checked
    };

    try {
      const url = editId ? `${API}/api/users/addresses/${editId}` : `${API}/api/users/addresses`;
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showLocalToast(editId ? 'Address updated successfully!' : 'Address added successfully!', 'success');
        window.closeAnyModal();
        // Refresh addresses
        const updatedRes = await fetch(`${API}/api/users/addresses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (updatedRes.ok) addressesList = await updatedRes.json();
        render();
      } else {
        showLocalToast('Failed to save address.', 'error');
      }
    } catch (err) {
      showLocalToast('Network error while saving address.', 'error');
    }
  };

  window.setDefaultAddress = async (addrId) => {
    try {
      const res = await fetch(`${API}/api/users/addresses/${addrId}/default`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addressesList.forEach(a => a.isDefault = (a.id === addrId ? 1 : 0));
        showLocalToast('Default address updated', 'success');
        render();
      }
    } catch (e) {
      showLocalToast('Error updating default address', 'error');
    }
  };

  window.confirmDeleteAddress = (addrId, name) => {
    openModal({
      title: 'Delete Address Confirmation',
      body: `<p>Are you sure you want to delete the address for <strong>${name}</strong>? This action cannot be undone.</p>`,
      confirmText: 'Delete Address',
      confirmClass: 'fk-btn-primary" style="background:#dc2626;',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/api/users/addresses/${addrId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            addressesList = addressesList.filter(a => a.id !== addrId);
            showLocalToast('Address deleted successfully', 'info');
            render();
          }
        } catch (e) {
          showLocalToast('Error deleting address', 'error');
        }
      }
    });
  };

  // Payment Methods
  window.openPaymentModal = () => {
    openModal({
      title: 'Add Payment Method',
      body: `
        <form id="fk-pay-form" onsubmit="window.savePaymentSubmit(event)">
          <div class="fk-form-group">
            <label class="fk-label">Payment Method Type</label>
            <select id="pay-type" class="fk-input" onchange="window.togglePaymentTypeFields(this.value)">
              <option value="upi">UPI ID (Google Pay, PhonePe, Paytm)</option>
              <option value="card">Credit / Debit Card</option>
            </select>
          </div>

          <div id="pay-upi-fields">
            <div class="fk-form-group">
              <label class="fk-label">UPI ID / VPA *</label>
              <input type="text" id="pay-upi-id" class="fk-input" placeholder="e.g. yourname@okaxis" />
            </div>
          </div>

          <div id="pay-card-fields" style="display:none;">
            <div class="fk-form-group">
              <label class="fk-label">Card Holder Name *</label>
              <input type="text" id="pay-card-name" class="fk-input" placeholder="Name as on card" />
            </div>
            <div class="fk-form-group">
              <label class="fk-label">Card Number (Last 4 digits shown) *</label>
              <input type="text" id="pay-card-num" class="fk-input" maxlength="19" placeholder="1234 5678 9012 3456" />
            </div>
            <div class="fk-form-grid-2">
              <div class="fk-form-group">
                <label class="fk-label">Expiry (MM/YY)</label>
                <input type="text" id="pay-card-exp" class="fk-input" maxlength="5" placeholder="08/28" />
              </div>
            </div>
          </div>

          <div class="fk-modal-footer" style="padding-left:0; padding-right:0; margin-top:20px; background:none;">
            <button type="button" class="fk-btn-secondary" onclick="window.closeAnyModal()">Cancel</button>
            <button type="submit" class="fk-btn-primary">Save Securely</button>
          </div>
        </form>
      `,
      hideDefaultButtons: true
    });
  };

  window.togglePaymentTypeFields = (type) => {
    const upiFields = document.getElementById('pay-upi-fields');
    const cardFields = document.getElementById('pay-card-fields');
    if (type === 'upi') {
      if (upiFields) upiFields.style.display = 'block';
      if (cardFields) cardFields.style.display = 'none';
    } else {
      if (upiFields) upiFields.style.display = 'none';
      if (cardFields) cardFields.style.display = 'block';
    }
  };

  window.savePaymentSubmit = async (e) => {
    e.preventDefault();
    const type = document.getElementById('pay-type').value;
    let payload = {};

    if (type === 'upi') {
      const upiId = document.getElementById('pay-upi-id').value.trim();
      if (!upiId || !upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g. name@upi)');
        return;
      }
      payload = {
        type: 'upi',
        title: 'UPI Virtual Address',
        maskedNumber: upiId,
        isDefault: 1
      };
    } else {
      const cardNum = document.getElementById('pay-card-num').value.replace(/\s/g, '');
      const cardName = document.getElementById('pay-card-name').value.trim();
      const exp = document.getElementById('pay-card-exp').value.trim();
      if (cardNum.length < 12) {
        alert('Please enter a valid card number');
        return;
      }
      payload = {
        type: 'card',
        title: cardName || 'Visa / Mastercard',
        maskedNumber: `•••• •••• •••• ${cardNum.slice(-4)}`,
        expiry: exp || '12/28',
        holderName: cardName,
        isDefault: 1
      };
    }

    try {
      const res = await fetch(`${API}/api/users/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showLocalToast('Payment method saved securely', 'success');
        window.closeAnyModal();
        const pRes = await fetch(`${API}/api/users/payment-methods`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (pRes.ok) paymentMethods = await pRes.json();
        render();
      }
    } catch (err) {
      showLocalToast('Failed to save payment method', 'error');
    }
  };

  window.deletePaymentMethod = async (pmId) => {
    if (!confirm('Remove this saved payment method?')) return;
    try {
      const res = await fetch(`${API}/api/users/payment-methods/${pmId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        paymentMethods = paymentMethods.filter(p => p.id !== pmId);
        showLocalToast('Payment method removed', 'info');
        render();
      }
    } catch (e) {
      showLocalToast('Failed to remove payment method', 'error');
    }
  };

  // Avatar Modal
  window.openAvatarModal = () => {
    const curAvatar = userProfile.avatar || '';
    openModal({
      title: 'Update Profile Photo',
      body: `
        <div>
          <p style="font-size:13px; color:#4b5563; margin-top:0;">Choose from ready avatars or enter a custom photo URL:</p>
          
          <div class="fk-avatar-presets-grid">
            ${avatarPresets.map((p, idx) => `
              <img 
                src="${p}" 
                class="fk-avatar-preset-item ${curAvatar === p ? 'selected' : ''}" 
                alt="Avatar ${idx+1}" 
                onclick="window.selectAvatarPreset('${p}')"
              />
            `).join('')}
          </div>

          <div class="fk-form-group" style="margin-top:16px;">
            <label class="fk-label">Or Custom Image URL</label>
            <input type="url" id="custom-avatar-url" class="fk-input" value="${curAvatar}" placeholder="https://example.com/avatar.jpg" />
          </div>

          <div class="fk-modal-footer" style="padding-left:0; padding-right:0; margin-top:20px; background:none;">
            <button type="button" class="fk-btn-secondary" onclick="window.closeAnyModal()">Cancel</button>
            <button type="button" class="fk-btn-primary" onclick="window.saveAvatarSelection()">Save Photo</button>
          </div>
        </div>
      `,
      hideDefaultButtons: true
    });
  };

  window.selectAvatarPreset = (url) => {
    const input = document.getElementById('custom-avatar-url');
    if (input) input.value = url;
    document.querySelectorAll('.fk-avatar-preset-item').forEach(img => {
      img.classList.toggle('selected', img.src === url);
    });
  };

  window.saveAvatarSelection = async () => {
    const input = document.getElementById('custom-avatar-url');
    const newAvatar = input ? input.value.trim() : '';

    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: newAvatar })
      });

      if (res.ok) {
        userProfile.avatar = newAvatar;
        const storedUser = JSON.parse(localStorage.getItem('ck_user') || '{}');
        storedUser.avatar = newAvatar;
        localStorage.setItem('ck_user', JSON.stringify(storedUser));
        store.set('user', storedUser);

        showLocalToast('Profile picture updated!', 'success');
        window.closeAnyModal();
        render();
      }
    } catch (e) {
      showLocalToast('Failed to update picture', 'error');
    }
  };

  // Change Password
  window.submitChangePassword = async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('sec-curr-pwd').value;
    const newPassword = document.getElementById('sec-new-pwd').value;
    const confirmPassword = document.getElementById('sec-conf-pwd').value;
    const btn = document.getElementById('sec-pwd-btn');

    if (newPassword !== confirmPassword) {
      showLocalToast('New passwords do not match!', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showLocalToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = 'Updating...';
    }

    try {
      const res = await fetch(`${API}/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        showLocalToast('Password updated successfully! Please keep it secure.', 'success');
        document.getElementById('fk-change-pwd-form').reset();
      } else {
        showLocalToast(data.error || 'Failed to update password', 'error');
      }
    } catch (err) {
      showLocalToast('Error connecting to security server', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="lock" style="width:14px;"></i> Update Password';
        if (window.lucide) window.lucide.createIcons();
      }
    }
  };

  // Coupon Copy
  window.copyCouponCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      showLocalToast(`Promo code "${code}" copied to clipboard!`, 'success');
    }).catch(() => {
      showLocalToast(`Code: ${code}`, 'info');
    });
  };

  // Notifications
  window.markAllNotifsRead = async () => {
    notificationsList.forEach(n => n.isRead = 1);
    store.set('unreadNotifCount', 0);
    showLocalToast('All notifications marked as read', 'success');
    render();
  };

  window.showToggleToast = (msg) => {
    showLocalToast(msg, 'info');
  };

  // Support
  window.startLiveSupportChat = () => {
    showLocalToast('Connecting to CircuitKart technical engineer...', 'info');
    setTimeout(() => {
      showLocalToast('Live Support: All agents are currently assisting other makers. Please email support@circuitkart.com or call 1800-208-9898.', 'info');
    }, 1500);
  };

  // Logout Sessions
  window.logoutOtherSessions = () => {
    showLocalToast('Logged out of all other devices successfully.', 'success');
  };

  // Logout Modal
  window.confirmLogoutModal = () => {
    openModal({
      title: 'Confirm Logout',
      body: '<p>Are you sure you want to log out from CircuitKart on this device?</p>',
      confirmText: 'Yes, Log Out',
      confirmClass: 'fk-btn-primary" style="background:#dc2626;',
      onConfirm: () => {
        window.closeAnyModal();
        if (typeof window.logout === 'function') {
          window.logout();
        } else {
          localStorage.removeItem('ck_token');
          localStorage.removeItem('ck_user');
          window.location.hash = '/login';
        }
      }
    });
  };

  // Review Modal
  window.openReviewModal = (orderId, itemName) => {
    let currentRating = 5;
    openModal({
      title: 'Rate & Review Hardware',
      body: `
        <div>
          <p style="font-size:13.5px; color:#4b5563; margin-top:0;">
            Share your feedback for <strong>${itemName}</strong> (Order #${orderId})
          </p>

          <div style="display:flex; gap:10px; margin:16px 0; justify-content:center;">
            ${[1,2,3,4,5].map(star => `
              <i 
                data-lucide="star" 
                class="fk-review-star" 
                data-rating="${star}" 
                style="width:28px; height:28px; color:#ff9f00; fill:#ff9f00; cursor:pointer;"
                onclick="window.setReviewModalRating(${star})"
              ></i>
            `).join('')}
          </div>

          <div class="fk-form-group">
            <label class="fk-label">Your Review (Optional)</label>
            <textarea id="review-modal-comment" class="fk-input" rows="3" placeholder="Tell other makers about the build quality, documentation clarity, and microcontroller performance..."></textarea>
          </div>

          <div class="fk-modal-footer" style="padding-left:0; padding-right:0; margin-top:20px; background:none;">
            <button type="button" class="fk-btn-secondary" onclick="window.closeAnyModal()">Cancel</button>
            <button type="button" class="fk-btn-primary" onclick="window.submitReviewModal('${orderId}')">Submit Review</button>
          </div>
        </div>
      `,
      hideDefaultButtons: true
    });
  };

  window.setReviewModalRating = (rating) => {
    document.querySelectorAll('.fk-review-star').forEach(star => {
      const r = Number(star.getAttribute('data-rating'));
      if (r <= rating) {
        star.style.fill = '#ff9f00';
        star.style.color = '#ff9f00';
      } else {
        star.style.fill = 'none';
        star.style.color = '#cbd5e1';
      }
    });
  };

  window.submitReviewModal = (orderId) => {
    showLocalToast('Thank you for reviewing! Your feedback helps the maker community.', 'success');
    window.closeAnyModal();
  };

  // General Modal Manager
  function openModal({ title, body, confirmText = 'Confirm', confirmClass = 'fk-btn-primary', onConfirm = null, hideDefaultButtons = false }) {
    const slot = document.getElementById('fk-modal-slot');
    if (!slot) return;

    window.closeAnyModal = () => {
      slot.innerHTML = '';
    };

    window.__modalOnConfirm = onConfirm;

    slot.innerHTML = `
      <div class="fk-modal-overlay" onclick="if(event.target === this) window.closeAnyModal()">
        <div class="fk-modal-dialog">
          <div class="fk-modal-header">
            <h3>${title}</h3>
            <button class="fk-modal-close-btn" onclick="window.closeAnyModal()">
              <i data-lucide="x" style="width:18px;"></i>
            </button>
          </div>
          <div class="fk-modal-body">
            ${body}
          </div>
          ${!hideDefaultButtons ? `
            <div class="fk-modal-footer">
              <button class="fk-btn-secondary" onclick="window.closeAnyModal()">Cancel</button>
              <button class="${confirmClass}" onclick="if(window.__modalOnConfirm) window.__modalOnConfirm(); window.closeAnyModal();">
                ${confirmText}
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  // Initial Load
  loadInitialData();
}

// Export ProfilePage as an alias
export const ProfilePage = DashboardPage;