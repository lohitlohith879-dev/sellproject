import { store } from '../store.js';

export function AdminPage(container, params) {
  const activeTab = params.tab || 'overview';
  
  window.switchAdminTab = (tab) => {
    window.location.hash = `/admin?tab=${tab}`;
  };
  
  function renderOverviewTab() {
    const orders = store.get('orders') || [];
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    
    return `
      <div>
        <div class="admin-stats-grid">
          <div class="stat-card">
            <div class="stat-icon cyan"><i data-lucide="indian-rupee"></i></div>
            <div class="stat-info">
              <h4>Total Sales</h4>
              <div class="stat-value">₹${(totalSales / 1000).toFixed(1)}k</div>
              <div class="stat-change positive"><i data-lucide="trending-up" style="width:12px;"></i> +12.5% this month</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon blue"><i data-lucide="shopping-bag"></i></div>
            <div class="stat-info">
              <h4>Total Orders</h4>
              <div class="stat-value">${orders.length}</div>
              <div class="stat-change positive"><i data-lucide="trending-up" style="width:12px;"></i> +5 this week</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon orange"><i data-lucide="users"></i></div>
            <div class="stat-info">
              <h4>Customers</h4>
              <div class="stat-value">124</div>
              <div class="stat-change positive"><i data-lucide="trending-up" style="width:12px;"></i> +12 new</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon purple"><i data-lucide="file-text"></i></div>
            <div class="stat-info">
              <h4>Custom Quotes</h4>
              <div class="stat-value">8</div>
              <div class="stat-change negative"><i data-lucide="alert-circle" style="width:12px;"></i> 3 pending</div>
            </div>
          </div>
        </div>
        
        <div class="grid grid-2">
          <!-- Recent Orders -->
          <div class="glass-card" style="padding: 0; overflow: hidden;">
            <div style="padding: var(--space-lg); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
              <h3 class="heading-sm">Recent Orders</h3>
              <a href="#/admin?tab=orders" class="text-xs text-accent">View All</a>
            </div>
            
            ${orders.length > 0 ? `
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orders.slice(0, 5).map(o => `
                    <tr>
                      <td class="font-mono text-accent">${o.id}</td>
                      <td>${new Date(o.date).toLocaleDateString()}</td>
                      <td><span class="badge badge-${o.status === 'delivered' ? 'green' : 'blue'}">${o.status}</span></td>
                      <td class="font-mono">₹${new Intl.NumberFormat('en-IN').format(o.total)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <div class="text-center text-secondary" style="padding: var(--space-2xl);">No orders found.</div>
            `}
          </div>
          
          <!-- Pending Quotes -->
          <div class="glass-card" style="padding: 0; overflow: hidden;">
            <div style="padding: var(--space-lg); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
              <h3 class="heading-sm">Pending Custom Requests</h3>
              <a href="#/admin?tab=quotes" class="text-xs text-accent">View All</a>
            </div>
            
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Customer</th>
                  <th>Budget</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-mono text-accent">REQ-847291</td>
                  <td>Rahul S.</td>
                  <td>₹15k - ₹50k</td>
                  <td><button class="btn btn-ghost btn-sm">Review</button></td>
                </tr>
                <tr>
                  <td class="font-mono text-accent">REQ-392810</td>
                  <td>Anjali M.</td>
                  <td>Under ₹5k</td>
                  <td><button class="btn btn-ghost btn-sm">Review</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
  
  window.updateOrderStatus = async (id, selectEl) => {
    const newStatus = selectEl.value;
    const success = await store.updateOrderStatus(id, newStatus);
    if (!success) {
      alert('Failed to update status');
      selectEl.value = store.get('orders').find(o => o.id === id).status; // Revert
    } else {
      // Create toast notification
      alert(`Order ${id} status updated to ${newStatus}`);
    }
  };
  
  function renderOrdersTab() {
     return `
      <div>
        <div class="flex-between" style="margin-bottom: var(--space-lg);">
          <h2 class="heading-md">Order Management</h2>
          <div class="search-wrapper" style="max-width: 300px; margin: 0;">
            <i data-lucide="search" class="search-icon" style="font-size: 14px;"></i>
            <input type="text" placeholder="Search orders..." style="padding: 0.5rem 1rem 0.5rem 36px; border-radius: var(--radius-md);">
          </div>
        </div>
        
        <div class="glass-card" style="padding: 0; overflow: auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${store.get('orders').map(o => {
                const contactInfo = o.contactInfo || {};
                const customerName = contactInfo.email ? contactInfo.email.split('@')[0] : 'Customer';
                return `
                <tr>
                  <td class="font-mono text-accent">${o.id}</td>
                  <td>${customerName}</td>
                  <td>${new Date(o.date).toLocaleDateString()}</td>
                  <td>
                    <select class="form-input" style="padding: 0.25rem; font-size: 12px; background: var(--bg-secondary);" onchange="updateOrderStatus('${o.id}', this)">
                      <option ${o.status === 'received' ? 'selected' : ''}>received</option>
                      <option ${o.status === 'development' ? 'selected' : ''}>development</option>
                      <option ${o.status === 'testing' ? 'selected' : ''}>testing</option>
                      <option ${o.status === 'shipped' ? 'selected' : ''}>shipped</option>
                      <option ${o.status === 'delivered' ? 'selected' : ''}>delivered</option>
                    </select>
                  </td>
                  <td class="font-mono">₹${new Intl.NumberFormat('en-IN').format(o.total)}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm"><i data-lucide="edit" style="width:14px;"></i></button>
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      </div>
     `;
  }

  // Listen for real-time updates to re-render if we are on the admin page
  const reRender = () => {
    if (window.location.hash.startsWith('#/admin')) {
      const contentArea = document.querySelector('.dashboard-content');
      if (contentArea) {
        contentArea.innerHTML = activeTab === 'overview' ? renderOverviewTab() : 
                                activeTab === 'orders' ? renderOrdersTab() : 
                                activeTab === 'projects' ? '<h2 class="heading-md">Projects Catalog</h2><p class="text-secondary">Project management interface coming soon.</p>' : 
                                activeTab === 'quotes' ? '<h2 class="heading-md">Custom Quotes</h2><p class="text-secondary">Quotation management interface coming soon.</p>' : 
                                activeTab === 'pricing' ? '<h2 class="heading-md">Pricing Rules</h2><p class="text-secondary">Dynamic pricing configuration coming soon.</p>' : '';
        if (window.lucide) window.lucide.createIcons();
      }
    }
  };

  store.on('orders', reRender);


  container.innerHTML = `
    <div class="admin-page container section">
      <div class="admin-header reveal">
        <h1 class="heading-xl">Admin Dashboard</h1>
        <p class="text-secondary">Manage store, orders, and projects.</p>
      </div>
      
      <div class="dashboard-layout reveal delay-1" style="margin-top: var(--space-2xl);">
        <!-- Sidebar Navigation -->
        <div class="dashboard-sidebar">
          <div class="dashboard-nav glass-card" style="padding: var(--space-sm);">
            <div class="dashboard-nav-item ${activeTab === 'overview' ? 'active' : ''}" onclick="switchAdminTab('overview')">
              <i data-lucide="pie-chart"></i> Overview
            </div>
            <div class="dashboard-nav-item ${activeTab === 'orders' ? 'active' : ''}" onclick="switchAdminTab('orders')">
              <i data-lucide="shopping-bag"></i> Orders
            </div>
            <div class="dashboard-nav-item ${activeTab === 'projects' ? 'active' : ''}" onclick="switchAdminTab('projects')">
              <i data-lucide="grid"></i> Projects Catalog
            </div>
            <div class="dashboard-nav-item ${activeTab === 'quotes' ? 'active' : ''}" onclick="switchAdminTab('quotes')">
              <i data-lucide="file-text"></i> Custom Quotes
            </div>
            <div class="dashboard-nav-item ${activeTab === 'pricing' ? 'active' : ''}" onclick="switchAdminTab('pricing')">
              <i data-lucide="indian-rupee"></i> Pricing Rules
            </div>
            <div class="dashboard-nav-item text-red" style="margin-top: var(--space-xl);" onclick="location.hash='/'">
              <i data-lucide="log-out"></i> Exit Admin
            </div>
          </div>
        </div>
        
        <!-- Content Area -->
        <div class="dashboard-content">
          ${activeTab === 'overview' ? renderOverviewTab() : ''}
          ${activeTab === 'orders' ? renderOrdersTab() : ''}
          ${activeTab === 'projects' ? '<h2 class="heading-md">Projects Catalog</h2><p class="text-secondary">Project management interface coming soon.</p>' : ''}
          ${activeTab === 'quotes' ? '<h2 class="heading-md">Custom Quotes</h2><p class="text-secondary">Quotation management interface coming soon.</p>' : ''}
          ${activeTab === 'pricing' ? '<h2 class="heading-md">Pricing Rules</h2><p class="text-secondary">Dynamic pricing configuration coming soon.</p>' : ''}
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}
