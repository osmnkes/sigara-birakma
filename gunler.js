const noPlanDays = document.getElementById('no-plan-days');
const noDaysYet = document.getElementById('no-days-yet');
const dayList = document.getElementById('day-list');

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}

function render() {
  const plan = loadPlan();

  if (!plan) {
    noPlanDays.classList.remove('hidden');
    noDaysYet.classList.add('hidden');
    dayList.innerHTML = '';
    return;
  }

  noPlanDays.classList.add('hidden');

  const dates = Object.keys(plan.logs).sort().reverse();

  if (dates.length === 0) {
    noDaysYet.classList.remove('hidden');
    dayList.innerHTML = '';
    return;
  }

  noDaysYet.classList.add('hidden');

  dayList.innerHTML = dates.map(date => {
    const dayNum = daysBetween(plan.startDate, date) + 1;
    const target = effectiveTargetForDate(plan, date);
    const actual = plan.logs[date];
    const times = plan.cigaretteTimes[date] || [];
    const metGoal = actual <= target;
    const restriction = plan.startCount - actual;

    const restrictionText = restriction >= 0
      ? `Alışkanlığına göre <strong>${restriction}</strong> sigara azalttın.`
      : `Alışkanlığından <strong>${-restriction}</strong> sigara fazla içtin.`;

    return `
      <div class="day-card">
        <div class="day-card-header">
          <span class="day-card-title">${dayNum}. Gün <span class="day-card-date">(${formatDate(date)})</span></span>
          <span class="day-card-status ${metGoal ? 'status-good' : 'status-bad'}">${metGoal ? 'Hedef tutuldu' : 'Hedef aşıldı'}</span>
        </div>
        <p>Hedef: <strong>${target}</strong> · Gerçekleşen: <strong>${actual}</strong></p>
        <p>${restrictionText}</p>
        <p class="times-list">${times.length ? `Saatler: ${times.join(', ')}` : 'Saat kaydı yok.'}</p>
      </div>
    `;
  }).join('');
}

render();
