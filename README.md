# Fresh Tedarik Web

freshtedarik.com — İstanbul'daki kafe ve restoranlara sebze, meyve, kuru gıda ve kumanya tedariği için teklif odaklı site.

## Yapı
- `index.html` — tek sayfa site (ürünler, teklif sepeti, form, hakkımızda, iletişim)
- `assets/config.js` — telefon, WhatsApp, Sheets ID, form adresi, GA4 / Google Ads kimlikleri
- `assets/app.js` — ürünleri Google Sheets'ten okur, teklif sepeti ve form
- `apps-script/Code.gs` — formu "Teklif Talepleri" sekmesine yazan ve e-posta bildirimi gönderen Apps Script
- `kvkk.html` — aydınlatma metni

## Ürün ekleme
"Fresh Tedarik Web" Google tablosundaki **Ürünler** sekmesine satır ekleyin. `Yayında = Evet` olan ürünler sitede görünür.
`Görsel URL` alanına tam görsel adresi ya da Pexels fotoğraf numarası yazılabilir.
Tablonun sitede okunabilmesi için paylaşım ayarı "Bağlantıya sahip olan herkes: Görüntüleyici" olmalıdır.
