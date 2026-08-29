import { io } from 'socket.io-client';

class Store {
  constructor() {
    this.state = {
      cart: JSON.parse(localStorage.getItem('circuitkart_cart')) || [],
      orders: [],
      quotes: [],
      isConnected: false
    };
    this.listeners = {};
    
    // Initialize Socket.IO connection to the backend
    this.socket = io(); // Defaults to host, which proxy maps to :3001
    
    this.socket.on('connect', () => {
      console.log('Connected to real-time backend');
      this.state.isConnected = true;
      this.emit('connection', true);
      
      // Fetch initial data once connected
      this.fetchOrders();
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from backend');
      this.state.isConnected = false;
      this.emit('connection', false);
    });

    // Listen for real-time order updates
    this.socket.on('order:status_update', (data) => {
      console.log('Real-time update received:', data);
      const order = this.state.orders.find(o => o.id === data.id);
      if (order) {
        order.status = data.status;
        this.emit('orders', this.state.orders);
        this.emit(`order_${data.id}`, order); // Specific event for that order
      }
    });
    
    // Admin events
    this.socket.on('admin:new_order', (data) => {
      this.state.orders.unshift(data);
      this.emit('orders', this.state.orders);
      this.emit('notification', { type: 'order', message: `New order received: ${data.id}` });
    });
    
    this.socket.on('admin:new_quote', (data) => {
      this.state.quotes.unshift(data);
      this.emit('quotes', this.state.quotes);
      this.emit('notification', { type: 'quote', message: `New quote requested by ${data.name}` });
    });
  }

  // Event emitter logic
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  get(key) {
    return this.state[key];
  }
  
  // ----------------------------------------------------
  // CART LOGIC (Still LocalStorage for persistence across reloads before checkout)
  // ----------------------------------------------------

  saveCart() {
    localStorage.setItem('circuitkart_cart', JSON.stringify(this.state.cart));
    this.emit('cart', this.state.cart);
  }

  addToCart(item) {
    const existingIndex = this.state.cart.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      this.state.cart[existingIndex].quantity = (this.state.cart[existingIndex].quantity || 1) + 1;
    } else {
      this.state.cart.push({ ...item, quantity: 1 });
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
    return this.state.cart.reduce((total, item) => total + (item.quantity || 1), 0);
  }

  getCartTotal() {
    return this.state.cart.reduce((total, item) => {
      if (item.isQuote) return total;
      return total + (item.price * (item.quantity || 1));
    }, 0);
  }
  
  // ----------------------------------------------------
  // BACKEND API LOGIC
  // ----------------------------------------------------
  
  async fetchOrders() {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        this.state.orders = await response.json();
        this.emit('orders', this.state.orders);
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    }
  }

  async addOrder(orderData) {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (response.ok) {
        const newOrder = await response.json();
        // Socket will broadcast it to admin, but we add to local state for customer immediately
        // Actually, let's just fetch everything to sync
        await this.fetchOrders();
        return newOrder;
      }
      throw new Error('Failed to create order');
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  
  async updateOrderStatus(id, status) {
    try {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  
  async submitCustomQuote(quoteData) {
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });
      return response.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}

// Export a singleton instance
export const store = new Store();
