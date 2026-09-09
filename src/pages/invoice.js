// ============================================================
// CircuitKart — Invoice Page
// ============================================================

import { store } from '../store.js';

const API = import.meta.env.VITE_API_URL || '';

export async function InvoicePage(container, params = {}) {

    // ==========================================================
    // ORDER ID
    // ==========================================================

    const orderId =
        params.id ||
        params.orderId ||
        '';

    const token =
        localStorage.getItem('ck_token') ||
        localStorage.getItem('ck_admin_token');


    // ==========================================================
    // HELPERS
    // ==========================================================

    const money = (value) => {
        return `₹${Number(value || 0).toLocaleString(
            'en-IN',
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )}`;
    };


    const escapeHTML = (value) => {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    };


    const formatDate = (value) => {

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


    // ==========================================================
    // VALIDATE ORDER ID
    // ==========================================================

    if (!orderId) {

        container.innerHTML = `
      <div
        class="container section text-center"
        style="
          min-height:70vh;
          padding-top:
            calc(var(--nav-height) + 5rem);
        "
      >

        <div
          style="
            font-size:64px;
            margin-bottom:20px;
          "
        >
          📄
        </div>

        <h1
          class="heading-lg"
          style="
            margin-bottom:10px;
          "
        >
          Invoice Not Found
        </h1>

        <p
          class="text-secondary"
          style="
            margin-bottom:25px;
          "
        >
          No order was selected.
        </p>

        <a
          href="#/dashboard"
          class="btn btn-primary"
        >
          ← Back to Orders
        </a>

      </div>
    `;

        if (window.lucide) {
            window.lucide.createIcons();
        }

        return;
    }


    // ==========================================================
    // LOADING
    // ==========================================================

    container.innerHTML = `
    <div
      class="container section text-center"
      style="
        min-height:70vh;
        padding-top:
          calc(var(--nav-height) + 5rem);
      "
    >

      <div
        class="auth-spinner"
        style="
          display:inline-block;
          width:42px;
          height:42px;
          border-radius:50%;
          border:3px solid rgba(255,255,255,.12);
          border-top-color:var(--primary);
          animation:spin 1s linear infinite;
        "
      ></div>

      <p
        class="text-secondary"
        style="
          margin-top:18px;
        "
      >
        Loading invoice...
      </p>

    </div>
  `;


    // ==========================================================
    // FIND ORDER FROM STORE FIRST
    // ==========================================================

    let orders = [];

    try {
        orders = store.get('orders') || [];
    } catch (error) {
        console.warn(
            'Unable to read orders from store:',
            error
        );
    }


    let order =
        orders.find(
            item =>
                String(item.id) ===
                String(orderId)
        ) || null;


    // ==========================================================
    // FALLBACK TO API
    // ==========================================================

    // The store should normally contain the order.
    // We only call the API if it isn't already available.

    if (!order && token) {

        try {

            const response =
                await fetch(
                    `${API}/api/orders/${encodeURIComponent(orderId)}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            if (response.ok) {

                order =
                    await response.json();

            }

        } catch (error) {

            console.warn(
                'Invoice API fallback failed:',
                error
            );

        }

    }


    // ==========================================================
    // ORDER NOT FOUND
    // ==========================================================

    if (!order) {

        container.innerHTML = `
      <div
        class="container section text-center"
        style="
          min-height:70vh;
          padding-top:
            calc(var(--nav-height) + 5rem);
        "
      >

        <div
          style="
            font-size:64px;
            margin-bottom:20px;
          "
        >
          📄
        </div>

        <h1
          class="heading-lg"
          style="
            margin-bottom:10px;
          "
        >
          Invoice Not Found
        </h1>

        <p
          class="text-secondary"
          style="
            max-width:500px;
            margin:
              0 auto 25px;
          "
        >
          We couldn't find order
          <strong>
            ${escapeHTML(orderId)}
          </strong>
          in your account.
        </p>

        <a
          href="#/dashboard"
          class="btn btn-primary"
        >
          ← Back to Orders
        </a>

      </div>
    `;

        if (window.lucide) {
            window.lucide.createIcons();
        }

        return;
    }


    // ==========================================================
    // ORDER DATA
    // ==========================================================

    const items =
        Array.isArray(order.items)
            ? order.items
            : [];


    const contact =
        order.contactInfo ||
        order.customer ||
        {};


    const shipping =
        order.shippingInfo ||
        {};


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


    const shippingAddress = [
        shipping.address1,
        shipping.address2,
        shipping.address,
        shipping.city,
        shipping.state,
        shipping.pincode,
        shipping.zip,
        shipping.postalCode,
        shipping.country
    ]
        .filter(Boolean)
        .filter(
            (value, index, array) =>
                array.indexOf(value) === index
        )
        .join(', ');


    const address =
        shippingAddress ||
        'Shipping address not available';


    // ==========================================================
    // TOTALS
    // ==========================================================

    let calculatedSubtotal = 0;


    items.forEach(item => {

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


    const calculatedTotal =
        subtotal -
        discount +
        gst +
        shippingCharge;


    const total =
        Number(
            order.total ??
            order.grandTotal ??
            order.amount ??
            calculatedTotal
        );


    // ==========================================================
    // PAYMENT
    // ==========================================================

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


    const transactionId =
        order.transactionId ||
        order.transaction_id ||
        '';


    // ==========================================================
    // INVOICE NUMBER
    // ==========================================================

    const invoiceNumber =
        `CK-INV-${String(orderId)
            .replace(
                /[^a-zA-Z0-9]/g,
                ''
            )
            .slice(-12)
            .toUpperCase()
        }`;


    // ==========================================================
    // PAGE
    // ==========================================================

    container.innerHTML = `

    <div
      class="invoice-page"
      style="
        min-height:100vh;
        background:#08090e;
        padding:
          calc(var(--nav-height) + 28px)
          16px
          60px;
      "
    >

      <div
        style="
          max-width:980px;
          margin:0 auto;
        "
      >


        <!-- ==================================================
             ACTION BAR
        =================================================== -->

        <div
          class="invoice-actions"
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:12px;
            flex-wrap:wrap;
            margin-bottom:20px;
          "
        >

          <a
            href="#/dashboard"
            class="btn btn-ghost btn-sm"
            style="
              display:inline-flex;
              align-items:center;
              gap:7px;
              text-decoration:none;
            "
          >
            ← Back to Orders
          </a>


          <div
            style="
              display:flex;
              gap:9px;
              flex-wrap:wrap;
            "
          >

            <button
              id="invoice-print"
              class="btn btn-secondary btn-sm"
              type="button"
            >
              <i
                data-lucide="printer"
                style="width:15px;"
              ></i>
              Print
            </button>


            <button
              id="invoice-download"
              class="btn btn-primary btn-sm"
              type="button"
            >
              <i
                data-lucide="download"
                style="width:15px;"
              ></i>
              Download PDF
            </button>

          </div>

        </div>


        <!-- ==================================================
             INVOICE DOCUMENT
        =================================================== -->

        <div
          id="invoice-document"
          style="
            background:#ffffff;
            color:#111827;
            border-radius:18px;
            overflow:hidden;
            box-shadow:
              0 25px 70px
              rgba(0,0,0,.45);
          "
        >


          <!-- HEADER -->

          <div
            style="
              padding:30px 34px;
              display:flex;
              justify-content:space-between;
              align-items:flex-start;
              gap:20px;
              border-bottom:
                1px solid #e5e7eb;
            "
          >

            <div
              style="
                display:flex;
                align-items:center;
                gap:14px;
              "
            >

              <div
                style="
                  width:72px;
                  height:72px;
                  border-radius:14px;
                  background:#050505;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  overflow:hidden;
                  flex-shrink:0;
                "
              >

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
                    this.parentElement.innerHTML =
                      '<span style=&quot;color:white;font-size:34px;font-weight:900;&quot;>T</span>';
                  "
                >

              </div>


              <div>

                <h1
                  style="
                    margin:0;
                    font-size:27px;
                    font-weight:900;
                    letter-spacing:-.7px;
                  "
                >
                  CircuitKart
                </h1>

                <p
                  style="
                    margin:
                      4px 0 0;
                    color:#6b7280;
                    font-size:13px;
                  "
                >
                  IoT Projects & Electronics
                </p>

              </div>

            </div>


            <div
              style="
                text-align:right;
              "
            >

              <div
                style="
                  font-size:27px;
                  font-weight:900;
                  letter-spacing:-1px;
                "
              >
                TAX INVOICE
              </div>


              <div
                id="invoice-payment-status"
                style="
                  display:inline-flex;
                  margin-top:8px;
                  padding:
                    5px 12px;
                  border-radius:999px;
                  font-size:11px;
                  font-weight:800;
                  background:#dcfce7;
                  color:#166534;
                "
              >
                PAID
              </div>

            </div>

          </div>


          <!-- META -->

          <div
            style="
              padding:24px 34px;
              display:grid;
              grid-template-columns:
                repeat(
                  2,
                  minmax(0,1fr)
                );
              gap:18px;
              border-bottom:
                1px solid #e5e7eb;
            "
          >

            <div>

              <div
                style="
                  font-size:10px;
                  text-transform:uppercase;
                  letter-spacing:.08em;
                  color:#9ca3af;
                  font-weight:800;
                  margin-bottom:6px;
                "
              >
                Invoice Number
              </div>

              <strong
                id="invoice-number"
              >
                ${escapeHTML(invoiceNumber)}
              </strong>

            </div>


            <div>

              <div
                style="
                  font-size:10px;
                  text-transform:uppercase;
                  letter-spacing:.08em;
                  color:#9ca3af;
                  font-weight:800;
                  margin-bottom:6px;
                "
              >
                Order ID
              </div>

              <strong
                id="invoice-order-id"
                style="
                  font-family:monospace;
                "
              >
                ${escapeHTML(orderId)}
              </strong>

            </div>


            <div>

              <div
                style="
                  font-size:10px;
                  text-transform:uppercase;
                  letter-spacing:.08em;
                  color:#9ca3af;
                  font-weight:800;
                  margin-bottom:6px;
                "
              >
                Invoice Date
              </div>

              <strong
                id="invoice-date"
              >
                ${escapeHTML(
        formatDate(
            order.date ||
            order.created_at ||
            order.createdAt
        )
    )}
              </strong>

            </div>


            <div>

              <div
                style="
                  font-size:10px;
                  text-transform:uppercase;
                  letter-spacing:.08em;
                  color:#9ca3af;
                  font-weight:800;
                  margin-bottom:6px;
                "
              >
                Payment Method
              </div>

              <strong
                id="invoice-payment-method"
              >
                ${escapeHTML(
        String(
            paymentMethod
        )
            .replaceAll(
                '_',
                ' '
            )
    )}
              </strong>

            </div>

          </div>


          <!-- CUSTOMER -->

          <div
            style="
              padding:26px 34px;
              display:grid;
              grid-template-columns:
                1fr 1fr;
              gap:28px;
              border-bottom:
                1px solid #e5e7eb;
            "
          >

            <div>

              <h3
                style="
                  margin:
                    0 0 10px;
                  font-size:11px;
                  text-transform:uppercase;
                  letter-spacing:.08em;
                  color:#6b7280;
                "
              >
                Bill To
              </h3>

              <div
                style="
                  line-height:1.7;
                  font-size:14px;
                "
              >

                <strong>
                  ${escapeHTML(
        customerName
    )}
                </strong>

                ${customerEmail
            ? `
                      <br>
                      ${escapeHTML(
                customerEmail
            )}
                    `
            : ''
        }

                ${customerPhone
            ? `
                      <br>
                      ${escapeHTML(
                customerPhone
            )}
                    `
            : ''
        }

              </div>

            </div>


            <div>

              <h3
                style="
                  margin:
                    0 0 10px;
                  font-size:11px;
                  text-transform:uppercase;
                  letter-spacing:.08em;
                  color:#6b7280;
                "
              >
                Ship To
              </h3>

              <div
                style="
                  line-height:1.7;
                  font-size:14px;
                "
              >

                <strong>
                  ${escapeHTML(
            customerName
        )}
                </strong>

                <br>

                ${escapeHTML(
            address
        )}

              </div>

            </div>

          </div>


          <!-- ITEMS -->

          <div
            style="
              padding:26px 34px;
            "
          >

            <h3
              style="
                margin:
                  0 0 14px;
                font-size:16px;
                font-weight:900;
              "
            >
              Order Items
            </h3>


            <div
              style="
                overflow-x:auto;
              "
            >

              <table
                style="
                  width:100%;
                  border-collapse:collapse;
                  min-width:600px;
                "
              >

                <thead>

                  <tr
                    style="
                      background:#f8fafc;
                    "
                  >

                    <th
                      style="
                        text-align:left;
                        padding:13px;
                        font-size:10px;
                        text-transform:uppercase;
                        color:#6b7280;
                        border-bottom:
                          1px solid #e5e7eb;
                      "
                    >
                      Product
                    </th>

                    <th
                      style="
                        text-align:center;
                        padding:13px;
                        font-size:10px;
                        text-transform:uppercase;
                        color:#6b7280;
                        border-bottom:
                          1px solid #e5e7eb;
                      "
                    >
                      Qty
                    </th>

                    <th
                      style="
                        text-align:right;
                        padding:13px;
                        font-size:10px;
                        text-transform:uppercase;
                        color:#6b7280;
                        border-bottom:
                          1px solid #e5e7eb;
                      "
                    >
                      Price
                    </th>

                    <th
                      style="
                        text-align:right;
                        padding:13px;
                        font-size:10px;
                        text-transform:uppercase;
                        color:#6b7280;
                        border-bottom:
                          1px solid #e5e7eb;
                      "
                    >
                      Total
                    </th>

                  </tr>

                </thead>


                <tbody>

                  ${items.length
            ? items.map(
                item => {

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
                        quantity *
                        price;

                    const name =
                        item.name ||
                        item.title ||
                        item.productName ||
                        'Product';


                    return `

                              <tr>

                                <td
                                  style="
                                    padding:
                                      15px 13px;
                                    border-bottom:
                                      1px solid #e5e7eb;
                                  "
                                >

                                  <strong>
                                    ${escapeHTML(
                        name
                    )}
                                  </strong>

                                </td>


                                <td
                                  style="
                                    padding:
                                      15px 13px;
                                    text-align:center;
                                    border-bottom:
                                      1px solid #e5e7eb;
                                  "
                                >
                                  ${quantity}
                                </td>


                                <td
                                  style="
                                    padding:
                                      15px 13px;
                                    text-align:right;
                                    border-bottom:
                                      1px solid #e5e7eb;
                                  "
                                >
                                  ${money(price)}
                                </td>


                                <td
                                  style="
                                    padding:
                                      15px 13px;
                                    text-align:right;
                                    border-bottom:
                                      1px solid #e5e7eb;
                                    font-weight:800;
                                  "
                                >
                                  ${money(lineTotal)}
                                </td>

                              </tr>

                            `;

                }
            ).join('')
            : `
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
                      `
        }

                </tbody>

              </table>

            </div>

          </div>


          <!-- TOTALS -->

          <div
            style="
              padding:
                0 34px 30px;
              display:flex;
              justify-content:flex-end;
            "
          >

            <div
              style="
                width:
                  min(
                    390px,
                    100%
                  );
              "
            >

              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  padding:8px 0;
                  color:#6b7280;
                  font-size:14px;
                "
              >

                <span>
                  Subtotal
                </span>

                <strong
                  id="invoice-subtotal"
                  style="color:#111827;"
                >
                  ${money(subtotal)}
                </strong>

              </div>


              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  padding:8px 0;
                  color:#6b7280;
                  font-size:14px;
                "
              >

                <span>
                  Discount
                </span>

                <strong
                  id="invoice-discount"
                  style="color:#16a34a;"
                >
                  - ${money(discount)}
                </strong>

              </div>


              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  padding:8px 0;
                  color:#6b7280;
                  font-size:14px;
                "
              >

                <span>
                  GST
                </span>

                <strong
                  id="invoice-gst"
                  style="color:#111827;"
                >
                  ${money(gst)}
                </strong>

              </div>


              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  padding:8px 0;
                  color:#6b7280;
                  font-size:14px;
                "
              >

                <span>
                  Shipping
                </span>

                <strong
                  id="invoice-shipping-charge"
                  style="color:#111827;"
                >
                  ${money(
            shippingCharge
        )}
                </strong>

              </div>


              <div
                style="
                  margin-top:10px;
                  padding-top:15px;
                  border-top:
                    2px solid #111827;
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                "
              >

                <span
                  style="
                    font-size:17px;
                    font-weight:900;
                  "
                >
                  Grand Total
                </span>

                <strong
                  id="invoice-total"
                  style="
                    font-size:22px;
                    font-weight:900;
                  "
                >
                  ${money(total)}
                </strong>

              </div>

            </div>

          </div>


          <!-- PAYMENT INFORMATION -->

          <div
            style="
              margin:
                0 34px 28px;
              padding:18px;
              border-radius:12px;
              background:#f8fafc;
              border:
                1px solid #e5e7eb;
            "
          >

            <div
              style="
                display:flex;
                align-items:center;
                gap:10px;
                margin-bottom:8px;
              "
            >

              <div
                style="
                  width:32px;
                  height:32px;
                  border-radius:8px;
                  background:#dcfce7;
                  color:#166534;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-weight:900;
                "
              >
                ✓
              </div>

              <strong>
                Payment Information
              </strong>

            </div>


            <div
              style="
                color:#6b7280;
                font-size:13px;
                line-height:1.8;
              "
            >

              Payment Method:
              <strong
                style="color:#111827;"
              >
                ${escapeHTML(
            paymentMethod
        )}
              </strong>

              <br>

              Payment Status:
              <strong
                style="color:#111827;"
              >
                ${escapeHTML(
            paymentStatus
        )}
              </strong>

              ${transactionId
            ? `
                    <br>
                    Transaction ID:
                    <strong
                      style="
                        color:#111827;
                        font-family:monospace;
                      "
                    >
                      ${escapeHTML(
                transactionId
            )}
                    </strong>
                  `
            : ''
        }

            </div>

          </div>


          <!-- FOOTER -->

          <div
            style="
              padding:
                25px 34px;
              background:#111827;
              color:#fff;
              display:flex;
              justify-content:space-between;
              gap:20px;
              flex-wrap:wrap;
            "
          >

            <div>

              <strong>
                Thank you for shopping
                with CircuitKart!
              </strong>

              <p
                style="
                  margin:
                    6px 0 0;
                  color:#9ca3af;
                  font-size:12px;
                "
              >
                IoT Projects • Electronics •
                Components
              </p>

            </div>


            <div
              style="
                text-align:right;
                color:#9ca3af;
                font-size:12px;
                line-height:1.6;
              "
            >
              CircuitKart
              <br>
              Digital Invoice
            </div>

          </div>

        </div>

      </div>

    </div>


    <style>

      @keyframes spin {
        from {
          transform:rotate(0deg);
        }

        to {
          transform:rotate(360deg);
        }
      }


      @media print {

        body {
          background:#fff !important;
        }

        #navbar,
        #footer,
        .invoice-actions {
          display:none !important;
        }

        .invoice-page {
          padding:0 !important;
          background:#fff !important;
        }

        #invoice-document {
          box-shadow:none !important;
          border-radius:0 !important;
        }

      }


      @media (max-width:700px) {

        #invoice-document > div:first-child {
          flex-direction:column !important;
        }

        #invoice-document > div:nth-child(2) {
          grid-template-columns:1fr !important;
        }

        #invoice-document > div:nth-child(3) {
          grid-template-columns:1fr !important;
        }

      }

    </style>
  `;


    // ==========================================================
    // PAYMENT BADGE
    // ==========================================================

    const statusElement =
        document.getElementById(
            'invoice-payment-status'
        );


    if (
        paymentStatus === 'paid' ||
        paymentStatus === 'success' ||
        paymentStatus === 'completed'
    ) {

        statusElement.textContent =
            'PAID';

        statusElement.style.background =
            '#dcfce7';

        statusElement.style.color =
            '#166534';

    } else if (
        paymentStatus === 'failed'
    ) {

        statusElement.textContent =
            'PAYMENT FAILED';

        statusElement.style.background =
            '#fee2e2';

        statusElement.style.color =
            '#991b1b';

    } else {

        statusElement.textContent =
            'PAYMENT PENDING';

        statusElement.style.background =
            '#fef3c7';

        statusElement.style.color =
            '#92400e';

    }


    // ==========================================================
    // PRINT BUTTON
    // ==========================================================

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
              ${escapeHTML(
                    invoiceNumber
                )}
            </title>

            <meta
              name="viewport"
              content="
                width=device-width,
                initial-scale=1
              "
            >

            <style>

              * {
                box-sizing:border-box;
              }

              body {
                margin:0;
                background:#fff;
                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
              }

              @page {
                size:A4;
                margin:10mm;
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


    // ==========================================================
    // DOWNLOAD PDF
    // ==========================================================

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


                if (!button) {
                    return;
                }


                const originalHTML =
                    button.innerHTML;


                button.disabled = true;

                button.innerHTML = `
          <i
            data-lucide="loader"
            style="
              width:15px;
              animation:
                spin 1s linear infinite;
            "
          ></i>
          Preparing...
        `;


                if (window.lucide) {
                    window.lucide.createIcons();
                }


                try {

                    // Load html2pdf only when needed

                    if (!window.html2pdf) {

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
                                        resolve,
                                        {
                                            once: true
                                        }
                                    );

                                    existing.addEventListener(
                                        'error',
                                        reject,
                                        {
                                            once: true
                                        }
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


                    if (!window.html2pdf) {
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
                                quality: .98
                            },

                            html2canvas: {
                                scale: 2,
                                useCORS: true,
                                backgroundColor: '#ffffff'
                            },

                            jsPDF: {
                                unit: 'mm',
                                format: 'a4',
                                orientation: 'portrait'
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
                        'Invoice PDF error:',
                        error
                    );


                    alert(
                        'PDF download failed. Use Print → Save as PDF.'
                    );


                } finally {

                    button.disabled = false;

                    button.innerHTML =
                        originalHTML;


                    if (window.lucide) {
                        window.lucide.createIcons();
                    }

                }

            }
        );


    // ==========================================================
    // LUCIDE ICONS
    // ==========================================================

    if (window.lucide) {
        window.lucide.createIcons();
    }

}


export default InvoicePage;