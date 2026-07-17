const setupSection = document.getElementById('setup-section');
const dashboardSection = document.getElementById('dashboard-section');
const setupForm = document.getElementById('setup-form');
const targetPicker = document.getElementById('target-picker');
const targetForm = document.getElementById('target-form');
const targetConfirmed = document.getElementById('target-confirmed');
const addCigaretteButton = document.getElementById('add-cigarette');
const undoCigaretteButton = document.getElementById('undo-cigarette');
const resetButton = document.getElementById('reset-button');

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, duration, type, startDelay, volume) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  const startTime = ctx.currentTime + startDelay;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

// +1 İçtim için kötü/uyarıcı bir ses
function playBadSound() {
  playTone(180, 0.25, 'sawtooth', 0, 0.15);
  playTone(110, 0.3, 'sawtooth', 0.1, 0.15);
}

// -1 Azalt için mutlu/ödüllendirici bir ses
function playGoodSound() {
  playTone(523.25, 0.12, 'sine', 0, 0.2);
  playTone(659.25, 0.12, 'sine', 0.1, 0.2);
  playTone(784.0, 0.2, 'sine', 0.2, 0.2);
}

function render() {
  const plan = loadPlan();

  if (!plan) {
    setupSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    return;
  }

  setupSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');

  const today = todayString();
  const dayNumber = daysBetween(plan.startDate, today);
  document.getElementById('day-title').textContent = `${dayNumber + 1}. Gün`;

  if (plan.dailyTargets[today] === undefined) {
    targetPicker.classList.remove('hidden');
    targetConfirmed.classList.add('hidden');

    const suggestion = suggestedTargetForDay(plan, dayNumber);
    document.getElementById('suggested-target').textContent = suggestion;
    document.getElementById('chosen-target').value = suggestion;
  } else {
    targetPicker.classList.add('hidden');
    targetConfirmed.classList.remove('hidden');

    document.getElementById('today-target').textContent = plan.dailyTargets[today];

    const todayCount = plan.logs[today] || 0;
    document.getElementById('today-count').textContent = todayCount;

    const feedback = document.getElementById('feedback-message');
    const target = plan.dailyTargets[today];
    if (todayCount === 0) {
      feedback.textContent = 'Bugün için henüz kayıt yok.';
      feedback.style.color = '#777';
    } else if (todayCount <= target) {
      feedback.textContent = `Hedefinin içindesin (${todayCount}/${target}) 🎉`;
      feedback.style.color = '#2e7d32';
    } else {
      feedback.textContent = `Hedefini aştın (${todayCount}/${target}), yarın tekrar dene.`;
      feedback.style.color = '#c62828';
    }

    const times = plan.cigaretteTimes[today] || [];
    document.getElementById('today-times').textContent = times.length
      ? `Bugünkü saatler: ${times.join(', ')}`
      : '';
  }

  renderStats(plan);
}

function renderStats(plan) {
  const loggedDays = Object.keys(plan.logs);
  const smokeFreeDays = loggedDays.filter(date => plan.logs[date] === 0).length;

  let onTargetCount = 0;
  loggedDays.forEach(date => {
    const dayTarget = effectiveTargetForDate(plan, date);
    if (plan.logs[date] <= dayTarget) onTargetCount++;
  });
  const progressPercent = loggedDays.length
    ? Math.round((onTargetCount / loggedDays.length) * 100)
    : 0;

  document.getElementById('stat-smokefree').textContent = smokeFreeDays;
  document.getElementById('stat-progress').textContent = `${progressPercent}%`;
}

setupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const startCount = Number(document.getElementById('start-count').value);
  const totalDays = Number(document.getElementById('total-days').value);
  const pricePerPack = Number(document.getElementById('price-per-pack').value);

  savePlan({
    startCount,
    totalDays,
    pricePerPack,
    startDate: todayString(),
    dailyTargets: {},
    logs: {},
    cigaretteTimes: {}
  });

  render();
});

targetForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const plan = loadPlan();
  const chosen = Number(document.getElementById('chosen-target').value);

  plan.dailyTargets[todayString()] = chosen;
  savePlan(plan);

  render();
});

addCigaretteButton.addEventListener('click', () => {
  const plan = loadPlan();
  const today = todayString();

  plan.logs[today] = (plan.logs[today] || 0) + 1;
  if (!plan.cigaretteTimes[today]) plan.cigaretteTimes[today] = [];
  plan.cigaretteTimes[today].push(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));

  savePlan(plan);
  playBadSound();
  render();
});

undoCigaretteButton.addEventListener('click', () => {
  const plan = loadPlan();
  const today = todayString();

  if (!plan.logs[today]) return;

  plan.logs[today] -= 1;
  if (plan.cigaretteTimes[today] && plan.cigaretteTimes[today].length) {
    plan.cigaretteTimes[today].pop();
  }

  savePlan(plan);
  playGoodSound();
  render();
});

resetButton.addEventListener('click', () => {
  const confirmed = confirm('Planını sıfırlamak istediğine emin misin? Tüm geçmiş silinecek.');
  if (confirmed) {
    localStorage.removeItem(STORAGE_KEY);
    render();
  }
});

render();
