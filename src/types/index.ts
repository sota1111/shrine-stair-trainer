export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'light-rain';
export type RoadCondition = 'dry' | 'wet' | 'rainy' | 'slippery';
export type ExerciseType =
  | '70段ダッシュ'
  | '一段ずつ'
  | '一段飛ばし'
  | '二段飛ばし'
  | '軽め'
  | '屋内ジャンプ'
  | '休養';

export interface SetRecord {
  setNumber: number;
  timeSeconds: number;
}

export interface ExerciseEntry {
  type: ExerciseType;
  sets: SetRecord[];
}

export interface TrainingRecord {
  id: string;
  date: string;
  dayOfWeek: string;
  weather: WeatherCondition;
  roadCondition: RoadCondition;
  exercises: ExerciseEntry[];
  perceivedExertion: number;
  fatigue: number;
  hasPain: boolean;
  memo: string;
  createdAt: string;
  /** Time-of-day (HH:MM, JST) the record/measurement was made. Optional for legacy records. */
  time?: string;
}
