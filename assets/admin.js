(function () {
  "use strict";
  var API = window.FT_CONFIG.FORM_ENDPOINT;
  var SHEET_URL = "https://docs.google.com/spreadsheets/d/" + window.FT_CONFIG.SHEET_ID + "/edit";
  var CATS = window.FT_CONFIG.CATEGORIES;
  var TOKEN_KEY = "ft_admin_token";

  var state = { token: null, page: "ozet", days: 30, dash: null, leads: null, statuses: [], leadFilter: "Tümü", leadQuery: "", products: null, settings: null, meta: null, mustChange: false };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var fmt = function (n) { return Number(n || 0).toLocaleString("tr-TR"); };

  /* ---------- API ---------- */
  function api(action, data) {
    var body = Object.assign({ action: action, token: state.token }, data || {});
    return fetch(API, { method: "POST", body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.auth === false) { logout(true); throw new Error(res.error); }
        if (!res || !res.ok) throw new Error((res && res.error) || "İşlem tamamlanamadı.");
        return res;
      })
      .catch(function (e) {
        if (e && /Failed to fetch|NetworkError/i.test(e.message)) throw new Error("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
        throw e;
      });
  }

  /* ---------- Bildirim ---------- */
  var tt;
  function toast(msg, isErr) {
    var t = $("#toast");
    t.textContent = msg; t.className = "toast" + (isErr ? " err" : ""); t.hidden = false;
    clearTimeout(tt); tt = setTimeout(function () { t.hidden = true; }, isErr ? 5000 : 2600);
  }

  /* ---------- Giriş ---------- */
  function store(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }

  $("#loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var pw = $("#pw").value, err = $("#loginErr"), btn = $("#loginBtn");
    if (!pw) { err.textContent = "Şifrenizi yazın."; err.hidden = false; return; }
    btn.disabled = true; btn.textContent = "Giriş yapılıyor…"; err.hidden = true;
    api("login", { password: pw }).then(function (res) {
      state.token = res.token; state.mustChange = !!res.mustChange;
      store(TOKEN_KEY, res.token);
      $("#pw").value = "";
      start(res.mustChange ? "hesap" : "ozet");
    }).catch(function (e2) {
      err.textContent = e2.message; err.hidden = false;
    }).then(function () { btn.disabled = false; btn.textContent = "Giriş yap"; });
  });

  function logout(expired) {
    if (state.token && !expired) api("logout").catch(function () {});
    state.token = null; store(TOKEN_KEY, null);
    $("#appView").hidden = true; $("#loginView").hidden = false;
    if (expired) { $("#loginErr").textContent = "Oturumunuz sona erdi. Lütfen tekrar giriş yapın."; $("#loginErr").hidden = false; }
  }
  document.addEventListener("click", function (e) { if (e.target.closest("[data-logout]")) logout(false); });

  /* ---------- Menü ---------- */
  var IC = {
    ozet: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    talepler: '<path d="M4 4h16v12H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
    urunler: '<path d="M12 21c-4.4 0-7-3.2-7-7.2C5 8.6 9.2 5 12 3c2.8 2 7 5.6 7 10.8 0 4-2.6 7.2-7 7.2Z"/><path d="M12 20v-9"/>',
    icerik: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 13h8M8 16h5"/>',
    iletisim: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    google: '<circle cx="12" cy="12" r="9"/><path d="M12 12h8M12 12V3"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>',
    genel: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    hesap: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
  };
  var PAGES = [
    ["ozet", "Özet"], ["talepler", "Teklif Talepleri"], ["urunler", "Ürünler"], ["icerik", "Site İçeriği"],
    ["iletisim", "İletişim Bilgileri"], ["google", "Google"], ["instagram", "Instagram"], ["genel", "Genel Ayarlar"], ["hesap", "Hesap ve Güvenlik"]
  ];
  function icon(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + IC[k] + "</svg>"; }
  function renderNav() {
    var newCount = state.dash ? state.dash.totals.leadsNew : 0;
    var html = PAGES.map(function (p) {
      return '<button class="nav-btn" type="button" data-page="' + p[0] + '"' + (state.page === p[0] ? ' aria-current="page"' : "") + ">" + icon(p[0]) + esc(p[1]) +
        (p[0] === "talepler" && newCount ? '<span class="badge">' + newCount + "</span>" : "") + "</button>";
    }).join("");
    $("#sideNav").innerHTML = html; $("#mobileNav").innerHTML = html;
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-page]");
    if (b) go(b.getAttribute("data-page"));
  });
  function go(page) {
    state.page = page; renderNav(); window.scrollTo(0, 0);
    var r = { ozet: pageDash, talepler: pageLeads, urunler: pageProducts, hesap: pageAccount, google: pageGoogle, instagram: pageInstagram };
    (r[page] || function () { pageSettings(page); })();
  }

  function start(page) {
    $("#loginView").hidden = true; $("#appView").hidden = false;
    go(page || "ozet");
  }

  function loading(title) {
    $("#main").innerHTML = '<div class="page-head"><h1>' + esc(title) + '</h1></div><div class="loading"><span class="spin"></span>Yükleniyor…</div>';
  }
  function failed(title, msg, retry) {
    $("#main").innerHTML = '<div class="page-head"><h1>' + esc(title) + '</h1></div><div class="card"><p>' + esc(msg) + '</p><div style="margin-top:12px"><button class="btn btn-line" type="button" id="retry">Tekrar dene</button></div></div>';
    $("#retry").onclick = retry;
  }
  function mustChangeNotice() {
    return state.mustChange ? '<div class="notice"><span><b>Geçici şifre kullanıyorsunuz.</b> Güvenliğiniz için şifrenizi değiştirin.</span><button class="btn btn-sm btn-primary" type="button" data-page="hesap">Şifreyi değiştir</button></div>' : "";
  }

  /* ---------- ÖZET ---------- */
  function pageDash() {
    loading("Özet");
    api("dashboard", { days: state.days }).then(function (res) {
      state.dash = res; renderNav(); renderDash();
    }).catch(function (e) { failed("Özet", e.message, pageDash); });
  }

  function renderDash() {
    var d = state.dash, t = d.totals;
    var conv = t.views ? ((t.leadsPeriod / t.views) * 100).toFixed(1).replace(".", ",") : "0";
    var period = [7, 30, 90].map(function (n) { return '<button type="button" data-days="' + n + '" aria-pressed="' + (state.days === n) + '">' + n + " gün</button>"; }).join("");
    var kpi = function (v, l, hl) { return '<div class="kpi' + (hl ? " hl" : "") + '"><span class="v">' + v + '</span><span class="l">' + l + "</span></div>"; };
    $("#main").innerHTML = mustChangeNotice() +
      '<div class="page-head"><div><h1>Özet</h1><p>Son ' + d.days + ' günde sitenizde olanlar.</p></div><div class="period" role="group" aria-label="Dönem">' + period + "</div></div>" +
      '<div class="kpis">' +
        kpi(fmt(t.leadsPeriod), "Teklif talebi", true) + kpi(fmt(t.views), "Sayfa görüntüleme") + kpi(fmt(t.visitors), "Tekil ziyaretçi") + kpi("%" + conv, "Ziyaretten talebe dönüşüm") +
        kpi(fmt(t.whatsapp), "WhatsApp tıklaması") + kpi(fmt(t.phone), "Telefon tıklaması") + kpi(fmt(t.addToQuote), "Teklife ürün ekleme") + kpi(fmt(t.instagram), "Instagram tıklaması") +
      "</div>" +
      '<div class="two"><div class="card"><div class="card-head"><h3>Günlük Ziyaret ve Talepler</h3><div class="legend"><span><i style="background:#9FC4AC"></i>Ziyaret</span><span><i style="background:#1E5B3A"></i>Teklif</span><span><i style="background:#F2D64B"></i>WhatsApp + Telefon</span></div></div><div class="chart-wrap chart">' + chart(d.series) + "</div></div>" +
      '<div class="card"><div class="card-head"><h3>Talep Durumları</h3><button class="btn btn-sm btn-line" type="button" data-page="talepler">Talepler</button></div>' + statusBars(d.leadStatus, t.leadsTotal) + "</div></div>" +
      '<div class="two" style="margin-top:16px"><div class="card"><div class="card-head"><h3>En Çok Teklife Eklenen Ürünler</h3></div>' + bars(d.topProducts) + "</div>" +
      '<div class="card"><div class="card-head"><h3>Ziyaretçi Kaynakları</h3></div>' + bars(d.sources) + '<div style="margin-top:18px" class="card-head"><h3>Cihaz</h3></div>' + bars(d.devices) + "</div></div>";
    document.querySelectorAll("[data-days]").forEach(function (b) {
      b.onclick = function () { state.days = Number(b.getAttribute("data-days")); pageDash(); };
    });
  }

  function bars(list) {
    if (!list || !list.length) return '<p class="empty">Bu dönemde henüz veri yok.</p>';
    var max = Math.max.apply(null, list.map(function (x) { return x.count; }));
    return '<div class="bars">' + list.map(function (x) {
      return '<div class="bar-row"><span>' + esc(x.name) + "</span><b>" + fmt(x.count) + '</b><div class="track"><div class="fill" style="width:' + Math.max(3, (x.count / max) * 100) + '%"></div></div></div>';
    }).join("") + "</div>";
  }
  function statusBars(obj, total) {
    var keys = Object.keys(obj || {});
    if (!keys.length) return '<p class="empty">Henüz teklif talebi yok. Siteden gelen talepler burada görünecek.</p>';
    return bars(keys.map(function (k) { return { name: k, count: obj[k] }; }).sort(function (a, b) { return b.count - a.count; })) + '<p class="small muted" style="margin-top:12px">Toplam ' + fmt(total) + " talep</p>";
  }

  function chart(series) {
    var W = 640, H = 220, P = { l: 34, r: 8, t: 10, b: 26 };
    var n = series.length;
    var max = Math.max(4, Math.max.apply(null, series.map(function (s) { return Math.max(s.views, s.clicks, s.leads); })));
    var raw = max / 4, pw = Math.pow(10, Math.floor(Math.log10(raw))); var tick = [1, 2, 2.5, 5, 10].map(function (c) { return c * pw; }).filter(function (c) { return c >= raw && c % 1 === 0; })[0] || Math.ceil(raw); var nice = tick * 4;
    var x = function (i) { return P.l + (i + 0.5) * ((W - P.l - P.r) / n); };
    var y = function (v) { return P.t + (H - P.t - P.b) * (1 - v / nice); };
    var bw = Math.max(2, ((W - P.l - P.r) / n) * 0.62);
    var g = "";
    for (var k = 0; k <= 4; k++) {
      var val = Math.round((nice / 4) * k), yy = y(val);
      g += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + yy + '" y2="' + yy + '" stroke="#DDE4D9" stroke-width="1"/>' +
        '<text x="' + (P.l - 6) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="10" fill="#55655B">' + val + "</text>";
    }
    var b = series.map(function (s, i) {
      var h = (H - P.t - P.b) * (s.views / nice);
      return '<rect x="' + (x(i) - bw / 2) + '" y="' + (H - P.b - h) + '" width="' + bw + '" height="' + h + '" rx="2" fill="#9FC4AC"><title>' + s.day + ": " + s.views + " ziyaret</title></rect>";
    }).join("");
    var line = function (key, color) {
      var pts = series.map(function (s, i) { return x(i) + "," + y(s[key]); }).join(" ");
      var dots = series.map(function (s, i) { return s[key] ? '<circle cx="' + x(i) + '" cy="' + y(s[key]) + '" r="3.2" fill="' + color + '"><title>' + s.day + ": " + s[key] + "</title></circle>" : ""; }).join("");
      return '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linejoin="round"/>' + dots;
    };
    var labels = series.map(function (s, i) {
      var every = n > 40 ? 14 : n > 14 ? 5 : 1;
      if (i % every !== 0 && i !== n - 1) return "";
      var p = s.day.split("-");
      return '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#55655B">' + p[2] + "." + p[1] + "</text>";
    }).join("");
    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Günlük ziyaret, teklif ve tıklama grafiği">' + g + b + line("clicks", "#D9B92B") + line("leads", "#1E5B3A") + labels + "</svg>";
  }

  /* ---------- TALEPLER ---------- */
  function pageLeads() {
    loading("Teklif Talepleri");
    api("leads").then(function (res) { state.leads = res.leads; state.statuses = res.statuses; renderLeads(); })
      .catch(function (e) { failed("Teklif Talepleri", e.message, pageLeads); });
  }
  function stClass(s) { return "st-" + String(s || "Yeni").replace(/\s+/g, "-"); }
  function fmtDate(iso) {
    var d = new Date(iso); if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }
  function renderLeads() {
    var filters = ["Tümü"].concat(state.statuses);
    var q = state.leadQuery.toLocaleLowerCase("tr-TR");
    var list = state.leads.filter(function (l) {
      var st = l["Durum"] || "Yeni";
      var hay = [l["İşletme Adı"], l["Yetkili"], l["Telefon"], l["İlçe"], l["Talep No"]].join(" ").toLocaleLowerCase("tr-TR");
      return (state.leadFilter === "Tümü" || st === state.leadFilter) && (!q || hay.indexOf(q) > -1);
    });
    var counts = {}; state.leads.forEach(function (l) { var s = l["Durum"] || "Yeni"; counts[s] = (counts[s] || 0) + 1; });
    $("#main").innerHTML = mustChangeNotice() +
      '<div class="page-head"><div><h1>Teklif Talepleri</h1><p>Siteden gelen talepler. Durumu güncelleyin, not alın, müşteriyi tek tıkla arayın.</p></div><a class="btn btn-line" href="' + SHEET_URL + '" target="_blank" rel="noopener">Tabloda aç</a></div>' +
      '<div class="toolbar"><input class="input" type="search" id="leadSearch" placeholder="İşletme, kişi, telefon veya ilçe ara" value="' + esc(state.leadQuery) + '"><div class="chips">' +
      filters.map(function (f) { return '<button class="chip" type="button" data-lf="' + esc(f) + '" aria-pressed="' + (state.leadFilter === f) + '">' + esc(f) + (f !== "Tümü" && counts[f] ? " (" + counts[f] + ")" : "") + "</button>"; }).join("") + "</div></div>" +
      (list.length ? list.map(leadCard).join("") : '<div class="card"><p class="empty">' + (state.leads.length ? "Bu filtreye uyan talep yok." : "Henüz teklif talebi yok. Siteden gelen talepler burada listelenecek.") + "</p></div>");
    $("#leadSearch").oninput = function (e) { state.leadQuery = e.target.value; var pos = e.target.selectionStart; renderLeads(); var s = $("#leadSearch"); s.focus(); s.setSelectionRange(pos, pos); };
    document.querySelectorAll("[data-lf]").forEach(function (b) { b.onclick = function () { state.leadFilter = b.getAttribute("data-lf"); renderLeads(); }; });
    document.querySelectorAll("[data-lead-save]").forEach(function (b) { b.onclick = function () { saveLead(Number(b.getAttribute("data-lead-save")), b); }; });
  }
  function leadCard(l) {
    var st = l["Durum"] || "Yeni";
    var phone = String(l["Telefon"] || "");
    var digits = phone.replace(/\D/g, "").replace(/^0/, "90");
    var row = l.row;
    var kv = function (k, v) { return v ? "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>" : ""; };
    return '<details class="lead"><summary><div><b>' + esc(l["İşletme Adı"]) + '</b><div class="meta">' + esc(l["İşletme Türü"] || "") + " · " + esc(l["İlçe"] || "") + " · " + fmtDate(l["Tarih"]) + '</div></div><span class="status ' + stClass(st) + '">' + esc(st) + "</span></summary>" +
      '<div class="lead-body"><div><dl class="kv">' +
        kv("Talep No", l["Talep No"]) + kv("Yetkili", l["Yetkili"]) + kv("Telefon", phone) + kv("E-posta", l["E-posta"]) +
        kv("Teslimat", [l["Teslimat Günleri"], l["Saat Aralığı"]].filter(Boolean).join(" · ")) + kv("Ödeme", l["Ödeme Tercihi"]) +
        kv("Ürünler", l["Seçilen Ürünler"] || l["Ürünler ve Haftalık Miktar"]) + kv("Tedarik sorunu", l["Mevcut Tedarikçi Sorunu"]) + kv("Kaynak", l["Kaynak (utm/gclid)"]) +
      '</dl><div class="lead-actions">' +
        (phone ? '<a class="btn btn-sm btn-primary" href="tel:' + esc(phone.replace(/\s/g, "")) + '">Ara</a><a class="btn btn-sm btn-line" href="https://wa.me/' + esc(digits) + '" target="_blank" rel="noopener">WhatsApp</a>' : "") +
      '</div></div><div class="stack">' +
        '<div class="grid2"><div class="field"><label for="st-' + row + '">Durum</label><select class="input" id="st-' + row + '">' + state.statuses.map(function (s) { return "<option" + (s === st ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label for="am-' + row + '">Teklif tutarı (₺)</label><input class="input" id="am-' + row + '" inputmode="decimal" value="' + esc(l["Teklif Tutarı (₺)"] || "") + '"></div></div>' +
        '<div class="field"><label for="ow-' + row + '">Sorumlu</label><input class="input" id="ow-' + row + '" value="' + esc(l["Sorumlu"] || "") + '"></div>' +
        '<div class="field"><label for="nt-' + row + '">İç notlar</label><textarea class="input" id="nt-' + row + '" placeholder="Görüşme notları, haftalık miktarlar, fiyat bilgisi">' + esc(l["İç Notlar"] || "") + "</textarea></div>" +
        '<div><button class="btn btn-primary" type="button" data-lead-save="' + row + '">Kaydet</button></div>' +
      "</div></div></details>";
  }
  function saveLead(row, btn) {
    btn.disabled = true; btn.textContent = "Kaydediliyor…";
    var data = { row: row, status: $("#st-" + row).value, amount: $("#am-" + row).value, owner: $("#ow-" + row).value, note: $("#nt-" + row).value };
    api("leadUpdate", data).then(function () {
      var l = state.leads.find(function (x) { return x.row === row; });
      if (l) { l["Durum"] = data.status; l["Teklif Tutarı (₺)"] = data.amount; l["Sorumlu"] = data.owner; l["İç Notlar"] = data.note; }
      if (state.dash) state.dash = null;
      toast("Talep kaydedildi");
      renderLeads();
    }).catch(function (e) { toast(e.message, true); btn.disabled = false; btn.textContent = "Kaydet"; });
  }

  /* ---------- ÜRÜNLER ---------- */
  function pageProducts() {
    loading("Ürünler");
    api("products").then(function (res) { state.products = res.products; renderProducts(); })
      .catch(function (e) { failed("Ürünler", e.message, pageProducts); });
  }
  function imgUrl(v, w) {
    v = String(v || "").trim(); if (!v) return "";
    if (/^\d+$/.test(v)) return "https://images.pexels.com/photos/" + v + "/pexels-photo-" + v + ".jpeg?auto=compress&cs=tinysrgb&w=" + (w || 200);
    return v;
  }
  var prodFilter = "Tümü", prodQuery = "";
  function renderProducts() {
    var q = prodQuery.toLocaleLowerCase("tr-TR");
    var list = state.products.filter(function (p) { return (prodFilter === "Tümü" || p.cat === prodFilter) && (!q || p.name.toLocaleLowerCase("tr-TR").indexOf(q) > -1); });
    $("#main").innerHTML = mustChangeNotice() +
      '<div class="page-head"><div><h1>Ürünler</h1><p>' + state.products.length + " ürün. Değişiklikler sitede birkaç dakika içinde görünür.</p></div>" +
      '<button class="btn btn-primary" type="button" id="newProd"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Yeni ürün</button></div>' +
      '<div class="toolbar"><input class="input" type="search" id="prodSearch" placeholder="Ürün ara" value="' + esc(prodQuery) + '"><div class="chips">' +
      ["Tümü"].concat(CATS).map(function (c) { return '<button class="chip" type="button" data-pf="' + esc(c) + '" aria-pressed="' + (prodFilter === c) + '">' + esc(c) + "</button>"; }).join("") + "</div></div>" +
      '<div class="card"><div class="plist">' + (list.length ? list.map(function (p) {
        var src = imgUrl(p.img, 160);
        return '<div class="prow">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : '<span class="noimg"></span>') +
          '<div style="min-width:0"><div class="name">' + esc(p.name) + '</div><div class="sub">' + esc(p.cat) + " · " + esc(p.sale || p.unit) + " · Sıra " + esc(p.order) + "</div></div>" +
          '<div class="tags">' + (p.live ? '<span class="tag on">Yayında</span>' : '<span class="tag off">Gizli</span>') + (p.featured ? '<span class="tag star">Öne çıkan</span>' : "") + "</div>" +
          '<label class="switch" title="Sitede göster"><input type="checkbox" data-live="' + esc(p.id) + '"' + (p.live ? " checked" : "") + '><span class="track"></span></label>' +
          '<button class="btn btn-sm btn-line" type="button" data-edit="' + esc(p.id) + '">Düzenle</button></div>';
      }).join("") : '<p class="empty">Ürün bulunamadı.</p>') + "</div></div>";
    $("#newProd").onclick = function () { openProduct(null); };
    $("#prodSearch").oninput = function (e) { prodQuery = e.target.value; var pos = e.target.selectionStart; renderProducts(); var s = $("#prodSearch"); s.focus(); s.setSelectionRange(pos, pos); };
    document.querySelectorAll("[data-pf]").forEach(function (b) { b.onclick = function () { prodFilter = b.getAttribute("data-pf"); renderProducts(); }; });
    document.querySelectorAll("[data-edit]").forEach(function (b) { b.onclick = function () { openProduct(b.getAttribute("data-edit")); }; });
    document.querySelectorAll("[data-live]").forEach(function (c) {
      c.onchange = function () {
        var p = state.products.find(function (x) { return x.id === c.getAttribute("data-live"); });
        var copy = Object.assign({}, p, { live: c.checked });
        c.disabled = true;
        api("productSave", { product: copy }).then(function (res) { state.products = res.products; toast(p.name + (c.checked ? " yayında" : " gizlendi")); renderProducts(); })
          .catch(function (e) { toast(e.message, true); c.checked = !c.checked; c.disabled = false; });
      };
    });
  }

  function openProduct(id) {
    var p = id ? Object.assign({}, state.products.find(function (x) { return x.id === id; })) : { cat: prodFilter !== "Tümü" ? prodFilter : CATS[0], unit: "kg", sale: "Kasa / Kg", season: "Tüm yıl", live: true, featured: false };
    var bg = document.createElement("div"); bg.className = "drawer-bg";
    var dr = document.createElement("aside"); dr.className = "drawer"; dr.setAttribute("role", "dialog"); dr.setAttribute("aria-label", id ? "Ürünü düzenle" : "Yeni ürün");
    var units = ["kg", "kasa", "adet", "bağ", "çuval", "paket", "koli"];
    dr.innerHTML = '<div class="drawer-head"><h2>' + (id ? esc(p.name) : "Yeni Ürün") + '</h2><button class="icon-btn" type="button" data-close aria-label="Kapat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="drawer-body">' +
        imagePicker("pImg", p.img, false) +
        '<div class="field"><label for="pName">Ürün adı</label><input class="input" id="pName" value="' + esc(p.name || "") + '" placeholder="Örn. Çarliston Biber"></div>' +
        '<div class="grid2"><div class="field"><label for="pCat">Kategori</label><select class="input" id="pCat">' + CATS.map(function (c) { return "<option" + (c === p.cat ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label for="pUnit">Birim</label><select class="input" id="pUnit">' + units.map(function (u) { return "<option" + (u === p.unit ? " selected" : "") + ">" + u + "</option>"; }).join("") + "</select></div></div>" +
        '<div class="grid2"><div class="field"><label for="pSale">Satış şekli</label><input class="input" id="pSale" value="' + esc(p.sale || "") + '" placeholder="Kasa / Kg"></div>' +
        '<div class="field"><label for="pSeason">Sezon</label><input class="input" id="pSeason" value="' + esc(p.season || "") + '" placeholder="Tüm yıl"></div></div>' +
        '<div class="field"><label for="pDesc">Kısa açıklama</label><textarea class="input" id="pDesc" maxlength="400" placeholder="Ürünün mutfakta nerede kullanıldığını anlatan 1-2 cümle">' + esc(p.desc || "") + '</textarea><span class="help">Google aramalarında görünürlük için ürün adını ve kullanım alanını içeren özgün bir cümle yazın.</span></div>' +
        '<div class="grid2"><div class="field"><label for="pOrigin">Menşei <span class="help">(isteğe bağlı)</span></label><input class="input" id="pOrigin" value="' + esc(p.origin || "") + '" placeholder="Örn. Antalya"></div>' +
        '<div class="field"><label for="pOrder">Sıra</label><input class="input" id="pOrder" type="number" min="1" value="' + esc(p.order && p.order !== 999 ? p.order : "") + '" placeholder="Otomatik"></div></div>' +
        '<label class="switch"><input type="checkbox" id="pLive"' + (p.live !== false ? " checked" : "") + '><span class="track"></span>Sitede yayında</label>' +
        '<label class="switch"><input type="checkbox" id="pFeat"' + (p.featured ? " checked" : "") + '><span class="track"></span>Öne çıkan ürün</label>' +
        '<div id="delZone"></div>' +
      "</div>" +
      '<div class="drawer-foot">' + (id ? '<button class="btn btn-danger" type="button" id="pDel">Ürünü sil</button>' : "<span></span>") +
        '<div style="display:flex;gap:10px"><button class="btn btn-line" type="button" data-close>Vazgeç</button><button class="btn btn-primary" type="button" id="pSave">' + (id ? "Kaydet" : "Ürünü ekle") + "</button></div></div>";
    document.body.appendChild(bg); document.body.appendChild(dr);
    var close = function () { bg.remove(); dr.remove(); document.removeEventListener("keydown", onKey); };
    var onKey = function (e) { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    bg.onclick = close; dr.querySelectorAll("[data-close]").forEach(function (b) { b.onclick = close; });
    bindImagePicker(dr, "pImg");
    $("#pName", dr).focus();

    $("#pSave", dr).onclick = function () {
      var btn = this;
      var data = {
        id: p.id, name: $("#pName", dr).value.trim(), cat: $("#pCat", dr).value, unit: $("#pUnit", dr).value, sale: $("#pSale", dr).value.trim(),
        season: $("#pSeason", dr).value.trim(), desc: $("#pDesc", dr).value.trim(), origin: $("#pOrigin", dr).value.trim(), order: $("#pOrder", dr).value,
        img: $("#pImg", dr).value.trim(), live: $("#pLive", dr).checked, featured: $("#pFeat", dr).checked
      };
      if (!data.name) { toast("Ürün adını yazın.", true); $("#pName", dr).focus(); return; }
      btn.disabled = true; btn.textContent = "Kaydediliyor…";
      api("productSave", { product: data }).then(function (res) {
        state.products = res.products; toast(id ? "Ürün güncellendi" : "Ürün eklendi"); close(); renderProducts();
      }).catch(function (e) { toast(e.message, true); btn.disabled = false; btn.textContent = id ? "Kaydet" : "Ürünü ekle"; });
    };
    if (id) $("#pDel", dr).onclick = function () {
      $("#delZone", dr).innerHTML = '<div class="confirm"><p><b>' + esc(p.name) + '</b> kalıcı olarak silinsin mi? Sadece gizlemek istiyorsanız "Sitede yayında" anahtarını kapatın.</p><div style="display:flex;gap:8px"><button class="btn btn-sm btn-danger" type="button" id="delYes">Evet, sil</button><button class="btn btn-sm btn-line" type="button" id="delNo">Vazgeç</button></div></div>';
      $("#delZone", dr).scrollIntoView({ block: "nearest" });
      $("#delNo", dr).onclick = function () { $("#delZone", dr).innerHTML = ""; };
      $("#delYes", dr).onclick = function () {
        this.disabled = true;
        api("productDelete", { id: p.id }).then(function (res) { state.products = res.products; toast("Ürün silindi"); close(); renderProducts(); })
          .catch(function (e) { toast(e.message, true); });
      };
    };
  }

  /* ---------- Görsel seçici ---------- */
  function imagePicker(id, val, wide) {
    var src = imgUrl(val, 600);
    return '<div class="field"><label>Fotoğraf</label><div class="imgpick"><div class="prev' + (wide ? " wide" : "") + '" id="' + id + 'Prev" style="background-image:' + (src ? "url('" + esc(src) + "')" : "none") + '"></div>' +
      '<div class="acts"><label class="btn btn-line" style="cursor:pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>Fotoğraf yükle<input type="file" accept="image/*" id="' + id + 'File" hidden></label>' +
      '<input class="input" id="' + id + '" value="' + esc(val || "") + '" placeholder="veya görsel adresi yapıştırın">' +
      '<span class="help" id="' + id + 'Status">Telefonla çektiğiniz fotoğrafı doğrudan yükleyebilirsiniz; otomatik küçültülür.</span></div></div></div>';
  }
  function bindImagePicker(root, id) {
    var input = $("#" + id, root), prev = $("#" + id + "Prev", root), file = $("#" + id + "File", root), status = $("#" + id + "Status", root);
    input.oninput = function () { var s = imgUrl(input.value, 600); prev.style.backgroundImage = s ? "url('" + s + "')" : "none"; };
    file.onchange = function () {
      var f = file.files && file.files[0]; if (!f) return;
      status.textContent = "Fotoğraf hazırlanıyor…";
      resizeImage(f, 1600).then(function (b64) {
        status.textContent = "Yükleniyor…";
        return api("upload", { data: b64, mime: "image/jpeg", name: f.name.replace(/\.[^.]+$/, "") + ".jpg" });
      }).then(function (res) {
        input.value = res.url; prev.style.backgroundImage = "url('" + res.url + "')";
        status.textContent = "Yüklendi. Kaydetmeyi unutmayın.";
      }).catch(function (e) { status.textContent = e.message; toast(e.message, true); });
      file.value = "";
    };
  }
  function resizeImage(file, max) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL("image/jpeg", 0.85).split(",")[1]);
      };
      img.onerror = function () { rej(new Error("Bu dosya açılamadı. JPG veya PNG bir fotoğraf seçin.")); };
      img.src = url;
    });
  }

  /* ---------- AYARLAR ---------- */
  var GROUP_INFO = {
    icerik: ["Site İçeriği", "Ana sayfadaki başlık, açıklama, büyük fotoğraf, sarı etiket ve duyuru bandı."],
    iletisim: ["İletişim Bilgileri", "Sitedeki tüm telefon, WhatsApp, e-posta ve adres bağlantıları buradan güncellenir."],
    genel: ["Genel Ayarlar", "Firma bilgileri, hizmet bölgesi ve teklif bildirimlerinin gideceği adresler."],
    google: ["Google", ""], instagram: ["Instagram", ""]
  };
  function loadSettings() {
    if (state.settings) return Promise.resolve();
    return api("settings").then(function (res) { state.settings = res.settings; state.meta = res.meta; });
  }
  function fieldFor(m) {
    var v = state.settings[m.key] || "";
    if (m.key === "heroImage") return imagePicker("s_heroImage", v, true);
    var long = /heroLead|instagramPosts|address|announcement|notifyEmails|districts/.test(m.key);
    return '<div class="field"><label for="s_' + m.key + '">' + esc(m.label) + "</label>" +
      (long ? '<textarea class="input" id="s_' + m.key + '">' + esc(v) + "</textarea>" : '<input class="input" id="s_' + m.key + '" value="' + esc(v) + '">') +
      (m.help ? '<span class="help">' + esc(m.help) + "</span>" : "") + "</div>";
  }
  function pageSettings(group, extraTop, extraBottom) {
    var info = GROUP_INFO[group];
    loading(info[0]);
    loadSettings().then(function () {
      var metas = state.meta.filter(function (m) { return m.group === group; });
      $("#main").innerHTML = mustChangeNotice() +
        '<div class="page-head"><div><h1>' + esc(info[0]) + "</h1>" + (info[1] ? "<p>" + esc(info[1]) + "</p>" : "") + "</div></div>" +
        (extraTop || "") +
        '<div class="card stack">' + metas.map(fieldFor).join("") + "</div>" +
        (extraBottom || "") +
        '<div class="save-bar"><button class="btn btn-primary" type="button" id="saveSettings">Değişiklikleri kaydet</button></div>';
      if ($("#s_heroImage")) bindImagePicker(document, "s_heroImage");
      $("#saveSettings").onclick = function () {
        var btn = this, out = {};
        metas.forEach(function (m) { var el = $("#s_" + m.key); if (el) out[m.key] = el.value.trim(); });
        btn.disabled = true; btn.textContent = "Kaydediliyor…";
        api("settingsSave", { settings: out }).then(function (res) {
          state.settings = res.settings; toast("Kaydedildi. Sitede birkaç dakika içinde görünür.");
          go(state.page);
        }).catch(function (e) { toast(e.message, true); btn.disabled = false; btn.textContent = "Değişiklikleri kaydet"; });
      };
    }).catch(function (e) { failed(info[0], e.message, function () { pageSettings(group, extraTop, extraBottom); }); });
  }

  function pageGoogle() {
    loading("Google");
    loadSettings().then(function () {
      var s = state.settings;
      var card = function (title, ok, desc, links) {
        return '<div class="int"><div class="int-top"><b>' + title + '</b><span class="ok-chip ' + (ok ? "yes" : "no") + '">' + (ok ? "Bağlı" : "Bağlı değil") + '</span></div><p class="small muted">' + desc + "</p><div style=\"display:flex;gap:14px;flex-wrap:wrap\">" + links + "</div></div>";
      };
      var lk = function (href, t) { return '<a href="' + href + '" target="_blank" rel="noopener">' + t + "</a>"; };
      GROUP_INFO.google[1] = "Analytics, Ads ve Tag Manager kimliklerini girdiğinizde ölçüm kodları siteye otomatik eklenir.";
      var top = '<div class="int-grid" style="margin-bottom:16px">' +
        card("Google Analytics 4", /^G-/.test(s.gaId), "Ziyaretçi, kaynak ve dönüşüm raporları. Teklif formu \"generate_lead\" olayı olarak gönderilir.", lk("https://analytics.google.com/", "Analytics'i aç")) +
        card("Google Ads", /^AW-/.test(s.adsId), "Reklamdan gelen teklif taleplerini dönüşüm olarak sayar. Etiket girilirse form gönderimi dönüşüm olur.", lk("https://ads.google.com/", "Ads'i aç")) +
        card("Search Console", !!s.searchConsole, "Google aramalarındaki görünürlük. Alan adı bağlandıktan sonra doğrulanır.", lk("https://search.google.com/search-console", "Search Console'u aç")) +
        card("Google İşletme Profili", false, "Haritalarda ve \"yakınımdaki sebze tedarikçisi\" aramalarında görünmek için.", lk("https://business.google.com/", "İşletme Profilini aç")) +
        "</div>";
      var bottom = '<div class="card" style="margin-top:16px"><h3>Panelinizdeki tıklama verileri</h3><p class="small muted" style="margin-top:6px">Özet sayfasındaki ziyaret ve tıklama sayıları, Google\'dan bağımsız olarak sitenin kendi sayacıyla tutulur ve tablodaki <b>Etkinlikler</b> sekmesine kaydedilir. Google Analytics bağlandığında ayrıntılı raporları Analytics\'te de görebilirsiniz.</p></div>';
      pageSettings("google", top, bottom);
    }).catch(function (e) { failed("Google", e.message, pageGoogle); });
  }

  function pageInstagram() {
    loading("Instagram");
    loadSettings().then(function () {
      var u = (state.settings.instagram || "").replace(/^@/, "");
      var posts = String(state.settings.instagramPosts || "").split(/\s+/).filter(function (x) { return /instagram\.com\/(p|reel)\//.test(x); });
      GROUP_INFO.instagram[1] = "Instagram hesabınız sitenin iletişim ve alt bölümünde görünür. Seçtiğiniz gönderiler ana sayfada \"Instagram'da Biz\" bölümünde gösterilir.";
      var top = '<div class="card" style="margin-bottom:16px"><div class="card-head"><h3>' + (u ? "@" + esc(u) : "Hesap girilmedi") + "</h3>" + (u ? '<a class="btn btn-sm btn-line" href="https://www.instagram.com/' + esc(u) + '/" target="_blank" rel="noopener">Profili aç</a>' : "") + "</div>" +
        '<p class="small muted">Sitede gösterilen gönderi: <b>' + posts.length + '</b>. Gönderi eklemek için Instagram\'da gönderiyi açın, "Bağlantıyı kopyala" deyin ve aşağıdaki kutuya her satıra bir bağlantı gelecek şekilde yapıştırın.</p>' +
        (posts.length ? '<div class="ig-list" style="margin-top:12px">' + posts.map(function (p) { return '<div class="ig-item"><span>' + esc(p) + '</span><a href="' + esc(p) + '" target="_blank" rel="noopener">Aç</a></div>'; }).join("") + "</div>" : "") +
        "</div>";
      var bottom = '<div class="card" style="margin-top:16px"><h3>Instagram istatistikleri</h3><p class="small muted" style="margin-top:6px">Siteden Instagram profilinize yapılan tıklamalar Özet sayfasında görünür. Takipçi ve gönderi istatistiklerini panele çekmek için Meta (Facebook) işletme hesabı ile Instagram Graph API bağlantısı gerekir; bunu sonraki aşamada kurabiliriz.</p></div>';
      pageSettings("instagram", top, bottom);
    }).catch(function (e) { failed("Instagram", e.message, pageInstagram); });
  }

  /* ---------- HESAP ---------- */
  function pageAccount() {
    $("#main").innerHTML = mustChangeNotice() +
      '<div class="page-head"><div><h1>Hesap ve Güvenlik</h1><p>Panel şifresi ve sitenin altyapısına hızlı bağlantılar.</p></div></div>' +
      '<div class="two"><div class="card stack"><h3>Şifreyi Değiştir</h3>' +
        '<div class="field"><label for="pwCur">Mevcut şifre</label><input class="input" type="password" id="pwCur" autocomplete="current-password"></div>' +
        '<div class="field"><label for="pwNew">Yeni şifre</label><input class="input" type="password" id="pwNew" autocomplete="new-password"><span class="help">En az 8 karakter.</span></div>' +
        '<div class="field"><label for="pwNew2">Yeni şifre (tekrar)</label><input class="input" type="password" id="pwNew2" autocomplete="new-password"></div>' +
        '<div><button class="btn btn-primary" type="button" id="pwSave">Şifreyi değiştir</button></div></div>' +
      '<div class="card stack"><h3>Altyapı</h3>' +
        '<a class="btn btn-line" href="' + SHEET_URL + '" target="_blank" rel="noopener">Google Tablosu (ürünler, talepler, ayarlar)</a>' +
        '<a class="btn btn-line" href="https://github.com/freshtedarik-prog/freshtedarik-web" target="_blank" rel="noopener">GitHub deposu</a>' +
        '<a class="btn btn-line" href="https://script.google.com/home" target="_blank" rel="noopener">Apps Script projeleri</a>' +
        '<p class="small muted">Panel, freshtedarik@gmail.com hesabındaki tabloya ve Drive\'daki "Fresh Tedarik Site Görselleri" klasörüne kaydeder.</p></div></div>';
    $("#pwSave").onclick = function () {
      var btn = this, a = $("#pwCur").value, b = $("#pwNew").value, c = $("#pwNew2").value;
      if (b !== c) { toast("Yeni şifreler aynı değil.", true); return; }
      if (b.length < 8) { toast("Yeni şifre en az 8 karakter olmalı.", true); return; }
      btn.disabled = true;
      api("passwordChange", { current: a, next: b }).then(function () {
        state.mustChange = false; toast("Şifreniz değiştirildi"); pageAccount();
      }).catch(function (e) { toast(e.message, true); btn.disabled = false; });
    };
  }

  /* ---------- Açılış ---------- */
  var saved = read(TOKEN_KEY);
  if (saved) { state.token = saved; start("ozet"); }
})();
