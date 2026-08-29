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
  address: "Harco Mangga Dua Plaza Blok A2 Lantai 2 No 69, Jakarta"
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
  }
  function step(dir){ goTo(center + dir); }

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
