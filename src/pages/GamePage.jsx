import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Container, Paper, Alert, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import GameBoard from '../components/GameBoard';
import useMinesweeper from '../hooks/useMinesweeper';
import useGameSocket from '../hooks/useGameSocket';
import { getLobbyData, isDemoMode } from '../utils/api';

const GamePage = ({ lobbyId: propLobbyId, forceDemoMode = false }) => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lobbyData, setLobbyData] = useState(null);
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [demoMode, setDemoMode] = useState(forceDemoMode || isDemoMode());
  const [settings, setSettings] = useState({
    width: 9,
    height: 9,
    mines: 10
  });

  // Router hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL'den ve props'tan lobi ID'sini al
  const queryParams = new URLSearchParams(location.search);
  const urlLobbyId = queryParams.get('lobbyId');
  
  // Lobi ID'sini birkaç kaynaktan kontrol ederek belirle
  const lobbyIdToUse = propLobbyId || urlLobbyId || localStorage.getItem('mines_lobbyId');
  
  console.log("GamePage: Kullanılan Lobi ID:", lobbyIdToUse, "Demo mod:", demoMode);

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
    sendMessage
  } = useGameSocket(lobbyIdToUse, userId, demoMode);

  // Sayfa yüklendiğinde lobi verilerini al
  useEffect(() => {
    const fetchLobbyData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Lobi verileri yükleniyor, lobbyId:", lobbyIdToUse, "Demo mod:", demoMode);
        
        // Demo modu kontrolü
        setDemoMode(forceDemoMode || isDemoMode());
        
        // Lobi verilerini al
        if (lobbyIdToUse) {
          // Önce localStorage'dan kullanıcı bilgilerini al (Ana uygulamadan gelen)
          const storedPlayerId = localStorage.getItem('mines_playerId');
          const storedPlayerName = localStorage.getItem('mines_playerName') || localStorage.getItem('game-center-username');
          
          if (storedPlayerId) {
            setUserId(storedPlayerId);
            setUsername(storedPlayerName || 'Oyuncu');
            console.log("LocalStorage'dan kullanıcı bilgileri alındı:", storedPlayerId, storedPlayerName);
          }
          
          try {
            const data = await getLobbyData(lobbyIdToUse);
            console.log("Lobiden gelen veriler:", data);
            setLobbyData(data);
            
            // Lobi ayarlarını güncelle
            if (data?.settings?.minesweeper) {
              setSettings(data.settings.minesweeper);
              console.log("Lobi ayarları güncellendi:", data.settings.minesweeper);
            }
          } catch (apiError) {
            console.warn("API'den lobi verileri alınamadı, yerel verilerle devam ediliyor:", apiError);
            // API'den veri alınamazsa demo modda devam et
            setDemoMode(true);
            
            // Demo lobi verisi
            setLobbyData({
              _id: lobbyIdToUse,
              name: 'Demo Mayın Tarlası Lobisi',
              game: 'mines',
              maxPlayers: 4,
              players: [
                { id: storedPlayerId || 'demo-player', name: storedPlayerName || 'Demo Oyuncu', isReady: true }
              ],
              settings: {
                minesweeper: settings
              },
              status: 'playing'
            });
          }
        } else {
          // Lobi ID yoksa hata göster
          setError('Lobi kodu bulunamadı. Lütfen geçerli bir lobi koduna sahip olduğunuzdan emin olun.');
        }

        // Kullanıcı ID'si yoksa demo kullanıcı oluştur
        if (!userId) {
          // Demo kullanıcı oluştur
          const demoUserId = `demo-${Date.now()}`;
          const demoUsername = `Oyuncu-${Math.floor(Math.random() * 1000)}`;
          
          setUserId(demoUserId);
          setUsername(demoUsername);
          console.log("Demo kullanıcı oluşturuldu:", demoUserId, demoUsername);
          
          localStorage.setItem('mines_playerId', demoUserId);
          localStorage.setItem('mines_playerName', demoUsername);
        }

      } catch (err) {
        console.error('Lobi verisi yüklenirken hata:', err);
        setError('Lobi verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        setDemoMode(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLobbyData();
  }, [lobbyIdToUse, userId, forceDemoMode]);

  // Oyun bittiğinde çağrılacak fonksiyon
  function handleGameEnd(result) {
    console.log('Oyun sonucu:', result);
    
    // Eğer socket bağlantısı varsa, sonucu sunucuya gönder
    if (isConnected) {
      sendGameResult(result);
    }
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

  // Yüklenme durumu
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, bgcolor: '#0B0E17', color: 'white', minHeight: '100vh' }}>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Oyun Yükleniyor...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4, bgcolor: '#0B0E17', color: 'white', minHeight: '100vh' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box sx={{ textAlign: 'center', p: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleGoToHome}
            sx={{ mt: 2 }}
          >
            Ana Sayfaya Dön
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, bgcolor: '#0B0E17', color: 'white', minHeight: '100vh' }}>
      {/* Demo mod uyarısı */}
      {demoMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Demo moddasınız. Çok oyunculu özellikler devre dışı.
        </Alert>
      )}
      
      {/* Lobi bilgisi */}
      {lobbyData && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom>
            {lobbyData.name || 'Mayın Tarlası Lobi'}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Oyun: Mayın Tarlası
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Oyuncu: {username}
            </Typography>
            {lobbyData.maxPlayers && (
              <Typography variant="body2" color="text.secondary">
                Oyuncu Limiti: {players.length} / {lobbyData.maxPlayers}
              </Typography>
            )}
          </Box>
        </Paper>
      )}
      
      {/* Oyun tahtası */}
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
    </Container>
  );
};

export default GamePage; 