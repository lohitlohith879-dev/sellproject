import { store } from '../store.js';

export function CartPage(container) {
  
  // Handlers for cart actions
  window.updateCartItemQty = (index, delta) => {
    const item = store.get('cart')[index];
    if (item) {
      store.updateCartQuantity(index, (item.quantity || 1) + delta);
      render();
    }
  };

  window.removeCartItem = (index) => {
    store.removeFromCart(index);
    render();
  };
  
  function render() {
    const cart = store.get('cart');
    const total = store.getCartTotal();
    const count = store.getCartCount();
    
    // Check if any items in cart require a quote
    const requiresQuote = cart.some(item => item.isQuote);
    
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="cart-page container section text-center" style="padding-top: calc(var(--nav-height) + var(--space-4xl));">
          <div class="empty-cart reveal">
            <i data-lucide="shopping-cart" class="empty-icon"></i>
            <h2>Your Cart is Empty</h2>
            <p>Looks like you haven't added any projects to your cart yet.</p>
            <a href="#/projects" class="btn btn-primary btn-lg">Browse Projects</a>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="cart-page container section">
        <h1 class="heading-xl reveal" style="margin-bottom: var(--space-2xl);">Shopping Cart <span class="text-secondary text-lg">(${count} items)</span></h1>
        
        <div class="cart-layout">
          <!-- Cart Items -->
          <div class="cart-items-list reveal delay-1">
            ${cart.map((item, index) => `
              <div class="cart-item glass-card-static" style="margin-bottom: var(--space-md); padding: var(--space-md);">
                <div class="item-image">
                   <div style="width: 100%; height: 100%; background-color: ${item.imageColor || '#0f3460'}; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; position: relative;">
                     <span style="opacity: 0.1; font-size: 40px;">⚡</span>
                     ${item.image ? `<img src="${item.image}" alt="${item.name}" style="position:absolute; width:100%; height:100%; object-fit:cover; border-radius: var(--radius-md);" />` : ''}
                   </div>
                </div>
                <div class="item-info">
                  <div class="flex-between">
                    <h3 class="item-title">${item.name}</h3>
                    <div class="item-price">
                      ${item.isQuote ? '<span class="badge badge-orange">Quotation Req.</span>' : '₹' + new Intl.NumberFormat('en-IN').format(item.price * (item.quantity || 1))}
                    </div>
                  </div>
                  
                  <div class="item-customizations text-xs text-tertiary" style="margin: var(--space-sm) 0;">
                    ${item.customizations ? `
                      <ul style="display:flex; flex-wrap:wrap; gap:8px;">
                        ${item.customizations.controller ? `<li><strong>Controller:</strong> ${item.customizations.controller}</li>` : ''}
                        ${item.customizations.power ? `<li><strong>Power:</strong> ${item.customizations.power}</li>` : ''}
                        ${item.customizations.customRequirements ? `<li><strong>Custom Req:</strong> Yes</li>` : ''}
                      </ul>
                    ` : 'Ready-to-build kit'}
                  </div>
                  
                  <div class="flex-between item-actions">
                    <div class="quantity-control">
                      <button onclick="updateCartItemQty(${index}, -1)"><i data-lucide="minus" style="width:14px;"></i></button>
                      <div class="qty-value">${item.quantity || 1}</div>
                      <button onclick="updateCartItemQty(${index}, 1)"><i data-lucide="plus" style="width:14px;"></i></button>
                    </div>
                    <div class="flex gap-md">
                      <button class="btn btn-ghost btn-sm text-tertiary hover-text" onclick="alert('Saved for later!')">Save</button>
                      <button class="btn btn-ghost btn-sm text-red hover-text" onclick="removeCartItem(${index})"><i data-lucide="trash-2" style="width:16px;"></i></button>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <!-- Cart Summary -->
          <div class="cart-summary glass-card reveal delay-2">
            <h3>Order Summary</h3>
            
            <div class="summary-line">
              <span>Subtotal (${count} items)</span>
              <span class="value">₹${new Intl.NumberFormat('en-IN').format(total)}</span>
            </div>
            
            <div class="summary-line">
              <span>Estimated Shipping</span>
              <span class="value text-green">Free</span>
            </div>
            
            <div class="summary-line">
              <span>Taxes</span>
              <span class="value">Included</span>
            </div>
            
            <div class="cart-total">
              <span class="total-label">Total</span>
              <span class="total-value">
                ${requiresQuote ? '<span style="font-size:16px; color:var(--accent-orange);">Pending Quote</span>' : '₹' + new Intl.NumberFormat('en-IN').format(total)}
              </span>
            </div>
            
            ${requiresQuote ? `
              <div style="background: rgba(255, 145, 0, 0.1); border: 1px solid rgba(255, 145, 0, 0.3); border-radius: var(--radius-sm); padding: var(--space-md); margin-bottom: var(--space-lg);">
                <p class="text-xs" style="color: var(--accent-orange);"><i data-lucide="info" style="width:14px; vertical-align:middle;"></i> Your cart contains items that require a custom quotation. We will review your request and send a quote.</p>
              </div>
              <a href="#/checkout" class="btn btn-primary btn-lg" style="width: 100%;">Submit Quote Request</a>
            ` : `
              <a href="#/checkout" class="btn btn-primary btn-lg" style="width: 100%;">Proceed to Checkout</a>
            `}
            
            <div class="text-center text-xs text-tertiary" style="margin-top: var(--space-md);">
              <i data-lucide="lock" style="width:12px; vertical-align:middle;"></i> Secure SSL Checkout
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  // Initial render
  render();
}
