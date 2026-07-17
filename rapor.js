const noPlanMessage = document.getElementById('no-plan-message');
const reportContent = document.getElementById('report-content');
const priceInput = document.getElementById('price-input');
const priceSaveButton = document.getElementById('price-save');

function render() {
  const plan = loadPlan();

  if (!plan) {
    noPlanMessage.classList.remove('hidden');
    reportContent.classList.add('hidden');
    return;
  }

  noPlanMessage.classList.add('hidden');
  reportContent.classList.remove('hidden');

  priceInput.value = plan.pricePerPack || '';
  renderReports(plan);
  renderDailyChart(plan);
  renderHourlyChart(plan);
}

function renderReports(plan) {
  const reportsDiv = document.getElementById('reports');
  const loggedDays = Object.keys(plan.logs).sort();

  if (loggedDays.length === 0) {
    reportsDiv.textContent = 'Henüz kaydın yok. İlk gününü kaydettiğinde burada rapor göreceksin.';
    return;
  }

  const lines = [];

  const today = todayString();
  if (plan.logs[today] !== undefined) {
    const todayRestriction = plan.startCount - plan.logs[today];
    if (todayRestriction >= 0) {
      lines.push(`Bugün kendini <strong>${todayRestriction}</strong> sigara kısıtladın.`);
    } else {
      lines.push(`Bugün alışkanlığından <strong>${-todayRestriction}</strong> sigara fazla içtin.`);
    }
  }

  const totalActual = loggedDays.reduce((sum, date) => sum + plan.logs[date], 0);
  const totalBaseline = plan.startCount * loggedDays.length;
  const avoided = Math.max(0, totalBaseline - totalActual);
  const reductionPercent = totalBaseline
    ? Math.round((avoided / totalBaseline) * 100)
    : 0;

  lines.push(`${loggedDays.length} gündür kayıt tutuyorsun, bu süre boyunca toplam <strong>${avoided}</strong> sigara daha az içtin (yaklaşık %${reductionPercent} azalma).`);

  const price = pricePerCigarette(plan);
  if (price > 0) {
    const avgDailyAvoided = avoided / loggedDays.length;
    const monthlySavings = avgDailyAvoided * price * 30;
    const yearlySavings = avgDailyAvoided * price * 365;
    lines.push(`Bu tempoyla ayda yaklaşık <strong>${monthlySavings.toFixed(2)} TL</strong>, yılda yaklaşık <strong>${yearlySavings.toFixed(2)} TL</strong> tasarruf edersin.`);
  }

  const firstDate = loggedDays[0];
  const lastDate = loggedDays[loggedDays.length - 1];
  const firstActual = plan.logs[firstDate];
  const lastActual = plan.logs[lastDate];
  const daySpan = daysBetween(firstDate, lastDate);

  if (daySpan > 0 && firstActual > lastActual) {
    const dailyRate = (firstActual - lastActual) / daySpan;
    const daysToZero = Math.ceil(lastActual / dailyRate);
    lines.push(`Böyle devam edersen yaklaşık <strong>${daysToZero} gün</strong> içinde tamamen bırakabilirsin.`);
  } else {
    lines.push('Bırakma tahmini için birkaç gün daha düzenli kayıt tutman gerekiyor.');
  }

  reportsDiv.innerHTML = lines.map(line => `<p>${line}</p>`).join('');
}

function renderDailyChart(plan) {
  const container = document.getElementById('daily-chart');
  const dates = Object.keys(plan.logs).sort();

  if (dates.length === 0) {
    container.textContent = 'Henüz veri yok.';
    return;
  }

  const targets = dates.map(date => effectiveTargetForDate(plan, date));
  const actuals = dates.map(date => plan.logs[date]);
  const maxValue = Math.max(plan.startCount, ...targets, ...actuals, 1);

  container.innerHTML = '';
  dates.forEach((date, i) => {
    const actual = actuals[i];
    const target = targets[i];
    const dayNum = daysBetween(plan.startDate, date) + 1;

    const col = document.createElement('div');
    col.className = 'bar-col';

    const barArea = document.createElement('div');
    barArea.className = 'bar-area';
    barArea.title = `${dayNum}. gün — hedef: ${target}, gerçekleşen: ${actual}`;

    const bar = document.createElement('div');
    bar.className = `bar ${actual <= target ? 'bar-good' : 'bar-bad'}`;
    bar.style.height = `${(actual / maxValue) * 100}%`;

    const marker = document.createElement('div');
    marker.className = 'target-marker';
    marker.style.bottom = `${(target / maxValue) * 100}%`;

    barArea.appendChild(bar);
    barArea.appendChild(marker);

    const label = document.createElement('span');
    label.className = 'bar-label';
    label.textContent = dayNum;

    col.appendChild(barArea);
    col.appendChild(label);
    container.appendChild(col);
  });
}

function renderHourlyChart(plan) {
  const container = document.getElementById('hourly-chart');
  const counts = hourlyDistribution(plan);
  const total = counts.reduce((sum, c) => sum + c, 0);

  if (total === 0) {
    container.textContent = 'Henüz veri yok.';
    return;
  }

  const maxValue = Math.max(...counts, 1);
  container.innerHTML = '';
  counts.forEach((count, hour) => {
    const col = document.createElement('div');
    col.className = 'bar-col hour-col';

    const barArea = document.createElement('div');
    barArea.className = 'bar-area';
    barArea.title = `${String(hour).padStart(2, '0')}:00 — ${count} sigara`;

    const bar = document.createElement('div');
    bar.className = 'bar bar-hour';
    bar.style.height = `${(count / maxValue) * 100}%`;

    barArea.appendChild(bar);

    const label = document.createElement('span');
    label.className = 'bar-label';
    label.textContent = hour % 3 === 0 ? String(hour).padStart(2, '0') : '';

    col.appendChild(barArea);
    col.appendChild(label);
    container.appendChild(col);
  });
}

priceSaveButton.addEventListener('click', () => {
  const plan = loadPlan();
  plan.pricePerPack = Number(priceInput.value);
  savePlan(plan);
  render();
});

render();
