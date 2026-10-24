/**
 * Fresh Tedarik — site ve admin paneli arka ucu
 * Bu proje "Fresh Tedarik Web" tablosuna bağlıdır. Web uygulaması olarak dağıtılır
 * (Erişim: Herkes, Çalıştıran: freshtedarik@gmail.com).
 *
 * Herkese açık işlemler: public (GET), lead, track
 * Admin işlemleri: login ile alınan token gerektirir.
 * İlk kurulumda editörden bir kez "kurulum" fonksiyonunu çalıştırın; geçici admin şifresi
 * Yürütme günlüğüne yazılır.
 */

const SH = { lead: 'Teklif Talepleri', prod: 'Ürünler', set: 'Ayarlar', ev: 'Etkinlikler', cust: 'Müşteriler' };
const PROD_COLS = ['ID', 'Kategori', 'Ürün Adı', 'Slug', 'Birim', 'Satış Şekli', 'Menşei', 'Sezon', 'Kısa Açıklama', 'Görsel URL', 'Öne Çıkan', 'Yayında', 'Sıra', 'Eklenme Tarihi'];
const EVENTS = ['page_view', 'whatsapp_click', 'phone_click', 'email_click', 'instagram_click', 'add_to_quote', 'cta_click', 'cart_open', 'generate_lead', 'category_click', 'map_click'];
const LEAD_STATUSES = ['Yeni', 'Arandı', 'Teklif Gönderildi', 'Kazanıldı', 'Kaybedildi', 'Uygun Değil'];

/* Ayarlar: [anahtar, tablodaki etiket, sitede herkese açık mı, grup, açıklama] */
const SETTINGS = [
  ['companyName', 'Firma Adı', true, 'genel', 'Sitede görünen marka adı'],
  ['legalName', 'Ticari Ünvan', true, 'genel', 'Alt bilgi ve KVKK metni'],
  ['phone', 'Telefon', true, 'iletisim', 'Örn. 0530 114 13 44'],
  ['whatsapp', 'WhatsApp', true, 'iletisim', 'Ülke koduyla, boşluksuz: 905301141344'],
  ['email', 'E-posta', true, 'iletisim', ''],
  ['address', 'Adres', true, 'iletisim', ''],
  ['instagram', 'Instagram', true, 'instagram', 'Kullanıcı adı, @ olmadan: freshtedarik'],
  ['instagramPosts', 'Instagram Gönderileri', true, 'instagram', 'Sitede gösterilecek gönderi linkleri, her satıra bir tane'],
  ['heroTitle', 'Hero Başlık', true, 'icerik', 'Yeşil görünmesini istediğiniz kısmı **iki yıldız** arasına alın'],
  ['heroLead', 'Hero Açıklama', true, 'icerik', ''],
  ['heroImage', 'Hero Görsel', true, 'icerik', 'Ana sayfadaki büyük fotoğraf'],
  ['tagOut', 'Etiket Çıkış', true, 'icerik', 'Sarı etiketteki Çıkış satırı'],
  ['tagArea', 'Etiket Bölge', true, 'icerik', 'Sarı etiketteki Bölge satırı'],
  ['announcement', 'Duyuru Metni', true, 'icerik', 'Doluysa sitenin en üstünde ince bir bant olarak görünür'],
  ['districts', 'Hizmet İlçeleri', false, 'genel', 'Virgülle ayırın'],
  ['minOrder', 'Minimum Sipariş', false, 'genel', ''],
  ['deliveryHours', 'Teslimat Saatleri', false, 'genel', ''],
  ['workDays', 'Çalışma Günleri', false, 'genel', ''],
  ['notifyEmails', 'Bildirim E-postaları', false, 'genel', 'Yeni teklif bildirimleri; virgülle birden fazla adres'],
  ['gaId', 'GA4 Ölçüm Kimliği', true, 'google', 'G-XXXXXXXXXX'],
  ['adsId', 'Google Ads Dönüşüm Kimliği', true, 'google', 'AW-XXXXXXXXX'],
  ['adsLabel', 'Google Ads Dönüşüm Etiketi', true, 'google', 'Teklif formu dönüşümünün etiketi'],
  ['gtmId', 'Google Tag Manager', true, 'google', 'GTM-XXXXXXX (kullanılıyorsa)'],
  ['searchConsole', 'Search Console Doğrulama Kodu', false, 'google', 'HTML etiketi yöntemindeki content değeri'],
  ['merchantId', 'Merchant Center Kimliği', false, 'google', 'İleride ürün feed için']
];

/* ---------------- Giriş noktaları ---------------- */

