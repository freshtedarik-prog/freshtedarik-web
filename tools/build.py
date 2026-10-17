#!/usr/bin/env python3
"""Fresh Tedarik statik sayfa üretici.

Çalıştır:  python3 tools/build.py
- Ürünleri assets/config.js içindeki yedek listeden okur
- index.html'deki ürün kartlarını HTML olarak gömer (Google JavaScript'siz de görsün diye)
- Kategori ve hizmet bölgesi açılış sayfalarını üretir
- Eski Wix adreslerine yönlendirme sayfaları yazar
- sitemap.xml'i günceller
"""
import json, re, html, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://www.freshtedarik.com"
TODAY = datetime.date.today().isoformat()
WA = "905301141344"
PHONE = "0530 114 13 44"

cfg = (ROOT / "assets/config.js").read_text(encoding="utf-8")
PRODUCTS = [json.loads(l.strip().rstrip(",")) for l in cfg.split("FT_FALLBACK_PRODUCTS = [", 1)[1].splitlines() if l.strip().startswith("{")]

# Panel ürünlerini (Google Tablosu) okumayı dene; olmazsa config.js'deki yedek liste kullanılır
try:
    import urllib.request
    _ep = re.search(r'FORM_ENDPOINT:\s*"([^"]+)"', cfg).group(1)
    with urllib.request.urlopen(_ep + "?action=public", timeout=30) as _r:
        _res = json.loads(_r.read().decode("utf-8"))
    if _res.get("ok") and _res.get("products"):
        PRODUCTS = [{k: p.get(k) for k in ("id", "cat", "name", "unit", "sale", "season", "desc", "img", "featured")} for p in _res["products"]]
        _lines = ",\n".join("  " + json.dumps(p, ensure_ascii=False) for p in PRODUCTS)
        cfg = cfg.split("window.FT_FALLBACK_PRODUCTS = [", 1)[0] + "window.FT_FALLBACK_PRODUCTS = [\n" + _lines + "\n];\n"
        (ROOT / "assets/config.js").write_text(cfg, encoding="utf-8")
        print("ürünler panelden alındı:", len(PRODUCTS))
except Exception as _err:
    print("panel ürünleri alınamadı, yedek liste kullanılıyor:", _err)
DISTRICTS = re.search(r"DISTRICTS:\s*\[(.*?)\]", cfg, re.S).group(1)
DISTRICTS = [d.strip().strip('"') for d in DISTRICTS.split(",")]
ANADOLU = {"Adalar", "Ataşehir", "Beykoz", "Çekmeköy", "Kadıköy", "Kartal", "Maltepe", "Pendik", "Sancaktepe", "Sultanbeyli", "Şile", "Tuzla", "Ümraniye", "Üsküdar"}

e = lambda s: html.escape(str(s), quote=True)


def img(v, w=600):
    v = str(v).strip()
    if v.isdigit():
        return f"https://images.pexels.com/photos/{v}/pexels-photo-{v}.jpeg?auto=compress&cs=tinysrgb&w={w}"
    return v


