
import { AppData, BathroomLog, Caregiver, AppSettings, LogType } from '../types';

const STORAGE_KEY = 'potty_tracker_v1';

const DEFAULT_SETTINGS: AppSettings = {
  reminderIntervalMinutes: 120,
  remindersEnabled: false,
  lastDonationPrompt: Date.now(),
  childName: 'Mi Peque',
  lastReminderSentAt: 0
};

const DEFAULT_DATA: AppData = {
  logs: [],
  caregivers: [{ id: '1', name: 'Mamá/Papá', role: 'Principal' }],
  settings: DEFAULT_SETTINGS
};

export const storageService = {
  saveData: (data: AppData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  loadData: (): AppData => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_DATA;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_DATA,
        ...parsed,
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings }
      };
    } catch (e) {
      return DEFAULT_DATA;
    }
  },

  exportData: (data: AppData) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `potty_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData: async (file: File): Promise<AppData | null> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as AppData;
      if (data.logs && data.caregivers && data.settings) {
        return data;
      }
      return null;
    } catch (e) {
      console.error("Import failed", e);
      return null;
    }
  }
};
