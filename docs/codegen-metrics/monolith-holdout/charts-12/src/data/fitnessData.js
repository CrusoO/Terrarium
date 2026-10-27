// 30 days of realistic daily step counts ending today
function generateStepsData() {
  const today = new Date();
  const data = [];

  const rawSteps = [
    7842, 5210, 9340, 11200, 4890, 6750, 8430,
    10120, 3980, 7600, 9870, 5540, 12050, 8900,
    6230, 7410, 10800, 4560, 9120, 11340,
    6890, 8070, 5300, 9650, 7230, 10450,
    4120, 8800, 11900, 7560,
  ];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    data.push({ date: label, steps: rawSteps[29 - i] });
  }

  return data;
}

// 8 weeks of workout session counts (0–6 per week)
function generateWorkoutsData() {
  const today = new Date();
  const data = [];

  const rawCounts = [3, 5, 2, 4, 6, 3, 5, 4];

  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - i * 7);
    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    data.push({ week: label, count: rawCounts[7 - i] });
  }

  return data;
}

export const stepsData = generateStepsData();
export const workoutsData = generateWorkoutsData();
