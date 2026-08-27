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
   AUTO-SLIDE untuk strip "Dokumentasi Stok Gudang" & "Momen Serah
   Terima" (.testi-scroll). Cuma nambah animasi geser otomatis pelan,
   TIDAK mengubah HTML/CSS yang sudah ada. Geser manual (drag/swipe)
   tetap jalan seperti biasa -- begitu user pegang, auto-slide berhenti
   dulu, lalu lanjut lagi sendiri setelah beberapa detik idle.
   ==================================================================== */
(function(){
  // Hormati preferensi pengguna yang mematikan animasi -- strip tetap
  // bisa digeser manual seperti biasa, cuma auto-slide-nya yang dimatikan.
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  var STEP_INTERVAL = 3200;   // jeda antar geser otomatis (ms)
  var RESUME_DELAY = 4000;    // tunggu sekian ms setelah user berhenti pegang, baru auto-slide lanjut lagi

  function setupAutoSlide(scrollEl){
    var track = scrollEl.querySelector(".testi-track");
    if (!track) return;

    var timer = null;
    var resumeTimeout = null;
    var direction = 1;
    var isVisible = false;

    function getStep(){
      var item = track.querySelector(".testi-item");
      if (!item) return 0;
      var gap = parseFloat(getComputedStyle(track).gap) || 0;
      return item.getBoundingClientRect().width + gap;
    }

    function tick(){
      var maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
      if (maxScroll <= 4) return; // semua item sudah muat, tidak perlu geser
      if (scrollEl.scrollLeft >= maxScroll - 4){
        direction = -1;
      } else if (scrollEl.scrollLeft <= 4){
        direction = 1;
      }
      var step = getStep();
      if (!step) return;
      scrollEl.scrollBy({ left: step * direction, behavior: "smooth" });
    }

    function start(){
      stop();
      if (!isVisible) return;
      timer = setInterval(tick, STEP_INTERVAL);
    }
    function stop(){
      if (timer){ clearInterval(timer); timer = null; }
    }
    function pauseThenResume(){
      stop();
      if (resumeTimeout) clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(start, RESUME_DELAY);
    }

    // User pegang/geser manual (touch, mouse drag, wheel/trackpad) -> jeda,
    // lalu lanjut otomatis lagi setelah idle beberapa detik.
    ["pointerdown", "touchstart", "wheel"].forEach(function(evt){
      scrollEl.addEventListener(evt, pauseThenResume, { passive: true });
    });

    // Desktop: berhenti sementara saat kursor di atas strip supaya nyaman
    // dipandang/diklik, lanjut lagi begitu kursor menjauh.
    scrollEl.addEventListener("mouseenter", stop);
    scrollEl.addEventListener("mouseleave", function(){
      if (resumeTimeout) clearTimeout(resumeTimeout);
      start();
    });

    // Hemat resource: cuma jalan kalau strip-nya kelihatan di layar.
    if ("IntersectionObserver" in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          isVisible = entry.isIntersecting;
          if (isVisible) start(); else stop();
        });
      }, { threshold: 0.2 });
      io.observe(scrollEl);
    } else {
      isVisible = true;
      start();
    }

    // Jeda saat tab browser tidak aktif.
    document.addEventListener("visibilitychange", function(){
      if (document.hidden) stop(); else if (isVisible) start();
    });
  }

  document.querySelectorAll(".testi-scroll").forEach(setupAutoSlide);
})();