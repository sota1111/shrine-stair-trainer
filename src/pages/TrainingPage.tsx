import React, { useState } from 'react';
import type { WeatherCondition, RoadCondition } from '../types';
import TimerPanel from '../components/TimerPanel';
import RecordPanel from '../components/RecordPanel';
import { useI18n } from '../i18n/useI18n';

type TrainingTab = 'timer' | 'manual';

const TrainingPage: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TrainingTab>('timer');

  // 天気 / 路面状態 are shared across both tabs so switching keeps the chosen condition.
  const [weather, setWeather] = useState<WeatherCondition>('sunny');
  const [roadCondition, setRoadCondition] = useState<RoadCondition>('dry');

  return (
    <div className="training-page container">
      <div className="training-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          data-testid="tab-timer"
          aria-selected={activeTab === 'timer'}
          className={`training-tab ${activeTab === 'timer' ? 'active' : ''}`}
          onClick={() => setActiveTab('timer')}
        >
          {t('training.timer')}
        </button>
        <button
          type="button"
          role="tab"
          data-testid="tab-manual"
          aria-selected={activeTab === 'manual'}
          className={`training-tab ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          {t('training.manual')}
        </button>
      </div>

      {activeTab === 'timer' ? (
        <TimerPanel
          weather={weather}
          setWeather={setWeather}
          roadCondition={roadCondition}
          setRoadCondition={setRoadCondition}
        />
      ) : (
        <RecordPanel
          weather={weather}
          setWeather={setWeather}
          roadCondition={roadCondition}
          setRoadCondition={setRoadCondition}
        />
      )}
    </div>
  );
};

export default TrainingPage;