def card(p, prefix=""):
    cat = p["cat"].replace(" & Bakliyat", "")
    season = f'<span class="season">{e(p["season"])}</span>' if p.get("season") else ""
    desc = f'<p>{e(p["desc"])}</p>' if p.get("desc") else ""
    return (f'<article class="product"><div class="product-img"><img src="{e(img(p["img"]))}" alt="{e(p["name"])}" loading="lazy" width="600" height="450">{season}</div>'
            f'<div class="product-label"><h3>{e(p["name"])}</h3>{desc}'
            f'<div class="label-row"><span>Satış: <b>{e(p.get("sale") or p["unit"])}</b></span><span>{e(cat)}</span></div>'
            f'<button type="button" class="add-btn" data-add="{e(p["id"])}" aria-pressed="false">'
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Teklife ekle</button></div></article>')


# ---------------- index.html: ürünleri göm ----------------
idx = (ROOT / "index.html").read_text(encoding="utf-8")
cards = "".join(card(p) for p in PRODUCTS)
idx = re.sub(r"<!--PRODUCTS:START-->.*?<!--PRODUCTS:END-->", "<!--PRODUCTS:START-->" + cards + "<!--PRODUCTS:END-->", idx, flags=re.S)
(ROOT / "index.html").write_text(idx, encoding="utf-8")

# ---------------- ortak parçalar ----------------
ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.2.5.2.5.4.1.1.1.7-.1 1.2Z"/></svg>'


def head(title, desc, path, ld):
    url = SITE + "/" + path
    return f'''<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#1E5B3A">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Fresh Tedarik">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../assets/favicon.ico" sizes="any">
<link rel="icon" href="../assets/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="../assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=Onest:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="../assets/style.css">
''' + "".join(f'<script type="application/ld+json">\n{json.dumps(x, ensure_ascii=False, indent=1)}\n</script>\n' for x in ld) + "</head>\n<body>\n"


HEADER = '''<header class="topbar">
  <div class="wrap">
    <a class="brand" href="../" aria-label="Fresh Tedarik ana sayfa"><img class="brand-logo" src="../assets/logo-yatay.png" alt="Fresh Tedarik" width="420" height="60"></a>
    <nav class="nav" id="nav" aria-label="Ana menü">
      <a href="../sebze-meyve-tedarigi/">Sebze Meyve</a>
      <a href="../kuru-gida-bakliyat/">Kuru Gıda</a>
      <a href="../kumanya/">Kumanya</a>
      <a href="../hizmet-bolgeleri/">Hizmet Bölgeleri</a>
      <a href="../blog/">Blog</a>
      <a href="../#iletisim">İletişim</a>
    </nav>
    <div class="topbar-actions">
      <a class="btn btn-primary cart-btn" href="../#teklif" data-track="cart_open">
        <span class="btn-label">Teklif sepeti</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16l-1.5 11a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7L4 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>
        <span class="cart-count" data-count aria-label="Sepetteki ürün sayısı">0</span>
      </a>
    </div>
    <button class="menu-btn" id="menuBtn" aria-controls="nav" aria-expanded="false" aria-label="Menüyü aç">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
</header>
'''

FOOTER = f'''<footer>
  <div class="wrap">
    <img class="footer-logo" src="../assets/logo-yatay-koyu.png" alt="Fresh Tedarik" width="350" height="50">
    <nav aria-label="Alt menü">
      <a href="../sebze-meyve-tedarigi/">Sebze Meyve Tedariği</a><a href="../kuru-gida-bakliyat/">Kuru Gıda</a><a href="../kumanya/">Kumanya</a><a href="../hizmet-bolgeleri/">Hizmet Bölgeleri</a><a href="../blog/">Blog</a><a href="../#teklif">Teklif Al</a><a href="../kvkk.html">KVKK</a><a data-track="instagram_click" href="https://www.instagram.com/freshtedarik/" target="_blank" rel="noopener">Instagram</a>
    </nav>
    <span>© {datetime.date.today().year} Fresh Gıda ve Tarım Ürünleri</span>
  </div>
  <div class="wrap credit">
    <span>Altyapı ve Tasarım: <a href="https://wa.me/905438436128?text=Merhaba%2C%20freshtedarik.com%20sitesini%20g%C3%B6rd%C3%BCm%2C%20web%20sitesi%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener">MetYa Dijital</a></span>
  </div>
</footer>
<div class="mobile-bar">
  <a class="btn btn-wa" href="https://wa.me/{WA}?text=Merhaba%2C%20Fresh%20Tedarik%20%C3%BCr%C3%BCnleri%20i%C3%A7in%20fiyat%20teklifi%20almak%20istiyorum." target="_blank" rel="noopener" data-track="whatsapp_click">{ICON_WA}WhatsApp</a>
  <a class="btn btn-primary" href="../#teklif" data-track="cta_mobile_quote">Teklif al <span class="cart-count" data-count>0</span></a>
</div>
<div class="toast" id="toast" role="status" hidden></div>
<script src="../assets/config.js"></script>
<script src="../assets/sub.js"></script>
</body>
</html>
'''


def crumbs(name, path):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": name, "item": SITE + "/" + path}]}


def faq_ld(faq):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a)}} for q, a in faq]}


def itemlist_ld(name, items):
    return {"@context": "https://schema.org", "@type": "ItemList", "name": name, "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": p["name"]} for i, p in enumerate(items)]}


