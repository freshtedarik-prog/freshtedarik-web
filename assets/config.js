/* Fresh Tedarik site ayarları.
   Ürünler Google Sheets'teki "Ürünler" sekmesinden okunur.
   Tablo herkese açık (görüntüleyici) değilse aşağıdaki yedek liste kullanılır. */
window.FT_CONFIG = {
  SHEET_ID: "1pyBY0LlGGiipOuuROrS22i0dcTQDe194Bo7NgUmCDy4",
  PRODUCTS_SHEET: "Ürünler",

  // Google Apps Script web uygulaması adresi (teklif formu -> Teklif Talepleri sekmesi + e-posta).
  // Kurulunca buraya yapıştırılacak: "https://script.google.com/macros/s/XXXX/exec"
  FORM_ENDPOINT: "",

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
  { id: "FT-001", cat: "Sebze", name: "Domates", unit: "kg", sale: "Kasa / Kg", season: "Tüm yıl", desc: "Salata, sos ve sıcak mutfak için günlük hal seçimi, sert ve dolgun domates.", img: 33499935, featured: true },
  { id: "FT-002", cat: "Sebze", name: "Sivri Biber", unit: "kg", sale: "Kasa / Kg", season: "Tüm yıl", desc: "Kahvaltı tabakları ve sıcak yemekler için taze, parlak kabuklu sivri biber.", img: 10899475 },
  { id: "FT-003", cat: "Sebze", name: "Kuru Soğan", unit: "kg", sale: "Çuval / Kg", season: "Tüm yıl", desc: "Profesyonel mutfakların temel malzemesi; ayıklanmış, sağlam kuru soğan.", img: 6316541 },
  { id: "FT-004", cat: "Sebze", name: "Patates", unit: "kg", sale: "Çuval / Kg", season: "Tüm yıl", desc: "Kızartma ve fırın için uygun, nişasta dengesi iyi seçme patates.", img: 144248, featured: true },
  { id: "FT-005", cat: "Sebze", name: "Ispanak", unit: "kg", sale: "Kasa / Kg", season: "Kış", desc: "Temizlenmeye hazır, yaprakları canlı taze ıspanak.", img: 7511845 },
  { id: "FT-006", cat: "Sebze", name: "Brüksel Lahanası", unit: "kg", sale: "Kasa / Kg", season: "Kış", desc: "Garnitür ve fırın tabakları için sıkı başlı Brüksel lahanası.", img: 8827291 },
  { id: "FT-007", cat: "Meyve", name: "Kırmızı Elma", unit: "kg", sale: "Kasa / Kg", season: "Sonbahar - Kış", desc: "Tatlı, sunum ve kahvaltı tabakları için gevrek kırmızı elma.", img: 14833258 },
  { id: "FT-008", cat: "Meyve", name: "Yeşil Elma", unit: "kg", sale: "Kasa / Kg", season: "Sonbahar - Kış", desc: "Smoothie, salata ve tart için ekşi aromalı yeşil elma.", img: 28387802 },
  { id: "FT-009", cat: "Meyve", name: "Portakal", unit: "kg", sale: "Kasa / Kg", season: "Kış", desc: "Taze sıkım meyve suyu için bol sulu portakal.", img: 38516693, featured: true },
  { id: "FT-010", cat: "Meyve", name: "Mandalina", unit: "kg", sale: "Kasa / Kg", season: "Kış", desc: "Kahvaltı ve tatlı servisleri için kolay soyulan mandalina.", img: 38571539 },
  { id: "FT-011", cat: "Meyve", name: "Kivi", unit: "kg", sale: "Kasa / Kg", season: "Kış", desc: "Smoothie bowl ve pastacılık için olgunluğu seçilmiş kivi.", img: 7255620 },
  { id: "FT-012", cat: "Meyve", name: "Çilek", unit: "kg", sale: "Kasa / Kg", season: "İlkbahar - Yaz", desc: "Pasta, kahvaltı ve kokteyl için kırmızı, aromalı çilek.", img: 18018686 },
  { id: "FT-013", cat: "Meyve", name: "Üzüm", unit: "kg", sale: "Kasa / Kg", season: "Yaz - Sonbahar", desc: "Meyve tabakları ve peynir sunumları için çekirdeksiz üzüm.", img: 29195196 },
  { id: "FT-014", cat: "Kuru Gıda & Bakliyat", name: "Kırmızı Mercimek", unit: "kg", sale: "Çuval / Paket", season: "Tüm yıl", desc: "Çorba mutfağının vazgeçilmezi, temizlenmiş kırmızı mercimek.", img: 8108209, featured: true },
  { id: "FT-015", cat: "Kuru Gıda & Bakliyat", name: "Nohut", unit: "kg", sale: "Çuval / Paket", season: "Tüm yıl", desc: "Humus ve sulu yemekler için iri taneli, kolay pişen nohut.", img: 7656561 },
  { id: "FT-016", cat: "Kuru Gıda & Bakliyat", name: "Kuru Fasulye", unit: "kg", sale: "Çuval / Paket", season: "Tüm yıl", desc: "Esnaf lokantası klasiği için seçme kuru fasulye.", img: 5228850 },
  { id: "FT-017", cat: "Kuru Gıda & Bakliyat", name: "Baldo Pirinç", unit: "kg", sale: "Çuval / Paket", season: "Tüm yıl", desc: "Lapa değil tane tane pilav için baldo pirinç.", img: 6086556 },
  { id: "FT-018", cat: "Kuru Gıda & Bakliyat", name: "Pilavlık Bulgur", unit: "kg", sale: "Çuval / Paket", season: "Tüm yıl", desc: "Pilav ve garnitür için iri pilavlık bulgur.", img: 36498027 },
  { id: "FT-019", cat: "Kuru Gıda & Bakliyat", name: "Yeşil Mercimek", unit: "kg", sale: "Çuval / Paket", season: "Tüm yıl", desc: "Salata ve sulu yemekler için dağılmayan yeşil mercimek.", img: 36021103 },
  { id: "FT-020", cat: "Kumanya", name: "Kumanya Paketi", unit: "koli", sale: "Koli", season: "Tüm yıl", desc: "İçeriği işletmenizin ihtiyacına göre hazırlanan kuru gıda kumanya paketi.", img: 7843985 }
];
