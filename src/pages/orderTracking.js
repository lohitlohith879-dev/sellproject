// src/pages/orderTracking.js — Real-time Order Tracking Page with Live Map
import { store } from '../store.js';
import { socketManager } from '../socket/socket.js';

const API = import.meta.env.VITE_API_URL || '';

// Haversine formula — returns distance in km
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function etaMinutes(km) {
  const avgKmh = 20;
  return Math.round((km / avgKmh) * 60);
}

function formatEta(mins) {
  if (mins <= 0) return 'Arriving now';
  if (mins < 60) return `~${mins} min`;

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  return `~${h}h ${m}m`;
}

function timeAgo(isoStr) {
  if (!isoStr) return 'Never';

  const diffSec = Math.floor(
    (Date.now() - new Date(isoStr).getTime()) / 1000
  );

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;

  return `${Math.floor(diffSec / 3600)}h ago`;
}

// Full status definitions
const STATUS_FLOW = [
  {
    key: 'placed',
    label: 'Order Placed',
    icon: 'shopping-bag',
    color: '#00d4ff'
  },
  {
    key: 'payment_confirmed',
    label: 'Payment Confirmed',
    icon: 'credit-card',
    color: '#7c3aed'
  },
  {
    key: 'confirmed',
    label: 'Order Confirmed',
    icon: 'check-circle',
    color: '#3b82f6'
  },
  {
    key: 'processing',
    label: 'Processing',
    icon: 'settings',
    color: '#f59e0b'
  },
  {
    key: 'packed',
    label: 'Packed',
    icon: 'package',
    color: '#f97316'
  },
  {
    key: 'shipped',
    label: 'Shipped',
    icon: 'truck',
    color: '#8b5cf6'
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: 'map-pin',
    color: '#06b6d4'
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: 'badge-check',
    color: '#10b981'
  }
];

const SPECIAL_STATUSES = {
  cancelled: {
    label: 'Order Cancelled',
    color: '#ef4444',
    icon: 'x-circle'
  },
  payment_failed: {
    label: 'Payment Failed',
    color: '#ef4444',
    icon: 'alert-circle'
  },
  return_requested: {
    label: 'Return Requested',
    color: '#f59e0b',
    icon: 'rotate-ccw'
  },
  returned: {
    label: 'Returned',
    color: '#f59e0b',
    icon: 'package-x'
  },
  refund_processing: {
    label: 'Refund Processing',
    color: '#8b5cf6',
    icon: 'refresh-cw'
  },
  refunded: {
    label: 'Refunded',
    color: '#10b981',
    icon: 'wallet'
  }
};

const STATUS_LABEL = {};

STATUS_FLOW.forEach((s) => {
  STATUS_LABEL[s.key] = s.label;
});

Object.entries(SPECIAL_STATUSES).forEach(([k, v]) => {
  STATUS_LABEL[k] = v.label;
});

STATUS_LABEL['received'] = 'Order Received';
STATUS_LABEL['payment_submitted'] = 'Payment Submitted';

// Indicates if the live map should be shown
function shouldShowMap(status) {
  return ['shipped', 'out_for_delivery'].includes(status);
}

