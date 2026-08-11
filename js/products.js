/* ====================================================================
   KATALOG PRODUK — satu tempat untuk semua data produk yang bisa dibeli.
   ====================================================================
   Cara nambah produk baru: copy salah satu blok { ... } di bawah,
   ganti isinya, kasih "id" yang unik (huruf kecil, tanpa spasi).

   Field "priceIsEstimate: true" artinya harga yang tampil adalah
   estimasi/harga promo terbatas — harga final tetap dikonfirmasi
   admin lewat WhatsApp saat checkout (jadi aman, gak akan salah kasih
   harga pasti ke customer untuk produk yang harganya bisa berubah).

   Struktur ini sengaja dipisah dari logic (js/cart.js) dan tampilan
   (index.html) supaya gampang nanti kalau mau disambungkan ke
   database/backend asli — tinggal ganti PRODUCTS ini jadi hasil
   fetch() dari API, sisanya (cart, checkout, hitung total) gak perlu
   diubah sama sekali.
   ==================================================================== */
const PRODUCTS = [
  {
    id: "eb-e600",
    brand: "Epson",
    name: "Epson EB-E600",
    specLine: "XGA · 3.400 Lumens",
    ports: "HDMI | VGA In/Out, No Zoom In/Out",
    price: 5400000,
    priceIsEstimate: true,
    icon: "projector"
  },
  {
    id: "eb-x600",
    brand: "Epson",
    name: "Epson EB-X600",
    specLine: "XGA · 3.600 Lumens",
    ports: "USB | HDMI | VGA In/Out",
    price: 5800000,
    priceIsEstimate: true,
    icon: "projector"
  },
  {
    id: "eb-w55",
    brand: "Epson",
    name: "Epson EB-W55",
    specLine: "WXGA · 4.000 Lumens",
    ports: "Dual HDMI | USB | WiFi",
    price: 8500000,
    priceIsEstimate: true,
    icon: "projector"
  },
  {
    id: "eb-x52",
    brand: "Epson",
    name: "Epson EB-X52",
    specLine: "XGA · 3.800 Lumens",
    ports: "USB | Dual HDMI",
    price: 6600000,
    priceIsEstimate: true,
    icon: "projector"
  },
  {
    id: "eb-w53",
    brand: "Epson",
    name: "Epson EB-W53",
    specLine: "WXGA · 4.000 Lumens",
    ports: "HDMI, No Zoom In/Out",
    price: 7200000,
    priceIsEstimate: true,
    icon: "projector"
  },
  {
    id: "eb-fh54",
    brand: "Epson",
    name: "Epson EB-FH54",
    specLine: "Full HD · 4.100 Lumens",
    ports: "USB | Dual HDMI | WiFi",
    price: 13250000,
    priceIsEstimate: true,
    icon: "projector"
  },
  {
    id: "infocus-in0004sl",
    brand: "InFocus",
    name: "InFocus IN0004SL",
    specLine: "XGA · 4.000 Lumens",
    ports: "HDMI | VGA",
    price: 4900000,
    priceIsEstimate: true,
    icon: "projector"
  },
  {
    id: "spc-p100",
    brand: "SPC",
    name: "SPC P100",
    specLine: "XGA · 4.200 Lumens",
    ports: "HDMI | VGA · Bersertifikat TKDN",
    price: 3900000,
    priceIsEstimate: true,
    icon: "projector"
  },
  {
    id: "eb-2065",
    brand: "Epson",
    name: "Epson EB-2065",
    specLine: "XGA · 5.500 Lumens",
    ports: "HDMI | USB | LAN",
    price: 21000000,
    priceIsEstimate: true,
    icon: "projector"
  },
  {
    id: "eb-2155w",
    brand: "Epson",
    name: "Epson EB-2155W",
    specLine: "WXGA · 5.000 Lumens",
    ports: "HDMI | USB | LAN",
    price: 23000000,
    priceIsEstimate: true,
    icon: "projector"
  },
  {
    id: "eb-2265u",
    brand: "Epson",
    name: "Epson EB-2265U",
    specLine: "WUXGA · 5.500 Lumens",
    ports: "HDMI | USB | LAN",
    price: 31000000,
    priceIsEstimate: true,
    icon: "projector"
  }
];
