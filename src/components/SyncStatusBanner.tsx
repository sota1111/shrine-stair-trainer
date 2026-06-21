import { useTrainingRecords } from '../hooks/useTrainingRecords';
import { useI18n } from '../i18n/useI18n';

/**
 * Minimal connectivity / sync indicator. Shown only when the app is offline or
 * there are records still waiting to sync, so it stays out of the way during
 * normal online use.
 */
export default function SyncStatusBanner() {
  const { isOnline, pendingSyncCount } = useTrainingRecords();
  const { t } = useI18n();

  if (isOnline && pendingSyncCount === 0) return null;

  const message = !isOnline
    ? pendingSyncCount > 0
      ? t('sync.offlinePending').replace('{n}', String(pendingSyncCount))
      : t('sync.offline')
    : t('sync.syncing').replace('{n}', String(pendingSyncCount));

  return (
    <div
      className={`sync-banner ${isOnline ? 'sync-banner--syncing' : 'sync-banner--offline'}`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? '🔄' : '📴'} {message}
    </div>
  );
}
