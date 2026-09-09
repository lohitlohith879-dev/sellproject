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

    const STATUS_FLOW = [
      { key: 'placed', label: 'Order Placed', color: '#00d4ff' },
      { key: 'payment_confirmed', label: 'Payment Confirmed', color: '#7c3aed' },
      { key: 'confirmed', label: 'Order Confirmed', color: '#3b82f6' },
      { key: 'processing', label: 'Processing', color: '#f59e0b' },
      { key: 'packed', label: 'Packed', color: '#f97316' },
      { key: 'shipped', label: 'Shipped', color: '#8b5cf6' },
      { key: 'out_for_delivery', label: 'Out for Delivery', color: '#06b6d4' },
      { key: 'delivered', label: 'Delivered', color: '#10b981' },
    ];

    const SPECIAL = {
      cancelled: '#ef4444',
      payment_failed: '#ef4444',
      return_requested: '#f59e0b',
      returned: '#f59e0b',
      refund_processing: '#8b5cf6',
      refunded: '#10b981',
      received: '#3b82f6',
      payment_submitted: '#f59e0b',
    };

    function statusBadgeColor(s) {
      return SPECIAL[s] ||
        STATUS_FLOW.find(f => f.key === s)?.color ||
        '#9ca3af';
    }

    function statusLabel(s) {
      const map = {
        placed: 'Order Placed',
        payment_confirmed: 'Payment Confirmed',
        confirmed: 'Order Confirmed',
        processing: 'Processing',
        packed: 'Packed',
        shipped: 'Shipped',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
        payment_failed: 'Payment Failed',
        return_requested: 'Return Requested',
        returned: 'Returned',
        refund_processing: 'Refund Processing',
        refunded: 'Refunded',
        received: 'Order Received',
        payment_submitted: 'Payment Submitted',
      };

      return map[s] || s;
    }

    return `
      <div>

        <h2
          class="heading-md"
          style="margin-bottom: var(--space-xl);"
        >
          My Orders
        </h2>

        <div class="orders-list">

          ${orders.map(order => {

      const currentFlowIdx =
        STATUS_FLOW.findIndex(
          s => s.key === order.status
        );

      const isSpecial =
        !!SPECIAL[order.status] &&
        currentFlowIdx === -1;

      const color =
        statusBadgeColor(order.status);

      return `
              <div
                class="order-card glass-card"
                style="margin-bottom:var(--space-md);"
              >

                <div
                  style="
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    flex-wrap:wrap;
                    gap:12px;
                    margin-bottom:var(--space-md);
                    padding-bottom:var(--space-md);
                    border-bottom:1px solid var(--border-subtle);
                  "
                >

                  <div>

                    <div
                      style="
                        display:flex;
                        align-items:center;
                        gap:8px;
                        flex-wrap:wrap;
                      "
                    >

                      <span
                        class="order-id-tag font-mono"
                        style="
                          color:var(--primary);
                          font-weight:700;
                        "
                      >
                        ${order.id}
                      </span>

                      <span
                        style="
                          background:${color}22;
                          color:${color};
                          border:1px solid ${color}44;
                          padding:3px 10px;
                          border-radius:12px;
                          font-size:.75rem;
                          font-weight:700;
                        "
                      >
                        ${statusLabel(order.status)}
                      </span>

                    </div>

                    <div
                      class="text-secondary text-sm"
                      style="margin-top:4px;"
                    >
                      Placed on ${new Date(
        order.date
      ).toLocaleDateString(
        'en-IN',
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }
      )
        }
                    </div>

                  </div>

                  <div style="text-align:right;">

                    <div class="text-secondary text-sm">
                      Total
                    </div>

                    <div
                      class="font-mono font-bold"
                      style="
                        color:var(--primary);
                        font-size:1.1rem;
                      "
                    >
                      ₹${new Intl.NumberFormat(
          'en-IN'
        ).format(order.total)
        }
                    </div>

                  </div>

                </div>


                <!-- Items -->

                <div
                  style="
                    margin-bottom:var(--space-md);
                  "
                >

                  ${(order.items || []).map(item => `
                    <div
                      style="
                        display:flex;
                        align-items:center;
                        gap:10px;
                        padding:6px 0;
                        border-bottom:1px solid var(--border-subtle);
                      "
                    >

                      <div
                        style="
                          width:36px;
                          height:36px;
                          border-radius:8px;
                          background:rgba(255,255,255,0.05);
                          border:1px solid var(--border-subtle);
                          display:flex;
                          align-items:center;
                          justify-content:center;
                          font-size:16px;
                          flex-shrink:0;
                        "
                      >
                        📦
                      </div>

                      <div style="flex:1;">

                        <div
                          style="
                            font-size:.85rem;
                            font-weight:500;
                            color:var(--text-heading);
                          "
                        >
                          ${item.name}
                        </div>

                        <div
                          style="
                            font-size:.75rem;
                            color:var(--text-tertiary);
                          "
                        >
                          Qty: ${item.quantity || 1}
                          · ₹${new Intl.NumberFormat(
          'en-IN'
        ).format(
          item.price *
          (item.quantity || 1)
        )
          }
                        </div>

                      </div>

                    </div>
                  `).join('')}

                </div>


                <!-- Mini Timeline -->

                <div
                  style="
                    margin-bottom:var(--space-md);
                  "
                >

                  <div
                    style="
                      display:flex;
                      align-items:center;
                      gap:0;
                      overflow-x:auto;
                      padding-bottom:4px;
                    "
                  >

                    ${STATUS_FLOW.map((step, idx) => {

            const done =
              currentFlowIdx >= 0 &&
              idx < currentFlowIdx;

            const active =
              idx === currentFlowIdx;

            return `
                        <div
                          style="
                            display:flex;
                            align-items:center;
                            gap:0;
                            flex-shrink:0;
                          "
                        >

                          <div
                            style="
                              display:flex;
                              flex-direction:column;
                              align-items:center;
                              gap:4px;
                            "
                          >

                            <div
                              style="
                                width:24px;
                                height:24px;
                                border-radius:50%;
                                background:${done
                ? step.color
                : active
                  ? step.color
                  : 'rgba(255,255,255,0.06)'
              };
                                border:2px solid ${done || active
                ? step.color
                : 'var(--border-subtle)'
              };
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                font-size:10px;
                                ${active
                ? `box-shadow:0 0 0 3px ${step.color}33;`
                : ''
              }
                              "
                            >
                              ${done
                ? '✓'
                : active
                  ? '●'
                  : ''
              }
                            </div>

                            <span
                              style="
                                font-size:.6rem;
                                color:${done || active
                ? 'var(--text-secondary)'
                : 'var(--text-tertiary)'
              };
                                white-space:nowrap;
                                max-width:52px;
                                text-align:center;
                                line-height:1.2;
                              "
                            >
                              ${step.label}
                            </span>

                          </div>

                          ${idx < STATUS_FLOW.length - 1
                ? `
                                <div
                                  style="
                                    width:20px;
                                    height:2px;
                                    background:${done
                  ? step.color
                  : 'var(--border-subtle)'
                };
                                    flex-shrink:0;
                                    margin:0 0 18px;
                                  "
                                ></div>
                              `
                : ''
              }

                        </div>
                      `;

          }).join('')}

                  </div>

                </div>


                <!-- Actions -->

                <div
                  style="
                    display:flex;
                    gap:8px;
                    flex-wrap:wrap;
                  "
                >

                  <a
                    href="#/track/${order.id}"
                    class="btn btn-primary btn-sm"
                  >
                    <i
                      data-lucide="map-pin"
                      style="width:14px;"
                    ></i>
                    Track Order
                  </a>


                  <!-- INVOICE BUTTON -->

                  <a
                    href="#/invoice/${order.id}"
                    class="btn btn-secondary btn-sm"
                  >
                    <i
                      data-lucide="file-text"
                      style="width:14px;"
                    ></i>
                    Invoice
                  </a>


                  ${order.status === 'delivered'
          ? `
                        <button
                          class="btn btn-ghost btn-sm"
                          onclick="openReviewModal('${order.id}')"
                        >
                          <i
                            data-lucide="star"
                            style="width:14px;"
                          ></i>
                          Review
                        </button>
                      `
          : ''
        }

                </div>

              </div>
            `;

    }).join('')}

        </div>

      </div>
    `;
  }


  function renderDownloadsTab() {

    const orders =
      store.get('orders');

    const downloads = [];

    orders.forEach(order => {

      if (order.status === 'delivered') {

        order.items.forEach(item => {

          downloads.push({
            name:
              item.name +
              ' - Source Code',
            type:
              'ZIP Archive',
            size:
              '12 MB',
            date:
              order.date
          });

          downloads.push({
            name:
              item.name +
              ' - Circuit Diagram',
            type:
              'PDF Document',
            size:
              '2 MB',
            date:
              order.date
          });

        });

      }

    });


    if (downloads.length === 0) {

      return `
        <div
          class="text-center"
          style="padding: var(--space-4xl) 0;"
        >

          <i
            data-lucide="download-cloud"
            style="
              font-size:48px;
              color:var(--text-tertiary);
              margin-bottom:var(--space-md);
              opacity:.5;
            "
          ></i>

          <h3
            class="heading-md"
            style="
              margin-bottom:var(--space-sm);
            "
          >
            No Downloads Available
          </h3>

          <p
            class="text-secondary"
            style="
              margin-bottom:var(--space-xl);
            "
          >
            Files will appear here once your order
            is processed or delivered.
          </p>

        </div>
      `;

    }


    return `
      <div>

        <h2
          class="heading-md"
          style="
            margin-bottom:var(--space-xl);
          "
        >
          My Downloads
        </h2>

        <div
          class="glass-card"
          style="padding:0;"
        >

          <table
            style="
              width:100%;
              border-collapse:collapse;
              text-align:left;
            "
          >

            <thead>

              <tr
                style="
                  border-bottom:
                    1px solid var(--border-subtle);
                  background:
                    var(--bg-secondary);
                "
              >

                <th
                  style="
                    padding:
                      var(--space-md)
                      var(--space-lg);
                    font-size:var(--fs-sm);
                    color:var(--text-tertiary);
                  "
                >
                  File Name
                </th>

                <th
                  style="
                    padding:
                      var(--space-md)
                      var(--space-lg);
                    font-size:var(--fs-sm);
                    color:var(--text-tertiary);
                  "
                >
                  Type
                </th>

                <th
                  style="
                    padding:
                      var(--space-md)
                      var(--space-lg);
                    font-size:var(--fs-sm);
                    color:var(--text-tertiary);
                  "
                >
                  Size
                </th>

                <th
                  style="
                    padding:
                      var(--space-md)
                      var(--space-lg);
                    font-size:var(--fs-sm);
                    color:var(--text-tertiary);
                    text-align:right;
                  "
                >
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              ${downloads.map(dl => `

                <tr
                  style="
                    border-bottom:
                      1px solid var(--border-subtle);
                  "
                >

                  <td
                    style="
                      padding:
                        var(--space-md)
                        var(--space-lg);
                    "
                  >

                    <div class="font-medium">
                      ${dl.name}
                    </div>

                    <div
                      class="text-xs text-tertiary"
                    >
                      Added:
                      ${new Date(
      dl.date
    ).toLocaleDateString()
      }
                    </div>

                  </td>

                  <td
                    style="
                      padding:
                        var(--space-md)
                        var(--space-lg);
                      color:var(--text-secondary);
                      font-size:var(--fs-sm);
                    "
                  >
                    ${dl.type}
                  </td>

                  <td
                    style="
                      padding:
                        var(--space-md)
                        var(--space-lg);
                      color:var(--text-secondary);
                      font-size:var(--fs-sm);
                    "
                  >
                    ${dl.size}
                  </td>

                  <td
                    style="
                      padding:
                        var(--space-md)
                        var(--space-lg);
                      text-align:right;
                    "
                  >

                    <button
                      class="btn btn-ghost btn-sm text-accent"
                    >
                      <i
                        data-lucide="download"
                        style="
                          width:16px;
                          margin-right:4px;
                        "
                      ></i>
                      Download
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


  function renderSavedTab() {

    return `
      <div
        class="text-center"
        style="
          padding:var(--space-4xl) 0;
        "
      >

        <i
          data-lucide="heart"
          style="
            font-size:48px;
            color:var(--text-tertiary);
            margin-bottom:var(--space-md);
            opacity:.5;
          "
        ></i>

        <h3
          class="heading-md"
          style="
            margin-bottom:var(--space-sm);
          "
        >
          No Saved Projects
        </h3>

        <p
          class="text-secondary"
          style="
            margin-bottom:var(--space-xl);
          "
        >
          Projects you save will appear here.
        </p>

      </div>
    `;
  }


  function renderProfileTab() {

    const user =
      store.get('user') || {};


    window.updateProfile = async (e) => {

      e.preventDefault();

      const btn =
        document.getElementById(
          'profile-save-btn'
        );

      btn.disabled = true;
      btn.innerHTML =
        'Saving...';


      const payload = {

        name:
          document.getElementById(
            'prof-name'
          ).value,

        phone:
          document.getElementById(
            'prof-phone'
          ).value,

        college:
          document.getElementById(
            'prof-college'
          ).value,

        address:
          document.getElementById(
            'prof-address'
          ).value

      };


      try {

        const token =
          localStorage.getItem(
            'ck_token'
          );

        const res =
          await fetch(
            '/api/users/profile',
            {
              method: 'PUT',

              headers: {
                'Content-Type':
                  'application/json',

                'Authorization':
                  `Bearer ${token}`
              },

              body:
                JSON.stringify(
                  payload
                )
            }
          );


        if (res.ok) {

          await store.fetchUserProfile();

          showToast(
            'Profile updated successfully!',
            'success'
          );

        } else {

          showToast(
            'Failed to update profile',
            'error'
          );

        }

      } catch (err) {

        showToast(
          'Error connecting to server',
          'error'
        );

      }


      btn.disabled = false;

      btn.innerHTML =
        '<i data-lucide="save" style="width:16px;"></i> Save Changes';

    };


    return `
      <div
        class="light-dashboard"
        style="
          padding:var(--space-xl);
          font-family:'Inter',sans-serif;
          max-width:900px;
          margin:0 auto;
        "
      >

        <h2
          class="heading-lg"
          style="
            margin-bottom:var(--space-xl);
            color:#1a202c;
          "
        >
          My Profile
        </h2>


        <div
          style="
            display:grid;
            grid-template-columns:
              300px 1fr;
            gap:var(--space-xl);
            align-items:start;
          "
        >

          <!-- Left: Avatar Card -->

          <div
            class="glass-card profile-card"
            style="
              padding:0;
              display:flex;
              flex-direction:column;
              overflow:hidden;
              background:var(--bg-secondary);
              border:1px solid var(--border-subtle);
              border-radius:16px;
            "
          >

            <div
              style="
                height:100px;
                background:var(--gradient-primary);
              "
            ></div>

            <div
              style="
                margin-top:-50px;
                display:flex;
                justify-content:center;
              "
            >

              <img
                src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&color=fff&size=100"
                style="
                  width:100px;
                  height:100px;
                  border-radius:50%;
                  border:4px solid var(--bg-secondary);
                  background:var(--bg-secondary);
                "
                alt="User Avatar"
              >

            </div>

            <div
              style="
                padding:
                  var(--space-xl)
                  var(--space-lg);
                text-align:center;
              "
            >

              <h3
                style="
                  font-size:var(--fs-lg);
                  font-weight:700;
                  color:var(--text-heading);
                  margin-bottom:4px;
                "
              >
                ${user.name || '—'}
              </h3>

              <div
                style="margin-bottom:12px;"
              >

                <span
                  style="
                    background:
                      rgba(0,212,255,0.1);
                    color:var(--primary);
                    padding:4px 12px;
                    border-radius:20px;
                    font-size:var(--fs-xs);
                    font-weight:600;
                    text-transform:capitalize;
                  "
                >
                  ${user.role || 'Customer'}
                </span>

              </div>

              <p
                style="
                  color:var(--text-secondary);
                  font-size:var(--fs-sm);
                  margin-bottom:4px;
                "
              >
                ${user.email || '—'}
              </p>

              <p
                style="
                  color:var(--text-secondary);
                  font-size:var(--fs-sm);
                  margin-bottom:4px;
                "
              >
                Joined ${user.created_at
        ? new Date(
          user.created_at
        ).toLocaleDateString()
        : 'recently'
      }
              </p>

            </div>

          </div>


          <!-- Right: Edit Form -->

          <div
            class="glass-card"
            style="
              padding:var(--space-xl);
              background:var(--bg-secondary);
              border:1px solid var(--border-subtle);
              border-radius:16px;
            "
          >

            <h4
              style="
                color:var(--primary);
                font-size:var(--fs-md);
                margin-bottom:var(--space-lg);
                display:flex;
                align-items:center;
                gap:8px;
                font-weight:600;
              "
            >

              <i
                data-lucide="user"
                style="width:18px;"
              ></i>

              Personal Information

            </h4>


            <h4
              style="
                color:var(--primary);
                font-size:var(--fs-md);
                margin-bottom:var(--space-lg);
                display:flex;
                align-items:center;
                gap:8px;
                font-weight:600;
              "
            >

              <i
                data-lucide="shield"
                style="width:18px;"
              ></i>

              Security

            </h4>


            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:var(--space-lg);
              "
            >

              <span
                style="
                  font-weight:600;
                  font-size:var(--fs-sm);
                  color:#2d3748;
                "
              >
                Password
              </span>

              <span
                style="
                  color:#a0aec0;
                  font-family:monospace;
                "
              >
                ••••••••
              </span>

              <button
                style="
                  background:#edf2f7;
                  color:#4a5568;
                  padding:4px 12px;
                  border-radius:4px;
                  border:none;
                  font-size:var(--fs-xs);
                  font-weight:600;
                  cursor:pointer;
                "
              >
                Change
              </button>

            </div>


            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:var(--space-lg);
              "
            >

              <span
                style="
                  font-weight:600;
                  font-size:var(--fs-sm);
                  color:#2d3748;
                "
              >
                Two-Factor Authentication
              </span>

              <span
                style="
                  color:#48bb78;
                  font-weight:600;
                  font-size:var(--fs-sm);
                "
              >
                Enabled
              </span>

              <button
                style="
                  background:#edf2f7;
                  color:#4a5568;
                  padding:4px 12px;
                  border-radius:4px;
                  border:none;
                  font-size:var(--fs-xs);
                  font-weight:600;
                  cursor:pointer;
                "
              >
                Manage
              </button>

            </div>


            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:var(--space-lg);
              "
            >

              <span
                style="
                  font-weight:600;
                  font-size:var(--fs-sm);
                  color:#2d3748;
                "
              >
                Login Sessions
              </span>

              <span
                style="
                  color:#718096;
                  font-size:var(--fs-sm);
                "
              >
                3 active sessions
              </span>

              <button
                style="
                  background:#edf2f7;
                  color:#4a5568;
                  padding:4px 12px;
                  border-radius:4px;
                  border:none;
                  font-size:var(--fs-xs);
                  font-weight:600;
                  cursor:pointer;
                "
              >
                View
              </button>

            </div>


            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
              "
            >

              <span
                style="
                  font-weight:600;
                  font-size:var(--fs-sm);
                  color:#2d3748;
                "
              >
                Account Activity
              </span>

              <span
                style="
                  color:#718096;
                  font-size:var(--fs-sm);
                "
              >
                View recent activity
              </span>

              <button
                style="
                  background:#edf2f7;
                  color:#4a5568;
                  padding:4px 12px;
                  border-radius:4px;
                  border:none;
                  font-size:var(--fs-xs);
                  font-weight:600;
                  cursor:pointer;
                "
              >
                View
              </button>

            </div>

          </div>


          <!-- Quick Stats -->

          <div
            class="glass-card"
            style="
              padding:var(--space-xl);
              border:none;
              box-shadow:none;
              background:transparent;
            "
          >

            <h4
              style="
                color:#0066ff;
                font-size:var(--fs-md);
                margin-bottom:var(--space-lg);
                display:flex;
                align-items:center;
                gap:8px;
              "
            >

              <i
                data-lucide="bar-chart-2"
                style="width:18px;"
              ></i>

              Quick Stats

            </h4>


            <div class="stats-grid">

              <div class="mini-stat-card">

                <div
                  class="mini-stat-icon"
                  style="
                    background:#ebf8ff;
                    color:#3182ce;
                  "
                >
                  <i
                    data-lucide="cpu"
                    style="width:20px;"
                  ></i>
                </div>

                <div class="mini-stat-info">

                  <h4>
                    12
                  </h4>

                  <span>
                    Connected Devices
                  </span>

                </div>

              </div>


              <div class="mini-stat-card">

                <div
                  class="mini-stat-icon"
                  style="
                    background:#f0fff4;
                    color:#38a169;
                  "
                >
                  <i
                    data-lucide="check-circle"
                    style="width:20px;"
                  ></i>
                </div>

                <div class="mini-stat-info">

                  <h4>
                    0
                  </h4>

                  <span>
                    Active Faults
                  </span>

                </div>

              </div>


              <div class="mini-stat-card">

                <div
                  class="mini-stat-icon"
                  style="
                    background:#fffaf0;
                    color:#dd6b20;
                  "
                >

                  <i
                    data-lucide="zap"
                    style="width:20px;"
                  ></i>

                </div>

                <div class="mini-stat-info">

                  <h4>
                    238 V
                  </h4>

                  <span>
                    Avg Voltage
                  </span>

                </div>

              </div>


              <div class="mini-stat-card">

                <div
                  class="mini-stat-icon"
                  style="
                    background:#faf5ff;
                    color:#805ad5;
                  "
                >

                  <i
                    data-lucide="activity"
                    style="width:20px;"
                  ></i>

                </div>

                <div class="mini-stat-info">

                  <h4>
                    48.6 Hz
                  </h4>

                  <span>
                    Avg Frequency
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    `;
  }


  // Listen for real-time updates
  // to re-render if we are on dashboard

  const reRender = () => {

    if (
      window.location.hash
        .startsWith('#/dashboard')
    ) {

      const contentArea =
        document.querySelector(
          '.dashboard-content'
        );

      if (contentArea) {

        contentArea.innerHTML =
          activeTab === 'orders'
            ? renderOrdersTab()
            : activeTab === 'downloads'
              ? renderDownloadsTab()
              : activeTab === 'saved'
                ? renderSavedTab()
                : activeTab === 'profile'
                  ? renderProfileTab()
                  : '';

        if (window.lucide) {
          window.lucide.createIcons();
        }

      }

    }

  };


  store.on(
    'orders',
    reRender
  );


  window.openReviewModal = (
    orderId
  ) => {

    const orders =
      store.get('orders');

    const order =
      orders.find(
        o => o.id === orderId
      );

    if (!order) return;


    const item =
      order.items &&
      order.items[0];

    if (!item) return;


    window.currentReviewContext = {
      orderId,
      projectId: item.id
    };


    const modal =
      document.getElementById(
        'review-modal'
      );

    document.getElementById(
      'review-item-name'
    ).innerText =
      item.name;

    modal.style.display =
      'flex';

  };


  window.closeReviewModal = () => {

    document.getElementById(
      'review-modal'
    ).style.display =
      'none';

  };


  window.setReviewRating = (
    rating
  ) => {

    window.currentReviewRating =
      rating;

    const stars =
      document.querySelectorAll(
        '.review-star'
      );

    stars.forEach(
      (s, idx) => {

        if (idx < rating) {

          s.style.color =
            'var(--accent-orange)';

          s.style.fill =
            'var(--accent-orange)';

        } else {

          s.style.color =
            'var(--text-tertiary)';

          s.style.fill =
            'transparent';

        }

      }
    );

  };


  window.submitReviewForm =
    async (e) => {

      e.preventDefault();

      if (
        !window.currentReviewRating
      ) {

        alert(
          "Please select a star rating"
        );

        return;
      }


      const comment =
        document.getElementById(
          'review-comment'
        ).value;

      const {
        orderId,
        projectId
      } =
        window.currentReviewContext;


      const btn =
        document.getElementById(
          'submit-review-btn'
        );

      const originalText =
        btn.innerHTML;

      btn.innerHTML =
        'Submitting...';

      btn.disabled =
        true;


      const success =
        await store.submitReview({
          orderId,
          projectId,
          rating:
            window.currentReviewRating,
          comment
        });


      if (success) {

        alert(
          "Review submitted successfully!"
        );

        closeReviewModal();

        document.getElementById(
          'review-comment'
        ).value = '';

        setReviewRating(0);

      } else {

        alert(
          "Failed to submit review"
        );

      }


      btn.innerHTML =
        originalText;

      btn.disabled =
        false;

    };


  container.innerHTML = `

    <div
      class="dashboard-page container section"
    >

      <div
        class="dashboard-header reveal"
      >

        <h1 class="heading-xl">
          My Dashboard
        </h1>

        <p class="text-secondary">
          Welcome back, John!
        </p>

      </div>


      <div
        class="dashboard-layout reveal delay-1"
        style="
          margin-top:var(--space-2xl);
        "
      >

        <!-- Sidebar Navigation -->

        <div class="dashboard-sidebar">

          <div
            class="dashboard-nav glass-card"
            style="
              padding:var(--space-sm);
            "
          >

            <div
              class="dashboard-nav-item ${activeTab === 'orders'
      ? 'active'
      : ''
    }"
              onclick="
                switchDashboardTab('orders')
              "
            >
              <i data-lucide="package"></i>
              My Orders
            </div>


            <div
              class="dashboard-nav-item ${activeTab === 'downloads'
      ? 'active'
      : ''
    }"
              onclick="
                switchDashboardTab('downloads')
              "
            >
              <i
                data-lucide="download-cloud"
              ></i>
              Downloads
            </div>


            <div
              class="dashboard-nav-item ${activeTab === 'saved'
      ? 'active'
      : ''
    }"
              onclick="
                switchDashboardTab('saved')
              "
            >
              <i
                data-lucide="heart"
              ></i>
              Saved Projects
            </div>


            <div
              class="dashboard-nav-item ${activeTab === 'profile'
      ? 'active'
      : ''
    }"
              onclick="
                switchDashboardTab('profile')
              "
            >
              <i
                data-lucide="user"
              ></i>
              Profile
            </div>


            <div
              class="dashboard-nav-item text-red"
              style="
                margin-top:var(--space-xl);
              "
              onclick="
                alert('Logged out!')
              "
            >
              <i
                data-lucide="log-out"
              ></i>
              Logout
            </div>

          </div>

        </div>


        <!-- Content Area -->

        <div class="dashboard-content">

          ${activeTab === 'orders'
      ? renderOrdersTab()
      : ''
    }

          ${activeTab === 'downloads'
      ? renderDownloadsTab()
      : ''
    }

          ${activeTab === 'saved'
      ? renderSavedTab()
      : ''
    }

          ${activeTab === 'profile'
      ? renderProfileTab()
      : ''
    }

        </div>

      </div>

    </div>


    <!-- Review Modal -->

    <div
      id="review-modal"
      style="
        display:none;
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.8);
        z-index:9999;
        align-items:center;
        justify-content:center;
        backdrop-filter:blur(4px);
      "
    >

      <div
        class="glass-card"
        style="
          width:100%;
          max-width:450px;
          padding:var(--space-2xl);
          position:relative;
        "
      >

        <button
          class="btn btn-ghost"
          style="
            position:absolute;
            top:var(--space-sm);
            right:var(--space-sm);
            padding:4px;
          "
          onclick="
            closeReviewModal()
          "
        >

          <i
            data-lucide="x"
            style="width:20px;"
          ></i>

        </button>


        <h3
          class="heading-lg"
          style="
            margin-bottom:var(--space-sm);
          "
        >
          Write a Review
        </h3>


        <p
          class="text-secondary text-sm"
          style="
            margin-bottom:var(--space-xl);
          "
        >
          How was

          <strong
            id="review-item-name"
            style="
              color:var(--text-heading);
            "
          >
            this item
          </strong>?
        </p>


        <form
          onsubmit="
            submitReviewForm(event)
          "
        >

          <div
            style="
              display:flex;
              gap:8px;
              margin-bottom:var(--space-lg);
              justify-content:center;
            "
          >

            ${[1, 2, 3, 4, 5].map(i => `

              <i
                data-lucide="star"
                class="review-star"
                style="
                  width:32px;
                  height:32px;
                  color:var(--text-tertiary);
                  cursor:pointer;
                "
                onclick="
                  setReviewRating(${i})
                "
              ></i>

            `).join('')}

          </div>


          <div class="form-group">

            <label
              class="form-label"
            >
              Review Comment (Optional)
            </label>

            <textarea
              id="review-comment"
              class="form-input"
              rows="4"
              placeholder="Share your experience with this project..."
            ></textarea>

          </div>


          <button
            id="submit-review-btn"
            type="submit"
            class="btn btn-primary"
            style="
              width:100%;
              margin-top:var(--space-md);
            "
          >
            Submit Review
          </button>

        </form>

      </div>

    </div>

  `;


  if (window.lucide) {
    window.lucide.createIcons();
  }
}