def faq_html(faq):
    return ('<section class="section" aria-labelledby="sss-baslik"><div class="wrap faq-grid"><div class="faq-head"><h2 id="sss-baslik">Sık Sorulan Sorular</h2></div><div class="faq">'
            + "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in faq) + "</div></div></section>")


def cta_band(title, text):
    return f'''<section class="band" aria-label="Teklif al"><div class="wrap band-grid band-cta"><div class="band-copy"><h2>{title}</h2><p>{text}</p></div>
<div class="hero-ctas"><a class="btn btn-primary btn-on-dark" href="../#teklif" data-track="cta_page_quote">Fiyat teklifi al</a><a class="btn btn-wa" href="https://wa.me/{WA}?text=Merhaba%2C%20Fresh%20Tedarik%20%C3%BCr%C3%BCnleri%20i%C3%A7in%20fiyat%20teklifi%20almak%20istiyorum." target="_blank" rel="noopener" data-track="whatsapp_click">{ICON_WA}WhatsApp'tan yaz</a></div></div></section>'''


def page_hero(crumb, h1, lead, image, alt):
    return f'''<main id="top">
<section class="hero page-hero"><div class="wrap hero-grid">
<div class="hero-copy">
<nav class="breadcrumb" aria-label="Sayfa yolu"><a href="../">Ana Sayfa</a><span aria-hidden="true">/</span><span>{crumb}</span></nav>
<h1>{h1}</h1>
<p class="lead">{lead}</p>
<div class="hero-ctas"><a class="btn btn-primary" href="../#teklif" data-track="cta_page_quote">Fiyat teklifi al</a><a class="btn btn-ghost" href="#urunler">Ürünleri gör</a></div>
<p class="hero-note">İstanbul genelinde teslimat ücretsizdir.</p>
</div>
<div class="hero-photo"><img src="{e(img(image, 1100))}" alt="{e(alt)}" width="1100" height="800" fetchpriority="high"></div>
</div></section>
'''


def products_block(title, cats, intro, anchor_ids=True):
    out = ""
    for c in cats:
        items = [p for p in PRODUCTS if p["cat"] == c]
        if not items:
            continue
        aid = {"Sebze": "sebze", "Meyve": "meyve", "Kuru Gıda & Bakliyat": "kuru-gida", "Kumanya": "kumanya-urunleri"}[c]
        out += f'<div class="sub-cat" id="{aid}"><h2>{e(c)}</h2><div class="grid-products" data-cats="{e(c)}">{"".join(card(p) for p in items)}</div></div>'
    return f'''<section class="section products-section" id="urunler" aria-label="{e(title)}"><div class="wrap">
<p class="lead" style="margin-bottom:28px">{intro}</p>{out}
<div class="price-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/></svg><p><b>Fiyatlar Neden Sitede Yok?</b> Hal fiyatları her gün değişir. Ürünleri teklif sepetinize ekleyin, işletmenize özel fiyatı sizi arayarak iletelim.</p></div>
</div></section>
'''


def prose(paras_html):
    return f'<section class="section"><div class="wrap prose">{paras_html}</div></section>\n'


def write(path, content):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


PAGES = []

# ---------------- Sebze Meyve ----------------
sm_items = [p for p in PRODUCTS if p["cat"] in ("Sebze", "Meyve")]
sm_faq = [
    ("Sebze ve meyveyi her gün mü getiriyorsunuz?", "Teslimat günlerini işletmenizin tüketimine göre birlikte belirliyoruz. Ürünler teslimat sabahı halden seçilip yola çıkar."),
    ("Kusurlu veya eksik ürün gelirse ne oluyor?", "Teslimatta fark ettiğiniz eksik veya kusurlu ürünü bize bildirin; değişimi en kısa sürede yapıyoruz."),
    ("Minimum sipariş miktarı var mı?", "Minimum sipariş, teslimat bölgenize ve sıklığına göre değişiyor. Teklif aşamasında size net olarak iletiyoruz."),
    ("Teslimat ücretli mi?", "Hayır. İstanbul genelinde teslimat ücretsizdir."),
]
sm = (head("Restoran ve Kafelere Toptan Sebze Meyve Tedariği İstanbul | Fresh Tedarik",
           "İstanbul'da restoran, kafe ve otellere günlük toptan sebze meyve tedariği. Halden seçme ürün, ücretsiz teslimat, işletmenize özel fiyat teklifi.",
           "sebze-meyve-tedarigi/", [crumbs("Sebze Meyve Tedariği", "sebze-meyve-tedarigi/"), itemlist_ld("Sebze ve Meyve Ürünleri", sm_items), faq_ld(sm_faq)])
      + HEADER
      + page_hero("Sebze Meyve Tedariği", "Restoran ve Kafelere <span>Toptan Sebze Meyve</span> Tedariği",
                  "Domatesten çarlistona, portakaldan ananasa; profesyonel mutfağınızın ihtiyacı olan taze sebze ve meyveyi her sabah halden seçip işletmenize getiriyoruz.",
                  "868110", "Kasalarda taze sebze ve meyveler")
      + prose('''<h2>Mutfağınıza Halden Doğrudan Taze Ürün</h2>
<p>Fresh Tedarik, İstanbul'daki kafe, restoran, otel ve catering işletmelerine toptan sebze ve meyve tedarik eder. Ürünleri aracı olmadan halden ve üreticiden alır, uzman ekibimizle tek tek seçer, Başakşehir depomuzdan kendi araçlarımızla mutfağınıza ulaştırırız.</p>
<p>Profesyonel mutfakta tutarlılık her şeydir: salatanın domatesi her gün aynı sertlikte, kızartmalık patates aynı nişasta dengesinde, meyve tabağı aynı tazelikte olmalı. Bu yüzden ürünleri sizin menünüze ve kullanım alanınıza göre seçiyor, teslimatı servisinizden önce yapıyoruz.</p>
<h2>Nasıl Çalışıyoruz?</h2>
<p>Kullandığınız ürünleri aşağıdan teklif sepetinize ekleyin ve formu gönderin. Sizi arayıp haftalık ihtiyacınızı ve teslimat günlerinizi konuşuyor, işletmenize özel fiyat teklifimizi iletiyoruz. Onayladığınızda ilk teslimatı planlıyoruz; teslimat İstanbul genelinde ücretsizdir.</p>''')
      + products_block("Sebze ve meyve ürünleri", ["Sebze", "Meyve"], "Aşağıdaki listede olmayan bir ürün mü arıyorsunuz? Teklif formundaki not alanına yazmanız yeterli, temin edelim.")
      + faq_html(sm_faq)
      + cta_band("Menünüze Uygun Fiyat Teklifi Alın", "Ürün listenizi paylaşın, işletmenize özel fiyatı aynı gün iletmeye çalışalım.")
      + "</main>\n" + FOOTER)
write("sebze-meyve-tedarigi/index.html", sm)
PAGES.append(("sebze-meyve-tedarigi/", "0.9"))

# ---------------- Kuru Gıda ----------------
kg_items = [p for p in PRODUCTS if p["cat"] == "Kuru Gıda & Bakliyat"]
kg_faq = [
    ("Kuru gıdayı sebze meyveyle birlikte mi getiriyorsunuz?", "Evet. Kuru gıda ve bakliyat siparişleriniz taze ürünlerle aynı sevkiyatta gelir; ayrı bir tedarikçiyle uğraşmanıza gerek kalmaz."),
    ("Hangi ambalajlarda satıyorsunuz?", "Bakliyat ve tahılları çuval veya paket halinde sağlıyoruz. Tüketiminize uygun ambalajı teklif aşamasında birlikte belirliyoruz."),
    ("Listede olmayan kuru gıda ürünlerini de temin ediyor musunuz?", "Evet. İhtiyacınız olan ürünleri teklif formundaki not alanına yazın, tedarik edip teklife ekleyelim."),
]
kg = (head("Toptan Kuru Gıda ve Bakliyat Tedariği İstanbul | Fresh Tedarik",
           "Restoran ve kafeler için toptan kırmızı mercimek, nohut, kuru fasulye, pirinç ve bulgur. Taze ürünle aynı sevkiyatta, ücretsiz teslimat.",
           "kuru-gida-bakliyat/", [crumbs("Kuru Gıda ve Bakliyat", "kuru-gida-bakliyat/"), itemlist_ld("Kuru Gıda ve Bakliyat Ürünleri", kg_items), faq_ld(kg_faq)])
      + HEADER
      + page_hero("Kuru Gıda ve Bakliyat", "Toptan <span>Kuru Gıda ve Bakliyat</span> Tedariği",
                  "Çorbanın mercimeğinden pilavın pirincine; Anadolu'dan seçilmiş bakliyat ve tahılları, taze ürünlerinizle aynı sevkiyatta getiriyoruz.",
                  "1638523", "Çuvallarda kuru bakliyat çeşitleri")
      + prose('''<h2>Esnaf Lokantasından Kafeye, Her Mutfağın Temeli</h2>
<p>Kırmızı mercimek, nohut, kuru fasulye, baldo pirinç ve bulgur; profesyonel mutfakların her gün kullandığı temel ürünler. Fresh Tedarik olarak bu ürünleri temizlenmiş, ayıklanmış ve hijyenik şekilde ambalajlanmış olarak sağlıyoruz.</p>
<p>Kuru gıdayı taze sebze ve meyveyle birlikte aynı tedarikçiden almak hem sipariş sürecinizi sadeleştirir hem de teslimat trafiğini azaltır. Tek fatura, tek sevkiyat, tek muhatap.</p>''')
      + products_block("Kuru gıda ürünleri", ["Kuru Gıda & Bakliyat"], "İhtiyacınız olan ürünleri teklif sepetinize ekleyin. Listede olmayanları formdaki not alanına yazabilirsiniz.")
      + faq_html(kg_faq)
      + cta_band("Kuru Gıda İçin Fiyat Teklifi Alın", "Aylık tüketiminizi konuşalım, size özel fiyat ve ambalaj seçeneklerini iletelim.")
      + "</main>\n" + FOOTER)
write("kuru-gida-bakliyat/index.html", kg)
PAGES.append(("kuru-gida-bakliyat/", "0.8"))

# ---------------- Kumanya ----------------
km_items = [p for p in PRODUCTS if p["cat"] == "Kumanya"]
km_faq = [
    ("Kumanya paketinin içeriğini biz mi belirliyoruz?", "Evet. Paket içeriğini, adedini ve bütçenizi birlikte belirliyor, ihtiyacınıza göre hazırlıyoruz."),
    ("Toplu kumanya siparişi veriyor musunuz?", "Evet. Kurum ve işletmeler için toplu kumanya hazırlayıp teslim ediyoruz. Adet ve teslim tarihini teklif aşamasında netleştiriyoruz."),
    ("Kumanya teslimatı ücretli mi?", "Hayır. İstanbul genelinde teslimat ücretsizdir."),
]
km = (head("Kumanya Paketi Hazırlama ve Toplu Kumanya Tedariği İstanbul | Fresh Tedarik",
           "İşletme ve kurumlar için ihtiyaca göre hazırlanan kumanya paketleri. İçeriği birlikte belirleyelim, İstanbul geneline ücretsiz teslim edelim.",
           "kumanya/", [crumbs("Kumanya", "kumanya/"), faq_ld(km_faq)])
      + HEADER
      + page_hero("Kumanya", "İhtiyacınıza Göre <span>Kumanya</span> Paketleri",
                  "İşletmeler, kurumlar ve toplu ihtiyaçlar için içeriğini sizinle birlikte belirlediğimiz kumanya paketlerini hazırlıyor, İstanbul geneline teslim ediyoruz.",
                  "7843987", "Teslimata hazır kumanya kolileri")
      + prose('''<h2>Paket İçeriğini Birlikte Belirleyelim</h2>
<p>Her kurumun kumanya ihtiyacı farklıdır. Kişi sayısını, bütçenizi ve paket içeriğini bize iletin; bakliyat, tahıl ve temel gıda ürünlerinden oluşan paketleri sizin için hazırlayalım.</p>
<p>Kumanya siparişlerinizi diğer kuru gıda ve taze ürün siparişlerinizle birlikte planlayabilir, tek sevkiyatta teslim alabilirsiniz.</p>''')
      + products_block("Kumanya", ["Kumanya"], "Kumanya paketi için teklif sepetinize ekleyin; içeriği telefonda birlikte netleştirelim.")
      + faq_html(km_faq)
      + cta_band("Kumanya İçin Teklif Alın", "Adet, içerik ve teslim tarihini konuşalım, size özel teklifi iletelim.")
      + "</main>\n" + FOOTER)
write("kumanya/index.html", km)
PAGES.append(("kumanya/", "0.7"))

# ---------------- Hizmet Bölgeleri ----------------
avrupa = [d for d in DISTRICTS if d not in ANADOLU]
anadolu = [d for d in DISTRICTS if d in ANADOLU]
hb_faq = [
    ("İlçem listede yok, teslimat yapıyor musunuz?", "İstanbul'un 39 ilçesinin tamamı listede yer alıyor. Adresiniz için teslimat günlerini teklif aşamasında birlikte planlıyoruz."),
    ("Teslimat hangi saatlerde yapılıyor?", "Teslimatları servisiniz başlamadan, sabah saatlerinde yapmaya çalışıyoruz. Saat aralığını teklif formunda seçebilirsiniz."),
    ("Teslimat ücreti alıyor musunuz?", "Hayır. İstanbul genelinde teslimat ücretsizdir."),
]
dl = lambda ds: '<ul class="district-list">' + "".join(f"<li>{e(d)}</li>" for d in ds) + "</ul>"
hb = (head("İstanbul Sebze Meyve Tedarik Hizmet Bölgeleri | Fresh Tedarik",
           "Başakşehir depomuzdan İstanbul'un Avrupa ve Anadolu yakasındaki restoran, kafe ve otellere ücretsiz sebze, meyve ve kuru gıda teslimatı.",
           "hizmet-bolgeleri/", [crumbs("Hizmet Bölgeleri", "hizmet-bolgeleri/"), faq_ld(hb_faq),
                                 {"@context": "https://schema.org", "@type": "WholesaleStore", "name": "Fresh Tedarik", "url": SITE + "/", "telephone": "+90-530-114-13-44",
                                  "address": {"@type": "PostalAddress", "streetAddress": "Şamlar, İstiklal Caddesi No:271", "addressLocality": "Başakşehir", "addressRegion": "İstanbul", "addressCountry": "TR"},
                                  "areaServed": [{"@type": "City", "name": "İstanbul"}] + [{"@type": "AdministrativeArea", "name": d + ", İstanbul"} for d in DISTRICTS]}])
      + HEADER
      + f'''<main id="top">
<section class="hero page-hero"><div class="wrap" style="max-width:860px">
<div class="hero-copy">
<nav class="breadcrumb" aria-label="Sayfa yolu"><a href="../">Ana Sayfa</a><span aria-hidden="true">/</span><span>Hizmet Bölgeleri</span></nav>
<h1>İstanbul Genelinde <span>Ücretsiz Teslimat</span></h1>
<p class="lead">Başakşehir'deki depomuzdan İstanbul'un Avrupa ve Anadolu yakasındaki restoran, kafe, otel ve marketlere taze sebze, meyve, kuru gıda ve kumanya teslim ediyoruz.</p>
<div class="hero-ctas"><a class="btn btn-primary" href="../#teklif" data-track="cta_page_quote">Fiyat teklifi al</a><a class="btn btn-ghost" href="../sebze-meyve-tedarigi/">Ürünleri gör</a></div>
</div></div></section>
<section class="section products-section"><div class="wrap district-grid">
<div><h2>Avrupa Yakası</h2>{dl(avrupa)}</div>
<div><h2>Anadolu Yakası</h2>{dl(anadolu)}</div>
</div></section>
''' + prose('''<h2>Teslimatlarımız Nasıl Planlanıyor?</h2>
<p>Teslimat günlerini ve saat aralığını işletmenizin servis düzenine göre birlikte belirliyoruz. Siparişleriniz Başakşehir depomuzda hazırlanır ve kendi araçlarımızla, servisiniz başlamadan mutfağınıza ulaştırılır.</p>
<p>Başakşehir, Esenyurt, Küçükçekmece, Bağcılar ve Avcılar gibi depomuza yakın ilçelerden Kadıköy, Ataşehir ve Üsküdar gibi Anadolu yakası ilçelerine kadar İstanbul'un tamamında teslimat ücretsizdir.</p>''')
      + faq_html(hb_faq)
      + cta_band("Bölgenize Teslimat Planlayalım", "İşletmenizin adresini ve ürün listenizi paylaşın, teslimat günlerinizi ve fiyat teklifimizi iletelim.")
      + "</main>\n" + FOOTER)
write("hizmet-bolgeleri/index.html", hb)
PAGES.append(("hizmet-bolgeleri/", "0.7"))


# ---------------- Blog ----------------
MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]


