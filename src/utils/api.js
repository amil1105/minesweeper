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
  
  // Varsayılan API URL
  console.log('API bağlantısı için varsayılan URL kullanılıyor');
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

// Çevrimdışı mod durumu
let isInDemoMode = false;

// Çevrimdışı mod callback'i
let demoModeCallback = null;

// Çevrimdışı mod callback'ini ayarla
export const setDemoModeCallback = (callback) => {
  demoModeCallback = callback;
};

// Çevrimdışı mod kontrolü (her zaman false döndürür)
export const isDemoMode = () => {
  // Her zaman false döndür
  return false;
};

// Çevrimdışı modu manuel olarak ayarla
export const setDemoMode = (isDemoMode) => {
  // Varsayılan değeri ayarla
  isInDemoMode = false;
  localStorage.setItem('minesweeper-demo-mode', 'false');
  
  // Callback varsa çağır
  if (demoModeCallback) {
    demoModeCallback(false);
  }
};

// API bağlantısını kontrol et
export const checkApiConnection = async () => {
  try {
    // Gerçek API isteği
    const response = await api.get('/health', { timeout: 3000 });
    
    // Bağlantı başarılıysa
    if (response.status === 200) {
      isInDemoMode = false;
      return true;
    } else {
      // Başarısız yanıt durumunda
      console.warn('API sağlık kontrolü başarısız');
      isInDemoMode = true;
      return false;
    }
  } catch (error) {
    // Hata detaylarını yazdır
    if (error.response) {
      // Sunucu yanıt verdi ancak 2xx kapsamı dışında
      console.warn('API hata yanıtı:', error.response.status);
    } else if (error.request) {
      // İstek yapıldı ancak yanıt alınamadı
      console.warn('API yanıt vermedi');
    } else {
      // İstek yapılamadı
      console.warn('API isteği yapılamadı');
    }
    
    // Hata durumunda
    isInDemoMode = true;
    return false;
  }
};

// Uygulama başlangıcında bağlantıyı kontrol et
(async () => {
  try {
    const isConnected = await checkApiConnection();
    console.log(`API bağlantı durumu: ${isConnected ? 'Bağlı' : 'Bağlantı yok'}`);
  } catch (err) {
    console.warn('API bağlantı kontrolü sırasında hata oluştu');
    isInDemoMode = true;
  }
})();

// Lobi verilerini al
export const getLobbyData = async (lobbyId) => {
  try {
    // Bağlantıyı kontrol et
    const isConnected = await checkApiConnection();
    
    // Çevrimdışı modunda ise veya bağlantı yoksa yerel veri döndür
    if (!isConnected || isDemoMode()) {
      console.log('Yerel lobi verileri kullanılıyor');
      
      // Lobi verisi
      return {
        _id: lobbyId,
        name: 'Mayın Tarlası Lobisi',
        game: 'mines',
        maxPlayers: 4,
        players: [
          { id: localStorage.getItem('mines_playerId') || 'local-player', name: localStorage.getItem('mines_playerName') || 'Oyuncu', isReady: true }
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
    try {
      console.log(`Lobi verileri alınıyor: /lobbies/${lobbyId}`);
      const response = await api.get(`/lobbies/${lobbyId}`, { timeout: 5000 });
      console.log('Lobi verileri başarıyla alındı');
      return response.data;
    } catch (apiError) {
      console.error('API isteği sırasında hata');
      
      // Belirli HTTP hata kodlarını kontrol et
      if (apiError.response) {
        // Sunucu yanıt verdi ancak 2xx kapsamı dışında bir durum kodu
        console.error('HTTP Hata Kodu:', apiError.response.status);
        
        // 404 Not Found - Lobi bulunamadı
        if (apiError.response.status === 404) {
          throw new Error('Belirtilen lobi bulunamadı');
        }
        
        // 500 Internal Server Error - Sunucu hatası
        if (apiError.response.status === 500) {
          throw new Error('Sunucu hatası');
        }
      }
      
      // Ağ hatası veya timeout
      if (apiError.code === 'ECONNABORTED' || !apiError.response) {
        throw new Error('Sunucu bağlantısı kurulamadı');
      }
      
      // Genel hata
      throw new Error('Lobi verisi alınamadı');
    }
  } catch (error) {
    console.error('Lobi verisi alınamadı:', error);
    
    // Hata durumunda
    isInDemoMode = true;
    
    // Lobi verisi
    return {
      _id: lobbyId,
      name: 'Mayın Tarlası Lobisi',
      game: 'mines',
      maxPlayers: 4,
      players: [
        { id: localStorage.getItem('mines_playerId') || 'local-player', name: localStorage.getItem('mines_playerName') || 'Oyuncu', isReady: true }
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
    // Çevrimdışı modunda işlem yapma
    if (isDemoMode()) {
      console.log('Çevrimdışı modunda oyun durumu güncellenmesi simüle ediliyor', gameState);
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
    // Çevrimdışı modunda işlem yapma
    if (isDemoMode()) {
      console.log('Çevrimdışı modunda oyun sonucu kaydedilmesi simüle ediliyor', result);
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