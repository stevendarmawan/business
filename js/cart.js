/* ====================================================================
   KERANJANG & CHECKOUT
   ====================================================================
   Alur: pilih produk -> keranjang (tersimpan di browser/localStorage,
   jadi gak hilang kalau tab ditutup) -> checkout isi data diri ->
   ringkasan order otomatis dibikin & dikirim ke WhatsApp toko sebagai
   pesan siap-kirim -> order juga disimpan di localStorage ("dop_orders")
   sebagai riwayat, terstruktur rapi (produk, qty, harga, customer,
   status) supaya gampang nanti disambungkan ke sistem order/invoice
   yang sebenarnya.

   Tidak ada bagian di sini yang menyentuh warna atau tampilan --
   murni logic. Tampilan diatur di css/style.css (cari komentar
   "KERANJANG & CHECKOUT" di sana).
   ==================================================================== */
(function () {
  "use strict";

  var CART_KEY = "dop_cart";
  var ORDERS_KEY = "dop_orders";

  function getCartMap() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCartMap(map) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(map));
    } catch (e) { /* localStorage tidak tersedia, abaikan */ }
  }

  function findProduct(id) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === id) return PRODUCTS[i];
    }
    return null;
  }

  function formatRupiah(n) {
    return "Rp " + Math.round(n).toLocaleString("id-ID");
  }

  function cartItems() {
    var map = getCartMap();
    var items = [];
    Object.keys(map).forEach(function (id) {
      var product = findProduct(id);
      var qty = map[id];
      if (product && qty > 0) {
        items.push({ product: product, qty: qty, subtotal: product.price * qty });
      }
    });
    return items;
  }

  function cartTotal() {
    return cartItems().reduce(function (sum, it) { return sum + it.subtotal; }, 0);
  }

  function cartCount() {
    var map = getCartMap();
    return Object.keys(map).reduce(function (sum, id) { return sum + (map[id] || 0); }, 0);
  }

  function addToCart(id, qty) {
    var map = getCartMap();
    map[id] = (map[id] || 0) + qty;
    if (map[id] < 1) map[id] = 1;
    saveCartMap(map);
    renderAll();
  }

  function setQty(id, qty) {
    var map = getCartMap();
    if (qty <= 0) {
      delete map[id];
    } else {
      map[id] = qty;
    }
    saveCartMap(map);
    renderAll();
  }

  function removeFromCart(id) {
    var map = getCartMap();
    delete map[id];
    saveCartMap(map);
    renderAll();
  }

  function clearCart() {
    saveCartMap({});
    renderAll();
  }

  /* ---------------- render: badge + drawer isi keranjang ---------------- */

  function renderBadge() {
    var badge = document.getElementById("cartBadge");
    if (!badge) return;
    var count = cartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }

  function renderCartDrawer() {
    var list = document.getElementById("cartList");
    var emptyMsg = document.getElementById("cartEmpty");
    var footer = document.getElementById("cartFooter");
    var totalEl = document.getElementById("cartTotal");
    if (!list) return;

    var items = cartItems();
    list.innerHTML = "";

    if (items.length === 0) {
      if (emptyMsg) emptyMsg.style.display = "block";
      if (footer) footer.style.display = "none";
      return;
    }
    if (emptyMsg) emptyMsg.style.display = "none";
    if (footer) footer.style.display = "block";

    items.forEach(function (it) {
      var row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML =
        '<div class="cart-row-icon">' + iconSvg(it.product.icon, 20) + '</div>' +
        '<div class="cart-row-info">' +
          '<h4>' + it.product.name + '</h4>' +
          '<span class="cart-row-price">' + formatRupiah(it.product.price) + ' / unit</span>' +
        '</div>' +
        '<div class="cart-row-qty">' +
          '<button type="button" class="cart-qty-btn" data-action="dec" data-id="' + it.product.id + '" aria-label="Kurangi jumlah">-</button>' +
          '<span>' + it.qty + '</span>' +
          '<button type="button" class="cart-qty-btn" data-action="inc" data-id="' + it.product.id + '" aria-label="Tambah jumlah">+</button>' +
        '</div>' +
        '<button type="button" class="cart-row-remove" data-action="remove" data-id="' + it.product.id + '" aria-label="Hapus dari keranjang">' + iconSvg("trash", 16) + '</button>';
      list.appendChild(row);
    });

    if (totalEl) totalEl.textContent = formatRupiah(cartTotal());
  }

  function renderAll() {
    renderBadge();
    renderCartDrawer();
  }

  /* ---------------- icon helper (dipakai kartu produk & keranjang) ---------------- */

  var ICON_PATHS = {
    projector: "M3 8a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2h1.5L21 6.5v11L17.5 16H16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8zm11 4a3 3 0 1 0-6 0 3 3 0 0 0 6 0zm-3-1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z",
    cart: "M2 3h2l.4 2M7 13h9l3-8H5.4M7 13 5.4 5M7 13l-1.6 3.2A1 1 0 0 0 6.3 17H17M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    trash: "M9 3h6a1 1 0 0 1 1 1v1h4v2H4V5h4V4a1 1 0 0 1 1-1zM6 8h12l-.9 11.1a2 2 0 0 1-2 1.9H8.9a2 2 0 0 1-2-1.9L6 8zm4 3v6h1.6v-6H10zm4.4 0v6H16v-6h-1.6z",
    plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z",
    close: "M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6L17.6 19l1.4-1.4L13.4 12 19 6.4 17.6 5 12 10.6z"
  };

  function iconSvg(name, size) {
    var d = ICON_PATHS[name] || ICON_PATHS.projector;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size +
      '" fill="currentColor" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
  }

  /* ---------------- render katalog produk dari PRODUCTS ---------------- */

  function renderCatalog() {
    var grid = document.getElementById("shopGrid");
    if (!grid || typeof PRODUCTS === "undefined") return;

    grid.innerHTML = PRODUCTS.map(function (p) {
      var priceNote = p.priceIsEstimate
        ? '<span class="shop-price-note">Estimasi &middot; final dikonfirmasi via WA</span>'
        : "";
      var thumb = p.image
        ? '<div class="shop-card-thumb-wrap"><img class="shop-card-thumb" src="' + p.image + '" alt="' + p.name + '" loading="lazy"></div>'
        : '<div class="shop-card-thumb-wrap shop-card-thumb-fallback">' + iconSvg(p.icon, 30) + '</div>';
      return (
        '<div class="shop-card reveal">' +
          '<div class="shop-card-top">' +
            thumb +
            '<div class="shop-card-body">' +
              '<span class="shop-card-brand">' + p.brand + '</span>' +
              '<h3>' + p.name + '</h3>' +
              '<p class="shop-card-spec">' + p.specLine + '</p>' +
              '<p class="shop-card-ports">' + p.ports + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="shop-card-pricing">' +
            '<div class="shop-card-price">' + formatRupiah(p.price) + '</div>' +
            priceNote +
          '</div>' +
          '<div class="shop-card-actions">' +
            '<div class="shop-qty">' +
              '<button type="button" class="shop-qty-btn" data-action="qty-dec" data-id="' + p.id + '" aria-label="Kurangi jumlah">-</button>' +
              '<span class="shop-qty-val" data-qty-for="' + p.id + '">1</span>' +
              '<button type="button" class="shop-qty-btn" data-action="qty-inc" data-id="' + p.id + '" aria-label="Tambah jumlah">+</button>' +
            '</div>' +
            '<button type="button" class="btn-add-cart" data-action="add" data-id="' + p.id + '">' +
              iconSvg("cart", 16) + '<span>Tambah</span>' +
            '</button>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    // kembalikan animasi "reveal" ke kartu yang baru dibuat lewat JS ini
    if (typeof window.dopObserveReveals === "function") {
      window.dopObserveReveals(grid.querySelectorAll(".reveal"));
    }
  }

  /* ---------------- keranjang: buka/tutup ---------------- */

  function openCart() {
    var drawer = document.getElementById("cartDrawer");
    if (!drawer) return;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    var drawer = document.getElementById("cartDrawer");
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  /* ---------------- checkout ---------------- */

  function openCheckout() {
    if (cartItems().length === 0) return;
    closeCart();
    var modal = document.getElementById("checkoutModal");
    if (!modal) return;
    renderCheckoutSummary();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeCheckout() {
    var modal = document.getElementById("checkoutModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function renderCheckoutSummary() {
    var el = document.getElementById("checkoutSummary");
    if (!el) return;
    var items = cartItems();
    el.innerHTML = items.map(function (it) {
      return '<div class="checkout-summary-row"><span>' + it.qty + '&times; ' + it.product.name +
        '</span><span>' + formatRupiah(it.subtotal) + '</span></div>';
    }).join("");
    var totalEl = document.getElementById("checkoutTotal");
    if (totalEl) totalEl.textContent = formatRupiah(cartTotal());
  }

  function saveOrder(order) {
    try {
      var raw = localStorage.getItem(ORDERS_KEY);
      var orders = raw ? JSON.parse(raw) : [];
      orders.push(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (e) { /* localStorage tidak tersedia, abaikan */ }
  }

  function buildWaMessage(order) {
    var lines = [];
    lines.push("Halo Agen Projektor Jakarta, saya mau order:");
    lines.push("");
    order.items.forEach(function (it) {
      lines.push("- " + it.name + " x" + it.qty + " = " + formatRupiah(it.subtotal));
    });
    lines.push("");
    lines.push("Total: " + formatRupiah(order.total));
    lines.push("");
    lines.push("Nama: " + order.customer.name);
    lines.push("No. WhatsApp: " + order.customer.phone);
    lines.push("Alamat: " + order.customer.address);
    if (order.customer.note) lines.push("Catatan: " + order.customer.note);
    lines.push("");
    lines.push("No. Order: " + order.id);
    return lines.join("\n");
  }

  function submitCheckout(formEl) {
    var name = formEl.querySelector("[name=name]").value.trim();
    var phone = formEl.querySelector("[name=phone]").value.trim();
    var address = formEl.querySelector("[name=address]").value.trim();
    var note = formEl.querySelector("[name=note]").value.trim();

    if (!name || !phone || !address) return false;

    var items = cartItems();
    if (items.length === 0) return false;

    var order = {
      id: "DOP-" + Date.now(),
      createdAt: new Date().toISOString(),
      items: items.map(function (it) {
        return { id: it.product.id, name: it.product.name, price: it.product.price, qty: it.qty, subtotal: it.subtotal };
      }),
      total: cartTotal(),
      customer: { name: name, phone: phone, address: address, note: note },
      status: "menunggu konfirmasi"
    };

    saveOrder(order);

    var waNumber = (typeof CONFIG !== "undefined" && CONFIG.waNumber) ? CONFIG.waNumber : "";
    var waHref = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(buildWaMessage(order));
    window.open(waHref, "_blank");

    clearCart();
    closeCheckout();
    showOrderConfirmation(order);
    return true;
  }

  function showOrderConfirmation(order) {
    var box = document.getElementById("orderConfirm");
    if (!box) return;
    var idEl = box.querySelector("[data-order-id]");
    if (idEl) idEl.textContent = order.id;
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeOrderConfirmation() {
    var box = document.getElementById("orderConfirm");
    if (!box) return;
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  /* ---------------- event wiring ---------------- */

  document.addEventListener("DOMContentLoaded", function () {
    renderCatalog();
    renderAll();

    // klik di dalam grid produk: ubah qty / tambah ke keranjang
    var shopGrid = document.getElementById("shopGrid");
    if (shopGrid) {
      shopGrid.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-action]");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        var qtyEl = shopGrid.querySelector('[data-qty-for="' + id + '"]');
        var action = btn.getAttribute("data-action");

        if (action === "qty-inc" && qtyEl) {
          qtyEl.textContent = String(parseInt(qtyEl.textContent, 10) + 1);
        } else if (action === "qty-dec" && qtyEl) {
          var next = parseInt(qtyEl.textContent, 10) - 1;
          qtyEl.textContent = String(next < 1 ? 1 : next);
        } else if (action === "add") {
          var qty = qtyEl ? parseInt(qtyEl.textContent, 10) : 1;
          addToCart(id, qty);
          openCart();
        }
      });
    }

    // klik di dalam keranjang: +/- qty / hapus item
    var cartList = document.getElementById("cartList");
    if (cartList) {
      cartList.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-action]");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        var map = getCartMap();
        var current = map[id] || 0;

        if (action === "inc") setQty(id, current + 1);
        else if (action === "dec") setQty(id, current - 1);
        else if (action === "remove") removeFromCart(id);
      });
    }

    var cartOpenBtn = document.getElementById("cartOpenBtn");
    if (cartOpenBtn) cartOpenBtn.addEventListener("click", openCart);

    var cartCloseBtn = document.getElementById("cartCloseBtn");
    if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCart);

    var cartOverlay = document.getElementById("cartDrawer");
    if (cartOverlay) {
      cartOverlay.addEventListener("click", function (e) {
        if (e.target === cartOverlay) closeCart();
      });
    }

    var checkoutBtn = document.getElementById("cartCheckoutBtn");
    if (checkoutBtn) checkoutBtn.addEventListener("click", openCheckout);

    var checkoutCloseBtn = document.getElementById("checkoutCloseBtn");
    if (checkoutCloseBtn) checkoutCloseBtn.addEventListener("click", closeCheckout);

    var checkoutOverlay = document.getElementById("checkoutModal");
    if (checkoutOverlay) {
      checkoutOverlay.addEventListener("click", function (e) {
        if (e.target === checkoutOverlay) closeCheckout();
      });
    }

    var checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", function (e) {
        e.preventDefault();
        submitCheckout(checkoutForm);
      });
    }

    var orderConfirmClose = document.getElementById("orderConfirmClose");
    if (orderConfirmClose) orderConfirmClose.addEventListener("click", closeOrderConfirmation);

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      closeCart();
      closeCheckout();
      closeOrderConfirmation();
    });
  });
})();
