const noPlanTimes = document.getElementById('no-plan-times');
const noTimesToday = document.getElementById('no-times-today');
const timeList = document.getElementById('time-list');

function render() {
  const plan = loadPlan();

  if (!plan) {
    noPlanTimes.classList.remove('hidden');
    noTimesToday.classList.add('hidden');
    timeList.innerHTML = '';
    return;
  }

  noPlanTimes.classList.add('hidden');

  const times = plan.cigaretteTimes[todayString()] || [];

  if (times.length === 0) {
    noTimesToday.classList.remove('hidden');
    timeList.innerHTML = '';
    return;
  }

  noTimesToday.classList.add('hidden');
  timeList.innerHTML = times.map(time => `<li>${time}</li>`).join('');
}

render();
