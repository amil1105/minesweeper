import axios from 'axios';

// API URL'sini window.__VITE_ENV__ veya __API_URL__ global değişkenlerinden al
// Bu değişkenler vite.config.js'den geliyor
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Vite ortam değişkenleri varsa onu kullan
    if (window.__VITE_ENV__?.VITE_API_URL) {
      return window.__VITE_ENV__.VITE_API_URL;
    }
    
    // Global değişken varsa onu kullan
    if (window.__API_URL__) {
      return window.__API_URL__;
    }
  }
  
  // Varsayılan olarak demo mode kullan
  console.log('API bağlantısı bulunamadı, demo moda geçiliyor...');
  isInDemoMode = true;
  return 'http://localhost:3001/api';
};

// API baz URL'i
const API_URL = getApiUrl();

console.log('API URL yapılandırması:', API_URL);

// API istek yapılandırması
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // CORS cookie aktarımı için
});

// İstek interceptor'ı
api.interceptors.request.use(
  (config) => {
    // LocalStorage'dan token al
    const token = localStorage.getItem('game-center-token');
    
    // Token varsa, header'a ekle
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Cevap interceptor'ı
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.warn('API Hatası:', error.message || 'Bilinmeyen hata');
    
    // 401 hatası durumunda oturumu sonlandır
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('game-center-token');
    }
    
    return Promise.reject(error);
  }
);

// Demo mod durumu
let isInDemoMode = false; // Başlangıçta demo mod kapalı

// Demo modu callback'i
let demoModeCallback = null;

// Demo modu callback'ini ayarla
export const setDemoModeCallback = (callback) => {
  demoModeCallback = callback;
};

// Demo modu kontrolü (gerçek API olmadığında veya istenirse)
export const isDemoMode = () => {
  // Doğrudan LocalStorage'dan okunan değer varsa onu kullan
  const storedValue = localStorage.getItem('minesweeper-demo-mode');
  if (storedValue === 'true' || storedValue === 'false') {
    return storedValue === 'true';
  }
  
  // Varsayılan olarak demo modu kapalı
  return false;
};

// Demo modu manuel olarak ayarla
export const setDemoMode = (isDemoMode) => {
  isInDemoMode = isDemoMode;
  localStorage.setItem('minesweeper-demo-mode', isDemoMode.toString());
  
  // Callback varsa çağır
  if (demoModeCallback) {
    demoModeCallback(isDemoMode);
  }
  
  console.log(`Demo mod ${isDemoMode ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`);
};

// API bağlantısını kontrol et
export const checkApiConnection = async () => {
  try {
    // Gerçek API isteği
    const response = await api.get('/health', { timeout: 5000 });
    
    // Bağlantı başarılıysa demo modu kapat
    if (response.status === 200) {
      isInDemoMode = false;
      return true;
    } else {
      // Başarısız yanıt durumunda demo moda geç
      console.warn('API sağlık kontrolü başarısız, demo moda geçiliyor...');
      isInDemoMode = true;
      return false;
    }
  } catch (error) {
    console.warn('API bağlantı hatası:', error.message);
    // Hata durumunda demo moda geç
    isInDemoMode = true;
    return false;
  }
};

// Uygulama başlangıcında bağlantıyı kontrol et
(async () => {
  try {
    const isConnected = await checkApiConnection();
    console.log(`API bağlantı durumu: ${isConnected ? 'Bağlı' : 'Bağlantı yok, demo mod aktif'}`);
  } catch (err) {
    console.warn('API bağlantı kontrolü sırasında hata oluştu, demo mod aktif.');
    isInDemoMode = true;
  }
})();

// Lobi verilerini al
export const getLobbyData = async (lobbyId) => {
  try {
    // Bağlantıyı kontrol et
    await checkApiConnection();
    
    // Demo modunda ise sahte veri döndür
    if (isDemoMode()) {
      console.log('Demo modunda sahte lobi verileri döndürülüyor');
      
      // Sahte lobi verisi
      return {
        _id: lobbyId,
        name: 'Demo Mayın Tarlası Lobisi',
        game: 'mines',
        maxPlayers: 4,
        players: [
          { id: localStorage.getItem('mines_playerId') || 'demo-player', name: localStorage.getItem('mines_playerName') || 'Demo Oyuncu', isReady: true }
        ],
        settings: {
          minesweeper: {
            width: 9,
            height: 9,
            mines: 10
          }
        },
        status: 'playing'
      };
    }
    
    // Gerçek API isteği
    const response = await api.get(`/lobbies/${lobbyId}`);
    return response.data;
  } catch (error) {
    console.error('Lobi verisi alınamadı:', error);
    
    // Hata durumunda demo mod
    isInDemoMode = true;
    
    // Sahte lobi verisi
    return {
      _id: lobbyId,
      name: 'Demo Mayın Tarlası Lobisi',
      game: 'mines',
      maxPlayers: 4,
      players: [
        { id: localStorage.getItem('mines_playerId') || 'demo-player', name: localStorage.getItem('mines_playerName') || 'Demo Oyuncu', isReady: true }
      ],
      settings: {
        minesweeper: {
          width: 9,
          height: 9,
          mines: 10
        }
      },
      status: 'playing'
    };
  }
};

// Oyun durumunu güncelle
export const updateGameState = async (lobbyId, gameState) => {
  try {
    // Demo modunda işlem yapma
    if (isDemoMode()) {
      console.log('Demo modunda oyun durumu güncellenmesi simüle ediliyor', gameState);
      return { success: true };
    }
    
    // Gerçek API isteği
    const response = await api.put(`/games/minesweeper/${lobbyId}`, gameState);
    return response.data;
  } catch (error) {
    console.error('Oyun durumu güncellenemedi:', error);
    // Hata durumunda başarılı gibi davran
    return { success: true };
  }
};

// Oyun sonucunu kaydet
export const saveGameResult = async (lobbyId, result) => {
  try {
    // Demo modunda işlem yapma
    if (isDemoMode()) {
      console.log('Demo modunda oyun sonucu kaydedilmesi simüle ediliyor', result);
      return { success: true };
    }
    
    // Gerçek API isteği
    const response = await api.post(`/games/minesweeper/${lobbyId}/result`, result);
    return response.data;
  } catch (error) {
    console.error('Oyun sonucu kaydedilemedi:', error);
    // Hata durumunda başarılı gibi davran
    return { success: true };
  }
};

// Yardımcı metodlar
export const apiHelper = {
  get: (endpoint, config = {}) => api.get(endpoint, config),
  post: (endpoint, data, config = {}) => api.post(endpoint, data, config),
  put: (endpoint, data, config = {}) => api.put(endpoint, data, config),
  delete: (endpoint, config = {}) => api.delete(endpoint, config)
};

export default api; 