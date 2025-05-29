import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Container } from '@mui/material';

// Sayfalar
import GamePage from './pages/GamePage';
import NotFoundPage from './pages/NotFoundPage';

// API ve yardımcı fonksiyonlar
import { checkApiConnection, isDemoMode } from './utils/api';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // API bağlantısını kontrol et
    const checkConnection = async () => {
      try {
        console.log("API bağlantısı kontrol ediliyor...");
        const connected = await checkApiConnection();
        setIsConnected(connected);
        
        // Demo modu kontrolü
        const isDemoEnabled = isDemoMode();
        setDemoMode(isDemoEnabled);
        
        console.log("API Bağlantı durumu:", connected, "Demo mod:", isDemoEnabled);
      } catch (error) {
        console.error('API bağlantı hatası:', error);
        setIsConnected(false);
        setDemoMode(true); // Hata durumunda demo modu etkinleştir
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
    
    // URL'den lobbyId parametresini al
    const queryParams = new URLSearchParams(location.search);
    const lobbyId = queryParams.get('lobbyId');
    console.log("Minesweeper uygulaması başlatıldı. LobbyId:", lobbyId);
    
    // LocalStorage'a lobi bilgisini kaydet
    if (lobbyId) {
      localStorage.setItem('mines_lobbyId', lobbyId);
      localStorage.setItem('game-center-demo-mode', 'true'); // Demo modu varsayılan olarak etkinleştir
    }
  }, [location.search]);

  // URL'den lobi ID'sini al
  const queryParams = new URLSearchParams(location.search);
  const lobbyId = queryParams.get('lobbyId');

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          backgroundColor: '#0B0E17',
          color: 'white'
        }}
      >
        <CircularProgress sx={{ mb: 3 }} />
        <Typography variant="h6">Mayın Tarlası yükleniyor...</Typography>
      </Box>
    );
  }

  // API bağlantı hatasında demo modda devam et
  if (!isConnected && !demoMode) {
    return (
      <Container maxWidth="md" sx={{ 
        py: 4, 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0B0E17',
        color: 'white' 
      }}>
        <Typography variant="h4" gutterBottom color="error">
          API Bağlantı Hatası
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, textAlign: 'center' }}>
          Sunucuya bağlanılamadı. Demo modunda devam edilecek.
        </Typography>
        {lobbyId ? (
          <GamePage lobbyId={lobbyId} forceDemoMode={true} />
        ) : (
          <NotFoundPage />
        )}
      </Container>
    );
  }

  return (
    <Routes>
      <Route path="*" element={lobbyId ? <GamePage lobbyId={lobbyId} forceDemoMode={demoMode} /> : <NotFoundPage />} />
    </Routes>
  );
}

export default App; 