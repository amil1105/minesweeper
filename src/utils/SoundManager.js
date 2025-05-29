/**
 * Mayın Tarlası oyunu için ses yönetim sınıfı
 */
class SoundManager {
  constructor() {
    this.sounds = {};
    this.muted = localStorage.getItem('minesweeper_muted') === 'true';
    this.volume = parseFloat(localStorage.getItem('minesweeper_volume') || '0.5');
    this.initialized = false;
    
    // Ses dosyalarını önbelleğe al
    this.preloadSounds();
  }

  /**
   * Ses dosyalarını önceden yükle
   */
  preloadSounds() {
    // Ses dosyalarını tanımla - Mevcut .wav dosyalarına göre yolları güncelliyoruz
    const soundFiles = {
      click: './sounds/click.wav',              // Hücre açma sesi
      flag: './sounds/click.wav',               // Bayrak koyma/kaldırma sesi (click sesini kullanıyoruz)
      explosion: './sounds/lose_minesweeper.wav', // Mayın patlama sesi
      win: './sounds/win.wav',                  // Oyun kazanma sesi
      lose: './sounds/lose_flowergarden_short.wav', // Oyun kaybetme sesi
      open: './sounds/click.wav',               // Çoklu hücre açma sesi
      start: './sounds/start.wav'               // Oyun başlama sesi
    };

    // Ses dosyalarını yükle
    Object.entries(soundFiles).forEach(([name, path]) => {
      try {
        this.sounds[name] = new Audio(path);
        this.sounds[name].volume = this.volume;
        
        // Mobil cihazlarda ses çalma sorununu önlemek için preload attribute
        this.sounds[name].preload = 'auto';
        
        // Yükleme hatalarını yakala
        this.sounds[name].addEventListener('error', (e) => {
          console.warn(`Ses dosyası yüklenemedi (${name}): ${path}`, e);
        });
        
        // Sesi yükle
        this.sounds[name].load();
      } catch (error) {
        console.error(`Ses nesnesi oluşturulamadı (${name}): ${path}`, error);
      }
    });
    
    this.initialized = true;
    console.log('Mayın Tarlası ses sistemi başlatıldı - Mevcut dosyalar: ' + Object.keys(this.sounds).join(', '));
  }

  /**
   * Ses seviyesini ayarla
   * @param {number} volume - 0 ile 1 arasında bir değer
   */
  setVolume(volume) {
    this.volume = volume;
    localStorage.setItem('minesweeper_volume', volume.toString());
    
    // Tüm seslerin seviyesini güncelle
    Object.values(this.sounds).forEach(sound => {
      if (sound) sound.volume = volume;
    });
  }

  /**
   * Sesi aç/kapat
   * @param {boolean} muted - Ses kapalı mı?
   */
  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem('minesweeper_muted', muted.toString());
    console.log(`Ses ${muted ? 'kapatıldı' : 'açıldı'}`);
  }

  /**
   * Ses çal
   * @param {string} soundName - Çalınacak sesin adı
   */
  play(soundName) {
    if (this.muted || !this.sounds[soundName]) return;
    
    try {
      // Ses nesnesini alın veya kopyalayın
      let sound = this.sounds[soundName];
      
      // Eğer ses çalınıyorsa ve yeniden başlatılamıyorsa, yeni bir ses örneği oluştur
      if (sound.currentTime > 0 && !sound.paused) {
        // Ses zaten çalınıyor, klonla
        sound = this.sounds[soundName].cloneNode();
        sound.volume = this.volume;
      } else {
        // Sesi baştan başlat
        sound.currentTime = 0;
      }
      
      // Sesi çal
      const playPromise = sound.play();
      
      // Hata yakalama için Promise kontrolü
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`Ses çalma hatası (${soundName}):`, error);
        });
      }
    } catch (error) {
      console.warn(`Ses çalma hatası (${soundName}):`, error);
    }
  }

  /**
   * Tüm sesleri test et (geliştirme için)
   */
  testAllSounds() {
    if (this.muted) {
      console.log('Ses kapalı olduğu için test edilemiyor');
      return;
    }
    
    console.log('Tüm sesler test ediliyor...');
    const soundNames = Object.keys(this.sounds);
    
    // Sesleri 1 saniye aralıklarla çal
    let index = 0;
    const playNextSound = () => {
      if (index < soundNames.length) {
        const soundName = soundNames[index];
        console.log(`Test: ${soundName} çalınıyor`);
        this.play(soundName);
        index++;
        setTimeout(playNextSound, 1000);
      }
    };
    
    playNextSound();
  }

  // Yaygın kullanılan sesler için yardımcı metotlar
  playClick() {
    this.play('click');
  }

  playFlag() {
    this.play('flag');
  }

  playExplosion() {
    this.play('explosion');
  }

  playWin() {
    this.play('win');
  }

  playLose() {
    this.play('lose');
  }
  
  playOpen() {
    this.play('open');
  }
  
  playStart() {
    this.play('start');
  }
}

// Singleton örneği oluştur
const soundManager = new SoundManager();

export default soundManager; 