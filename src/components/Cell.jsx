import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import FlagIcon from '@mui/icons-material/Flag';
import BugReportIcon from '@mui/icons-material/BugReport';

// Hücre için özel stil bileşeni
const CellContainer = styled(Box, {
  // Props'ları filtreleme - DOM'a aktarılmasını önler
  shouldForwardProp: (prop) => 
    !['isOpen', 'isFlagged', 'isMine', 'gameOver'].includes(prop)
})(({ theme, isOpen, isFlagged, isMine, gameOver }) => ({
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid',
  borderColor: theme.palette.divider,
  cursor: gameOver ? 'default' : 'pointer',
  userSelect: 'none',
  position: 'relative',
  transition: 'all 0.2s ease',
  backgroundColor: isOpen 
    ? (isMine ? theme.palette.error.dark : theme.palette.background.default)
    : theme.palette.background.paper,
  '&:hover': {
    backgroundColor: !isOpen && !gameOver 
      ? theme.palette.action.hover
      : isOpen 
        ? (isMine ? theme.palette.error.dark : theme.palette.background.default)
        : theme.palette.background.paper,
  },
  boxShadow: isOpen ? 'none' : 'inset 1px 1px 2px rgba(0,0,0,0.2)',
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

  // Hücre içeriğini belirle
  const renderContent = () => {
    if (isFlagged && !isOpen) {
      return <FlagIcon color="secondary" fontSize="small" />;
    }

    if (!isOpen) {
      return null;
    }

    if (isMine) {
      return <BugReportIcon color="error" fontSize="small" />;
    }

    if (adjacentMines > 0) {
      return (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 'bold',
            fontSize: '0.9rem',
            color: colorMap[adjacentMines] || 'text.primary'
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
      onClick={handleClick}
      onContextMenu={handleRightClick}
    >
      {renderContent()}
    </CellContainer>
  );
};

export default Cell; 