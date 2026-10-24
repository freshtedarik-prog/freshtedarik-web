/* Yönetim paneli: Google Arama (Search Console) bölümü */
(function () {
  "use strict";
  var A = window.FT_ADMIN;
  var $ = A.$, esc = A.esc, api = A.api, toast = A.toast;
  var days = 28;
  var fmt = function (n) { return Number(n || 0).toLocaleString("tr-TR"); };
  var pct = function (n) { return "%" + (Number(n || 0) * 100).toFixed(1).replace(".", ","); };
  var pos = function (n) { return n ? Number(n).toFixed(1).replace(".", ",") : "–"; };
  var trDate = function (d) { var p = String(d || "").split("-"); return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : ""; };

  function chart(series) {
    var W = 640, H = 220, P = { l: 40, r: 40, t: 10, b: 26 }, n = series.length || 1;
    var maxI = Math.max(4, Math.max.apply(null, series.map(function (s) { return s.impressions; })));
    var maxC = Math.max(2, Math.max.apply(null, series.map(function (s) { return s.clicks; })));
    var x = function (i) { return P.l + (i + 0.5) * ((W - P.l - P.r) / n); };
    var yI = function (v) { return P.t + (H - P.t - P.b) * (1 - v / maxI); };
    var yC = function (v) { return P.t + (H - P.t - P.b) * (1 - v / maxC); };
    var bw = Math.max(2, ((W - P.l - P.r) / n) * 0.62), g = "";
    for (var k = 0; k <= 4; k++) {
      var yy = P.t + (H - P.t - P.b) * (k / 4);
      g += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + yy + '" y2="' + yy + '" stroke="#DDE4D9"/>' +
        '<text x="' + (P.l - 6) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="10" fill="#55655B">' + Math.round(maxI * (1 - k / 4)) + "</text>" +
        '<text x="' + (W - P.r + 6) + '" y="' + (yy + 4) + '" font-size="10" fill="#1E5B3A">' + Math.round(maxC * (1 - k / 4)) + "</text>";
    }
    var bars = series.map(function (s, i) {
      var h = (H - P.t - P.b) * (s.impressions / maxI);
      return '<rect x="' + (x(i) - bw / 2) + '" y="' + (H - P.b - h) + '" width="' + bw + '" height="' + h + '" rx="2" fill="#9FC4AC"><title>' + trDate(s.day) + ": " + s.impressions + " gösterim</title></rect>";
    }).join("");
    var line = '<polyline points="' + series.map(function (s, i) { return x(i) + "," + yC(s.clicks); }).join(" ") + '" fill="none" stroke="#1E5B3A" stroke-width="2.2" stroke-linejoin="round"/>' +
      series.map(function (s, i) { return s.clicks ? '<circle cx="' + x(i) + '" cy="' + yC(s.clicks) + '" r="3.2" fill="#1E5B3A"><title>' + trDate(s.day) + ": " + s.clicks + " tıklama</title></circle>" : ""; }).join("");
    var every = n > 40 ? 14 : n > 14 ? 5 : 1;
    var labels = series.map(function (s, i) {
      if (i % every && i !== n - 1) return "";
      var p = s.day.split("-");
      return '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#55655B">' + p[2] + "." + p[1] + "</text>";
    }).join("");
    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Günlük Google gösterim ve tıklama grafiği">' + g + bars + line + labels + "</svg>";
  }

  function table(rows, label, isPage) {
    if (!rows.length) return '<p class="empty">Bu dönemde henüz veri yok.</p>';
    return '<div class="chart-wrap"><table class="sc-table"><thead><tr><th>' + label + '</th><th class="num">Tıklama</th><th class="num">Gösterim</th><th class="num">Sıra</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var k = isPage ? r.key.replace(/^https?:\/\/(www\.)?freshtedarik\.com/, "") || "/" : r.key;
        return "<tr><td>" + (isPage ? '<a href="' + esc(r.key) + '" target="_blank" rel="noopener">' + esc(k) + "</a>" : esc(k)) + '</td><td class="num">' + fmt(r.clicks) + '</td><td class="num">' + fmt(r.impressions) + '</td><td class="num">' + pos(r.position) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  function sitemapCard(list) {
    var sm = list.find(function (m) { return /sitemap\.xml$/.test(m.path); });
    var status = !sm ? "Henüz gönderilmedi." :
      sm.pending ? "Gönderildi, Google işliyor." :
      sm.errors ? sm.errors + " hata var, kontrol edin." :
      "Okundu. " + (sm.submitted ? sm.submitted + " sayfa bildirildi. " : "") + (sm.lastDownloaded ? "Son okuma: " + new Date(sm.lastDownloaded).toLocaleDateString("tr-TR") : "");
    return '<div class="card"><div class="card-head"><h3>Site Haritası</h3><span class="ok-chip ' + (sm && !sm.errors ? "yes" : "no") + '">' + (sm ? (sm.errors ? "Hatalı" : "Gönderildi") : "Gönderilmedi") + "</span></div>" +
      '<p class="small muted">' + esc(status) + "</p>" +
      '<p class="small muted" style="margin-top:6px">Site haritası, Google\'a sitenizdeki tüm sayfaları (ürün sayfaları ve blog yazıları dahil) bildirir. Yeni sayfalar eklendikçe otomatik güncellenir.</p>' +
      '<div style="margin-top:12px"><button class="btn btn-sm btn-primary" type="button" id="scSubmit">' + (sm ? "Yeniden gönder" : "Site haritasını gönder") + "</button></div></div>";
  }

  function page() {
    A.loading("Google Arama");
    api("searchConsole", { days: days }).then(function (r) {
      if (!r.connected) return notConnected();
      render(r);
    }).catch(function (e) {
      if (/kapalı|Kurulum/i.test(e.message)) return notConnected(e.message);
      A.failed("Google Arama", e.message, page);
    });
  }

  function notConnected(msg) {
    $("#main").innerHTML = '<div class="page-head"><div><h1>Google Arama</h1><p>Sitenizin Google aramalarındaki görünürlüğü.</p></div></div>' +
      '<div class="card stack"><h3>Search Console Bağlantısı Bekleniyor</h3><p class="muted">' + esc(msg || "freshtedarik@gmail.com hesabında freshtedarik.com için doğrulanmış bir Search Console mülkü bulunamadı.") + "</p>" +
      '<p class="small muted">Alan adı Search Console\'da doğrulandıysa birkaç dakika sonra tekrar deneyin.</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" type="button" id="scRetry">Tekrar dene</button><a class="btn btn-line" href="https://search.google.com/search-console" target="_blank" rel="noopener">Search Console\'u aç</a></div></div>';
    $("#scRetry").onclick = page;
  }

  function render(r) {
    var t = r.totals;
    var period = [7, 28, 90].map(function (n) { return '<button type="button" data-scdays="' + n + '" aria-pressed="' + (days === n) + '">' + n + " gün</button>"; }).join("");
    var kpi = function (v, l, hl) { return '<div class="kpi' + (hl ? " hl" : "") + '"><span class="v">' + v + '</span><span class="l">' + l + "</span></div>"; };
    var fresh = !t.impressions;
    $("#main").innerHTML = A.mustChangeNotice() +
      '<div class="page-head"><div><h1>Google Arama</h1><p>' + trDate(r.start) + " – " + trDate(r.end) + ' arası Google aramalarındaki görünürlük. Veriler Google\'dan 2-3 gün gecikmeli gelir.</p></div>' +
      '<div class="period" role="group" aria-label="Dönem">' + period + "</div></div>" +
      (fresh ? '<div class="notice"><span><b>Veriler birikiyor.</b> Site yeni yayına girdiği için Google\'ın sayfaları tarayıp aramalarda göstermesi birkaç gün ile birkaç hafta sürer. Site haritasını gönderdiyseniz beklemek yeterli.</span></div>' : "") +
      '<div class="kpis">' + kpi(fmt(t.clicks), "Google\'dan gelen tıklama", true) + kpi(fmt(t.impressions), "Aramalarda görünme") + kpi(pct(t.ctr), "Tıklama oranı") + kpi(pos(t.position), "Ortalama sıra") + "</div>" +
      '<div class="two"><div class="card"><div class="card-head"><h3>Günlük Görünme ve Tıklama</h3><div class="legend"><span><i style="background:#9FC4AC"></i>Görünme</span><span><i style="background:#1E5B3A"></i>Tıklama</span></div></div><div class="chart-wrap chart">' + chart(r.series) + "</div></div>" +
      sitemapCard(r.sitemaps || []) + "</div>" +
      '<div class="two" style="margin-top:16px"><div class="card"><div class="card-head"><h3>Sizi Bulduran Aramalar</h3></div>' + table(r.queries, "Arama", false) + "</div>" +
      '<div class="card"><div class="card-head"><h3>En Çok Görünen Sayfalar</h3></div>' + table(r.pages, "Sayfa", true) + "</div></div>" +
      '<p class="small muted" style="margin-top:16px">Sıra: aramalarda ortalama kaçıncı sırada çıktığınız (1 = en üst). Ayrıntılı rapor için <a href="https://search.google.com/search-console?resource_id=' + encodeURIComponent(r.site) + '" target="_blank" rel="noopener">Search Console</a>.</p>';
    document.querySelectorAll("[data-scdays]").forEach(function (b) { b.onclick = function () { days = Number(b.getAttribute("data-scdays")); page(); }; });
    $("#scSubmit").onclick = function () {
      var btn = this; btn.disabled = true; btn.textContent = "Gönderiliyor…";
      api("scSitemapSubmit").then(function () { toast("Site haritası Google'a gönderildi"); page(); })
        .catch(function (e) { toast(e.message, true); btn.disabled = false; btn.textContent = "Site haritasını gönder"; });
    };
  }

  A.register("arama", "Google Arama", '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', page, "ozet");
})();
