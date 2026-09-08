import { socketManager } from './socket/socket.js';

const API = import.meta.env.VITE_API_URL || '';

class Store {
  constructor() {
    this.state = {
      cart: JSON.parse(localStorage.getItem('circuitkart_cart')) || [],
      orders: [],
      quotes: [],
      activities: [],
      projects: [],
      components: [],
      settings: {},
      notifications: [],
      unreadNotifCount: 0,
      isConnected: false,
      isInitialized: false
    };

    this.listeners = {};

    // Bind global socket events
    socketManager.on('connection', (status) => {
      this.state.isConnected = status;
      this.emit('connection', status);

      if (status) {
        this.fetchOrders();
      }
    });

    socketManager.on('order:status_update', (data) => {
      console.log('[Store] Real-time order update:', data);

      const order = this.state.orders.find(o => o.id === data.id);

      if (order) {
        order.status = data.status || order.status;

        if (data.trackingNumber !== undefined) {
          order.trackingNumber = data.trackingNumber;
        }

        if (data.estimatedDelivery !== undefined) {
          order.estimatedDelivery = data.estimatedDelivery;
        }

        if (data.history) {
          order.history = data.history;
        }

        if (data.paymentStatus) {
          order.paymentStatus = data.paymentStatus;
        }

        this.emit('orders', this.state.orders);
        this.emit(`order_${data.id}`, order);
      }

      // Update unread count if there's a new notification
      if (data.notification && data.notification.userId) {
        const myId = JSON.parse(
          localStorage.getItem('ck_user') || '{}'
        ).id;

        if (String(data.notification.userId) === String(myId)) {
          this.state.unreadNotifCount =
            (this.state.unreadNotifCount || 0) + 1;

          this.emit(
            'unreadNotifCount',
            this.state.unreadNotifCount
          );
        }
      }
    });

    socketManager.on('order:created', (data) => {
      // Customer new order
      this.state.orders.unshift(data);
      this.emit('orders', this.state.orders);
    });

    socketManager.on('project:updated', async () => {
      try {
        const res = await fetch(`${API}/api/projects`);

        if (res.ok) {
          this.state.projects = await res.json();
          this.emit('projects', this.state.projects);
        }
      } catch (e) {
        console.error('Failed to update projects:', e);
      }
    });

    socketManager.on('settings:updated', (settings) => {
      this.state.settings = settings;
      this.emit('settings', this.state.settings);
    });

    socketManager.on('notification', (data) => {
      this.emit('notification', data);
    });

    // Admin events
    socketManager.on('admin:new_order', (data) => {
      this.state.orders.unshift(data);
      this.emit('orders', this.state.orders);

      this.emit('notification', {
        type: 'order',
        message: `New order received: ${data.id}`
      });
    });

    socketManager.on('admin:new_quote', (data) => {
      this.state.quotes.unshift(data);
      this.emit('quotes', this.state.quotes);

      this.emit('notification', {
        type: 'quote',
        message: `New quote requested by ${data.name}`
      });
    });

    socketManager.on('admin:activity', (data) => {
      this.state.activities.unshift(data);
      this.emit('activities', this.state.activities);
    });
  }

  // ----------------------------------------------------
  // EVENT EMITTER
  // ----------------------------------------------------

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  // ----------------------------------------------------
  // INITIALIZE APP DATA
  // ----------------------------------------------------

  async init() {
    if (this.state.isInitialized) {
      return;
    }

    try {
      const [
        projectsRes,
        componentsRes,
        settingsRes
      ] = await Promise.all([
        fetch(`${API}/api/projects`),
        fetch(`${API}/api/components`),
        fetch(`${API}/api/settings`)
      ]);

      this.state.projects = await projectsRes.json();
      this.state.components = await componentsRes.json();
      this.state.settings = await settingsRes.json();

      this.state.isInitialized = true;
      window.__storeInitialized = true;

      this.emit('initialized', true);
    } catch (e) {
      console.error(
        'Failed to initialize app data:',
        e
      );
    }
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    this.emit(key, value);
  }

  // ----------------------------------------------------
  // CART LOGIC
  // ----------------------------------------------------

  saveCart() {
    localStorage.setItem(
      'circuitkart_cart',
      JSON.stringify(this.state.cart)
    );

    this.emit('cart', this.state.cart);
  }

  addToCart(item) {
    const existingIndex = this.state.cart.findIndex(
      i => i.id === item.id
    );

    if (existingIndex >= 0) {
      this.state.cart[existingIndex].quantity =
        (this.state.cart[existingIndex].quantity || 1) + 1;
    } else {
      this.state.cart.push({
        ...item,
        quantity: 1
      });
    }

    this.saveCart();
  }

  updateCartQuantity(index, quantity) {
    if (quantity <= 0) {
      this.removeFromCart(index);
      return;
    }

    if (this.state.cart[index]) {
      this.state.cart[index].quantity = quantity;
      this.saveCart();
    }
  }

  removeFromCart(index) {
    this.state.cart.splice(index, 1);
    this.saveCart();
  }

  clearCart() {
    this.state.cart = [];
    this.saveCart();
  }

