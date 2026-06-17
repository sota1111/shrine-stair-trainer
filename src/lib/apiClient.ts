import type { TrainingRecord } from '../types';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const apiClient = {
  async getRecords(): Promise<TrainingRecord[]> {
    const response = await fetch('/api/records', {
      credentials: 'include',
      headers: JSON_HEADERS,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch records');
    }
    return response.json();
  },

  async putRecord(record: TrainingRecord): Promise<void> {
    const response = await fetch(`/api/records/${record.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: JSON_HEADERS,
      body: JSON.stringify(record)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to save record');
    }
  },

  async batchPutRecords(records: TrainingRecord[]): Promise<void> {
    const response = await fetch('/api/records/batch', {
      method: 'POST',
      credentials: 'include',
      headers: JSON_HEADERS,
      body: JSON.stringify(records)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to batch save records');
    }
  },

  async deleteRecord(id: string): Promise<void> {
    const response = await fetch(`/api/records/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: JSON_HEADERS,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete record');
    }
  }
};