def trdate(d):
    y, m, dd = d.split("-")
    return f"{int(dd)} {MONTHS[int(m) - 1]} {y}"


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"\[(.+?)\]\((.+?)\)", lambda m: '<a href="' + m.group(2) + '">' + m.group(1) + "</a>", t)
    return t


def md(text):
    out, para, lst = [], [], None

    def flush():
        nonlocal para, lst
        if para:
            out.append("<p>" + inline(" ".join(para)) + "</p>")
            para = []
        if lst:
            tag = lst[0]
            out.append("<" + tag + ">" + "".join("<li>" + inline(i) + "</li>" for i in lst[1]) + "</" + tag + ">")
            lst = None

    for line in text.splitlines():
        l = line.rstrip()
        if not l.strip():
            flush()
            continue
        if l.startswith("## "):
            flush()
            out.append("<h2>" + inline(l[3:]) + "</h2>")
            continue
        m = re.match(r"^(\d+)\. (.*)", l)
        if l.startswith("- ") or m:
            if para:
                flush()
            tag = "ol" if m else "ul"
            if not lst or lst[0] != tag:
                flush()
                lst = (tag, [])
            lst[1].append(m.group(2) if m else l[2:])
            continue
        if lst:
            flush()
        para.append(l.strip())
    flush()
    return "\n".join(out)


