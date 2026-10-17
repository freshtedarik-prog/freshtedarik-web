(function () {
  "use strict";
  var C = window.FT_CONFIG;
  var STORE_KEY = "ft_teklif_sepeti_v1";
  var products = [];
  var basket = {}; // id -> { added }
  var activeCat = "Tümü";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  function imgUrl(v, w) {
    if (!v) return "";
    if (/^\d+$/.test(String(v).trim())) {
      var id = String(v).trim();
      return "https://images.pexels.com/photos/" + id + "/pexels-photo-" + id + ".jpeg?auto=compress&cs=tinysrgb&w=" + (w || 600);
    }
    return String(v).trim();
  }

  /* ---------- Ölçüm: Google (ID girildiyse) + panelin kendi sayacı ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  var gaLoaded = false, ADS = { id: C.ADS_ID, label: C.ADS_LEAD_LABEL };
  function initGoogle(gaId, adsId, gtmId) {
    if (gaLoaded) return;
    var first = gaId || adsId;
    if (first) {
      gaLoaded = true;
      var s = document.createElement("script");
      s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(first);
      document.head.appendChild(s);
      gtag("js", new Date());
      if (gaId) gtag("config", gaId);
      if (adsId) gtag("config", adsId);
    }
    if (gtmId && /^GTM-/.test(gtmId)) {
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      var g = document.createElement("script"); g.async = true;
      g.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(gtmId);
      document.head.appendChild(g);
    }
  }
  initGoogle(C.GA_ID, C.ADS_ID, "");

  var OWN_EVENTS = ["page_view", "whatsapp_click", "phone_click", "email_click", "instagram_click", "add_to_quote", "cta_click", "cart_open", "generate_lead", "category_click", "map_click"];
  function visitorId() {
    try {
      var v = localStorage.getItem("ft_vid");
      if (!v) { v = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem("ft_vid", v); }
      return v;
    } catch (e) { return ""; }
  }
  function ownTrack(ev, label) {
    if (!C.FORM_ENDPOINT || OWN_EVENTS.indexOf(ev) < 0) return;
    if (/localhost|127\.0\.0\.1|^file:/.test(location.href)) return;
    var payload = JSON.stringify({
      action: "track", ev: ev, label: label || "", page: location.pathname + location.hash,
      src: utm(), device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobil" : "Masaüstü", vid: visitorId()
    });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(C.FORM_ENDPOINT, new Blob([payload], { type: "text/plain" }));
      else fetch(C.FORM_ENDPOINT, { method: "POST", mode: "no-cors", body: payload, keepalive: true });
    } catch (e) {}
  }
  function track(name, params) {
    try { window.gtag("event", name, params || {}); } catch (e) {}
    var own = OWN_EVENTS.indexOf(name) > -1 ? name : (/^cta_/.test(name) ? "cta_click" : null);
    if (own) ownTrack(own, (params && (params.item_name || params.label)) || name);
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-track]");
    if (t) track(t.getAttribute("data-track"), { link_url: t.getAttribute("href") || "" });
  });

  /* ---------- Sepet saklama ---------- */
  function loadBasket() {
    try { basket = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { basket = {}; }
  }
  function saveBasket() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(basket)); } catch (e) {}
  }

  /* ---------- Ürünler ve site ayarları (panelden) ---------- */
  function fromPanel() {
    return fetch(C.FORM_ENDPOINT + "?action=public").then(function (r) {
      if (!r.ok) throw new Error("api");
      return r.json();
    }).then(function (res) {
      if (!res || !res.ok) throw new Error("api");
      return res;
    });
  }

  var waText = "Merhaba, Fresh Tedarik ürünleri için fiyat teklifi almak istiyorum.";
  function init() {
    loadBasket();
    renderChips();
    renderDistricts();
    renderDays();
    ["waContact", "waBar"].forEach(function (id) { var a = document.getElementById(id); if (a) a.href = waLink(waText); });
    $("#year").textContent = new Date().getFullYear();

    products = window.FT_FALLBACK_PRODUCTS.slice();
    renderProducts();
    renderBasket();
    ownTrack("page_view", document.referrer ? "ref" : "direct");
    if (!C.FORM_ENDPOINT) return;
    fromPanel().then(function (res) {
      if (res.products && res.products.length) {
        products = res.products;
        renderChips(); renderProducts(); renderBasket();
      }
      applySettings(res.settings || {});
    }).catch(function () { /* yedek liste kullanılıyor */ });
  }

  function waLink(text) { return "https://wa.me/" + C.WHATSAPP + "?text=" + encodeURIComponent(text); }

  function applySettings(s) {
    if (s.whatsapp) {
      C.WHATSAPP = String(s.whatsapp).replace(/\D/g, "");
      ["waContact", "waBar"].forEach(function (id) { var a = document.getElementById(id); if (a) a.href = waLink(waText); });
    }
    if (s.phone) {
      var d = String(s.phone).replace(/\D/g, "").replace(/^0/, "90");
      $$("[data-tel]").forEach(function (a) { a.href = "tel:+" + d; });
      if ($("#phoneText")) $("#phoneText").textContent = s.phone;
      C.PHONE_DISPLAY = s.phone;
    }
    if (s.email) { $("#emailText").textContent = s.email; $("#emailLink").href = "mailto:" + s.email; }
    if (s.address) { $("#addrText").textContent = s.address; $("#mapLink").href = "https://maps.google.com/?q=" + encodeURIComponent(s.address); }
    if (s.instagram) {
      var u = String(s.instagram).replace(/^@/, "");
      $$("[data-ig]").forEach(function (a) { a.href = "https://www.instagram.com/" + encodeURIComponent(u) + "/"; });
      if ($("#igText")) $("#igText").textContent = "@" + u;
    }
    if (s.heroTitle) {
      $("#heroTitle").innerHTML = esc(s.heroTitle).replace(/\*\*(.+?)\*\*/g, "<span>$1</span>");
    }
    if (s.heroLead) $("#heroLead").textContent = s.heroLead;
    if (s.heroImage) $("#heroImg").src = imgUrl(s.heroImage, 1100);
    if (s.tagOut) $("#tagOut").textContent = s.tagOut;
    if (s.tagArea) $("#tagArea").textContent = s.tagArea;
    var ann = $("#announce");
    if (s.announcement && String(s.announcement).trim()) { ann.textContent = s.announcement; ann.hidden = false; } else { ann.hidden = true; }
    renderInstagram(s.instagramPosts);
    ADS.id = s.adsId || ADS.id; ADS.label = s.adsLabel || ADS.label;
    initGoogle(s.gaId, s.adsId, s.gtmId);
  }

  function renderInstagram(raw) {
    var posts = String(raw || "").split(/\s+/).filter(function (x) { return /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[\w-]+/.test(x); }).slice(0, 6);
    var sec = $("#instagram");
    if (!posts.length) { sec.hidden = true; return; }
    $("#igGrid").innerHTML = posts.map(function (p) {
      var url = p.split("?")[0].replace(/\/?$/, "/");
      return '<blockquote class="instagram-media" data-instgrm-permalink="' + esc(url) + '" data-instgrm-version="14"><a href="' + esc(url) + '" target="_blank" rel="noopener">Instagram gönderisini görüntüle</a></blockquote>';
    }).join("");
    sec.hidden = false;
    if (window.instgrm) { window.instgrm.Embeds.process(); return; }
    var sc = document.createElement("script"); sc.async = true; sc.src = "https://www.instagram.com/embed.js";
    document.body.appendChild(sc);
  }

  /* ---------- Kategori çipleri ---------- */
  function renderChips() {
    var cats = ["Tümü"].concat(C.CATEGORIES);
    $("#chips").innerHTML = cats.map(function (c) {
      return '<button type="button" class="chip" aria-pressed="' + (c === activeCat) + '" data-chip="' + esc(c) + '">' + esc(c) + "</button>";
    }).join("");
  }
  document.addEventListener("click", function (e) {
    var chip = e.target.closest("[data-chip]");
    if (chip) { activeCat = chip.getAttribute("data-chip"); renderChips(); renderProducts(); }
    var cat = e.target.closest("[data-cat]");
    if (cat) {
      activeCat = cat.getAttribute("data-cat"); renderChips(); renderProducts(); track("category_click", { label: activeCat });
      document.getElementById("urunler").scrollIntoView();
    }
  });
  $("#search").addEventListener("input", renderProducts);

  /* ---------- Ürün kartları ---------- */
  var plusIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  var tickIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4.5 4.5L19 7"/></svg>';

  function norm(s) { return String(s).toLocaleLowerCase("tr-TR"); }

  function renderProducts() {
    var q = norm($("#search").value.trim());
    var list = products.filter(function (p) {
      return (activeCat === "Tümü" || p.cat === activeCat) && (!q || norm(p.name + " " + p.cat).indexOf(q) > -1);
    });
    $("#emptyState").hidden = list.length > 0;
    $("#products").innerHTML = list.map(function (p) {
      var inCart = !!basket[p.id];
      return '<article class="product">' +
        '<div class="product-img"><img src="' + esc(imgUrl(p.img, 600)) + '" alt="' + esc(p.name) + '" loading="lazy" width="600" height="450">' +
        (p.season ? '<span class="season">' + esc(p.season) + "</span>" : "") + "</div>" +
        '<div class="product-label"><h3>' + esc(p.name) + "</h3>" +
        (p.desc ? "<p>" + esc(p.desc) + "</p>" : "") +
        '<div class="label-row"><span>Satış: <b>' + esc(p.sale || p.unit) + '</b></span><span>' + esc(p.cat.replace(" & Bakliyat", "")) + "</span></div>" +
        '<button type="button" class="add-btn" data-add="' + esc(p.id) + '" aria-pressed="' + inCart + '">' +
        (inCart ? tickIcon + "Sepette" : plusIcon + "Teklife ekle") + "</button></div></article>";
    }).join("");
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-add]");
    if (!b) return;
    var id = b.getAttribute("data-add");
    var p = products.find(function (x) { return x.id === id; });
    if (basket[id]) { delete basket[id]; toast(p.name + " sepetten çıkarıldı"); }
    else { basket[id] = { added: Date.now() }; toast(p.name + " teklif sepetine eklendi"); track("add_to_quote", { item_name: p.name }); }
    saveBasket(); renderProducts(); renderBasket();
  });

  /* ---------- Sepet ---------- */
  var removeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function renderBasket() {
    var ids = Object.keys(basket).filter(function (id) { return products.some(function (p) { return p.id === id; }); });
    var n = ids.length;
    $("#cartCount").textContent = n;
    $$("[data-count]").forEach(function (el) { el.textContent = n; });
    $("#basketEmpty").hidden = n > 0;
    $("#basket").innerHTML = ids.map(function (id) {
      var p = products.find(function (x) { return x.id === id; });
      return '<div class="basket-row">' +
        '<img src="' + esc(imgUrl(p.img, 120)) + '" alt="" loading="lazy">' +
        '<div class="name">' + esc(p.name) + "<small>" + esc(p.cat.replace(" & Bakliyat", "")) + "</small></div>" +
        '<button type="button" class="remove" data-remove="' + esc(id) + '" aria-label="' + esc(p.name) + ' ürününü çıkar">' + removeIcon + "</button></div>";
    }).join("");
  }
  document.addEventListener("click", function (e) {
    var r = e.target.closest("[data-remove]");
    if (!r) return;
    delete basket[r.getAttribute("data-remove")];
    saveBasket(); renderBasket(); renderProducts();
  });

  /* ---------- Form ---------- */
  function renderDistricts() {
    $("#district").innerHTML = '<option value="">Seçin</option>' + C.DISTRICTS.map(function (d) { return "<option>" + esc(d) + "</option>"; }).join("");
  }
  function renderDays() {
    var days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    $("#days").innerHTML = days.map(function (d, i) {
      return '<label><input type="checkbox" name="days" value="' + d + '" id="day-' + i + '"' + (i < 6 && i % 2 === 0 ? " checked" : "") + "><span>" + d + "</span></label>";
    }).join("");
  }

  function refNo() {
    var d = new Date();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return "FT-" + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function itemsText() {
    return Object.keys(basket).map(function (id) {
      var p = products.find(function (x) { return x.id === id; });
      if (!p) return null;
      return "- " + p.name;
    }).filter(Boolean).join("\n");
  }

  function utm() {
    try {
      var sp = new URLSearchParams(location.search);
      var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "gclid"];
      var out = keys.filter(function (k) { return sp.get(k); }).map(function (k) { return k + "=" + sp.get(k); });
      if (out.length) { try { sessionStorage.setItem("ft_src", out.join("&")); } catch (e) {} }
      var saved = ""; try { saved = sessionStorage.getItem("ft_src") || ""; } catch (e) {}
      return out.join("&") || saved || (document.referrer ? "ref=" + document.referrer : "doğrudan");
    } catch (e) { return ""; }
  }
  utm();

  $("#quoteForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var err = $("#formError");
    var missing = [];
    [["business", "işletme adı"], ["type", "işletme türü"], ["contact", "yetkili adı"], ["phone", "telefon"], ["district", "ilçe"]].forEach(function (pair) {
      if (!f[pair[0]].value.trim()) missing.push(pair[1]);
    });
    var phoneDigits = f.phone.value.replace(/\D/g, "");
    if (f.phone.value.trim() && phoneDigits.length < 10) missing.push("geçerli bir telefon numarası");
    if (!f.kvkk.checked) missing.push("KVKK onayı");
    if (missing.length) {
      err.textContent = "Göndermeden önce şunları tamamlayın: " + missing.join(", ") + ".";
      err.hidden = false;
      return;
    }
    err.hidden = true;

    var data = {
      ref: refNo(),
      date: new Date().toISOString(),
      business: f.business.value.trim(),
      contact: f.contact.value.trim(),
      phone: f.phone.value.trim(),
      email: f.email.value.trim(),
      type: f.type.value,
      district: f.district.value,
      covers: "",
      days: $$('input[name="days"]:checked').map(function (x) { return x.value; }).join(", "),
      slot: f.slot.value,
      payment: f.payment.value,
      items: itemsText(),
      extra: $("#extraItems").value.trim(),
      pain: f.pain.value.trim(),
      source: utm()
    };

    var btn = $("#submitBtn");
    btn.disabled = true; btn.textContent = "Gönderiliyor…";

    var send = C.FORM_ENDPOINT
      ? fetch(C.FORM_ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({ action: "lead" }, data)) })
      : Promise.resolve();

    send.catch(function () {}).then(function () {
      track("generate_lead", { value: 1, currency: "TRY", business_type: data.type, district: data.district });
      if (ADS.id && ADS.label) { try { window.gtag("event", "conversion", { send_to: ADS.id + "/" + ADS.label }); } catch (e) {} }

      var waMsg = "Merhaba, Fresh Tedarik teklif talebi (" + data.ref + ")\n" +
        "İşletme: " + data.business + " (" + data.type + ", " + data.district + ")\n" +
        "Yetkili: " + data.contact + " · " + data.phone + "\n" +
        "Teslimat: " + (data.days || "-") + " · " + data.slot + "\n" +
        (data.items ? "\nÜrünler:\n" + data.items + "\n" : "") +
        (data.extra ? "\nDiğer: " + data.extra + "\n" : "") +
        "Ödeme: " + data.payment;
      $("#waAfter").href = waLink(waMsg);
      $("#refNo").textContent = data.ref;
      $("#successPhone").textContent = data.phone;
      f.hidden = true;
      $("#success").hidden = false;
      $("#formPanel").scrollIntoView({ block: "start" });
      basket = {}; saveBasket(); renderBasket(); renderProducts();
      btn.disabled = false; btn.textContent = "Teklif talebini gönder";
    });
  });

  $("#newQuote").addEventListener("click", function () {
    $("#quoteForm").reset(); renderDays();
    $("#quoteForm").hidden = false; $("#success").hidden = true;
  });

  /* ---------- Menü ve bildirim ---------- */
  var menuBtn = $("#menuBtn"), nav = $("#nav");
  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); } });

  var toastTimer;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }

  init();
})();
