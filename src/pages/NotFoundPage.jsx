import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';

const NotFoundPage = () => {
  // Ana sayfaya dön
  const handleGoToHome = () => {
    try {
      // Ana uygulamaya mesaj gönder
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'NAVIGATE_HOME',
          source: 'mines-game'
        }, '*');
      } else {
        // Direkt yönlendirme
        window.location.href = '/home';
      }
    } catch (error) {
      console.error('Ana sayfaya yönlendirme hatası:', error);
      window.location.href = '/home';
    }
  };

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
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '5rem', fontWeight: 'bold', mb: 2 }}>
          404
        </Typography>
        <Typography variant="h4" component="h1" gutterBottom>
          Sayfa Bulunamadı
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleGoToHome}
          size="large"
          sx={{ 
            mt: 2,
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem'
          }}
        >
          Ana Sayfaya Dön
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage; 