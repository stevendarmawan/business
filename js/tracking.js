/* ====================================================================
   PENGHITUNG KLIK WHATSAPP (Google Analytics 4 — gratis)
   --------------------------------------------------------------------
   GANTI DI SINI: isi dengan "Measurement ID" dari Google Analytics,
   bentuknya seperti "G-AB12CD34EF". Selama masih kosong, penghitung
   ini diam (tidak mengirim apa-apa) dan website tetap jalan normal.
   ==================================================================== */
var DOP_TRACKING = {
  gaId: ""
};
/* ==================================================================== */

(function(){
  if (window.__dopTrackingLoaded) return;
  window.__dopTrackingLoaded = true;

  // catatan lokal, dipakai buat mengecek penghitung jalan (tidak dikirim ke mana-mana)
  window.dopTrackLog = window.dopTrackLog || [];

  var id = (DOP_TRACKING.gaId || "").trim();
  if (id){
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id);
  }

  function send(name, params){
    params = params || {};
    params.halaman = location.pathname;
    window.dopTrackLog.push({ event:name, params:params });
    if (id && window.gtag) window.gtag("event", name, params);
  }
  window.dopTrack = send;

  // dari bagian mana tombol WhatsApp diklik
  function where(el){
    var map = [
      [".fab-wa", "tombol_melayang"],
      [".site-header", "header"],
      [".hero", "hero"],
      [".pdp-btn-wa", "halaman_produk"],
      [".shop-card", "kartu_produk"],
      [".cta-banner", "banner_tengah"],
      ["#kontak", "kontak"],
      ["footer", "footer"]
    ];
    for (var i = 0; i < map.length; i++){
      if (el.closest(map[i][0])) return map[i][1];
    }
    return "lainnya";
  }

  document.addEventListener("click", function(e){
    var t = e.target;
    if (!t || !t.closest) return;
    var a = t.closest('a[href*="wa.me/"]');
    if (a){
      // link "Bagikan via WhatsApp" (tanpa nomor) = membagikan produk, bukan chat ke toko
      if (/wa\.me\/\?/.test(a.getAttribute("href") || "")) send("bagikan_produk", { lokasi: where(a) });
      else send("klik_whatsapp", { lokasi: where(a) });
      return;
    }
    var add = t.closest(".btn-add-cart");
    if (add) send("tambah_keranjang", { lokasi: where(add) });
  }, true);

  // checkout keranjang -> WhatsApp (hanya terhitung kalau formulirnya lengkap)
  document.addEventListener("submit", function(e){
    if (e.target && e.target.id === "checkoutForm"){
      var total = document.getElementById("checkoutTotal");
      send("checkout_whatsapp", { total: total ? total.textContent.trim() : "" });
    }
  }, true);
})();
