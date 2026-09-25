/* ====================================================================
   GANTI DI SINI — Satu tempat untuk semua data kontak.
   Ubah nilai di bawah ini, otomatis update ke SEMUA tombol di halaman.
   ==================================================================== */
const CONFIG = {
  // Nomor WhatsApp format internasional TANPA tanda + dan TANPA angka 0 di depan.
  // Contoh: nomor 0878-8800-8143 ditulis jadi 6287888008143
  waNumber: "6287888008143",

  // Pesan yang otomatis muncul saat pengunjung klik tombol WhatsApp
  waMessage: "Halo Agen Projektor Jakarta, saya mau tanya harga.",

  // Link Instagram
  igUrl: "https://instagram.com/agenprojektorjakarta",

  // Alamat lengkap (dipakai juga untuk bikin link Google Maps)
  address: "Harco Mangga Dua Plaza Blok A2 Lantai 2 No 69, Jakarta",

  // Domain utama situs, TANPA garis miring di akhir. Dipakai buat bikin
  // link share produk yang lengkap (mis. tombol "Bagikan" di kartu produk).
  siteUrl: "https://stevendarmawan.com"
};
/* ==================================================================== */

(function(){
  const waHref = "https://wa.me/" + CONFIG.waNumber + "?text=" + encodeURIComponent(CONFIG.waMessage);
  document.querySelectorAll(".js-wa-link").forEach(function(el){ el.href = waHref; });

  document.querySelectorAll(".js-ig-link").forEach(function(el){ el.href = CONFIG.igUrl; });

  const mapsHref = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CONFIG.address);
  document.querySelectorAll(".js-maps-link").forEach(function(el){ el.href = mapsHref; });

  // Animasi muncul halus saat elemen kelihatan di layar.
  // Dibikin jadi fungsi yang bisa dipanggil ulang (window.dopObserveReveals)
  // supaya kartu produk yang dibuat belakangan oleh js/cart.js ikut kebagian
  // animasi yang sama, tanpa duplikasi logic.
  var revealObserver = null;
  if ("IntersectionObserver" in window){
    revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
  }
  function observeReveals(nodeList){
    if (revealObserver){
      nodeList.forEach(function(el){ revealObserver.observe(el); });
    } else {
      nodeList.forEach(function(el){ el.classList.add("is-visible"); });
    }
  }
  window.dopObserveReveals = observeReveals;
  observeReveals(document.querySelectorAll(".reveal"));

  // Lightbox untuk sertifikat (ketuk kartu -> gambar tampil penuh layar)
  const lightbox = document.getElementById("certLightbox");
  const lightboxImg = document.getElementById("certLightboxImg");
  const lightboxClose = document.getElementById("certLightboxClose");

  function openLightbox(card){
    const img = card.querySelector("img");
    lightboxImg.src = img.dataset.full || img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lightboxClose.focus();
  }
  function closeLightbox(){
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-cert-open], [data-brosur-open]").forEach(function(card){
    card.addEventListener("click", function(){ openLightbox(card); });
    card.addEventListener("keydown", function(e){
      if (e.key === "Enter" || e.key === " "){
        e.preventDefault();
        openLightbox(card);
      }
    });
  });
  if (lightbox && lightboxClose){
    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function(e){
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape") closeLightbox();
    });
  }
})();
/* ====================================================================
   BROSUR — kartu "kipas" (.fan).
   Kartu tengah paling besar & paling depan, kartu samping miring dan
   mengecil. Bisa digeser lewat panah, titik navigasi, swipe, panah
   keyboard, atau dengan mengetuk kartu samping.

   INTERAKSI KURSOR (sesuai contoh): begitu kursor diarahkan ke sebuah
   kartu, kartu itu terangkat & sedikit membesar, lalu kartu-kartu di
   kiri dan kanannya MENYIBAK menjauh supaya yang disorot lebih jelas.
   Kartu yang lebih dekat menyibak lebih dulu (ada jeda bertahap), dan
   gerakannya sedikit memantul di akhir. Hanya aktif di perangkat yang
   benar-benar punya kursor -- di layar sentuh tidak dipasang sama
   sekali supaya tidak ada efek "nyangkut" setelah disentuh.

   Aturan ketuk:
   - kartu TENGAH  -> buka brosur ukuran penuh (lightbox yang sudah ada)
   - kartu SAMPING -> dibawa ke tengah dulu, brosurnya TIDAK terbuka
   Supaya aturan kedua bisa jalan, listener di bawah dipasang di fase
   "capture" pada wadahnya. Fase capture berjalan lebih dulu daripada
   listener lightbox yang menempel di kartunya, jadi bisa dicegat.

   Tanpa JS: CSS menampilkannya sebagai strip geser biasa, lengkap
   dengan caption di tiap kartu. Tidak ada yang hilang.
   ==================================================================== */
