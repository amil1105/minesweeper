import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { isDemoMode } from '../utils/api';

// Socket bağlantı URL'i
const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://game-center-api.example.com'
  : 'http://localhost:5000';

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

    try {
      // Socket bağlantısı kur
      socketRef.current = io(`${SOCKET_URL}/game`, {
        query: {
          lobbyId,
          userId,
          game: 'minesweeper'
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      // Bağlantı event listener'ları
      socketRef.current.on('connect', () => {
        console.log('Socket bağlantısı kuruldu:', socketRef.current.id);
        setIsConnected(true);
        setError(null);
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('Socket bağlantı hatası:', err);
        setError('Sunucu bağlantısı kurulamadı. Tekrar deneyin veya demo modunda oynayın.');
        setIsConnected(false);
      });

      socketRef.current.on('disconnect', (reason) => {
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

      socketRef.current.on('gameState', (data) => {
        console.log('Oyun durumu güncellendi:', data);
        setGameState(data);
      });

      socketRef.current.on('message', (data) => {
        console.log('Yeni mesaj:', data);
        setMessages((prev) => [...prev, data]);
      });

      // Temizlik
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } catch (err) {
      console.error('Socket bağlantısı oluşturulurken hata:', err);
      setError('Socket bağlantısı oluşturulurken hata oluştu. Demo moduna geçiliyor...');
      
      // Hata durumunda demo mod
      setPlayers([{
        id: userId || `demo-${Date.now()}`,
        username: localStorage.getItem('mines_playerName') || 'Sen',
        status: 'playing',
        score: 0
      }]);
      setIsConnected(true);
    }
  }, [lobbyId, userId, demoMode]);

  // Hücre açma işlemi
  const sendOpenCell = (row, col) => {
    if (demoMode) {
      console.log('Demo modunda hücre açma:', row, col);
      return;
    }
    
    if (socketRef.current && isConnected) {
      socketRef.current.emit('openCell', { row, col });
    }
  };

  // Bayrak işlemi
  const sendToggleFlag = (row, col, isFlagged) => {
    if (demoMode) {
      console.log('Demo modunda bayrak değiştirme:', row, col, isFlagged);
      return;
    }
    
    if (socketRef.current && isConnected) {
      socketRef.current.emit('toggleFlag', { row, col, isFlagged });
    }
  };

  // Oyun sonucu
  const sendGameResult = (result) => {
    if (demoMode) {
      console.log('Demo modunda oyun sonucu:', result);
      return;
    }
    
    if (socketRef.current && isConnected) {
      socketRef.current.emit('gameResult', result);
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
      socketRef.current.emit('message', { text });
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
    sendMessage
  };
};

export default useGameSocket; 