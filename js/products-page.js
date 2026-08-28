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

    [document.getElementById("categoryPills"), document.getElementById("categoryPillsCompact")].forEach(function (categoryPills) {
      if (!categoryPills) return;
      categories.forEach(function (cat) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "filter-pill";
        btn.setAttribute("data-category", cat);
        btn.textContent = cat;
        categoryPills.appendChild(btn);
      });
    });

    [document.getElementById("brandSelect"), document.getElementById("brandSelectCompact")].forEach(function (brandSelect) {
      if (!brandSelect) return;
      brands.forEach(function (brand) {
        var opt = document.createElement("option");
        opt.value = brand;
        opt.textContent = brand;
        brandSelect.appendChild(opt);
      });
    });
  }

  /* tinggi header (logo+ticker) dipakai sebagai jarak "nempel" buat bar
     search+filter ringkas, dihitung dari elemen asli -- bukan angka
     tebakan -- supaya tetap pas walau kontennya berubah */
  function setHeaderHeightVar() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
  }

  /* helper sinkron dua arah: bar search+filter lengkap (atas) dan bar
     ringkas (nempel pas scroll) baca/tulis STATE yang sama, fungsi di
     bawah ini yang jaga tampilan keduanya tetap kompak */
  function syncCategoryPillsUI(activeCategory) {
    [document.getElementById("categoryPills"), document.getElementById("categoryPillsCompact")].forEach(function (group) {
      if (!group) return;
      group.querySelectorAll(".filter-pill").forEach(function (b) {
        b.classList.toggle("is-active", b.dataset.category === activeCategory);
      });
    });
  }
  function syncPricePillsUI(min, max) {
    [document.getElementById("pricePills"), document.getElementById("pricePillsCompact")].forEach(function (group) {
      if (!group) return;
      group.querySelectorAll(".filter-pill").forEach(function (b) {
        b.classList.toggle("is-active", parseInt(b.dataset.min, 10) === min && parseInt(b.dataset.max, 10) === max);
      });
    });
  }
  function syncBrandSelectUI(value) {
    [document.getElementById("brandSelect"), document.getElementById("brandSelectCompact")].forEach(function (sel) {
      if (sel) sel.value = value;
    });
  }
  function syncSearchUI(value) {
    [document.getElementById("productSearch"), document.getElementById("productSearchCompact")].forEach(function (input) {
      if (input && input.value !== value) input.value = value;
    });
    var clearBtn = document.getElementById("productSearchClear");
    if (clearBtn) clearBtn.hidden = !value;
  }
  function updateFilterBadge() {
    var count = 0;
    if (state.category !== "all") count++;
    if (state.brand !== "all") count++;
    if (state.priceMin !== 0 || state.priceMax !== 999999999999) count++;
    var badge = document.getElementById("filterBadge");
    if (badge) {
      badge.hidden = count === 0;
      badge.textContent = count;
    }
  }

  var state = {
    search: "",
    category: "all",
    brand: "all",
    priceMin: 0,
    priceMax: 999999999999,
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
      // produk tanpa harga pasti (price: null, tampil "Hubungi kami") selalu
      // lolos filter rentang harga -- gak ada angka buat dibandingkan
      var matchPrice = typeof p.price !== "number" ||
        (p.price >= state.priceMin && p.price <= state.priceMax);
      return matchSearch && matchCategory && matchBrand && matchPrice;
    });

    // urutan produk tanpa harga saat sort by harga: selalu taruh di akhir
    if (state.sort === "price-asc") {
      list = list.slice().sort(function (a, b) {
        if (typeof a.price !== "number") return 1;
        if (typeof b.price !== "number") return -1;
        return a.price - b.price;
      });
    } else if (state.sort === "price-desc") {
      list = list.slice().sort(function (a, b) {
        if (typeof a.price !== "number") return 1;
        if (typeof b.price !== "number") return -1;
        return b.price - a.price;
      });
    } else if (state.sort === "name-asc") {
      list = list.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    }

    return list;
  }

  function hasActiveFilter() {
    return !!state.search || state.category !== "all" || state.brand !== "all" ||
      state.priceMin !== 0 || state.priceMax !== 999999999999 ||
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

    updateFilterBadge();
  }

  function resetFilters() {
    state.search = "";
    state.category = "all";
    state.brand = "all";
    state.priceMin = 0;
    state.priceMax = 999999999999;
    state.sort = "default";

    syncSearchUI("");
    syncCategoryPillsUI("all");
    syncPricePillsUI(0, 999999999999);
    syncBrandSelectUI("all");

    var sortSelect = document.getElementById("productSort");
    if (sortSelect) sortSelect.value = "default";

    closeFilterPanel();
    render();
  }

  function closeFilterPanel() {
    var panel = document.getElementById("filterPanel");
    var toggleBtn = document.getElementById("filterToggleBtn");
    var wasOpen = panel && !panel.hidden;
    if (panel) panel.hidden = true;
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
    if (wasOpen) scrollToGridTop();
  }

  /* pengunjung yang lagi scroll di tengah katalog terus aktifin filter
     dari bar ringkas jangan sampai bingung -- begitu filter diterapkan
     (panel ditutup, atau berhenti ngetik di search ringkas), halaman
     otomatis digeser ke bagian paling atas dari hasil filter, pas di
     bawah header + bar ringkas -- gak perlu scroll manual ke atas lagi */
  function scrollToGridTop() {
    var grid = document.getElementById("shopGrid");
    if (!grid) return;
    var compactBar = document.getElementById("compactFilterBar");
    var headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) || 0;
    var barH = compactBar ? compactBar.getBoundingClientRect().height : 0;
    var targetY = grid.getBoundingClientRect().top + window.pageYOffset - headerH - barH - 8;
    window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
  }

  var scrollDebounceTimer = null;
  function scrollToGridTopDebounced() {
    clearTimeout(scrollDebounceTimer);
    scrollDebounceTimer = setTimeout(scrollToGridTop, 450);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof PRODUCTS === "undefined") return;

    buildDynamicFilters();
    render();
    setHeaderHeightVar();
    window.addEventListener("resize", setHeaderHeightVar);
    window.addEventListener("load", setHeaderHeightVar);

    var searchInput = document.getElementById("productSearch");
    var searchClear = document.getElementById("productSearchClear");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.search = searchInput.value.trim().toLowerCase();
        syncSearchUI(searchInput.value);
        render();
      });
    }
    if (searchClear) {
      searchClear.addEventListener("click", function () {
        state.search = "";
        syncSearchUI("");
        render();
        if (searchInput) searchInput.focus();
      });
    }

    var searchInputCompact = document.getElementById("productSearchCompact");
    if (searchInputCompact) {
      searchInputCompact.addEventListener("input", function () {
        state.search = searchInputCompact.value.trim().toLowerCase();
        syncSearchUI(searchInputCompact.value);
        render();
        scrollToGridTopDebounced();
      });
    }

    var categoryPills = document.getElementById("categoryPills");
    if (categoryPills) {
      categoryPills.addEventListener("click", function (e) {
        var btn = e.target.closest(".filter-pill");
        if (!btn) return;
        state.category = btn.dataset.category;
        syncCategoryPillsUI(state.category);
        render();
      });
    }

    var categoryPillsCompact = document.getElementById("categoryPillsCompact");
    if (categoryPillsCompact) {
      categoryPillsCompact.addEventListener("click", function (e) {
        var btn = e.target.closest(".filter-pill");
        if (!btn) return;
        state.category = btn.dataset.category;
        syncCategoryPillsUI(state.category);
        render();
      });
    }

    var brandSelect = document.getElementById("brandSelect");
    if (brandSelect) {
      brandSelect.addEventListener("change", function () {
        state.brand = brandSelect.value;
        syncBrandSelectUI(state.brand);
        render();
      });
    }

    var brandSelectCompact = document.getElementById("brandSelectCompact");
    if (brandSelectCompact) {
      brandSelectCompact.addEventListener("change", function () {
        state.brand = brandSelectCompact.value;
        syncBrandSelectUI(state.brand);
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
        syncPricePillsUI(state.priceMin, state.priceMax);
        render();
      });
    }

    var pricePillsCompact = document.getElementById("pricePillsCompact");
    if (pricePillsCompact) {
      pricePillsCompact.addEventListener("click", function (e) {
        var btn = e.target.closest(".filter-pill");
        if (!btn) return;
        state.priceMin = parseInt(btn.dataset.min, 10);
        state.priceMax = parseInt(btn.dataset.max, 10);
        syncPricePillsUI(state.priceMin, state.priceMax);
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

    var filterToggleBtn = document.getElementById("filterToggleBtn");
    var filterPanel = document.getElementById("filterPanel");
    if (filterToggleBtn && filterPanel) {
      filterToggleBtn.addEventListener("click", function () {
        var isOpen = !filterPanel.hidden;
        if (isOpen) {
          closeFilterPanel();
        } else {
          filterPanel.hidden = false;
          filterToggleBtn.setAttribute("aria-expanded", "true");
        }
      });
    }
    var filterApplyBtn = document.getElementById("filterApplyBtn");
    if (filterApplyBtn) filterApplyBtn.addEventListener("click", closeFilterPanel);
  });
})();
