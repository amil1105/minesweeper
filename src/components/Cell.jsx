import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import FlagIcon from '@mui/icons-material/Flag';
import BugReportIcon from '@mui/icons-material/BugReport';
import { keyframes } from '@emotion/react';

// Animasyonlar
const openAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const flagAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
`;

const explodeAnimation = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Hücre için özel stil bileşeni
const CellContainer = styled(Box, {
  // Props'ları filtreleme - DOM'a aktarılmasını önler
  shouldForwardProp: (prop) => 
    !['isOpen', 'isFlagged', 'isMine', 'gameOver', 'isExploded', 'adjacentMines'].includes(prop)
})(({ theme, isOpen, isFlagged, isMine, gameOver, isExploded, adjacentMines }) => ({
  width: '36px',
  height: '36px',
  maxWidth: '36px',
  maxHeight: '36px',
  minWidth: '36px',
  minHeight: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  cursor: gameOver ? 'default' : 'pointer',
  userSelect: 'none',
  transition: 'all 0.15s ease-in-out',
  borderRadius: '4px',
  margin: '2px',
  boxSizing: 'border-box',
  
  // Kapalı hücre için 3D efekt
  border: isOpen ? 'none' : '1px solid',
  borderColor: isOpen 
    ? 'transparent' 
    : theme.palette.mode === 'dark' 
      ? theme.palette.grey[700] 
      : theme.palette.grey[300],
  
  // Açık/kapalı hücre görünümü
  backgroundColor: isOpen 
    ? (isMine 
        ? isExploded 
          ? theme.palette.error.main 
          : theme.palette.error.dark
        : theme.palette.background.default)
    : theme.palette.background.paper,
  
  // Gölgelendirme ve 3D efekt
  boxShadow: isOpen 
    ? 'none' 
    : `inset 1px 1px 3px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)'}, 
       inset -1px -1px 3px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'}`,
  
  // Kapalı hücre hover efekti
  '&:hover': {
    backgroundColor: !isOpen && !gameOver 
      ? theme.palette.action.hover
      : isOpen 
        ? (isMine ? theme.palette.error.dark : theme.palette.background.default)
        : theme.palette.background.paper,
    transform: !isOpen && !gameOver ? 'translateY(-1px)' : 'none',
    boxShadow: !isOpen && !gameOver 
      ? `inset 1px 1px 3px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)'}, 
         inset -1px -1px 3px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)'}, 
         0 2px 4px rgba(0,0,0,0.1)`
      : isOpen ? 'none' : `inset 1px 1px 3px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)'}, 
                            inset -1px -1px 3px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'}`,
  },
  
  // Aktif (basılı) efekti
  '&:active': {
    transform: !isOpen && !gameOver ? 'translateY(1px)' : 'none',
    boxShadow: !isOpen && !gameOver 
      ? `inset -1px -1px 3px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)'}, 
         inset 1px 1px 3px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)'}` 
      : isOpen ? 'none' : `inset 1px 1px 3px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)'}, 
                            inset -1px -1px 3px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'}`,
  },
  
  // Animasyonlar
  animation: isExploded
    ? `${explodeAnimation} 0.5s ease forwards`
    : isOpen && !isMine
      ? `${openAnimation} 0.3s ease forwards`
      : isFlagged && !isOpen
        ? `${flagAnimation} 0.3s ease`
        : 'none',
}));

// İçerik konteyner bileşeni
const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  position: 'relative',
  zIndex: 2,
}));

const Cell = ({ 
  isOpen = false,
  isMine = false,
  isFlagged = false,
  adjacentMines = 0,
  colorMap = {},
  onClick,
  onRightClick,
  gameStatus = 0
}) => {
  // Oyun bitti mi kontrolü
  const gameOver = gameStatus !== 0;
  
  // Mayın patladı mı kontrolü (oyun kaybedildiyse ve bu hücre mayınsa)
  const isExploded = gameStatus === -1 && isMine && isOpen;

  // Hücre içeriğini belirle
  const renderContent = () => {
    if (isFlagged && !isOpen) {
      return (
        <FlagIcon 
          color="secondary" 
          fontSize="small" 
          sx={{ 
            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))',
            animation: `${flagAnimation} 0.3s ease`
          }} 
        />
      );
    }

    if (!isOpen) {
      return null;
    }

    if (isMine) {
      return (
        <BugReportIcon 
          color="error" 
          fontSize="small" 
          sx={{ 
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
            animation: isExploded ? `${explodeAnimation} 0.5s ease` : 'none'
          }} 
        />
      );
    }

    if (adjacentMines > 0) {
      return (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 'bold',
            fontSize: '1rem',
            color: colorMap[adjacentMines] || 'text.primary',
            textShadow: '0 1px 1px rgba(0,0,0,0.1)'
          }}
        >
          {adjacentMines}
        </Typography>
      );
    }

    return null;
  };

  // Event handler'ları sadece oyun devam ediyorsa aktif et
  const handleClick = gameOver ? undefined : onClick;
  const handleRightClick = gameOver ? undefined : onRightClick;

  return (
    <CellContainer
      isOpen={isOpen}
      isMine={isMine}
      isFlagged={isFlagged}
      gameOver={gameOver}
      isExploded={isExploded}
      adjacentMines={adjacentMines}
      onClick={handleClick}
      onContextMenu={handleRightClick}
    >
      <ContentContainer>
        {renderContent()}
      </ContentContainer>
    </CellContainer>
  );
};

export default Cell; 