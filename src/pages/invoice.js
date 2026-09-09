// src/pages/invoice.js

const API = import.meta.env.VITE_API_URL || '';

export async function InvoicePage(container, params = {}) {
    const orderId =
        params.id ||
        params.orderId ||
        new URLSearchParams(window.location.hash.split('?')[1] || '').get('id');

    const token =
        localStorage.getItem('ck_token') ||
        localStorage.getItem('ck_admin_token');

    if (!token) {
        container.innerHTML = `
      <div style="
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#09090f;
        color:#fff;
        padding:2rem;
      ">
        <div style="text-align:center;">
          <div style="font-size:3rem;margin-bottom:1rem;">🔒</div>
          <h2>Sign In Required</h2>
          <p style="color:#9ca3af;margin:1rem 0 2rem;">
            Please sign in to view your invoice.
          </p>
          <a
            href="#/login"
            style="
              display:inline-flex;
              padding:12px 22px;
              border-radius:10px;
              background:#00d4ff;
              color:#000;
              text-decoration:none;
              font-weight:700;
            "
          >
            Sign In
          </a>
        </div>
      </div>
    `;

        return;
    }

    if (!orderId) {
        container.innerHTML = `
      <div style="
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#09090f;
        color:#fff;
        padding:2rem;
      ">
        <div style="text-align:center;">
          <div style="font-size:3rem;margin-bottom:1rem;">📄</div>
          <h2>Invoice Not Found</h2>
          <p style="color:#9ca3af;margin:1rem 0 2rem;">
            No order ID was provided.
          </p>
          <a
            href="#/dashboard"
            style="
              display:inline-flex;
              padding:12px 22px;
              border-radius:10px;
              background:#00d4ff;
              color:#000;
              text-decoration:none;
              font-weight:700;
            "
          >
            Back to Orders
          </a>
        </div>
      </div>
    `;

        return;
    }

    container.innerHTML = `
    <div style="
      min-height:100vh;
      background:#08080d;
      color:#f8fafc;
      padding:30px 16px 60px;
      font-family:Inter,Arial,sans-serif;
    ">

      <div style="
        max-width:950px;
        margin:0 auto;
      ">

        <!-- ACTION BAR -->
        <div
          class="invoice-actions"
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:12px;
            flex-wrap:wrap;
            margin-bottom:22px;
          "
        >

          <a
            href="#/dashboard"
            style="
              display:inline-flex;
              align-items:center;
              gap:8px;
              padding:11px 16px;
              border:1px solid rgba(255,255,255,.12);
              border-radius:10px;
              color:#cbd5e1;
              text-decoration:none;
              background:rgba(255,255,255,.04);
              font-size:14px;
              font-weight:600;
            "
          >
            <span>←</span>
            Back to Orders
          </a>

          <div style="
            display:flex;
            gap:10px;
            flex-wrap:wrap;
          ">

            <button
              id="invoice-print"
              style="
                border:1px solid rgba(255,255,255,.12);
                background:rgba(255,255,255,.05);
                color:#fff;
                padding:11px 16px;
                border-radius:10px;
                cursor:pointer;
                font-weight:600;
              "
            >
              🖨 Print
            </button>

            <button
              id="invoice-download"
              style="
                border:none;
                background:#00d4ff;
                color:#000;
                padding:11px 18px;
                border-radius:10px;
                cursor:pointer;
                font-weight:800;
              "
            >
              ↓ Download PDF
            </button>

          </div>

        </div>


        <!-- INVOICE -->
        <div
          id="invoice-document"
          style="
            background:#ffffff;
            color:#111827;
            border-radius:18px;
            overflow:hidden;
            box-shadow:0 25px 70px rgba(0,0,0,.45);
          "
        >

          <!-- HEADER -->
          <div style="
            padding:30px 34px;
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:20px;
            border-bottom:1px solid #e5e7eb;
          ">

            <div style="
              display:flex;
              align-items:center;
              gap:14px;
            ">

              <div style="
                width:68px;
                height:68px;
                border-radius:14px;
                overflow:hidden;
                background:#050505;
                display:flex;
                align-items:center;
                justify-content:center;
              ">
                <img
                  src="/logo.png"
                  alt="CircuitKart"
                  style="
                    width:100%;
                    height:100%;
                    object-fit:contain;
                  "
                  onerror="
                    this.style.display='none';
                    this.parentElement.innerHTML='<span style=&quot;color:white;font-size:30px;font-weight:900;&quot;>T</span>';
                  "
                />
              </div>

              <div>
                <h1 style="
                  margin:0;
                  font-size:25px;
                  font-weight:900;
                  letter-spacing:-.5px;
                ">
                  CircuitKart
                </h1>

                <p style="
                  margin:4px 0 0;
                  color:#6b7280;
                  font-size:13px;
                ">
                  IoT Projects & Electronics
                </p>
              </div>

            </div>

            <div style="
              text-align:right;
            ">

              <div style="
                font-size:28px;
                font-weight:900;
                letter-spacing:-1px;
              ">
                TAX INVOICE
              </div>

              <div
                id="invoice-payment-status"
                style="
                  display:inline-flex;
                  margin-top:8px;
                  padding:5px 12px;
                  border-radius:999px;
                  background:#dcfce7;
                  color:#166534;
                  font-size:12px;
                  font-weight:800;
                "
              >
                PAID
              </div>

            </div>

          </div>


          <!-- META -->
          <div style="
            padding:24px 34px;
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:18px;
            border-bottom:1px solid #e5e7eb;
          ">

            <div>

              <div style="
                font-size:11px;
                text-transform:uppercase;
                letter-spacing:.08em;
                color:#9ca3af;
                font-weight:800;
                margin-bottom:6px;
              ">
                Invoice Number
              </div>

              <div
                id="invoice-number"
                style="
                  font-size:14px;
                  font-weight:800;
                "
              >
                Loading...
              </div>

            </div>

            <div>

              <div style="
                font-size:11px;
                text-transform:uppercase;
                letter-spacing:.08em;
                color:#9ca3af;
                font-weight:800;
                margin-bottom:6px;
              ">
                Order ID
              </div>

              <div
                id="invoice-order-id"
                style="
                  font-size:14px;
                  font-weight:800;
                  font-family:monospace;
                "
              >
                Loading...
              </div>

            </div>

            <div>

              <div style="
                font-size:11px;
                text-transform:uppercase;
                letter-spacing:.08em;
                color:#9ca3af;
                font-weight:800;
                margin-bottom:6px;
              ">
                Invoice Date
              </div>

              <div
                id="invoice-date"
                style="
                  font-size:14px;
                  font-weight:700;
                "
              >
                Loading...
              </div>

            </div>

            <div>

              <div style="
                font-size:11px;
                text-transform:uppercase;
                letter-spacing:.08em;
                color:#9ca3af;
                font-weight:800;
                margin-bottom:6px;
              ">
                Payment Method
              </div>

              <div
                id="invoice-payment-method"
                style="
                  font-size:14px;
                  font-weight:700;
                "
              >
                Loading...
              </div>

            </div>

          </div>


          <!-- CUSTOMER -->
          <div style="
            padding:26px 34px;
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:28px;
            border-bottom:1px solid #e5e7eb;
          ">

            <div>

              <h3 style="
                margin:0 0 10px;
                font-size:12px;
                text-transform:uppercase;
                letter-spacing:.08em;
                color:#6b7280;
              ">
                Bill To
              </h3>

              <div
                id="invoice-customer"
                style="
                  line-height:1.7;
                  font-size:14px;
                "
              >
                Loading...
              </div>

            </div>

            <div>

              <h3 style="
                margin:0 0 10px;
                font-size:12px;
                text-transform:uppercase;
                letter-spacing:.08em;
                color:#6b7280;
              ">
                Ship To
              </h3>

              <div
                id="invoice-shipping"
                style="
                  line-height:1.7;
                  font-size:14px;
                "
              >
                Loading...
              </div>

            </div>

          </div>


          <!-- ITEMS -->
          <div style="
            padding:26px 34px;
          ">

            <h3 style="
              margin:0 0 14px;
              font-size:16px;
              font-weight:900;
            ">
              Order Items
            </h3>

            <div style="
              overflow-x:auto;
            ">

              <table style="
                width:100%;
                border-collapse:collapse;
                min-width:600px;
              ">

                <thead>

                  <tr style="
                    background:#f8fafc;
                  ">

                    <th style="
                      text-align:left;
                      padding:13px;
                      font-size:11px;
                      text-transform:uppercase;
                      color:#6b7280;
                      border-bottom:1px solid #e5e7eb;
                    ">
                      Product
                    </th>

                    <th style="
                      text-align:center;
                      padding:13px;
                      font-size:11px;
                      text-transform:uppercase;
                      color:#6b7280;
                      border-bottom:1px solid #e5e7eb;
                    ">
                      Qty
                    </th>

                    <th style="
                      text-align:right;
                      padding:13px;
                      font-size:11px;
                      text-transform:uppercase;
                      color:#6b7280;
                      border-bottom:1px solid #e5e7eb;
                    ">
                      Price
                    </th>

                    <th style="
                      text-align:right;
                      padding:13px;
                      font-size:11px;
                      text-transform:uppercase;
                      color:#6b7280;
                      border-bottom:1px solid #e5e7eb;
                    ">
                      Total
                    </th>

                  </tr>

                </thead>

                <tbody id="invoice-items">

                  <tr>
                    <td
                      colspan="4"
                      style="
                        padding:25px;
                        text-align:center;
                        color:#6b7280;
                      "
                    >
                      Loading order items...
                    </td>
                  </tr>

                </tbody>

              </table>

            </div>

          </div>


          <!-- TOTAL -->
          <div style="
            padding:0 34px 30px;
            display:flex;
            justify-content:flex-end;
          ">

            <div style="
              width:min(390px,100%);
            ">

              <div style="
                display:flex;
                justify-content:space-between;
                padding:9px 0;
                color:#6b7280;
                font-size:14px;
              ">
                <span>Subtotal</span>
                <strong
                  id="invoice-subtotal"
                  style="color:#111827;"
                >
                  ₹0
                </strong>
              </div>

              <div style="
                display:flex;
                justify-content:space-between;
                padding:9px 0;
                color:#6b7280;
                font-size:14px;
              ">
                <span>Discount</span>
                <strong
                  id="invoice-discount"
                  style="color:#16a34a;"
                >
                  - ₹0
                </strong>
              </div>

              <div style="
                display:flex;
                justify-content:space-between;
                padding:9px 0;
                color:#6b7280;
                font-size:14px;
              ">
                <span>GST</span>
                <strong
                  id="invoice-gst"
                  style="color:#111827;"
                >
                  ₹0
                </strong>
              </div>

              <div style="
                display:flex;
                justify-content:space-between;
                padding:9px 0;
                color:#6b7280;
                font-size:14px;
              ">
                <span>Shipping</span>
                <strong
                  id="invoice-shipping-charge"
                  style="color:#111827;"
                >
                  ₹0
                </strong>
              </div>

              <div style="
                margin-top:10px;
                padding-top:15px;
                border-top:2px solid #111827;
                display:flex;
                justify-content:space-between;
                align-items:center;
              ">

                <span style="
                  font-size:17px;
                  font-weight:900;
                ">
                  Grand Total
                </span>

                <strong
                  id="invoice-total"
                  style="
                    font-size:22px;
                    font-weight:900;
                  "
                >
                  ₹0
                </strong>

              </div>

            </div>

          </div>


          <!-- PAYMENT -->
          <div style="
            margin:0 34px 28px;
            padding:18px;
            border-radius:12px;
            background:#f8fafc;
            border:1px solid #e5e7eb;
          ">

            <div style="
              display:flex;
              align-items:center;
              gap:10px;
              margin-bottom:8px;
            ">

              <div style="
                width:32px;
                height:32px;
                border-radius:8px;
                background:#dcfce7;
                display:flex;
                align-items:center;
                justify-content:center;
              ">
                ✓
              </div>

              <strong>
                Payment Information
              </strong>

            </div>

            <div
              id="invoice-payment-info"
              style="
                color:#6b7280;
                font-size:13px;
                line-height:1.7;
              "
            >
              Payment details loading...
            </div>

          </div>


          <!-- FOOTER -->
          <div style="
            padding:25px 34px;
            background:#111827;
            color:#fff;
            display:flex;
            justify-content:space-between;
            gap:20px;
            flex-wrap:wrap;
          ">

            <div>

              <strong style="
                font-size:15px;
              ">
                Thank you for shopping with CircuitKart!
              </strong>

              <p style="
                margin:6px 0 0;
                color:#9ca3af;
                font-size:12px;
              ">
                IoT Projects • Electronics • Components
              </p>

            </div>

            <div style="
              text-align:right;
              color:#9ca3af;
              font-size:12px;
              line-height:1.6;
            ">
              CircuitKart<br>
              Digital Invoice
            </div>

          </div>

        </div>

      </div>

    </div>
  `;


    // -----------------------------
    // HELPERS
    // -----------------------------

    const money = value => {
        return `₹${Number(value || 0).toLocaleString(
            'en-IN',
            {
                maximumFractionDigits: 2
            }
        )}`;
    };

    const escapeHTML = value => {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    };

    const formatDate = value => {
        if (!value) {
            return new Date().toLocaleDateString(
                'en-IN',
                {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }
            );
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString(
            'en-IN',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }
        );
    };


    // -----------------------------
    // FETCH ORDER
    // -----------------------------

    let order;

    try {

        const response = await fetch(
            `${API}/api/orders/${encodeURIComponent(orderId)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Unable to load order (${response.status})`
            );
        }

        order = await response.json();

    } catch (error) {

        console.error(
            'Invoice order error:',
            error
        );

        container.innerHTML = `
      <div style="
        min-height:100vh;
        background:#09090f;
        color:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:2rem;
        text-align:center;
      ">

        <div>

          <div style="
            font-size:4rem;
            margin-bottom:1rem;
          ">
            📄
          </div>

          <h2>
            Unable to Load Invoice
          </h2>

          <p style="
            color:#9ca3af;
            margin:10px 0 25px;
          ">
            ${escapeHTML(error.message)}
          </p>

          <a
            href="#/dashboard"
            style="
              display:inline-flex;
              padding:12px 20px;
              border-radius:10px;
              background:#00d4ff;
              color:#000;
              text-decoration:none;
              font-weight:800;
            "
          >
            Back to Orders
          </a>

        </div>

      </div>
    `;

        return;
    }


    // -----------------------------
    // ORDER DATA
    // -----------------------------

    const contact =
        order.contactInfo ||
        order.customer ||
        {};

    const shipping =
        order.shippingInfo ||
        {};

    const items =
        order.items ||
        order.products ||
        order.cart ||
        [];

    const customerName =
        contact.name ||
        contact.fullName ||
        order.customerName ||
        'Customer';

    const customerEmail =
        contact.email ||
        order.email ||
        '';

    const customerPhone =
        contact.phone ||
        order.phone ||
        '';

    const addressParts = [
        shipping.address1,
        shipping.address2,
        shipping.address,
        shipping.city,
        shipping.state,
        shipping.zip ||
        shipping.pincode ||
        shipping.postalCode,
        shipping.country
    ].filter(Boolean);

    const address =
        addressParts.length
            ? addressParts.join(', ')
            : 'Shipping address not available';


    // -----------------------------
    // CALCULATE TOTALS
    // -----------------------------

    let calculatedSubtotal = 0;

    const normalizedItems =
        Array.isArray(items)
            ? items
            : [];

    normalizedItems.forEach(item => {

        const quantity =
            Number(
                item.quantity ??
                item.qty ??
                1
            );

        const price =
            Number(
                item.price ??
                item.unitPrice ??
                item.amount ??
                0
            );

        calculatedSubtotal +=
            price * quantity;
    });


    const subtotal =
        Number(
            order.subtotal ??
            calculatedSubtotal
        );

    const discount =
        Number(
            order.discount ??
            order.discountAmount ??
            0
        );

    const gst =
        Number(
            order.gst ??
            order.tax ??
            order.taxAmount ??
            0
        );

    const shippingCharge =
        Number(
            order.shippingCharge ??
            order.shipping ??
            order.deliveryCharge ??
            0
        );

    const total =
        Number(
            order.total ??
            order.grandTotal ??
            order.amount ??
            subtotal -
            discount +
            gst +
            shippingCharge
        );


    // -----------------------------
    // PAYMENT
    // -----------------------------

    const paymentStatus =
        String(
            order.paymentStatus ||
            order.payment_status ||
            (
                order.paymentConfirmed
                    ? 'paid'
                    : 'pending'
            )
        ).toLowerCase();

    const paymentMethod =
        order.paymentMethod ||
        order.payment_method ||
        order.method ||
        'Online Payment';


    // -----------------------------
    // POPULATE
    // -----------------------------

    const invoiceNumber =
        `CK-INV-${String(orderId)
            .replace(/[^a-zA-Z0-9]/g, '')
            .slice(-12)
            .toUpperCase()}`;


    document.getElementById(
        'invoice-number'
    ).textContent =
        invoiceNumber;

    document.getElementById(
        'invoice-order-id'
    ).textContent =
        orderId;

    document.getElementById(
        'invoice-date'
    ).textContent =
        formatDate(
            order.date ||
            order.created_at ||
            order.createdAt
        );

    document.getElementById(
        'invoice-payment-method'
    ).textContent =
        String(paymentMethod)
            .replaceAll('_', ' ')
            .replace(
                /\b\w/g,
                char => char.toUpperCase()
            );


    // Customer

    document.getElementById(
        'invoice-customer'
    ).innerHTML = `
    <strong>
      ${escapeHTML(customerName)}
    </strong>

    ${customerEmail
            ? `<br>${escapeHTML(customerEmail)}`
            : ''
        }

    ${customerPhone
            ? `<br>${escapeHTML(customerPhone)}`
            : ''
        }
  `;


    // Shipping

    document.getElementById(
        'invoice-shipping'
    ).innerHTML = `
    <strong>
      ${escapeHTML(customerName)}
    </strong>

    <br>
    ${escapeHTML(address)}
  `;


    // Payment badge

    const paymentBadge =
        document.getElementById(
            'invoice-payment-status'
        );

    if (
        paymentStatus === 'paid' ||
        paymentStatus === 'success' ||
        paymentStatus === 'completed'
    ) {

        paymentBadge.textContent =
            'PAID';

        paymentBadge.style.background =
            '#dcfce7';

        paymentBadge.style.color =
            '#166534';

    } else if (
        paymentStatus === 'failed'
    ) {

        paymentBadge.textContent =
            'PAYMENT FAILED';

        paymentBadge.style.background =
            '#fee2e2';

        paymentBadge.style.color =
            '#991b1b';

    } else {

        paymentBadge.textContent =
            'PAYMENT PENDING';

        paymentBadge.style.background =
            '#fef3c7';

        paymentBadge.style.color =
            '#92400e';
    }


    // Items

    const itemsContainer =
        document.getElementById(
            'invoice-items'
        );

    if (!normalizedItems.length) {

        itemsContainer.innerHTML = `
      <tr>
        <td
          colspan="4"
          style="
            padding:25px;
            text-align:center;
            color:#6b7280;
          "
        >
          No item details available.
        </td>
      </tr>
    `;

    } else {

        itemsContainer.innerHTML =
            normalizedItems
                .map(item => {

                    const name =
                        item.name ||
                        item.title ||
                        item.productName ||
                        'Product';

                    const quantity =
                        Number(
                            item.quantity ??
                            item.qty ??
                            1
                        );

                    const price =
                        Number(
                            item.price ??
                            item.unitPrice ??
                            item.amount ??
                            0
                        );

                    const lineTotal =
                        price * quantity;

                    return `
            <tr>

              <td style="
                padding:15px 13px;
                border-bottom:1px solid #e5e7eb;
              ">

                <strong>
                  ${escapeHTML(name)}
                </strong>

                ${item.category
                            ? `
                      <div style="
                        color:#9ca3af;
                        font-size:11px;
                        margin-top:3px;
                      ">
                        ${escapeHTML(
                                item.category
                            )}
                      </div>
                    `
                            : ''
                        }

              </td>

              <td style="
                padding:15px 13px;
                text-align:center;
                border-bottom:1px solid #e5e7eb;
              ">
                ${quantity}
              </td>

              <td style="
                padding:15px 13px;
                text-align:right;
                border-bottom:1px solid #e5e7eb;
              ">
                ${money(price)}
              </td>

              <td style="
                padding:15px 13px;
                text-align:right;
                border-bottom:1px solid #e5e7eb;
                font-weight:800;
              ">
                ${money(lineTotal)}
              </td>

            </tr>
          `;

                })
                .join('');
    }


    // Totals

    document.getElementById(
        'invoice-subtotal'
    ).textContent =
        money(subtotal);

    document.getElementById(
        'invoice-discount'
    ).textContent =
        `- ${money(discount)}`;

    document.getElementById(
        'invoice-gst'
    ).textContent =
        money(gst);

    document.getElementById(
        'invoice-shipping-charge'
    ).textContent =
        money(shippingCharge);

    document.getElementById(
        'invoice-total'
    ).textContent =
        money(total);


    document.getElementById(
        'invoice-payment-info'
    ).innerHTML = `
    Payment Method:
    <strong style="color:#111827;">
      ${escapeHTML(
        String(paymentMethod)
            .replaceAll('_', ' ')
    )}
    </strong>
    <br>

    Payment Status:
    <strong style="color:#111827;">
      ${escapeHTML(
        paymentStatus
    )}
    </strong>

    ${order.transactionId ||
            order.transaction_id
            ? `
          <br>
          Transaction ID:
          <strong style="color:#111827;">
            ${escapeHTML(
                order.transactionId ||
                order.transaction_id
            )}
          </strong>
        `
            : ''
        }
  `;


    // -----------------------------
    // PRINT
    // -----------------------------

    document
        .getElementById(
            'invoice-print'
        )
        ?.addEventListener(
            'click',
            () => {

                const invoice =
                    document.getElementById(
                        'invoice-document'
                    );

                if (!invoice) {
                    return;
                }

                const printWindow =
                    window.open(
                        '',
                        '_blank',
                        'width=1000,height=800'
                    );

                if (!printWindow) {

                    alert(
                        'Please allow pop-ups to print the invoice.'
                    );

                    return;
                }

                printWindow.document.write(`
          <!DOCTYPE html>

          <html>

          <head>

            <title>
              ${invoiceNumber}
            </title>

            <meta
              name="viewport"
              content="width=device-width,initial-scale=1"
            />

            <style>

              * {
                box-sizing:border-box;
              }

              body {
                margin:0;
                background:white;
                font-family:Arial,sans-serif;
              }

              @page {
                size:A4;
                margin:12mm;
              }

              @media print {

                body {
                  print-color-adjust:exact;
                  -webkit-print-color-adjust:exact;
                }

              }

            </style>

          </head>

          <body>

            ${invoice.outerHTML}

          </body>

          </html>
        `);

                printWindow.document.close();

                setTimeout(
                    () => {

                        printWindow.focus();
                        printWindow.print();

                    },
                    500
                );
            }
        );


    // -----------------------------
    // DOWNLOAD PDF
    // -----------------------------

    document
        .getElementById(
            'invoice-download'
        )
        ?.addEventListener(
            'click',
            async () => {

                const button =
                    document.getElementById(
                        'invoice-download'
                    );

                const originalText =
                    button.innerHTML;

                button.disabled = true;

                button.innerHTML =
                    'Preparing PDF...';

                try {

                    if (
                        !window.html2pdf
                    ) {

                        await new Promise(
                            (
                                resolve,
                                reject
                            ) => {

                                const existing =
                                    document.querySelector(
                                        'script[data-html2pdf]'
                                    );

                                if (existing) {

                                    existing.addEventListener(
                                        'load',
                                        resolve
                                    );

                                    existing.addEventListener(
                                        'error',
                                        reject
                                    );

                                    return;
                                }

                                const script =
                                    document.createElement(
                                        'script'
                                    );

                                script.src =
                                    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';

                                script.dataset.html2pdf =
                                    'true';

                                script.onload =
                                    resolve;

                                script.onerror =
                                    reject;

                                document.head.appendChild(
                                    script
                                );
                            }
                        );

                    }


                    if (
                        !window.html2pdf
                    ) {
                        throw new Error(
                            'PDF library could not be loaded.'
                        );
                    }


                    const invoice =
                        document.getElementById(
                            'invoice-document'
                        );

                    await window.html2pdf()
                        .set({
                            margin: 8,

                            filename:
                                `${invoiceNumber}.pdf`,

                            image: {
                                type: 'jpeg',
                                quality: 0.98
                            },

                            html2canvas: {
                                scale: 2,
                                useCORS: true,
                                backgroundColor:
                                    '#ffffff'
                            },

                            jsPDF: {
                                unit: 'mm',
                                format: 'a4',
                                orientation:
                                    'portrait'
                            },

                            pagebreak: {
                                mode: [
                                    'css',
                                    'legacy'
                                ]
                            }

                        })
                        .from(invoice)
                        .save();


                } catch (error) {

                    console.error(
                        'PDF generation error:',
                        error
                    );

                    alert(
                        'Unable to generate PDF. Please try Print → Save as PDF.'
                    );

                } finally {

                    button.disabled = false;

                    button.innerHTML =
                        originalText;

                }

            }
        );
}


export default InvoicePage;