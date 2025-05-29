import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  FormControl, 
  Select, 
  MenuItem, 
  Typography,
  Box,
  Slider,
  Stack,
  Paper,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import GridOnIcon from '@mui/icons-material/GridOn';
import SpeedIcon from '@mui/icons-material/Speed';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

// Önceden tanımlanmış zorluk seviyeleri
const DIFFICULTY_PRESETS = {
  easy: { width: 9, height: 9, mines: 10 },
  medium: { width: 16, height: 16, mines: 40 },
  hard: { width: 30, height: 16, mines: 99 },
  custom: { width: 9, height: 9, mines: 10 },
};

// Zorluk kartı bileşeni
const DifficultyCard = ({ 
  title, 
  width, 
  height, 
  mines, 
  selected, 
  onClick, 
  difficulty
}) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={selected ? 4 : 1}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: selected ? alpha(theme.palette.primary.main, 0.1) : theme.palette.background.paper,
        border: selected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
        '&:hover': {
          backgroundColor: selected ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.action.hover, 0.7),
          transform: 'translateY(-2px)',
          boxShadow: selected ? 6 : 2
        }
      }}
      onClick={() => onClick(difficulty)}
    >
      <Typography variant="h6" color={selected ? 'primary' : 'textPrimary'} sx={{ mb: 1, fontWeight: 'bold' }}>
        {title}
      </Typography>
      
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Chip 
          icon={<GridOnIcon />} 
          label={`${width}x${height}`} 
          variant={selected ? "filled" : "outlined"} 
          color={selected ? "primary" : "default"} 
          size="small"
        />
        <Chip 
          icon={<FlagIcon />} 
          label={`${mines} mayın`} 
          variant={selected ? "filled" : "outlined"} 
          color={selected ? "primary" : "default"} 
          size="small" 
        />
      </Stack>
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <SpeedIcon color={selected ? "primary" : "action"} fontSize="small" sx={{ mr: 0.5 }} />
        <Typography variant="body2" color="text.secondary">
          Zorluk: {difficulty === 'easy' ? 'Düşük' : difficulty === 'medium' ? 'Orta' : 'Yüksek'}
        </Typography>
      </Box>
    </Paper>
  );
};