POSTS = []
for f in sorted((ROOT / "tools/blog").glob("*.md")):
    raw = f.read_text(encoding="utf-8")
    meta_txt, body = raw.split("\n---\n", 1)
    meta = dict(l.split(": ", 1) for l in meta_txt.strip().splitlines())
    meta["slug"] = f.stem
    if meta.get("status", "published").strip() == "draft":
        continue
    meta["html"] = md(body)
    meta.setdefault("read", str(max(2, round(len(body.split()) / 200))))
    meta.setdefault("seo_title", meta["title"])
    meta.setdefault("image_alt", meta["title"])
    meta.setdefault("category", "Mutfak Rehberi")
    POSTS.append(meta)
POSTS.sort(key=lambda p: (p["date"], p["title"]), reverse=True)


def post_card(p, prefix):
    return ('<a class="post-card" href="' + prefix + p["slug"] + '/"><img src="' + e(img(p["image"], 700)) + '" alt="' + e(p["image_alt"]) + '" loading="lazy" width="700" height="460">'
            + '<span class="post-meta">' + e(p["category"]) + " · " + p["read"] + ' dk okuma</span><span class="post-title">' + e(p["title"]) + '</span><span class="post-desc">' + e(p["description"]) + "</span></a>")


def relink(text, depth):
    return text.replace('href="../', 'href="' + depth).replace('src="../', 'src="' + depth)


