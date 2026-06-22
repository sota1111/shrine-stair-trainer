import type { TrainingRecord, ExerciseType, WeatherCondition, RoadCondition, ExerciseEntry } from '../types';

/**
 * Generate 28 days of placeholder training records ending at `anchor` (inclusive
 * range anchor-28 … anchor-1 day). `idOffset` keeps the `sample-` ids unique
 * across multiple month blocks so they never collide in the merged display.
 * Returned newest-first.
 */
const generateMonthBlock = (anchor: Date, idOffset: number): TrainingRecord[] => {
  const records: TrainingRecord[] = [];
  const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];

  for (let i = 28; i >= 1; i--) {
    const date = new Date(anchor);
    date.setDate(anchor.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = dayLabels[date.getDay()];

    let weather: WeatherCondition = 'sunny';
    let roadCondition: RoadCondition = 'dry';

    // Some rainy days
    if (i % 7 === 3 || i % 10 === 0) {
      weather = i % 2 === 0 ? 'rainy' : 'light-rain';
      roadCondition = i % 3 === 0 ? 'slippery' : 'wet';
    } else if (i % 5 === 0) {
      weather = 'cloudy';
    }

    const exercises: ExerciseEntry[] = [];
    const isRainy = weather === 'rainy' || weather === 'light-rain' || roadCondition !== 'dry';

    if (dayOfWeek === '日') {
      exercises.push({ type: '休養', sets: [] });
    } else if (dayOfWeek === '土') {
      exercises.push({
        type: '屋内ジャンプ',
        sets: [{ setNumber: 1, timeSeconds: 30 }, { setNumber: 2, timeSeconds: 30 }, { setNumber: 3, timeSeconds: 30 }]
      });
    } else if (isRainy) {
      exercises.push({
        type: '一段ずつ',
        sets: [{ setNumber: 1, timeSeconds: 45 }, { setNumber: 2, timeSeconds: 42 }]
      });
    } else {
      // Improve times over 4 weeks (i goes from 28 to 1)
      // i=28 -> base 35s, i=1 -> base 26s
      const baseTime = 26 + (i / 28) * 9;
      const type: ExerciseType = (dayOfWeek === '水') ? '二段飛ばし' : '70段ダッシュ';

      exercises.push({
        type,
        sets: [
          { setNumber: 1, timeSeconds: parseFloat((baseTime + Math.random() * 2).toFixed(1)) },
          { setNumber: 2, timeSeconds: parseFloat((baseTime - 1 + Math.random() * 2).toFixed(1)) },
          { setNumber: 3, timeSeconds: parseFloat((baseTime - 0.5 + Math.random() * 2).toFixed(1)) }
        ]
      });
    }

    records.push({
      id: `sample-${idOffset + i}`,
      date: dateStr,
      dayOfWeek,
      weather,
      roadCondition,
      exercises,
      perceivedExertion: Math.floor(Math.random() * 5) + (isRainy ? 3 : 5),
      fatigue: Math.floor(Math.random() * 6) + 2,
      hasPain: i === 15 || i === 14, // Some pain days
      memo: i === 15 ? '左膝に違和感' : i === 1 ? '調子が良い' : '',
      createdAt: date.toISOString()
    });
  }

  return records.reverse(); // Newest first
};

const generateSampleData = (): TrainingRecord[] => {
  // Two anchored month blocks so reviewers have placeholder data spanning both
  // May and June 2026. Each block produces 28 days ending the day before its
  // anchor: May 2026 (anchor 2026-05-31, ids sample-1…sample-28) and June 2026
  // (anchor 2026-06-30, ids sample-101…sample-128). June (newer) is listed first.
  const may = generateMonthBlock(new Date('2026-05-31'), 0);
  const june = generateMonthBlock(new Date('2026-06-30'), 100);
  return [...june, ...may]; // Newest first across both months
};

export const sampleData = generateSampleData();
