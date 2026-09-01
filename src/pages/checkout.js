import { store } from '../store.js';

export function CheckoutPage(container) {
  
  window.selectPaymentMethod = (method) => {
    document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('selected'));
    document.getElementById('pm-' + method).classList.add('selected');
  };
  
  window.submitOrder = async (e) => {
    e.preventDefault();
    
    const cart = store.get('cart');
    if (cart.length === 0) return;
    
    // Save form data temporarily
    window.pendingOrderData = {
      items: cart,
      total: store.getCartTotal(),
      contactInfo: {
        email: e.target[0].value,
        phone: e.target[1].value
      },
      shippingInfo: {
        name: e.target[2].value,
        address1: e.target[3].value,
        address2: e.target[4].value,
        city: e.target[5].value,
        state: e.target[6].value,
        zip: e.target[7].value,
        country: e.target[8].value
      },
      paymentMethod: document.querySelector('.payment-method.selected').id.replace('pm-', '')
    };
    
    if (window.pendingOrderData.paymentMethod === 'upi') {
      // Show UPI QR Code modal
      const qrModal = document.getElementById('upi-qr-modal');
      const formLayout = document.getElementById('checkout-layout');
      if (qrModal && formLayout) {
        formLayout.style.display = 'none';
        qrModal.style.display = 'block';
        qrModal.classList.add('animate-scale-in');
      }
      return;
    }
    
    await finalizeOrder(window.pendingOrderData);
  };
  
  window.finalizeOrder = async (orderData) => {
    const upiRef = document.getElementById('upi-ref')?.value;

    const order = await store.addOrder(orderData);
    if (!order) {
      alert("Failed to submit order. Please try again.");
      return;
    }
    
    // Submit payment proof if UPI
    if (orderData.paymentMethod === 'upi' && upiRef) {
      await store.submitPaymentProof(order.id, upiRef);
    }
    if (!order) {
      alert("Failed to submit order. Please try again.");
      return;
    }
    
    store.clearCart();
    
    const formLayout = document.getElementById('checkout-layout');
    const qrModal = document.getElementById('upi-qr-modal');
    const successMsg = document.getElementById('order-success');
    const orderIdEl = document.getElementById('success-order-id');
    
    if (formLayout) formLayout.style.display = 'none';
    if (qrModal) qrModal.style.display = 'none';
    
    if (successMsg && orderIdEl) {
      orderIdEl.innerText = order.id;
      // Add track button dynamically
      const trackBtn = document.getElementById('track-order-btn');
      if (trackBtn) trackBtn.href = `#/track/${order.id}`;
      successMsg.style.display = 'block';
      successMsg.classList.add('animate-scale-in');
    }
  };
  
  function render() {
    const cart = store.get('cart');
    const total = store.getCartTotal();
    
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="checkout-page container section text-center" style="padding-top: calc(var(--nav-height) + var(--space-4xl));">
          <h1 class="heading-xl">Checkout</h1>
          <p class="text-secondary" style="margin: var(--space-md) 0 var(--space-xl);">Your cart is empty. Cannot proceed to checkout.</p>
          <a href="#/projects" class="btn btn-primary btn-lg">Browse Projects</a>
        </div>
      `;
      return;
    }

    const settings = store.get('settings') || {};
    const upiId = settings.upi_id || 'test@upi';

    container.innerHTML = `
      <div class="checkout-page container section">
        <h1 class="heading-xl reveal" style="margin-bottom: var(--space-2xl);">Checkout</h1>
        
        <div id="checkout-layout" class="checkout-layout">
          <!-- Left: Form -->
          <div class="checkout-main reveal delay-1">
            <form id="checkout-form" onsubmit="submitOrder(event)">
              
              <div class="checkout-section">
                <h2>Contact Information</h2>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Email Address *</label>
                    <input type="email" class="form-input" required placeholder="you@example.com">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Phone Number *</label>
                    <input type="tel" class="form-input" required placeholder="+91 9876543210">
                  </div>
                </div>
              </div>
              
              <div class="checkout-section">
                <h2>Shipping Address</h2>
                <div class="form-grid">
                  <div class="form-group full-width">
                    <label class="form-label">Full Name *</label>
                    <input type="text" class="form-input" required placeholder="John Doe">
                  </div>
                  <div class="form-group full-width">
                    <label class="form-label">Address Line 1 *</label>
                    <input type="text" class="form-input" required placeholder="House/Flat No., Street Name">
                  </div>
                  <div class="form-group full-width">
                    <label class="form-label">Address Line 2 (Optional)</label>
                    <input type="text" class="form-input" placeholder="Apartment, suite, unit, etc.">
                  </div>
                  <div class="form-group">
                    <label class="form-label">City *</label>
                    <input type="text" class="form-input" required placeholder="City Name">
                  </div>
                  <div class="form-group">
                    <label class="form-label">State/Province *</label>
                    <input type="text" class="form-input" required placeholder="State Name">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Postal / Zip Code *</label>
                    <input type="text" class="form-input" required placeholder="123456">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Country *</label>
                    <select class="form-input" required>
                      <option>India</option>
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Australia</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="checkout-section">
                <h2>Payment Method</h2>
                <div class="payment-methods">
                  <div id="pm-upi" class="payment-method selected" onclick="selectPaymentMethod('upi')">
                    <div class="pay-icon"><i data-lucide="smartphone"></i></div>
                    <div class="pay-name">UPI</div>
                  </div>
                  <div id="pm-card" class="payment-method" onclick="selectPaymentMethod('card')">
                    <div class="pay-icon"><i data-lucide="credit-card"></i></div>
                    <div class="pay-name">Credit/Debit Card</div>
                  </div>
                  <div id="pm-net" class="payment-method" onclick="selectPaymentMethod('net')">
                    <div class="pay-icon"><i data-lucide="monitor"></i></div>
                    <div class="pay-name">Net Banking</div>
                  </div>
                  <div id="pm-wallet" class="payment-method" onclick="selectPaymentMethod('wallet')">
                    <div class="pay-icon"><i data-lucide="wallet"></i></div>
                    <div class="pay-name">Wallets</div>
                  </div>
                </div>
                
                <div class="glass-card" style="margin-top: var(--space-md); padding: var(--space-md); border-radius: var(--radius-sm); text-align: center;">
                  <p class="text-sm text-secondary"><i data-lucide="lock" style="width: 14px; vertical-align: middle;"></i> Payments are secured and encrypted.</p>
                </div>
              </div>
              
              <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: var(--space-lg);">
                Place Order — ₹${new Intl.NumberFormat('en-IN').format(total)}
              </button>
            </form>
          </div>
          
          <!-- Right: Summary -->
          <div class="checkout-sidebar reveal delay-2">
            <div class="glass-card" style="padding: var(--space-xl); position: sticky; top: calc(var(--nav-height) + var(--space-xl));">
              <h3 class="heading-md" style="margin-bottom: var(--space-lg); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-sm);">Order Summary</h3>
              
              <div style="max-height: 300px; overflow-y: auto; margin-bottom: var(--space-lg); padding-right: var(--space-sm);">
                ${cart.map(item => `
                  <div class="flex-between" style="margin-bottom: var(--space-md);">
                    <div class="flex gap-sm">
                      <div class="cart-badge" style="position:relative; width:24px; height:24px; top:0; right:0;">${item.quantity || 1}</div>
                      <div class="text-sm" style="max-width: 180px;">${item.name}</div>
                    </div>
                    <div class="font-mono text-sm">₹${new Intl.NumberFormat('en-IN').format(item.price * (item.quantity || 1))}</div>
                  </div>
                `).join('')}
              </div>
              
              <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-md);">
                <div class="flex-between" style="margin-bottom: var(--space-sm);">
                  <span class="text-secondary">Subtotal</span>
                  <span class="font-mono">₹${new Intl.NumberFormat('en-IN').format(total)}</span>
                </div>
                <div class="flex-between" style="margin-bottom: var(--space-sm);">
                  <span class="text-secondary">Shipping</span>
                  <span class="text-green">Free</span>
                </div>
                <div class="flex-between" style="margin-top: var(--space-md); padding-top: var(--space-md); border-top: 2px solid var(--border-default);">
                  <span class="text-lg font-bold text-heading">Total</span>
                  <span class="text-xl font-bold font-mono text-accent">₹${new Intl.NumberFormat('en-IN').format(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Success Screen -->
        <div id="order-success" style="display: none;">
          <div class="order-confirmation glass-card">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(0, 230, 118, 0.1); border: 2px solid var(--accent-green); display: flex; align-items: center; justify-content: center; font-size: 40px; color: var(--accent-green); margin: 0 auto var(--space-lg);">
              <i data-lucide="check" style="width: 40px; height: 40px;"></i>
            </div>
            
            <h2 class="heading-xl" style="margin-bottom: var(--space-sm);">Order Placed Successfully!</h2>
            <p class="text-secondary text-lg">Thank you for your purchase.</p>
            
            <div class="order-id">
              Order ID: <strong id="success-order-id"></strong>
            </div>
            
            <p class="text-secondary" style="max-width: 500px; margin: 0 auto var(--space-xl);">
              We've sent an order confirmation email with details and tracking information. 
              You can check the status of your order in your dashboard.
            </p>
            
            <div class="flex-center gap-md">
              <a href="#/dashboard" class="btn btn-secondary">Go to Dashboard</a>
              <a href="#" id="track-order-btn" class="btn btn-primary">Track Order</a>
            </div>
          </div>
        </div>
        
        <!-- UPI QR Code Modal / Step -->
        <div id="upi-qr-modal" style="display: none;">
          <div class="order-confirmation glass-card text-center" style="max-width: 500px; padding: var(--space-2xl);">
            <h2 class="heading-lg" style="margin-bottom: var(--space-sm);">Scan and Pay</h2>
            <p class="text-secondary" style="margin-bottom: var(--space-xl);">
              Please scan the QR code below using PhonePe, GPay, or any UPI app to complete your payment of 
              <strong class="text-accent text-lg">₹${new Intl.NumberFormat('en-IN').format(total)}</strong>
            </p>
            
            <div style="background: white; padding: var(--space-md); border-radius: var(--radius-md); display: inline-block; margin-bottom: var(--space-xl);">
              <!-- Dynamic QR Code using settings UPI ID -->
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=CircuitKart&am=${total}&cu=INR`)}" 
                   alt="UPI QR Code" style="width: 250px; height: 250px; display: block;">
            </div>
            
            <div style="margin-bottom: var(--space-xl);">
              <p class="text-secondary text-sm" style="margin-bottom: var(--space-xs);">Or pay directly to UPI ID:</p>
              <div style="display: flex; align-items: center; justify-content: center; gap: var(--space-sm); background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: var(--space-sm) var(--space-md);">
                <span style="font-family: var(--font-mono); font-weight: bold; font-size: var(--fs-lg); color: var(--text-heading);">${upiId}</span>
                <button onclick="navigator.clipboard.writeText('${upiId}').then(()=>this.textContent='✓ Copied!').catch(()=>{})" 
                        style="background: var(--accent-cyan); color: #000; border: none; border-radius: var(--radius-sm); padding: 4px 10px; font-size: var(--fs-xs); cursor: pointer; font-weight: 600;">Copy</button>
              </div>
            </div>
            
            <div class="form-group" style="text-align: left; margin-bottom: var(--space-xl);">
              <label class="form-label">UPI Reference / UTR Number *</label>
              <input type="text" id="upi-ref" class="form-input" placeholder="e.g. 31234567890" required>
              <p class="text-xs text-tertiary" style="margin-top: var(--space-xs);">Please enter the 12-digit transaction ID after paying.</p>
            </div>
            
            <div class="flex gap-sm">
              <button class="btn btn-secondary flex-1" onclick="document.getElementById('upi-qr-modal').style.display='none'; document.getElementById('checkout-layout').style.display='grid';">Back</button>
              <button class="btn btn-primary flex-1" onclick="if(document.getElementById('upi-ref').value) finalizeOrder(window.pendingOrderData); else alert('Please enter UTR number');">I Have Paid</button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  render();
}
