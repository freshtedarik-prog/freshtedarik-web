/* Fresh Tedarik site ayarları.
   Ürünler Google Sheets'teki "Ürünler" sekmesinden okunur.
   Tablo herkese açık (görüntüleyici) değilse aşağıdaki yedek liste kullanılır. */
window.FT_CONFIG = {
  SHEET_ID: "1pyBY0LlGGiipOuuROrS22i0dcTQDe194Bo7NgUmCDy4",
  PRODUCTS_SHEET: "Ürünler",

  // Google Apps Script web uygulaması adresi (teklif formu -> Teklif Talepleri sekmesi + e-posta).
  // Kurulunca buraya yapıştırılacak: "https://script.google.com/macros/s/XXXX/exec"
  FORM_ENDPOINT: "https://script.google.com/macros/s/AKfycby3nD-gPhJK53NP8Y2fVlofnMfVvnt3x9k9WZkh8QAplHfX9dBeDxEsqe79ljjssTMF/exec",

  WHATSAPP: "905301141344",
  PHONE_DISPLAY: "0530 114 13 44",

  // Google Analytics 4 ve Google Ads (kurulumda doldurulacak)
  GA_ID: "",        // "G-XXXXXXXXXX"
  ADS_ID: "",       // "AW-XXXXXXXXX"
  ADS_LEAD_LABEL: "", // Google Ads dönüşüm etiketi

  CATEGORIES: ["Sebze", "Meyve", "Kuru Gıda & Bakliyat", "Kumanya"],

  DISTRICTS: ["Adalar","Arnavutköy","Ataşehir","Avcılar","Bağcılar","Bahçelievler","Bakırköy","Başakşehir","Bayrampaşa","Beşiktaş","Beykoz","Beylikdüzü","Beyoğlu","Büyükçekmece","Çatalca","Çekmeköy","Esenler","Esenyurt","Eyüpsultan","Fatih","Gaziosmanpaşa","Güngören","Kadıköy","Kağıthane","Kartal","Küçükçekmece","Maltepe","Pendik","Sancaktepe","Sarıyer","Silivri","Sultanbeyli","Sultangazi","Şile","Şişli","Tuzla","Ümraniye","Üsküdar","Zeytinburnu"]
};

