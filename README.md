# 💣 Mayın Tarlası (Minesweeper)

Bu proje, Game Center platformu için geliştirilmiş olan Mayın Tarlası oyunudur. Hem tek başına çalışabilir hem de ana Game Center uygulaması içinde iframe olarak yüklenebilir.

## 🚀 Özellikler

- Modern, duyarlı (responsive) arayüz tasarımı
- Tek oyunculu ve çok oyunculu modlar
- Backend olmadığında otomatik demo modu
- Özelleştirilebilir oyun alanı boyutu ve mayın sayısı
- Bayrak işaretleme ve sayaç
- Zaman tutucu

## 🛠️ Teknolojiler

- React 18
- Vite
- Material UI
- Socket.IO (çok oyunculu mod için)

## 💻 Kurulum

Projeyi yerel ortamınızda çalıştırmak için:

```bash
# Gerekli bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

## 🔌 Demo Modu

Uygulama, backend API'ye bağlanamadığında otomatik olarak demo moduna geçer. Bu mod şunları sağlar:

- Simüle edilmiş Socket.IO bağlantısı
- Yerel oyun durumu yönetimi
- Tek oyuncu deneyimi

Demo modunu manuel olarak etkinleştirmek için:
```javascript
localStorage.setItem('game-center-demo-mode', 'true');
```

## 🔄 Ana Uygulama Entegrasyonu

Oyun, ana Game Center uygulaması içinde iframe olarak yüklenir:

```jsx
<iframe 
  src="http://localhost:3001?lobbyId={lobbyId}" 
  title="Mayın Tarlası" 
  width="100%" 
  height="600px" 
  style={{ border: 'none' }}
/>
```

## 📁 Proje Yapısı

```
/src
  /components       # UI bileşenleri
  /hooks            # Özel React hooks
  /pages            # Sayfa bileşenleri
  /utils            # Yardımcı işlevler ve API
  App.jsx           # Ana uygulama bileşeni
  main.jsx          # Giriş noktası
```

## 🧩 Geliştirme

Yeni özellikler eklerken veya hataları düzeltirken lütfen mevcut kod stiline uyun:
- Functional component ve hook'ları kullanın
- Material UI bileşenlerini tercih edin
- Tip güvenliği için prop-types kullanın
- Temiz ve yorumlu kod yazın

## 📝 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır. 