(function(){
  var fan = document.querySelector(".fan");
  if (!fan) return;

  var deck    = fan.querySelector(".fan-deck");
  var cards   = Array.prototype.slice.call(fan.querySelectorAll(".fan-card"));
  var capBox  = fan.querySelector(".fan-caption");
  var dotsBox = fan.querySelector(".fan-dots");
  var prevBtn = fan.querySelector("[data-fan-prev]");
  var nextBtn = fan.querySelector("[data-fan-next]");
  if (!deck || cards.length < 2) return;

  var TOTAL = cards.length;
  var SLOTS = 5;                 // kartu yang terlihat: tengah + 2 kiri + 2 kanan
  var HALF  = SLOTS >> 1;        // = 2
  var center = 0;
  var hoveredSlot = null;
  var busyUntil = 0;             // hover diabaikan sebentar setelah kipas diputar

  // bentuk kipasnya: x dalam kelipatan LEBAR kartu, y dalam kelipatan TINGGI kartu
  var SHAPE = [
    { x:-1.16, y:0.10,  rot:-17,   scale:0.80, z:1  },
    { x:-0.60, y:0.026, rot:-8.5,  scale:0.90, z:2  },
    { x: 0,    y:0,     rot:0,     scale:1,    z:10 },
    { x: 0.60, y:0.026, rot: 8.5,  scale:0.90, z:2  },
    { x: 1.16, y:0.10,  rot: 17,   scale:0.80, z:1  }
  ];

  // di layar sempit kipasnya dirapatkan supaya tidak keluar layar
  function spread(){
    var w = window.innerWidth;
    if (w < 480)  return 0.46;
    if (w < 768)  return 0.64;
    if (w < 1024) return 0.85;
    return 1;
  }

  function cardSize(){
    return { w: cards[0].offsetWidth, h: cards[0].offsetHeight };
  }

  // slot 0..4 untuk tiap kartu, atau null kalau sedang tidak terlihat
  function slotOf(index){
    var d = ((index - center) % TOTAL + TOTAL) % TOTAL;
    if (d > TOTAL / 2) d -= TOTAL;
    return (d >= -HALF && d <= HALF) ? d + HALF : null;
  }

  function render(){
    var size = cardSize();
    var mult = spread();
    var lift     = size.h * 0.10;    // seberapa tinggi kartu yang disorot terangkat
    var edgeLift = size.h * 0.035;   // kartu ujung ikut naik sedikit
    var pushBase = size.w * 0.26;    // seberapa jauh kartu lain menyibak

    for (var i = 0; i < TOTAL; i++){
      var card = cards[i];
      var slot = slotOf(i);

      if (slot === null){
        var side = (((i - center) % TOTAL + TOTAL) % TOTAL) <= TOTAL / 2 ? 1 : -1;
        card.style.transitionDelay = "0s";
        card.style.transform =
          "translate(" + (side * size.w * 1.5 * mult) + "px, 0px) rotate(" +
          (side * 26) + "deg) scale(0.5)";
        card.style.opacity = "0";
        card.style.zIndex = "0";
        card.setAttribute("aria-hidden", "true");
        card.tabIndex = -1;
        continue;
      }

      var s = SHAPE[slot];
      var x = s.x * size.w * mult;
      var y = s.y * size.h;
      var rot = s.rot;
      var scale = s.scale;
      var delay = 0;

      if (hoveredSlot !== null){
        var dist = Math.abs(slot - hoveredSlot);
        delay = dist * 0.02;

        if (slot === hoveredSlot){
          y -= lift;
          scale *= 1.08;
        } else {
          // kartu di tengah menyibak paling jauh, kartu ujung hampir tidak
          var normalized = (slot - HALF) / HALF;
          var push = pushBase * (1 - Math.abs(normalized)) *
                     (1 + 0.2 * Math.max(0, 3 - dist));
          if (slot < hoveredSlot){
            x -= push;
            rot -= 3 / (dist + 1);
          } else {
            x += push;
            rot += 3 / (dist + 1);
          }
          if (slot === SLOTS - 1 && hoveredSlot < HALF) y -= edgeLift;
          if (slot === 0 && hoveredSlot > HALF) y -= edgeLift;
        }
      } else {
        delay = Math.abs(slot - HALF) * 0.02;
      }

      card.style.transitionDelay = delay + "s";
      card.style.transform =
        "translate(" + x + "px, " + y + "px) rotate(" + rot + "deg) scale(" + scale + ")";
      card.style.opacity = "1";
      card.style.zIndex = String(s.z);
      card.removeAttribute("aria-hidden");
      card.tabIndex = 0;
    }

    // caption mengikuti kartu tengah
    var src = cards[center].querySelector(".fan-cap");
    if (capBox && src){
      var h3 = src.querySelector("h3");
      var sp = src.querySelector("span");
      capBox.querySelector("h3").textContent = h3 ? h3.textContent : "";
      capBox.querySelector("span").textContent = sp ? sp.textContent : "";
    }

    var dots = dotsBox ? dotsBox.querySelectorAll(".fan-dot") : [];
    for (var d = 0; d < dots.length; d++){
      dots[d].classList.toggle("is-on", d === center);
      dots[d].setAttribute("aria-current", d === center ? "true" : "false");
    }
  }

  function goTo(index){
    center = ((index % TOTAL) + TOTAL) % TOTAL;
    hoveredSlot = null;
    busyUntil = Date.now() + 560;
    render();
    schedule();          // hitungan mundur auto-geser dimulai dari nol lagi
  }
  function step(dir){ goTo(center + dir); }

  /* ---- geser sendiri tiap 4,5 detik ----
     Berhenti kalau: kursor lagi di atas kipasnya, kipasnya tidak
     kelihatan di layar, tab browser tidak aktif, atau pengguna
     mengaktifkan "reduce motion". Panah/titik/swipe tetap bisa
     dipakai kapan saja -- begitu dipakai, hitungannya mulai lagi
     dari awal supaya tidak langsung loncat lagi. */
  var AUTO_MS = 4500;
  var autoTimer = null;
  var onScreen = false;
  var hovered = false;
  var reducedMotion = window.matchMedia &&
                      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function schedule(){
    if (autoTimer){ clearTimeout(autoTimer); autoTimer = null; }
    if (reducedMotion || !onScreen || hovered || document.hidden) return;
    autoTimer = setTimeout(function(){ step(1); }, AUTO_MS);
  }
  function stopAuto(){
    if (autoTimer){ clearTimeout(autoTimer); autoTimer = null; }
  }

  // ---- titik navigasi ----
  if (dotsBox){
    for (var i = 0; i < TOTAL; i++){
      (function(idx){
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "fan-dot";
        dot.setAttribute("aria-label", "Brosur ke-" + (idx + 1));
        dot.addEventListener("click", function(){ goTo(idx); });
        dotsBox.appendChild(dot);
      })(i);
    }
  }

  if (prevBtn) prevBtn.addEventListener("click", function(){ step(-1); });
  if (nextBtn) nextBtn.addEventListener("click", function(){ step(1); });

  // ---- sorot kursor: kartu terangkat, tetangganya menyibak ----
  var canHover = window.matchMedia && window.matchMedia("(hover:hover)").matches;
  if (canHover){
    var leaveTimer = null;
    deck.addEventListener("mouseenter", function(){ hovered = true; stopAuto(); });
    cards.forEach(function(card, i){
      card.addEventListener("mouseenter", function(){
        if (Date.now() < busyUntil) return;
        var slot = slotOf(i);
        if (slot === null || slot === hoveredSlot) return;
        if (leaveTimer){ clearTimeout(leaveTimer); leaveTimer = null; }
        hoveredSlot = slot;
        render();
      });
    });
    deck.addEventListener("mouseleave", function(){
      hovered = false;
      schedule();
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(function(){
        hoveredSlot = null;
        render();
      }, 50);
    });
  }

  // ---- ketuk kartu: samping = ke tengah, tengah = buka brosur ----
  function intercept(e){
    var card = e.target.closest ? e.target.closest(".fan-card") : null;
    if (!card) return;
    var idx = cards.indexOf(card);
    if (idx === -1 || idx === center) return;   // kartu tengah: biarkan lightbox jalan
    e.stopPropagation();
    e.preventDefault();
    goTo(idx);
  }
  deck.addEventListener("click", intercept, true);
  deck.addEventListener("keydown", function(e){
    if (e.key === "ArrowLeft"){ e.preventDefault(); step(-1); return; }
    if (e.key === "ArrowRight"){ e.preventDefault(); step(1); return; }
    if (e.key === "Enter" || e.key === " ") intercept(e);
  }, true);

  // ---- geser / swipe ----
  var startX = null, startY = null, swiped = false;
  deck.addEventListener("touchstart", function(e){
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    swiped = false;
  }, { passive: true });
  deck.addEventListener("touchmove", function(e){
    if (startX === null || swiped) return;
    var dx = e.touches[0].clientX - startX;
    var dy = e.touches[0].clientY - startY;
    // hanya dianggap swipe kalau gerakannya jelas mendatar,
    // supaya tidak mengganggu scroll halaman ke atas/bawah
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4){
      step(dx < 0 ? 1 : -1);
      swiped = true;
    }
  }, { passive: true });
  deck.addEventListener("touchend", function(){ startX = null; startY = null; }, { passive: true });

  var resizeTimer = null;
  window.addEventListener("resize", function(){
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 120);
  });

  document.addEventListener("visibilitychange", function(){
    if (document.hidden) stopAuto(); else schedule();
  });

  if ("IntersectionObserver" in window){
    new IntersectionObserver(function(entries){
      onScreen = entries[0].isIntersecting;
      if (onScreen) schedule(); else stopAuto();
    }, { threshold: 0.35 }).observe(fan);
  } else {
    onScreen = true;
    schedule();
  }

  render();
})();