BLOG_INTRO = ('<main id="top"><section class="hero page-hero"><div class="wrap" style="max-width:860px"><div class="hero-copy">'
              '<nav class="breadcrumb" aria-label="Sayfa yolu"><a href="../">Ana Sayfa</a><span aria-hidden="true">/</span><span>Blog</span></nav>'
              '<h1>Mutfak <span>Rehberi</span></h1>'
              '<p class="lead">Restoran, kafe ve otel mutfakları için firesiz sipariş, doğru depolama, mevsimlik menü ve maliyet üzerine pratik yazılar.</p>'
              '</div></div></section>'
              '<section class="section products-section"><div class="wrap"><div class="post-grid">')

import shutil
_live = {p["slug"] for p in POSTS}
for _d in (ROOT / "blog").glob("*/"):
    if _d.is_dir() and _d.name not in _live:
        shutil.rmtree(_d)

bl = (head("Mutfak Rehberi: Restoran ve Kafeler İçin Tedarik Blogu | Fresh Tedarik",
           "Restoran, kafe ve otel işletmecileri için sebze meyve firesi, depolama, mevsimlik menü, tedarikçi seçimi ve maliyet üzerine pratik yazılar.",
           "blog/", [crumbs("Blog", "blog/")])
      + HEADER + BLOG_INTRO + "".join(post_card(p, "") for p in POSTS) + "</div></div></section>"
      + cta_band("Tedarik Tarafını Bize Bırakın", "Mutfağınıza en uygun ürünleri seçelim, servisinizden önce teslim edelim. İstanbul genelinde teslimat ücretsiz.")
      + "</main>\n" + FOOTER)
