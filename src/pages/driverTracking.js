// src/pages/driverTracking.js — Driver GPS Location Sharing Page
import { socketManager } from '../socket/socket.js';

const API = import.meta.env.VITE_API_URL || '';
const LOCATION_INTERVAL = 5000; // Send GPS every 5 seconds

export async function DriverTrackingPage(container, params) {
  const orderId = params.orderId;
  const token =
    localStorage.getItem('ck_token') ||
    localStorage.getItem('ck_admin_token');

  if (!token) {
    container.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-primary);">
        <div style="text-align:center;padding:2rem;">
          <div style="font-size:3rem;margin-bottom:1rem;">🔒</div>
          <h2 style="color:var(--text-heading);margin-bottom:0.5rem;">Authentication Required</h2>
          <p style="color:var(--text-secondary);margin-bottom:1.5rem;">Please sign in to use the driver tracking feature.</p>
          <a href="#/login" class="btn btn-primary">Sign In</a>
        </div>
        
      </div>`;
    return;
  }

  if (!orderId) {
    container.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-primary);">
        <div style="text-align:center;padding:2rem;">
          <div style="font-size:3rem;margin-bottom:1rem;">📦</div>
          <h2 style="color:var(--text-heading);margin-bottom:0.5rem;">No Order ID</h2>
          <p style="color:var(--text-secondary);">No order ID was provided in the URL.</p>
        </div>
      </div>`;
    return;
  }

  // State
  let watchId = null;
  let locationInterval = null;
  let isOnline = false;
  let lastCoords = null;
  let socketReady = false;
  let order = null;
  let assignment = null;

  // Render the driver UI
  container.innerHTML = `
    <div id="driver-page" style="min-height:100vh;background:linear-gradient(135deg,#0a0a0f 0%,#0d1117 50%,#0a0f1a 100%);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:2rem 1rem;font-family:'Inter',sans-serif;">

      <!-- Header -->
      <div style="width:100%;max-width:500px;margin-bottom:1.5rem;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:0.5rem;">
          <div style="width:44px;height:44px;background:linear-gradient(135deg,#00d4ff,#7c3aed);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🚚</div>
          <div>
            <h1 style="font-size:1.3rem;font-weight:800;color:#fff;margin:0;">Driver Tracker</h1>
            <p style="color:#94a3b8;font-size:0.8rem;margin:0;">CircuitKart Delivery</p>
          </div>
        </div>
      </div>

      <!-- Order Info Card -->
      <div id="driver-order-card" style="width:100%;max-width:500px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:1.25rem;margin-bottom:1.25rem;backdrop-filter:blur(12px);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:0.75rem;">
          <span style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;font-weight:600;">Order</span>
        </div>

        <div style="font-size:1.1rem;font-weight:700;color:#00d4ff;font-family:'JetBrains Mono',monospace;" id="driver-order-id">
          Loading...
        </div>

        <div id="driver-order-status" style="margin-top:0.5rem;font-size:0.85rem;color:#94a3b8;"></div>

        <div id="driver-delivery-addr" style="margin-top:0.5rem;font-size:0.82rem;color:#64748b;line-height:1.5;"></div>

        <div id="driver-name-badge" style="margin-top:0.75rem;display:none;">
          <span style="background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.3);color:#00d4ff;padding:4px 12px;border-radius:20px;font-size:0.78rem;font-weight:600;"></span>
        </div>
      </div>

      <!-- GPS Status Card -->
      <div id="gps-status-card" style="width:100%;max-width:500px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:1.5rem;margin-bottom:1.25rem;backdrop-filter:blur(12px);">

        <!-- Status indicator -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div id="gps-dot" style="width:12px;height:12px;border-radius:50%;background:#ef4444;flex-shrink:0;"></div>
            <span id="gps-label" style="font-weight:700;font-size:0.95rem;color:#fff;">GPS Inactive</span>
          </div>

          <div id="broadcast-badge" style="display:none;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);color:#10b981;padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;">
            📡 Broadcasting
          </div>
        </div>

        <!-- Coordinates display -->
        <div id="coords-display" style="background:rgba(0,0,0,0.3);border-radius:10px;padding:1rem;margin-bottom:1.25rem;min-height:70px;display:flex;flex-direction:column;justify-content:center;">
          <div style="color:#475569;font-size:0.75rem;margin-bottom:0.4rem;font-family:'JetBrains Mono',monospace;">
            CURRENT POSITION
          </div>

          <div id="lat-display" style="color:#94a3b8;font-family:'JetBrains Mono',monospace;font-size:0.88rem;">
            Latitude: —
          </div>

          <div id="lng-display" style="color:#94a3b8;font-family:'JetBrains Mono',monospace;font-size:0.88rem;">
            Longitude: —
          </div>

          <div id="acc-display" style="color:#475569;font-family:'JetBrains Mono',monospace;font-size:0.75rem;margin-top:0.25rem;">
            Accuracy: —
          </div>
        </div>

        <!-- Last updated -->
        <div id="last-update" style="font-size:0.75rem;color:#475569;text-align:center;margin-bottom:1.25rem;min-height:18px;"></div>

        <!-- GPS Permission Error -->
        <div id="gps-error" style="display:none;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:1rem;margin-bottom:1rem;">
          <div style="color:#ef4444;font-weight:600;font-size:0.88rem;margin-bottom:0.25rem;">
            ⚠️ GPS Error
          </div>
          <div id="gps-error-msg" style="color:#fca5a5;font-size:0.8rem;"></div>
        </div>

        <!-- Control Buttons -->
        <div style="display:flex;gap:10px;">
          <button
            id="btn-start-gps"
            onclick="window.driverStartGPS()"
            style="flex:1;padding:14px;background:linear-gradient(135deg,#00d4ff,#0ea5e9);color:#000;border:none;border-radius:12px;font-weight:700;font-size:0.95rem;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;"
          >
            📍 Start Tracking
          </button>

          <button
            id="btn-stop-gps"
            onclick="window.driverStopGPS()"
            style="flex:1;padding:14px;background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.4);border-radius:12px;font-weight:700;font-size:0.95rem;cursor:pointer;transition:all 0.2s;display:none;align-items:center;justify-content:center;gap:8px;"
          >
            ⏹ Stop Tracking
          </button>
        </div>
      </div>

      <!-- Manual Coords Fallback -->
      <div
        id="manual-coords-panel"
        style="display:none;width:100%;max-width:500px;background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.3);border-radius:16px;padding:1.25rem;margin-bottom:1.25rem;backdrop-filter:blur(12px);"
      >
        <h4 style="color:#f59e0b;font-size:0.88rem;font-weight:700;margin-bottom:0.75rem;">
          📍 Manual Location Entry
        </h4>

        <p style="color:#94a3b8;font-size:0.78rem;margin-bottom:1rem;">
          GPS permission was denied. Enter your coordinates manually from Google Maps or another app.
        </p>

        <div style="display:flex;gap:10px;margin-bottom:10px;">
          <div style="flex:1;">
            <label style="color:#64748b;font-size:0.72rem;display:block;margin-bottom:4px;">
              Latitude
            </label>

            <input
              id="manual-lat"
              type="number"
              step="any"
              placeholder="13.0827"
              style="width:100%;padding:10px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;font-size:0.88rem;box-sizing:border-box;"
            />
          </div>

          <div style="flex:1;">
            <label style="color:#64748b;font-size:0.72rem;display:block;margin-bottom:4px;">
              Longitude
            </label>

            <input
              id="manual-lng"
              type="number"
              step="any"
              placeholder="80.2707"
              style="width:100%;padding:10px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;font-size:0.88rem;box-sizing:border-box;"
            />
          </div>
        </div>

        <button
          onclick="window.driverSendManual()"
          style="width:100%;padding:11px;background:rgba(245,158,11,0.2);color:#f59e0b;border:1px solid rgba(245,158,11,0.4);border-radius:10px;font-weight:600;cursor:pointer;font-size:0.88rem;"
        >
          Send Manual Location
        </button>
      </div>

      <!-- Instructions -->
      <div style="width:100%;max-width:500px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:1.25rem;">
        <h4 style="color:#64748b;font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.75rem;">
          How it works
        </h4>

        <div style="display:flex;flex-direction:column;gap:8px;">

          <div style="display:flex;gap:10px;align-items:flex-start;">
            <span style="font-size:1rem;flex-shrink:0;">1️⃣</span>
            <p style="color:#64748b;font-size:0.8rem;margin:0;">
              Tap <strong style="color:#94a3b8;">Start Tracking</strong> and allow location permission when prompted.
            </p>
          </div>

          <div style="display:flex;gap:10px;align-items:flex-start;">
            <span style="font-size:1rem;flex-shrink:0;">2️⃣</span>
            <p style="color:#64748b;font-size:0.8rem;margin:0;">
              Your GPS location is sent to the server every 5 seconds automatically.
            </p>
          </div>

          <div style="display:flex;gap:10px;align-items:flex-start;">
            <span style="font-size:1rem;flex-shrink:0;">3️⃣</span>
            <p style="color:#64748b;font-size:0.8rem;margin:0;">
              The customer and admin can see your live position on the map.
            </p>
          </div>

          <div style="display:flex;gap:10px;align-items:flex-start;">
            <span style="font-size:1rem;flex-shrink:0;">4️⃣</span>
            <p style="color:#64748b;font-size:0.8rem;margin:0;">
              Tap <strong style="color:#94a3b8;">Stop Tracking</strong> when the delivery is complete.
            </p>
          </div>

        </div>
      </div>

    </div>`;

  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Fetch order details
  async function loadOrderData() {
    try {
      const res = await fetch(`${API}/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        order = await res.json();

        const info = order.shippingInfo || {};
        const addrParts = [
          info.address1,
          info.city,
          info.state,
          info.zip
        ].filter(Boolean);

        document.getElementById('driver-order-id').textContent = orderId;

        document.getElementById('driver-order-status').textContent =
          `Status: ${(order.status || '').replace(/_/g, ' ')}`;

        document.getElementById('driver-delivery-addr').textContent =
          addrParts.length
            ? `📍 ${addrParts.join(', ')}`
            : 'Delivery address not available';

      } else {

        // Try admin endpoint
        const adminRes = await fetch(`${API}/api/admin/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (adminRes.ok) {
          order = await adminRes.json();

          const info = order.shippingInfo || {};

          const addrParts = [
            info.address1,
            info.city,
            info.state,
            info.zip
          ].filter(Boolean);

          document.getElementById('driver-order-id').textContent = orderId;

          document.getElementById('driver-order-status').textContent =
            `Status: ${(order.status || '').replace(/_/g, ' ')}`;

          document.getElementById('driver-delivery-addr').textContent =
            addrParts.length
              ? `📍 ${addrParts.join(', ')}`
              : 'Delivery address not available';

        } else {

          document.getElementById('driver-order-id').textContent = orderId;

          document.getElementById('driver-order-status').textContent =
            'Order details unavailable';
        }
      }

    } catch (e) {
      console.error('Error loading order:', e);

      document.getElementById('driver-order-id').textContent = orderId;

      document.getElementById('driver-order-status').textContent =
        'Unable to load order details';
    }

    // Fetch assignment
    try {
      const aRes = await fetch(
        `${API}/api/tracking/assignment/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (aRes.ok) {
        const { assignment: a } = await aRes.json();

        assignment = a;

        if (a?.driver_name) {
          const badge = document.getElementById('driver-name-badge');

          badge.style.display = 'block';

          badge.querySelector('span').textContent =
            `👤 ${a.driver_name}`;
        }
      }

    } catch (e) {
      console.error('Error loading driver assignment:', e);
    }
  }

  await loadOrderData();

  // Connect socket
  try {
    socketManager.connect(token, 'driver');

    socketManager._socket?.emit('driver:join_order', {
      orderId
    });

    socketReady = true;
  } catch (e) {
    console.error('Socket connection error:', e);
    socketReady = false;
  }

  // GPS Functions
  function updateUI(online) {
    isOnline = online;

    const dot = document.getElementById('gps-dot');
    const label = document.getElementById('gps-label');
    const broadcastBadge = document.getElementById('broadcast-badge');
    const btnStart = document.getElementById('btn-start-gps');
    const btnStop = document.getElementById('btn-stop-gps');

    if (!dot || !label || !broadcastBadge || !btnStart || !btnStop) {
      return;
    }

    if (online) {
      dot.style.background = '#10b981';
      dot.style.animation = 'pulse 2s infinite';

      label.textContent = 'GPS Active — Broadcasting';
      label.style.color = '#10b981';

      broadcastBadge.style.display = 'block';

      btnStart.style.display = 'none';
      btnStop.style.display = 'flex';

    } else {

      dot.style.background = '#ef4444';
      dot.style.animation = 'none';

      label.textContent = 'GPS Inactive';
      label.style.color = '#fff';

      broadcastBadge.style.display = 'none';

      btnStart.style.display = 'flex';
      btnStop.style.display = 'none';
    }
  }

  function sendLocation(lat, lng) {
    lastCoords = {
      latitude: lat,
      longitude: lng
    };

    // Update display
    document.getElementById('lat-display').textContent =
      `Latitude:  ${lat.toFixed(6)}`;

    document.getElementById('lng-display').textContent =
      `Longitude: ${lng.toFixed(6)}`;

    document.getElementById('last-update').textContent =
      `Last update: ${new Date().toLocaleTimeString('en-IN')}`;

    // Send via Socket.IO
    if (socketManager._socket?.connected) {

      socketManager._socket.emit('driver:location_update', {
        orderId,
        latitude: lat,
        longitude: lng
      });

    } else {

      // Fallback: REST API
      fetch(`${API}/api/tracking/location`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify({
          orderId,
          latitude: lat,
          longitude: lng
        })

      }).catch((error) => {
        console.error('Location REST fallback failed:', error);
      });
    }
  }

  window.driverStartGPS = () => {

    if (!navigator.geolocation) {

      showGPSError(
        'Geolocation is not supported by this browser.'
      );

      document.getElementById('manual-coords-panel').style.display =
        'block';

      return;
    }

    document.getElementById('gps-error').style.display = 'none';

    updateUI(true);

    // Watch position continuously
    watchId = navigator.geolocation.watchPosition(

      (pos) => {

        const {
          latitude,
          longitude,
          accuracy
        } = pos.coords;

        document.getElementById('acc-display').textContent =
          `Accuracy: ±${Math.round(accuracy)}m`;

        sendLocation(latitude, longitude);
      },

      (err) => {

        let msg = '';

        switch (err.code) {

          case err.PERMISSION_DENIED:

            msg =
              'Location permission denied. Please allow location access in browser settings, or use manual entry below.';

            document.getElementById(
              'manual-coords-panel'
            ).style.display = 'block';

            break;

          case err.POSITION_UNAVAILABLE:

            msg =
              'GPS signal unavailable. Please move to an open area or use manual entry.';

            document.getElementById(
              'manual-coords-panel'
            ).style.display = 'block';

            break;

          case err.TIMEOUT:

            msg = 'GPS timed out. Retrying...';

            break;

          default:

            msg = 'An unknown GPS error occurred.';
        }

        showGPSError(msg);

        updateUI(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000
      }
    );
  };

  window.driverStopGPS = () => {

    if (watchId !== null) {

      navigator.geolocation.clearWatch(watchId);

      watchId = null;
    }

    if (locationInterval) {

      clearInterval(locationInterval);

      locationInterval = null;
    }

    updateUI(false);

    // Notify server driver went offline
    if (socketManager._socket?.connected) {

      socketManager._socket.emit(
        'driver:go_offline',
        { orderId }
      );
    }
  };

  window.driverSendManual = () => {

    const lat = parseFloat(
      document.getElementById('manual-lat').value
    );

    const lng = parseFloat(
      document.getElementById('manual-lng').value
    );

    if (isNaN(lat) || isNaN(lng)) {

      alert(
        'Please enter valid latitude and longitude values.'
      );

      return;
    }

    if (
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {

      alert(
        'Coordinates out of valid range.'
      );

      return;
    }

    sendLocation(lat, lng);

    document.getElementById('gps-label').textContent =
      'Manual Location Sent';

    document.getElementById('gps-dot').style.background =
      '#f59e0b';

    document.getElementById('broadcast-badge').style.display =
      'block';

    document.getElementById('last-update').textContent =
      `Manual update: ${new Date().toLocaleTimeString('en-IN')}`;
  };

  function showGPSError(msg) {

    const el = document.getElementById('gps-error');

    el.style.display = 'block';

    document.getElementById('gps-error-msg').textContent =
      msg;
  }

  // Cleanup when leaving the page
  window.__driverCleanup = () => {

    window.driverStopGPS();

    delete window.driverStartGPS;
    delete window.driverStopGPS;
    delete window.driverSendManual;
    delete window.__driverCleanup;
  };
}