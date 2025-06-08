import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

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
 */
const useGameSocket = (lobbyId, userId) => {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Socket referansı
  const socketRef = useRef(null);

  // Socket bağlantısı kur
  useEffect(() => {
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
      
      // Socket.IO bağlantısı kur - sadece polling kullan (WebSocket devre dışı)
      socketRef.current = io(SOCKET_URL, {
        path: '/socket.io',
        query: {
          lobbyId,
          userId,
          game: 'minesweeper'
        },
        transports: ['polling'], // Sadece polling kullan, WebSocket devre dışı
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        withCredentials: false,
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
        
        // Hata mesajlarından çevrimdışı mod referanslarını kaldır
        let errorMsg = 'Bağlantı hatası';
        if (err && err.message) {
          if (err.message.includes('xhr poll error') || err.message.includes('500')) {
            errorMsg = 'Sunucu hatası';
          } else if (err.message.includes('websocket error')) {
            errorMsg = 'Bağlantı hatası';
          } else {
            errorMsg = 'Bağlantı hatası';
          }
        }
        
        setError(errorMsg);
        setIsConnected(false);
        
        // Yeniden bağlanma denemesi sayısını artır
        setReconnectAttempts(prev => prev + 1);
        
        // Çok fazla deneme olduysa
        if (reconnectAttempts >= 2) {
          console.warn('Çok fazla bağlantı denemesi oldu');
          setError('Bağlantı hatası');
          if (socketRef.current) {
            socketRef.current.close();
          }
        }
      });

      socketRef.current.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.log('Socket bağlantısı kesildi:', reason);
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          setError('Bağlantı kesildi');
        } else {
          setError('Bağlantı kesildi');
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
    }
  }, [lobbyId, userId, reconnectAttempts]);

  // Hücre açma işlemi
  const sendOpenCell = (row, col) => {
    if (socketRef.current && isConnected) {
      console.log('Hücre açma gönderiliyor:', { row, col });
      socketRef.current.emit(SOCKET_EVENTS.OPEN_CELL, { lobbyId, row, col });
    } else {
      console.warn('Socket bağlantısı olmadan hücre açma isteği yapılamaz');
    }
  };

  // Bayrak işlemi
  const sendToggleFlag = (row, col, isFlagged) => {
    if (socketRef.current && isConnected) {
      console.log('Bayrak değiştirme gönderiliyor:', { row, col, isFlagged });
      socketRef.current.emit(SOCKET_EVENTS.TOGGLE_FLAG, { lobbyId, row, col, isFlagged });
    } else {
      console.warn('Socket bağlantısı olmadan bayrak değiştirme isteği yapılamaz');
    }
  };

  // Oyun sonucu
  const sendGameResult = (result) => {
    if (socketRef.current && isConnected) {
      console.log('Oyun sonucu gönderiliyor:', result);
      socketRef.current.emit(SOCKET_EVENTS.GAME_RESULT, {
        lobbyId,
        userId,
        gameType: 'minesweeper',
        result
      });
    } else {
      console.warn('Socket bağlantısı olmadan oyun sonucu gönderilemiyor');
    }
  };

  // Mesaj gönderme
  const sendMessage = (text) => {
    if (socketRef.current && isConnected) {
      const message = {
        id: `msg-${Date.now()}`,
        lobbyId,
        userId,
        username: localStorage.getItem('mines_playerName') || 'Oyuncu',
        text,
        timestamp: new Date().toISOString()
      };
      
      console.log('Mesaj gönderiliyor:', message);
      socketRef.current.emit(SOCKET_EVENTS.MESSAGE, message);
      
      // Mesajı lokalde göster
      setMessages((prev) => [...prev, message]);
    } else {
      console.warn('Socket bağlantısı olmadan mesaj gönderilemiyor');
    }
  };

  // Yeniden bağlan
  const reconnect = () => {
    console.log('Yeniden bağlanma başlatılıyor...');
    
    if (socketRef.current) {
      socketRef.current.connect();
      return true;
    }
    
    return false;
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