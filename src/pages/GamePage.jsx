import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Container, Paper, Alert, Button, CircularProgress, Stack, Snackbar } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import GameBoard from '../components/GameBoard';
import useMinesweeper from '../hooks/useMinesweeper';
import useGameSocket from '../hooks/useGameSocket';
import { getLobbyData, checkApiConnection } from '../utils/api';

// Yardımcı fonksiyon: UUID olmadan benzersiz ID oluştur
const generateUniqueId = (prefix = '') => {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;
};

const GamePage = ({ lobbyId: propLobbyId }) => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lobbyData, setLobbyData] = useState(null);
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [settings, setSettings] = useState({
    width: 9,
    height: 9,
    mines: 10
  });
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'info' });
  const [apiChecked, setApiChecked] = useState(false);

  // Router hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL'den ve props'tan lobi ID'sini al
  const queryParams = new URLSearchParams(location.search);
  const urlLobbyId = queryParams.get('lobbyId');
  
  // Lobi ID'sini birkaç kaynaktan kontrol ederek belirle
  const lobbyIdToUse = propLobbyId || urlLobbyId || localStorage.getItem('mines_lobbyId');

  // API bağlantısını kontrol et
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await checkApiConnection();
        console.log('API bağlantı durumu:', isConnected);
      } catch (err) {
        console.error('API bağlantı kontrolü sırasında hata:', err);
      } finally {
        setApiChecked(true);
      }
    };
    
    checkConnection();
  }, []);
  
  console.log("GamePage: Kullanılan Lobi ID:", lobbyIdToUse);

  // Kullanıcı kimliğini başlangıçta ayarla
  useEffect(() => {
    // Mevcut kullanıcı kimliğini kontrol et
    let currentUserId = localStorage.getItem('mines_playerId');
    
    // Kullanıcı kimliği yoksa oluştur
    if (!currentUserId) {
      currentUserId = generateUniqueId('player-');
      localStorage.setItem('mines_playerId', currentUserId);
    }
    
    // Kullanıcı adını otomatik ata, form gösterme
    let currentUsername = localStorage.getItem('mines_playerName');
    if (!currentUsername) {
      currentUsername = 'Oyuncu';
      localStorage.setItem('mines_playerName', currentUsername);
    }
    
    setUsername(currentUsername);
    setUserId(currentUserId);
  }, []);

  // Lobi verisini yükle
  useEffect(() => {
    if (!apiChecked || !userId) return;
    
    const fetchLobbyData = async () => {
      if (!lobbyIdToUse) {
        // Eğer lobi ID yoksa, yeni bir lobi ID oluştur ve local storage'a kaydet
        const newLobbyId = generateUniqueId('lobby-');
        localStorage.setItem('mines_lobbyId', newLobbyId);
        
        setNotification({
          show: true,
          message: 'Yeni bir oyun lobisi oluşturuldu!',
          severity: 'success'
        });
        
        console.log('Yeni lobi oluşturuldu:', newLobbyId);
        
        // Yeni lobi ID ile sayfayı yenile
        navigate(`?lobbyId=${newLobbyId}`, { replace: true });
        return;
      }
      
      try {
        setLoading(true);
        // Gerçek API'den lobi verilerini al
        const data = await getLobbyData(lobbyIdToUse);
        setLobbyData(data);
        
        // Lobi ayarlarını kullan
        if (data && data.settings && data.settings.minesweeper) {
          setSettings(data.settings.minesweeper);
        }
        
        // Sadece lobi bağlantısı mesajı göster, çevrimdışı mod bildirimi gösterme
        setNotification({
          show: true,
          message: 'Oyun lobisine bağlanıldı!',
          severity: 'success'
        });
      } catch (err) {
        console.error('Lobi verisi yüklenirken hata:', err);
        // Hata durumunda varsayılan ayarları kullan
        setSettings({
          width: 9,
          height: 9,
          mines: 10
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLobbyData();
  }, [lobbyIdToUse, navigate, userId, apiChecked]);

  // Oyun ve socket hooks
  const {
    board,
    gameStatus,
    flagCount,
    mines,
    time,
    openCell,
    toggleFlag,
    resetGame
  } = useMinesweeper(
    settings.width,
    settings.height,
    settings.mines,
    handleGameEnd
  );

  const {
    isConnected,
    players,
    gameState,
    messages,
    error: socketError,
    sendOpenCell,
    sendToggleFlag,
    sendGameResult,
    sendMessage,
    reconnect
  } = useGameSocket(lobbyIdToUse, userId, false);

  // Bağlantı hatası durumunda bildirim göster
  useEffect(() => {
    // Bağlantı hatası olsa bile bildirim gösterme
    if (socketError) {
      console.log("Bağlantı hatası (gizlendi):", socketError);
    }
  }, [socketError]);

  // Oyun bittiğinde çağrılacak fonksiyon
  function handleGameEnd(result) {
    console.log('Oyun sonucu:', result);
    
    // Eğer socket bağlantısı varsa, sonucu sunucuya gönder
    if (isConnected) {
      sendGameResult(result);
    }
  }

  // Hücre tıklama işleyicisi
  const handleCellClick = (row, col) => {
    openCell(row, col);
    
    // Eğer socket bağlantısı varsa, hamleyi diğer oyunculara bildir
    if (isConnected) {
      sendOpenCell(row, col);
    }
  };

  // Sağ tıklama (bayrak) işleyicisi
  const handleCellRightClick = (row, col) => {
    toggleFlag(row, col);
    
    // Eğer socket bağlantısı varsa, hamleyi diğer oyunculara bildir
    if (isConnected) {
      sendToggleFlag(row, col);
    }
  };

  // Ayarları değiştir
  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    resetGame();
  };

  // Ana sayfaya dön
  const handleGoToHome = () => {
    // LocalStorage'daki lobi verisini temizle
    localStorage.removeItem('mines_lobbyId');
    
    // Ana sayfaya yönlendir
    if (window.top !== window.self) {
      // iframe içindeyse, parent'a mesaj gönder
      window.parent.postMessage({
        type: 'GAME_EXIT',
        game: 'minesweeper'
      }, '*');
    } else {
      // Değilse doğrudan ana sayfaya git
      window.location.href = '/';
    }
  };

  // Sunucuya yeniden bağlan
  const handleReconnect = async () => {
    // Sessizce yeniden bağlanmayı dene, bildirim gösterme
    if (reconnect && reconnect()) {
      console.log('Yeniden bağlantı denemesi başlatıldı');
    }
  };
  
  // Bildirimi kapat
  const handleCloseNotification = () => {
    setNotification({ ...notification, show: false });
  };

  // Yüklenme durumu
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h5" component="h1">
            Oyun Yükleniyor...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh' }}>
      {/* Hata mesajı */}
      {/* Hata mesajlarını gösterme
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      */}
      
      {/* Bağlantı durumu - tamamen kaldırıldı */}
      
      {/* Lobi bilgileri */}
      {lobbyData && (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Lobi: {lobbyData.name || lobbyIdToUse}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Oyuncu: {username}
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setNotification({
                  show: true,
                  message: 'Lobi bağlantısı kopyalandı!',
                  severity: 'success'
                });
              }}
            >
              Lobi Bağlantısını Kopyala
            </Button>
          </Stack>
        </Paper>
      )}

      <GameBoard
        board={board}
        gameStatus={gameStatus}
        flagCount={flagCount}
        mines={mines}
        time={time}
        onCellClick={handleCellClick}
        onCellRightClick={handleCellRightClick}
        onReset={resetGame}
        onSettingsChange={handleSettingsChange}
        players={players}
        currentPlayerId={userId}
        isMultiplayer={isConnected && players.length > 1}
      />
      
      {/* Socket bağlantı hatası - tamamen kaldırıldı */}
      
      {/* Bildirimler */}
      <Snackbar
        open={notification.show}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
          elevation={6}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GamePage; 