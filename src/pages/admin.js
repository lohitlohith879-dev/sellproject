import { store } from '../store.js';
import { socketManager } from '../socket/socket.js';

const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('ck_admin_token')}`
  };
}

export async function AdminPage() {
  const app = document.getElementById('app');

  const token = localStorage.getItem('ck_admin_token');

  if (!token) {
    window.location.hash = '#/admin-login';
    return;
  }

  let activeTab = 'overview';

  const switchAdminTab = async (tab) => {
    activeTab = tab;
    render();
  };

  const render = async () => {
    app.innerHTML = `
      <div class="admin-layout">

        <aside class="admin-sidebar">
          <div class="admin-brand">
            <div class="admin-logo">
              <i data-lucide="cpu"></i>
            </div>
            <div>
              <h2>CircuitKart</h2>
              <span>Admin Panel</span>
            </div>
          </div>

          <nav class="admin-nav">

            <button class="admin-nav-item ${activeTab === 'overview' ? 'active' : ''}"
              data-tab="overview">
              <i data-lucide="layout-dashboard"></i>
              <span>Dashboard</span>
            </button>

            <button class="admin-nav-item ${activeTab === 'orders' ? 'active' : ''}"
              data-tab="orders">
              <i data-lucide="shopping-bag"></i>
              <span>Orders</span>
            </button>

            <button class="admin-nav-item ${activeTab === 'live-tracking' ? 'active' : ''}"
              data-tab="live-tracking">
              <i data-lucide="map-pin"></i>
              <span>Live Tracking</span>
            </button>

            <button class="admin-nav-item ${activeTab === 'projects' ? 'active' : ''}"
              data-tab="projects">
              <i data-lucide="cpu"></i>
              <span>Projects</span>
            </button>

            <button class="admin-nav-item ${activeTab === 'add-project' ? 'active' : ''}"
              data-tab="add-project">
              <i data-lucide="plus-circle"></i>
              <span>Add Project</span>
            </button>

            <button class="admin-nav-item ${activeTab === 'components' ? 'active' : ''}"
              data-tab="components">
              <i data-lucide="box"></i>
              <span>Components</span>
            </button>

            <button class="admin-nav-item ${activeTab === 'pricing' ? 'active' : ''}"
              data-tab="pricing">
              <i data-lucide="indian-rupee"></i>
              <span>Pricing</span>
            </button>

            <button class="admin-nav-item ${activeTab === 'payment' ? 'active' : ''}"
              data-tab="payment">
              <i data-lucide="qr-code"></i>
              <span>Payment Settings</span>
            </button>

            <button class="admin-nav-item ${activeTab === 'users' ? 'active' : ''}"
              data-tab="users">
              <i data-lucide="users"></i>
              <span>Users</span>
            </button>

            <button class="admin-nav-item ${activeTab === 'quotes' ? 'active' : ''}"
              data-tab="quotes">
              <i data-lucide="file-text"></i>
              <span>Custom Quotes</span>
            </button>

            <button class="admin-nav-item ${activeTab === 'activity' ? 'active' : ''}"
              data-tab="activity">
              <i data-lucide="activity"></i>
              <span>Activity Log</span>
            </button>

          </nav>

          <div class="admin-sidebar-bottom">
            <button id="admin-logout" class="admin-logout">
              <i data-lucide="log-out"></i>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main class="admin-main">

          <header class="admin-header">
            <div>
              <h1 id="admin-page-title">Dashboard</h1>
              <p>Manage your CircuitKart platform</p>
            </div>

            <div class="admin-header-actions">
              <div class="admin-status">
                <span class="status-dot"></span>
                System Online
              </div>

              <div class="admin-profile">
                <div class="admin-avatar">
                  <i data-lucide="user"></i>
                </div>
                <div>
                  <strong>Administrator</strong>
                  <span>Admin</span>
                </div>
              </div>
            </div>
          </header>

          <section id="admin-content" class="admin-content">
            <div class="admin-loading">
              <div class="spinner"></div>
              <p>Loading...</p>
            </div>
          </section>

        </main>
      </div>
    `;

    document.querySelectorAll('.admin-nav-item').forEach(button => {
      button.addEventListener('click', () => {
        switchAdminTab(button.dataset.tab);
      });
    });

    document.getElementById('admin-logout')?.addEventListener('click', () => {
      localStorage.removeItem('ck_admin_token');
      localStorage.removeItem('ck_admin_user');
      localStorage.removeItem('ck_token');
      localStorage.removeItem('ck_user');

      window.location.hash = '#/admin-login';
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }

    const content = document.getElementById('admin-content');

    switch (activeTab) {
      case 'overview':
        await renderOverview(content);
        break;

      case 'orders':
        await renderOrders(content);
        break;

      case 'live-tracking':
        await renderLiveTracking(content);
        break;

      case 'projects':
        await renderProjects(content);
        break;

      case 'add-project':
        await renderAddProject(content);
        break;

      case 'components':
        await renderComponents(content);
        break;

      case 'pricing':
        await renderPricing(content);
        break;

      case 'payment':
        await renderPayment(content);
        break;

      case 'users':
        await renderUsers(content);
        break;

      case 'quotes':
        await renderQuotes(content);
        break;

      case 'activity':
        await renderActivity(content);
        break;

      default:
        await renderOverview(content);
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  const renderOverview = async (content) => {
    try {
      const response = await fetch(`${API}/admin/feed`, {
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }

      const data = await response.json();

      const orders = data.orders || [];
      const projects = data.projects || [];
      const users = data.users || [];
      const quotes = data.quotes || [];

      const totalRevenue = orders.reduce(
        (sum, order) => sum + Number(order.total || order.amount || 0),
        0
      );

      const pendingOrders = orders.filter(order =>
        ['pending', 'processing', 'confirmed'].includes(
          String(order.status || '').toLowerCase()
        )
      ).length;

      content.innerHTML = `
        <div class="admin-section-header">
          <div>
            <h2>Dashboard Overview</h2>
            <p>Monitor your store performance and activity.</p>
          </div>

          <button class="admin-refresh-btn" id="refresh-dashboard">
            <i data-lucide="refresh-cw"></i>
            Refresh
          </button>
        </div>

        <div class="admin-stats-grid">

          <div class="admin-stat-card">
            <div class="admin-stat-icon revenue">
              <i data-lucide="indian-rupee"></i>
            </div>
            <div>
              <span>Total Revenue</span>
              <strong>₹${totalRevenue.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon orders">
              <i data-lucide="shopping-bag"></i>
            </div>
            <div>
              <span>Total Orders</span>
              <strong>${orders.length}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon users">
              <i data-lucide="users"></i>
            </div>
            <div>
              <span>Customers</span>
              <strong>${users.length}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon quotes">
              <i data-lucide="file-text"></i>
            </div>
            <div>
              <span>Custom Quotes</span>
              <strong>${quotes.length}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon projects">
              <i data-lucide="cpu"></i>
            </div>
            <div>
              <span>Active Projects</span>
              <strong>${projects.length}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon pending">
              <i data-lucide="clock"></i>
            </div>
            <div>
              <span>Pending Orders</span>
              <strong>${pendingOrders}</strong>
            </div>
          </div>

        </div>

        <div class="admin-dashboard-grid">

          <div class="admin-panel">
            <div class="admin-panel-header">
              <div>
                <h3>Recent Orders</h3>
                <p>Latest customer orders</p>
              </div>

              <button class="admin-link-btn" id="view-all-orders">
                View All
              </button>
            </div>

            <div class="admin-table-wrapper">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  ${
                    orders.slice(0, 8).map(order => `
                      <tr>
                        <td>
                          <strong>#${order.id || order.orderId || '-'}</strong>
                        </td>

                        <td>
                          ${order.customerName || order.name || order.customer || '-'}
                        </td>

                        <td>
                          <span class="admin-status-badge ${String(order.status || 'pending').toLowerCase()}">
                            ${order.status || 'Pending'}
                          </span>
                        </td>

                        <td>
                          ₹${Number(order.total || order.amount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    `).join('')
                  }

                  ${
                    orders.length === 0
                      ? `
                        <tr>
                          <td colspan="4" class="admin-empty">
                            No orders found.
                          </td>
                        </tr>
                      `
                      : ''
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="admin-panel">
            <div class="admin-panel-header">
              <div>
                <h3>Quick Actions</h3>
                <p>Frequently used admin tools</p>
              </div>
            </div>

            <div class="admin-quick-actions">

              <button class="admin-action-card" data-action="add-project">
                <i data-lucide="plus-circle"></i>
                <div>
                  <strong>Add Project</strong>
                  <span>Create a new project</span>
                </div>
              </button>

              <button class="admin-action-card" data-action="components">
                <i data-lucide="box"></i>
                <div>
                  <strong>Manage Components</strong>
                  <span>Update component pricing</span>
                </div>
              </button>

              <button class="admin-action-card" data-action="live-tracking">
                <i data-lucide="map-pin"></i>
                <div>
                  <strong>Live Tracking</strong>
                  <span>Track active deliveries</span>
                </div>
              </button>

              <button class="admin-action-card" data-action="orders">
                <i data-lucide="shopping-bag"></i>
                <div>
                  <strong>Manage Orders</strong>
                  <span>View and update orders</span>
                </div>
              </button>

            </div>
          </div>

        </div>
      `;

      document.getElementById('refresh-dashboard')?.addEventListener(
        'click',
        () => render()
      );

      document.getElementById('view-all-orders')?.addEventListener(
        'click',
        () => switchAdminTab('orders')
      );

      document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', () => {
          switchAdminTab(button.dataset.action);
        });
      });

    } catch (error) {
      console.error(error);

      content.innerHTML = `
        <div class="admin-error">
          <i data-lucide="alert-circle"></i>
          <h3>Unable to load dashboard</h3>
          <p>${error.message}</p>

          <button class="admin-btn primary" id="retry-dashboard">
            Try Again
          </button>
        </div>
      `;

      document.getElementById('retry-dashboard')?.addEventListener(
        'click',
        () => render()
      );
    }
  };

  const renderOrders = async (content) => {
    try {
      const response = await fetch(`${API}/orders/all`, {
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to load orders');
      }

      const data = await response.json();

      const orders = Array.isArray(data)
        ? data
        : data.orders || [];

      content.innerHTML = `
        <div class="admin-section-header">
          <div>
            <h2>Orders</h2>
            <p>Manage customer orders and delivery status.</p>
          </div>

          <button class="admin-refresh-btn" id="refresh-orders">
            <i data-lucide="refresh-cw"></i>
            Refresh
          </button>
        </div>

        <div class="admin-panel">

          <div class="admin-table-wrapper">
            <table class="admin-table">

              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>

                ${
                  orders.map(order => `
                    <tr>

                      <td>
                        <strong>
                          #${order.id || order.orderId || '-'}
                        </strong>
                      </td>

                      <td>
                        ${order.customerName || order.name || '-'}
                      </td>

                      <td>
                        ${order.phone || order.contactInfo || '-'}
                      </td>

                      <td>
                        ₹${Number(
                          order.total ||
                          order.amount ||
                          order.totalAmount ||
                          0
                        ).toLocaleString('en-IN')}
                      </td>

                      <td>
                        <select
                          class="admin-status-select"
                          data-order-id="${order.id || order.orderId}"
                          data-current-status="${order.status || 'pending'}"
                        >
                          ${[
                            'pending',
                            'confirmed',
                            'processing',
                            'shipped',
                            'out_for_delivery',
                            'delivered',
                            'cancelled'
                          ].map(status => `
                            <option
                              value="${status}"
                              ${
                                String(order.status || 'pending').toLowerCase() === status
                                  ? 'selected'
                                  : ''
                              }
                            >
                              ${status.replaceAll('_', ' ')}
                            </option>
                          `).join('')}
                        </select>
                      </td>

                      <td>
                        ${
                          order.created_at
                            ? new Date(order.created_at).toLocaleString()
                            : '-'
                        }
                      </td>

                    </tr>
                  `).join('')
                }

                ${
                  orders.length === 0
                    ? `
                      <tr>
                        <td colspan="6" class="admin-empty">
                          No orders found.
                        </td>
                      </tr>
                    `
                    : ''
                }

              </tbody>

            </table>
          </div>

        </div>
      `;

      document.getElementById('refresh-orders')?.addEventListener(
        'click',
        () => renderOrders(content)
      );

      document.querySelectorAll('.admin-status-select').forEach(select => {
        select.addEventListener('change', async event => {
          const orderId = event.target.dataset.orderId;
          const status = event.target.value;

          try {
            const response = await fetch(
              `${API}/orders/${orderId}/status`,
              {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ status })
              }
            );

            if (!response.ok) {
              throw new Error('Failed to update order status');
            }

            showAdminToast(
              'Order status updated successfully',
              'success'
            );

          } catch (error) {
            console.error(error);

            showAdminToast(
              'Failed to update order status',
              'error'
            );

            renderOrders(content);
          }
        });
      });

    } catch (error) {
      console.error(error);

      content.innerHTML = `
        <div class="admin-error">
          <i data-lucide="alert-circle"></i>
          <h3>Unable to load orders</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  };
    const renderLiveTracking = async (content) => {
    window.__circuitKartAdminTrackingCleanup?.();
    window.__circuitKartAdminTrackingCleanup = null;

    let trackingTimer = null;
    let trackingSocketConnected = false;
    let trackingData = [];
    let map = null;
    let markers = {};
    let leafletReady = false;

    const loadLeaflet = () => {
      return new Promise((resolve, reject) => {
        if (window.L) {
          resolve(window.L);
          return;
        }

        const existingCSS = document.querySelector(
          'link[data-circuitkart-leaflet]'
        );

        if (!existingCSS) {
          const css = document.createElement('link');
          css.rel = 'stylesheet';
          css.href =
            'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          css.dataset.circuitkartLeaflet = 'true';
          document.head.appendChild(css);
        }

        const existingScript = document.querySelector(
          'script[data-circuitkart-leaflet]'
        );

        if (existingScript) {
          existingScript.addEventListener('load', () => {
            resolve(window.L);
          });

          existingScript.addEventListener('error', reject);
          return;
        }

        const script = document.createElement('script');
        script.src =
          'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.dataset.circuitkartLeaflet = 'true';

        script.onload = () => resolve(window.L);
        script.onerror = reject;

        document.head.appendChild(script);
      });
    };

    const distanceKm = (
      lat1,
      lng1,
      lat2,
      lng2
    ) => {
      const a = Number(lat1);
      const b = Number(lng1);
      const c = Number(lat2);
      const d = Number(lng2);

      if (
        !Number.isFinite(a) ||
        !Number.isFinite(b) ||
        !Number.isFinite(c) ||
        !Number.isFinite(d)
      ) {
        return null;
      }

      const earthRadius = 6371;

      const dLat = (c - a) * Math.PI / 180;
      const dLng = (d - b) * Math.PI / 180;

      const x =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
        Math.cos(a * Math.PI / 180) *
        Math.cos(c * Math.PI / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

      const y =
        2 *
        Math.atan2(
          Math.sqrt(x),
          Math.sqrt(1 - x)
        );

      return earthRadius * y;
    };

    const formatAge = timestamp => {
      if (!timestamp) {
        return 'No location yet';
      }

      const time = new Date(timestamp).getTime();

      if (!Number.isFinite(time)) {
        return 'Unknown';
      }

      const ageSeconds = Math.max(
        0,
        Math.floor((Date.now() - time) / 1000)
      );

      if (ageSeconds < 60) {
        return `${ageSeconds}s ago`;
      }

      const minutes = Math.floor(ageSeconds / 60);

      if (minutes < 60) {
        return `${minutes}m ago`;
      }

      const hours = Math.floor(minutes / 60);

      return `${hours}h ago`;
    };

    const getDeliveryCoordinates = item => {
      const lat = Number(
        item.deliveryLat ??
        item.deliveryLatitude ??
        item.shippingInfo?.latitude
      );

      const lng = Number(
        item.deliveryLng ??
        item.deliveryLongitude ??
        item.shippingInfo?.longitude
      );

      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng)
      ) {
        return {
          lat,
          lng
        };
      }

      return null;
    };

    const getDriverCoordinates = item => {
      const location = item.driverLocation;

      if (!location) {
        return null;
      }

      const lat = Number(location.latitude);
      const lng = Number(location.longitude);

      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng)
      ) {
        return {
          lat,
          lng
        };
      }

      return null;
    };

    const getStatusLabel = status => {
      return String(status || 'pending')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
    };

    const getStatusClass = status => {
      return String(status || 'pending')
        .toLowerCase()
        .replaceAll(' ', '_');
    };

    const renderSummary = () => {
      const active = trackingData.length;

      const online = trackingData.filter(
        item =>
          item.driverLocation &&
          item.driverLocation.isOnline !== false
      ).length;

      const assigned = trackingData.filter(
        item => item.driverName
      ).length;

      const withoutDriver = trackingData.filter(
        item => !item.driverName
      ).length;

      return `
        <div class="admin-stats-grid">

          <div class="admin-stat-card">
            <div class="admin-stat-icon orders">
              <i data-lucide="truck"></i>
            </div>
            <div>
              <span>Active Deliveries</span>
              <strong>${active}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon projects">
              <i data-lucide="radio"></i>
            </div>
            <div>
              <span>Drivers Online</span>
              <strong>${online}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon users">
              <i data-lucide="user-check"></i>
            </div>
            <div>
              <span>Assigned Drivers</span>
              <strong>${assigned}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon pending">
              <i data-lucide="user-x"></i>
            </div>
            <div>
              <span>Unassigned</span>
              <strong>${withoutDriver}</strong>
            </div>
          </div>

        </div>
      `;
    };

    const renderTrackingList = () => {
      if (!trackingData.length) {
        return `
          <div class="admin-empty-state">
            <i data-lucide="map-pin-off"></i>
            <h3>No active deliveries</h3>
            <p>
              Orders marked as shipped or out for delivery
              will appear here.
            </p>
          </div>
        `;
      }

      return `
        <div class="tracking-order-list">

          ${trackingData.map(item => {

            const driver = getDriverCoordinates(item);
            const delivery = getDeliveryCoordinates(item);

            let distance = null;

            if (driver && delivery) {
              distance = distanceKm(
                driver.lat,
                driver.lng,
                delivery.lat,
                delivery.lng
              );
            }

            const online =
              item.driverLocation &&
              item.driverLocation.isOnline !== false;

            const orderId =
              item.orderId ||
              item.id ||
              '';

            const customerName =
              item.customerName ||
              item.contactInfo?.name ||
              item.shippingInfo?.name ||
              'Customer';

            const driverName =
              item.driverName ||
              'No driver assigned';

            return `
              <div
                class="tracking-order-card"
                data-tracking-order="${orderId}"
              >

                <div class="tracking-order-top">

                  <div>
                    <strong>
                      #${orderId}
                    </strong>

                    <span class="admin-status-badge ${getStatusClass(item.status)}">
                      ${getStatusLabel(item.status)}
                    </span>
                  </div>

                  <button
                    class="tracking-focus-btn"
                    data-focus-order="${orderId}"
                    title="Focus on map"
                  >
                    <i data-lucide="crosshair"></i>
                  </button>

                </div>

                <div class="tracking-customer">
                  <i data-lucide="user"></i>

                  <div>
                    <strong>${customerName}</strong>

                    <span>
                      ${
                        item.shippingInfo?.address ||
                        item.shippingInfo?.city ||
                        'Delivery location'
                      }
                    </span>
                  </div>
                </div>

                <div class="tracking-driver">

                  <div class="tracking-driver-avatar">
                    <i data-lucide="truck"></i>
                  </div>

                  <div class="tracking-driver-info">
                    <strong>${driverName}</strong>

                    <span>
                      ${
                        item.driverPhone ||
                        'No phone number'
                      }
                    </span>
                  </div>

                  <span class="
                    tracking-online-status
                    ${online ? 'online' : 'offline'}
                  ">
                    <span class="tracking-status-dot"></span>
                    ${online ? 'Online' : 'Offline'}
                  </span>

                </div>

                <div class="tracking-details">

                  <div>
                    <span>Driver location</span>
                    <strong>
                      ${
                        driver
                          ? `${driver.lat.toFixed(5)}, ${driver.lng.toFixed(5)}`
                          : 'Waiting for GPS'
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Last update</span>
                    <strong>
                      ${
                        item.driverLocation
                          ? formatAge(item.driverLocation.timestamp)
                          : 'No update'
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Destination</span>
                    <strong>
                      ${
                        delivery
                          ? `${delivery.lat.toFixed(5)}, ${delivery.lng.toFixed(5)}`
                          : 'Not available'
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Distance</span>
                    <strong>
                      ${
                        distance !== null
                          ? `${distance.toFixed(2)} km`
                          : 'Calculating...'
                      }
                    </strong>
                  </div>

                </div>

                <button
                  class="admin-btn primary tracking-assign-btn"
                  data-assign-order="${orderId}"
                >
                  <i data-lucide="${
                    item.driverName
                      ? 'user-cog'
                      : 'user-plus'
                  }"></i>

                  ${
                    item.driverName
                      ? 'Reassign Driver'
                      : 'Assign Driver'
                  }
                </button>

              </div>
            `;
          }).join('')}

        </div>
      `;
    };

    const updateMap = () => {
      if (!map || !window.L) {
        return;
      }

      Object.values(markers).forEach(marker => {
        try {
          map.removeLayer(marker);
        } catch (_) {}
      });

      markers = {};

      const bounds = [];

      trackingData.forEach(item => {
        const orderId =
          item.orderId ||
          item.id;

        const driver = getDriverCoordinates(item);
        const delivery = getDeliveryCoordinates(item);

        if (driver) {
          const driverIcon = window.L.divIcon({
            className: 'circuitkart-driver-marker',
            html: `
              <div class="driver-map-marker">
                <span class="driver-map-pulse"></span>
                <span class="driver-map-icon">
                  🚚
                </span>
              </div>
            `,
            iconSize: [42, 42],
            iconAnchor: [21, 21]
          });

          const marker = window.L.marker(
            [driver.lat, driver.lng],
            {
              icon: driverIcon
            }
          ).addTo(map);

          marker.bindPopup(`
            <div class="tracking-popup">

              <strong>
                Driver: ${
                  item.driverName ||
                  'Unassigned'
                }
              </strong>

              <div>
                Order:
                #${orderId}
              </div>

              <div>
                Status:
                ${getStatusLabel(item.status)}
              </div>

              <div>
                Updated:
                ${
                  item.driverLocation
                    ? formatAge(
                        item.driverLocation.timestamp
                      )
                    : 'Unknown'
                }
              </div>

            </div>
          `);

          markers[`driver-${orderId}`] = marker;

          bounds.push([
            driver.lat,
            driver.lng
          ]);
        }

        if (delivery) {
          const deliveryIcon = window.L.divIcon({
            className: 'circuitkart-delivery-marker',
            html: `
              <div class="delivery-map-marker">
                <span>📍</span>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 36]
          });

          const marker = window.L.marker(
            [delivery.lat, delivery.lng],
            {
              icon: deliveryIcon
            }
          ).addTo(map);

          marker.bindPopup(`
            <div class="tracking-popup">

              <strong>
                Delivery Destination
              </strong>

              <div>
                Order:
                #${orderId}
              </div>

              <div>
                Customer:
                ${
                  item.customerName ||
                  'Customer'
                }
              </div>

            </div>
          `);

          markers[`delivery-${orderId}`] = marker;

          bounds.push([
            delivery.lat,
            delivery.lng
          ]);
        }

        if (driver && delivery) {
          const line = window.L.polyline(
            [
              [driver.lat, driver.lng],
              [delivery.lat, delivery.lng]
            ],
            {
              weight: 4,
              opacity: 0.65,
              dashArray: '8 8'
            }
          ).addTo(map);

          markers[`route-${orderId}`] = line;
        }
      });

      if (bounds.length && !map.__hasInitialBounds) {
        map.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: 15
        });

        map.__hasInitialBounds = true;
      }
    };

    const focusOrder = orderId => {
      const driverMarker =
        markers[`driver-${orderId}`];

      const deliveryMarker =
        markers[`delivery-${orderId}`];

      const points = [];

      if (driverMarker) {
        points.push(
          driverMarker.getLatLng()
        );
      }

      if (deliveryMarker) {
        points.push(
          deliveryMarker.getLatLng()
        );
      }

      if (!map || !points.length) {
        return;
      }

      if (points.length === 1) {
        map.setView(
          points[0],
          16
        );
      } else {
        map.fitBounds(points, {
          padding: [60, 60],
          maxZoom: 16
        });
      }

      if (driverMarker) {
        driverMarker.openPopup();
      }
    };

    const attachTrackingEvents = () => {
      document
        .querySelectorAll('[data-focus-order]')
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              focusOrder(
                button.dataset.focusOrder
              );
            }
          );
        });

      document
        .querySelectorAll('[data-assign-order]')
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              openAssignDriverModal(
                button.dataset.assignOrder
              );
            }
          );
        });
    };

    const renderContent = async () => {
      content.innerHTML = `
        <div class="admin-section-header">

          <div>
            <h2>Live Delivery Tracking</h2>
            <p>
              Monitor drivers and active deliveries
              in real time.
            </p>
          </div>

          <div class="admin-section-actions">

            <span class="tracking-connection-status ${
              trackingSocketConnected
                ? 'connected'
                : 'disconnected'
            }">

              <span class="tracking-status-dot"></span>

              ${
                trackingSocketConnected
                  ? 'Live'
                  : 'Updating'
              }

            </span>

            <button
              class="admin-refresh-btn"
              id="refresh-live-tracking"
            >
              <i data-lucide="refresh-cw"></i>
              Refresh
            </button>

          </div>

        </div>

        ${renderSummary()}

        <div class="live-tracking-layout">

          <div class="admin-panel live-map-panel">

            <div class="admin-panel-header">

              <div>
                <h3>Live Map</h3>
                <p>
                  Driver and delivery locations
                </p>
              </div>

              <div class="tracking-map-legend">

                <span>
                  <span class="legend-marker driver"></span>
                  Driver
                </span>

                <span>
                  <span class="legend-marker destination"></span>
                  Destination
                </span>

              </div>

            </div>

            <div
              id="admin-live-map"
              class="admin-live-map"
            >
              <div class="tracking-map-loading">
                <div class="spinner"></div>
                <p>Loading live map...</p>
              </div>
            </div>

          </div>

          <div class="admin-panel tracking-list-panel">

            <div class="admin-panel-header">
              <div>
                <h3>Active Deliveries</h3>
                <p>
                  ${
                    trackingData.length
                  } active delivery${
                    trackingData.length === 1
                      ? ''
                      : 'ies'
                  }
                </p>
              </div>
            </div>

            ${renderTrackingList()}

          </div>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }

      document
        .getElementById('refresh-live-tracking')
        ?.addEventListener(
          'click',
          () => loadTracking()
        );

      attachTrackingEvents();

      try {
        await loadLeaflet();

        leafletReady = true;

        const mapElement =
          document.getElementById(
            'admin-live-map'
          );

        if (!mapElement) {
          return;
        }

        mapElement.innerHTML = '';

        map = window.L.map(
          mapElement,
          {
            zoomControl: true
          }
        ).setView(
          [20.5937, 78.9629],
          5
        );

        window.L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            maxZoom: 19,
            attribution:
              '&copy; OpenStreetMap contributors'
          }
        ).addTo(map);

        updateMap();

        setTimeout(() => {
          map?.invalidateSize();
        }, 100);

      } catch (error) {
        console.error(
          'Leaflet loading error:',
          error
        );

        const mapElement =
          document.getElementById(
            'admin-live-map'
          );

        if (mapElement) {
          mapElement.innerHTML = `
            <div class="tracking-map-error">
              <i data-lucide="map-off"></i>
              <h3>Map unavailable</h3>
              <p>
                Unable to load the map.
                Check your internet connection.
              </p>
            </div>
          `;

          if (window.lucide) {
            window.lucide.createIcons();
          }
        }
      }
    };

    const loadTracking = async () => {
      try {
        const response = await fetch(
          `${API}/tracking/active`,
          {
            headers: authHeaders()
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem(
              'ck_admin_token'
            );

            window.location.hash =
              '#/admin-login';

            return;
          }

          throw new Error(
            `Tracking request failed: ${response.status}`
          );
        }

        const data = await response.json();

        trackingData = Array.isArray(data)
          ? data
          : data.orders ||
            data.active ||
            data.data ||
            [];

        await renderContent();

      } catch (error) {
        console.error(
          'Live tracking error:',
          error
        );

        content.innerHTML = `
          <div class="admin-error">

            <i data-lucide="alert-circle"></i>

            <h3>
              Unable to load live tracking
            </h3>

            <p>
              ${error.message}
            </p>

            <button
              class="admin-btn primary"
              id="retry-live-tracking"
            >
              <i data-lucide="refresh-cw"></i>
              Try Again
            </button>

          </div>
        `;

        document
          .getElementById(
            'retry-live-tracking'
          )
          ?.addEventListener(
            'click',
            () => loadTracking()
          );

        if (window.lucide) {
          window.lucide.createIcons();
        }
      }
    };

    const openAssignDriverModal = orderId => {
      const order = trackingData.find(
        item =>
          String(
            item.orderId ||
            item.id
          ) === String(orderId)
      );

      if (!order) {
        return;
      }

      document
        .getElementById(
          'circuitkart-driver-modal'
        )
        ?.remove();

      const modal = document.createElement(
        'div'
      );

      modal.id =
        'circuitkart-driver-modal';

      modal.className =
        'admin-modal-overlay';

      modal.innerHTML = `
        <div class="admin-modal">

          <div class="admin-modal-header">

            <div>
              <h3>
                ${
                  order.driverName
                    ? 'Reassign Driver'
                    : 'Assign Driver'
                }
              </h3>

              <p>
                Order #${orderId}
              </p>
            </div>

            <button
              class="admin-modal-close"
              id="close-driver-modal"
            >
              <i data-lucide="x"></i>
            </button>

          </div>

          <form
            id="driver-assignment-form"
            class="admin-form"
          >

            <div class="admin-form-group">

              <label>
                Driver Name
              </label>

              <input
                type="text"
                id="tracking-driver-name"
                placeholder="Enter driver name"
                value="${
                  order.driverName || ''
                }"
                required
              />

            </div>

            <div class="admin-form-group">

              <label>
                Driver Phone
              </label>

              <input
                type="tel"
                id="tracking-driver-phone"
                placeholder="Enter driver phone"
                value="${
                  order.driverPhone || ''
                }"
              />

            </div>

            <div class="admin-form-grid">

              <div class="admin-form-group">

                <label>
                  Delivery Latitude
                </label>

                <input
                  type="number"
                  step="any"
                  id="tracking-delivery-lat"
                  placeholder="Latitude"
                  value="${
                    order.deliveryLat ??
                    ''
                  }"
                />

              </div>

              <div class="admin-form-group">

                <label>
                  Delivery Longitude
                </label>

                <input
                  type="number"
                  step="any"
                  id="tracking-delivery-lng"
                  placeholder="Longitude"
                  value="${
                    order.deliveryLng ??
                    ''
                  }"
                />

              </div>

            </div>

            <div class="admin-form-help">

              <i data-lucide="info"></i>

              <span>
                Delivery coordinates are used
                to calculate the driver's distance
                from the destination.
              </span>

            </div>

            <div class="admin-modal-actions">

              <button
                type="button"
                class="admin-btn secondary"
                id="cancel-driver-modal"
              >
                Cancel
              </button>

              <button
                type="submit"
                class="admin-btn primary"
                id="save-driver-assignment"
              >
                <i data-lucide="save"></i>
                Save Assignment
              </button>

            </div>

          </form>

        </div>
      `;

      document.body.appendChild(modal);

      if (window.lucide) {
        window.lucide.createIcons();
      }

      const close = () => {
        modal.remove();
      };

      document
        .getElementById(
          'close-driver-modal'
        )
        ?.addEventListener(
          'click',
          close
        );

      document
        .getElementById(
          'cancel-driver-modal'
        )
        ?.addEventListener(
          'click',
          close
        );

      modal.addEventListener(
        'click',
        event => {
          if (
            event.target === modal
          ) {
            close();
          }
        }
      );

      document
        .getElementById(
          'driver-assignment-form'
        )
        ?.addEventListener(
          'submit',
          async event => {

            event.preventDefault();

            const saveButton =
              document.getElementById(
                'save-driver-assignment'
              );

            const driverName =
              document
                .getElementById(
                  'tracking-driver-name'
                )
                .value.trim();

            const driverPhone =
              document
                .getElementById(
                  'tracking-driver-phone'
                )
                .value.trim();

            const latValue =
              document
                .getElementById(
                  'tracking-delivery-lat'
                )
                .value.trim();

            const lngValue =
              document
                .getElementById(
                  'tracking-delivery-lng'
                )
                .value.trim();

            const deliveryLat =
              latValue === ''
                ? null
                : Number(latValue);

            const deliveryLng =
              lngValue === ''
                ? null
                : Number(lngValue);

            if (!driverName) {
              showAdminToast(
                'Driver name is required',
                'error'
              );

              return;
            }

            if (
              deliveryLat !== null &&
              !Number.isFinite(
                deliveryLat
              )
            ) {
              showAdminToast(
                'Invalid delivery latitude',
                'error'
              );

              return;
            }

            if (
              deliveryLng !== null &&
              !Number.isFinite(
                deliveryLng
              )
            ) {
              showAdminToast(
                'Invalid delivery longitude',
                'error'
              );

              return;
            }

            try {

              saveButton.disabled = true;

              saveButton.innerHTML = `
                <span class="spinner small"></span>
                Saving...
              `;

              const response =
                await fetch(
                  `${API}/tracking/assign`,
                  {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                      orderId,
                      driverName,
                      driverPhone,
                      deliveryLat,
                      deliveryLng
                    })
                  }
                );

              const result =
                await response.json()
                  .catch(() => ({}));

              if (!response.ok) {
                throw new Error(
                  result.error ||
                  'Failed to assign driver'
                );
              }

              close();

              showAdminToast(
                'Driver assignment saved successfully',
                'success'
              );

              await loadTracking();

            } catch (error) {

              console.error(
                'Driver assignment error:',
                error
              );

              showAdminToast(
                error.message ||
                'Failed to assign driver',
                'error'
              );

              saveButton.disabled = false;

              saveButton.innerHTML = `
                <i data-lucide="save"></i>
                Save Assignment
              `;

              if (window.lucide) {
                window.lucide.createIcons();
              }
            }
          }
        );
    };

    const handleTrackingLocation = payload => {
      if (!payload) {
        return;
      }

      const orderId =
        payload.orderId ||
        payload.id;

      if (!orderId) {
        return;
      }

      const index =
        trackingData.findIndex(
          item =>
            String(
              item.orderId ||
              item.id
            ) === String(orderId)
        );

      if (index === -1) {
        loadTracking();
        return;
      }

      const current =
        trackingData[index];

      trackingData[index] = {
        ...current,

        driverLocation: {
          ...(current.driverLocation || {}),
          latitude:
            payload.latitude ??
            payload.location?.latitude,
          longitude:
            payload.longitude ??
            payload.location?.longitude,
          timestamp:
            payload.timestamp ||
            payload.location?.timestamp ||
            new Date().toISOString(),
          isOnline:
            payload.isOnline ??
            payload.location?.isOnline ??
            true
        }
      };

      updateMap();

      const orderCard =
        document.querySelector(
          `[data-tracking-order="${CSS.escape(String(orderId))}"]`
        );

      if (orderCard) {
        const details =
          orderCard.querySelector(
            '.tracking-details'
          );

        const driver =
          getDriverCoordinates(
            trackingData[index]
          );

        const delivery =
          getDeliveryCoordinates(
            trackingData[index]
          );

        let distance = null;

        if (driver && delivery) {
          distance = distanceKm(
            driver.lat,
            driver.lng,
            delivery.lat,
            delivery.lng
          );
        }

        if (details) {
          const values =
            details.querySelectorAll(
              'div'
            );

          if (values[0]) {
            const strong =
              values[0].querySelector(
                'strong'
              );

            if (strong && driver) {
              strong.textContent =
                `${driver.lat.toFixed(5)}, ${driver.lng.toFixed(5)}`;
            }
          }

          if (values[1]) {
            const strong =
              values[1].querySelector(
                'strong'
              );

            if (strong) {
              strong.textContent =
                formatAge(
                  trackingData[index]
                    .driverLocation
                    .timestamp
                );
            }
          }

          if (values[3]) {
            const strong =
              values[3].querySelector(
                'strong'
              );

            if (
              strong &&
              distance !== null
            ) {
              strong.textContent =
                `${distance.toFixed(2)} km`;
            }
          }
        }
      }
    };

    const handleDriverAssigned =
      payload => {
        if (!payload) {
          return;
        }

        loadTracking();
      };

    try {
      if (socketManager) {

        socketManager.on?.(
          'connection',
          status => {
            trackingSocketConnected =
              Boolean(status);

            const statusElement =
              document.querySelector(
                '.tracking-connection-status'
              );

            if (statusElement) {
              statusElement.classList.toggle(
                'connected',
                trackingSocketConnected
              );

              statusElement.classList.toggle(
                'disconnected',
                !trackingSocketConnected
              );

              statusElement.innerHTML = `
                <span class="tracking-status-dot"></span>
                ${
                  trackingSocketConnected
                    ? 'Live'
                    : 'Updating'
                }
              `;
            }
          }
        );

        socketManager.on?.(
          'tracking:location',
          handleTrackingLocation
        );

        socketManager.on?.(
          'tracking:driver_assigned',
          handleDriverAssigned
        );

        trackingSocketConnected =
          Boolean(
            socketManager.socket?.connected
          );
      }

    } catch (error) {
      console.warn(
        'Unable to connect tracking socket:',
        error
      );
    }

    await loadTracking();

    trackingTimer = setInterval(
      () => {
        if (
          !trackingSocketConnected
        ) {
          loadTracking();
        }
      },
      10000
    );

    window.__circuitKartAdminTrackingCleanup =
      () => {

        if (trackingTimer) {
          clearInterval(
            trackingTimer
          );

          trackingTimer = null;
        }

        try {
          socketManager.off?.(
            'connection'
          );

          socketManager.off?.(
            'tracking:location',
            handleTrackingLocation
          );

          socketManager.off?.(
            'tracking:driver_assigned',
            handleDriverAssigned
          );
        } catch (_) {}

        if (map) {
          try {
            map.remove();
          } catch (_) {}

          map = null;
        }

        markers = {};
        leafletReady = false;
      };

  };
    const renderProjects = async content => {
    try {
      const response = await fetch(
        `${API}/admin/projects`,
        {
          headers: authHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(
          'Failed to load projects'
        );
      }

      const data = await response.json();

      const projects = Array.isArray(data)
        ? data
        : data.projects || [];

      content.innerHTML = `
        <div class="admin-section-header">
          <div>
            <h2>Projects</h2>
            <p>Manage CircuitKart projects.</p>
          </div>

          <button
            class="admin-btn primary"
            id="add-project-from-list"
          >
            <i data-lucide="plus"></i>
            Add Project
          </button>
        </div>

        <div class="admin-panel">

          <div class="admin-table-wrapper">
            <table class="admin-table">

              <thead>
                <tr>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                ${
                  projects.map(project => `
                    <tr>

                      <td>
                        <div class="admin-project-cell">

                          ${
                            project.image
                              ? `
                                <img
                                  src="${project.image}"
                                  alt=""
                                />
                              `
                              : `
                                <div class="admin-project-placeholder">
                                  <i data-lucide="cpu"></i>
                                </div>
                              `
                          }

                          <div>
                            <strong>
                              ${project.name || '-'}
                            </strong>

                            <span>
                              ${project.slug || project.id || '-'}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        ${project.category || '-'}
                      </td>

                      <td>
                        ${project.difficulty || '-'}
                      </td>

                      <td>
                        ₹${Number(
                          project.price || 0
                        ).toLocaleString('en-IN')}
                      </td>

                      <td>
                        <span class="
                          admin-status-badge
                          ${
                            project.active === 0
                              ? 'cancelled'
                              : 'delivered'
                          }
                        ">
                          ${
                            project.active === 0
                              ? 'Inactive'
                              : 'Active'
                          }
                        </span>
                      </td>

                      <td>

                        <div class="admin-table-actions">

                          <button
                            class="admin-icon-btn edit-project"
                            data-project-id="${project.id}"
                            title="Edit"
                          >
                            <i data-lucide="edit"></i>
                          </button>

                          <button
                            class="admin-icon-btn danger delete-project"
                            data-project-id="${project.id}"
                            title="Delete"
                          >
                            <i data-lucide="trash-2"></i>
                          </button>

                        </div>

                      </td>

                    </tr>
                  `).join('')
                }

                ${
                  projects.length === 0
                    ? `
                      <tr>
                        <td
                          colspan="6"
                          class="admin-empty"
                        >
                          No projects found.
                        </td>
                      </tr>
                    `
                    : ''
                }

              </tbody>

            </table>
          </div>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }

      document
        .getElementById(
          'add-project-from-list'
        )
        ?.addEventListener(
          'click',
          () => switchAdminTab(
            'add-project'
          )
        );

      document
        .querySelectorAll(
          '.edit-project'
        )
        .forEach(button => {

          button.addEventListener(
            'click',
            () => {

              const project =
                projects.find(
                  item =>
                    String(item.id) ===
                    String(
                      button.dataset.projectId
                    )
                );

              if (project) {
                openProjectEditor(
                  project
                );
              }

            }
          );

        });

      document
        .querySelectorAll(
          '.delete-project'
        )
        .forEach(button => {

          button.addEventListener(
            'click',
            async () => {

              const project =
                projects.find(
                  item =>
                    String(item.id) ===
                    String(
                      button.dataset.projectId
                    )
                );

              if (!project) {
                return;
              }

              const confirmed =
                confirm(
                  `Delete "${project.name}"?`
                );

              if (!confirmed) {
                return;
              }

              try {

                const deleteResponse =
                  await fetch(
                    `${API}/admin/projects/${project.id}`,
                    {
                      method: 'DELETE',
                      headers: authHeaders()
                    }
                  );

                if (
                  !deleteResponse.ok
                ) {
                  const result =
                    await deleteResponse
                      .json()
                      .catch(
                        () => ({})
                      );

                  throw new Error(
                    result.error ||
                    'Failed to delete project'
                  );
                }

                showAdminToast(
                  'Project deleted successfully',
                  'success'
                );

                await renderProjects(
                  content
                );

              } catch (error) {

                console.error(error);

                showAdminToast(
                  error.message ||
                  'Failed to delete project',
                  'error'
                );

              }

            }
          );

        });

    } catch (error) {

      console.error(error);

      content.innerHTML = `
        <div class="admin-error">

          <i data-lucide="alert-circle"></i>

          <h3>
            Unable to load projects
          </h3>

          <p>
            ${error.message}
          </p>

          <button
            class="admin-btn primary"
            id="retry-projects"
          >
            Try Again
          </button>

        </div>
      `;

      document
        .getElementById(
          'retry-projects'
        )
        ?.addEventListener(
          'click',
          () => renderProjects(content)
        );

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };


  const openProjectEditor = project => {

    document
      .getElementById(
        'circuitkart-project-modal'
      )
      ?.remove();

    const modal =
      document.createElement(
        'div'
      );

    modal.id =
      'circuitkart-project-modal';

    modal.className =
      'admin-modal-overlay';

    const arrayValue = value => {

      if (Array.isArray(value)) {
        return value.join(', ');
      }

      if (
        typeof value ===
        'string'
      ) {

        try {
          const parsed =
            JSON.parse(value);

          if (
            Array.isArray(parsed)
          ) {
            return parsed.join(', ');
          }

        } catch (_) {}

        return value;
      }

      return '';
    };

    modal.innerHTML = `
      <div class="admin-modal admin-project-modal">

        <div class="admin-modal-header">

          <div>
            <h3>Edit Project</h3>
            <p>
              Update project information
            </p>
          </div>

          <button
            class="admin-modal-close"
            id="close-project-modal"
          >
            <i data-lucide="x"></i>
          </button>

        </div>

        <form
          id="edit-project-form"
          class="admin-form"
        >

          <div class="admin-form-group">
            <label>Project Name</label>

            <input
              id="edit-project-name"
              type="text"
              value="${
                project.name || ''
              }"
              required
            />
          </div>

          <div class="admin-form-grid">

            <div class="admin-form-group">
              <label>Slug</label>

              <input
                id="edit-project-slug"
                type="text"
                value="${
                  project.slug || ''
                }"
                required
              />
            </div>

            <div class="admin-form-group">
              <label>Category</label>

              <input
                id="edit-project-category"
                type="text"
                value="${
                  project.category || ''
                }"
              />
            </div>

          </div>

          <div class="admin-form-grid">

            <div class="admin-form-group">
              <label>Difficulty</label>

              <select
                id="edit-project-difficulty"
              >
                ${[
                  'Beginner',
                  'Intermediate',
                  'Advanced',
                  'Expert'
                ].map(level => `
                  <option
                    value="${level}"
                    ${
                      String(
                        project.difficulty || ''
                      ).toLowerCase() ===
                      level.toLowerCase()
                        ? 'selected'
                        : ''
                    }
                  >
                    ${level}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="admin-form-group">
              <label>Price</label>

              <input
                id="edit-project-price"
                type="number"
                min="0"
                step="0.01"
                value="${
                  project.price || 0
                }"
              />
            </div>

          </div>

          <div class="admin-form-group">
            <label>Short Description</label>

            <input
              id="edit-project-short-description"
              type="text"
              value="${
                project.shortDescription || ''
              }"
            />
          </div>

          <div class="admin-form-group">
            <label>Description</label>

            <textarea
              id="edit-project-description"
              rows="5"
            >${
              project.description || ''
            }</textarea>
          </div>

          <div class="admin-form-group">
            <label>Image URL</label>

            <input
              id="edit-project-image"
              type="url"
              value="${
                project.image || ''
              }"
            />
          </div>

          <div class="admin-form-group">
            <label>Controller</label>

            <input
              id="edit-project-controller"
              type="text"
              value="${
                project.controller || ''
              }"
            />
          </div>

          <div class="admin-form-group">
            <label>Sensors</label>

            <input
              id="edit-project-sensors"
              type="text"
              value="${
                arrayValue(
                  project.sensors
                )
              }"
              placeholder="ESP32, DHT11, PIR"
            />

            <small>
              Separate items with commas.
            </small>
          </div>

          <div class="admin-form-group">
            <label>Communication</label>

            <input
              id="edit-project-communication"
              type="text"
              value="${
                arrayValue(
                  project.communication
                )
              }"
              placeholder="WiFi, Bluetooth, GSM"
            />
          </div>

          <div class="admin-form-group">
            <label>Features</label>

            <textarea
              id="edit-project-features"
              rows="4"
            >${
              arrayValue(
                project.features
              )
            }</textarea>
          </div>

          <div class="admin-form-group">
            <label>Applications</label>

            <textarea
              id="edit-project-applications"
              rows="4"
            >${
              arrayValue(
                project.applications
              )
            }</textarea>
          </div>

          <div class="admin-form-group">
            <label>Tags</label>

            <input
              id="edit-project-tags"
              type="text"
              value="${
                arrayValue(
                  project.tags
                )
              }"
              placeholder="IoT, Arduino, ESP32"
            />
          </div>

          <div class="admin-modal-actions">

            <button
              type="button"
              class="admin-btn secondary"
              id="cancel-project-modal"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="admin-btn primary"
              id="save-project"
            >
              <i data-lucide="save"></i>
              Save Changes
            </button>

          </div>

        </form>

      </div>
    `;

    document.body.appendChild(modal);

    if (window.lucide) {
      window.lucide.createIcons();
    }

    const close = () => {
      modal.remove();
    };

    document
      .getElementById(
        'close-project-modal'
      )
      ?.addEventListener(
        'click',
        close
      );

    document
      .getElementById(
        'cancel-project-modal'
      )
      ?.addEventListener(
        'click',
        close
      );

    modal.addEventListener(
      'click',
      event => {
        if (
          event.target === modal
        ) {
          close();
        }
      }
    );

    document
      .getElementById(
        'edit-project-form'
      )
      ?.addEventListener(
        'submit',
        async event => {

          event.preventDefault();

          const button =
            document.getElementById(
              'save-project'
            );

          const splitArray = id => {
            return document
              .getElementById(id)
              .value
              .split(',')
              .map(
                value =>
                  value.trim()
              )
              .filter(Boolean);
          };

          const updatedProject = {
            ...project,

            name:
              document
                .getElementById(
                  'edit-project-name'
                )
                .value.trim(),

            slug:
              document
                .getElementById(
                  'edit-project-slug'
                )
                .value.trim(),

            category:
              document
                .getElementById(
                  'edit-project-category'
                )
                .value.trim(),

            difficulty:
              document
                .getElementById(
                  'edit-project-difficulty'
                )
                .value,

            price:
              Number(
                document
                  .getElementById(
                    'edit-project-price'
                  )
                  .value
              ),

            shortDescription:
              document
                .getElementById(
                  'edit-project-short-description'
                )
                .value.trim(),

            description:
              document
                .getElementById(
                  'edit-project-description'
                )
                .value.trim(),

            image:
              document
                .getElementById(
                  'edit-project-image'
                )
                .value.trim(),

            controller:
              document
                .getElementById(
                  'edit-project-controller'
                )
                .value.trim(),

            sensors:
              splitArray(
                'edit-project-sensors'
              ),

            communication:
              splitArray(
                'edit-project-communication'
              ),

            features:
              splitArray(
                'edit-project-features'
              ),

            applications:
              splitArray(
                'edit-project-applications'
              ),

            tags:
              splitArray(
                'edit-project-tags'
              )
          };

          try {

            button.disabled = true;

            button.innerHTML = `
              <span class="spinner small"></span>
              Saving...
            `;

            const response =
              await fetch(
                `${API}/admin/projects/${project.id}`,
                {
                  method: 'PUT',
                  headers: authHeaders(),
                  body:
                    JSON.stringify(
                      updatedProject
                    )
                }
              );

            const result =
              await response
                .json()
                .catch(
                  () => ({})
                );

            if (!response.ok) {
              throw new Error(
                result.error ||
                'Failed to update project'
              );
            }

            close();

            showAdminToast(
              'Project updated successfully',
              'success'
            );

            const currentContent =
              document.getElementById(
                'admin-content'
              );

            if (currentContent) {
              await renderProjects(
                currentContent
              );
            }

          } catch (error) {

            console.error(error);

            showAdminToast(
              error.message ||
              'Failed to update project',
              'error'
            );

            button.disabled = false;

            button.innerHTML = `
              <i data-lucide="save"></i>
              Save Changes
            `;

            if (window.lucide) {
              window.lucide.createIcons();
            }
          }

        }
      );
  };


  const renderAddProject = async content => {

    content.innerHTML = `
      <div class="admin-section-header">

        <div>
          <h2>Add Project</h2>

          <p>
            Add a new project to CircuitKart.
          </p>
        </div>

      </div>

      <div class="admin-panel">

        <form
          id="add-project-form"
          class="admin-form"
        >

          <div class="admin-form-grid">

            <div class="admin-form-group">

              <label>
                Project Name *
              </label>

              <input
                id="project-name"
                type="text"
                placeholder="Smart Home Automation"
                required
              />

            </div>

            <div class="admin-form-group">

              <label>
                Slug *
              </label>

              <input
                id="project-slug"
                type="text"
                placeholder="smart-home-automation"
                required
              />

            </div>

          </div>

          <div class="admin-form-grid">

            <div class="admin-form-group">

              <label>
                Category
              </label>

              <input
                id="project-category"
                type="text"
                placeholder="IoT"
              />

            </div>

            <div class="admin-form-group">

              <label>
                Subcategory
              </label>

              <input
                id="project-subcategory"
                type="text"
                placeholder="Home Automation"
              />

            </div>

          </div>

          <div class="admin-form-grid">

            <div class="admin-form-group">

              <label>
                Difficulty
              </label>

              <select id="project-difficulty">

                <option>
                  Beginner
                </option>

                <option>
                  Intermediate
                </option>

                <option>
                  Advanced
                </option>

                <option>
                  Expert
                </option>

              </select>

            </div>

            <div class="admin-form-group">

              <label>
                Price (₹)
              </label>

              <input
                id="project-price"
                type="number"
                min="0"
                step="0.01"
                value="0"
              />

            </div>

          </div>

          <div class="admin-form-group">

            <label>
              Short Description
            </label>

            <input
              id="project-short-description"
              type="text"
              placeholder="Short project description"
            />

          </div>

          <div class="admin-form-group">

            <label>
              Full Description
            </label>

            <textarea
              id="project-description"
              rows="6"
              placeholder="Describe the project..."
            ></textarea>

          </div>

          <div class="admin-form-group">

            <label>
              Main Image URL
            </label>

            <input
              id="project-image"
              type="url"
              placeholder="https://..."
            />

          </div>

          <div class="admin-form-group">

            <label>
              Controller
            </label>

            <input
              id="project-controller"
              type="text"
              placeholder="ESP32"
            />

          </div>

          <div class="admin-form-group">

            <label>
              Sensors
            </label>

            <input
              id="project-sensors"
              type="text"
              placeholder="DHT11, PIR, LDR"
            />

            <small>
              Separate items with commas.
            </small>

          </div>

          <div class="admin-form-group">

            <label>
              Communication
            </label>

            <input
              id="project-communication"
              type="text"
              placeholder="WiFi, Bluetooth, GSM"
            />

          </div>

          <div class="admin-form-group">

            <label>
              Display
            </label>

            <input
              id="project-display"
              type="text"
              placeholder="LCD, OLED"
            />

          </div>

          <div class="admin-form-group">

            <label>
              Software
            </label>

            <input
              id="project-software"
              type="text"
              placeholder="Arduino IDE, Python"
            />

          </div>

          <div class="admin-form-group">

            <label>
              Features
            </label>

            <textarea
              id="project-features"
              rows="5"
              placeholder="Automatic control, alerts, monitoring"
            ></textarea>

          </div>

          <div class="admin-form-group">

            <label>
              Applications
            </label>

            <textarea
              id="project-applications"
              rows="5"
              placeholder="Homes, offices, industries"
            ></textarea>

          </div>

          <div class="admin-form-group">

            <label>
              Components
            </label>

            <textarea
              id="project-components"
              rows="5"
              placeholder="ESP32, relay, sensors"
            ></textarea>

          </div>

          <div class="admin-form-group">

            <label>
              What's Included
            </label>

            <textarea
              id="project-whats-included"
              rows="5"
              placeholder="Source code, documentation, components"
            ></textarea>

          </div>

          <div class="admin-form-group">

            <label>
              Tags
            </label>

            <input
              id="project-tags"
              type="text"
              placeholder="IoT, ESP32, Arduino"
            />

          </div>

          <div class="admin-form-actions">

            <button
              type="button"
              class="admin-btn secondary"
              id="cancel-add-project"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="admin-btn primary"
              id="submit-add-project"
            >
              <i data-lucide="plus"></i>
              Add Project
            </button>

          </div>

        </form>

      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }

    document
      .getElementById(
        'cancel-add-project'
      )
      ?.addEventListener(
        'click',
        () => switchAdminTab(
          'projects'
        )
      );

    document
      .getElementById(
        'add-project-form'
      )
      ?.addEventListener(
        'submit',
        async event => {

          event.preventDefault();

          const button =
            document.getElementById(
              'submit-add-project'
            );

          const getValue = id =>
            document
              .getElementById(id)
              ?.value
              .trim() || '';

          const getArray = id =>
            getValue(id)
              .split(',')
              .map(
                value =>
                  value.trim()
              )
              .filter(Boolean);

          const name =
            getValue(
              'project-name'
            );

          const slug =
            getValue(
              'project-slug'
            );

          if (!name || !slug) {
            showAdminToast(
              'Project name and slug are required',
              'error'
            );

            return;
          }

          const project = {
            name,
            slug,

            category:
              getValue(
                'project-category'
              ) || 'misc',

            subcategory:
              getValue(
                'project-subcategory'
              ),

            description:
              getValue(
                'project-description'
              ),

            shortDescription:
              getValue(
                'project-short-description'
              ),

            difficulty:
              document
                .getElementById(
                  'project-difficulty'
                )
                .value,

            price:
              Number(
                getValue(
                  'project-price'
                ) || 0
              ),

            image:
              getValue(
                'project-image'
              ),

            controller:
              getValue(
                'project-controller'
              ),

            sensors:
              getArray(
                'project-sensors'
              ),

            communication:
              getArray(
                'project-communication'
              ),

            display:
              getArray(
                'project-display'
              ),

            software:
              getArray(
                'project-software'
              ),

            features:
              getArray(
                'project-features'
              ),

            applications:
              getArray(
                'project-applications'
              ),

            components:
              getArray(
                'project-components'
              ),

            whatsIncluded:
              getArray(
                'project-whats-included'
              ),

            tags:
              getArray(
                'project-tags'
              )
          };

          try {

            button.disabled = true;

            button.innerHTML = `
              <span class="spinner small"></span>
              Adding...
            `;

            const response =
              await fetch(
                `${API}/admin/projects`,
                {
                  method: 'POST',
                  headers: authHeaders(),
                  body:
                    JSON.stringify(project)
                }
              );

            const result =
              await response
                .json()
                .catch(
                  () => ({})
                );

            if (!response.ok) {
              throw new Error(
                result.error ||
                'Failed to add project'
              );
            }

            showAdminToast(
              'Project added successfully',
              'success'
            );

            document
              .getElementById(
                'add-project-form'
              )
              .reset();

            document
              .getElementById(
                'project-price'
              )
              .value = '0';

          } catch (error) {

            console.error(error);

            showAdminToast(
              error.message ||
              'Failed to add project',
              'error'
            );

          } finally {

            button.disabled = false;

            button.innerHTML = `
              <i data-lucide="plus"></i>
              Add Project
            `;

            if (window.lucide) {
              window.lucide.createIcons();
            }

          }

        }
      );
  };


  const renderComponents = async content => {

    try {

      const response =
        await fetch(
          `${API}/admin/components`,
          {
            headers: authHeaders()
          }
        );

      if (!response.ok) {
        throw new Error(
          'Failed to load components'
        );
      }

      const data =
        await response.json();

      const components =
        Array.isArray(data)
          ? data
          : data.components || [];

      content.innerHTML = `
        <div class="admin-section-header">

          <div>
            <h2>Components</h2>

            <p>
              Manage component inventory
              and pricing.
            </p>
          </div>

          <button
            class="admin-refresh-btn"
            id="refresh-components"
          >
            <i data-lucide="refresh-cw"></i>
            Refresh
          </button>

        </div>

        <div class="admin-panel">

          <div class="admin-table-wrapper">

            <table class="admin-table">

              <thead>
                <tr>
                  <th>Component</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                ${
                  components.map(component => `
                    <tr>

                      <td>
                        <strong>
                          ${
                            component.name ||
                            component.title ||
                            '-'
                          }
                        </strong>
                      </td>

                      <td>
                        ${
                          component.category ||
                          '-'
                        }
                      </td>

                      <td>
                        ${
                          component.stock ??
                          component.quantity ??
                          0
                        }
                      </td>

                      <td>

                        <div class="admin-inline-edit">

                          <span>
                            ₹
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value="${
                              component.price ||
                              0
                            }"
                            data-component-price="${
                              component.id
                            }"
                          />

                        </div>

                      </td>

                      <td>

                        <button
                          class="admin-btn small save-component-price"
                          data-component-id="${
                            component.id
                          }"
                        >
                          <i data-lucide="save"></i>
                          Save
                        </button>

                      </td>

                    </tr>
                  `).join('')
                }

                ${
                  components.length === 0
                    ? `
                      <tr>
                        <td
                          colspan="5"
                          class="admin-empty"
                        >
                          No components found.
                        </td>
                      </tr>
                    `
                    : ''
                }

              </tbody>

            </table>

          </div>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }

      document
        .getElementById(
          'refresh-components'
        )
        ?.addEventListener(
          'click',
          () => renderComponents(content)
        );

      document
        .querySelectorAll(
          '.save-component-price'
        )
        .forEach(button => {

          button.addEventListener(
            'click',
            async () => {

              const id =
                button.dataset
                  .componentId;

              const input =
                document.querySelector(
                  `[data-component-price="${CSS.escape(String(id))}"]`
                );

              const price =
                Number(
                  input?.value || 0
                );

              try {

                button.disabled = true;

                const updateResponse =
                  await fetch(
                    `${API}/admin/components/${id}`,
                    {
                      method: 'PUT',
                      headers:
                        authHeaders(),
                      body:
                        JSON.stringify({
                          price
                        })
                    }
                  );

                const result =
                  await updateResponse
                    .json()
                    .catch(
                      () => ({})
                    );

                if (
                  !updateResponse.ok
                ) {
                  throw new Error(
                    result.error ||
                    'Failed to update component'
                  );
                }

                showAdminToast(
                  'Component price updated',
                  'success'
                );

              } catch (error) {

                console.error(error);

                showAdminToast(
                  error.message ||
                  'Failed to update component',
                  'error'
                );

              } finally {

                button.disabled = false;

              }

            }
          );

        });

    } catch (error) {

      console.error(error);

      content.innerHTML = `
        <div class="admin-error">

          <i data-lucide="alert-circle"></i>

          <h3>
            Unable to load components
          </h3>

          <p>
            ${error.message}
          </p>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };


  const renderPricing = async content => {

    try {

      const response =
        await fetch(
          `${API}/settings`,
          {
            headers: authHeaders()
          }
        );

      let settings = {};

      if (response.ok) {
        settings =
          await response.json();
      }

      content.innerHTML = `
        <div class="admin-section-header">

          <div>
            <h2>Pricing</h2>

            <p>
              Configure store pricing settings.
            </p>
          </div>

        </div>

        <div class="admin-panel">

          <form
            id="pricing-form"
            class="admin-form"
          >

            <div class="admin-form-grid">

              <div class="admin-form-group">

                <label>
                  GST (%)
                </label>

                <input
                  id="pricing-gst"
                  type="number"
                  min="0"
                  step="0.01"
                  value="${
                    settings.gst ??
                    settings.gstRate ??
                    18
                  }"
                />

              </div>

              <div class="admin-form-group">

                <label>
                  Shipping Charge (₹)
                </label>

                <input
                  id="pricing-shipping"
                  type="number"
                  min="0"
                  step="0.01"
                  value="${
                    settings.shipping ??
                    settings.shippingCharge ??
                    0
                  }"
                />

              </div>

            </div>

            <div class="admin-form-group">

              <label>
                Free Shipping Above (₹)
              </label>

              <input
                id="pricing-free-shipping"
                type="number"
                min="0"
                step="0.01"
                value="${
                  settings.freeShippingAbove ??
                  0
                }"
              />

            </div>

            <button
              type="submit"
              class="admin-btn primary"
            >
              <i data-lucide="save"></i>
              Save Pricing
            </button>

          </form>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }

      document
        .getElementById(
          'pricing-form'
        )
        ?.addEventListener(
          'submit',
          async event => {

            event.preventDefault();

            try {

              const payload = {
                gst:
                  Number(
                    document
                      .getElementById(
                        'pricing-gst'
                      )
                      .value
                  ),

                shipping:
                  Number(
                    document
                      .getElementById(
                        'pricing-shipping'
                      )
                      .value
                  ),

                freeShippingAbove:
                  Number(
                    document
                      .getElementById(
                        'pricing-free-shipping'
                      )
                      .value
                  )
              };

              const saveResponse =
                await fetch(
                  `${API}/admin/settings`,
                  {
                    method: 'PUT',
                    headers:
                      authHeaders(),
                    body:
                      JSON.stringify(
                        payload
                      )
                  }
                );

              const result =
                await saveResponse
                  .json()
                  .catch(
                    () => ({})
                  );

              if (!saveResponse.ok) {
                throw new Error(
                  result.error ||
                  'Failed to save pricing'
                );
              }

              showAdminToast(
                'Pricing settings saved',
                'success'
              );

            } catch (error) {

              console.error(error);

              showAdminToast(
                error.message ||
                'Failed to save pricing',
                'error'
              );

            }

          }
        );

    } catch (error) {

      console.error(error);

      content.innerHTML = `
        <div class="admin-error">

          <i data-lucide="alert-circle"></i>

          <h3>
            Unable to load pricing
          </h3>

          <p>
            ${error.message}
          </p>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };


  const renderPayment = async content => {

    try {

      const response =
        await fetch(
          `${API}/settings`,
          {
            headers: authHeaders()
          }
        );

      let settings = {};

      if (response.ok) {
        settings =
          await response.json();
      }

      content.innerHTML = `
        <div class="admin-section-header">

          <div>
            <h2>Payment Settings</h2>

            <p>
              Configure payment and UPI information.
            </p>
          </div>

        </div>

        <div class="admin-panel">

          <form
            id="payment-settings-form"
            class="admin-form"
          >

            <div class="admin-form-group">

              <label>
                UPI ID
              </label>

              <input
                id="payment-upi"
                type="text"
                placeholder="example@upi"
                value="${
                  settings.upiId ||
                  settings.upi ||
                  ''
                }"
              />

            </div>

            <div class="admin-form-group">

              <label>
                QR Code Image URL
              </label>

              <input
                id="payment-qr"
                type="url"
                placeholder="https://..."
                value="${
                  settings.qrCode ||
                  settings.qrCodeUrl ||
                  ''
                }"
              />

            </div>

            <div class="admin-form-group">

              <label>
                Payment Instructions
              </label>

              <textarea
                id="payment-instructions"
                rows="5"
                placeholder="Enter payment instructions"
              >${
                settings.paymentInstructions ||
                ''
              }</textarea>

            </div>

            <button
              type="submit"
              class="admin-btn primary"
            >
              <i data-lucide="save"></i>
              Save Payment Settings
            </button>

          </form>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }

      document
        .getElementById(
          'payment-settings-form'
        )
        ?.addEventListener(
          'submit',
          async event => {

            event.preventDefault();

            try {

              const payload = {
                upiId:
                  document
                    .getElementById(
                      'payment-upi'
                    )
                    .value.trim(),

                qrCode:
                  document
                    .getElementById(
                      'payment-qr'
                    )
                    .value.trim(),

                paymentInstructions:
                  document
                    .getElementById(
                      'payment-instructions'
                    )
                    .value.trim()
              };

              const saveResponse =
                await fetch(
                  `${API}/admin/settings`,
                  {
                    method: 'PUT',
                    headers:
                      authHeaders(),
                    body:
                      JSON.stringify(
                        payload
                      )
                  }
                );

              const result =
                await saveResponse
                  .json()
                  .catch(
                    () => ({})
                  );

              if (!saveResponse.ok) {
                throw new Error(
                  result.error ||
                  'Failed to save payment settings'
                );
              }

              showAdminToast(
                'Payment settings saved',
                'success'
              );

            } catch (error) {

              console.error(error);

              showAdminToast(
                error.message ||
                'Failed to save payment settings',
                'error'
              );

            }

          }
        );

    } catch (error) {

      console.error(error);

      content.innerHTML = `
        <div class="admin-error">

          <i data-lucide="alert-circle"></i>

          <h3>
            Unable to load payment settings
          </h3>

          <p>
            ${error.message}
          </p>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };
    const renderUsers = async content => {
    try {
      const response = await fetch(
        `${API}/admin/feed`,
        {
          headers: authHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(
          'Failed to load users'
        );
      }

      const data = await response.json();

      const users = data.users || [];

      content.innerHTML = `
        <div class="admin-section-header">

          <div>
            <h2>Users</h2>

            <p>
              View registered CircuitKart customers.
            </p>
          </div>

          <button
            class="admin-refresh-btn"
            id="refresh-users"
          >
            <i data-lucide="refresh-cw"></i>
            Refresh
          </button>

        </div>

        <div class="admin-panel">

          <div class="admin-table-wrapper">

            <table class="admin-table">

              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>

              <tbody>

                ${
                  users.map(user => `
                    <tr>

                      <td>
                        <div class="admin-user-cell">

                          <div class="admin-user-avatar">
                            <i data-lucide="user"></i>
                          </div>

                          <div>
                            <strong>
                              ${
                                user.name ||
                                user.username ||
                                'User'
                              }
                            </strong>
                          </div>

                        </div>
                      </td>

                      <td>
                        ${
                          user.email ||
                          '-'
                        }
                      </td>

                      <td>
                        ${
                          user.phone ||
                          '-'
                        }
                      </td>

                      <td>
                        <span class="admin-status-badge delivered">
                          ${
                            user.role ||
                            'customer'
                          }
                        </span>
                      </td>

                      <td>
                        ${
                          user.created_at
                            ? new Date(
                                user.created_at
                              ).toLocaleDateString()
                            : '-'
                        }
                      </td>

                    </tr>
                  `).join('')
                }

                ${
                  users.length === 0
                    ? `
                      <tr>
                        <td
                          colspan="5"
                          class="admin-empty"
                        >
                          No users found.
                        </td>
                      </tr>
                    `
                    : ''
                }

              </tbody>

            </table>

          </div>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }

      document
        .getElementById(
          'refresh-users'
        )
        ?.addEventListener(
          'click',
          () => renderUsers(content)
        );

    } catch (error) {

      console.error(error);

      content.innerHTML = `
        <div class="admin-error">

          <i data-lucide="alert-circle"></i>

          <h3>
            Unable to load users
          </h3>

          <p>
            ${error.message}
          </p>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };


  const renderQuotes = async content => {

    try {

      const response =
        await fetch(
          `${API}/admin/feed`,
          {
            headers: authHeaders()
          }
        );

      if (!response.ok) {
        throw new Error(
          'Failed to load quotes'
        );
      }

      const data =
        await response.json();

      const quotes =
        data.quotes || [];

      content.innerHTML = `
        <div class="admin-section-header">

          <div>
            <h2>Custom Quotes</h2>

            <p>
              Manage customer custom project requests.
            </p>
          </div>

          <button
            class="admin-refresh-btn"
            id="refresh-quotes"
          >
            <i data-lucide="refresh-cw"></i>
            Refresh
          </button>

        </div>

        <div class="admin-panel">

          <div class="admin-table-wrapper">

            <table class="admin-table">

              <thead>
                <tr>
                  <th>Request</th>
                  <th>Customer</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>

                ${
                  quotes.map(quote => `
                    <tr>

                      <td>
                        <strong>
                          #${
                            quote.id ||
                            quote.quoteId ||
                            '-'
                          }
                        </strong>
                      </td>

                      <td>
                        ${
                          quote.customerName ||
                          quote.name ||
                          '-'
                        }
                      </td>

                      <td>
                        <div
                          class="admin-description-cell"
                        >
                          ${
                            quote.description ||
                            quote.requirements ||
                            quote.message ||
                            '-'
                          }
                        </div>
                      </td>

                      <td>
                        <span class="
                          admin-status-badge
                          ${
                            String(
                              quote.status ||
                              'pending'
                            ).toLowerCase()
                          }
                        ">
                          ${
                            quote.status ||
                            'Pending'
                          }
                        </span>
                      </td>

                      <td>
                        ${
                          quote.created_at
                            ? new Date(
                                quote.created_at
                              ).toLocaleString()
                            : '-'
                        }
                      </td>

                    </tr>
                  `).join('')
                }

                ${
                  quotes.length === 0
                    ? `
                      <tr>
                        <td
                          colspan="5"
                          class="admin-empty"
                        >
                          No custom quote requests.
                        </td>
                      </tr>
                    `
                    : ''
                }

              </tbody>

            </table>

          </div>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }

      document
        .getElementById(
          'refresh-quotes'
        )
        ?.addEventListener(
          'click',
          () => renderQuotes(content)
        );

    } catch (error) {

      console.error(error);

      content.innerHTML = `
        <div class="admin-error">

          <i data-lucide="alert-circle"></i>

          <h3>
            Unable to load custom quotes
          </h3>

          <p>
            ${error.message}
          </p>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };


  const renderActivity = async content => {

    try {

      const response =
        await fetch(
          `${API}/admin/feed`,
          {
            headers: authHeaders()
          }
        );

      if (!response.ok) {
        throw new Error(
          'Failed to load activity'
        );
      }

      const data =
        await response.json();

      const activity =
        data.activity ||
        data.activities ||
        [];

      content.innerHTML = `
        <div class="admin-section-header">

          <div>
            <h2>Activity Log</h2>

            <p>
              Recent CircuitKart platform activity.
            </p>
          </div>

          <button
            class="admin-refresh-btn"
            id="refresh-activity"
          >
            <i data-lucide="refresh-cw"></i>
            Refresh
          </button>

        </div>

        <div class="admin-panel">

          ${
            activity.length
              ? `
                <div class="admin-activity-list">

                  ${activity.map(item => `
                    <div
                      class="admin-activity-item"
                    >

                      <div class="admin-activity-icon">
                        <i data-lucide="${
                          item.icon ||
                          'activity'
                        }"></i>
                      </div>

                      <div
                        class="admin-activity-content"
                      >

                        <strong>
                          ${
                            item.title ||
                            item.action ||
                            'Activity'
                          }
                        </strong>

                        <p>
                          ${
                            item.description ||
                            item.message ||
                            ''
                          }
                        </p>

                        <span>
                          ${
                            item.created_at
                              ? new Date(
                                  item.created_at
                                ).toLocaleString()
                              : ''
                          }
                        </span>

                      </div>

                    </div>
                  `).join('')}

                </div>
              `
              : `
                <div class="admin-empty-state">

                  <i data-lucide="activity"></i>

                  <h3>
                    No activity available
                  </h3>

                  <p>
                    Recent admin activity
                    will appear here.
                  </p>

                </div>
              `
          }

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }

      document
        .getElementById(
          'refresh-activity'
        )
        ?.addEventListener(
          'click',
          () => renderActivity(content)
        );

    } catch (error) {

      console.error(error);

      content.innerHTML = `
        <div class="admin-error">

          <i data-lucide="alert-circle"></i>

          <h3>
            Unable to load activity
          </h3>

          <p>
            ${error.message}
          </p>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };


  const showAdminToast = (
    message,
    type = 'info'
  ) => {

    document
      .querySelectorAll(
        '.admin-toast'
      )
      .forEach(
        toast => toast.remove()
      );

    const toast =
      document.createElement(
        'div'
      );

    toast.className =
      `admin-toast ${type}`;

    const icon =
      type === 'success'
        ? 'check-circle'
        : type === 'error'
          ? 'alert-circle'
          : 'info';

    toast.innerHTML = `
      <i data-lucide="${icon}"></i>

      <span>
        ${message}
      </span>

      <button
        class="admin-toast-close"
        aria-label="Close"
      >
        <i data-lucide="x"></i>
      </button>
    `;

    document.body.appendChild(
      toast
    );

    if (window.lucide) {
      window.lucide.createIcons();
    }

    const closeButton =
      toast.querySelector(
        '.admin-toast-close'
      );

    closeButton?.addEventListener(
      'click',
      () => toast.remove()
    );

    setTimeout(
      () => {
        toast.remove();
      },
      4000
    );
  };


  await render();
}

export default AdminPage;