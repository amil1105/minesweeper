import { useState, useCallback, useEffect } from 'react';

/**
 * Mayın Tarlası oyun mantığı için custom hook
 * @param {number} width - Oyun tahtasının genişliği
 * @param {number} height - Oyun tahtasının yüksekliği
 * @param {number} mines - Mayın sayısı
 * @param {function} onGameEnd - Oyun bittiğinde çağrılacak fonksiyon
 */
const useMinesweeper = (width = 9, height = 9, mines = 10, onGameEnd = () => {}) => {
  // Oyun tahtası state'i
  const [board, setBoard] = useState([]);
  // Oyun durumu (0: devam ediyor, 1: kazandı, -1: kaybetti)
  const [gameStatus, setGameStatus] = useState(0);
  // Açılan hücre sayısı
  const [openCount, setOpenCount] = useState(0);
  // Bayrak sayısı
  const [flagCount, setFlagCount] = useState(0);
  // İlk tıklama mı kontrolü
  const [isFirstClick, setIsFirstClick] = useState(true);
  // Oyun süresi
  const [time, setTime] = useState(0);
  // Oyun başladı mı
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Oyun tahtasını oluştur
  const initializeBoard = useCallback(() => {
    // Boş tahtayı oluştur
    const newBoard = Array(height).fill().map(() => 
      Array(width).fill().map(() => ({
        isMine: false,
        isOpen: false,
        isFlagged: false,
        adjacentMines: 0
      }))
    );
    
    setBoard(newBoard);
    setGameStatus(0);
    setOpenCount(0);
    setFlagCount(0);
    setIsFirstClick(true);
    setTime(0);
    setIsGameStarted(false);
  }, [width, height]);

  // Mayınları yerleştir (ilk tıklanan hücreye mayın koymaz)
  const placeMines = useCallback((firstClickRow, firstClickCol) => {
    setBoard(prevBoard => {
      const newBoard = JSON.parse(JSON.stringify(prevBoard));
      let minesPlaced = 0;
      
      while (minesPlaced < mines) {
        const row = Math.floor(Math.random() * height);
        const col = Math.floor(Math.random() * width);
        
        // Eğer seçilen hücre ilk tıklanan hücre veya çevresindeyse ya da zaten mayın varsa, tekrar seç
        if ((Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1) || newBoard[row][col].isMine) {
          continue;
        }
        
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
      
      // Çevre mayın sayılarını hesapla
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          if (newBoard[row][col].isMine) continue;
          
          let count = 0;
          // 8 komşu hücreyi kontrol et
          for (let r = Math.max(0, row - 1); r <= Math.min(height - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(width - 1, col + 1); c++) {
              if (newBoard[r][c].isMine) count++;
            }
          }
          
          newBoard[row][col].adjacentMines = count;
        }
      }
      
      return newBoard;
    });
    
    setIsFirstClick(false);
    setIsGameStarted(true);
  }, [width, height, mines]);

  // Hücre açma işlemi
  const openCell = useCallback((row, col) => {
    if (gameStatus !== 0 || board[row][col].isOpen || board[row][col].isFlagged) {
      return;
    }
    
    // İlk tıklama ise mayınları yerleştir
    if (isFirstClick) {
      placeMines(row, col);
    }
    
    // Tahtayı güncelle
    setBoard(prevBoard => {
      const newBoard = JSON.parse(JSON.stringify(prevBoard));
      
      // Recursive olarak hücreleri aç
      const revealCell = (r, c) => {
        if (r < 0 || r >= height || c < 0 || c >= width || newBoard[r][c].isOpen || newBoard[r][c].isFlagged) {
          return;
        }
        
        newBoard[r][c].isOpen = true;
        setOpenCount(prevCount => prevCount + 1);
        
        // Eğer çevrede mayın yoksa komşu hücreleri de aç
        if (newBoard[r][c].adjacentMines === 0) {
          for (let nr = Math.max(0, r - 1); nr <= Math.min(height - 1, r + 1); nr++) {
            for (let nc = Math.max(0, c - 1); nc <= Math.min(width - 1, c + 1); nc++) {
              if (nr !== r || nc !== c) {
                revealCell(nr, nc);
              }
            }
          }
        }
      };
      
      // Mayına tıklandıysa oyunu kaybettir
      if (newBoard[row][col].isMine) {
        // Tüm mayınları göster
        for (let r = 0; r < height; r++) {
          for (let c = 0; c < width; c++) {
            if (newBoard[r][c].isMine) {
              newBoard[r][c].isOpen = true;
            }
          }
        }
        setGameStatus(-1);
        onGameEnd({ status: 'lost', time });
      } else {
        revealCell(row, col);
        
        // Tüm mayınsız hücreler açıldıysa oyunu kazandır
        const totalCells = width * height;
        const remainingCells = totalCells - openCount - 1; // Yeni açılan hücre
        
        if (remainingCells === mines) {
          // Tüm mayınlara bayrak koy
          for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
              if (newBoard[r][c].isMine) {
                newBoard[r][c].isFlagged = true;
              }
            }
          }
          setGameStatus(1);
          onGameEnd({ status: 'won', time });
        }
      }
      
      return newBoard;
    });
  }, [board, gameStatus, isFirstClick, placeMines, height, width, openCount, mines, time, onGameEnd]);

  // Bayrak koyma/kaldırma işlemi
  const toggleFlag = useCallback((row, col) => {
    if (gameStatus !== 0 || board[row][col].isOpen) {
      return;
    }
    
    setBoard(prevBoard => {
      const newBoard = JSON.parse(JSON.stringify(prevBoard));
      newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
      
      if (newBoard[row][col].isFlagged) {
        setFlagCount(prev => prev + 1);
      } else {
        setFlagCount(prev => prev - 1);
      }
      
      return newBoard;
    });
  }, [board, gameStatus]);

  // Oyunu yeniden başlat
  const resetGame = useCallback(() => {
    initializeBoard();
  }, [initializeBoard]);

  // Oyun başladığında süreyi başlat
  useEffect(() => {
    let timer;
    if (isGameStarted && gameStatus === 0) {
      timer = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    
    return () => {
      clearInterval(timer);
    };
  }, [isGameStarted, gameStatus]);

  // Oyun tahtasını başlangıçta oluştur
  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  return {
    board,
    gameStatus,
    flagCount,
    mines,
    time,
    openCell,
    toggleFlag,
    resetGame
  };
};

export default useMinesweeper; 