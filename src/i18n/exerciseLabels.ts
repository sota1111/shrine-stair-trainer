import type { ExerciseType, WeatherCondition, RoadCondition } from '../types';
import type { Lang } from './messages';

// Display-only translations. The underlying ExerciseType / WeatherCondition /
// RoadCondition values are the stored data, filter values, and chart dataKeys —
// they MUST stay as-is. Only the visible label is localized here.

const EXERCISE_LABELS: Record<Lang, Record<ExerciseType, string>> = {
  ja: {
    '70段ダッシュ': '70段ダッシュ',
    '一段ずつ': '一段ずつ',
    '一段飛ばし': '一段飛ばし',
    '二段飛ばし': '二段飛ばし',
    '軽め': '軽め',
    '屋内ジャンプ': '屋内ジャンプ',
    '休養': '休養',
  },
  en: {
    '70段ダッシュ': '70-step dash',
    '一段ずつ': 'Step by step',
    '一段飛ばし': 'Skip one step',
    '二段飛ばし': 'Skip two steps',
    '軽め': 'Light',
    '屋内ジャンプ': 'Indoor jump',
    '休養': 'Rest',
  },
};

export function exerciseLabel(type: ExerciseType, lang: Lang): string {
  return EXERCISE_LABELS[lang][type] ?? type;
}

// Locale-aware list separator and exercise list join.
export function listSeparator(lang: Lang): string {
  return lang === 'ja' ? '、' : ', ';
}

export function joinExercises(types: ExerciseType[], lang: Lang): string {
  return types.map((t) => exerciseLabel(t, lang)).join(listSeparator(lang));
}

const WEATHER_LABELS: Record<Lang, Record<WeatherCondition, string>> = {
  ja: {
    sunny: '☀️ 晴',
    cloudy: '☁️ 曇',
    rainy: '🌧️ 雨',
    'light-rain': '🌦️ 小雨',
  },
  en: {
    sunny: '☀️ Sunny',
    cloudy: '☁️ Cloudy',
    rainy: '🌧️ Rain',
    'light-rain': '🌦️ Light rain',
  },
};

export function weatherLabel(w: WeatherCondition, lang: Lang): string {
  return WEATHER_LABELS[lang][w] ?? w;
}

const ROAD_LABELS: Record<Lang, Record<RoadCondition, string>> = {
  ja: {
    dry: '🟢 乾燥',
    wet: '🔵 湿潤',
    rainy: '💧 雨',
    slippery: '⚠️ 滑る',
  },
  en: {
    dry: '🟢 Dry',
    wet: '🔵 Wet',
    rainy: '💧 Rainy',
    slippery: '⚠️ Slippery',
  },
};

export function roadLabel(r: RoadCondition, lang: Lang): string {
  return ROAD_LABELS[lang][r] ?? r;
}

// Weekday code used by the weekly menu table. Stored as the JP single char so
// existing data/logic is untouched; only the displayed long form is localized.
const WEEKDAY_LONG: Record<Lang, Record<string, string>> = {
  ja: {
    月: '月曜日',
    火: '火曜日',
    水: '水曜日',
    木: '木曜日',
    金: '金曜日',
    土: '土曜日',
    日: '日曜日',
  },
  en: {
    月: 'Monday',
    火: 'Tuesday',
    水: 'Wednesday',
    木: 'Thursday',
    金: 'Friday',
    土: 'Saturday',
    日: 'Sunday',
  },
};

export function weekdayLong(dayCode: string, lang: Lang): string {
  return WEEKDAY_LONG[lang][dayCode] ?? dayCode;
}
