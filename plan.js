// Bu dosya index.html ve rapor.html arasında paylaşılan ortak fonksiyonları içerir.
const STORAGE_KEY = 'sigara-plan';
const PACK_SIZE = 20;

function todayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysBetween(dateStrA, dateStrB) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const a = new Date(dateStrA);
  const b = new Date(dateStrB);
  return Math.round((b - a) / msPerDay);
}

function loadPlan() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const plan = JSON.parse(raw);
  if (!plan.dailyTargets) plan.dailyTargets = {};
  if (!plan.pricePerPack) plan.pricePerPack = 0;
  if (!plan.cigaretteTimes) plan.cigaretteTimes = {};
  return plan;
}

function savePlan(plan) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

function pricePerCigarette(plan) {
  return plan.pricePerPack / PACK_SIZE;
}

function suggestedTargetForDay(plan, dayNumber) {
  if (dayNumber >= plan.totalDays) return 0;
  const remainingRatio = 1 - dayNumber / plan.totalDays;
  return Math.max(0, Math.round(plan.startCount * remainingRatio));
}

// Kullanıcı o gün için kendi hedefini onayladıysa onu, onaylamadıysa
// plana göre hesaplanan öneriyi döndürür (geçmiş günler için).
function effectiveTargetForDate(plan, date) {
  if (plan.dailyTargets[date] !== undefined) return plan.dailyTargets[date];
  const dayNum = daysBetween(plan.startDate, date);
  return suggestedTargetForDay(plan, dayNum);
}

// Saat başına (0-23) toplam içilen sigara sayısı, tüm günler dahil.
function hourlyDistribution(plan) {
  const counts = new Array(24).fill(0);
  Object.values(plan.cigaretteTimes).forEach(times => {
    times.forEach(time => {
      const hour = Number(time.split(':')[0]);
      counts[hour] += 1;
    });
  });
  return counts;
}

// Kaydedilen tüm sigara zamanlarını tarih sırasına göre Date listesi olarak döndürür.
function allCigaretteTimestamps(plan) {
  const timestamps = [];
  Object.keys(plan.cigaretteTimes).sort().forEach(date => {
    plan.cigaretteTimes[date].forEach(time => {
      timestamps.push(new Date(`${date}T${time}:00`));
    });
  });
  return timestamps;
}

// Ardışık iki sigara arasındaki en uzun süreyi saat cinsinden döndürür.
function longestSmokeFreeGapHours(plan) {
  const timestamps = allCigaretteTimestamps(plan);
  if (timestamps.length < 2) return null;

  let maxGapMs = 0;
  for (let i = 1; i < timestamps.length; i++) {
    const gap = timestamps[i] - timestamps[i - 1];
    if (gap > maxGapMs) maxGapMs = gap;
  }
  return maxGapMs / (1000 * 60 * 60);
}

// Son kayıttan bu yana geçen süreyi saat cinsinden döndürür (devam eden sigarasız süre).
function currentStreakHours(plan) {
  const timestamps = allCigaretteTimestamps(plan);
  if (timestamps.length === 0) return null;
  const last = timestamps[timestamps.length - 1];
  return (new Date() - last) / (1000 * 60 * 60);
}
