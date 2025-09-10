/**
 * Görev yönetimi modülü
 * - Rastgele görev listesi
 * - Görev atama logic'i
 * - Görev tamamlama takibi
 */

// Görev havuzu - çeşitli kategori ve zorluk seviyelerinde
const TASK_POOL = [
  // Basit Eylemler
  "10 kez el çırp",
  "5 saniye boyunca tek ayak üzerinde dur",
  "Alfabeyi tersten söyle",
  "Favori şarkını mırıldan",
  "3 farklı hayvan sesi çıkar",
  "Gözlerini kapatıp burnunu elle",
  "10 saniye boyunca gülümseme",
  "En sevdiğin rengi söyle ve nedenini açıkla",

  // Yaratıcı Görevler
  "Kısa bir şiir uydur",
  "Çevrendeki 5 nesneyi say",
  "En komik anını anlat",
  "Bir süper güç seç ve nedenini açıkla",
  "Çocukluk hayalin neydi?",
  "En garip yemeğin ne?",
  "Robot gibi konuş",
  "Bir film karakterini taklit et",

  // Sosyal Görevler
  "En sevdiğin hobini anlat",
  "Birine teşekkür et",
  "Bugün iyi olan bir şeyi paylaş",
  "En sevdiğin mevsimi söyle",
  "Rüyanda gördüğün son şeyi anlat",
  "Bir yerli müzik sanatçısı söyle",
  "En sevdiğin kitap/film öner",
  "Çocukken en sevdiğin oyuncak",

  // Eğlenceli Zorluklar
  "Gözlerin kapalı ABC yazı",
  "5 saniye boyunca hiç konuşma",
  "En hızlı şekilde 1'den 20'ye say",
  "Komik bir yüz ifadesi yap",
  "Favori dans hareketini göster",
  "En sevdiğin emoji ile cümle kur",
  "Bir limerik uydur",
  "En garip alışkanlığını söyle",

  // Düşünce Provokatif
  "Mars'ta yaşamak ister miydin?",
  "Görünmezlik gücün olsa ne yapardın?",
  "En büyük korkun nedir?",
  "Tarihteki hangi döneme gitmek isterdin?",
  "Dünyadaki en güzel yer neresi?",
  "En sevdiğin çizgi karakter kimdir?",
  "Okul hayatından en komik anı?",
  "Teknoloji olmasa ne yapardın?",

  // Hızlı Düşünce
  "Kırmızı renkli 5 şey say",
  "K harfi ile başlayan 5 kelime",
  "En sevdiğin 3 pizza malzemesi",
  "Mutfakta bulunan 5 eşya say",
  "En sevdiğin 3 meyve",
  "Okuldaki 5 ders söyle",
  "En sevdiğin 3 hayvan",
  "Evdeki en kullanışlı 3 eşya",
];

// Görev ID'si oluşturucu
function generateTaskId() {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Rastgele görev seçici
function getRandomTask() {
  const randomIndex = Math.floor(Math.random() * TASK_POOL.length);
  return TASK_POOL[randomIndex];
}

// Kullanılmış görevleri takip et (aynı round'da tekrar vermemek için)
const usedTasksPerRoom = new Map();

// Oda için görev atama
function assignTasksToRoom(roomCode, playerIds) {
  // Bu oda için kullanılmış görevleri sıfırla
  usedTasksPerRoom.delete(roomCode);
  const usedTasks = new Set();

  const assignments = new Map();

  playerIds.forEach((playerId) => {
    let task;
    let attempts = 0;

    // Aynı görevi vermemek için maksimum 50 deneme
    do {
      task = getRandomTask();
      attempts++;
    } while (usedTasks.has(task) && attempts < 50);

    // Eğer 50 denemede unique bulamazsak, duplicate olmasına izin ver
    usedTasks.add(task);

    const taskData = {
      id: generateTaskId(),
      text: task,
      playerId: playerId,
      assignedAt: Date.now(),
      completed: false,
      completedAt: null,
    };

    assignments.set(playerId, taskData);
  });

  // Bu odanın kullanılmış görevlerini kaydet
  usedTasksPerRoom.set(roomCode, usedTasks);

  return assignments;
}

// Player'ın görevini tamamla
function completeTask(roomCode, playerId, taskAssignments) {
  if (taskAssignments.has(playerId)) {
    const task = taskAssignments.get(playerId);
    task.completed = true;
    task.completedAt = Date.now();
    return task;
  }
  return null;
}

// Tüm görevler tamamlandı mı?
function areAllTasksCompleted(taskAssignments) {
  return Array.from(taskAssignments.values()).every((task) => task.completed);
}

// Görev istatistikleri
function getTaskStats(taskAssignments) {
  const total = taskAssignments.size;
  const completed = Array.from(taskAssignments.values()).filter(
    (task) => task.completed
  ).length;
  const pending = total - completed;

  return {
    total,
    completed,
    pending,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

// Export
module.exports = {
  assignTasksToRoom,
  completeTask,
  areAllTasksCompleted,
  getTaskStats,
  generateTaskId,
  getRandomTask,
  TASK_POOL,
};