/* ====================================================================
   PENGAMAN PEMUATAN FOTO untuk strip/mozaik yang bergerak sendiri:
   strip foto hero, strip logo merek, dan mozaik dokumentasi.

   Foto di dalamnya dipasang loading="lazy" supaya halaman ringan.
   Masalahnya, ketiga blok itu bergerak pakai CSS transform (bukan
   scroll), jadi browser sering tidak sadar ada foto yang "masuk
   layar" -- akibatnya ada kartu yang tampil kosong. Begitu bloknya
   kelihatan, semua fotonya dipaksa dimuat sekaligus.

   Tanpa JS tetap aman: browser masih memuat lazy image seperti biasa,
   ini cuma jaring pengaman.
   ==================================================================== */
(function(){
  var blocks = document.querySelectorAll(".hm-stage, .brand-marquee, .doc-stage");
  if (!blocks.length) return;

  function loadAll(block){
    var imgs = block.querySelectorAll('img[loading="lazy"]');
    for (var i = 0; i < imgs.length; i++){
      imgs[i].loading = "eager";
    }
  }

  if (!("IntersectionObserver" in window)){
    for (var i = 0; i < blocks.length; i++){ loadAll(blocks[i]); }
    return;
  }

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting){
        loadAll(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "400px" });

  for (var k = 0; k < blocks.length; k++){ io.observe(blocks[k]); }
})();