  getCartCount() {
    return this.state.cart.reduce(
      (total, item) =>
        total + (item.quantity || 1),
      0
    );
  }

  getCartTotal() {
    return this.state.cart.reduce(
      (total, item) => {
        if (item.isQuote) {
          return total;
        }

        return total +
          (item.price * (item.quantity || 1));
      },
      0
    );
  }

  // ----------------------------------------------------
  // BACKEND API LOGIC
  // ----------------------------------------------------

  getToken() {
    if (
      window.location.hash.startsWith('#/admin')
    ) {
      return localStorage.getItem(
        'ck_admin_token'
      );
    }

    return localStorage.getItem('ck_token');
  }

  // ----------------------------------------------------
  // ORDERS
  // ----------------------------------------------------

  async fetchOrders() {
    try {
      const token = this.getToken();

      if (!token) {
        return;
      }

      const endpoint =
        window.location.hash.startsWith('#/admin')
          ? '/api/orders/all'
          : '/api/orders';

      const response = await fetch(
        `${API}${endpoint}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        this.state.orders =
          await response.json();

        this.emit(
          'orders',
          this.state.orders
        );
      }
    } catch (e) {
      console.error(
        'Failed to fetch orders:',
        e
      );
    }
  }

  async addOrder(orderData) {
    try {
      const token = this.getToken();

      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] =
          `Bearer ${token}`;
      }

      const response = await fetch(
        `${API}/api/orders`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(orderData)
        }
      );

      if (response.ok) {
        const newOrder =
          await response.json();

        await this.fetchOrders();

        return newOrder;
      }

      throw new Error(
        'Failed to create order'
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async updateOrderStatus(id, status) {
    try {
      const token = this.getToken();

      const response = await fetch(
        `${API}/api/orders/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
            'Authorization':
              `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );

      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async submitPaymentProof(
    orderId,
    transactionId
  ) {
    try {
      const token = this.getToken();

      const response = await fetch(
        `${API}/api/orders/${orderId}/payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            'Authorization':
              `Bearer ${token}`
          },
          body: JSON.stringify({
            transactionId
          })
        }
      );

      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async fetchOrder(orderId) {
    try {
      const token =
        localStorage.getItem('ck_token');

      if (!token) {
        return null;
      }

      const res = await fetch(
        `${API}/api/orders/${orderId}`,
        {
          headers: {
            'Authorization':
              `Bearer ${token}`
          }
        }
      );

      if (res.ok) {
        return await res.json();
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  // ----------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------

  async fetchNotifications() {
    try {
      const token =
        localStorage.getItem('ck_token');

      if (!token) {
        return [];
      }

      const res = await fetch(
        `${API}/api/notifications`,
        {
          headers: {
            'Authorization':
              `Bearer ${token}`
          }
        }
      );

      if (res.ok) {
        const notifs =
          await res.json();

        this.state.notifications =
          notifs;

        this.state.unreadNotifCount =
          notifs.filter(
            n => !n.isRead
          ).length;

        this.emit(
          'unreadNotifCount',
          this.state.unreadNotifCount
        );

        return notifs;
      }

      return [];
    } catch (e) {
      return [];
    }
  }

  // ----------------------------------------------------
  // USER PROFILE
  // ----------------------------------------------------

  async fetchUserProfile() {
    try {
      const token =
        localStorage.getItem('ck_token');

      if (!token) {
        return null;
      }

      const res = await fetch(
        `${API}/api/users/profile`,
        {
          headers: {
            'Authorization':
              `Bearer ${token}`
          }
        }
      );

      if (res.ok) {
        const profile =
          await res.json();

        const currentUser =
          this.state.user || {};

        const updatedUser = {
          ...currentUser,
          ...profile,
          loggedIn: true
        };

        this.state.user =
          updatedUser;

        localStorage.setItem(
          'ck_user',
          JSON.stringify(updatedUser)
        );

        this.emit(
          'user',
          updatedUser
        );

        return updatedUser;
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  // ----------------------------------------------------
  // CUSTOM QUOTE
  // ----------------------------------------------------

  async submitCustomQuote(
    quoteData
  ) {
    try {
      const token =
        this.getToken();

      const response = await fetch(
        `${API}/api/quotes`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            'Authorization':
              `Bearer ${token}`
          },
          body: JSON.stringify(
            quoteData
          )
        }
      );

      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // ----------------------------------------------------
  // ADMIN FEED
  // ----------------------------------------------------

  async fetchAdminFeed() {
    try {
      const token =
        localStorage.getItem(
          'ck_admin_token'
        );

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API}/api/admin/feed`,
        {
          headers: {
            'Authorization':
              `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        this.state.activities =
          await response.json();

        this.emit(
          'activities',
          this.state.activities
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  // ----------------------------------------------------
  // REVIEWS
  // ----------------------------------------------------

  async submitReview(reviewData) {
    try {
      const token =
        this.getToken();

      const response = await fetch(
        `${API}/api/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            'Authorization':
              `Bearer ${token}`
          },
          body: JSON.stringify(
            reviewData
          )
        }
      );

      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}

// Export singleton instance
export const store = new Store();