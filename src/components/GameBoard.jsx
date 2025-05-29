import React, { useState } from 'react';
import { Box, Grid, Typography, Button, IconButton, Paper, Badge } from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import TimerIcon from '@mui/icons-material/Timer';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import BugReportIcon from '@mui/icons-material/BugReport';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CancelIcon from '@mui/icons-material/Cancel';
import Cell from './Cell';
import GameSettings from './GameSettings';

const colorMap = {
  1: '#2196f3', // mavi
  2: '#4caf50', // yeşil
  3: '#f44336', // kırmızı
  4: '#9c27b0', // mor
  5: '#ff9800', // turuncu
  6: '#00bcd4', // açık mavi
  7: '#795548', // kahverengi
  8: '#607d8b', // gri
};

const GameBoard = ({
  board = [],
  gameStatus = 0,
  flagCount = 0,
  mines = 10,
  time = 0,
  onCellClick,
  onCellRightClick,
  onReset,
  onSettingsChange,
  players = [],
  currentPlayerId = '',
  isMultiplayer = false,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  // Zaman formatını düzenle (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Oyun durumunu belirle
  const getGameStatusText = () => {
    if (gameStatus === 1) return 'Kazandınız!';
    if (gameStatus === -1) return 'Kaybettiniz!';
    return 'Oyun Devam Ediyor';
  };

  // Ayarlar modalını aç/kapat
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* Üst bilgi paneli */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Badge 
            badgeContent={mines - flagCount} 
            color={flagCount > mines ? 'error' : 'primary'}
            max={99}
            sx={{ mr: 2 }}
          >
            <FlagIcon color="action" />
          </Badge>
        </Box>

        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold',
            color: gameStatus === 1 ? 'success.main' : gameStatus === -1 ? 'error.main' : 'text.primary'
          }}
        >
          {getGameStatusText()}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TimerIcon sx={{ mr: 1 }} color="action" />
          <Typography variant="body1">{formatTime(time)}</Typography>
        </Box>
      </Paper>

      {/* Oyun tahtası */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2,
          mb: 2,
          bgcolor: 'background.paper',
          borderRadius: 2
        }}
      >
        <Grid container spacing={0} sx={{ maxWidth: 'fit-content', mx: 'auto' }}>
          {board.map((row, rowIndex) => (
            <Grid container item key={`row-${rowIndex}`} spacing={0}>
              {row.map((cell, colIndex) => (
                <Grid item key={`cell-${rowIndex}-${colIndex}`}>
                  <Cell
                    isOpen={cell.isOpen}
                    isMine={cell.isMine}
                    isFlagged={cell.isFlagged}
                    adjacentMines={cell.adjacentMines}
                    colorMap={colorMap}
                    onClick={() => onCellClick(rowIndex, colIndex)}
                    onRightClick={(e) => {
                      e.preventDefault();
                      onCellRightClick(rowIndex, colIndex);
                      return false;
                    }}
                    gameStatus={gameStatus}
                  />
                </Grid>
              ))}
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Kontrol paneli */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={onReset}
        >
          Yeni Oyun
        </Button>

        <Box>
          <IconButton 
            color="primary" 
            onClick={toggleSettings}
            sx={{ mr: 1 }}
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Çok oyunculu mod için oyuncu listesi */}
      {isMultiplayer && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2,
            mb: 2,
            bgcolor: 'background.paper',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" gutterBottom>
            Oyuncular
          </Typography>
          <Grid container spacing={1}>
            {players.map(player => (
              <Grid item xs={12} sm={6} md={4} key={player.id}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 1, 
                    display: 'flex', 
                    alignItems: 'center',
                    bgcolor: player.id === currentPlayerId ? 'action.selected' : 'background.default',
                    border: player.id === currentPlayerId ? '1px solid' : 'none',
                    borderColor: 'primary.main'
                  }}
                >
                  <Box sx={{ mr: 1 }}>
                    {player.status === 'won' ? (
                      <EmojiEventsIcon color="success" />
                    ) : player.status === 'lost' ? (
                      <CancelIcon color="error" />
                    ) : (
                      <BugReportIcon color="action" />
                    )}
                  </Box>
                  <Typography variant="body1" sx={{ flexGrow: 1 }}>
                    {player.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {player.score || 0} puan
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Ayarlar modal */}
      {showSettings && (
        <GameSettings
          open={showSettings}
          onClose={toggleSettings}
          onSave={(settings) => {
            onSettingsChange(settings);
            toggleSettings();
          }}
          initialSettings={{
            width: board[0]?.length || 9,
            height: board.length || 9,
            mines,
          }}
        />
      )}
    </Box>
  );
};

export default GameBoard; 