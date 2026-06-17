import type { TrainingRecord } from '../types';

/**
 * IndexedDB-backed queue of training-record writes that could not be sent to
 * the server (e.g. while offline). Records are keyed by their client-generated
 * `id`, so re-enqueuing the same record simply overwrites the pending entry and
 * replaying the queue is idempotent (last-write-wins per id) — this is the
 * "単純なマージ方針" required by SOT-759.
 */

const DB_NAME = 'shrine-stair-trainer-offline';
const DB_VERSION = 1;
const STORE = 'pending-records';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

/** Add or replace a pending record write. */
export async function enqueue(record: TrainingRecord): Promise<void> {
  await tx('readwrite', (store) => store.put(record));
}

/** Return all pending record writes. */
export async function getAll(): Promise<TrainingRecord[]> {
  return tx<TrainingRecord[]>('readonly', (store) => store.getAll());
}

/** Remove a pending record write once it has been synced. */
export async function remove(id: string): Promise<void> {
  await tx('readwrite', (store) => store.delete(id));
}

/** Number of records still waiting to sync. */
export async function count(): Promise<number> {
  try {
    return await tx<number>('readonly', (store) => store.count());
  } catch {
    return 0;
  }
}
