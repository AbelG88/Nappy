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

  exportData: async (data: AppData) => {
    const filename = `nappy_backup_${Date.now()}.json`;
    const jsonString = JSON.stringify(data, null, 2);

    // Intentar utilizar la API de Compartir Nativa (ideal para móviles y WhatsApp)
    if (navigator.share) {
      try {
        const file = new File([jsonString], filename, { type: 'application/json' });
        
        // Verificar si el navegador soporta específicamente el envío de archivos
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Respaldo Nappy',
            text: 'Aquí tienes mi copia de seguridad de Nappy 🚽',
          });
          return; // Éxito compartiendo
        }
      } catch (err) {
        // El usuario puede haber cancelado o hubo un error, se intenta el fallback
        console.warn('Share API falló o fue cancelado, intentando descarga directa:', err);
      }
    }

    // Fallback: Descarga tradicional si Share API no está disponible o falla
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData: async (file: File): Promise<AppData | null> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as AppData;
      // Validación básica de estructura
      if (data && Array.isArray(data.logs) && Array.isArray(data.caregivers) && data.settings) {
        return data;
      }
      return null;
    } catch (e) {
      console.error("Import failed", e);
      return null;
    }
  }
};
