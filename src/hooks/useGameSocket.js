import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { isDemoMode, setDemoMode } from '../utils/api';

// Sabit socket URL
const SOCKET_URL = 'http://localhost:3001';

console.log('Socket URL yapılandırması:', SOCKET_URL);

// Socket olay sabitleri
const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  JOIN_LOBBY: 'join_lobby',
  LOBBY_JOINED: 'lobby_joined',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  GAME_UPDATE: 'gameState',
  OPEN_CELL: 'openCell',
  TOGGLE_FLAG: 'toggleFlag',
  GAME_RESULT: 'gameResult',
  MESSAGE: 'message',
  ERROR: 'error'
};

/**
 * WebSocket bağlantısını yönetmek için custom hook
 * @param {string} lobbyId - Lobi ID'si
 * @param {string} userId - Kullanıcı ID'si
 * @param {boolean} forceDemoMode - Demo mod aktif mi
 */
const useGameSocket = (lobbyId, userId, forceDemoMode = false) => {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Socket referansı
  const socketRef = useRef(null);
  
  // Demo modu kontrolü
  const demoMode = forceDemoMode || isDemoMode();

  // Socket bağlantısı kur
  useEffect(() => {
    // Demo modunda ise socket bağlantısı kurmadan sahte veriler üret
    if (demoMode) {
      console.log('Demo modunda socket bağlantısı simülasyonu');
      
      // Demo oyuncuları
      const demoPlayers = [
        {
          id: userId || `demo-${Date.now()}`,
          username: localStorage.getItem('mines_playerName') || 'Sen',
          status: 'playing',
          score: 0
        }
      ];
      
      setPlayers(demoPlayers);
      setIsConnected(true);
      setError(null);
      
      return () => {
        console.log('Demo socket bağlantısı kapatılıyor (simülasyon)');
      };
    }
    
    // Demo modunda değilsek gerçek socket bağlantısı kur
    if (!lobbyId || !userId) {
      setError('Lobi ID veya kullanıcı ID eksik.');
      return;
    }

    console.log(`Socket bağlantısı kuruluyor: ${SOCKET_URL}`);
    console.log('Bağlantı bilgileri:', { lobbyId, userId, game: 'minesweeper' });

    try {
      // Önceki socket varsa kapat
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Socket.IO bağlantısı kur - maksimum uyumluluk için ayarlar
      socketRef.current = io(SOCKET_URL, {
        path: '/socket.io',
        query: {
          lobbyId,
          userId,
          game: 'minesweeper'
        },
        transports: ['polling', 'websocket'], // Önce polling dene, sonra websocket
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000, // Daha uzun timeout süresi
        withCredentials: false, // CORS sorunlarını önlemek için
        forceNew: true,
        autoConnect: true
      });

      // Bağlantı event listener'ları
      socketRef.current.on(SOCKET_EVENTS.CONNECT, () => {
        console.log('Socket bağlantısı kuruldu:', socketRef.current.id);
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
        
        // Bağlantı kurulduğunda oyuncu bilgilerini gönder
        socketRef.current.emit(SOCKET_EVENTS.JOIN_LOBBY, {
          lobbyId,
          userId,
          username: localStorage.getItem('mines_playerName') || 'Oyuncu',
          gameType: 'minesweeper'
        });
      });

      socketRef.current.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
        console.error('Socket bağlantı hatası:', err);
        setError(`Sunucu bağlantısı kurulamadı: ${err.message}`);
        setIsConnected(false);
        
        // Yeniden bağlanma denemesi sayısını artır
        setReconnectAttempts(prev => prev + 1);
        
        // Çok fazla deneme olduysa
        if (reconnectAttempts >= 2) {
          console.warn('Çok fazla bağlantı denemesi, demo moduna geçiş seçeneği sunuluyor');
          setError('Sunucuya bağlanılamadı. Oyunu demo modunda oynamak için sayfayı yenileyin.');
          socketRef.current.close();
        }
      });

      socketRef.current.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.log('Socket bağlantısı kesildi:', reason);
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          setError('Sunucu tarafından bağlantı kesildi.');
        } else {
          setError('Bağlantı kesildi. Yeniden bağlanılıyor...');
        }
      });

      // Oyun event listener'ları
      socketRef.current.on('players', (data) => {
        console.log('Oyuncular güncellendi:', data);
        setPlayers(data);
      });
      
      // Lobi katılım olayları
      socketRef.current.on(SOCKET_EVENTS.LOBBY_JOINED, (data) => {
        console.log('Lobiye katılındı:', data);
        if (data.players) {
          setPlayers(data.players);
        }
      });
      
      socketRef.current.on(SOCKET_EVENTS.PLAYER_JOINED, (data) => {
        console.log('Yeni oyuncu katıldı:', data);
        if (data.player) {
          setPlayers(prev => [...prev.filter(p => p.id !== data.player.id), data.player]);
        }
      });
      
      socketRef.current.on(SOCKET_EVENTS.PLAYER_LEFT, (data) => {
        console.log('Oyuncu ayrıldı:', data);
        if (data.playerId) {
          setPlayers(prev => prev.filter(p => p.id !== data.playerId));
        }
      });

      socketRef.current.on(SOCKET_EVENTS.GAME_UPDATE, (data) => {
        console.log('Oyun durumu güncellendi:', data);
        setGameState(data);
      });

      socketRef.current.on(SOCKET_EVENTS.MESSAGE, (data) => {
        console.log('Yeni mesaj:', data);
        setMessages((prev) => [...prev, data]);
      });
      
      // Hata mesajlarını dinle
      socketRef.current.on(SOCKET_EVENTS.ERROR, (errorMsg) => {
        console.error('Socket sunucu hatası:', errorMsg);
        setError(typeof errorMsg === 'string' ? errorMsg : 'Sunucu hatası');
      });

      // Temizlik
      return () => {
        if (socketRef.current) {
          console.log('Socket bağlantısı kapatılıyor');
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } catch (err) {
      console.error('Socket bağlantısı oluşturulurken hata:', err);
      setError(`Socket bağlantısı oluşturulurken hata: ${err.message}`);
      setIsConnected(false);
      
      // Bağlantı hatası durumunda demo moda geç
      console.warn('Socket bağlantısı oluşturulamadı, demo moda geçiliyor...');
      setDemoMode(true);
    }
  }, [lobbyId, userId, demoMode, reconnectAttempts]);

  // Hücre açma işlemi
  const sendOpenCell = (row, col) => {
    if (demoMode) {
      console.log('Demo modunda hücre açma:', row, col);
      return;
    }
    
    if (socketRef.current && isConnected) {
      console.log('Hücre açma gönderiliyor:', { row, col });
      socketRef.current.emit(SOCKET_EVENTS.OPEN_CELL, { lobbyId, row, col });
    } else {
      console.warn('Socket bağlantısı olmadan hücre açma isteği yapılamaz');
    }
  };

  // Bayrak işlemi
  const sendToggleFlag = (row, col, isFlagged) => {
    if (demoMode) {
      console.log('Demo modunda bayrak değiştirme:', row, col, isFlagged);
      return;
    }
    
    if (socketRef.current && isConnected) {
      console.log('Bayrak değiştirme gönderiliyor:', { row, col, isFlagged });
      socketRef.current.emit(SOCKET_EVENTS.TOGGLE_FLAG, { lobbyId, row, col, isFlagged });
    } else {
      console.warn('Socket bağlantısı olmadan bayrak değiştirme isteği yapılamaz');
    }
  };

  // Oyun sonucu
  const sendGameResult = (result) => {
    if (demoMode) {
      console.log('Demo modunda oyun sonucu:', result);
      return;
    }
    
    if (socketRef.current && isConnected) {
      console.log('Oyun sonucu gönderiliyor:', result);
      socketRef.current.emit(SOCKET_EVENTS.GAME_RESULT, { lobbyId, ...result });
    } else {
      console.warn('Socket bağlantısı olmadan oyun sonucu isteği yapılamaz');
    }
  };

  // Mesaj gönderme
  const sendMessage = (text) => {
    if (demoMode) {
      console.log('Demo modunda mesaj:', text);
      
      // Demo modunda yerel olarak mesajı ekle
      const newMessage = {
        id: Date.now(),
        userId,
        username: localStorage.getItem('mines_playerName') || 'Sen',
        text,
        timestamp: new Date().toISOString()
      };
      
      setMessages((prev) => [...prev, newMessage]);
      return;
    }
    
    if (socketRef.current && isConnected) {
      console.log('Mesaj gönderiliyor:', text);
      socketRef.current.emit(SOCKET_EVENTS.MESSAGE, { lobbyId, text });
    } else {
      console.warn('Socket bağlantısı olmadan mesaj isteği yapılamaz');
    }
  };
  
  // Bağlantı durumunu manuel yenileme
  const reconnect = () => {
    if (socketRef.current) {
      console.log('Socket bağlantısı yeniden kurulmaya çalışılıyor...');
      socketRef.current.connect();
    } else {
      // Socket yoksa yeni bağlantı kurulması için state'i güncelle
      setReconnectAttempts(0);
    }
  };

  return {
    isConnected,
    players,
    gameState,
    messages,
    error,
    sendOpenCell,
    sendToggleFlag,
    sendGameResult,
    sendMessage,
    reconnect
  };
};

export default useGameSocket; 