write("blog/index.html", bl)
PAGES.append(("blog/", "0.7"))

for p in POSTS:
    path = "blog/" + p["slug"] + "/"
    others = [o for o in POSTS if o["slug"] != p["slug"]][:3]
    bc = crumbs("Blog", "blog/")
    bc["itemListElement"].append({"@type": "ListItem", "position": 3, "name": p["title"], "item": SITE + "/" + path})
    ld = [bc, {"@context": "https://schema.org", "@type": "BlogPosting", "headline": p["title"], "description": p["description"],
               "image": img(p["image"], 1200), "datePublished": p["date"], "dateModified": p["date"], "inLanguage": "tr-TR",
               "author": {"@type": "Organization", "name": "Fresh Tedarik", "url": SITE + "/"},
               "publisher": {"@type": "Organization", "name": "Fresh Tedarik", "logo": {"@type": "ImageObject", "url": SITE + "/assets/logo.png"}},
               "mainEntityOfPage": SITE + "/" + path}]
    art = ('<main id="top"><article>'
           '<header class="hero page-hero post-hero"><div class="wrap" style="max-width:860px"><div class="hero-copy">'
           '<nav class="breadcrumb" aria-label="Sayfa yolu"><a href="../">Ana Sayfa</a><span aria-hidden="true">/</span><a href="../blog/">Blog</a><span aria-hidden="true">/</span><span>' + e(p["category"]) + "</span></nav>"
           "<h1>" + e(p["title"]) + "</h1>"
           '<p class="post-meta">' + trdate(p["date"]) + " · " + p["read"] + " dk okuma · Fresh Tedarik</p>"
           "</div></div></header>"
           '<div class="wrap" style="max-width:960px"><img class="post-cover" src="' + e(img(p["image"], 1400)) + '" alt="' + e(p["image_alt"]) + '" width="1400" height="780" fetchpriority="high"></div>'
           '<section class="section" style="padding-top:40px"><div class="wrap prose article">' + p["html"] + "</div></section>"
           "</article>")
    # yazı içi bağlantılar ../ ile başlıyor ve blog/<slug>/ konumuna göre yazıldı; şablon bağlantıları ise ../ = kök kabul ediyor
    shell = relink(head(p["seo_title"] + " | Fresh Tedarik", p["description"], path, ld) + HEADER, "../../")
    body_tpl = relink(art.replace(p["html"], "%%ARTICLE%%"), "../../").replace("%%ARTICLE%%", p["html"])
    tail = relink(cta_band("Mutfağınız İçin Teklif Alın", "Sebze, meyve, kuru gıda ve kumanyayı tek sevkiyatta, İstanbul genelinde ücretsiz teslimatla getirelim.")
                  + '<section class="section"><div class="wrap"><h2 style="margin-bottom:24px">Diğer Yazılar</h2><div class="post-grid">'
                  + "".join(post_card(o, "../blog/") for o in others) + "</div></div></section></main>\n" + FOOTER, "../../")
    write(path + "index.html", shell + body_tpl + tail)
    PAGES.append((path, "0.6"))

