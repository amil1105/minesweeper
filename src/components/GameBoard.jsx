import React, { useState } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Button, 
  IconButton, 
  Paper, 
  Badge,
  Container,
  Divider,
  Stack,
  Tooltip,
  LinearProgress,
  useTheme,
  alpha,
  Switch,
  FormControlLabel
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import TimerIcon from '@mui/icons-material/Timer';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import BugReportIcon from '@mui/icons-material/BugReport';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CancelIcon from '@mui/icons-material/Cancel';
import GradeIcon from '@mui/icons-material/Grade';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import Cell from './Cell';
import GameSettings from './GameSettings';
import soundManager from '../utils/SoundManager';

// Renk haritası - farklı sayılar için renkler
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
  const [muted, setMuted] = useState(() => localStorage.getItem('minesweeper_muted') === 'true');
  const theme = useTheme();

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

  // Durum rengi
  const getStatusColor = () => {
    if (gameStatus === 1) return theme.palette.success.main;
    if (gameStatus === -1) return theme.palette.error.main;
    return theme.palette.info.main;
  };

  // İlerleme yüzdesi
  const getProgressPercentage = () => {
    if (!board.length) return 0;
    
    // Toplam kare sayısı
    const totalCells = board.length * board[0].length;
    
    // Açılmış kare sayısı
    let openCells = 0;
    board.forEach(row => {
      row.forEach(cell => {
        if (cell.isOpen) openCells++;
      });
    });
    
    // Oyun alanında mayınsız kare sayısı
    const nonMineCells = totalCells - mines;
    
    // İlerleme yüzdesi
    return Math.floor((openCells / nonMineCells) * 100);
  };

  // Ayarlar modalını aç/kapat
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Ses ayarını değiştir
  const handleToggleSound = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    soundManager.setMuted(newMuted);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Oyun Başlığı */}
        <Box sx={{ 
          textAlign: 'center', 
          mb: 3, 
          pb: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
        }}>
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: theme.palette.primary.main
          }}>
            <BugReportIcon fontSize="large" />
            Mayın Tarlası
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Becerinizi ve stratejinizi test edin!
          </Typography>
        </Box>
        
        {/* Üst bilgi paneli */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 0, 
            mb: 3, 
            bgcolor: 'background.paper',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          {/* Durum göstergesi */}
          <Box sx={{ 
            bgcolor: alpha(getStatusColor(), 0.1), 
            p: 1.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Typography 
              variant="h6" 
              align="center"
              sx={{ 
                fontWeight: 'bold',
                color: getStatusColor(),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              {gameStatus === 1 ? <EmojiEventsIcon /> : gameStatus === -1 ? <CancelIcon /> : <SportsScoreIcon />}
              {getGameStatusText()}
            </Typography>
            
            {/* İlerleme çubuğu */}
            {gameStatus === 0 && (
              <LinearProgress 
                variant="determinate" 
                value={getProgressPercentage()} 
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            )}
          </Box>
          
          {/* Oyun bilgileri */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            justifyContent="space-around" 
            alignItems="center"
            divider={<Divider orientation="vertical" flexItem />}
            sx={{ p: 2 }}
          >
            {/* Bayrak sayacı */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 1
            }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Kalan Bayrak
              </Typography>
              <Badge 
                badgeContent={mines - flagCount} 
                color={flagCount > mines ? 'error' : 'primary'}
                max={99}
                sx={{ '& .MuiBadge-badge': { fontSize: '1rem', height: '1.5rem', minWidth: '1.5rem' } }}
              >
                <FlagIcon color="action" fontSize="large" />
              </Badge>
            </Box>

            {/* Boyut bilgisi */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 1
            }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Oyun Alanı
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'medium',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <GradeIcon fontSize="small" color="action" />
                {board.length ? `${board[0].length}x${board.length}` : '-'}
              </Typography>
            </Box>

            {/* Zaman sayacı */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 1
            }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Geçen Süre
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'medium',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <TimerIcon fontSize="small" color="action" />
                {formatTime(time)}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Oyun tahtası */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2,
            mb: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.7),
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            width: 'auto',
            mx: 'auto',
            p: 2,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 5px 15px ${alpha(theme.palette.common.black, 0.05)}`,
            boxSizing: 'content-box',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Grid 
              container 
              spacing={0} 
              sx={{ 
                width: 'auto',
                mx: 'auto',
                boxSizing: 'border-box',
                display: 'grid',
                gridTemplateColumns: `repeat(${board[0]?.length || 9}, 40px)`,
                gridTemplateRows: `repeat(${board.length || 9}, 40px)`,
                justifyContent: 'center'
              }}
            >
              {board.map((row, rowIndex) => (
                row.map((cell, colIndex) => (
                  <Box 
                    key={`cell-${rowIndex}-${colIndex}`}
                    sx={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxSizing: 'border-box'
                    }}
                  >
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
                  </Box>
                ))
              ))}
            </Grid>
          </Box>
        </Paper>

        {/* Kontrol paneli */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.5)
        }}>
          <Tooltip title="Yeni bir oyun başlat">
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<RefreshIcon />}
              onClick={onReset}
              sx={{ 
                borderRadius: 2,
                px: 3,
                boxShadow: theme.shadows[3]
              }}
            >
              Yeni Oyun
            </Button>
          </Tooltip>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title={muted ? "Sesi aç" : "Sesi kapat"}>
              <IconButton
                color={muted ? "default" : "primary"}
                onClick={handleToggleSound}
                size="medium"
                sx={{
                  boxShadow: theme.shadows[1],
                  bgcolor: alpha(theme.palette.background.paper, 0.7),
                }}
              >
                {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Oyun ayarlarını değiştir">
              <IconButton 
                color="primary" 
                onClick={toggleSettings}
                size="large"
                sx={{ 
                  boxShadow: theme.shadows[2],
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                <SettingsIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Çok oyunculu mod için oyuncu listesi */}
        {isMultiplayer && (
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              mb: 3,
              bgcolor: 'background.paper',
              borderRadius: 2
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                pb: 1,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <AccountCircleIcon />
              Oyuncular
            </Typography>
            
            <Grid container spacing={2}>
              {players.map(player => (
                <Grid item xs={12} sm={6} md={4} key={player.id}>
                  <Paper 
                    elevation={player.id === currentPlayerId ? 2 : 1} 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      alignItems: 'center',
                      bgcolor: player.id === currentPlayerId 
                        ? alpha(theme.palette.primary.main, 0.05) 
                        : theme.palette.background.default,
                      border: player.id === currentPlayerId ? '1px solid' : 'none',
                      borderColor: 'primary.main',
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: theme.shadows[2]
                      }
                    }}
                  >
                    <Box sx={{ mr: 1.5 }}>
                      {player.status === 'won' ? (
                        <EmojiEventsIcon color="success" />
                      ) : player.status === 'lost' ? (
                        <CancelIcon color="error" />
                      ) : (
                        <AccountCircleIcon color={player.id === currentPlayerId ? 'primary' : 'action'} />
                      )}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {player.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {player.status || 'Oynuyor'}
                      </Typography>
                    </Box>
                    <Badge 
                      badgeContent={player.score || 0} 
                      color="primary"
                      sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem' } }}
                    >
                      <EmojiEventsIcon color="action" />
                    </Badge>
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
    </Container>
  );
};

export default GameBoard; 