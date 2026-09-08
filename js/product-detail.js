/* ====================================================================
   Tombol "Bagikan" di halaman detail produk (produk/<id>.html).
   Data spesifik produk (url, teks share, nama) diisi lewat
   window.PDP_DATA yang di-set inline sebelum file ini di-include.
   ==================================================================== */
(function () {
  "use strict";
  var data = window.PDP_DATA || {};
  var btn = document.getElementById("pdpShareBtn");
  if (!btn) return;

  var url = data.url || window.location.href;
  var text = data.shareText || document.title;
  var name = data.name || document.title;

  function showToast(msg) {
    var existing = document.getElementById("dopToast");
    if (existing) existing.remove();
    var t = document.createElement("div");
    t.id = "dopToast";
    t.className = "dop-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    void t.offsetWidth;
    t.classList.add("is-visible");
    window.setTimeout(function () {
      t.classList.remove("is-visible");
      window.setTimeout(function () { t.remove(); }, 260);
    }, 2200);
  }

  function fallbackCopy(txt) {
    var ta = document.createElement("textarea");
    ta.value = txt;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    showToast(ok ? "Link produk disalin" : "Gagal menyalin link");
  }

  function copyToClipboard(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () {
        showToast("Link produk disalin");
      }).catch(function () { fallbackCopy(txt); });
    } else {
      fallbackCopy(txt);
    }
  }

  function openMenu() {
    var old = document.getElementById("dopShareMenu");
    if (old) { old.remove(); return; }
    var menu = document.createElement("div");
    menu.id = "dopShareMenu";
    menu.className = "dop-share-menu";
    menu.innerHTML =
      '<button type="button" data-act="copy"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6 13.4a1 1 0 0 1 0-1.4l3-3a3.5 3.5 0 0 1 5 5l-1.6 1.6a1 1 0 1 1-1.4-1.4l1.6-1.6a1.5 1.5 0 0 0-2.2-2.2l-3 3a1 1 0 0 1-1.4 0zm2.8-2.8a1 1 0 0 1 0 1.4l-3 3a3.5 3.5 0 0 1-5-5l1.6-1.6a1 1 0 1 1 1.4 1.4l-1.6 1.6a1.5 1.5 0 0 0 2.2 2.2l3-3a1 1 0 0 1 1.4 0z"/></svg><span>Salin Link</span></button>' +
      '<a data-act="wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(text + " " + url) + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.09c-.24.68-1.4 1.33-1.93 1.4-.5.07-1.11.1-1.79-.11-.41-.13-.94-.3-1.62-.6-2.84-1.23-4.7-4.1-4.84-4.29-.14-.19-1.16-1.54-1.16-2.94s.73-2.08.99-2.36c.26-.28.56-.35.75-.35h.53c.17 0 .4-.03.62.48.24.56.8 1.94.87 2.08.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.28.71 1.18 1.53 1.92 1.05.95 1.94 1.24 2.21 1.38.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.23.63-.14.26.09 1.63.77 1.91.91.28.14.47.21.53.33.07.12.07.68-.17 1.36z"/></svg><span>Bagikan via WhatsApp</span></a>';
    document.body.appendChild(menu);
    var rect = btn.getBoundingClientRect();
    var menuW = menu.offsetWidth;
    var left = Math.min(rect.right - menuW, window.innerWidth - menuW - 10);
    left = Math.max(10, left);
    var top = rect.bottom + 8;
    if (top + menu.offsetHeight > window.innerHeight - 10) top = rect.top - menu.offsetHeight - 8;
    menu.style.left = left + "px";
    menu.style.top = top + "px";
    menu.querySelector('[data-act="copy"]').addEventListener("click", function () {
      copyToClipboard(url);
      menu.remove();
    });
    menu.querySelector('[data-act="wa"]').addEventListener("click", function () { menu.remove(); });
    window.setTimeout(function () {
      document.addEventListener("click", function onDoc(e) {
        if (!menu.contains(e.target) && e.target !== btn) {
          menu.remove();
          document.removeEventListener("click", onDoc, true);
        }
      }, true);
    }, 0);
  }

  btn.addEventListener("click", function () {
    if (navigator.share) {
      navigator.share({ title: name, text: text, url: url }).catch(function () {});
    } else {
      openMenu();
    }
  });
})();