const GameSettings = ({ 
  open, 
  onClose, 
  onSave, 
  initialSettings = { width: 9, height: 9, mines: 10 } 
}) => {
  // State
  const [settings, setSettings] = useState(initialSettings);
  const [difficulty, setDifficulty] = useState(() => {
    // Başlangıç zorluğunu belirle
    const { width, height, mines } = initialSettings;
    
    if (width === 9 && height === 9 && mines === 10) return 'easy';
    if (width === 16 && height === 16 && mines === 40) return 'medium';
    if (width === 30 && height === 16 && mines === 99) return 'hard';
    
    return 'custom';
  });
  
  const theme = useTheme();

  // Maksimum mayın sayısı
  const maxMines = Math.floor((settings.width * settings.height) * 0.35); // Tahta boyutunun %35'i kadar

  // Zorluk seviyesi değiştiğinde
  const handleDifficultyChange = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    
    if (selectedDifficulty !== 'custom') {
      setSettings(DIFFICULTY_PRESETS[selectedDifficulty]);
    }
  };

  // Tahta genişliği değiştiğinde
  const handleWidthChange = (event, newValue) => {
    const newSettings = { ...settings, width: newValue };
    setSettings(newSettings);
    setDifficulty('custom');

    // Mayın sayısını güncelle
    if (newSettings.mines > Math.floor((newValue * newSettings.height) * 0.35)) {
      setSettings({
        ...newSettings,
        mines: Math.floor((newValue * newSettings.height) * 0.35)
      });
    }
  };

  // Tahta yüksekliği değiştiğinde
  const handleHeightChange = (event, newValue) => {
    const newSettings = { ...settings, height: newValue };
    setSettings(newSettings);
    setDifficulty('custom');

    // Mayın sayısını güncelle
    if (newSettings.mines > Math.floor((newSettings.width * newValue) * 0.35)) {
      setSettings({
        ...newSettings,
        mines: Math.floor((newSettings.width * newValue) * 0.35)
      });
    }
  };

  // Mayın sayısı değiştiğinde
  const handleMinesChange = (event, newValue) => {
    setSettings({ ...settings, mines: newValue });
    setDifficulty('custom');
  };

  // Ayarları kaydet
  const handleSave = () => {
    onSave(settings);
  };

  // Mayın yoğunluğu
  const mineDensity = ((settings.mines / (settings.width * settings.height)) * 100).toFixed(1);
  
  // Zorluk rengi
  const getDifficultyColor = () => {
    if (mineDensity < 12) return theme.palette.success.main;
    if (mineDensity < 20) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'primary.contrastText',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <SportsEsportsIcon />
        Oyun Ayarları
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        {/* Zorluk Seviyeleri Kartları */}
        <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'medium' }}>
          Zorluk Seviyesi Seçin
        </Typography>
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ mb: 4 }}
        >
          <DifficultyCard
            title="Kolay"
            width={9}
            height={9}
            mines={10}
            difficulty="easy"
            selected={difficulty === 'easy'}
            onClick={handleDifficultyChange}
          />
          
          <DifficultyCard
            title="Orta"
            width={16}
            height={16}
            mines={40}
            difficulty="medium"
            selected={difficulty === 'medium'}
            onClick={handleDifficultyChange}
          />
          
          <DifficultyCard
            title="Zor"
            width={30}
            height={16}
            mines={99}
            difficulty="hard"
            selected={difficulty === 'hard'}
            onClick={handleDifficultyChange}
          />
        </Stack>
        
        {/* Özel Ayarlar */}
        <Paper
          elevation={difficulty === 'custom' ? 3 : 1}
          sx={{
            p: 3,
            borderRadius: 2,
            mb: 3,
            border: difficulty === 'custom' ? `2px solid ${theme.palette.primary.main}` : 'none',
            bgcolor: difficulty === 'custom' ? alpha(theme.palette.primary.main, 0.05) : theme.palette.background.paper
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ 
            color: difficulty === 'custom' ? 'primary.main' : 'text.primary',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <GridOnIcon /> Özel Oyun Alanı Boyutları
          </Typography>
          
          <Box sx={{ px: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1" fontWeight="medium">
                Tahta Genişliği
              </Typography>
              <Chip label={settings.width} color="primary" variant="outlined" />
            </Box>
            
            <Slider
              value={settings.width}
              min={5}
              max={30}
              step={1}
              marks={[
                { value: 5, label: '5' },
                { value: 15, label: '15' },
                { value: 30, label: '30' },
              ]}
              onChange={handleWidthChange}
              aria-labelledby="width-slider"
              disabled={difficulty !== 'custom'}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1" fontWeight="medium">
                Tahta Yüksekliği
              </Typography>
              <Chip label={settings.height} color="primary" variant="outlined" />
            </Box>
            
            <Slider
              value={settings.height}
              min={5}
              max={20}
              step={1}
              marks={[
                { value: 5, label: '5' },
                { value: 10, label: '10' },
                { value: 20, label: '20' },
              ]}
              onChange={handleHeightChange}
              aria-labelledby="height-slider"
              disabled={difficulty !== 'custom'}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1" fontWeight="medium">
                Mayın Sayısı
              </Typography>
              <Chip label={settings.mines} color="primary" variant="outlined" />
            </Box>
            
            <Slider
              value={settings.mines}
              min={1}
              max={maxMines}
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: maxMines, label: maxMines.toString() },
              ]}
              onChange={handleMinesChange}
              aria-labelledby="mines-slider"
              disabled={difficulty !== 'custom'}
            />
          </Box>
        </Paper>

        {/* Özet Bilgiler */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            bgcolor: alpha(theme.palette.info.main, 0.05),
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-around">
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Oyun Alanı
              </Typography>
              <Typography variant="h6" color="text.primary">
                {settings.width} x {settings.height}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam {settings.width * settings.height} hücre
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Mayın Sayısı
              </Typography>
              <Typography variant="h6" color="text.primary">
                {settings.mines}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam hücrelerin {((settings.mines / (settings.width * settings.height)) * 100).toFixed(0)}%'i
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Zorluk Seviyesi
              </Typography>
              <Typography variant="h6" sx={{ color: getDifficultyColor() }}>
                {mineDensity < 12 ? 'Kolay' : mineDensity < 20 ? 'Orta' : 'Zor'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mayın yoğunluğu: {mineDensity}%
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          İptal
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          sx={{ borderRadius: 2 }}
        >
          Kaydet ve Oyna
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GameSettings; 