import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Container, Paper, Alert, Button, TextField, CircularProgress, Stack, Snackbar } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import GameBoard from '../components/GameBoard';
import useMinesweeper from '../hooks/useMinesweeper';
import useGameSocket from '../hooks/useGameSocket';
import { getLobbyData, isDemoMode, setDemoMode, checkApiConnection } from '../utils/api';

// Yardımcı fonksiyon: UUID olmadan benzersiz ID oluştur
const generateUniqueId = (prefix = '') => {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;
};

const GamePage = ({ lobbyId: propLobbyId, forceDemoMode = false }) => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lobbyData, setLobbyData] = useState(null);
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [demoMode, setDemoModeState] = useState(forceDemoMode || isDemoMode());
  const [settings, setSettings] = useState({
    width: 9,
    height: 9,
    mines: 10
  });
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [formError, setFormError] = useState('');
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
      if (forceDemoMode) {
        setDemoMode(true);
        setDemoModeState(true);
        setApiChecked(true);
        return;
      }
      
      try {
        const isConnected = await checkApiConnection();
        console.log('API bağlantı durumu:', isConnected);
        
        if (!isConnected) {
          // Bağlantı yoksa demo moda geç
          setDemoMode(true);
          setDemoModeState(true);
          setNotification({
            show: true,
            message: 'Sunucu bağlantısı kurulamadı. Demo modunda devam ediliyor.',
            severity: 'warning'
          });
        } else {
          setDemoMode(false);
          setDemoModeState(false);
        }
      } catch (err) {
        console.error('API bağlantı kontrolü sırasında hata:', err);
        setDemoMode(true);
        setDemoModeState(true);
      } finally {
        setApiChecked(true);
      }
    };
    
    checkConnection();
  }, [forceDemoMode]);
  
  // Demo mod değiştiğinde log
  useEffect(() => {
    console.log("Demo mod durumu:", demoMode);
  }, [demoMode]);
  
  console.log("GamePage: Kullanılan Lobi ID:", lobbyIdToUse, "Demo mod:", demoMode);

  // Kullanıcı kimliğini başlangıçta ayarla
  useEffect(() => {
    // Mevcut kullanıcı kimliğini kontrol et
    let currentUserId = localStorage.getItem('mines_playerId');
    let currentUsername = localStorage.getItem('mines_playerName');
    
    // Kullanıcı kimliği yoksa oluştur
    if (!currentUserId) {
      currentUserId = generateUniqueId('player-');
      localStorage.setItem('mines_playerId', currentUserId);
    }
    
    // Kullanıcı adı yoksa form göster
    if (!currentUsername) {
      setShowLoginForm(true);
    } else {
      setUsername(currentUsername);
    }
    
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
        
        // Demo moduna geçiş kontrolü
        setDemoModeState(isDemoMode());
        
        // Lobi ayarlarını kullan
        if (data && data.settings && data.settings.minesweeper) {
          setSettings(data.settings.minesweeper);
        }
        
        if (demoMode) {
          setNotification({
            show: true,
            message: 'Demo modunda oyun başlatıldı. Çoklu oyuncu özellikleri devre dışı.',
            severity: 'info'
          });
        } else {
          setNotification({
            show: true,
            message: 'Oyun lobisine bağlanıldı!',
            severity: 'success'
          });
        }
      } catch (err) {
        console.error('Lobi verisi yüklenirken hata:', err);
        setError('Lobi verisi yüklenemedi. Yeni bir oyun başlatılıyor.');
        
        // Hata durumunda varsayılan ayarları kullan
        setSettings({
          width: 9,
          height: 9,
          mines: 10
        });
        
        // Demo moda geç
        setDemoMode(true);
        setDemoModeState(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLobbyData();
  }, [lobbyIdToUse, navigate, userId, apiChecked, demoMode]);

  // Kullanıcı adı formu işleme
  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setFormError('Lütfen bir kullanıcı adı girin');
      return;
    }
    
    // Kullanıcı adını kaydet
    localStorage.setItem('mines_playerName', username);
    setShowLoginForm(false);
    setFormError('');
    
    // Sayfayı yeniden yükle
    window.location.reload();
  };

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
  } = useGameSocket(lobbyIdToUse, userId, demoMode);

  // Bağlantı hatası durumunda bildirim göster
  useEffect(() => {
    if (socketError && !demoMode) {
      setNotification({
        show: true,
        message: `Bağlantı hatası: ${socketError}. Demo moda geçiliyor.`,
        severity: 'error'
      });
      
      // Socket hatası varsa demo moda geç
      setDemoMode(true);
      setDemoModeState(true);
    }
  }, [socketError, demoMode]);

  // Oyun bittiğinde çağrılacak fonksiyon
  function handleGameEnd(result) {
    console.log('Oyun sonucu:', result);
    
    // Eğer socket bağlantısı varsa, sonucu sunucuya gönder
    if (isConnected && !demoMode) {
      sendGameResult(result);
    }
    
    setNotification({
      show: true,
      message: result.status === 'won' ? 'Tebrikler, kazandınız!' : 'Oyunu kaybettiniz!',
      severity: result.status === 'won' ? 'success' : 'error'
    });
  }

  // Hücre tıklama
  const handleCellClick = (row, col) => {
    // Socket bağlantısı varsa, aksiyonu sunucuya gönder
    if (isConnected && !demoMode) {
      sendOpenCell(row, col);
    }
    
    // Yerel oyun state'ini güncelle
    openCell(row, col);
  };

  // Sağ tıklama (bayrak)
  const handleCellRightClick = (row, col) => {
    // Socket bağlantısı varsa, aksiyonu sunucuya gönder
    if (isConnected && !demoMode) {
      const isFlagged = !board[row][col].isFlagged;
      sendToggleFlag(row, col, isFlagged);
    }
    
    // Yerel oyun state'ini güncelle
    toggleFlag(row, col);
  };

  // Oyun ayarlarını değiştir
  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    resetGame();
  };

  // Ana sayfaya dön
  const handleGoToHome = () => {
    // Ana uygulamaya yönlendirme mesajı gönder
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'NAVIGATE_HOME',
          source: 'mines-game'
        }, '*');
      } else {
        window.location.href = '/home';
      }
    } catch (e) {
      console.error('Ana uygulamaya yönlendirme yapılamadı:', e);
      window.location.href = '/home';
    }
  };
  
  // Yeniden bağlan
  const handleReconnect = async () => {
    // API bağlantısını kontrol et
    const isConnected = await checkApiConnection();
    
    if (isConnected) {
      setDemoMode(false);
      setDemoModeState(false);
      reconnect();
      
      setNotification({
        show: true,
        message: 'Sunucuya yeniden bağlanılıyor...',
        severity: 'info'
      });
    } else {
      setNotification({
        show: true,
        message: 'Sunucu bağlantısı kurulamadı. Demo modunda devam ediliyor.',
        severity: 'warning'
      });
    }
  };
  
  // Demo modu değiştir
  const handleToggleDemoMode = () => {
    const newDemoMode = !demoMode;
    setDemoMode(newDemoMode);
    setDemoModeState(newDemoMode);
    
    setNotification({
      show: true,
      message: newDemoMode 
        ? 'Demo modu etkinleştirildi. Çoklu oyuncu özellikleri devre dışı.' 
        : 'Demo modu devre dışı bırakıldı. Sunucuya bağlanılıyor...',
      severity: 'info'
    });
    
    // Sayfayı yenile
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };
  
  // Bildirimi kapat
  const handleCloseNotification = () => {
    setNotification({ ...notification, show: false });
  };

  // Kullanıcı adı formunu göster
  if (showLoginForm) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Mayın Tarlası Oyuncusu
          </Typography>
          
          <form onSubmit={handleUsernameSubmit}>
            <TextField
              fullWidth
              label="Kullanıcı Adınız"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!formError}
              helperText={formError}
              sx={{ mb: 3 }}
              autoFocus
            />
            
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth
              size="large"
            >
              Oyuna Başla
            </Button>
          </form>
        </Paper>
      </Container>
    );
  }

  // Yüklenme durumu
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h5" component="h1">
            Oyun Yükleniyor...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {demoMode ? 'Demo mod hazırlanıyor...' : 'Sunucuya bağlanılıyor, lütfen bekleyin...'}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh' }}>
      {/* Hata mesajı */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Demo mod bildirimi */}
      {demoMode && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleToggleDemoMode}>
              Gerçek Moda Geç
            </Button>
          }
        >
          Demo modunda oynuyorsunuz. Çoklu oyuncu özellikleri devre dışı.
        </Alert>
      )}
      
      {/* Bağlantı durumu */}
      {!isConnected && !demoMode && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button color="inherit" size="small" onClick={handleReconnect}>
                Yeniden Bağlan
              </Button>
              <Button color="inherit" size="small" onClick={handleToggleDemoMode}>
                Demo Moda Geç
              </Button>
            </Stack>
          }
        >
          Sunucuya bağlantı kurulamadı. Yerel modda oynuyorsunuz.
        </Alert>
      )}
      
      {/* Lobi bilgileri */}
      {lobbyData && (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Lobi: {lobbyData.name || lobbyIdToUse}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Oyuncu: {username} {isConnected && !demoMode ? '(Çevrimiçi)' : '(Çevrimdışı)'}
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
        isMultiplayer={isConnected && players.length > 1 && !demoMode}
      />
      
      {/* Socket bağlantı hatası */}
      {socketError && !demoMode && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {socketError}
        </Alert>
      )}
      
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
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GamePage; 