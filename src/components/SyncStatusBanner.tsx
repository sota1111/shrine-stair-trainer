import { useTrainingRecords } from '../hooks/useTrainingRecords';

/**
 * Minimal connectivity / sync indicator. Shown only when the app is offline or
 * there are records still waiting to sync, so it stays out of the way during
 * normal online use.
 */
export default function SyncStatusBanner() {
  const { isOnline, pendingSyncCount } = useTrainingRecords();

  if (isOnline && pendingSyncCount === 0) return null;

  const message = !isOnline
    ? pendingSyncCount > 0
      ? `オフライン中 — 未同期の記録 ${pendingSyncCount} 件は復帰時に同期されます`
      : 'オフライン中 — 記録はこの端末に保存され、復帰時に同期されます'
    : `未同期の記録を同期中… 残り ${pendingSyncCount} 件`;

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
