/* ====================================================================
   HALAMAN BELANJA PRODUK — search, filter kategori, filter merek,
   filter harga, sort
   ====================================================================
   File ini KHUSUS products.html (tidak dipakai index.html). Logic
   keranjang/checkout tetap di js/cart.js -- di sini cuma nentuin
   produk mana yang ditampilkan, lalu manggil window.dopRenderCatalog()
   (fungsi yang sama dipakai di cart.js) supaya kartu & tombolnya
   tetap konsisten dan tidak duplikasi kode.

   CATATAN: pilihan "Kategori" dan "Merek" di halaman ini dibuat
   OTOMATIS dari data produk di js/products.js (field "category" dan
   "brand") -- BUKAN ditulis manual di HTML. Jadi kalau nanti nambah
   produk dengan kategori/merek baru, pilihan filternya otomatis
   nambah sendiri, gak perlu edit products.html sama sekali.
   ==================================================================== */
(function () {
  "use strict";

  function buildDynamicFilters() {
    if (typeof PRODUCTS === "undefined") return;

    var categories = [];
    var brands = [];
    PRODUCTS.forEach(function (p) {
      if (p.category && categories.indexOf(p.category) === -1) categories.push(p.category);
      if (p.brand && brands.indexOf(p.brand) === -1) brands.push(p.brand);
    });
    categories.sort(function (a, b) { return a.localeCompare(b); });
    brands.sort(function (a, b) { return a.localeCompare(b); });

    var categoryPills = document.getElementById("categoryPills");
    if (categoryPills) {
      categories.forEach(function (cat) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "filter-pill";
        btn.setAttribute("data-category", cat);
        btn.textContent = cat;
        categoryPills.appendChild(btn);
      });
    }

    var brandSelect = document.getElementById("brandSelect");
    if (brandSelect) {
      brands.forEach(function (brand) {
        var opt = document.createElement("option");
        opt.value = brand;
        opt.textContent = brand;
        brandSelect.appendChild(opt);
      });
    }
  }

  var state = {
    search: "",
    category: "all",
    brand: "all",
    priceMin: 0,
    priceMax: 999999999,
    sort: "default"
  };

  function applyFilters() {
    var q = state.search;
    var list = PRODUCTS.filter(function (p) {
      var matchSearch = !q ||
        p.name.toLowerCase().indexOf(q) !== -1 ||
        p.brand.toLowerCase().indexOf(q) !== -1 ||
        p.specLine.toLowerCase().indexOf(q) !== -1 ||
        p.ports.toLowerCase().indexOf(q) !== -1;
      var matchCategory = state.category === "all" || p.category === state.category;
      var matchBrand = state.brand === "all" || p.brand === state.brand;
      var matchPrice = p.price >= state.priceMin && p.price <= state.priceMax;
      return matchSearch && matchCategory && matchBrand && matchPrice;
    });

    if (state.sort === "price-asc") {
      list = list.slice().sort(function (a, b) { return a.price - b.price; });
    } else if (state.sort === "price-desc") {
      list = list.slice().sort(function (a, b) { return b.price - a.price; });
    } else if (state.sort === "name-asc") {
      list = list.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    }

    return list;
  }

  function hasActiveFilter() {
    return !!state.search || state.category !== "all" || state.brand !== "all" ||
      state.priceMin !== 0 || state.priceMax !== 999999999 ||
      state.sort !== "default";
  }

  function render() {
    var list = applyFilters();

    if (typeof window.dopRenderCatalog === "function") {
      window.dopRenderCatalog(list);
    }

    var countEl = document.getElementById("filterResultCount");
    if (countEl) {
      countEl.textContent = "Menampilkan " + list.length + " dari " + PRODUCTS.length + " produk";
    }

    var grid = document.getElementById("shopGrid");
    var emptyState = document.getElementById("filterEmptyState");
    if (grid && emptyState) {
      var isEmpty = list.length === 0;
      grid.style.display = isEmpty ? "none" : "";
      emptyState.hidden = !isEmpty;
    }

    var resetBtn = document.getElementById("filterResetBtn");
    if (resetBtn) resetBtn.hidden = !hasActiveFilter();
  }

  function resetFilters() {
    state.search = "";
    state.category = "all";
    state.brand = "all";
    state.priceMin = 0;
    state.priceMax = 999999999;
    state.sort = "default";

    var searchInput = document.getElementById("productSearch");
    if (searchInput) searchInput.value = "";
    var searchClear = document.getElementById("productSearchClear");
    if (searchClear) searchClear.hidden = true;

    var categoryPills = document.getElementById("categoryPills");
    if (categoryPills) {
      categoryPills.querySelectorAll(".filter-pill").forEach(function (b) {
        b.classList.toggle("is-active", b.dataset.category === "all");
      });
    }
    var brandSelect = document.getElementById("brandSelect");
    if (brandSelect) brandSelect.value = "all";

    var pricePills = document.getElementById("pricePills");
    if (pricePills) {
      pricePills.querySelectorAll(".filter-pill").forEach(function (b) {
        b.classList.toggle("is-active", b.dataset.min === "0" && b.dataset.max === "999999999");
      });
    }
    var sortSelect = document.getElementById("productSort");
    if (sortSelect) sortSelect.value = "default";

    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof PRODUCTS === "undefined") return;

    buildDynamicFilters();
    render();

    var searchInput = document.getElementById("productSearch");
    var searchClear = document.getElementById("productSearchClear");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.search = searchInput.value.trim().toLowerCase();
        if (searchClear) searchClear.hidden = !state.search;
        render();
      });
    }
    if (searchClear) {
      searchClear.addEventListener("click", function () {
        if (searchInput) searchInput.value = "";
        state.search = "";
        searchClear.hidden = true;
        render();
        if (searchInput) searchInput.focus();
      });
    }

    var categoryPills = document.getElementById("categoryPills");
    if (categoryPills) {
      categoryPills.addEventListener("click", function (e) {
        var btn = e.target.closest(".filter-pill");
        if (!btn) return;
        state.category = btn.dataset.category;
        categoryPills.querySelectorAll(".filter-pill").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        render();
      });
    }

    var brandSelect = document.getElementById("brandSelect");
    if (brandSelect) {
      brandSelect.addEventListener("change", function () {
        state.brand = brandSelect.value;
        render();
      });
    }

    var pricePills = document.getElementById("pricePills");
    if (pricePills) {
      pricePills.addEventListener("click", function (e) {
        var btn = e.target.closest(".filter-pill");
        if (!btn) return;
        state.priceMin = parseInt(btn.dataset.min, 10);
        state.priceMax = parseInt(btn.dataset.max, 10);
        pricePills.querySelectorAll(".filter-pill").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        render();
      });
    }

    var sortSelect = document.getElementById("productSort");
    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        state.sort = sortSelect.value;
        render();
      });
    }

    var resetBtn = document.getElementById("filterResetBtn");
    if (resetBtn) resetBtn.addEventListener("click", resetFilters);
    var emptyResetBtn = document.getElementById("filterEmptyResetBtn");
    if (emptyResetBtn) emptyResetBtn.addEventListener("click", resetFilters);
  });
})();
