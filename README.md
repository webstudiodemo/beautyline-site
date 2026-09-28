# Beautyline Güzellik — Premium One Page

GitHub Pages üzerinde doğrudan çalışacak, build gerektirmeyen statik web sitesi.

## İçerik
- Sinematik hero açılışı
- Mouse-follow ışık efekti
- Butonlarda magnetic hover
- Scroll reveal animasyonları
- Hero parallax
- Premium tipografi ve editorial layout
- Hizmetler / galeri kartları
- Google yorumlarından uyarlanmış referanslar
- Randevu modalı
- WhatsApp'a otomatik doldurulmuş randevu mesajı
- Google Maps bağlantısı
- Mobil responsive tasarım

## WhatsApp'ı aktif etme
`script.js` içindeki:

```js
const WHATSAPP_NUMBER = '905XXXXXXXXX';
```

alanını işletmenin WhatsApp numarasıyla değiştirin. Numara `905xxxxxxxxx` formatında, boşluksuz olmalı.

## GitHub Pages
1. Dosyaları GitHub repository'sine yükleyin.
2. Settings → Pages → Deploy from branch → `main` / `/root` seçin.
3. Kaydedin. GitHub Pages birkaç dakika içinde siteyi yayınlar.

## Not
Görseller harici Unsplash CDN görselleridir. İsterseniz gerçek Beautyline iç mekan, ekip ve uygulama fotoğrafları `index.html` içindeki görsel URL'leriyle değiştirilebilir.

## Güncelleme
- Randevu CTA'ları doğrudan WhatsApp'a yönlenir.
- WhatsApp hedefi `905467249922` olarak ayarlanmıştır.
- Sinematik karanlık açılış / logo reveal eklendi.
- Scroll sırasında kartlar, görseller ve bölümler sürekli viewport konumuna göre hareket eder; aşağı/yukarı kaydırmada animasyon yeniden canlı kalır.
- Mouse-follow glow ve magnetic buton efektleri korunmuştur.
