import type { WeatherCondition, RoadCondition, ExerciseType } from '../types';

const DANGEROUS_EXERCISES: ExerciseType[] = ['一段飛ばし', '二段飛ばし'];
const BAD_WEATHER: WeatherCondition[] = ['rainy', 'light-rain'];
const BAD_ROAD: RoadCondition[] = ['wet', 'rainy', 'slippery'];

export function isDangerousCondition(
  weather: WeatherCondition,
  roadCondition: RoadCondition
): boolean {
  return BAD_WEATHER.includes(weather) || BAD_ROAD.includes(roadCondition);
}

export function isDangerousExercise(exercise: ExerciseType): boolean {
  return DANGEROUS_EXERCISES.includes(exercise);
}

export const ALTERNATIVE_EXERCISES: ExerciseType[] = [
  '一段ずつ',
  '軽め',
  '屋内ジャンプ',
  '休養',
];
