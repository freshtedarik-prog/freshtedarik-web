/**
 * Fresh Tedarik — Teklif formu alıcısı
 * Kurulum: "Fresh Tedarik Web" tablosunda Uzantılar > Apps Script, bu kodu yapıştırın,
 * Dağıt > Yeni dağıtım > Web uygulaması (Erişim: Herkes) ve çıkan adresi
 * sitedeki assets/config.js içindeki FORM_ENDPOINT alanına yazın.
 */
const SHEET_NAME = 'Teklif Talepleri';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME);
    const clean = v => String(v == null ? '' : v).slice(0, 2000).replace(/^[=+\-@]/, "'$&");

    sh.appendRow([
      new Date(),
      clean(d.ref), clean(d.business), clean(d.contact), clean(d.phone), clean(d.email),
      clean(d.type), clean(d.district), clean(d.covers), clean(d.days), clean(d.slot), clean(d.payment),
      clean(d.items) + (d.extra ? '\nDiğer: ' + clean(d.extra) : ''),
      clean(d.pain), clean(d.trial), '', clean(d.source),
      'Yeni'
    ]);

    notify_(ss, d);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function notify_(ss, d) {
  const settings = ss.getSheetByName('Ayarlar').getDataRange().getValues();
  const row = settings.find(r => r[0] === 'Bildirim E-postaları');
  const to = (row && row[1]) || 'freshtedarik@gmail.com';
  const subject = 'Yeni teklif talebi: ' + d.business + ' (' + d.district + ')';
  const body = [
    'Talep No: ' + d.ref,
    'İşletme: ' + d.business + ' — ' + d.type,
    'İlçe: ' + d.district,
    'Yetkili: ' + d.contact,
    'Telefon: ' + d.phone,
    d.email ? 'E-posta: ' + d.email : '',
    d.covers ? 'Günlük kuver: ' + d.covers : '',
    'Teslimat: ' + d.days + ' / ' + d.slot,
    'Ödeme: ' + d.payment,
    'Deneme teslimatı: ' + d.trial,
    '',
    'Ürünler:',
    d.items || '-',
    d.extra ? '\nDiğer: ' + d.extra : '',
    d.pain ? '\nMevcut tedarik sorunu: ' + d.pain : '',
    '',
    'Kaynak: ' + d.source,
    'Tablo: ' + ss.getUrl()
  ].filter(Boolean).join('\n');
  MailApp.sendEmail({ to: to, subject: subject, body: body, replyTo: d.email || undefined });
}
