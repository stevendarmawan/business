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