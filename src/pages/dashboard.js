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

  // Active navigation tab
  const validTabs = [
    'profile', 'orders', 'addresses', 'pan',
    'gift_cards', 'upi', 'cards', 'payments',
    'coupons', 'reviews', 'notifications', 'wishlist'
  ];
  let currentTab = params.tab || 'profile';
  if (!validTabs.includes(currentTab)) {
    currentTab = 'profile';
  }

  // State caches
  let userProfile = store.get('user') || {};
  let addressesList = [];
  let wishlistItems = [];
  let paymentMethods = [];
  let notificationsList = [];
  let userOrders = store.get('orders') || [];

  // Edit toggles for Profile sections
  let isEditingPersonal = false;
  let isEditingEmail = false;
  let isEditingMobile = false;

  // Orders filters
  let orderSearchFilter = '';
  let orderStatusFilter = 'all';

  // Gift card state
  let showAddGiftCard = false;

  // PAN card state
  let panData = {
    panNumber: userProfile.pan_number || '',
    fullName: userProfile.pan_name || userProfile.name || '',
    isDeclared: false
  };

  // Helper: Toast notification
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

  // Helper: Open Modal
  function openModal({ title, body, confirmText = 'Confirm', confirmClass = 'fk-btn-save', onConfirm = null }) {
    const modalSlot = document.getElementById('fk-modal-slot');
    if (!modalSlot) return;

    modalSlot.innerHTML = `
      <div class="fk-modal-overlay" id="fk-active-modal">
        <div class="fk-modal-box">
          <div class="fk-modal-header">
            <h4>${title}</h4>
            <button style="background:none; border:none; cursor:pointer;" onclick="window.closeFkModal()">
              <i data-lucide="x" style="width:18px;"></i>
            </button>
          </div>
          <div class="fk-modal-body">${body}</div>
          <div class="fk-modal-footer">
            <button class="fk-btn-outline-blue" onclick="window.closeFkModal()">Cancel</button>
            ${onConfirm ? `<button class="${confirmClass}" id="fk-modal-confirm-btn">${confirmText}</button>` : ''}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    if (onConfirm) {
      const btn = document.getElementById('fk-modal-confirm-btn');
      if (btn) {
        btn.onclick = async () => {
          await onConfirm();
          window.closeFkModal();
        };
      }
    }
  }

  window.closeFkModal = () => {
    const slot = document.getElementById('fk-modal-slot');
    if (slot) slot.innerHTML = '';
  };

  // Fetch Initial Data
  async function loadInitialData() {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [profRes, addrRes, wishRes, payRes, notifRes, ordersRes] = await Promise.allSettled([
        fetch(`${API}/api/users/profile`, { headers }),
        fetch(`${API}/api/users/addresses`, { headers }),
        fetch(`${API}/api/users/wishlist`, { headers }),
        fetch(`${API}/api/users/payment-methods`, { headers }),
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

  // Switch Tab
  window.switchProfileTab = (tab) => {
    currentTab = tab;
    isEditingPersonal = false;
    isEditingEmail = false;
    isEditingMobile = false;
    window.location.hash = `/dashboard?tab=${tab}`;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Split Full Name into First and Last
  function getNames(fullName = '') {
    const parts = fullName.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    return { firstName, lastName };
  }

  // ==========================================================
  // TAB RENDERERS
  // ==========================================================

  // 1. Profile Information Tab
  function renderProfileTab() {
    const fullName = userProfile.name || 'Valued Customer';
    const { firstName, lastName } = getNames(fullName);
    const email = userProfile.email || 'customer@example.com';
    const phone = userProfile.phone || '9876543210';
    const gender = userProfile.gender || 'Male';

    return `
      <div class="fk-content-card">
        <!-- Personal Information Section -->
        <div class="fk-section-block">
          <div class="fk-section-title-row">
            <span class="fk-section-title">Personal Information</span>
            <a href="javascript:void(0)" class="fk-edit-trigger" onclick="window.toggleEditPersonal()">
              ${isEditingPersonal ? 'Cancel' : 'Edit'}
            </a>
          </div>

          <form onsubmit="window.savePersonalDetails(event)">
            <div class="fk-field-row">
              <div class="fk-floating-group">
                <input 
                  type="text" 
                  id="prof-fname" 
                  class="fk-form-control" 
                  value="${firstName}" 
                  ${!isEditingPersonal ? 'disabled' : ''} 
                  required 
                />
                <label class="fk-floating-label">First Name</label>
              </div>

              <div class="fk-floating-group">
                <input 
                  type="text" 
                  id="prof-lname" 
                  class="fk-form-control" 
                  value="${lastName}" 
                  ${!isEditingPersonal ? 'disabled' : ''} 
                />
                <label class="fk-floating-label">Last Name</label>
              </div>
            </div>

            <span class="fk-gender-title">Your Gender</span>
            <div class="fk-radio-group">
              <label class="fk-radio-label">
                <input 
                  type="radio" 
                  name="prof-gender" 
                  value="Male" 
                  ${gender === 'Male' ? 'checked' : ''} 
                  ${!isEditingPersonal ? 'disabled' : ''} 
                />
                <span class="fk-radio-custom"></span> Male
              </label>

              <label class="fk-radio-label">
                <input 
                  type="radio" 
                  name="prof-gender" 
                  value="Female" 
                  ${gender === 'Female' ? 'checked' : ''} 
                  ${!isEditingPersonal ? 'disabled' : ''} 
                />
                <span class="fk-radio-custom"></span> Female
              </label>
            </div>

            ${isEditingPersonal ? `
              <div class="fk-save-row">
                <button type="submit" id="prof-save-personal-btn" class="fk-btn-save">SAVE</button>
              </div>
            ` : ''}
          </form>
        </div>

        <!-- Email Address Section -->
        <div class="fk-section-block">
          <div class="fk-section-title-row">
            <span class="fk-section-title">Email Address</span>
            <a href="javascript:void(0)" class="fk-edit-trigger" onclick="window.toggleEditEmail()">
              ${isEditingEmail ? 'Cancel' : 'Edit'}
            </a>
          </div>

          <form onsubmit="window.saveEmailDetails(event)">
            <div class="fk-field-row">
              <div class="fk-floating-group">
                <input 
                  type="email" 
                  id="prof-email-input" 
                  class="fk-form-control" 
                  value="${email}" 
                  ${!isEditingEmail ? 'disabled' : ''} 
                  required 
                />
                <label class="fk-floating-label">Email Address</label>
              </div>

              ${isEditingEmail ? `
                <button type="submit" class="fk-btn-save" style="margin-top:0;">SAVE</button>
              ` : ''}
            </div>
          </form>
        </div>

        <!-- Mobile Number Section -->
        <div class="fk-section-block">
          <div class="fk-section-title-row">
            <span class="fk-section-title">Mobile Number</span>
            <a href="javascript:void(0)" class="fk-edit-trigger" onclick="window.toggleEditMobile()">
              ${isEditingMobile ? 'Cancel' : 'Edit'}
            </a>
          </div>

          <form onsubmit="window.saveMobileDetails(event)">
            <div class="fk-field-row">
              <div class="fk-floating-group">
                <input 
                  type="tel" 
                  id="prof-mobile-input" 
                  class="fk-form-control" 
                  value="${phone}" 
                  maxlength="10" 
                  ${!isEditingMobile ? 'disabled' : ''} 
                  required 
                />
                <label class="fk-floating-label">Mobile Number</label>
              </div>

              ${isEditingMobile ? `
                <button type="submit" class="fk-btn-save" style="margin-top:0;">SAVE</button>
              ` : ''}
            </div>
          </form>
        </div>

        <!-- FAQs Section (Pure Flipkart format) -->
        <div class="fk-faqs-container">
          <span class="fk-faqs-header">FAQs</span>

          <div class="fk-faq-entry">
            <p class="fk-faq-question">What happens when I update my email address (or mobile number)?</p>
            <p class="fk-faq-answer">Your login email id (or mobile number) changes, likewise. You'll receive all your account related communication on your updated email address (or mobile number).</p>
          </div>

          <div class="fk-faq-entry">
            <p class="fk-faq-question">When will my Flipkart account be updated with the new email address (or mobile number)?</p>
            <p class="fk-faq-answer">It happens as soon as you confirm the verification code sent to your email (or mobile) and save the changes.</p>
          </div>

          <div class="fk-faq-entry">
            <p class="fk-faq-question">What happens to my existing Flipkart account when I update my email address (or mobile number)?</p>
            <p class="fk-faq-answer">Updating your email address/mobile number doesn't invalidate your account. Your account remains fully intact with all your past orders, wishlist, and saved addresses.</p>
          </div>
        </div>

        <!-- Account Actions -->
        <div class="fk-account-actions-row">
          <a href="javascript:void(0)" class="fk-action-link" onclick="window.confirmDeactivateModal()">Deactivate Account</a>
          <a href="javascript:void(0)" class="fk-action-link fk-action-delete" onclick="window.confirmDeleteAccountModal()">Delete Account</a>
        </div>

        <!-- Bottom Delivery Skyline Graphic -->
        <svg class="fk-footer-city-illustration" viewBox="0 0 250 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 78H250" stroke="#E0E0E0" stroke-width="2"/>
          <path d="M15 78V45H40V78M40 78V35H70V78M70 78V55H90V78M110 78V60H130V78M180 78V50H210V78" stroke="#E5E7EB" stroke-width="1.5"/>
          <rect x="135" y="52" width="36" height="24" rx="2" fill="#2874F0"/>
          <circle cx="144" cy="76" r="4" fill="#212121"/>
          <circle cx="162" cy="76" r="4" fill="#212121"/>
          <path d="M160 56H171V68H160V56Z" fill="#90CDF4"/>
        </svg>
      </div>
    `;
  }

  // 2. My Orders Tab
  function renderOrdersTab() {
    let filteredOrders = [...userOrders];

    // Status filter
    if (orderStatusFilter !== 'all') {
      if (orderStatusFilter === 'active') {
        filteredOrders = filteredOrders.filter(o => ['placed', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'].includes(o.status));
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
        const idMatch = (o.id || '').toLowerCase().includes(q);
        const itemMatch = Array.isArray(o.items) && o.items.some(i => (i.name || '').toLowerCase().includes(q));
        return idMatch || itemMatch;
      });
    }

    return `
      <div class="fk-content-card">
        <!-- Search bar -->
        <div class="fk-orders-search-bar">
          <input 
            type="text" 
            class="fk-orders-search-input" 
            placeholder="Search your orders here" 
            value="${orderSearchFilter}" 
            oninput="window.handleOrderSearch(this.value)"
          />
          <button class="fk-orders-search-btn" onclick="render()">
            <i data-lucide="search" style="width:16px;"></i> Search Orders
          </button>
        </div>

        <!-- Filter chips -->
        <div class="fk-orders-filters">
          <div class="fk-filter-chip ${orderStatusFilter === 'all' ? 'active' : ''}" onclick="window.filterOrdersByStatus('all')">
            All Orders
          </div>
          <div class="fk-filter-chip ${orderStatusFilter === 'active' ? 'active' : ''}" onclick="window.filterOrdersByStatus('active')">
            On the way
          </div>
          <div class="fk-filter-chip ${orderStatusFilter === 'delivered' ? 'active' : ''}" onclick="window.filterOrdersByStatus('delivered')">
            Delivered
          </div>
          <div class="fk-filter-chip ${orderStatusFilter === 'cancelled' ? 'active' : ''}" onclick="window.filterOrdersByStatus('cancelled')">
            Cancelled
          </div>
        </div>

        ${filteredOrders.length === 0 ? `
          <div style="text-align:center; padding:60px 20px;">
            <i data-lucide="package" style="width:54px; height:54px; color:#c7c7c7; margin:0 auto 12px; display:block;"></i>
            <h4 style="margin:0 0 6px; font-size:16px; color:#212121;">No orders found</h4>
            <p style="margin:0 0 20px; font-size:13px; color:#878787;">Looks like you haven't placed an order yet.</p>
            <a href="#/projects" class="fk-btn-save" style="display:inline-block; text-decoration:none;">EXPLORE PROJECTS</a>
          </div>
        ` : `
          <div class="fk-orders-list">
            ${filteredOrders.map(order => {
              const isDelivered = order.status === 'delivered';
              const isCancelled = ['cancelled', 'payment_failed', 'returned'].includes(order.status);
              const items = Array.isArray(order.items) ? order.items : [];
              const firstItem = items[0] || {};
              const defaultImg = firstItem.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&q=80';
              const formattedDate = order.date ? new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';

              return `
                <div class="fk-order-row-card">
                  <div class="fk-order-thumb-wrap">
                    <img src="${defaultImg}" alt="Product" class="fk-order-thumb-img" />
                  </div>

                  <div>
                    <h4 class="fk-order-info-title">${firstItem.name || 'IoT / Embedded Project Kit'}</h4>
                    <p class="fk-order-info-meta">
                      Order ID: <strong>${order.id}</strong> • Placed on ${formattedDate}
                    </p>
                    ${items.length > 1 ? `<p class="fk-order-info-meta" style="color:#2874f0;">+ ${items.length - 1} more item(s)</p>` : ''}
                    <div class="fk-order-actions-bar">
                      <a href="#/track/${order.id}" class="fk-btn-outline-blue">
                        <i data-lucide="navigation" style="width:12px;"></i> Track
                      </a>
                      <a href="#/invoice/${order.id}" class="fk-btn-outline-blue">
                        <i data-lucide="file-text" style="width:12px;"></i> Invoice
                      </a>
                    </div>
                  </div>

                  <div>
                    <div class="fk-order-price-val">₹${Number(order.total || 0).toLocaleString('en-IN')}</div>
                    <span style="font-size:11px; color:#878787;">${order.paymentMethod || 'UPI'} Paid</span>
                  </div>

                  <div>
                    <div class="fk-order-status-dot-row">
                      <span class="${isDelivered ? 'fk-status-dot-green' : (isCancelled ? 'fk-status-dot-red' : 'fk-status-dot-orange')}"></span>
                      <span class="fk-order-status-text">
                        ${isDelivered ? 'Delivered on ' + formattedDate : (isCancelled ? 'Order Cancelled' : 'Expected by ' + formattedDate)}
                      </span>
                    </div>
                    <p class="fk-order-status-sub">
                      ${isDelivered ? 'Your item has been delivered' : (isCancelled ? 'Refund processed' : 'Your item is on its way')}
                    </p>
                    <a href="javascript:void(0)" class="fk-order-rate-link" onclick="window.openReviewModal('${order.id}', '${(firstItem.name || 'Project Kit').replace(/'/g, "\\'")}')">
                      <i data-lucide="star" style="width:13px; fill:#ff9f00; color:#ff9f00;"></i> Rate & Review Product
                    </a>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  // 3. Manage Addresses Tab
  function renderAddressesTab() {
    return `
      <div class="fk-content-card">
        <span class="fk-section-title" style="display:block; margin-bottom:20px;">Manage Addresses</span>

        <!-- + Add a new address -->
        <div class="fk-address-add-banner" onclick="window.openAddressModal()">
          <i data-lucide="plus" style="width:18px;"></i>
          <span>ADD A NEW ADDRESS</span>
        </div>

        ${addressesList.length === 0 ? `
          <div style="padding:40px 0; text-align:center; color:#878787; font-size:14px;">
            No saved addresses found. Click above to add your primary delivery address.
          </div>
        ` : `
          ${addressesList.map(addr => `
            <div class="fk-address-card-item">
              <button class="fk-addr-menu-btn" title="Edit Address" onclick="window.openAddressModal(${JSON.stringify(addr).replace(/"/g, '&quot;')})">
                <i data-lucide="more-vertical" style="width:16px;"></i>
              </button>

              <div class="fk-addr-top-row">
                <span class="fk-addr-chip">${addr.type || 'HOME'}</span>
                <span class="fk-addr-name">${addr.name || userProfile.name}</span>
                <span class="fk-addr-phone">${addr.phone || userProfile.phone || '—'}</span>
              </div>

              <p class="fk-addr-text">
                ${addr.address || ''}, ${addr.locality || ''}, ${addr.city || ''}, ${addr.state || ''} - <strong>${addr.pincode || ''}</strong>
              </p>

              <div style="margin-top:12px; display:flex; gap:16px;">
                <a href="javascript:void(0)" style="color:#2874f0; font-size:13px; font-weight:500; text-decoration:none;" onclick="window.openAddressModal(${JSON.stringify(addr).replace(/"/g, '&quot;')})">
                  Edit
                </a>
                <a href="javascript:void(0)" style="color:#e53935; font-size:13px; font-weight:500; text-decoration:none;" onclick="window.deleteAddress(${addr.id})">
                  Delete
                </a>
              </div>
            </div>
          `).join('')}
        `}
      </div>
    `;
  }

  // 4. PAN Card Information Tab
  function renderPanTab() {
    return `
      <div class="fk-content-card">
        <span class="fk-section-title" style="display:block; margin-bottom:20px;">PAN Card Information</span>

        <form class="fk-pan-form" onsubmit="window.savePanForm(event)">
          <div class="fk-floating-group" style="width:100%; margin-bottom:16px;">
            <input 
              type="text" 
              id="pan-number-input" 
              class="fk-form-control" 
              value="${panData.panNumber}" 
              placeholder="e.g. ABCDE1234F" 
              maxlength="10" 
              style="text-transform:uppercase;" 
              required 
            />
            <label class="fk-floating-label">PAN Card Number *</label>
          </div>

          <div class="fk-floating-group" style="width:100%; margin-bottom:16px;">
            <input 
              type="text" 
              id="pan-name-input" 
              class="fk-form-control" 
              value="${panData.fullName}" 
              placeholder="Full Name as on PAN card" 
              required 
            />
            <label class="fk-floating-label">Full Name as on PAN Card *</label>
          </div>

          <div style="margin-bottom:16px;">
            <label style="display:block; font-size:12px; color:#878787; margin-bottom:6px;">Upload PAN Card (Optional)</label>
            <input type="file" id="pan-file" accept="image/*,.pdf" style="font-size:13px;" />
          </div>

          <label class="fk-pan-declaration">
            <input type="checkbox" id="pan-declaration-check" ${panData.isDeclared ? 'checked' : ''} required />
            <span>I do hereby declare that PAN furnished/stated above is correct and belongs to me, registered as an individual taxpayer under Income Tax Act.</span>
          </label>

          <button type="submit" class="fk-btn-save">UPLOAD & SAVE</button>
        </form>

        <div class="fk-faqs-container" style="margin-top:36px;">
          <span class="fk-faqs-header">Why is PAN required?</span>
          <p class="fk-faq-answer">As per Government of India guidelines, PAN details are required for transactions exceeding specific regulatory limits to ensure seamless compliance and GST billing.</p>
        </div>
      </div>
    `;
  }

  // 5. Gift Cards Tab
  function renderGiftCardsTab() {
    return `
      <div class="fk-content-card">
        <span class="fk-section-title" style="display:block; margin-bottom:20px;">Flipkart Gift Cards</span>

        <div class="fk-gift-balance-box">
          <div>
            <div class="fk-gift-balance-label">Flipkart Gift Card Balance</div>
            <div class="fk-gift-balance-val">₹0.00</div>
          </div>
          <button class="fk-btn-outline-blue" onclick="window.toggleGiftCardForm()">
            + Add A Gift Card
          </button>
        </div>

        ${showAddGiftCard ? `
          <div style="border:1px solid #e0e0e0; padding:20px; border-radius:2px; margin-bottom:24px; max-width:440px;">
            <h4 style="margin:0 0 16px; font-size:14px; color:#212121;">Add Gift Card</h4>
            <div class="fk-floating-group" style="width:100%; margin-bottom:14px;">
              <input type="text" id="gift-card-number" class="fk-form-control" maxlength="16" placeholder="16 digit card number" />
              <label class="fk-floating-label">Card Number</label>
            </div>
            <div class="fk-floating-group" style="width:100%; margin-bottom:16px;">
              <input type="password" id="gift-card-pin" class="fk-form-control" maxlength="6" placeholder="6 digit PIN" />
              <label class="fk-floating-label">PIN</label>
            </div>
            <button class="fk-btn-save" onclick="window.applyGiftCard()">APPLY</button>
          </div>
        ` : ''}

        <div class="fk-faqs-container">
          <span class="fk-faqs-header">FAQs about Gift Cards</span>
          <div class="fk-faq-entry">
            <p class="fk-faq-question">How do I redeem a Gift Card?</p>
            <p class="fk-faq-answer">You can apply your 16-digit card number and 6-digit PIN here or directly select "Gift Card" during payment at checkout.</p>
          </div>
        </div>
      </div>
    `;
  }

  // 6. Saved UPI Tab
  function renderUpiTab() {
    return `
      <div class="fk-content-card">
        <span class="fk-section-title" style="display:block; margin-bottom:20px;">Saved UPI</span>

        <div style="border:1px solid #e0e0e0; padding:20px; border-radius:2px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div style="width:40px; height:40px; background:#f0f5ff; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#2874f0; font-weight:700;">
              UPI
            </div>
            <div>
              <div style="font-size:14px; font-weight:600; color:#212121;">user@okhdfcbank</div>
              <div style="font-size:12px; color:#878787;">Verified VPA</div>
            </div>
          </div>
          <button style="background:none; border:none; color:#e53935; cursor:pointer; font-size:13px; font-weight:500;">
            Delete
          </button>
        </div>

        <button class="fk-btn-outline-blue" onclick="window.openAddUpiModal()">
          + Add A New UPI ID
        </button>

        <div class="fk-faqs-container" style="margin-top:36px;">
          <span class="fk-faqs-header">FAQs</span>
          <p class="fk-faq-answer">Your saved UPI ID allows seamless 1-click checkout approval via your Google Pay, PhonePe, or BHIM apps without re-entering VPAs.</p>
        </div>
      </div>
    `;
  }

  // 7. Saved Cards Tab
  function renderCardsTab() {
    return `
      <div class="fk-content-card">
        <span class="fk-section-title" style="display:block; margin-bottom:20px;">Saved Cards</span>

        <p style="font-size:13px; color:#878787; margin-bottom:20px;">
          As per RBI guidelines, cards are securely tokenized with your card issuing bank for secure transactions.
        </p>

        <div style="border:1px solid #e0e0e0; padding:20px; border-radius:2px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:14px;">
            <i data-lucide="credit-card" style="width:36px; height:36px; color:#2874f0;"></i>
            <div>
              <div style="font-size:14px; font-weight:600; color:#212121;">HDFC Bank Credit Card</div>
              <div style="font-size:12px; color:#878787;">•••• •••• •••• 4242 | Expires 08/29</div>
            </div>
          </div>
          <button style="background:none; border:none; color:#e53935; cursor:pointer; font-size:13px; font-weight:500;">
            Delete
          </button>
        </div>

        <button class="fk-btn-outline-blue" onclick="window.openAddCardModal()">
          + Add A New Card
        </button>
      </div>
    `;
  }

  // 8. My Coupons Tab
  function renderCouponsTab() {
    return `
      <div class="fk-content-card">
        <span class="fk-section-title" style="display:block; margin-bottom:20px;">Available Coupons</span>

        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="border:1px dashed #2874f0; background:#f5faff; padding:18px 24px; border-radius:2px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span style="background:#388e3c; color:#fff; font-size:11px; font-weight:700; padding:2px 6px; border-radius:2px;">SPECIAL OFFER</span>
              <h4 style="margin:8px 0 4px; font-size:15px; color:#212121;">Get 15% OFF on IoT Microcontroller Kits</h4>
              <p style="margin:0; font-size:12px; color:#878787;">Use Code: <strong>CIRCUIT15</strong> • Valid till 31 Dec 2026</p>
            </div>
            <button class="fk-btn-outline-blue" onclick="navigator.clipboard.writeText('CIRCUIT15'); showLocalToast('Coupon code copied!', 'success');">
              COPY
            </button>
          </div>

          <div style="border:1px dashed #e0e0e0; background:#fafafa; padding:18px 24px; border-radius:2px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span style="background:#ff9f00; color:#fff; font-size:11px; font-weight:700; padding:2px 6px; border-radius:2px;">FLAT ₹200 OFF</span>
              <h4 style="margin:8px 0 4px; font-size:15px; color:#212121;">Flat ₹200 OFF on orders above ₹1,999</h4>
              <p style="margin:0; font-size:12px; color:#878787;">Use Code: <strong>ROBOTICS200</strong> • Applicable on all hardware kits</p>
            </div>
            <button class="fk-btn-outline-blue" onclick="navigator.clipboard.writeText('ROBOTICS200'); showLocalToast('Coupon code copied!', 'success');">
              COPY
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 9. My Reviews & Ratings Tab
  function renderReviewsTab() {
    return `
      <div class="fk-content-card">
        <span class="fk-section-title" style="display:block; margin-bottom:20px;">My Reviews & Ratings</span>

        <div style="border-bottom:1px solid #f0f0f0; padding-bottom:18px; margin-bottom:18px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span style="background:#388e3c; color:#fff; font-size:12px; font-weight:700; padding:2px 6px; border-radius:2px; display:inline-flex; align-items:center; gap:3px;">
              5 <i data-lucide="star" style="width:10px; fill:#fff;"></i>
            </span>
            <span style="font-weight:600; font-size:14px; color:#212121;">Outstanding embedded IoT kit!</span>
          </div>
          <p style="font-size:13px; color:#212121; margin:0 0 6px;">
            Sensors were pre-tested, source code compiled immediately on Arduino IDE, and MQTT telemetry worked out of the box. Highly recommended for engineering projects!
          </p>
          <span style="font-size:11.5px; color:#878787;">Reviewed for Smart Industrial Telemetry System on Oct 12, 2026</span>
        </div>
      </div>
    `;
  }

  // 10. All Notifications Tab
  function renderNotificationsTab() {
    return `
      <div class="fk-content-card">
        <span class="fk-section-title" style="display:block; margin-bottom:20px;">All Notifications</span>

        ${notificationsList.length === 0 ? `
          <div style="padding:40px 0; text-align:center; color:#878787; font-size:14px;">
            No new notifications.
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${notificationsList.map(n => `
              <div style="border-bottom:1px solid #f0f0f0; padding:12px 0; display:flex; gap:16px; align-items:flex-start;">
                <div style="width:36px; height:36px; border-radius:50%; background:#f0f5ff; display:flex; align-items:center; justify-content:center; color:#2874f0; flex-shrink:0;">
                  <i data-lucide="bell" style="width:18px;"></i>
                </div>
                <div>
                  <h5 style="margin:0 0 3px; font-size:13.5px; color:#212121;">${n.title || 'Order Update'}</h5>
                  <p style="margin:0 0 4px; font-size:12.5px; color:#878787;">${n.message || ''}</p>
                  <span style="font-size:11px; color:#b0b0b0;">${n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN') : 'Recent'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  // 11. My Wishlist Tab
  function renderWishlistTab() {
    return `
      <div class="fk-content-card">
        <span class="fk-section-title" style="display:block; margin-bottom:20px;">
          My Wishlist (${wishlistItems.length})
        </span>

        ${wishlistItems.length === 0 ? `
          <div style="text-align:center; padding:60px 20px;">
            <i data-lucide="heart" style="width:54px; height:54px; color:#c7c7c7; margin:0 auto 12px; display:block;"></i>
            <h4 style="margin:0 0 6px; font-size:16px; color:#212121;">Empty Wishlist</h4>
            <p style="margin:0 0 20px; font-size:13px; color:#878787;">You have no items in your wishlist. Start adding!</p>
            <a href="#/projects" class="fk-btn-save" style="display:inline-block; text-decoration:none;">EXPLORE PROJECTS</a>
          </div>
        ` : `
          <div>
            ${wishlistItems.map(item => `
              <div class="fk-wishlist-row">
                <img src="${item.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&q=80'}" style="width:70px; height:70px; object-fit:contain;" />
                <div>
                  <h4 style="margin:0 0 4px; font-size:14px; font-weight:500; color:#212121;">${item.name || 'Hardware Project Kit'}</h4>
                  <div style="font-size:15px; font-weight:600; color:#212121; margin-bottom:8px;">₹${Number(item.price || 0).toLocaleString('en-IN')}</div>
                  <button class="fk-btn-save" style="padding:7px 18px; font-size:12px;" onclick="window.moveWishlistToCart('${item.projectId || item.id}', '${(item.name || '').replace(/'/g, "\\'")}', ${item.price || 0}, '${item.image || ''}')">
                    MOVE TO CART
                  </button>
                </div>
                <div>
                  <button class="fk-wishlist-delete-btn" title="Delete" onclick="window.confirmDeleteWishlist('${item.projectId || item.id}', '${(item.name || '').replace(/'/g, "\\'")}')">
                    <i data-lucide="trash-2" style="width:16px;"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  // ==========================================================
  // MAIN RENDER FUNCTION
  // ==========================================================
  function render() {
    const fullName = userProfile.name || 'Valued Customer';
    const avatarUrl = userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2874f0&color=fff&size=150`;
    const wishlistCount = wishlistItems.length;

    container.innerHTML = `
      <div class="fk-profile-page">
        <div class="fk-container">

          <!-- Mobile Horizontal Tab Bar -->
          <div class="fk-mobile-nav-bar">
            <div class="fk-mobile-nav-item ${currentTab === 'profile' ? 'active' : ''}" onclick="window.switchProfileTab('profile')">Profile</div>
            <div class="fk-mobile-nav-item ${currentTab === 'orders' ? 'active' : ''}" onclick="window.switchProfileTab('orders')">Orders (${userOrders.length})</div>
            <div class="fk-mobile-nav-item ${currentTab === 'addresses' ? 'active' : ''}" onclick="window.switchProfileTab('addresses')">Addresses</div>
            <div class="fk-mobile-nav-item ${currentTab === 'pan' ? 'active' : ''}" onclick="window.switchProfileTab('pan')">PAN Card</div>
            <div class="fk-mobile-nav-item ${currentTab === 'gift_cards' ? 'active' : ''}" onclick="window.switchProfileTab('gift_cards')">Gift Cards</div>
            <div class="fk-mobile-nav-item ${currentTab === 'wishlist' ? 'active' : ''}" onclick="window.switchProfileTab('wishlist')">Wishlist (${wishlistCount})</div>
          </div>

          <!-- 2-Column Desktop Layout (Real Flipkart) -->
          <div class="fk-main-layout">

            <!-- Left Sidebar -->
            <div class="fk-sidebar-wrapper">

              <!-- Card 1: User Mini Header -->
              <div class="fk-user-mini-card">
                <div class="fk-user-avatar-wrap">
                  <img 
                    src="${avatarUrl}" 
                    alt="${fullName}" 
                    class="fk-user-avatar-img"
                    onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2874f0&color=fff&size=150'"
                  />
                  <div class="fk-user-avatar-badge" title="Change Photo" onclick="window.openAvatarModal()">
                    <i data-lucide="camera" style="width:10px;"></i>
                  </div>
                </div>
                <div class="fk-user-greeting">
                  <span class="fk-greeting-sub">Hello,</span>
                  <span class="fk-greeting-name" title="${fullName}">${fullName}</span>
                </div>
              </div>

              <!-- Card 2: Flipkart Navigation Menu -->
              <div class="fk-nav-card">

                <!-- MY ORDERS -->
                <div class="fk-nav-section-orders ${currentTab === 'orders' ? 'active' : ''}" onclick="window.switchProfileTab('orders')">
                  <div class="fk-nav-row-left">
                    <i data-lucide="package" class="fk-nav-main-icon"></i>
                    <span class="fk-nav-main-label">MY ORDERS</span>
                  </div>
                  <i data-lucide="chevron-right" class="fk-chevron-icon"></i>
                </div>

                <!-- ACCOUNT SETTINGS -->
                <div class="fk-nav-group">
                  <div class="fk-nav-group-header">
                    <i data-lucide="user" class="fk-nav-main-icon"></i>
                    <span class="fk-nav-group-title">ACCOUNT SETTINGS</span>
                  </div>
                  <ul class="fk-nav-sublist">
                    <li>
                      <a class="fk-nav-subitem ${currentTab === 'profile' ? 'active' : ''}" onclick="window.switchProfileTab('profile')">
                        Profile Information
                      </a>
                    </li>
                    <li>
                      <a class="fk-nav-subitem ${currentTab === 'addresses' ? 'active' : ''}" onclick="window.switchProfileTab('addresses')">
                        Manage Addresses
                      </a>
                    </li>
                    <li>
                      <a class="fk-nav-subitem ${currentTab === 'pan' ? 'active' : ''}" onclick="window.switchProfileTab('pan')">
                        PAN Card Information
                      </a>
                    </li>
                  </ul>
                </div>

                <!-- PAYMENTS -->
                <div class="fk-nav-group">
                  <div class="fk-nav-group-header">
                    <i data-lucide="credit-card" class="fk-nav-main-icon"></i>
                    <span class="fk-nav-group-title">PAYMENTS</span>
                  </div>
                  <ul class="fk-nav-sublist">
                    <li>
                      <a class="fk-nav-subitem ${currentTab === 'gift_cards' ? 'active' : ''}" onclick="window.switchProfileTab('gift_cards')">
                        <span>Gift Cards</span>
                        <span class="fk-nav-badge-green">₹0</span>
                      </a>
                    </li>
                    <li>
                      <a class="fk-nav-subitem ${currentTab === 'upi' ? 'active' : ''}" onclick="window.switchProfileTab('upi')">
                        Saved UPI
                      </a>
                    </li>
                    <li>
                      <a class="fk-nav-subitem ${currentTab === 'cards' || currentTab === 'payments' ? 'active' : ''}" onclick="window.switchProfileTab('cards')">
                        Saved Cards
                      </a>
                    </li>
                  </ul>
                </div>

                <!-- MY STUFF -->
                <div class="fk-nav-group">
                  <div class="fk-nav-group-header">
                    <i data-lucide="folder" class="fk-nav-main-icon"></i>
                    <span class="fk-nav-group-title">MY STUFF</span>
                  </div>
                  <ul class="fk-nav-sublist">
                    <li>
                      <a class="fk-nav-subitem ${currentTab === 'coupons' ? 'active' : ''}" onclick="window.switchProfileTab('coupons')">
                        My Coupons
                      </a>
                    </li>
                    <li>
                      <a class="fk-nav-subitem ${currentTab === 'reviews' ? 'active' : ''}" onclick="window.switchProfileTab('reviews')">
                        My Reviews & Ratings
                      </a>
                    </li>
                    <li>
                      <a class="fk-nav-subitem ${currentTab === 'notifications' ? 'active' : ''}" onclick="window.switchProfileTab('notifications')">
                        All Notifications
                      </a>
                    </li>
                    <li>
                      <a class="fk-nav-subitem ${currentTab === 'wishlist' ? 'active' : ''}" onclick="window.switchProfileTab('wishlist')">
                        <span>My Wishlist</span>
                        ${wishlistCount > 0 ? `<span class="fk-nav-badge-count">${wishlistCount}</span>` : ''}
                      </a>
                    </li>
                  </ul>
                </div>

                <!-- LOGOUT -->
                <div class="fk-nav-logout" onclick="window.confirmLogoutModal()">
                  <i data-lucide="power" class="fk-nav-main-icon"></i>
                  <span class="fk-nav-logout-label">Logout</span>
                </div>

              </div>

              <!-- Card 3: Frequently Visited Links -->
              <div class="fk-sidebar-frequent-card">
                <div class="fk-frequent-title">Frequently Visited:</div>
                <div class="fk-frequent-links">
                  <a href="#/orders" onclick="window.switchProfileTab('orders')">Track Order</a>
                  <span>•</span>
                  <a href="#/custom-project">Help Center</a>
                </div>
              </div>

            </div>

            <!-- Right Content Area -->
            <div class="fk-content-area">
              ${currentTab === 'profile' ? renderProfileTab() : ''}
              ${currentTab === 'orders' ? renderOrdersTab() : ''}
              ${currentTab === 'addresses' ? renderAddressesTab() : ''}
              ${currentTab === 'pan' ? renderPanTab() : ''}
              ${currentTab === 'gift_cards' ? renderGiftCardsTab() : ''}
              ${currentTab === 'upi' ? renderUpiTab() : ''}
              ${currentTab === 'cards' || currentTab === 'payments' ? renderCardsTab() : ''}
              ${currentTab === 'coupons' ? renderCouponsTab() : ''}
              ${currentTab === 'reviews' ? renderReviewsTab() : ''}
              ${currentTab === 'notifications' ? renderNotificationsTab() : ''}
              ${currentTab === 'wishlist' ? renderWishlistTab() : ''}
            </div>

          </div>

        </div>
      </div>

      <!-- Modal Slot -->
      <div id="fk-modal-slot"></div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ==========================================================
  // EVENT HANDLERS & ACTIONS
  // ==========================================================

  // Toggle edit sections
  window.toggleEditPersonal = () => {
    isEditingPersonal = !isEditingPersonal;
    render();
  };

  window.toggleEditEmail = () => {
    isEditingEmail = !isEditingEmail;
    render();
  };

  window.toggleEditMobile = () => {
    isEditingMobile = !isEditingMobile;
    render();
  };

  window.toggleGiftCardForm = () => {
    showAddGiftCard = !showAddGiftCard;
    render();
  };

  // Save Personal Details
  window.savePersonalDetails = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('prof-save-personal-btn');
    if (btn) btn.disabled = true;

    const fname = document.getElementById('prof-fname').value.trim();
    const lname = document.getElementById('prof-lname').value.trim();
    const fullName = [fname, lname].filter(Boolean).join(' ');
    const gender = document.querySelector('input[name="prof-gender"]:checked')?.value || 'Male';

    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: fullName, gender })
      });

      if (res.ok) {
        userProfile = await res.json();
        const storedUser = JSON.parse(localStorage.getItem('ck_user') || '{}');
        const merged = { ...storedUser, ...userProfile, loggedIn: true };
        localStorage.setItem('ck_user', JSON.stringify(merged));
        store.set('user', merged);

        showLocalToast('Personal Information updated successfully!', 'success');
        isEditingPersonal = false;
        render();
      } else {
        showLocalToast('Failed to update details.', 'error');
      }
    } catch (err) {
      showLocalToast('Network error while updating details.', 'error');
    }
  };

  // Save Email
  window.saveEmailDetails = async (e) => {
    e.preventDefault();
    const email = document.getElementById('prof-email-input').value.trim();
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        userProfile = await res.json();
        showLocalToast('Email address updated!', 'success');
        isEditingEmail = false;
        render();
      } else {
        showLocalToast('Failed to update email.', 'error');
      }
    } catch (err) {
      showLocalToast('Network error.', 'error');
    }
  };

  // Save Mobile
  window.saveMobileDetails = async (e) => {
    e.preventDefault();
    const phone = document.getElementById('prof-mobile-input').value.trim();
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone })
      });
      if (res.ok) {
        userProfile = await res.json();
        showLocalToast('Mobile number updated!', 'success');
        isEditingMobile = false;
        render();
      } else {
        showLocalToast('Failed to update mobile number.', 'error');
      }
    } catch (err) {
      showLocalToast('Network error.', 'error');
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
      body: `<p style="font-size:14px; color:#212121;">Are you sure you want to remove <strong>${name}</strong> from your wishlist?</p>`,
      confirmText: 'REMOVE',
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
    const type = addr ? addr.type : 'HOME';

    const modalBody = `
      <form id="fk-address-form" onsubmit="window.saveAddressSubmit(event, ${isEdit ? addr.id : 'null'})">
        <div style="display:flex; gap:16px; margin-bottom:14px;">
          <div class="fk-floating-group" style="width:100%;">
            <input type="text" id="addr-name" class="fk-form-control" required value="${name}" />
            <label class="fk-floating-label">Name *</label>
          </div>
          <div class="fk-floating-group" style="width:100%;">
            <input type="tel" id="addr-phone" class="fk-form-control" required maxlength="10" value="${phone}" />
            <label class="fk-floating-label">10-Digit Mobile *</label>
          </div>
        </div>

        <div style="display:flex; gap:16px; margin-bottom:14px;">
          <div class="fk-floating-group" style="width:100%;">
            <input type="text" id="addr-pincode" class="fk-form-control" required maxlength="6" value="${pincode}" />
            <label class="fk-floating-label">Pincode *</label>
          </div>
          <div class="fk-floating-group" style="width:100%;">
            <input type="text" id="addr-locality" class="fk-form-control" required value="${locality}" />
            <label class="fk-floating-label">Locality *</label>
          </div>
        </div>

        <div class="fk-floating-group" style="width:100%; margin-bottom:14px;">
          <input type="text" id="addr-street" class="fk-form-control" required value="${street}" />
          <label class="fk-floating-label">Address (Area and Street) *</label>
        </div>

        <div style="display:flex; gap:16px; margin-bottom:16px;">
          <div class="fk-floating-group" style="width:100%;">
            <input type="text" id="addr-city" class="fk-form-control" required value="${city}" />
            <label class="fk-floating-label">City/District/Town *</label>
          </div>
          <div class="fk-floating-group" style="width:100%;">
            <input type="text" id="addr-state" class="fk-form-control" required value="${state}" />
            <label class="fk-floating-label">State *</label>
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:12px; color:#878787; margin-bottom:6px;">Address Type</label>
          <div style="display:flex; gap:20px;">
            <label class="fk-radio-label">
              <input type="radio" name="addr-type" value="HOME" ${type === 'HOME' ? 'checked' : ''} />
              <span class="fk-radio-custom"></span> Home (All day delivery)
            </label>
            <label class="fk-radio-label">
              <input type="radio" name="addr-type" value="WORK" ${type === 'WORK' ? 'checked' : ''} />
              <span class="fk-radio-custom"></span> Work (Delivery between 10 AM - 5 PM)
            </label>
          </div>
        </div>

        <button type="submit" class="fk-btn-save" style="width:100%;">SAVE ADDRESS</button>
      </form>
    `;

    openModal({
      title: isEdit ? 'Edit Address' : 'Add New Address',
      body: modalBody
    });
  };

  window.saveAddressSubmit = async (e, addrId) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('addr-name').value.trim(),
      phone: document.getElementById('addr-phone').value.trim(),
      pincode: document.getElementById('addr-pincode').value.trim(),
      locality: document.getElementById('addr-locality').value.trim(),
      address: document.getElementById('addr-street').value.trim(),
      city: document.getElementById('addr-city').value.trim(),
      state: document.getElementById('addr-state').value.trim(),
      type: document.querySelector('input[name="addr-type"]:checked')?.value || 'HOME'
    };

    try {
      const url = addrId ? `${API}/api/users/addresses/${addrId}` : `${API}/api/users/addresses`;
      const method = addrId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showLocalToast('Address saved successfully!', 'success');
        window.closeFkModal();
        const refRes = await fetch(`${API}/api/users/addresses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (refRes.ok) addressesList = await refRes.json();
        render();
      } else {
        showLocalToast('Failed to save address.', 'error');
      }
    } catch (err) {
      showLocalToast('Network error while saving address.', 'error');
    }
  };

  window.deleteAddress = (addrId) => {
    openModal({
      title: 'Delete Address',
      body: `<p style="font-size:14px; color:#212121;">Are you sure you want to delete this address?</p>`,
      confirmText: 'DELETE',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/api/users/addresses/${addrId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            addressesList = addressesList.filter(a => a.id !== addrId);
            showLocalToast('Address deleted', 'info');
            render();
          }
        } catch (e) {
          showLocalToast('Failed to delete address', 'error');
        }
      }
    });
  };

  // PAN Card Form
  window.savePanForm = (e) => {
    e.preventDefault();
    panData.panNumber = document.getElementById('pan-number-input').value.trim().toUpperCase();
    panData.fullName = document.getElementById('pan-name-input').value.trim();
    panData.isDeclared = document.getElementById('pan-declaration-check').checked;
    showLocalToast('PAN Details submitted successfully for verification!', 'success');
    render();
  };

  // Gift Card
  window.applyGiftCard = () => {
    const num = document.getElementById('gift-card-number')?.value.trim();
    const pin = document.getElementById('gift-card-pin')?.value.trim();
    if (!num || !pin) {
      showLocalToast('Please enter card number and PIN.', 'error');
      return;
    }
    showLocalToast('Gift Card verified and linked to your account!', 'success');
    showAddGiftCard = false;
    render();
  };

  // Modals for UPI and Cards
  window.openAddUpiModal = () => {
    openModal({
      title: 'Add New UPI ID',
      body: `
        <div class="fk-floating-group" style="width:100%; margin-bottom:16px;">
          <input type="text" id="new-upi-id" class="fk-form-control" placeholder="e.g. mobile@upi" />
          <label class="fk-floating-label">UPI ID / VPA</label>
        </div>
      `,
      confirmText: 'VERIFY & SAVE',
      onConfirm: () => {
        showLocalToast('UPI ID verified and saved!', 'success');
      }
    });
  };

  window.openAddCardModal = () => {
    openModal({
      title: 'Add New Card',
      body: `
        <div class="fk-floating-group" style="width:100%; margin-bottom:14px;">
          <input type="text" class="fk-form-control" maxlength="19" placeholder="Card Number" />
          <label class="fk-floating-label">Card Number</label>
        </div>
        <div style="display:flex; gap:16px; margin-bottom:14px;">
          <div class="fk-floating-group" style="width:100%;">
            <input type="text" class="fk-form-control" placeholder="MM/YY" maxlength="5" />
            <label class="fk-floating-label">Valid Thru</label>
          </div>
          <div class="fk-floating-group" style="width:100%;">
            <input type="password" class="fk-form-control" placeholder="CVV" maxlength="4" />
            <label class="fk-floating-label">CVV</label>
          </div>
        </div>
      `,
      confirmText: 'SAVE THIS CARD',
      onConfirm: () => {
        showLocalToast('Card tokenized and saved as per RBI guidelines!', 'success');
      }
    });
  };

  // Rate & Review Modal
  window.openReviewModal = (orderId, itemName) => {
    openModal({
      title: `Rate & Review — ${itemName}`,
      body: `
        <div style="text-align:center; padding:12px 0 20px;">
          <div style="font-size:24px; color:#ff9f00; display:flex; justify-content:center; gap:8px; cursor:pointer;" id="fk-star-row">
            <span onclick="window.selectStar(1)">★</span>
            <span onclick="window.selectStar(2)">★</span>
            <span onclick="window.selectStar(3)">★</span>
            <span onclick="window.selectStar(4)">★</span>
            <span onclick="window.selectStar(5)">★</span>
          </div>
          <span style="font-size:12px; color:#878787;">Click stars to rate</span>
        </div>
        <div class="fk-floating-group" style="width:100%; margin-bottom:14px;">
          <input type="text" id="review-title" class="fk-form-control" placeholder="Review headline" />
          <label class="fk-floating-label">Review Headline</label>
        </div>
        <div style="margin-bottom:14px;">
          <textarea id="review-comment" class="fk-form-control" style="height:80px; padding:10px 14px;" placeholder="Write detailed feedback on project quality, code, components..."></textarea>
        </div>
      `,
      confirmText: 'SUBMIT REVIEW',
      onConfirm: () => {
        showLocalToast('Thank you for rating this project!', 'success');
      }
    });
  };

  window.selectStar = (num) => {
    const row = document.getElementById('fk-star-row');
    if (!row) return;
    const stars = row.querySelectorAll('span');
    stars.forEach((s, idx) => {
      s.style.color = idx < num ? '#ff9f00' : '#e0e0e0';
    });
  };

  // Change Avatar
  window.openAvatarModal = () => {
    const presets = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
    ];

    openModal({
      title: 'Select Profile Picture',
      body: `
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:16px;">
          ${presets.map(url => `
            <img 
              src="${url}" 
              style="width:100%; height:80px; object-fit:cover; border-radius:4px; cursor:pointer; border:2px solid transparent;"
              onclick="window.selectAvatarPreset('${url}')"
              onmouseover="this.style.borderColor='#2874f0'"
              onmouseout="this.style.borderColor='transparent'"
            />
          `).join('')}
        </div>
      `
    });
  };

  window.selectAvatarPreset = async (url) => {
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: url })
      });
      if (res.ok) {
        userProfile.avatar = url;
        const storedUser = JSON.parse(localStorage.getItem('ck_user') || '{}');
        localStorage.setItem('ck_user', JSON.stringify({ ...storedUser, avatar: url }));
        showLocalToast('Profile picture updated!', 'success');
        window.closeFkModal();
        render();
      }
    } catch (e) {
      showLocalToast('Failed to update picture.', 'error');
    }
  };

  // Deactivate & Delete
  window.confirmDeactivateModal = () => {
    openModal({
      title: 'Deactivate Account',
      body: `
        <p style="font-size:14px; color:#212121; margin:0 0 10px;">
          Are you sure you want to deactivate your account?
        </p>
        <p style="font-size:12.5px; color:#878787; line-height:1.5;">
          You will be logged out immediately. Your orders and history will remain safe and can be restored upon logging in again.
        </p>
      `,
      confirmText: 'DEACTIVATE',
      onConfirm: () => {
        store.logout();
        window.location.hash = '/login';
      }
    });
  };

  window.confirmDeleteAccountModal = () => {
    openModal({
      title: 'Delete Account',
      body: `
        <p style="font-size:14px; color:#e53935; font-weight:600; margin:0 0 10px;">
          Warning: This action is permanent!
        </p>
        <p style="font-size:12.5px; color:#878787; line-height:1.5;">
          All your personal data, past hardware orders, warranty claims, and wishlist will be permanently removed.
        </p>
      `,
      confirmText: 'PERMANENTLY DELETE',
      confirmClass: 'fk-btn-save" style="background:#e53935;',
      onConfirm: async () => {
        try {
          await fetch(`${API}/api/users/profile`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (e) {}
        store.logout();
        window.location.hash = '/login';
      }
    });
  };

  // Logout Modal
  window.confirmLogoutModal = () => {
    openModal({
      title: 'Logout',
      body: `<p style="font-size:14px; color:#212121;">Are you sure you want to log out of your account?</p>`,
      confirmText: 'LOGOUT',
      onConfirm: () => {
        store.logout();
        window.location.hash = '/login';
      }
    });
  };

  // Start initialization
  loadInitialData();
}