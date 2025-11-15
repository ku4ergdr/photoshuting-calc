const DEFAULT_SETTINGS = {
  travelRate: 800,
  shootRate: 1500,
  editingRate: 1000,
  baseComplexity: 1.0,
};

const SETTINGS_KEY = 'photoCalcSettings_v1';

function loadSettings() {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (error) {
      console.warn('Не удалось прочитать сохранённые настройки, используются значения по умолчанию.', error);
    }
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function formatCurrency(value) {
  return value.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  });
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function clampToZero(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

document.addEventListener('DOMContentLoaded', () => {
  let settings = loadSettings();

  const adminToggle = document.getElementById('admin-toggle');
  const adminForm = document.getElementById('admin-form');
  const adminResetButton = document.getElementById('admin-reset');
  const goalInput = document.getElementById('monthly-goal');
  const travelHoursInput = document.getElementById('travel-hours');
  const shootHoursInput = document.getElementById('shoot-hours');
  const editingHoursInput = document.getElementById('editing-hours');
  const complexityInput = document.getElementById('complexity');
  const weekendCheckbox = document.getElementById('weekend-checkbox');
  const oddHoursCheckbox = document.getElementById('odd-hours-checkbox');
  const resultOutput = document.getElementById('result-output');
  const calcForm = document.getElementById('calculator-form');
  const calcResetButton = document.getElementById('calculator-reset');

  const displayTravelRate = document.getElementById('display-travel-rate');
  const displayShootRate = document.getElementById('display-shoot-rate');
  const displayEditingRate = document.getElementById('display-editing-rate');

  const adminTravelRateInput = document.getElementById('admin-travel-rate');
  const adminShootRateInput = document.getElementById('admin-shoot-rate');
  const adminEditingRateInput = document.getElementById('admin-editing-rate');
  const adminBaseComplexityInput = document.getElementById('admin-base-complexity');

  function populateAdminForm() {
    adminTravelRateInput.value = settings.travelRate;
    adminShootRateInput.value = settings.shootRate;
    adminEditingRateInput.value = settings.editingRate;
    adminBaseComplexityInput.value = settings.baseComplexity;
  }

  function populateUserFields() {
    displayTravelRate.textContent = settings.travelRate.toLocaleString('ru-RU');
    displayShootRate.textContent = settings.shootRate.toLocaleString('ru-RU');
    displayEditingRate.textContent = settings.editingRate.toLocaleString('ru-RU');
    if (!complexityInput.value) {
      complexityInput.value = settings.baseComplexity;
    }
  }

  function resetAdminSettings() {
    settings = { ...DEFAULT_SETTINGS };
    saveSettings(settings);
    populateAdminForm();
    populateUserFields();
  }

  adminToggle.addEventListener('click', () => {
    const isHidden = adminForm.classList.toggle('hidden');
    adminToggle.textContent = isHidden ? 'Показать настройки администратора' : 'Скрыть настройки администратора';
  });

  adminForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const travelRate = clampToZero(Number(adminTravelRateInput.value));
    const shootRate = clampToZero(Number(adminShootRateInput.value));
    const editingRate = clampToZero(Number(adminEditingRateInput.value));
    const baseComplexity = clampToZero(Number(adminBaseComplexityInput.value)) || 1;

    settings = { travelRate, shootRate, editingRate, baseComplexity };
    saveSettings(settings);
    populateUserFields();
    alert('Настройки сохранены.');
  });

  adminResetButton.addEventListener('click', () => {
    if (confirm('Сбросить настройки к значениям по умолчанию?')) {
      resetAdminSettings();
    }
  });

  calcForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const monthlyGoal = clampToZero(Number(goalInput.value));
    const travelHours = clampToZero(Number(travelHoursInput.value));
    const shootHours = clampToZero(Number(shootHoursInput.value));
    const editingHours = clampToZero(Number(editingHoursInput.value));
    const baseComplexity = clampToZero(Number(complexityInput.value)) || settings.baseComplexity;

    const weekendMultiplier = weekendCheckbox.checked ? 1.1 : 1;
    const oddHoursMultiplier = oddHoursCheckbox.checked ? 1.1 : 1;
    const effectiveComplexity = baseComplexity * weekendMultiplier * oddHoursMultiplier;

    const travelCost = travelHours * settings.travelRate;
    const shootCost = shootHours * settings.shootRate;
    const editingCost = editingHours * settings.editingRate;
    const totalBeforeComplexity = travelCost + shootCost + editingCost;
    const totalCost = totalBeforeComplexity * effectiveComplexity;

    const parts = [];
    parts.push(`<strong>Итого к оплате: <span class="result__highlight">${formatCurrency(totalCost)}</span></strong>`);
    parts.push(`Коэффициент сложности с учётом условий: <strong>${effectiveComplexity.toFixed(2)}</strong>`);
    parts.push(`Базовая стоимость без коэффициента: ${formatCurrency(totalBeforeComplexity)}`);

    if (monthlyGoal > 0) {
      const percent = Math.min((totalCost / monthlyGoal) * 100, Number.POSITIVE_INFINITY);
      const percentText = formatPercent(percent);
      const percentClass = percent >= 100 ? 'result__success' : '';
      parts.push(`Доля от желаемого дохода: <strong class="${percentClass}">${percentText}</strong>`);
    } else {
      parts.push('Укажите желаемый ежемесячный доход, чтобы увидеть процент достижения цели.');
    }

    parts.push('<hr>');
    parts.push('<strong>Детализация:</strong>');
    parts.push(`• Дорога: ${travelHours.toFixed(2)} ч × ${formatCurrency(settings.travelRate)} = ${formatCurrency(travelCost)}`);
    parts.push(`• Съёмка: ${shootHours.toFixed(2)} ч × ${formatCurrency(settings.shootRate)} = ${formatCurrency(shootCost)}`);
    parts.push(`• Обработка: ${editingHours.toFixed(2)} ч × ${formatCurrency(settings.editingRate)} = ${formatCurrency(editingCost)}`);

    resultOutput.innerHTML = parts.map((item) => `<p>${item}</p>`).join('');
  });

  calcResetButton.addEventListener('click', () => {
    calcForm.reset();
    complexityInput.value = settings.baseComplexity;
    resultOutput.innerHTML = '<p>Данные очищены. Введите новые значения для расчёта.</p>';
  });

  populateAdminForm();
  populateUserFields();
});