export async function OrderTrackingPage(container, params) {
  const orderId = params.id;
  const token = localStorage.getItem('ck_token');

  if (!token) {
    container.innerHTML = `
      <div class="container section text-center"
           style="padding-top:calc(var(--nav-height) + 4rem);min-height:70vh;">

        <h1 class="heading-xl">Sign In Required</h1>

        <p class="text-secondary"
           style="margin:1rem 0 2rem;">
          Please sign in to track your order.
        </p>

        <a href="#/login" class="btn btn-primary">
          Sign In
        </a>

      </div>`;

    return;
  }

  // Loading skeleton
  container.innerHTML = `
    <div class="container section"
         style="padding-top:calc(var(--nav-height) + 2rem);min-height:80vh;max-width:900px;">

      <div class="text-center" style="padding:4rem 0;">

        <div class="auth-spinner"
             style="display:inline-block;"></div>

        <p class="text-secondary"
           style="margin-top:1rem;">
          Loading order details…
        </p>

      </div>

    </div>`;

  // Fetch order
  let order;

  try {
    const res = await fetch(
      `${API}/api/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) {
      throw new Error('Not found');
    }

    order = await res.json();

  } catch (e) {

    console.error('Order loading error:', e);

    container.innerHTML = `
      <div class="container section text-center"
           style="padding-top:calc(var(--nav-height) + 4rem);min-height:70vh;">

        <i data-lucide="package-x"
           style="width:64px;height:64px;color:var(--text-tertiary);"></i>

        <h2 class="heading-lg"
            style="margin:1rem 0 .5rem;">
          Order Not Found
        </h2>

        <p class="text-secondary"
           style="margin-bottom:2rem;">
          Order <strong>${orderId}</strong>
          doesn't exist or doesn't belong to your account.
        </p>

        <a href="#/dashboard"
           class="btn btn-primary">
          Back to Dashboard
        </a>

      </div>`;

    if (window.lucide) {
      window.lucide.createIcons();
    }

    return;
  }

  // Map state
  let leafletMap = null;
  let driverMarker = null;
  let customerMarker = null;
  let routeLine = null;
  let driverLocation = null;
  let assignment = null;
  let driverOnline = false;
  let staleTimer = null;

  // Fetch initial tracking data
  async function loadTrackingData() {
    try {
      const [locRes, asnRes] = await Promise.all([
        fetch(
          `${API}/api/tracking/location/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        ),

        fetch(
          `${API}/api/tracking/assignment/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      ]);

      if (locRes.ok) {
        const data = await locRes.json();

        if (data.location) {
          driverLocation = data.location;
          driverOnline = data.location.isOnline ?? true;
        }
      }

      if (asnRes.ok) {
        const data = await asnRes.json();

        if (data.assignment) {
          assignment = data.assignment;
        }
      }

    } catch (e) {
      console.error('Tracking data error:', e);
    }
  }

  // Load Leaflet JS dynamically
  async function loadLeaflet() {
    if (window.L) {
      return;
    }

    return new Promise((resolve, reject) => {

      const script = document.createElement('script');

      script.src =
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

      script.integrity =
        'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV/XN2GqaA=';

      script.crossOrigin = '';

      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(script);
    });
  }

  // Build custom icon
  function makeIcon(emoji, size = 36) {
    return window.L.divIcon({
      html: `
        <div style="
          font-size:${size}px;
          line-height:1;
          filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6));
        ">
          ${emoji}
        </div>
      `,

      className: '',

      iconSize: [size, size],

      iconAnchor: [
        size / 2,
        size / 2
      ],

      popupAnchor: [
        0,
        -size / 2
      ]
    });
  }

  // Initialize or update Leaflet map
  async function initMap(deliveryLat, deliveryLng) {

    if (!shouldShowMap(order.status)) {
      return;
    }

    try {
      await loadLeaflet();
    } catch (e) {
      console.error('Unable to load Leaflet:', e);
      return;
    }

    const mapEl =
      document.getElementById('live-map-container');

    if (!mapEl) {
      return;
    }

    if (!leafletMap) {

      const centerLat =
        driverLocation?.latitude ||
        deliveryLat ||
        20.5937;

      const centerLng =
        driverLocation?.longitude ||
        deliveryLng ||
        78.9629;

      leafletMap =
        window.L
          .map(
            'live-map-container',
            {
              zoomControl: true
            }
          )
          .setView(
            [
              centerLat,
              centerLng
            ],
            14
          );

      window.L
        .tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',

            maxZoom: 19
          }
        )
        .addTo(leafletMap);
    }

    // Customer delivery marker
    if (deliveryLat && deliveryLng) {

      if (!customerMarker) {

        customerMarker =
          window.L
            .marker(
              [
                deliveryLat,
                deliveryLng
              ],
              {
                icon: makeIcon('🏠', 32)
              }
            )
            .addTo(leafletMap)
            .bindPopup(
              '<strong>Delivery Location</strong>'
            );

      } else {

        customerMarker.setLatLng([
          deliveryLat,
          deliveryLng
        ]);
      }
    }

    // Driver marker
    if (
      driverLocation?.latitude !== undefined &&
      driverLocation?.longitude !== undefined
    ) {

      const dLat =
        Number(driverLocation.latitude);

      const dLng =
        Number(driverLocation.longitude);

      if (
        Number.isFinite(dLat) &&
        Number.isFinite(dLng)
      ) {

        if (!driverMarker) {

          driverMarker =
            window.L
              .marker(
                [
                  dLat,
                  dLng
                ],
                {
                  icon: makeIcon('🚚', 34)
                }
              )
              .addTo(leafletMap)
              .bindPopup(
                `<strong>${assignment?.driver_name ||
                'Delivery Person'
                }</strong><br>Live Location`
              );

        } else {

          // Smooth marker movement
          driverMarker.setLatLng([
            dLat,
            dLng
          ]);
        }

        // Draw route line
        if (
          deliveryLat &&
          deliveryLng
        ) {

          const latLngs = [
            [
              dLat,
              dLng
            ],
            [
              deliveryLat,
              deliveryLng
            ]
          ];

          if (!routeLine) {

            routeLine =
              window.L
                .polyline(
                  latLngs,
                  {
                    color: '#00d4ff',
                    weight: 3,
                    opacity: 0.7,
                    dashArray: '8, 8'
                  }
                )
                .addTo(leafletMap);

          } else {

            routeLine.setLatLngs(
              latLngs
            );
          }

          try {
            leafletMap.fitBounds(
              window.L.latLngBounds(
                latLngs
              ),
              {
                padding: [
                  40,
                  40
                ]
              }
            );
          } catch (e) { }
        }

        // Update distance & ETA
        if (
          deliveryLat &&
          deliveryLng
        ) {

          const km =
            haversineKm(
              dLat,
              dLng,
              deliveryLat,
              deliveryLng
            );

          const mins =
            etaMinutes(km);

          const distEl =
            document.getElementById(
              'track-distance'
            );

          const etaEl =
            document.getElementById(
              'track-eta'
            );

          if (distEl) {
            distEl.textContent =
              km < 1
                ? `${Math.round(km * 1000)}m`
                : `${km.toFixed(1)} km`;
          }

          if (etaEl) {
            etaEl.textContent =
              formatEta(mins);
          }
        }
      }
    }

    // Stale location warning
    if (staleTimer) {
      clearTimeout(staleTimer);
    }

    if (driverLocation?.timestamp) {

      const age =
        Date.now() -
        new Date(
          driverLocation.timestamp
        ).getTime();

      if (age > 5 * 60 * 1000) {

        const staleEl =
          document.getElementById(
            'track-stale-warn'
          );

        if (staleEl) {
          staleEl.style.display = 'flex';
        }

      } else {

        staleTimer =
          setTimeout(
            () => {

              const staleEl =
                document.getElementById(
                  'track-stale-warn'
                );

              if (staleEl) {
                staleEl.style.display =
                  'flex';
              }

            },
            5 * 60 * 1000
          );
      }
    }

    // Last update
    const luEl =
      document.getElementById(
        'track-last-update'
      );

    if (
      luEl &&
      driverLocation?.timestamp
    ) {

      luEl.textContent =
        `Updated ${timeAgo(
          driverLocation.timestamp
        )}`;
    }
  }

  // Update driver info panel
  function updateDriverPanel() {

    const onlineEl =
      document.getElementById(
        'driver-online-badge'
      );

    const nameEl =
      document.getElementById(
        'driver-assigned-name'
      );

    if (onlineEl) {

      onlineEl.style.background =
        driverOnline
          ? 'rgba(16,185,129,0.15)'
          : 'rgba(239,68,68,0.1)';

      onlineEl.style.borderColor =
        driverOnline
          ? 'rgba(16,185,129,0.4)'
          : 'rgba(239,68,68,0.3)';

      onlineEl.style.color =
        driverOnline
          ? '#10b981'
          : '#ef4444';

      onlineEl.innerHTML =
        driverOnline
          ? '● Online'
          : '○ Offline';
    }

    if (
      nameEl &&
      assignment?.driver_name
    ) {

      nameEl.textContent =
        assignment.driver_name;
    }

    const luEl =
      document.getElementById(
        'track-last-update'
      );

    if (
      luEl &&
      driverLocation?.timestamp
    ) {

      luEl.textContent =
        `Updated ${timeAgo(
          driverLocation.timestamp
        )}`;
    }
  }

  function renderPage(o) {

    const isSpecial =
      !!SPECIAL_STATUSES[o.status];

    const specialInfo =
      SPECIAL_STATUSES[o.status];

    const currentFlowIdx =
      STATUS_FLOW.findIndex(
        s => s.key === o.status
      );

    const historyMap = {};

    (o.history || []).forEach(
      h => {
        historyMap[h.newStatus] =
          h.createdAt;
      }
    );

    const payStatusColor =
      o.paymentStatus === 'paid'
        ? '#10b981'
        : o.paymentStatus === 'failed'
          ? '#ef4444'
          : '#f59e0b';

    const payStatusLabel =
      o.paymentStatus === 'paid'
        ? 'Paid'
        : o.paymentStatus === 'failed'
          ? 'Failed'
          : 'Pending';

    const showMap =
      shouldShowMap(o.status);

    container.innerHTML = `
      <div
        class="container section"
        style="
          padding-top:calc(var(--nav-height) + 1.5rem);
          padding-bottom:4rem;
          max-width:960px;
        "
      >

        <!-- Header -->
        <div
          style="
            display:flex;
            align-items:flex-start;
            justify-content:space-between;
            flex-wrap:wrap;
            gap:1rem;
            margin-bottom:2rem;
          "
        >

          <div>

            <a
              href="#/dashboard"
              class="btn btn-ghost btn-sm"
              style="margin-bottom:.75rem;"
            >
              <i
                data-lucide="arrow-left"
                style="width:16px;"
              ></i>
              My Orders
            </a>

            <h1
              style="
                font-size:1.8rem;
                font-weight:800;
                color:var(--text-heading);
              "
            >
              Track Order
            </h1>

            <div
              style="
                display:flex;
                align-items:center;
                gap:8px;
                margin-top:4px;
                flex-wrap:wrap;
              "
            >

              <span
                class="font-mono"
                style="
                  color:var(--primary);
                  font-size:1rem;
                  font-weight:700;
                "
              >
                ${o.id}
              </span>

              <span
                style="
                  color:var(--text-tertiary);
                "
              >
                ·
              </span>

              <span
                class="text-secondary text-sm"
              >
                Placed ${new Date(o.date).toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    )
      }
              </span>

            </div>

          </div>

          <div
            id="live-status-badge"
            style="
              display:flex;
              flex-direction:column;
              align-items:flex-end;
              gap:6px;
            "
          >

            ${isSpecial
        ? `
                  <span
                    style="
                      background:${specialInfo.color}22;
                      color:${specialInfo.color};
                      border:1px solid ${specialInfo.color}44;
                      padding:6px 16px;
                      border-radius:20px;
                      font-weight:700;
                      font-size:.85rem;
                      display:flex;
                      align-items:center;
                      gap:6px;
                    "
                  >
                    <i
                      data-lucide="${specialInfo.icon}"
                      style="width:15px;"
                    ></i>

                    ${specialInfo.label}
                  </span>
                `
        : `
                  <span
                    style="
                      background:var(
                        --primary-10,
                        rgba(0,212,255,.12)
                      );
                      color:var(--primary);
                      border:1px solid rgba(0,212,255,.3);
                      padding:6px 16px;
                      border-radius:20px;
                      font-weight:700;
                      font-size:.85rem;
                    "
                  >
                    ${STATUS_LABEL[o.status] ||
        o.status
        }
                  </span>
                `
      }

            <span
              style="
                font-size:.75rem;
                color:var(--text-tertiary);
                display:flex;
                align-items:center;
                gap:4px;
              "
            >

              <span
                id="live-dot"
                style="
                  width:8px;
                  height:8px;
                  border-radius:50%;
                  background:#10b981;
                  display:inline-block;
                  animation:pulse 2s infinite;
                "
              ></span>

              Live Updates Active

            </span>

          </div>

        </div>

        ${showMap
        ? `
              <!-- Live Map Section -->
              <div
                class="glass-card"
                style="
                  margin-bottom:1.5rem;
                  overflow:hidden;
                  border-radius:16px;
                "
              >

                <!-- Map header -->
                <div
                  style="
                    padding:1rem 1.25rem;
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    flex-wrap:wrap;
                    gap:8px;
                    border-bottom:1px solid var(--border-subtle);
                  "
                >

                  <div
                    style="
                      display:flex;
                      align-items:center;
                      gap:10px;
                    "
                  >

                    <div
                      style="
                        width:36px;
                        height:36px;
                        background:rgba(0,212,255,0.15);
                        border-radius:10px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                      "
                    >
                      🗺️
                    </div>

                    <div>

                      <div
                        style="
                          font-weight:700;
                          color:var(--text-heading);
                          font-size:.95rem;
                        "
                      >
                        Live Delivery Map
                      </div>

                      <div
                        style="
                          font-size:.75rem;
                          color:var(--text-tertiary);
                        "
                      >
                        Real-time driver location
                      </div>

                    </div>

                  </div>

                  <div
                    style="
                      display:flex;
                      align-items:center;
                      gap:10px;
                      flex-wrap:wrap;
                    "
                  >

                    <!-- Driver status -->
                    <div
                      id="driver-online-badge"
                      style="
                        padding:4px 12px;
                        border-radius:20px;
                        font-size:.75rem;
                        font-weight:600;
                        border:1px solid;
                        background:rgba(239,68,68,0.1);
                        border-color:rgba(239,68,68,0.3);
                        color:#ef4444;
                      "
                    >
                      ${driverOnline
          ? '● Online'
          : '○ Offline'
        }
                    </div>

                    <!-- Last update -->
                    <div
                      id="track-last-update"
                      style="
                        font-size:.75rem;
                        color:var(--text-tertiary);
                      "
                    >
                      ${driverLocation?.timestamp
          ? `Updated ${timeAgo(
            driverLocation.timestamp
          )}`
          : 'No location yet'
        }
                    </div>

                  </div>

                </div>

                <!-- Stale warning -->
                <div
                  id="track-stale-warn"
                  style="
                    display:none;
                    background:rgba(245,158,11,0.1);
                    border-bottom:1px solid rgba(245,158,11,0.3);
                    padding:8px 1.25rem;
                    align-items:center;
                    gap:8px;
                  "
                >

                  <i
                    data-lucide="alert-triangle"
                    style="
                      width:15px;
                      color:#f59e0b;
                      flex-shrink:0;
                    "
                  ></i>

                  <span
                    style="
                      font-size:.8rem;
                      color:#f59e0b;
                    "
                  >
                    Driver location hasn't updated
                    in a while. The driver may be
                    temporarily offline.
                  </span>

                </div>

                <!-- Map -->
                <div
                  id="live-map-container"
                  style="
                    height:340px;
                    width:100%;
                    background:#1a1a2e;
                  "
                ></div>

                <!-- Stats row -->
                <div
                  style="
                    display:grid;
                    grid-template-columns:1fr 1fr 1fr;
                    padding:1rem 1.25rem;
                    gap:1rem;
                    border-top:1px solid var(--border-subtle);
                  "
                >

                  <div style="text-align:center;">

                    <div
                      style="
                        font-size:.7rem;
                        text-transform:uppercase;
                        letter-spacing:.08em;
                        color:var(--text-tertiary);
                        margin-bottom:4px;
                      "
                    >
                      Distance
                    </div>

                    <div
                      id="track-distance"
                      style="
                        font-size:1.1rem;
                        font-weight:700;
                        color:var(--primary);
                        font-family:'JetBrains Mono',monospace;
                      "
                    >
                      —
                    </div>

                  </div>

                  <div
                    style="
                      text-align:center;
                      border-left:1px solid var(--border-subtle);
                      border-right:1px solid var(--border-subtle);
                    "
                  >

                    <div
                      style="
                        font-size:.7rem;
                        text-transform:uppercase;
                        letter-spacing:.08em;
                        color:var(--text-tertiary);
                        margin-bottom:4px;
                      "
                    >
                      ETA
                    </div>

                    <div
                      id="track-eta"
                      style="
                        font-size:1.1rem;
                        font-weight:700;
                        color:#10b981;
                        font-family:'JetBrains Mono',monospace;
                      "
                    >
                      —
                    </div>

                  </div>

                  <div style="text-align:center;">

                    <div
                      style="
                        font-size:.7rem;
                        text-transform:uppercase;
                        letter-spacing:.08em;
                        color:var(--text-tertiary);
                        margin-bottom:4px;
                      "
                    >
                      Driver
                    </div>

                    <div
                      id="driver-assigned-name"
                      style="
                        font-size:.88rem;
                        font-weight:600;
                        color:var(--text-heading);
                      "
                    >
                      ${assignment?.driver_name ||
        '—'
        }
                    </div>

                  </div>

                </div>

                <!-- Map legend -->
                <div
                  style="
                    padding:.75rem 1.25rem;
                    display:flex;
                    gap:1.5rem;
                    border-top:1px solid var(--border-subtle);
                    background:rgba(0,0,0,0.15);
                    flex-wrap:wrap;
                  "
                >

                  <div
                    style="
                      display:flex;
                      align-items:center;
                      gap:6px;
                      font-size:.75rem;
                      color:var(--text-tertiary);
                    "
                  >
                    🚚 Delivery Person
                  </div>

                  <div
                    style="
                      display:flex;
                      align-items:center;
                      gap:6px;
                      font-size:.75rem;
                      color:var(--text-tertiary);
                    "
                  >
                    🏠 Your Location
                  </div>

                  <div
                    style="
                      display:flex;
                      align-items:center;
                      gap:6px;
                      font-size:.75rem;
                      color:var(--text-tertiary);
                    "
                  >

                    <div
                      style="
                        width:20px;
                        height:2px;
                        background:#00d4ff;
                        border-top:2px dashed #00d4ff;
                      "
                    ></div>

                    Route

                  </div>

                </div>

              </div>
            `
        : ''
      }

        <!-- Grid: Timeline + Details -->
        <div
          style="
            display:grid;
            grid-template-columns:1fr 340px;
            gap:1.5rem;
          "
        >

          <!-- Left: Timeline -->
          <div>

            <!-- Status Timeline Card -->
            <div
              class="glass-card"
              style="
                padding:1.75rem;
                margin-bottom:1.5rem;
              "
            >

              <h3
                style="
                  font-weight:700;
                  color:var(--text-heading);
                  margin-bottom:1.5rem;
                  display:flex;
                  align-items:center;
                  gap:8px;
                "
              >

                <i
                  data-lucide="map"
                  style="
                    width:18px;
                    color:var(--primary);
                  "
                ></i>

                Order Progress

              </h3>

              ${isSpecial
        ? `
                    <div
                      style="
                        background:${specialInfo.color}11;
                        border:1px solid ${specialInfo.color}44;
                        border-radius:12px;
                        padding:1rem 1.25rem;
                        display:flex;
                        align-items:center;
                        gap:12px;
                      "
                    >

                      <i
                        data-lucide="${specialInfo.icon}"
                        style="
                          width:24px;
                          color:${specialInfo.color};
                          flex-shrink:0;
                        "
                      ></i>

                      <div>

                        <div
                          style="
                            font-weight:600;
                            color:${specialInfo.color};
                          "
                        >
                          ${specialInfo.label}
                        </div>

                        <div
                          class="text-sm text-secondary"
                        >
                          This order has been
                          ${o.status.replace('_', ' ')}.
                        </div>

                      </div>

                    </div>
                  `
        : `
                    <div
                      id="tracking-timeline"
                      style="position:relative;"
                    >

                      ${STATUS_FLOW.map(
          (step, idx) => {

            const done =
              currentFlowIdx >= 0 &&
              idx < currentFlowIdx;

            const active =
              idx === currentFlowIdx;

            const ts =
              historyMap[step.key];

            return `
                              <div
                                style="
                                  display:flex;
                                  gap:16px;
                                  margin-bottom:0;
                                "
                              >

                                <div
                                  style="
                                    display:flex;
                                    flex-direction:column;
                                    align-items:center;
                                    min-width:36px;
                                  "
                                >

                                  <div
                                    style="
                                      width:36px;
                                      height:36px;
                                      border-radius:50%;
                                      display:flex;
                                      align-items:center;
                                      justify-content:center;
                                      flex-shrink:0;
                                      background:${done
                ? step.color
                : active
                  ? step.color + '22'
                  : 'rgba(255,255,255,0.05)'
              };
                                      border:2px solid ${done || active
                ? step.color
                : 'var(--border-subtle)'
              };
                                      ${active
                ? `box-shadow:0 0 0 4px ${step.color}22;`
                : ''
              }
                                      transition:all 0.4s;
                                    "
                                  >

                                    ${done
                ? `
                                          <i
                                            data-lucide="check"
                                            style="
                                              width:18px;
                                              height:18px;
                                              color:#fff;
                                            "
                                          ></i>
                                        `
                : `
                                          <i
                                            data-lucide="${step.icon}"
                                            style="
                                              width:16px;
                                              height:16px;
                                              color:${active
                  ? step.color
                  : 'var(--text-tertiary)'
                };
                                            "
                                          ></i>
                                        `
              }

                                  </div>

                                  ${idx <
                STATUS_FLOW.length - 1
                ? `
                                        <div
                                          style="
                                            width:2px;
                                            flex:1;
                                            min-height:28px;
                                            background:${done
                  ? step.color
                  : 'var(--border-subtle)'
                };
                                            transition:background 0.4s;
                                            margin:4px 0;
                                          "
                                        ></div>
                                      `
                : ''
              }

                                </div>

                                <div
                                  style="
                                    padding-top:6px;
                                    padding-bottom:${idx <
                STATUS_FLOW.length - 1
                ? '12px'
                : '0'
              };
                                  "
                                >

                                  <div
                                    style="
                                      font-weight:${active
                ? '700'
                : '500'
              };
                                      color:${done || active
                ? 'var(--text-heading)'
                : 'var(--text-tertiary)'
              };
                                      font-size:.9rem;
                                    "
                                  >
                                    ${step.label}
                                  </div>

                                  ${ts
                ? `
                                        <div
                                          style="
                                            font-size:.75rem;
                                            color:var(--text-tertiary);
                                            margin-top:2px;
                                          "
                                        >
                                          ${new Date(
                  ts
                ).toLocaleString(
                  'en-IN',
                  {
                    dateStyle:
                      'short',
                    timeStyle:
                      'short'
                  }
                )
                }
                                        </div>
                                      `
                : active
                  ? `
                                          <div
                                            style="
                                              font-size:.75rem;
                                              color:${step.color};
                                              margin-top:2px;
                                              font-weight:600;
                                            "
                                          >
                                            ● In Progress
                                          </div>
                                        `
                  : `
                                          <div
                                            style="
                                              font-size:.75rem;
                                              color:var(--text-tertiary);
                                              margin-top:2px;
                                            "
                                          >
                                            Pending
                                          </div>
                                        `
              }

                                </div>

                              </div>
                            `;
          }
        ).join('')
        }

                    </div>
                  `
      }

            </div>

            <!-- History Log -->
            <div
              class="glass-card"
              style="padding:1.5rem;"
            >

              <h3
                style="
                  font-weight:700;
                  color:var(--text-heading);
                  margin-bottom:1rem;
                  display:flex;
                  align-items:center;
                  gap:8px;
                "
              >

                <i
                  data-lucide="clock"
                  style="
                    width:18px;
                    color:var(--primary);
                  "
                ></i>

                Status History

              </h3>

              <div
                id="history-log"
                style="
                  display:flex;
                  flex-direction:column;
                  gap:10px;
                "
              >

                ${(o.history || []).length === 0
        ? `
                      <p class="text-secondary text-sm">
                        No history yet.
                      </p>
                    `
        : [
          ...(o.history || [])
        ]
          .reverse()
          .map(
            h => `
                            <div
                              style="
                                display:flex;
                                gap:12px;
                                align-items:flex-start;
                                padding:10px;
                                background:rgba(255,255,255,0.03);
                                border-radius:8px;
                                border-left:3px solid var(--primary);
                              "
                            >

                              <div style="flex:1;">

                                <div
                                  style="
                                    font-size:.85rem;
                                    font-weight:600;
                                    color:var(--text-heading);
                                  "
                                >

                                  ${h.previousStatus
                ? `
                                        <span
                                          class="text-tertiary"
                                        >
                                          ${STATUS_LABEL[
                h.previousStatus
                ] ||
                h.previousStatus
                }
                                        </span>
                                        →
                                      `
                : ''
              }

                                  <span
                                    style="
                                      color:var(--primary);
                                    "
                                  >
                                    ${STATUS_LABEL[
              h.newStatus
              ] ||
              h.newStatus
              }
                                  </span>

                                </div>

                                ${h.note
                ? `
                                      <div
                                        style="
                                          font-size:.8rem;
                                          color:var(--text-secondary);
                                          margin-top:2px;
                                        "
                                      >
                                        Note: ${h.note}
                                      </div>
                                    `
                : ''
              }

                                <div
                                  style="
                                    font-size:.75rem;
                                    color:var(--text-tertiary);
                                    margin-top:4px;
                                  "
                                >
                                  ${new Date(
                h.createdAt
              ).toLocaleString(
                'en-IN',
                {
                  dateStyle:
                    'medium',
                  timeStyle:
                    'short'
                }
              )
              }
                                </div>

                              </div>

                            </div>
                          `
          )
          .join('')
      }

              </div>

            </div>

          </div>

          <!-- Right: Order Info -->
          <div
            style="
              display:flex;
              flex-direction:column;
              gap:1.25rem;
            "
          >

            <!-- Payment Status -->
            <div
              class="glass-card"
              style="padding:1.25rem;"
            >

              <h4
                style="
                  font-size:.8rem;
                  text-transform:uppercase;
                  letter-spacing:.08em;
                  color:var(--text-tertiary);
                  margin-bottom:.75rem;
                "
              >
                Payment
              </h4>

              <div
                style="
                  display:flex;
                  align-items:center;
                  gap:8px;
                  margin-bottom:.5rem;
                "
              >

                <span
                  style="
                    width:10px;
                    height:10px;
                    border-radius:50%;
                    background:${payStatusColor};
                    display:inline-block;
                  "
                ></span>

                <span
                  style="
                    font-weight:700;
                    color:${payStatusColor};
                  "
                >
                  ${payStatusLabel}
                </span>

              </div>

              <div
                style="
                  font-size:.8rem;
                  color:var(--text-secondary);
                "
              >
                ${o.paymentMethod || 'UPI'}
              </div>

              <div
                style="
                  border-top:1px solid var(--border-subtle);
                  margin-top:.75rem;
                  padding-top:.75rem;
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                "
              >

                <span class="text-secondary text-sm">
                  Total
                </span>

                <span
                  class="font-mono font-bold"
                  style="
                    color:var(--primary);
                    font-size:1.1rem;
                  "
                >
                  ₹${new Intl.NumberFormat(
        'en-IN'
      ).format(
        o.total
      )
      }
                </span>

              </div>

            </div>

            <!-- Delivery -->
            ${o.estimatedDelivery ||
        o.trackingNumber
        ? `
                  <div
                    class="glass-card"
                    style="padding:1.25rem;"
                  >

                    <h4
                      style="
                        font-size:.8rem;
                        text-transform:uppercase;
                        letter-spacing:.08em;
                        color:var(--text-tertiary);
                        margin-bottom:.75rem;
                      "
                    >
                      Delivery
                    </h4>

                    ${o.estimatedDelivery
          ? `
                          <div
                            style="
                              display:flex;
                              align-items:center;
                              gap:8px;
                              margin-bottom:.5rem;
                            "
                          >

                            <i
                              data-lucide="calendar"
                              style="
                                width:15px;
                                color:var(--text-secondary);
                              "
                            ></i>

                            <span class="text-sm">
                              Est:
                              <strong>
                                ${o.estimatedDelivery}
                              </strong>
                            </span>

                          </div>
                        `
          : ''
        }

                    ${o.trackingNumber
          ? `
                          <div
                            style="
                              display:flex;
                              align-items:center;
                              gap:8px;
                              background:rgba(255,255,255,0.05);
                              border-radius:8px;
                              padding:8px 10px;
                              margin-top:.5rem;
                            "
                          >

                            <i
                              data-lucide="truck"
                              style="
                                width:15px;
                                color:var(--primary);
                              "
                            ></i>

                            <span
                              class="font-mono text-sm"
                              style="
                                color:var(--primary);
                              "
                            >
                              ${o.trackingNumber}
                            </span>

                          </div>
                        `
          : ''
        }

                  </div>
                `
        : ''
      }

            <!-- Items -->
            <div
              class="glass-card"
              style="padding:1.25rem;"
            >

              <h4
                style="
                  font-size:.8rem;
                  text-transform:uppercase;
                  letter-spacing:.08em;
                  color:var(--text-tertiary);
                  margin-bottom:.75rem;
                "
              >
                Items Ordered
              </h4>

              ${(o.items || [])
        .map(
          item => `
                      <div
                        style="
                          display:flex;
                          justify-content:space-between;
                          align-items:center;
                          gap:8px;
                          padding:.5rem 0;
                          border-bottom:1px solid var(--border-subtle);
                        "
                      >

                        <div>

                          <div
                            style="
                              font-weight:500;
                              font-size:.85rem;
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
                            Qty:
                            ${item.quantity || 1}
                          </div>

                        </div>

                        <div
                          class="font-mono text-sm"
                        >
                          ₹${new Intl.NumberFormat(
            'en-IN'
          ).format(
            item.price *
            (item.quantity || 1)
          )
            }
                        </div>

                      </div>
                    `
        )
        .join('')
      }

            </div>

            <!-- Shipping -->
            ${o.shippingInfo?.name
        ? `
                  <div
                    class="glass-card"
                    style="padding:1.25rem;"
                  >

                    <h4
                      style="
                        font-size:.8rem;
                        text-transform:uppercase;
                        letter-spacing:.08em;
                        color:var(--text-tertiary);
                        margin-bottom:.75rem;
                      "
                    >
                      Ship To
                    </h4>

                    <div
                      style="
                        font-weight:600;
                        font-size:.9rem;
                        color:var(--text-heading);
                      "
                    >
                      ${o.shippingInfo.name}
                    </div>

                    <div
                      style="
                        font-size:.8rem;
                        color:var(--text-secondary);
                        line-height:1.6;
                      "
                    >
                      ${[
          o.shippingInfo.address1,
          o.shippingInfo.address2,
          o.shippingInfo.city,
          o.shippingInfo.state,
          o.shippingInfo.zip,
          o.shippingInfo.country
        ]
          .filter(Boolean)
          .join(', ')
        }
                    </div>

                  </div>
                `
        : ''
      }

            <!-- Support -->
            <div
              class="glass-card"
              style="
                padding:1.25rem;
                text-align:center;
              "
            >

              <i
                data-lucide="headphones"
                style="
                  width:28px;
                  height:28px;
                  color:var(--primary);
                  margin-bottom:.5rem;
                "
              ></i>

              <p class="text-sm text-secondary">
                Need help with your order?
              </p>

              <a
                href="#/contact"
                class="btn btn-ghost btn-sm"
                style="margin-top:.5rem;"
              >
                Contact Support
              </a>

            </div>

          </div>

        </div>

      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Init map if needed
    if (showMap) {

      const deliveryLat =
        o.delivery_lat ||
        o.deliveryLat ||
        null;

      const deliveryLng =
        o.delivery_lng ||
        o.deliveryLng ||
        null;

      initMap(
        deliveryLat,
        deliveryLng
      );

      updateDriverPanel();
    }
  }

  // Initial tracking data
  if (shouldShowMap(order.status)) {
    await loadTrackingData();
  }

  // Initial render
  renderPage(order);

  // Subscribe to live location updates
  if (shouldShowMap(order.status)) {

    socketManager._socket?.emit(
      'tracking:subscribe',
      {
        orderId
      }
    );
  }

  // Handle incoming driver location
  function handleLocation(data) {

    if (!data || data.orderId !== orderId) {
      return;
    }

    driverLocation = {
      ...data,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      timestamp:
        data.timestamp ||
        new Date().toISOString()
    };

    driverOnline =
      data.isOnline !== undefined
        ? data.isOnline
        : true;

    // Hide stale warning
    const staleEl =
      document.getElementById(
        'track-stale-warn'
      );

    if (staleEl) {
      staleEl.style.display = 'none';
    }

    const deliveryLat =
      order.delivery_lat ||
      order.deliveryLat ||
      null;

    const deliveryLng =
      order.delivery_lng ||
      order.deliveryLng ||
      null;

    initMap(
      deliveryLat,
      deliveryLng
    );

    updateDriverPanel();

    // Restart stale timer
    if (staleTimer) {
      clearTimeout(staleTimer);
    }

    staleTimer =
      setTimeout(
        () => {

          const el =
            document.getElementById(
              'track-stale-warn'
            );

          if (el) {
            el.style.display = 'flex';
          }

        },
        5 * 60 * 1000
      );
  }

  // Handle driver online/offline status changes
  function handleDriverStatus(data) {

    if (!data || data.orderId !== orderId) {
      return;
    }

    driverOnline =
      !!data.isOnline;

    updateDriverPanel();
  }

  socketManager.on(
    'tracking:location',
    handleLocation
  );

  socketManager.on(
    'tracking:driver_status',
    handleDriverStatus
  );

  // Handle order status updates
  function handleStatusUpdate(data) {

    if (!data || data.id !== orderId) {
      return;
    }

    order.status =
      data.status ||
      order.status;

    if (
      data.trackingNumber !== undefined
    ) {
      order.trackingNumber =
        data.trackingNumber;
    }

    if (
      data.estimatedDelivery !== undefined
    ) {
      order.estimatedDelivery =
        data.estimatedDelivery;
    }

    if (data.history) {
      order.history =
        data.history;
    }

    if (data.paymentStatus) {
      order.paymentStatus =
        data.paymentStatus;
    }

    // If now out for delivery,
    // fetch tracking data and re-render
    if (shouldShowMap(data.status)) {

      loadTrackingData()
        .then(() => {
          renderPage(order);

          socketManager._socket?.emit(
            'tracking:subscribe',
            {
              orderId
            }
          );
        });

    } else {

      renderPage(order);
    }

    const label =
      STATUS_LABEL[data.status] ||
      data.status;

    showTrackingToast(
      `Your order is now: <strong>${label}</strong>`,
      '🎉'
    );
  }

  socketManager.on(
    'order:status_update',
    handleStatusUpdate
  );

  // On reconnect, re-fetch latest
  socketManager.on(
    'connection',
    async (connected) => {

      if (!connected) {
        return;
      }

      try {

        const res =
          await fetch(
            `${API}/api/orders/${orderId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        if (!res.ok) {
          return;
        }

        order =
          await res.json();

        if (
          shouldShowMap(
            order.status
          )
        ) {

          await loadTrackingData();
        }

        renderPage(order);

        if (
          shouldShowMap(
            order.status
          )
        ) {

          socketManager._socket?.emit(
            'tracking:subscribe',
            {
              orderId
            }
          );
        }

      } catch (e) {
        console.error(
          'Reconnect tracking refresh failed:',
          e
        );
      }
    }
  );

  // Periodically refresh tracking data
  // as an additional fallback if Socket.IO
  // is temporarily disconnected.
  const refreshInterval =
    setInterval(
      async () => {

        if (
          !shouldShowMap(
            order.status
          )
        ) {
          return;
        }

        if (
          socketManager._socket?.connected
        ) {
          return;
        }

        try {

          await loadTrackingData();

          const deliveryLat =
            order.delivery_lat ||
            order.deliveryLat ||
            null;

          const deliveryLng =
            order.delivery_lng ||
            order.deliveryLng ||
            null;

          await initMap(
            deliveryLat,
            deliveryLng
          );

          updateDriverPanel();

        } catch (e) {
          console.error(
            'Tracking refresh failed:',
            e
          );
        }

      },
      10000
    );

  // Cleanup
  window.__orderTrackingCleanup = () => {

    clearInterval(
      refreshInterval
    );

    if (staleTimer) {
      clearTimeout(
        staleTimer
      );
    }

    socketManager.off?.(
      'tracking:location',
      handleLocation
    );

    socketManager.off?.(
      'tracking:driver_status',
      handleDriverStatus
    );

    socketManager.off?.(
      'order:status_update',
      handleStatusUpdate
    );

    if (
      leafletMap
    ) {

      try {
        leafletMap.remove();
      } catch (e) { }

      leafletMap = null;
      driverMarker = null;
      customerMarker = null;
      routeLine = null;
    }

    delete window.__orderTrackingCleanup;
  };
}

function showTrackingToast(
  msg,
  emoji = '📦'
) {

  const toastCont =
    document.getElementById(
      'toast-container'
    );

  if (!toastCont) {
    return;
  }

  const t =
    document.createElement('div');

  t.className =
    'toast toast-order';

  t.style.cssText =
    'animation:slideInRight 0.35s forwards;';

  t.innerHTML = `
    <div class="toast-icon">
      ${emoji}
    </div>

    <div class="toast-content">
      ${msg}
    </div>

    <button
      class="toast-close"
      onclick="this.parentElement.remove()"
    >
      ✕
    </button>
  `;

  toastCont.appendChild(t);

  setTimeout(
    () => {

      t.style.animation =
        'slideOutRight 0.3s forwards';

      setTimeout(
        () => t.remove(),
        300
      );

    },
    6000
  );
}