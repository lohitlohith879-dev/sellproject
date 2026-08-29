import { store } from '../store.js';

export function DashboardPage(container, params) {
  const activeTab = params.tab || 'orders';
  
  window.switchDashboardTab = (tab) => {
    window.location.hash = `/dashboard?tab=${tab}`;
  };
  
  function renderOrdersTab() {
    const orders = store.get('orders');
    
    if (orders.length === 0) {
      return `
        <div class="text-center" style="padding: var(--space-4xl) 0;">
          <i data-lucide="package" style="font-size: 48px; color: var(--text-tertiary); margin-bottom: var(--space-md); opacity: 0.5;"></i>
          <h3 class="heading-md" style="margin-bottom: var(--space-sm);">No Orders Yet</h3>
          <p class="text-secondary" style="margin-bottom: var(--space-xl);">You haven't placed any orders yet.</p>
          <a href="#/projects" class="btn btn-primary">Browse Projects</a>
        </div>
      `;
    }
    
    return `
      <div>
        <h2 class="heading-md" style="margin-bottom: var(--space-xl);">My Orders</h2>
        
        <div class="orders-list">
          ${orders.map(order => {
            
            // Define timeline steps based on status
            // Statuses: received, design, development, testing, ready, shipped, delivered
            const statuses = ['received', 'design', 'development', 'testing', 'ready', 'shipped', 'delivered'];
            const labels = ['Order Received', 'Designing', 'Development', 'Testing', 'Ready', 'Shipped', 'Delivered'];
            
            let currentIndex = statuses.indexOf(order.status);
            if (currentIndex === -1) currentIndex = 0; // Default if not found
            
            return `
              <div class="order-card glass-card">
                <div class="order-header border-bottom padding-bottom">
                  <div>
                    <div class="flex gap-sm align-center">
                      <span class="order-id-tag">${order.id}</span>
                      <span class="badge badge-${order.status === 'delivered' ? 'green' : 'blue'}">${order.status.toUpperCase()}</span>
                    </div>
                    <div class="order-date">Placed on ${new Date(order.date).toLocaleDateString()}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm text-secondary">Total</div>
                    <div class="font-mono font-bold text-accent">₹${new Intl.NumberFormat('en-IN').format(order.total)}</div>
                  </div>
                </div>
                
                <div class="order-items-list" style="margin: var(--space-md) 0; border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-md);">
                  ${order.items.map(item => `
                    <div class="order-item-row">
                      <div class="item-thumb"></div>
                      <div class="flex-1">
                        <div class="font-medium">${item.name}</div>
                        <div class="text-xs text-tertiary">Qty: ${item.quantity || 1}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
                
                <div>
                  <h4 class="text-sm font-semibold" style="margin-bottom: var(--space-sm);">Order Status</h4>
                  <div class="order-timeline">
                    ${statuses.map((status, index) => `
                      <div class="timeline-step">
                        <div class="flex-col align-center">
                          <div class="timeline-dot ${index < currentIndex ? 'completed' : ''} ${index === currentIndex ? 'active' : ''}"></div>
                          <div class="timeline-label">${labels[index]}</div>
                        </div>
                        ${index < statuses.length - 1 ? `
                          <div class="timeline-line ${index < currentIndex ? 'completed' : ''}"></div>
                        ` : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
                
                <div class="text-right" style="margin-top: var(--space-md);">
                  <button class="btn btn-secondary btn-sm"><i data-lucide="download"></i> Invoice</button>
                  ${order.status === 'delivered' ? `<button class="btn btn-primary btn-sm"><i data-lucide="star"></i> Leave Review</button>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  function renderDownloadsTab() {
    // Mock downloads based on orders
    const orders = store.get('orders');
    const downloads = [];
    
    orders.forEach(order => {
      // Only delivered orders or digital products have downloads
      if (order.status === 'delivered') {
        order.items.forEach(item => {
          downloads.push({
            name: item.name + ' - Source Code',
            type: 'ZIP Archive',
            size: '12 MB',
            date: order.date
          });
          downloads.push({
            name: item.name + ' - Circuit Diagram',
            type: 'PDF Document',
            size: '2 MB',
            date: order.date
          });
        });
      }
    });
    
    if (downloads.length === 0) {
      return `
        <div class="text-center" style="padding: var(--space-4xl) 0;">
          <i data-lucide="download-cloud" style="font-size: 48px; color: var(--text-tertiary); margin-bottom: var(--space-md); opacity: 0.5;"></i>
          <h3 class="heading-md" style="margin-bottom: var(--space-sm);">No Downloads Available</h3>
          <p class="text-secondary" style="margin-bottom: var(--space-xl);">Files will appear here once your order is processed or delivered.</p>
        </div>
      `;
    }
    
    return `
      <div>
        <h2 class="heading-md" style="margin-bottom: var(--space-xl);">My Downloads</h2>
        
        <div class="glass-card" style="padding: 0;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-subtle); background: var(--bg-secondary);">
                <th style="padding: var(--space-md) var(--space-lg); font-size: var(--fs-sm); color: var(--text-tertiary);">File Name</th>
                <th style="padding: var(--space-md) var(--space-lg); font-size: var(--fs-sm); color: var(--text-tertiary);">Type</th>
                <th style="padding: var(--space-md) var(--space-lg); font-size: var(--fs-sm); color: var(--text-tertiary);">Size</th>
                <th style="padding: var(--space-md) var(--space-lg); font-size: var(--fs-sm); color: var(--text-tertiary); text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${downloads.map(dl => `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: var(--space-md) var(--space-lg);">
                    <div class="font-medium">${dl.name}</div>
                    <div class="text-xs text-tertiary">Added: ${new Date(dl.date).toLocaleDateString()}</div>
                  </td>
                  <td style="padding: var(--space-md) var(--space-lg); color: var(--text-secondary); font-size: var(--fs-sm);">${dl.type}</td>
                  <td style="padding: var(--space-md) var(--space-lg); color: var(--text-secondary); font-size: var(--fs-sm);">${dl.size}</td>
                  <td style="padding: var(--space-md) var(--space-lg); text-align: right;">
                    <button class="btn btn-ghost btn-sm text-accent"><i data-lucide="download" style="width:16px; margin-right:4px;"></i> Download</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  
  function renderSavedTab() {
     // Simplified mock for saved projects
     return `
        <div class="text-center" style="padding: var(--space-4xl) 0;">
          <i data-lucide="heart" style="font-size: 48px; color: var(--text-tertiary); margin-bottom: var(--space-md); opacity: 0.5;"></i>
          <h3 class="heading-md" style="margin-bottom: var(--space-sm);">No Saved Projects</h3>
          <p class="text-secondary" style="margin-bottom: var(--space-xl);">Projects you save will appear here.</p>
        </div>
     `;
  }
  
  function renderProfileTab() {
    return `
      <div class="light-dashboard" style="padding: var(--space-xl); font-family: 'Inter', sans-serif;">
        <h2 class="heading-lg" style="margin-bottom: var(--space-xl); color: #1a202c;">Profile Dashboard</h2>
        
        <!-- Top Row -->
        <div class="profile-grid">
          
          <!-- Profile Card -->
          <div class="glass-card profile-card" style="padding:0; display: flex; flex-direction: column;">
            <div class="profile-banner"></div>
            <div class="profile-avatar-wrap">
              <img src="https://ui-avatars.com/api/?name=Lohith+R&background=random&color=fff&size=100" class="profile-avatar" alt="User Avatar">
            </div>
            <h3 class="profile-name">Lohith R</h3>
            <div><span class="profile-badge">Administrator</span></div>
            <p style="color: #718096; font-size: var(--fs-sm); margin-bottom: var(--space-xs);">lohith@example.com</p>
            <p style="color: #718096; font-size: var(--fs-sm); margin-bottom: var(--space-md);">+91 98765 43210</p>
            <div style="margin-top: auto; border-top: 1px solid #f0f0f0; padding: var(--space-md);">
              <span style="color: #718096; font-size: var(--fs-sm);">User ID: <span style="color: #0066ff; font-weight: 600;">PGU1001</span></span>
            </div>
          </div>
          
          <!-- Personal Info -->
          <div class="glass-card" style="padding: var(--space-xl);">
            <h4 style="color: #0066ff; font-size: var(--fs-md); margin-bottom: var(--space-lg); display: flex; align-items: center; gap: 8px;">
              <i data-lucide="user" style="width: 18px;"></i> Personal Information
            </h4>
            <div class="info-list">
              <div class="info-row"><span class="info-label">Full Name</span><span class="info-val">Lohith R</span></div>
              <div class="info-row"><span class="info-label">Email</span><span class="info-val">lohith@example.com</span></div>
              <div class="info-row"><span class="info-label">Mobile Number</span><span class="info-val">+91 98765 43210</span></div>
              <div class="info-row"><span class="info-label">User ID</span><span class="info-val">PGU1001</span></div>
              <div class="info-row"><span class="info-label">Role</span><span class="info-val" style="color: #48bb78;">Administrator</span></div>
              <div class="info-row"><span class="info-label">Location</span><span class="info-val">Bellary, Karnataka, India</span></div>
              <div class="info-row"><span class="info-label">Joined On</span><span class="info-val">15 Jan 2024</span></div>
              <div class="info-row"><span class="info-label">Last Login</span><span class="info-val">29 Aug 2025 06:45 PM</span></div>
              <div class="info-row"><span class="info-label">Account Status</span><span class="info-val"><span style="background:#e6fffa; color:#38b2ac; padding: 2px 8px; border-radius: 4px;">Active</span></span></div>
            </div>
          </div>
          
          <!-- System Info -->
          <div class="glass-card" style="padding: var(--space-xl);">
            <h4 style="color: #0066ff; font-size: var(--fs-md); margin-bottom: var(--space-lg); display: flex; align-items: center; gap: 8px;">
              <i data-lucide="monitor" style="width: 18px;"></i> System Information
            </h4>
            <div class="info-list">
              <div class="info-row"><span class="info-label">Substation / Location</span><span class="info-val">Bellary Substation</span></div>
              <div class="info-row"><span class="info-label">Connected Transformer</span><span class="info-val">TRF-11KV-01</span></div>
              <div class="info-row"><span class="info-label">System Type</span><span class="info-val">11kV Distribution</span></div>
              <div class="info-row"><span class="info-label">Monitoring Since</span><span class="info-val">15 Jan 2024</span></div>
              <div class="info-row"><span class="info-label">Firmware Version</span><span class="info-val">v2.4.1</span></div>
              <div class="info-row"><span class="info-label">Gateway ID</span><span class="info-val">GW-11KV-01</span></div>
              <div class="info-row"><span class="info-label">Number of Connected Devices</span><span class="info-val" style="color: #48bb78;">12</span></div>
              <div class="info-row"><span class="info-label">System Status</span><span class="info-val"><span style="background:#e6fffa; color:#38b2ac; padding: 2px 8px; border-radius: 4px;">Online</span></span></div>
            </div>
          </div>
          
        </div>

        <!-- Middle Row -->
        <div class="middle-grid">
          
          <!-- Connected Devices Table -->
          <div class="glass-card" style="padding: var(--space-xl);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
              <h4 style="color: #0066ff; font-size: var(--fs-md); display: flex; align-items: center; gap: 8px;">
                <i data-lucide="share-2" style="width: 18px;"></i> Connected Devices
              </h4>
              <button style="background: #edf2f7; color: #4299e1; padding: 4px 12px; border-radius: 4px; border: none; font-size: var(--fs-xs); font-weight: 600; cursor: pointer;">View All</button>
            </div>
            
            <table class="dash-table">
              <thead>
                <tr>
                  <th>Device Name</th>
                  <th>Device ID</th>
                  <th>Status</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: 500;">Fault Detector 1</td>
                  <td style="color: #718096;">FD-1001</td>
                  <td><span class="status-dot online"></span> <span style="color: #48bb78; font-weight: 600;">Online</span></td>
                  <td style="color: #718096;">29 Aug 2025 06:40 PM</td>
                </tr>
                <tr>
                  <td style="font-weight: 500;">Voltage Sensor 1</td>
                  <td style="color: #718096;">VS-1002</td>
                  <td><span class="status-dot online"></span> <span style="color: #48bb78; font-weight: 600;">Online</span></td>
                  <td style="color: #718096;">29 Aug 2025 06:41 PM</td>
                </tr>
                <tr>
                  <td style="font-weight: 500;">Current Sensor 1</td>
                  <td style="color: #718096;">CS-1003</td>
                  <td><span class="status-dot online"></span> <span style="color: #48bb78; font-weight: 600;">Online</span></td>
                  <td style="color: #718096;">29 Aug 2025 06:42 PM</td>
                </tr>
                <tr>
                  <td style="font-weight: 500;">Voltage Booster 1</td>
                  <td style="color: #718096;">VB-1004</td>
                  <td><span class="status-dot online"></span> <span style="color: #48bb78; font-weight: 600;">Online</span></td>
                  <td style="color: #718096;">29 Aug 2025 06:43 PM</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Recent Activity -->
          <div class="glass-card" style="padding: var(--space-xl);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
              <h4 style="color: #0066ff; font-size: var(--fs-md); display: flex; align-items: center; gap: 8px;">
                <i data-lucide="clock" style="width: 18px;"></i> Recent Activity
              </h4>
              <button style="background: #edf2f7; color: #4299e1; padding: 4px 12px; border-radius: 4px; border: none; font-size: var(--fs-xs); font-weight: 600; cursor: pointer;">View All</button>
            </div>
            
            <div class="timeline">
              <div class="timeline-item">
                <div class="timeline-dot green"></div>
                <div class="timeline-content">
                  <div class="timeline-title">Logged in successfully</div>
                  <div class="timeline-time">29 Aug 2025 06:45 PM <span style="float:right;">Web</span></div>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot blue"></div>
                <div class="timeline-content">
                  <div class="timeline-title">Viewed Real-time Monitor</div>
                  <div class="timeline-time">29 Aug 2025 06:30 PM <span style="float:right;">Web</span></div>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot orange"></div>
                <div class="timeline-content">
                  <div class="timeline-title">Fault Alert Acknowledged</div>
                  <div class="timeline-time">29 Aug 2025 05:55 PM <span style="float:right;">Web</span></div>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot purple"></div>
                <div class="timeline-content">
                  <div class="timeline-title">Settings Updated</div>
                  <div class="timeline-time">29 Aug 2025 05:20 PM <span style="float:right;">Web</span></div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        <!-- Bottom Row -->
        <div class="bottom-grid">
          
          <!-- Notification Settings -->
          <div class="glass-card" style="padding: var(--space-xl);">
            <h4 style="color: #0066ff; font-size: var(--fs-md); margin-bottom: var(--space-lg); display: flex; align-items: center; gap: 8px;">
              <i data-lucide="bell" style="width: 18px;"></i> Notification Settings
            </h4>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); border-bottom: 1px solid #f0f0f0; padding-bottom: var(--space-md);">
              <div>
                <div style="font-weight: 600; font-size: var(--fs-sm); color: #2d3748;">Fault Alerts</div>
                <div style="font-size: var(--fs-xs); color: #718096;">Receive alerts for all faults</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); border-bottom: 1px solid #f0f0f0; padding-bottom: var(--space-md);">
              <div>
                <div style="font-weight: 600; font-size: var(--fs-sm); color: #2d3748;">Voltage Alerts</div>
                <div style="font-size: var(--fs-xs); color: #718096;">Receive alerts for high/low voltage</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); border-bottom: 1px solid #f0f0f0; padding-bottom: var(--space-md);">
              <div>
                <div style="font-weight: 600; font-size: var(--fs-sm); color: #2d3748;">System Notifications</div>
                <div style="font-size: var(--fs-xs); color: #718096;">Receive system & maintenance updates</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 600; font-size: var(--fs-sm); color: #2d3748;">Email Notifications</div>
                <div style="font-size: var(--fs-xs); color: #718096;">Receive notifications via email</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Security -->
          <div class="glass-card" style="padding: var(--space-xl);">
            <h4 style="color: #0066ff; font-size: var(--fs-md); margin-bottom: var(--space-lg); display: flex; align-items: center; gap: 8px;">
              <i data-lucide="shield" style="width: 18px;"></i> Security
            </h4>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
              <span style="font-weight: 600; font-size: var(--fs-sm); color: #2d3748;">Password</span>
              <span style="color: #a0aec0; font-family: monospace;">••••••••</span>
              <button style="background: #edf2f7; color: #4a5568; padding: 4px 12px; border-radius: 4px; border: none; font-size: var(--fs-xs); font-weight: 600; cursor: pointer;">Change</button>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
              <span style="font-weight: 600; font-size: var(--fs-sm); color: #2d3748;">Two-Factor Authentication</span>
              <span style="color: #48bb78; font-weight: 600; font-size: var(--fs-sm);">Enabled</span>
              <button style="background: #edf2f7; color: #4a5568; padding: 4px 12px; border-radius: 4px; border: none; font-size: var(--fs-xs); font-weight: 600; cursor: pointer;">Manage</button>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
              <span style="font-weight: 600; font-size: var(--fs-sm); color: #2d3748;">Login Sessions</span>
              <span style="color: #718096; font-size: var(--fs-sm);">3 active sessions</span>
              <button style="background: #edf2f7; color: #4a5568; padding: 4px 12px; border-radius: 4px; border: none; font-size: var(--fs-xs); font-weight: 600; cursor: pointer;">View</button>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; font-size: var(--fs-sm); color: #2d3748;">Account Activity</span>
              <span style="color: #718096; font-size: var(--fs-sm);">View recent activity</span>
              <button style="background: #edf2f7; color: #4a5568; padding: 4px 12px; border-radius: 4px; border: none; font-size: var(--fs-xs); font-weight: 600; cursor: pointer;">View</button>
            </div>
          </div>
          
          <!-- Quick Stats -->
          <div class="glass-card" style="padding: var(--space-xl); border: none; box-shadow: none; background: transparent;">
            <h4 style="color: #0066ff; font-size: var(--fs-md); margin-bottom: var(--space-lg); display: flex; align-items: center; gap: 8px;">
              <i data-lucide="bar-chart-2" style="width: 18px;"></i> Quick Stats
            </h4>
            
            <div class="stats-grid">
              <div class="mini-stat-card">
                <div class="mini-stat-icon" style="background: #ebf8ff; color: #3182ce;"><i data-lucide="cpu" style="width:20px;"></i></div>
                <div class="mini-stat-info">
                  <h4>12</h4>
                  <span>Connected Devices</span>
                </div>
              </div>
              <div class="mini-stat-card">
                <div class="mini-stat-icon" style="background: #f0fff4; color: #38a169;"><i data-lucide="check-circle" style="width:20px;"></i></div>
                <div class="mini-stat-info">
                  <h4>0</h4>
                  <span>Active Faults</span>
                </div>
              </div>
              <div class="mini-stat-card">
                <div class="mini-stat-icon" style="background: #fffaf0; color: #dd6b20;"><i data-lucide="zap" style="width:20px;"></i></div>
                <div class="mini-stat-info">
                  <h4>238 V</h4>
                  <span>Avg Voltage</span>
                </div>
              </div>
              <div class="mini-stat-card">
                <div class="mini-stat-icon" style="background: #faf5ff; color: #805ad5;"><i data-lucide="activity" style="width:20px;"></i></div>
                <div class="mini-stat-info">
                  <h4>48.6 Hz</h4>
                  <span>Avg Frequency</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    `;
  }

  // Listen for real-time updates to re-render if we are on the dashboard page
  const reRender = () => {
    if (window.location.hash.startsWith('#/dashboard')) {
      const contentArea = document.querySelector('.dashboard-content');
      if (contentArea) {
        contentArea.innerHTML = activeTab === 'orders' ? renderOrdersTab() : 
                                activeTab === 'downloads' ? renderDownloadsTab() : 
                                activeTab === 'saved' ? renderSavedTab() : 
                                activeTab === 'profile' ? renderProfileTab() : '';
        if (window.lucide) window.lucide.createIcons();
      }
    }
  };

  store.on('orders', reRender);

  container.innerHTML = `
    <div class="dashboard-page container section">
      <div class="dashboard-header reveal">
        <h1 class="heading-xl">My Dashboard</h1>
        <p class="text-secondary">Welcome back, John!</p>
      </div>
      
      <div class="dashboard-layout reveal delay-1" style="margin-top: var(--space-2xl);">
        <!-- Sidebar Navigation -->
        <div class="dashboard-sidebar">
          <div class="dashboard-nav glass-card" style="padding: var(--space-sm);">
            <div class="dashboard-nav-item ${activeTab === 'orders' ? 'active' : ''}" onclick="switchDashboardTab('orders')">
              <i data-lucide="package"></i> My Orders
            </div>
            <div class="dashboard-nav-item ${activeTab === 'downloads' ? 'active' : ''}" onclick="switchDashboardTab('downloads')">
              <i data-lucide="download-cloud"></i> Downloads
            </div>
            <div class="dashboard-nav-item ${activeTab === 'saved' ? 'active' : ''}" onclick="switchDashboardTab('saved')">
              <i data-lucide="heart"></i> Saved Projects
            </div>
            <div class="dashboard-nav-item ${activeTab === 'profile' ? 'active' : ''}" onclick="switchDashboardTab('profile')">
              <i data-lucide="user"></i> Profile
            </div>
            <div class="dashboard-nav-item text-red" style="margin-top: var(--space-xl);" onclick="alert('Logged out!')">
              <i data-lucide="log-out"></i> Logout
            </div>
          </div>
        </div>
        
        <!-- Content Area -->
        <div class="dashboard-content">
          ${activeTab === 'orders' ? renderOrdersTab() : ''}
          ${activeTab === 'downloads' ? renderDownloadsTab() : ''}
          ${activeTab === 'saved' ? renderSavedTab() : ''}
          ${activeTab === 'profile' ? renderProfileTab() : ''}
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}
