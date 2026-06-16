import { auth } from './firebase';
import type { TrainingRecord } from '../types';

async function getAuthHeader() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  const idToken = await user.getIdToken();
  return {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  };
}

export const apiClient = {
  async getRecords(): Promise<TrainingRecord[]> {
    const headers = await getAuthHeader();
    const response = await fetch('/api/records', { headers });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch records');
    }
    return response.json();
  },

  async putRecord(record: TrainingRecord): Promise<void> {
    const headers = await getAuthHeader();
    const response = await fetch(`/api/records/${record.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(record)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save record');
    }
  },

  async batchPutRecords(records: TrainingRecord[]): Promise<void> {
    const headers = await getAuthHeader();
    const response = await fetch('/api/records/batch', {
      method: 'POST',
      headers,
      body: JSON.stringify(records)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to batch save records');
    }
  },

  async deleteRecord(id: string): Promise<void> {
    const headers = await getAuthHeader();
    const response = await fetch(`/api/records/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete record');
    }
  }
};
