// Timeout ve deadline yönetimi

const timers = new Map(); // timerId -> setTimeout id

// Deadline timer oluştur
const createDeadlineTimer = (id, duration, callback) => {
  // Mevcut timer'ı temizle
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
  }

  // Yeni timer oluştur
  const timerId = setTimeout(() => {
    timers.delete(id);
    callback();
  }, duration);

  timers.set(id, timerId);

  console.log(`⏰ Timer oluşturuldu: ${id} (${duration}ms)`);
  return id;
};

// Timer'ı iptal et
const cancelTimer = (id) => {
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
    console.log(`❌ Timer iptal edildi: ${id}`);
    return true;
  }
  return false;
};

// Tüm timer'ları temizle
const clearAllTimers = () => {
  timers.forEach((timerId) => {
    clearTimeout(timerId);
  });
  timers.clear();
  console.log("🧹 Tüm timer'lar temizlendi");
};

// Aktif timer sayısı
const getActiveTimerCount = () => timers.size;

// Varsayılan süre değerleri (ms)
const TIMEOUTS = {
  GUESS_WINDOW: 60000, // 60 saniye tahmin süresi
  VOTING_WINDOW: 30000, // 30 saniye oylama süresi
  RECONNECT_GRACE: 10000, // 10 saniye reconnect süresi
  ROUND_TRANSITION: 5000, // 5 saniye round geçiş süresi
};

module.exports = {
  createDeadlineTimer,
  cancelTimer,
  clearAllTimers,
  getActiveTimerCount,
  TIMEOUTS,
};

