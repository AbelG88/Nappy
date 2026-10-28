import { AppData, AppSettings, BathroomLog, Caregiver, Profile } from '../types';

const STORAGE_KEY = 'potty_tracker_v2';
const LEGACY_KEY = 'potty_tracker_v1';
export const LEGACY_PROFILE_ID = 'p-legacy';

const DEFAULT_SETTINGS: AppSettings = {
  reminderIntervalMinutes: 120,
  remindersEnabled: false,
  lastDonationPrompt: Date.now(),
};

const emptyData = (): AppData => ({
  version: 2,
  profiles: [],
  activeProfileId: null,
  logs: [],
  caregivers: [],
  settings: { ...DEFAULT_SETTINGS },
});

/**
 * Convierte el formato v1 (un solo niño, onboarding simple) al formato v2 multi-perfil.
 * El id del perfil migrado es fijo para que importar dos veces el mismo respaldo no duplique.
 */
const migrateV1 = (old: any): AppData => {
  const base = emptyData();
  const oldSettings = old?.settings ?? {};
  const logsRaw: any[] = Array.isArray(old?.logs) ? old.logs : [];
  const caregivers: Caregiver[] = Array.isArray(old?.caregivers) ? old.caregivers : [];

  const hasChild = !!oldSettings.onboardingCompleted || logsRaw.length > 0;
  const profiles: Profile[] = hasChild
    ? [{
        id: LEGACY_PROFILE_ID,
        name: oldSettings.childName || 'Mi Peque',
        sex: 'unknown',
        ageMonths: 30,
        goal: 'both',
        nightDiaper: true,
        tellsNeed: 'sometimes',
        createdAt: logsRaw.length ? Math.min(...logsRaw.map(l => l.timestamp || Date.now())) : Date.now(),
        lastReminderSentAt: oldSettings.lastReminderSentAt || 0,
      }]
    : [];

  const logs: BathroomLog[] = logsRaw.map(l => ({ ...l, profileId: LEGACY_PROFILE_ID }));

  return {
    ...base,
    profiles,
    activeProfileId: profiles[0]?.id ?? null,
    logs,
    caregivers,
    settings: {
      ...DEFAULT_SETTINGS,
      reminderIntervalMinutes: oldSettings.reminderIntervalMinutes ?? DEFAULT_SETTINGS.reminderIntervalMinutes,
      remindersEnabled: !!oldSettings.remindersEnabled,
      lastDonationPrompt: oldSettings.lastDonationPrompt ?? DEFAULT_SETTINGS.lastDonationPrompt,
    },
  };
};

const normalizeV2 = (parsed: any): AppData => {
  const base = emptyData();
  const profiles: Profile[] = Array.isArray(parsed.profiles) ? parsed.profiles : [];
  const activeOk = profiles.some(p => p.id === parsed.activeProfileId);
  return {
    ...base,
    ...parsed,
    version: 2,
    profiles,
    activeProfileId: activeOk ? parsed.activeProfileId : profiles[0]?.id ?? null,
    logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    caregivers: Array.isArray(parsed.caregivers) ? parsed.caregivers : [],
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
  };
};

/** Acepta un respaldo v1 o v2 y lo devuelve como v2, o null si no es válido. */
export const parseBackup = (raw: any): AppData | null => {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.version === 2 && Array.isArray(raw.profiles) && Array.isArray(raw.logs)) {
    return normalizeV2(raw);
  }
  if (Array.isArray(raw.logs) && Array.isArray(raw.caregivers) && raw.settings) {
    return migrateV1(raw);
  }
  return null;
};

export const storageService = {
  saveData: (data: AppData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  loadData: (): AppData => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return normalizeV2(JSON.parse(saved));

      // Primera vez en v2: migrar lo que hubiera en v1 (sin borrar la copia vieja).
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) return migrateV1(JSON.parse(legacy));
    } catch (e) {
      console.error('No se pudieron leer los datos guardados', e);
    }
    return emptyData();
  },

  exportData: async (data: AppData) => {
    const filename = `nappy_backup_${Date.now()}.json`;
    const jsonString = JSON.stringify(data, null, 2);

    if (navigator.share) {
      try {
        const file = new File([jsonString], filename, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Respaldo Nappy',
            text: 'Aquí tienes mi copia de seguridad de Nappy 🚽',
          });
          return;
        }
      } catch (err) {
        console.warn('Share API falló, intentando descarga:', err);
      }
    }

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
      return parseBackup(JSON.parse(text));
    } catch (e) {
      console.error('Import failed', e);
      return null;
    }
  },
};