/* ====================================================================
   TAB KATEGORI halaman produk (.pf-tabs-wrap).
   Tugasnya cuma satu: memberi tahu pengunjung bahwa deretan tabnya
   masih berlanjut ke samping. Tepi yang memudar dan panah kecil cuma
   dimunculkan kalau memang masih ada tab di arah itu -- kalau sudah
   mentok, penandanya hilang sendiri.
   Panahnya juga bisa diklik untuk menggeser satu layar.
   Ditambah: tab yang sedang aktif otomatis digeser ke dalam pandangan,
   jadi setelah memilih kategori posisinya tidak tersembunyi di tepi.
   Tanpa JS: tab tetap bisa digeser dengan jari/trackpad seperti biasa.
   ==================================================================== */
(function(){
  var wrap = document.getElementById("tabsWrap");
  var tabs = document.getElementById("categoryTabs");
  if (!wrap || !tabs) return;

  function update(){
    var max = tabs.scrollWidth - tabs.clientWidth;
    var x = tabs.scrollLeft;
    wrap.classList.toggle("can-prev", x > 4);
    wrap.classList.toggle("can-next", x < max - 4);
  }

  tabs.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);

  wrap.addEventListener("click", function(e){
    var btn = e.target.closest ? e.target.closest("[data-tabs-scroll]") : null;
    if (!btn) return;
    var dir = parseInt(btn.getAttribute("data-tabs-scroll"), 10) || 1;
    tabs.scrollBy({ left: dir * Math.round(tabs.clientWidth * 0.7), behavior: "smooth" });
  });

  // tab aktif dibawa ke dalam pandangan setiap kali kategori berganti
  function revealActive(){
    var active = tabs.querySelector(".filter-pill.is-active");
    if (!active) return;
    var a = active.getBoundingClientRect();
    var t = tabs.getBoundingClientRect();
    if (a.left < t.left + 40){
      tabs.scrollBy({ left: a.left - t.left - 48, behavior: "smooth" });
    } else if (a.right > t.right - 40){
      tabs.scrollBy({ left: a.right - t.right + 48, behavior: "smooth" });
    }
  }
  tabs.addEventListener("click", function(){ setTimeout(revealActive, 60); });

  // daftar kategorinya dibuat oleh products-page.js setelah halaman siap,
  // jadi penandanya dihitung ulang begitu isinya berubah
  if ("MutationObserver" in window){
    new MutationObserver(update).observe(tabs, { childList: true, subtree: true });
  }

  update();
  window.addEventListener("load", update);
})();