idx = (ROOT / "index.html").read_text(encoding="utf-8")
latest = "".join(post_card(p, "blog/") for p in POSTS[:3])
idx = re.sub(r"<!--BLOG:START-->.*?<!--BLOG:END-->", "<!--BLOG:START-->" + latest + "<!--BLOG:END-->", idx, flags=re.S)
(ROOT / "index.html").write_text(idx, encoding="utf-8")


# ---------------- Eski Wix adresleri ----------------
REDIRECTS = {"ürünleri-mi-z": "sebze-meyve-tedarigi/", "neden-fresh-tedari-k": "#hakkimizda", "i-leti-şi-m": "#iletisim"}
for old, new in REDIRECTS.items():
    target = ("../" + new) if not new.startswith("#") else ("../" + new)
    canon = SITE + "/" + (new if not new.startswith("#") else "")
    write(f"{old}/index.html", f'''<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>Fresh Tedarik</title>
<link rel="canonical" href="{canon}">
<meta name="robots" content="noindex, follow">
<meta http-equiv="refresh" content="0; url={target}">
<script>location.replace("{target}");</script>
</head><body><p>Sayfa taşındı: <a href="{target}">yeni sayfaya gidin</a>.</p></body></html>
''')

# ---------------- sitemap ----------------
urls = [("", "1.0")] + PAGES
sm_xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
    f"  <url><loc>{SITE}/{u}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority></url>\n" for u, pr in urls) + "</urlset>\n"
(ROOT / "sitemap.xml").write_text(sm_xml, encoding="utf-8")
print("ok:", len(PRODUCTS), "ürün,", len(PAGES), "sayfa")

# ---------------- önbellek sürümü: css/js değişince tarayıcı yenisini indirsin ----------------
import hashlib
_assets = ["assets/style.css", "assets/app.js", "assets/config.js", "assets/sub.js", "assets/admin.js", "assets/admin-blog.js"]
_ver = hashlib.md5(b"".join((ROOT / a).read_bytes() for a in _assets if (ROOT / a).exists())).hexdigest()[:8]
_pat = re.compile(r'((?:\.\./)*assets/(?:style\.css|app\.js|config\.js|sub\.js|admin\.js|admin-blog\.js))(\?v=\w+)?"')
for _f in ROOT.rglob("*.html"):
    if "tools" in _f.parts or ".github" in _f.parts:
        continue
    _t = _f.read_text(encoding="utf-8")
    _n = _pat.sub(lambda m: m.group(1) + "?v=" + _ver + '"', _t)
    if _n != _t:
        _f.write_text(_n, encoding="utf-8")
print("önbellek sürümü:", _ver)
