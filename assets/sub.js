/* Açılış sayfaları: teklif sepetine ekleme, ürünleri panelden güncelleme, tıklama ölçümü */
(function () {
  "use strict";
  var C = window.FT_CONFIG, KEY = "ft_teklif_sepeti_v1", basket = {}, products = window.FT_FALLBACK_PRODUCTS.slice();
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function img(v, w) { v = String(v || "").trim(); return /^\d+$/.test(v) ? "https://images.pexels.com/photos/" + v + "/pexels-photo-" + v + ".jpeg?auto=compress&cs=tinysrgb&w=" + (w || 600) : v; }

  try { basket = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(basket)); } catch (e) {} }

  /* ölçüm */
  var EV = ["page_view", "whatsapp_click", "phone_click", "email_click", "instagram_click", "add_to_quote", "cta_click", "cart_open", "category_click", "map_click"];
  function vid() { try { var v = localStorage.getItem("ft_vid"); if (!v) { v = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem("ft_vid", v); } return v; } catch (e) { return ""; } }
  function src() {
    try {
      var sp = new URLSearchParams(location.search), out = ["utm_source", "utm_medium", "utm_campaign", "gclid"].filter(function (k) { return sp.get(k); }).map(function (k) { return k + "=" + sp.get(k); });
      if (out.length) sessionStorage.setItem("ft_src", out.join("&"));
      return out.join("&") || sessionStorage.getItem("ft_src") || (document.referrer ? "ref=" + document.referrer : "doğrudan");
    } catch (e) { return ""; }
  }
  function track(ev, label) {
    if (/^cta_/.test(ev)) ev = "cta_click";
    if (!C.FORM_ENDPOINT || EV.indexOf(ev) < 0 || location.protocol === "file:") return;
    var body = JSON.stringify({ action: "track", ev: ev, label: label || "", page: location.pathname, src: src(), device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobil" : "Masaüstü", vid: vid() });
    try { navigator.sendBeacon ? navigator.sendBeacon(C.FORM_ENDPOINT, new Blob([body], { type: "text/plain" })) : fetch(C.FORM_ENDPOINT, { method: "POST", mode: "no-cors", body: body }); } catch (e) {}
  }
  document.addEventListener("click", function (e) { var t = e.target.closest("[data-track]"); if (t) track(t.getAttribute("data-track"), t.getAttribute("href") || ""); });
  track("page_view", document.title);

  /* sepet */
  var plus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  var tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4.5 4.5L19 7"/></svg>';
  function sync() {
    $$("[data-add]").forEach(function (b) {
      var on = !!basket[b.getAttribute("data-add")];
      b.setAttribute("aria-pressed", on); b.innerHTML = on ? tick + "Sepette" : plus + "Teklife ekle";
    });
    var n = Object.keys(basket).length;
    $$("[data-count]").forEach(function (el) { el.textContent = n; });
  }
  var tt;
  function toast(m) { var t = document.getElementById("toast"); t.innerHTML = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(function () { t.hidden = true; }, 2600); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-add]"); if (!b) return;
    var id = b.getAttribute("data-add"), p = products.find(function (x) { return x.id === id; }) || { name: "Ürün" };
    if (basket[id]) { delete basket[id]; toast(esc(p.name) + " sepetten çıkarıldı"); }
    else { basket[id] = { added: Date.now() }; toast(esc(p.name) + ' sepete eklendi · <a href="../#teklif" style="color:#F2D64B">Teklif iste</a>'); track("add_to_quote", p.name); }
    save(); sync();
  });

  /* panelden güncel ürünler */
  function card(p) {
    var cat = String(p.cat).replace(" & Bakliyat", "");
    return '<article class="product"><div class="product-img"><img src="' + esc(img(p.img)) + '" alt="' + esc(p.name) + '" loading="lazy" width="600" height="450">' + (p.season ? '<span class="season">' + esc(p.season) + "</span>" : "") + "</div>" +
      '<div class="product-label"><h3>' + esc(p.name) + "</h3>" + (p.desc ? "<p>" + esc(p.desc) + "</p>" : "") +
      '<div class="label-row"><span>Satış: <b>' + esc(p.sale || p.unit) + "</b></span><span>" + esc(cat) + "</span></div>" +
      '<button type="button" class="add-btn" data-add="' + esc(p.id) + '" aria-pressed="false">' + plus + "Teklife ekle</button></div></article>";
  }
  if (C.FORM_ENDPOINT) {
    fetch(C.FORM_ENDPOINT + "?action=public").then(function (r) { return r.json(); }).then(function (res) {
      if (!res || !res.ok || !res.products || !res.products.length) return;
      products = res.products;
      $$("[data-cats]").forEach(function (g) {
        var c = g.getAttribute("data-cats"), list = products.filter(function (p) { return p.cat === c; });
        if (list.length) g.innerHTML = list.map(card).join("");
      });
      sync();
    }).catch(function () {});
  }

  /* menü */
  var mb = document.getElementById("menuBtn"), nav = document.getElementById("nav");
  if (mb) mb.addEventListener("click", function () { var o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); });
  sync();
})();