/* ====================================================================
   TOMBOL KEMBALI KE ATAS (#backToTop).
   Muncul setelah pengunjung menggulung lebih dari satu layar penuh,
   dan hilang lagi begitu sudah dekat puncak halaman. Ambangnya dibuat
   relatif terhadap tinggi layar, bukan angka mati, supaya terasa sama
   di HP maupun layar besar.

   Dicek ulang lewat requestAnimationFrame supaya tidak menghitung
   berkali-kali dalam satu frame saat digulung cepat.

   Tanpa JS: tombolnya tetap tampil dan tetap berfungsi, karena aslinya
   <a href="#"> -- yang disembunyikan-munculkan cuma lapisan CSS yang
   diaktifkan oleh penanda html.js.
   ==================================================================== */
(function(){
  var btn = document.getElementById("backToTop");
  if (!btn) return;

  var ticking = false;
  var shown = false;

  function threshold(){
    return Math.max(400, window.innerHeight * 0.9);
  }

  function update(){
    ticking = false;
    var should = window.pageYOffset > threshold();
    if (should === shown) return;
    shown = should;
    btn.classList.toggle("is-on", should);
  }

  function onScroll(){
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  btn.addEventListener("click", function(e){
    // tanpa JS, href="#" sudah melompat ke atas. Dengan JS, lompatannya
    // diambil alih supaya gerakannya halus dan URL tidak kemasukan "#".
    e.preventDefault();
    var reduced = window.matchMedia &&
                  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });

  update();
})();

/* ====================================================================
   FOOTER KATEGORI & BADGE JUMLAH PRODUK — OTOMATIS
   Supaya daftar kategori di footer dan badge "X00+ Produk Siap Kirim"
   di homepage SELALU sinkron dengan katalog terbaru di products.js,
   tanpa perlu diupdate manual tiap kali nambah produk/kategori baru.
   (Meta tag og:description untuk WA/social share TETAP harus di-update
   manual di <head>, karena crawler share link tidak menjalankan JS.)
   ==================================================================== */
/* ====================================================================
   FOOTER KATEGORI & BADGE JUMLAH PRODUK — OTOMATIS
   Supaya daftar kategori di footer dan badge "X00+ Produk Siap Kirim"
   di homepage SELALU sinkron dengan katalog terbaru di products.js,
   tanpa perlu diupdate manual tiap kali nambah produk/kategori baru.
   (Meta tag og:description untuk WA/social share TETAP harus di-update
   manual di <head>, karena crawler share link tidak menjalankan JS.)

   Ditaruh di listener DOMContentLoaded (bukan langsung dieksekusi)
   karena urutan tag <script defer> di HTML adalah script.js lebih
   dulu dari products.js -- PRODUCTS belum ada kalau kode ini jalan
   duluan. DOMContentLoaded baru terpicu SETELAH semua script defer
   (termasuk products.js) selesai jalan, jadi PRODUCTS sudah pasti ada.
   ==================================================================== */
document.addEventListener("DOMContentLoaded", function () {
  if (typeof PRODUCTS === "undefined" || !PRODUCTS.length) return;

  // -- footer: daftar kategori, urut abjad, otomatis dari data produk --
  // tiap kategori jadi link ke halaman bridge /kategori/<slug>.html --
  // halaman itu punya thumbnail WA khusus kategori itu, terus auto-redirect
  // ke /products.html?kategori=... (lihat gen_share_bridge_pages.py)
  var slugify = function (s) {
    return s.toLowerCase().replace(/&/g, "dan")
      .replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  };
  var cats = [];
  PRODUCTS.forEach(function (p) {
    if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category);
  });
  cats.sort(function (a, b) { return a.localeCompare(b, "id"); });
  var escapeHtml = function (s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var catsHtml = cats.map(function (c) {
    return '<a href="/kategori/' + slugify(c) + '.html">' + escapeHtml(c) + "</a>";
  }).join(" | ");
  document.querySelectorAll(".foot-cats").forEach(function (el) {
    el.innerHTML = catsHtml;
  });

  // -- badge "X00+ Produk Siap Kirim" di homepage --
  var badge = document.getElementById("productCountBadge");
  if (badge) {
    var rounded = Math.floor(PRODUCTS.length / 100) * 100;
    badge.textContent = rounded + "+ Produk Siap Kirim";
  }

  // -- badge "X0+ Merek Terpercaya" di homepage --
  // "Non-Brand" dikecualikan karena bukan merek sungguhan
  var brandBadge = document.getElementById("brandCountBadge");
  if (brandBadge) {
    var brands = [];
    PRODUCTS.forEach(function (p) {
      if (p.brand && p.brand !== "Non-Brand" && brands.indexOf(p.brand) === -1) brands.push(p.brand);
    });
    var brandRounded = Math.floor(brands.length / 5) * 5;
    brandBadge.textContent = brandRounded + "+ Merek Terpercaya";
  }
});

/* ====================================================================
   REDESIGN 2026 — sorotan cahaya mengikuti kursor di kartu
   Cuma jalan di perangkat dengan mouse (HP tidak kena, hemat baterai).
   Tidak mengubah fungsi apa pun: hanya mengisi variabel --mx/--my.
   ==================================================================== */
(function(){
  if (!window.matchMedia || !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  var SEL = ".feat, .shop-card";
  var raf = 0, lastEl = null, lastX = 0, lastY = 0;
  document.addEventListener("pointermove", function(e){
    var el = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (!el) return;
    lastEl = el; lastX = e.clientX; lastY = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(function(){
      raf = 0;
      var r = lastEl.getBoundingClientRect();
      lastEl.style.setProperty("--mx", (lastX - r.left) + "px");
      lastEl.style.setProperty("--my", (lastY - r.top) + "px");
    });
  }, { passive:true });
})();

/* muat penghitung klik WhatsApp (js/tracking.js) -- satu file untuk semua halaman */
(function(){
  if (document.querySelector("script[data-dop-tracking]")) return;
  var s = document.createElement("script");
  s.src = "/js/tracking.js";
  s.defer = true;
  s.setAttribute("data-dop-tracking", "");
  document.head.appendChild(s);
})();

/* ====================================================================
   GALERI BROSUR PER KATEGORI (#brosurGallery)
   - kartu kategori diisi otomatis: 3 brosur pertama jadi tumpukan,
     jumlah brosur dihitung sendiri
   - ketuk kategori -> brosur di tumpukan "terbang" ke tempatnya di
     kisi (teknik FLIP), brosur lainnya menyusul
   - "Semua kategori" -> kembali ke tampilan kartu
   - ketuk brosur -> lightbox yang sudah ada (tidak diubah)
   Tanpa JS: semua brosur tampil langsung dalam kisi.
   ==================================================================== */
(function(){
  var root = document.getElementById("brosurGallery");
  if (!root) return;

  var cats  = Array.prototype.slice.call(root.querySelectorAll("[data-bx-cat]"));
  var items = Array.prototype.slice.call(root.querySelectorAll(".bx-item"));
  var tabs  = root.querySelector(".bx-tabs");
  var back  = root.querySelector("[data-bx-back]");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EASE = "cubic-bezier(.34,1.25,.5,1)";
  var ROT = [-11, -1, 10];
  var current = null;
  var stackOf = {};

  function itemsOf(cat){
    return items.filter(function(it){ return it.getAttribute("data-cat") === cat; });
  }
  function nameOf(cat){
    var c = root.querySelector('[data-bx-cat="' + cat + '"] .bx-cat-name');
    return c ? c.textContent.trim() : cat;
  }

  // isi tumpukan, jumlah, dan tab
  cats.forEach(function(card){
    var cat = card.getAttribute("data-bx-cat");
    var list = itemsOf(cat);
    var stack = card.querySelector(".bx-stack");
    // tumpukan: pakai brosur ber-data-stack (1 kiri, 2 tengah, 3 kanan),
    // sisanya diisi dari urutan brosur
    var picked = list.filter(function(it){ return it.hasAttribute("data-stack"); })
      .sort(function(a, b){ return (+a.getAttribute("data-stack")) - (+b.getAttribute("data-stack")); });
    list.forEach(function(it){ if (picked.length < 3 && picked.indexOf(it) === -1) picked.push(it); });
    stackOf[cat] = picked.slice(0, 3);
    picked.slice(0, 3).forEach(function(it){
      var src = it.querySelector("img");
      var im = document.createElement("img");
      im.src = src.getAttribute("src");
      im.alt = "";
      im.loading = "lazy";
      im.decoding = "async";
      stack.appendChild(im);
    });
    var count = card.querySelector("[data-bx-count]");
    if (count) count.textContent = list.length;
    card.setAttribute("aria-label", "Lihat " + list.length + " brosur " + nameOf(cat));
    card.addEventListener("click", function(){ open(cat, true); });

    var t = document.createElement("button");
    t.type = "button";
    t.className = "bx-tab";
    t.setAttribute("role", "tab");
    t.setAttribute("data-bx-tab", cat);
    t.innerHTML = nameOf(cat) + " <small>" + list.length + "</small>";
    t.addEventListener("click", function(){ if (cat !== current) open(cat, false); });
    tabs.appendChild(t);
  });

  function geo(el, rotDeg){
    // posisi tengah + ukuran asli (sebelum diputar) sebuah elemen
    var r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2,
             w: el.offsetWidth, h: el.offsetHeight, rot: rotDeg || 0 };
  }
  function flip(el, from, to, delay){
    if (reduce || !el.animate) return;
    var dx = from.cx - to.cx, dy = from.cy - to.cy;
    var sx = from.w / to.w, sy = from.h / to.h;
    el.animate([
      { transform: "translate(" + dx + "px," + dy + "px) scale(" + sx + "," + sy + ") rotate(" + from.rot + "deg)" },
      { transform: "none" }
    ], { duration: 720, delay: delay || 0, easing: EASE, fill: "backwards" });
  }
  function rise(el, delay){
    if (reduce || !el.animate) return;
    el.animate([
      { opacity: 0, transform: "translateY(18px) scale(.94)" },
      { opacity: 1, transform: "none" }
    ], { duration: 560, delay: delay, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
  }

  function open(cat, fromCard){
    var card = root.querySelector('[data-bx-cat="' + cat + '"]');
    var stackImgs = fromCard && card ? Array.prototype.slice.call(card.querySelectorAll(".bx-stack img")) : [];
    var starts = stackImgs.map(function(im, i){ return geo(im, ROT[i] || 0); });

    current = cat;
    root.classList.add("is-open");
    items.forEach(function(it){ it.hidden = it.getAttribute("data-cat") !== cat; });
    tabs.querySelectorAll("[data-bx-tab]").forEach(function(t){
      t.setAttribute("aria-selected", t.getAttribute("data-bx-tab") === cat ? "true" : "false");
    });

    var list = itemsOf(cat);
    var n = 0;
    list.forEach(function(it, i){
      var thumb = it.querySelector(".bx-thumb");
      var cap = it.querySelector(".bx-cap");
      var k = stackOf[cat] ? stackOf[cat].indexOf(it) : -1;
      var inView = thumb.getBoundingClientRect().top < window.innerHeight + 40;
      if (k > -1 && starts[k] && inView){
        flip(thumb, starts[k], geo(thumb), k * 40);
        rise(cap, 260 + k * 40);
      } else {
        rise(it, (fromCard ? 200 : 0) + Math.min(n++, 8) * 55);
      }
    });

    // bawa awal galeri ke layar kalau posisinya terlewat
    var top = root.getBoundingClientRect().top;
    if (top < 70) window.scrollBy({ top: top - 90, behavior: reduce ? "auto" : "smooth" });
    if (fromCard && back) back.focus({ preventScroll: true });
  }

  function close(){
    if (!current) return;
    var was = current;
    current = null;
    root.classList.remove("is-open");

    var card = root.querySelector('[data-bx-cat="' + was + '"]');
    cats.forEach(function(c, i){ if (c !== card) rise(c, 80 + i * 60); });
    if (card){
      Array.prototype.slice.call(card.querySelectorAll(".bx-stack img")).forEach(function(im, i){
        if (!reduce && im.animate) im.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: i * 70, easing: "ease-out", fill: "backwards" });
      });
      rise(card.querySelector(".bx-glass"), 240);
      card.focus({ preventScroll: true });
    }
    var top = root.getBoundingClientRect().top;
    if (top < 70) window.scrollBy({ top: top - 90, behavior: reduce ? "auto" : "smooth" });
  }

  if (back) back.addEventListener("click", close);
  document.addEventListener("keydown", function(e){
    // Esc menutup galeri, kecuali lightbox brosur sedang terbuka
    var lb = document.getElementById("certLightbox");
    if (e.key === "Escape" && current && !(lb && lb.classList.contains("is-open"))) close();
  }, true);
})();
