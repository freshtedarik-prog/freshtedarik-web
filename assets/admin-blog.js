/* Yönetim paneli: Blog bölümü ve GitHub yayın bağlantısı.
   admin.js içindeki window.FT_ADMIN yardımcılarını kullanır. */
(function () {
  "use strict";
  var A = window.FT_ADMIN;
  var $ = A.$, esc = A.esc, api = A.api, toast = A.toast;
  var posts = null, gh = null;

  /* ---------- markdown -> html (build.py ile aynı kurallar) ---------- */
  function inline(t) {
    t = esc(t);
    t = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    t = t.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    return t;
  }
  function md(text) {
    var out = [], para = [], lst = null;
    function flush() {
      if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; }
      if (lst) { out.push("<" + lst.tag + ">" + lst.items.map(function (i) { return "<li>" + inline(i) + "</li>"; }).join("") + "</" + lst.tag + ">"); lst = null; }
    }
    String(text || "").split("\n").forEach(function (line) {
      var l = line.replace(/\s+$/, "");
      if (!l.trim()) { flush(); return; }
      if (l.indexOf("## ") === 0) { flush(); out.push("<h2>" + inline(l.slice(3)) + "</h2>"); return; }
      var m = l.match(/^(\d+)\. (.*)/);
      if (l.indexOf("- ") === 0 || m) {
        if (para.length) flush();
        var tag = m ? "ol" : "ul";
        if (!lst || lst.tag !== tag) { flush(); lst = { tag: tag, items: [] }; }
        lst.items.push(m ? m[2] : l.slice(2)); return;
      }
      if (lst) flush();
      para.push(l.trim());
    });
    flush();
    return out.join("\n");
  }

  function trDate(d) {
    var M = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    var p = String(d || "").split("-"); if (p.length !== 3) return d || "";
    return Number(p[2]) + " " + M[Number(p[1]) - 1] + " " + p[0];
  }
  function siteBase() { return location.href.replace(/admin\.html.*$/, ""); }

  function statusLine() {
    if (!gh || !gh.connected) return "";
    var r = gh.lastRun;
    if (!r) return '<p class="small muted">Yayın bağlantısı hazır.</p>';
    var txt = r.status !== "completed" ? "Son değişiklikler siteye işleniyor…" : (r.conclusion === "success" ? "Son yayın başarıyla tamamlandı." : "Son yayında sorun oluştu. Birkaç dakika sonra tekrar kaydetmeyi deneyin.");
    return '<p class="small muted" id="ghStatus">' + txt + "</p>";
  }

  /* ---------- Blog listesi ---------- */
  function pageBlog() {
    A.loading("Blog");
    api("githubStatus").then(function (s) {
      gh = s;
      if (!s.connected) return renderConnect();
      return api("blogList").then(function (res) { posts = res.posts; renderList(); });
    }).catch(function (e) { A.failed("Blog", e.message, pageBlog); });
  }

  function renderConnect() {
    $("#main").innerHTML = '<div class="page-head"><div><h1>Blog</h1><p>Mutfak Rehberi yazılarını buradan yazıp yayınlayın.</p></div></div>' +
      '<div class="card stack"><h3>Önce Yayın Bağlantısını Kurun</h3><p class="muted">Panelden yazdığınız yazılar sitenin GitHub deposuna kaydedilip otomatik yayınlanır. Bunun için bir kerelik bir GitHub anahtarı gerekiyor.</p>' +
      '<div><button class="btn btn-primary" type="button" data-page="hesap">Bağlantıyı kur</button></div></div>';
  }

  function renderList() {
    var pub = posts.filter(function (p) { return p.status !== "draft"; }).length;
    $("#main").innerHTML = A.mustChangeNotice() +
      '<div class="page-head"><div><h1>Blog</h1><p>' + pub + " yayında, " + (posts.length - pub) + " taslak yazı. Yayınladığınız yazı 2-3 dakika içinde sitede görünür.</p>" + statusLine() + "</div>" +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-line" href="' + siteBase() + 'blog/" target="_blank" rel="noopener">Blogu aç</a>' +
      '<button class="btn btn-primary" type="button" id="newPost"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Yeni yazı</button></div></div>' +
      '<div class="card"><div class="plist">' + (posts.length ? posts.map(function (p, i) {
        var src = A.imgUrl(p.image, 160);
        return '<div class="prow">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : '<span class="noimg"></span>') +
          '<div style="min-width:0"><div class="name">' + esc(p.title) + '</div><div class="sub">' + esc(p.category || "") + " · " + esc(trDate(p.date)) + "</div></div>" +
          '<div class="tags">' + (p.status === "draft" ? '<span class="tag off">Taslak</span>' : '<span class="tag on">Yayında</span>') + "</div><span></span>" +
          '<button class="btn btn-sm btn-line" type="button" data-post="' + i + '">Düzenle</button></div>';
      }).join("") : '<p class="empty">Henüz yazı yok. İlk yazınızı "Yeni yazı" ile oluşturun.</p>') + "</div></div>" +
      '<div class="card" style="margin-top:16px"><h3>İyi Bir Yazı İçin</h3><ul class="small muted" style="margin:10px 0 0;padding-left:1.2em;display:grid;gap:6px">' +
        "<li>Restoran sahibinin veya şefin gerçekten sorduğu bir soruya cevap verin (örn. \"Domates buzdolabına konur mu?\").</li>" +
        "<li>Başlıkta, insanların Google'a yazacağı kelimeleri kullanın.</li>" +
        "<li>Kendi deneyiminizi ekleyin: halde bu hafta ne var, hangi ürün neden pahalandı, mutfakta gördüğünüz yaygın hatalar.</li>" +
        "<li>Yazının sonunda ilgili ürün sayfasına bağlantı verin.</li></ul></div>";
    $("#newPost").onclick = function () { openPost(null); };
    document.querySelectorAll("[data-post]").forEach(function (b) { b.onclick = function () { openPost(posts[Number(b.getAttribute("data-post"))]); }; });
  }

  /* ---------- Yazı editörü ---------- */
  function counter(id, max) {
    var el = $("#" + id), c = $("#" + id + "Count");
    var upd = function () { var n = el.value.length; c.textContent = n + " / " + max; c.style.color = n > max ? "var(--tomato)" : ""; };
    el.addEventListener("input", upd); upd();
  }

  function openPost(p) {
    var isNew = !p;
    p = p ? Object.assign({}, p) : { title: "", category: "Mutfak Rehberi", date: new Date().toISOString().slice(0, 10), status: "published", body: "", image: "", image_alt: "", seo_title: "", description: "" };
    var cats = Array.from(new Set((posts || []).map(function (x) { return x.category; }).filter(Boolean)));
    var bg = document.createElement("div"); bg.className = "drawer-bg";
    var dr = document.createElement("aside"); dr.className = "drawer drawer-wide"; dr.setAttribute("role", "dialog"); dr.setAttribute("aria-label", isNew ? "Yeni yazı" : "Yazıyı düzenle");
    var tb = function (act, label, title) { return '<button class="btn btn-sm btn-line" type="button" data-md="' + act + '" title="' + title + '">' + label + "</button>"; };
    dr.innerHTML = '<div class="drawer-head"><h2>' + (isNew ? "Yeni Yazı" : "Yazıyı Düzenle") + '</h2><button class="icon-btn" type="button" data-close aria-label="Kapat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="drawer-body">' +
        '<div class="field"><label for="bTitle">Başlık</label><input class="input" id="bTitle" value="' + esc(p.title) + '" placeholder="Örn. Restoranlarda Sebze Firesini Azaltmanın 8 Yolu"></div>' +
        '<div class="grid2"><div class="field"><label for="bCat">Kategori</label><input class="input" id="bCat" list="bCats" value="' + esc(p.category || "") + '"><datalist id="bCats">' + cats.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("") + "</datalist></div>" +
        '<div class="field"><label for="bDate">Tarih</label><input class="input" type="date" id="bDate" value="' + esc(p.date || "") + '"></div></div>' +
        A.imagePicker("bImg", p.image, true) +
        '<div class="field"><label for="bAlt">Görsel açıklaması</label><input class="input" id="bAlt" value="' + esc(p.image_alt || "") + '" placeholder="Fotoğrafta ne görünüyor? Örn. Kasada taze domatesler"></div>' +
        '<div class="field"><label for="bBody">Yazı</label>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap">' + tb("h2", "Ara başlık", "Satırı ara başlık yap") + tb("b", "<b>Kalın</b>", "Seçili metni kalın yap") + tb("ul", "• Madde", "Madde işareti ekle") + tb("ol", "1. Numaralı", "Numaralı madde ekle") + tb("a", "Bağlantı", "Seçili metne bağlantı ekle") +
          '<span style="flex:1"></span><button class="btn btn-sm btn-line" type="button" id="bPrevBtn" aria-pressed="false">Önizleme</button></div>' +
          '<textarea class="input" id="bBody" style="min-height:360px;font-size:.97rem;line-height:1.6" placeholder="Yazınızı buraya yazın. Paragraflar arasında boş satır bırakın.">' + esc(p.body || "") + "</textarea>" +
          '<div class="prose article md-preview" id="bPrev" hidden></div>' +
          '<span class="help">## ile başlayan satır ara başlık, - ile başlayan satır madde olur. **iki yıldız** arası kalın yazılır.</span></div>' +
        '<details class="card" style="padding:14px"><summary style="cursor:pointer;font-weight:650">Google görünümü (isteğe bağlı)</summary><div class="stack" style="margin-top:14px">' +
          '<div class="field"><label for="bSeo">Google başlığı <span class="help" id="bSeoCount"></span></label><input class="input" id="bSeo" value="' + esc(p.seo_title && p.seo_title !== p.title ? p.seo_title : "") + '" placeholder="Boş bırakılırsa yazının başlığı kullanılır"></div>' +
          '<div class="field"><label for="bDesc">Google açıklaması <span class="help" id="bDescCount"></span></label><textarea class="input" id="bDesc" style="min-height:70px" placeholder="Arama sonuçlarında başlığın altında görünen 1-2 cümle">' + esc(p.description || "") + "</textarea></div>" +
          '<div class="serp"><span class="serp-url">freshtedarik.com › blog</span><span class="serp-title" id="serpT"></span><span class="serp-desc" id="serpD"></span></div>' +
        "</div></details>" +
        '<div id="bDelZone"></div>' +
      "</div>" +
      '<div class="drawer-foot">' + (isNew ? "<span></span>" : '<button class="btn btn-danger" type="button" id="bDel">Sil</button>') +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end"><button class="btn btn-line" type="button" id="bDraft">Taslak olarak kaydet</button><button class="btn btn-primary" type="button" id="bPub">Yayınla</button></div></div>';
    document.body.appendChild(bg); document.body.appendChild(dr);
    var close = function () { bg.remove(); dr.remove(); document.removeEventListener("keydown", onKey); };
    var onKey = function (e) { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    bg.onclick = close; dr.querySelectorAll("[data-close]").forEach(function (b) { b.onclick = close; });
    A.bindImagePicker(dr, "bImg");
    counter("bSeo", 60); counter("bDesc", 155);

    var ta = $("#bBody", dr);
    var serp = function () {
      $("#serpT", dr).textContent = ($("#bSeo", dr).value || $("#bTitle", dr).value || "Yazı başlığı") + " | Fresh Tedarik";
      $("#serpD", dr).textContent = $("#bDesc", dr).value || "Açıklama yazılmazsa Google sayfadan kendi seçtiği bir bölümü gösterir.";
    };
    ["bSeo", "bDesc", "bTitle"].forEach(function (id) { $("#" + id, dr).addEventListener("input", serp); }); serp();

    dr.querySelectorAll("[data-md]").forEach(function (b) {
      b.onclick = function () {
        var act = b.getAttribute("data-md"), s = ta.selectionStart, e2 = ta.selectionEnd, v = ta.value, sel = v.slice(s, e2);
        var ls = v.lastIndexOf("\n", s - 1) + 1, ins, pos;
        if (act === "b") { ins = "**" + (sel || "kalın metin") + "**"; ta.setRangeText(ins, s, e2, "select"); }
        else if (act === "a") {
          ins = "[" + (sel || "bağlantı metni") + "](../../sebze-meyve-tedarigi/)"; ta.setRangeText(ins, s, e2, "select");
          toast("Parantez içindeki adresi istediğiniz sayfa ile değiştirin.");
        } else {
          var pre = act === "h2" ? "## " : act === "ul" ? "- " : "1. ";
          ta.setRangeText(pre, ls, ls, "end"); pos = s + pre.length; ta.setSelectionRange(pos, pos + (e2 - s));
        }
        ta.focus();
      };
    });
    $("#bPrevBtn", dr).onclick = function () {
      var on = this.getAttribute("aria-pressed") !== "true";
      this.setAttribute("aria-pressed", on); this.textContent = on ? "Düzenlemeye dön" : "Önizleme";
      $("#bPrev", dr).innerHTML = md(ta.value); $("#bPrev", dr).hidden = !on; ta.hidden = on;
    };

    function save(status, btn) {
      var data = {
        slug: isNew ? "" : p.slug, sha: isNew ? "" : p.sha, title: $("#bTitle", dr).value.trim(), category: $("#bCat", dr).value.trim(),
        date: $("#bDate", dr).value, image: $("#bImg", dr).value.trim(), image_alt: $("#bAlt", dr).value.trim(),
        seo_title: $("#bSeo", dr).value.trim(), description: $("#bDesc", dr).value.trim(), body: ta.value, status: status
      };
      if (!data.title) { toast("Başlık yazın.", true); $("#bTitle", dr).focus(); return; }
      if (!data.body.trim()) { toast("Yazı metni boş olamaz.", true); return; }
      if (status === "published" && !data.description) data.description = data.body.replace(/[#*\-\[\]()]/g, "").replace(/\s+/g, " ").trim().slice(0, 150);
      var label = btn.textContent; btn.disabled = true; btn.textContent = "Kaydediliyor…";
      api("blogSave", { post: data }).then(function (res) {
        toast(status === "draft" ? "Taslak kaydedildi" : "Yayınlandı. Siteye 2-3 dakika içinde yansır.");
        close(); pageBlog();
      }).catch(function (e) { toast(e.message, true); btn.disabled = false; btn.textContent = label; });
    }
    $("#bPub", dr).onclick = function () { save("published", this); };
    $("#bDraft", dr).onclick = function () { save("draft", this); };
    if (!isNew) $("#bDel", dr).onclick = function () {
      $("#bDelZone", dr).innerHTML = '<div class="confirm"><p><b>' + esc(p.title) + '</b> kalıcı olarak silinsin mi? Yalnızca yayından kaldırmak istiyorsanız "Taslak olarak kaydet" deyin.</p><div style="display:flex;gap:8px"><button class="btn btn-sm btn-danger" type="button" id="bDelYes">Evet, sil</button><button class="btn btn-sm btn-line" type="button" id="bDelNo">Vazgeç</button></div></div>';
      $("#bDelZone", dr).scrollIntoView({ block: "nearest" });
      $("#bDelNo", dr).onclick = function () { $("#bDelZone", dr).innerHTML = ""; };
      $("#bDelYes", dr).onclick = function () {
        this.disabled = true;
        api("blogDelete", { slug: p.slug, sha: p.sha }).then(function () { toast("Yazı silindi"); close(); pageBlog(); }).catch(function (e) { toast(e.message, true); });
      };
    };
    $("#bTitle", dr).focus();
  }

  /* ---------- Hesap sayfasına GitHub bağlantı kartı ---------- */
  function githubCard(target) {
    target.innerHTML = '<div class="loading"><span class="spin"></span>Bağlantı kontrol ediliyor…</div>';
    api("githubStatus").then(function (s) {
      gh = s;
      target.innerHTML = '<div class="card-head"><h3>Blog Yayın Bağlantısı</h3><span class="ok-chip ' + (s.connected ? "yes" : "no") + '">' + (s.connected ? "Bağlı" : "Bağlı değil") + "</span></div>" +
        '<p class="small muted">Panelden yazılan blog yazıları sitenin GitHub deposuna kaydedilir ve otomatik yayınlanır. Bunun için freshtedarik-prog GitHub hesabından bir anahtar oluşturup buraya yapıştırın.</p>' +
        '<ol class="small" style="margin:12px 0;padding-left:1.2em;display:grid;gap:6px">' +
          '<li>GitHub\'a <b>freshtedarik-prog</b> hesabıyla girip <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">yeni anahtar sayfasını</a> açın.</li>' +
          "<li>Ad: <b>Fresh Tedarik Panel</b>, Süre: <b>1 yıl</b> (veya en uzun seçenek).</li>" +
          "<li>Repository access: <b>Only select repositories</b> → <b>freshtedarik-web</b>.</li>" +
          "<li>Permissions → Repository permissions: <b>Contents: Read and write</b> ve <b>Actions: Read-only</b>.</li>" +
          "<li><b>Generate token</b> deyin, çıkan anahtarı kopyalayıp aşağıya yapıştırın.</li></ol>" +
        '<div class="field"><label for="ghTok">GitHub anahtarı</label><input class="input" type="password" id="ghTok" autocomplete="off" placeholder="' + (s.connected ? "Bağlı. Yenilemek için yeni anahtarı yapıştırın." : "github_pat_…") + '"></div>' +
        '<div><button class="btn btn-primary" type="button" id="ghSave">' + (s.connected ? "Anahtarı yenile" : "Bağlantıyı kur") + "</button></div>";
      $("#ghSave").onclick = function () {
        var btn = this, v = $("#ghTok").value.trim();
        if (!v) { toast("Anahtarı yapıştırın.", true); return; }
        btn.disabled = true; btn.textContent = "Kontrol ediliyor…";
        api("githubSave", { githubToken: v }).then(function () { toast("Blog yayın bağlantısı kuruldu"); githubCard(target); })
          .catch(function (e) { toast(e.message, true); btn.disabled = false; btn.textContent = "Bağlantıyı kur"; });
      };
    }).catch(function (e) { target.innerHTML = '<p class="small muted">' + esc(e.message) + "</p>"; });
  }

  A.register("blog", "Blog", '<path d="M4 4h12l4 4v12H4z"/><path d="M8 10h8M8 14h8M8 18h5"/>', pageBlog, "urunler");
  A.onAccount(function (slot) { githubCard(slot); });
})();
