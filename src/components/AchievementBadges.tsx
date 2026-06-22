import React, { useMemo } from 'react';
import { getAchievements, type AchievementBadge } from '../utils/achievements';
import { useI18n } from '../i18n/useI18n';
import type { TrainingRecord } from '../types';

const CATEGORY_ICON: Record<AchievementBadge['category'], string> = {
  sessions: '🏃',
  streak: '🔥',
  steps: '⛩️',
};

function useBadgeLabel() {
  const { t } = useI18n();
  return (badge: AchievementBadge): string => {
    const key =
      badge.category === 'sessions'
        ? 'summary.badgeSessions'
        : badge.category === 'streak'
          ? 'summary.badgeStreak'
          : 'summary.badgeSteps';
    return t(key).replace('{n}', String(badge.threshold));
  };
}

const AchievementBadges: React.FC<{ records: TrainingRecord[] }> = ({ records }) => {
  const { t } = useI18n();
  const badges = useMemo(() => getAchievements(records), [records]);
  const badgeLabel = useBadgeLabel();

  // Always render the full badge grid (locked + unlocked) so the user can see
  // both their achievements and what to aim for next.
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div>
      <p style={{ color: 'var(--color-muted)', marginTop: 0 }}>
        {unlockedCount === 0
          ? t('summary.badgesNone')
          : t('summary.badgesUnlockedCount').replace('{n}', String(unlockedCount))}
      </p>
      <div className="badge-grid">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`achievement-badge ${badge.unlocked ? 'is-unlocked' : 'is-locked'}`}
            title={badge.unlocked ? t('summary.badgeUnlocked') : t('summary.badgeLocked')}
          >
            <span className="achievement-badge-icon" aria-hidden="true">
              {badge.unlocked ? CATEGORY_ICON[badge.category] : '🔒'}
            </span>
            <span className="achievement-badge-label">{badgeLabel(badge)}</span>
            <span className="achievement-badge-status">
              {badge.unlocked
                ? t('summary.badgeUnlocked')
                : `${badge.current} / ${badge.threshold}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementBadges;
