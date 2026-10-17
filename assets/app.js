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

  /* ---------- Analytics (yalnızca ID girildiyse) ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  if (C.GA_ID || C.ADS_ID) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + (C.GA_ID || C.ADS_ID);
    document.head.appendChild(s);
    gtag("js", new Date());
    if (C.GA_ID) gtag("config", C.GA_ID);
    if (C.ADS_ID) gtag("config", C.ADS_ID);
  }
  function track(name, params) {
    try { window.gtag("event", name, params || {}); } catch (e) {}
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

  /* ---------- Ürünleri yükle ---------- */
  function fromSheet() {
    var url = "https://docs.google.com/spreadsheets/d/" + C.SHEET_ID + "/gviz/tq?tqx=out:json&sheet=" + encodeURIComponent(C.PRODUCTS_SHEET) + "&headers=1";
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("sheet");
      return r.text();
    }).then(function (txt) {
      var json = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
      var cols = json.table.cols.map(function (c) { return (c.label || "").trim(); });
      var idx = function (name) { return cols.indexOf(name); };
      var get = function (row, name) { var i = idx(name); var cell = i > -1 ? row.c[i] : null; return cell ? (cell.f != null && typeof cell.v !== "string" ? cell.v : cell.v) : ""; };
      var list = json.table.rows.map(function (row) {
        return {
          id: get(row, "ID"), cat: get(row, "Kategori"), name: get(row, "Ürün Adı"),
          unit: get(row, "Birim") || "kg", sale: get(row, "Satış Şekli"), season: get(row, "Sezon"),
          desc: get(row, "Kısa Açıklama"), img: get(row, "Görsel URL"),
          featured: String(get(row, "Öne Çıkan")).toLowerCase() === "evet",
          live: String(get(row, "Yayında")).toLowerCase() === "evet",
          order: Number(get(row, "Sıra")) || 999
        };
      }).filter(function (p) { return p.id && p.name && p.live; });
      if (!list.length) throw new Error("empty");
      list.sort(function (a, b) { return a.order - b.order; });
      return list;
    });
  }

  function init() {
    loadBasket();
    renderChips();
    renderDistricts();
    renderDays();
    var waText = "Merhaba, Fresh Tedarik ürünleri için fiyat teklifi almak istiyorum.";
    ["waContact", "waBar"].forEach(function (id) { var a = document.getElementById(id); if (a) a.href = waLink(waText); });
    $("#year").textContent = new Date().getFullYear();

    products = window.FT_FALLBACK_PRODUCTS.slice();
    renderProducts();
    renderBasket();
    fromSheet().then(function (list) {
      products = list;
      renderChips();
      renderProducts();
      renderBasket();
    }).catch(function () { /* yedek liste kullanılıyor */ });
  }

  function waLink(text) { return "https://wa.me/" + C.WHATSAPP + "?text=" + encodeURIComponent(text); }

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
      activeCat = cat.getAttribute("data-cat"); renderChips(); renderProducts();
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
      ? fetch(C.FORM_ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
      : Promise.resolve();

    send.catch(function () {}).then(function () {
      track("generate_lead", { value: 1, currency: "TRY", business_type: data.type, district: data.district });
      if (C.ADS_ID && C.ADS_LEAD_LABEL) track("conversion", { send_to: C.ADS_ID + "/" + C.ADS_LEAD_LABEL });

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