function doGet(e) {
  const a = (e && e.parameter && e.parameter.action) || 'public';
  try {
    if (a === 'public') return json_(publicData_());
    return json_({ ok: false, error: 'Bilinmeyen işlem' });
  } catch (err) {
    console.error('İşlem hatası [' + a + ']: ' + (err.stack || err));
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  let d = {};
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (_) {}
  const a = d.action || 'lead';
  try {
    if (a === 'lead') return json_(saveLead_(d));
    if (a === 'track') return json_(track_(d));
    if (a === 'login') { const lr = login_(d.password); if (!lr.ok) console.warn('Giriş başarısız: ' + lr.error); return json_(lr); }

    if (!checkToken_(d.token)) { console.warn('Geçersiz oturum: ' + a); return json_({ ok: false, auth: false, error: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.' }); }

    switch (a) {
      case 'dashboard': return json_(dashboard_(Number(d.days) || 30));
      case 'leads': return json_(leads_());
      case 'leadUpdate': return json_(leadUpdate_(d));
      case 'products': return json_({ ok: true, products: readProducts_(false) });
      case 'productSave': return json_(productSave_(d.product || {}));
      case 'productDelete': return json_(productDelete_(d.id));
      case 'settings': return json_({ ok: true, settings: readSettings_(false), meta: SETTINGS.map(s => ({ key: s[0], label: s[1], group: s[3], help: s[4] })) });
      case 'settingsSave': return json_(settingsSave_(d.settings || {}));
      case 'upload': return json_(upload_(d));
      case 'passwordChange': return json_(passwordChange_(d.current, d.next));
      case 'blogList': return json_(blogList_());
      case 'blogSave': return json_(blogSave_(d.post || {}));
      case 'blogDelete': return json_(blogDelete_(d.slug, d.sha));
      case 'githubStatus': return json_(githubStatus_());
      case 'githubSave': return json_(githubSave_(d.githubToken));
      case 'searchConsole': return json_(searchConsole_(Number(d.days) || 28));
      case 'scSitemapSubmit': return json_(scSitemapSubmit_());
      case 'logout': CacheService.getScriptCache().remove('tok_' + d.token); return json_({ ok: true });
      default: return json_({ ok: false, error: 'Bilinmeyen işlem: ' + a });
    }
  } catch (err) {
    console.error('İşlem hatası [' + a + ']: ' + (err.stack || err));
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_(name) { return ss_().getSheetByName(name); }
function clean_(v, max) {
  return String(v == null ? '' : v).slice(0, max || 2000).replace(/^[=+\-@]/, "'$&");
}

/* ---------------- Herkese açık veri ---------------- */

function publicData_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('public_v1');
  if (hit) return JSON.parse(hit);
  const out = { ok: true, products: readProducts_(true), settings: readSettings_(true), updated: new Date().toISOString() };
  try { cache.put('public_v1', JSON.stringify(out), 300); } catch (_) {}
  return out;
}

function bustCache_() { CacheService.getScriptCache().remove('public_v1'); }

/* ---------------- Teklif talebi ---------------- */

function saveLead_(d) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (!d.business || !d.phone) return { ok: false, error: 'Eksik bilgi' };
    const sh = sheet_(SH.lead);
    sh.appendRow([
      new Date(),
      clean_(d.ref, 40), clean_(d.business, 200), clean_(d.contact, 120), "'" + String(d.phone || '').replace(/[^\d+ ()]/g, '').slice(0, 40), clean_(d.email, 200),
      clean_(d.type, 60), clean_(d.district, 60), '', clean_(d.days, 80), clean_(d.slot, 40), clean_(d.payment, 40),
      clean_(d.items) + (d.extra ? '\nDiğer: ' + clean_(d.extra) : ''),
      clean_(d.pain), '', '', clean_(d.source, 300),
      'Yeni'
    ]);
    notify_(d);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function notify_(d) {
  const s = readSettings_(false);
  const to = s.notifyEmails || 'freshtedarik@gmail.com';
  const subject = 'Yeni teklif talebi: ' + d.business + ' (' + d.district + ')';
  const body = [
    'Talep No: ' + d.ref,
    'İşletme: ' + d.business + ' — ' + d.type,
    'İlçe: ' + d.district,
    'Yetkili: ' + d.contact,
    'Telefon: ' + d.phone,
    d.email ? 'E-posta: ' + d.email : '',
    'Teslimat: ' + d.days + ' / ' + d.slot,
    'Ödeme: ' + d.payment,
    '',
    'Ürünler:',
    d.items || '-',
    d.extra ? '\nDiğer: ' + d.extra : '',
    d.pain ? '\nMevcut tedarik sorunu: ' + d.pain : '',
    '',
    'Kaynak: ' + d.source,
    'Tablo: ' + ss_().getUrl()
  ].filter(Boolean).join('\n');
  MailApp.sendEmail({ to: to, subject: subject, body: body, replyTo: d.email || undefined });
}

/* ---------------- Tıklama kaydı ---------------- */

function track_(d) {
  const ev = String(d.ev || '');
  if (EVENTS.indexOf(ev) < 0) return { ok: false };
  let sh = sheet_(SH.ev);
  if (!sh) {
    sh = ss_().insertSheet(SH.ev);
    sh.appendRow(['Tarih', 'Olay', 'Etiket', 'Sayfa', 'Kaynak', 'Cihaz', 'Ziyaretçi']);
    sh.setFrozenRows(1);
  }
  sh.appendRow([new Date(), ev, clean_(d.label, 120), clean_(d.page, 120), clean_(d.src, 200), clean_(d.device, 20), clean_(d.vid, 40)]);
  return { ok: true };
}

/* ---------------- Giriş / oturum ---------------- */

function hash_(s) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  return raw.map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
}

function login_(password) {
  const cache = CacheService.getScriptCache();
  const tries = Number(cache.get('login_tries') || 0);
  if (tries >= 8) return { ok: false, error: 'Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.' };
  const p = PropertiesService.getScriptProperties();
  const salt = p.getProperty('SALT');
  const h = p.getProperty('ADMIN_HASH');
  if (!salt || !h) return { ok: false, error: 'Admin şifresi henüz belirlenmemiş. Apps Script editöründen "kurulum" fonksiyonunu çalıştırın.' };
  if (hash_(salt + String(password || '')) !== h) {
    cache.put('login_tries', String(tries + 1), 900);
    return { ok: false, error: 'Şifre hatalı.' };
  }
  cache.remove('login_tries');
  const token = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
  cache.put('tok_' + token, '1', 21600); // 6 saat
  return { ok: true, token: token, mustChange: p.getProperty('MUST_CHANGE') === '1' };
}

function checkToken_(t) {
  if (!t) return false;
  const c = CacheService.getScriptCache();
  if (!c.get('tok_' + t)) return false;
  c.put('tok_' + t, '1', 21600);
  return true;
}

function passwordChange_(current, next) {
  const p = PropertiesService.getScriptProperties();
  if (hash_(p.getProperty('SALT') + String(current || '')) !== p.getProperty('ADMIN_HASH')) return { ok: false, error: 'Mevcut şifre hatalı.' };
  if (!next || String(next).length < 8) return { ok: false, error: 'Yeni şifre en az 8 karakter olmalı.' };
  const salt = Utilities.getUuid();
  p.setProperties({ SALT: salt, ADMIN_HASH: hash_(salt + next), MUST_CHANGE: '0' });
  return { ok: true };
}

/** Editörden bir kez çalıştırın: geçici şifre üretir, eksik ayar satırlarını ve Etkinlikler sekmesini oluşturur. */
function kurulum() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pw = '';
  for (let i = 0; i < 12; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
  const salt = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperties({ SALT: salt, ADMIN_HASH: hash_(salt + pw), MUST_CHANGE: '1' });
  ensureSettingsRows_();
  if (!sheet_(SH.ev)) track_({ ev: 'page_view', label: 'kurulum', page: '/', src: 'kurulum', device: '-' });
  DriveApp.getRootFolder(); // Drive iznini onaylatır
  MailApp.getRemainingDailyQuota();
  Logger.log('GEÇİCİ ADMIN ŞİFRESİ: ' + pw);
}

/* ---------------- Ayarlar ---------------- */

function ensureSettingsRows_() {
  const sh = sheet_(SH.set);
  const vals = sh.getDataRange().getValues();
  const labels = vals.map(r => r[0]);
  const defaults = {
    'Hero Başlık': 'İstanbul Mutfaklarına **Hal Tazeliğinde** Tedarik',
    'Hero Açıklama': 'Kafe, restoran ve otellere sebze, meyve, kuru gıda ve kumanya. İhtiyacınız olan ürünleri seçin, işletmenize özel fiyat teklifini hazırlayalım.',
    'Hero Görsel': 'https://images.pexels.com/photos/868110/pexels-photo-868110.jpeg?auto=compress&cs=tinysrgb&w=1100',
    'Etiket Çıkış': 'Başakşehir Depo',
    'Etiket Bölge': 'İstanbul Geneli',
    'Instagram': 'freshtedarik'
  };
  SETTINGS.forEach(s => {
    const i = labels.indexOf(s[1]);
    if (i < 0) sh.appendRow([s[1], defaults[s[1]] || '', s[4]]);
    else if (s[1] === 'Instagram' && !vals[i][1]) sh.getRange(i + 1, 2).setValue('freshtedarik');
  });
}

function readSettings_(publicOnly) {
  const vals = sheet_(SH.set).getDataRange().getValues();
  const byLabel = {};
  vals.slice(1).forEach(r => { byLabel[String(r[0]).trim()] = r[1]; });
  const out = {};
  SETTINGS.forEach(s => {
    if (publicOnly && !s[2]) return;
    const v = byLabel[s[1]];
    out[s[0]] = v == null ? '' : String(v);
  });
  return out;
}

function settingsSave_(obj) {
  ensureSettingsRows_();
  const sh = sheet_(SH.set);
  const vals = sh.getDataRange().getValues();
  const labels = vals.map(r => String(r[0]).trim());
  SETTINGS.forEach(s => {
    if (!(s[0] in obj)) return;
    let v = String(obj[s[0]] == null ? '' : obj[s[0]]).slice(0, 4000);
    if (s[0] === 'whatsapp') v = v.replace(/\D/g, '');
    if (s[0] === 'instagram') v = v.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '');
    const i = labels.indexOf(s[1]);
    const cell = i < 0 ? sh.getRange(sh.getLastRow() + 1, 1, 1, 2) : sh.getRange(i + 1, 2);
    if (i < 0) cell.setValues([[s[1], v]]); else cell.setNumberFormat('@').setValue(v);
  });
  bustCache_();
  return { ok: true, settings: readSettings_(false) };
}

/* ---------------- Ürünler ---------------- */

function readProducts_(liveOnly) {
  const vals = sheet_(SH.prod).getDataRange().getValues();
  const head = vals[0].map(h => String(h).trim());
  const ix = name => head.indexOf(name);
  const list = vals.slice(1).map((r, i) => ({
    row: i + 2,
    id: String(r[ix('ID')] || ''),
    cat: String(r[ix('Kategori')] || ''),
    name: String(r[ix('Ürün Adı')] || ''),
    unit: String(r[ix('Birim')] || 'kg'),
    sale: String(r[ix('Satış Şekli')] || ''),
    origin: String(r[ix('Menşei')] || ''),
    season: String(r[ix('Sezon')] || ''),
    desc: String(r[ix('Kısa Açıklama')] || ''),
    img: String(r[ix('Görsel URL')] || ''),
    featured: String(r[ix('Öne Çıkan')]).toLowerCase() === 'evet',
    live: String(r[ix('Yayında')]).toLowerCase() === 'evet',
    order: Number(r[ix('Sıra')]) || 999
  })).filter(p => p.id && p.name && (!liveOnly || p.live));
  list.sort((a, b) => a.order - b.order);
  if (liveOnly) list.forEach(p => { delete p.row; delete p.live; });
  return list;
}

function slug_(s) {
  const map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
  return String(s).replace(/[çğıöşüÇĞİÖŞÜ]/g, c => map[c]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function productSave_(p) {
  if (!p.name || !p.cat) return { ok: false, error: 'Ürün adı ve kategori zorunlu.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_(SH.prod);
    const vals = sh.getDataRange().getValues();
    let rowIndex = -1;
    let id = String(p.id || '');
    if (id) vals.forEach((r, i) => { if (i > 0 && String(r[0]) === id) rowIndex = i + 1; });
    if (!id) {
      const max = vals.slice(1).reduce((m, r) => Math.max(m, Number(String(r[0]).replace(/\D/g, '')) || 0), 0);
      id = 'FT-' + String(max + 1).padStart(3, '0');
    }
    const existingDate = rowIndex > 0 ? vals[rowIndex - 1][13] : '';
    const maxOrder = vals.slice(1).reduce((m, r) => Math.max(m, Number(r[12]) || 0), 0);
    const row = [
      id, clean_(p.cat, 60), clean_(p.name, 120), slug_(p.name), clean_(p.unit || 'kg', 20), clean_(p.sale, 60),
      clean_(p.origin, 60), clean_(p.season, 60), clean_(p.desc, 400), clean_(p.img, 1000),
      p.featured ? 'Evet' : 'Hayır', p.live === false ? 'Hayır' : 'Evet',
      Number(p.order) || (rowIndex > 0 ? Number(vals[rowIndex - 1][12]) : maxOrder + 1),
      existingDate || Utilities.formatDate(new Date(), 'Europe/Istanbul', 'yyyy-MM-dd')
    ];
    if (rowIndex > 0) {
      sh.getRange(rowIndex, 10).setNumberFormat('@');
      sh.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    } else {
      sh.appendRow(row);
    }
    bustCache_();
    return { ok: true, id: id, products: readProducts_(false) };
  } finally {
    lock.releaseLock();
  }
}

function productDelete_(id) {
  const sh = sheet_(SH.prod);
  const vals = sh.getDataRange().getValues();
  for (let i = vals.length - 1; i > 0; i--) {
    if (String(vals[i][0]) === String(id)) { sh.deleteRow(i + 1); bustCache_(); return { ok: true, products: readProducts_(false) }; }
  }
  return { ok: false, error: 'Ürün bulunamadı.' };
}

/* ---------------- Görsel yükleme ---------------- */

function folder_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (_) {} }
  const f = DriveApp.createFolder('Fresh Tedarik Site Görselleri');
  p.setProperty('FOLDER_ID', f.getId());
  return f;
}

function upload_(d) {
  if (!d.data) return { ok: false, error: 'Dosya bulunamadı.' };
  const mime = /^image\/(jpeg|png|webp)$/.test(d.mime) ? d.mime : 'image/jpeg';
  const bytes = Utilities.base64Decode(d.data);
  if (bytes.length > 6 * 1024 * 1024) return { ok: false, error: 'Görsel 6 MB\'dan büyük olamaz.' };
  const name = clean_(d.name || 'gorsel', 80).replace(/[^\w.\-]+/g, '-');
  const file = folder_().createFile(Utilities.newBlob(bytes, mime, name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { ok: true, url: 'https://lh3.googleusercontent.com/d/' + file.getId() + '=w1600', id: file.getId() };
}

/* ---------------- Talepler ---------------- */

function leads_() {
  const sh = sheet_(SH.lead);
  const vals = sh.getDataRange().getValues();
  const head = vals[0];
  const rows = vals.slice(1).map((r, i) => {
    const o = { row: i + 2 };
    head.forEach((h, j) => { o[String(h)] = r[j] instanceof Date ? r[j].toISOString() : r[j]; });
    return o;
  }).filter(o => o['Talep No'] || o['İşletme Adı']);
  rows.reverse();
  return { ok: true, leads: rows.slice(0, 300), statuses: LEAD_STATUSES };
}

function leadUpdate_(d) {
  const sh = sheet_(SH.lead);
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  const row = Number(d.row);
  if (!row || row < 2 || row > sh.getLastRow()) return { ok: false, error: 'Talep bulunamadı.' };
  const set = (name, v) => { const c = head.indexOf(name); if (c > -1 && v !== undefined) sh.getRange(row, c + 1).setValue(clean_(v, 2000)); };
  if (d.status && LEAD_STATUSES.indexOf(d.status) > -1) set('Durum', d.status);
  set('Sorumlu', d.owner);
  set('Teklif Tutarı (₺)', d.amount);
  set('İç Notlar', d.note);
  if (d.status) set('Son Görüşme', Utilities.formatDate(new Date(), 'Europe/Istanbul', 'dd.MM.yyyy HH:mm'));
  if (d.status === 'Kazanıldı') set('Müşteriye Dönüştü', 'Evet');
  return { ok: true };
}

/* ---------------- Özet / istatistik ---------------- */

function dashboard_(days) {
  const tz = 'Europe/Istanbul';
  const since = new Date(Date.now() - days * 864e5);
  const dayKey = dt => Utilities.formatDate(dt, tz, 'yyyy-MM-dd');
  const series = {};
  for (let i = days - 1; i >= 0; i--) series[dayKey(new Date(Date.now() - i * 864e5))] = { views: 0, leads: 0, clicks: 0 };

  const counts = {}; const added = {}; const sources = {}; const devices = {}; const visitors = {};
  const ev = sheet_(SH.ev);
  if (ev && ev.getLastRow() > 1) {
    const start = Math.max(2, ev.getLastRow() - 20000);
    const vals = ev.getRange(start, 1, ev.getLastRow() - start + 1, 7).getValues();
    vals.forEach(r => {
      const dt = r[0] instanceof Date ? r[0] : new Date(r[0]);
      if (!(dt >= since)) return;
      const e = String(r[1]);
      counts[e] = (counts[e] || 0) + 1;
      const k = dayKey(dt);
      if (series[k]) {
        if (e === 'page_view') series[k].views++;
        else if (e === 'whatsapp_click' || e === 'phone_click') series[k].clicks++;
      }
      if (e === 'add_to_quote' && r[2]) added[r[2]] = (added[r[2]] || 0) + 1;
      if (e === 'page_view') {
        const src = simplifySource_(String(r[4] || ''));
        sources[src] = (sources[src] || 0) + 1;
        const dv = String(r[5] || '-'); devices[dv] = (devices[dv] || 0) + 1;
        if (r[6]) visitors[r[6]] = 1;
      }
    });
  }

  const leadVals = sheet_(SH.lead).getDataRange().getValues().slice(1);
  let leadsTotal = 0, leadsNew = 0, leadsPeriod = 0, won = 0;
  const leadStatus = {};
  leadVals.forEach(r => {
    if (!r[1] && !r[2]) return;
    leadsTotal++;
    const st = String(r[17] || 'Yeni');
    leadStatus[st] = (leadStatus[st] || 0) + 1;
    if (st === 'Yeni') leadsNew++;
    if (st === 'Kazanıldı') won++;
    const dt = r[0] instanceof Date ? r[0] : new Date(r[0]);
    if (dt >= since) { leadsPeriod++; const k = dayKey(dt); if (series[k]) series[k].leads++; }
  });

  const top = obj => Object.keys(obj).map(k => ({ name: k, count: obj[k] })).sort((a, b) => b.count - a.count).slice(0, 8);
  return {
    ok: true, days: days,
    totals: {
      views: counts.page_view || 0, visitors: Object.keys(visitors).length,
      whatsapp: counts.whatsapp_click || 0, phone: counts.phone_click || 0,
      instagram: counts.instagram_click || 0, email: counts.email_click || 0,
      addToQuote: counts.add_to_quote || 0, leadsPeriod: leadsPeriod,
      leadsTotal: leadsTotal, leadsNew: leadsNew, won: won
    },
    series: Object.keys(series).map(k => ({ day: k, views: series[k].views, leads: series[k].leads, clicks: series[k].clicks })),
    topProducts: top(added), sources: top(sources), devices: top(devices), leadStatus: leadStatus
  };
}

function simplifySource_(s) {
  if (!s || s === 'doğrudan') return 'Doğrudan';
  if (/gclid|utm_source=google|google\./i.test(s)) return /gclid|cpc/i.test(s) ? 'Google Ads' : 'Google';
  if (/instagram/i.test(s)) return 'Instagram';
  if (/facebook|fb\./i.test(s)) return 'Facebook';
  if (/whatsapp|wa\.me/i.test(s)) return 'WhatsApp';
  const m = s.match(/utm_source=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);
  const h = s.match(/ref=https?:\/\/([^/]+)/);
  return h ? h[1].replace(/^www\./, '') : 'Diğer';
}


/* ---------------- Blog (GitHub üzerinden yayın) ---------------- */

const GH = { owner: 'freshtedarik-prog', repo: 'freshtedarik-web', dir: 'tools/blog', branch: 'main' };
const POST_KEYS = ['title', 'seo_title', 'description', 'image', 'image_alt', 'category', 'date', 'status', 'read'];

function ghRequest_(method, path, payload) {
  const t = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!t) throw new Error('Blog yayın bağlantısı kurulmamış. Hesap ve Güvenlik sayfasından GitHub anahtarını girin.');
  return {
    url: 'https://api.github.com/repos/' + GH.owner + '/' + GH.repo + path,
    method: method,
    headers: { Authorization: 'Bearer ' + t, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    contentType: 'application/json',
    payload: payload ? JSON.stringify(payload) : undefined,
    muteHttpExceptions: true
  };
}

function ghParse_(res) {
  const code = res.getResponseCode();
  const body = res.getContentText();
  if (code === 401) throw new Error('GitHub anahtarı geçersiz veya süresi dolmuş. Hesap ve Güvenlik sayfasından yenileyin.');
  if (code === 403) throw new Error('GitHub anahtarının bu depoya yazma izni yok.');
  if (code === 404) return null;
  if (code >= 300) throw new Error('GitHub hatası (' + code + ').');
  return body ? JSON.parse(body) : {};
}

function gh_(method, path, payload) {
  const r = ghRequest_(method, path, payload);
  const url = r.url; delete r.url;
  return ghParse_(UrlFetchApp.fetch(url, r));
}

function b64decode_(c) { return Utilities.newBlob(Utilities.base64Decode(String(c).replace(/\n/g, ''))).getDataAsString('UTF-8'); }

function parsePost_(text, slug, sha) {
  const i = text.indexOf('\n---\n');
  const head = i > -1 ? text.slice(0, i) : '';
  const body = i > -1 ? text.slice(i + 5) : text;
  const p = { slug: slug, sha: sha, body: body };
  head.split('\n').forEach(l => { const k = l.indexOf(': '); if (k > 0) p[l.slice(0, k).trim()] = l.slice(k + 2).trim(); });
  p.status = p.status || 'published';
  return p;
}

function blogList_() {
  const list = gh_('get', '/contents/' + GH.dir + '?ref=' + GH.branch);
  const files = (list || []).filter(f => /\.md$/.test(f.name));
  const reqs = files.map(f => ghRequest_('get', '/contents/' + GH.dir + '/' + encodeURIComponent(f.name) + '?ref=' + GH.branch));
  const res = reqs.length ? UrlFetchApp.fetchAll(reqs) : [];
  const posts = res.map((r, i) => {
    const j = ghParse_(r);
    return parsePost_(b64decode_(j.content), files[i].name.replace(/\.md$/, ''), j.sha);
  });
  posts.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return { ok: true, posts: posts };
}

function blogSave_(p) {
  const clean = v => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim();
  if (!clean(p.title)) return { ok: false, error: 'Başlık zorunlu.' };
  if (!String(p.body || '').trim()) return { ok: false, error: 'Yazı metni boş olamaz.' };
  let slug = p.slug ? String(p.slug) : slug_(p.title).slice(0, 80);
  if (!slug) return { ok: false, error: 'Başlıktan adres üretilemedi.' };
  let sha = p.sha || null;
  if (!p.slug) {
    let n = 1, base = slug;
    while (gh_('get', '/contents/' + GH.dir + '/' + slug + '.md?ref=' + GH.branch)) { n++; slug = base + '-' + n; }
  }
  const meta = {
    title: clean(p.title), seo_title: clean(p.seo_title) || clean(p.title), description: clean(p.description).slice(0, 300),
    image: clean(p.image), image_alt: clean(p.image_alt) || clean(p.title), category: clean(p.category) || 'Mutfak Rehberi',
    date: clean(p.date) || Utilities.formatDate(new Date(), 'Europe/Istanbul', 'yyyy-MM-dd'),
    status: p.status === 'draft' ? 'draft' : 'published'
  };
  const words = String(p.body).split(/\s+/).length;
  meta.read = String(Math.max(2, Math.round(words / 200)));
  const text = POST_KEYS.filter(k => meta[k]).map(k => k + ': ' + meta[k]).join('\n') + '\n---\n' + String(p.body).replace(/\r\n/g, '\n').trim() + '\n';
  const payload = {
    message: (sha ? 'Blog güncellendi: ' : 'Yeni blog yazısı: ') + meta.title,
    content: Utilities.base64Encode(text, Utilities.Charset.UTF_8),
    branch: GH.branch,
    committer: { name: 'Fresh Tedarik Panel', email: 'freshtedarik@gmail.com' }
  };
  if (sha) payload.sha = sha;
  const res = gh_('put', '/contents/' + GH.dir + '/' + slug + '.md', payload);
  return { ok: true, slug: slug, sha: res && res.content ? res.content.sha : null, status: meta.status };
}

function blogDelete_(slug, sha) {
  if (!slug || !sha) return { ok: false, error: 'Yazı bulunamadı.' };
  gh_('delete', '/contents/' + GH.dir + '/' + slug + '.md', {
    message: 'Blog yazısı silindi: ' + slug, sha: sha, branch: GH.branch,
    committer: { name: 'Fresh Tedarik Panel', email: 'freshtedarik@gmail.com' }
  });
  return { ok: true };
}

function githubSave_(token) {
  token = String(token || '').trim();
  if (!token) return { ok: false, error: 'Anahtarı yapıştırın.' };
  const res = UrlFetchApp.fetch('https://api.github.com/repos/' + GH.owner + '/' + GH.repo, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' }, muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) return { ok: false, error: 'Bu anahtarla depoya ulaşılamadı. Anahtarın freshtedarik-web deposuna erişimi olduğundan emin olun.' };
  const perms = JSON.parse(res.getContentText()).permissions || {};
  if (!perms.push) return { ok: false, error: 'Anahtarın yazma izni yok. "Contents: Read and write" izniyle yeniden oluşturun.' };
  PropertiesService.getScriptProperties().setProperty('GITHUB_TOKEN', token);
  return { ok: true };
}

function githubStatus_() {
  const t = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!t) return { ok: true, connected: false };
  try {
    const runs = gh_('get', '/actions/runs?per_page=1');
    const r = runs && runs.workflow_runs && runs.workflow_runs[0];
    return { ok: true, connected: true, lastRun: r ? { status: r.status, conclusion: r.conclusion, name: r.name, at: r.updated_at } : null };
  } catch (err) {
    return { ok: true, connected: false, error: String(err.message || err) };
  }
}

/** Yeni izinleri (dış bağlantı) onaylatmak için editörden bir kez çalıştırın. Şifreyi değiştirmez. */
function izinleriOnayla() {
  UrlFetchApp.fetch('https://api.github.com/zen', { muteHttpExceptions: true });
  Logger.log('İzinler tamam.');
}


/* ---------------- Google Search Console ---------------- */

const SC_API = 'https://searchconsole.googleapis.com/webmasters/v3';
const SC_SITEMAP = 'https://www.freshtedarik.com/sitemap.xml';

function scFetch_(method, path, payload) {
  const res = UrlFetchApp.fetch(SC_API + path, {
    method: method,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    contentType: 'application/json',
    payload: payload ? JSON.stringify(payload) : undefined,
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code >= 300) {
    let msg = text;
    try { msg = JSON.parse(text).error.message; } catch (_) {}
    if (code === 403 && /not been used|disabled/i.test(msg)) { const pm = String(msg).match(/project[= ](\d+)/); throw new Error('Search Console API bu projede kapalı. Kurulum adımı gerekiyor.' + (pm ? ' (proje ' + pm[1] + ')' : '') + ' ' + msg); }
    if (code === 403 && /scope/i.test(msg)) throw new Error('Search Console izni henüz verilmedi. Apps Script editöründe searchConsoleIzni çalıştırılıp izin verilmeli.');
    if (code === 403) throw new Error('freshtedarik@gmail.com hesabının bu sitede Search Console yetkisi yok. (' + msg + ')');
    throw new Error('Search Console hatası (' + code + '): ' + msg);
  }
  return text ? JSON.parse(text) : {};
}

function scSite_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('sc_site');
  if (hit) return hit;
  const sites = (scFetch_('get', '/sites').siteEntry || []).filter(s => s.permissionLevel !== 'siteUnverifiedUser');
  const pick = sites.find(s => s.siteUrl === 'sc-domain:freshtedarik.com') ||
               sites.find(s => /freshtedarik\.com/.test(s.siteUrl));
  if (!pick) return '';
  cache.put('sc_site', pick.siteUrl, 21600);
  return pick.siteUrl;
}

function scQuery_(site, start, end, dims, limit) {
  return scFetch_('post', '/sites/' + encodeURIComponent(site) + '/searchAnalytics/query', {
    startDate: start, endDate: end, dimensions: dims, rowLimit: limit || 1000, dataState: 'all'
  }).rows || [];
}

function searchConsole_(days) {
  const site = scSite_();
  if (!site) return { ok: true, connected: false };
  const cache = CacheService.getScriptCache();
  const key = 'sc_' + days;
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);

  const tz = 'Europe/Istanbul';
  const fmt = d => Utilities.formatDate(d, tz, 'yyyy-MM-dd');
  const end = new Date();
  const start = new Date(Date.now() - (days - 1) * 864e5);
  const s = fmt(start), e = fmt(end);

  const byDate = scQuery_(site, s, e, ['date']);
  const queries = scQuery_(site, s, e, ['query'], 15);
  const pages = scQuery_(site, s, e, ['page'], 10);
  const devices = scQuery_(site, s, e, ['device'], 5);

  const totals = byDate.reduce((t, r) => { t.clicks += r.clicks; t.impressions += r.impressions; t.posSum += r.position * r.impressions; return t; }, { clicks: 0, impressions: 0, posSum: 0 });
  const series = [];
  const map = {}; byDate.forEach(r => { map[r.keys[0]] = r; });
  for (let i = days - 1; i >= 0; i--) {
    const k = fmt(new Date(Date.now() - i * 864e5));
    series.push({ day: k, clicks: map[k] ? map[k].clicks : 0, impressions: map[k] ? map[k].impressions : 0 });
  }
  const row = r => ({ key: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });

  let sitemaps = [];
  try {
    sitemaps = (scFetch_('get', '/sites/' + encodeURIComponent(site) + '/sitemaps').sitemap || []).map(m => ({
      path: m.path, lastSubmitted: m.lastSubmitted, lastDownloaded: m.lastDownloaded, pending: m.isPending,
      errors: Number(m.errors || 0), warnings: Number(m.warnings || 0),
      submitted: (m.contents || []).reduce((a, c) => a + Number(c.submitted || 0), 0)
    }));
  } catch (_) {}

  const out = {
    ok: true, connected: true, site: site, days: days, start: s, end: e,
    totals: {
      clicks: totals.clicks, impressions: totals.impressions,
      ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
      position: totals.impressions ? totals.posSum / totals.impressions : 0
    },
    series: series, queries: queries.map(row), pages: pages.map(row), devices: devices.map(row), sitemaps: sitemaps
  };
  try { cache.put(key, JSON.stringify(out), 3600); } catch (_) {}
  return out;
}

function scSitemapSubmit_() {
  const site = scSite_();
  if (!site) return { ok: false, error: 'Search Console mülkü bulunamadı. Önce alan adını Search Console\'da doğrulayın.' };
  scFetch_('put', '/sites/' + encodeURIComponent(site) + '/sitemaps/' + encodeURIComponent(SC_SITEMAP));
  CacheService.getScriptCache().removeAll(['sc_7', 'sc_28', 'sc_90']);
  return { ok: true };
}

/** Search Console iznini onaylatmak için editörden bir kez çalıştırın. */
function searchConsoleIzni() {
  Logger.log(JSON.stringify(scFetch_('get', '/sites')));
}

/** Editörden çalıştırılır: site haritasını Google'a gönderir ve durumunu yazar. */
function siteHaritasiGonder() {
  scSitemapSubmit_();
  Logger.log(JSON.stringify(scFetch_('get', '/sites/' + encodeURIComponent(scSite_()) + '/sitemaps')));
}