/* Yedek ürün listesi (Sheets ile aynı içerik). img: Pexels fotoğraf numarası */
window.FT_FALLBACK_PRODUCTS = [
  {"id": "FT-001", "cat": "Sebze", "name": "Domates", "unit": "kg", "sale": "Kasa / Kg", "season": "Tüm yıl", "desc": "Salata, sos ve sıcak mutfak için günlük hal seçimi, sert ve dolgun domates.", "img": "https://media.istockphoto.com/id/2161594984/es/foto/tomates-rojos-en-primer-plano-de-la-mesa-del-mercado-vista-superior-imagen-de-comida-saludable.jpg?s=612x612&w=0&k=20&c=GXTumWuamBk-xokC-UPHvVp3P_eYD4cQZVnliyZGKMk=", "featured": true},
  {"id": "FT-002", "cat": "Sebze", "name": "Sivri Biber", "unit": "kg", "sale": "Kasa / Kg", "season": "Tüm yıl", "desc": "Kahvaltı tabakları ve sıcak yemekler için taze, parlak kabuklu sivri biber.", "img": "10899475", "featured": false},
  {"id": "FT-021", "cat": "Sebze", "name": "Çarliston Biber", "unit": "kg", "sale": "Kasa / Kg", "season": "Tüm yıl", "desc": "Açık yeşil, ince kabuklu çarliston; kahvaltı, kızartma ve salatalar için.", "img": "https://toprakana.com.tr/wp-content/uploads/2021/12/carliston.jpg", "featured": false},
  {"id": "FT-022", "cat": "Sebze", "name": "Köy Biberi", "unit": "kg", "sale": "Kasa / Kg", "season": "Yaz - Sonbahar", "desc": "Kıvrımlı, aromalı köy biberi; ızgara ve közleme için ideal.", "img": "2893525", "featured": false},
  {"id": "FT-023", "cat": "Sebze", "name": "Kapya Biber", "unit": "kg", "sale": "Kasa / Kg", "season": "Tüm yıl", "desc": "Etli ve tatlı kapya; közleme, sos ve meze hazırlığı için.", "img": "12482461", "featured": false},
  {"id": "FT-024", "cat": "Sebze", "name": "Dolmalık Biber", "unit": "kg", "sale": "Kasa / Kg", "season": "Tüm yıl", "desc": "Dolma ve sote için düzgün formlu, kalın etli dolmalık biber.", "img": "2893635", "featured": false},
  {"id": "FT-025", "cat": "Sebze", "name": "Renkli Kaliforniya Biber", "unit": "kg", "sale": "Kasa / Kg", "season": "Tüm yıl", "desc": "Kırmızı, sarı ve turuncu kaliforniya; salata ve wok tabakları için.", "img": "35525568", "featured": false},
  {"id": "FT-026", "cat": "Sebze", "name": "Acı Biber", "unit": "kg", "sale": "Kasa / Kg", "season": "Tüm yıl", "desc": "Acı sevenler için yeşil ve kırmızı acı biber; sos ve garnitürde.", "img": "2893882", "featured": false},
  {"id": "FT-003", "cat": "Sebze", "name": "Kuru Soğan", "unit": "kg", "sale": "Çuval / Kg", "season": "Tüm yıl", "desc": "Profesyonel mutfakların temel malzemesi; ayıklanmış, sağlam kuru soğan.", "img": "6316541", "featured": false},
  {"id": "FT-004", "cat": "Sebze", "name": "Patates", "unit": "kg", "sale": "Çuval / Kg", "season": "Tüm yıl", "desc": "Kızartma ve fırın için uygun, nişasta dengesi iyi seçme patates.", "img": "36400786", "featured": true},
  {"id": "FT-005", "cat": "Sebze", "name": "Ispanak", "unit": "kg", "sale": "Kasa / Kg", "season": "Kış", "desc": "Temizlenmeye hazır, yaprakları canlı taze ıspanak.", "img": "https://lh3.googleusercontent.com/d/1qu8f_1BrYv4nnRKx1ngJZMNPwUmWBgEW=w1600", "featured": false},
  {"id": "FT-027", "cat": "Sebze", "name": "Brokoli", "unit": "kg", "sale": "Kasa / Kg", "season": "Sonbahar - Kış", "desc": "Sıkı çiçekli, koyu yeşil brokoli; buharda, fırında ve salatada.", "img": "30893315", "featured": false},
  {"id": "FT-006", "cat": "Sebze", "name": "Brüksel Lahanası", "unit": "kg", "sale": "Kasa / Kg", "season": "Kış", "desc": "Garnitür ve fırın tabakları için sıkı başlı Brüksel lahanası.", "img": "8827291", "featured": false},
  {"id": "FT-007", "cat": "Meyve", "name": "Kırmızı Elma", "unit": "kg", "sale": "Kasa / Kg", "season": "Sonbahar - Kış", "desc": "Tatlı, sunum ve kahvaltı tabakları için gevrek kırmızı elma.", "img": "14833258", "featured": false},
  {"id": "FT-008", "cat": "Meyve", "name": "Yeşil Elma", "unit": "kg", "sale": "Kasa / Kg", "season": "Sonbahar - Kış", "desc": "Smoothie, salata ve tart için ekşi aromalı yeşil elma.", "img": "28387802", "featured": false},
  {"id": "FT-009", "cat": "Meyve", "name": "Portakal", "unit": "kg", "sale": "Kasa / Kg", "season": "Kış", "desc": "Taze sıkım meyve suyu için bol sulu portakal.", "img": "38516693", "featured": true},
  {"id": "FT-010", "cat": "Meyve", "name": "Mandalina", "unit": "kg", "sale": "Kasa / Kg", "season": "Kış", "desc": "Kahvaltı ve tatlı servisleri için kolay soyulan mandalina.", "img": "38571539", "featured": false},
  {"id": "FT-028", "cat": "Meyve", "name": "Muz", "unit": "kg", "sale": "Kasa / Kg", "season": "Tüm yıl", "desc": "Smoothie, pankek ve tatlılar için olgunluğu ayarlanmış muz.", "img": "4399936", "featured": false},
  {"id": "FT-029", "cat": "Meyve", "name": "Ananas", "unit": "adet", "sale": "Koli / Adet", "season": "Tüm yıl", "desc": "Meyve tabakları, kokteyl ve tatlılar için tatlı, sulu ananas.", "img": "7194817", "featured": false},
  {"id": "FT-011", "cat": "Meyve", "name": "Kivi", "unit": "kg", "sale": "Kasa / Kg", "season": "Kış", "desc": "Smoothie bowl ve pastacılık için olgunluğu seçilmiş kivi.", "img": "7255620", "featured": false},
  {"id": "FT-012", "cat": "Meyve", "name": "Çilek", "unit": "kg", "sale": "Kasa / Kg", "season": "İlkbahar - Yaz", "desc": "Pasta, kahvaltı ve kokteyl için kırmızı, aromalı çilek.", "img": "18018686", "featured": false},
  {"id": "FT-013", "cat": "Meyve", "name": "Üzüm", "unit": "kg", "sale": "Kasa / Kg", "season": "Yaz - Sonbahar", "desc": "Meyve tabakları ve peynir sunumları için çekirdeksiz üzüm.", "img": "29195196", "featured": false},
  {"id": "FT-014", "cat": "Kuru Gıda & Bakliyat", "name": "Kırmızı Mercimek", "unit": "kg", "sale": "Çuval / Paket", "season": "Tüm yıl", "desc": "Çorba mutfağının vazgeçilmezi, temizlenmiş kırmızı mercimek.", "img": "8108209", "featured": true},
  {"id": "FT-015", "cat": "Kuru Gıda & Bakliyat", "name": "Nohut", "unit": "kg", "sale": "Çuval / Paket", "season": "Tüm yıl", "desc": "Humus ve sulu yemekler için iri taneli, kolay pişen nohut.", "img": "7656561", "featured": false},
  {"id": "FT-016", "cat": "Kuru Gıda & Bakliyat", "name": "Kuru Fasulye", "unit": "kg", "sale": "Çuval / Paket", "season": "Tüm yıl", "desc": "Esnaf lokantası klasiği için seçme kuru fasulye.", "img": "5228850", "featured": false},
  {"id": "FT-017", "cat": "Kuru Gıda & Bakliyat", "name": "Baldo Pirinç", "unit": "kg", "sale": "Çuval / Paket", "season": "Tüm yıl", "desc": "Lapa değil tane tane pilav için baldo pirinç.", "img": "6086556", "featured": false},
  {"id": "FT-018", "cat": "Kuru Gıda & Bakliyat", "name": "Pilavlık Bulgur", "unit": "kg", "sale": "Çuval / Paket", "season": "Tüm yıl", "desc": "Pilav ve garnitür için iri pilavlık bulgur.", "img": "36498027", "featured": false},
  {"id": "FT-019", "cat": "Kuru Gıda & Bakliyat", "name": "Yeşil Mercimek", "unit": "kg", "sale": "Çuval / Paket", "season": "Tüm yıl", "desc": "Salata ve sulu yemekler için dağılmayan yeşil mercimek.", "img": "36021103", "featured": false},
  {"id": "FT-020", "cat": "Kumanya", "name": "Kumanya Paketi", "unit": "koli", "sale": "Koli", "season": "Tüm yıl", "desc": "İçeriği işletmenizin ihtiyacına göre hazırlanan kuru gıda kumanya paketi.", "img": "7843985", "featured": false}
];
