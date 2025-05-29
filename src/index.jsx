import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import theme from './theme';

// Ana uygulama ile iletişim kurulduğunu bildir
window.addEventListener('load', () => {
  try {
    // Eğer iframe içinde çalışıyorsa, ana uygulamaya yüklendiğini bildir
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'MINES_LOADED',
        source: 'mines-game'
      }, '*');
      
      console.log('Ana uygulamaya yüklenme mesajı gönderildi');
    }
  } catch (error) {
    console.error('Ana uygulama ile iletişim kurulamadı:', error);
  }
});

// Mesajları dinle
window.addEventListener('message', (event) => {
  try {
    const data = event.data;
    
    // Ana uygulamadan gelen lobi verileri
    if (data && data.type === 'LOBBY_DATA' && data.source === 'game-center') {
      console.log('Ana uygulamadan lobi verileri alındı:', data);
      
      // LocalStorage'a lobi verilerini kaydet
      localStorage.setItem('mines_lobbyId', data.lobbyId || '');
      localStorage.setItem('mines_playerId', data.playerId || '');
      localStorage.setItem('mines_playerName', data.playerName || 'Oyuncu');
      localStorage.setItem('mines_lobbyName', data.lobbyName || 'Mayın Tarlası Lobisi');
      
      // Uygulama yüklendiyse, sayfayı yenile
      if (document.readyState === 'complete') {
        if (!window.location.search.includes('lobbyId')) {
          window.location.search = `?lobbyId=${data.lobbyId}`;
        }
      }
    }
  } catch (error) {
    console.error('Mesaj işlenirken hata oluştu:', error);
  }
});

// Rendering işlemi
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <App />
      </Router>
    </ThemeProvider>
  </React.StrictMode>
); 