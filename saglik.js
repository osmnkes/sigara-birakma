const MILESTONES = [
  { hours: 20 / 60, label: '20 dakika: Nabız ve kan basıncı normale döner.' },
  { hours: 12, label: '12 saat: Kandaki karbonmonoksit seviyesi normale döner.' },
  { hours: 24 * 14, label: '2-3 hafta: Kan dolaşımı düzelir, akciğer fonksiyonları artmaya başlar.' },
  { hours: 24 * 30, label: '1-9 ay: Öksürük ve nefes darlığı azalır.' },
  { hours: 24 * 365, label: '1 yıl: Kalp hastalığı riski yarı yarıya azalır.' },
  { hours: 24 * 365 * 5, label: '5 yıl: İnme riski hiç içmeyen biri seviyesine yaklaşır.' },
  { hours: 24 * 365 * 10, label: '10 yıl: Akciğer kanserinden ölüm riski yarıya iner.' }
];

function formatHours(hours) {
  if (hours < 1) return `${Math.round(hours * 60)} dakika`;
  if (hours < 24) return `${hours.toFixed(1)} saat`;
  return `${Math.floor(hours / 24)} gün`;
}

function render() {
  const plan = loadPlan();
  const streakInfo = document.getElementById('streak-info');
  const milestoneList = document.getElementById('milestone-list');
  const noPlanHealth = document.getElementById('no-plan-health');

  if (!plan) {
    noPlanHealth.classList.remove('hidden');
    streakInfo.textContent = '';
    milestoneList.innerHTML = MILESTONES.map(m => `<li>${m.label}</li>`).join('');
    return;
  }

  noPlanHealth.classList.add('hidden');

  const currentStreak = currentStreakHours(plan);
  const longestGap = longestSmokeFreeGapHours(plan);

  if (currentStreak === null) {
    streakInfo.textContent = 'Sigara kaydı girmeye başlayınca burada hangi aşamalara ulaştığını görebilirsin.';
    milestoneList.innerHTML = MILESTONES.map(m => `<li>${m.label}</li>`).join('');
    return;
  }

  const best = Math.max(longestGap || 0, currentStreak);

  streakInfo.innerHTML = `Şu anki sigarasız süren: <strong>${formatHours(currentStreak)}</strong>` +
    (longestGap ? ` · En uzun sigarasız kaldığın süre: <strong>${formatHours(longestGap)}</strong>` : '') + '.';

  milestoneList.innerHTML = MILESTONES.map(m => {
    const reached = best >= m.hours;
    return `<li class="${reached ? 'milestone-reached' : ''}">${reached ? '✅' : '⬜'} ${m.label}</li>`;
  }).join('');
}

render();
