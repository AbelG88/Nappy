import { BathroomLog, Profile, ReminderEvent, Reminders } from '../types';

/** Horarios de fábrica: el aviso suena justo a la hora que se fije (pensada para después de cada evento). */
export const DEFAULT_EVENTS: ReminderEvent[] = [
  { id: 'wake', label: 'Al levantarse', time: '07:30', enabled: true },
  { id: 'breakfast', label: 'Después del desayuno', time: '09:00', enabled: true },
  { id: 'lunch', label: 'Después del almuerzo', time: '13:30', enabled: true },
  { id: 'nap', label: 'Después de la siesta', time: '16:00', enabled: true },
  { id: 'snack', label: 'Después de la merienda', time: '18:00', enabled: true },
  { id: 'dinner', label: 'Después de la cena', time: '21:00', enabled: true },
];

export const INTERVAL_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 30, label: 'Cada 30 min' },
  { minutes: 60, label: 'Cada 1 hora' },
  { minutes: 90, label: 'Cada 1½ horas' },
  { minutes: 120, label: 'Cada 2 horas' },
  { minutes: 180, label: 'Cada 3 horas' },
];

/** Cuántos minutos tarde todavía se avisa (si la app estaba cerrada a la hora, no llegan avisos viejos). */
export const GRACE_MINUTES = 10;

export const defaultReminders = (): Reminders => ({
  enabled: false,
  format: 'events',
  intervalMinutes: 120,
  events: DEFAULT_EVENTS.map(e => ({ ...e })),
  firedOn: {},
});

/**
 * Completa lo que falte de los recordatorios guardados. `legacy` son los ajustes globales
 * de versiones anteriores (un único intervalo para todos), que se llevan al perfil.
 */
export const withReminderDefaults = (
  raw?: Partial<Reminders> | null,
  legacy?: { enabled?: boolean; intervalMinutes?: number }
): Reminders => {
  const base = defaultReminders();
  if (raw && typeof raw === 'object') {
    return {
      ...base,
      ...raw,
      events: Array.isArray(raw.events) && raw.events.length ? raw.events : base.events,
      firedOn: raw.firedOn && typeof raw.firedOn === 'object' ? raw.firedOn : {},
    };
  }
  if (legacy?.enabled) {
    return { ...base, enabled: true, format: 'interval', intervalMinutes: legacy.intervalMinutes ?? base.intervalMinutes };
  }
  return base;
};

export const todayKey = (now = Date.now()): string => {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const toMinutes = (hhmm: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h > 23 || min > 59 ? null : h * 60 + min;
};

/** Horarios que corresponde avisar ahora: ya llegó la hora, no pasaron más de GRACE_MINUTES y hoy no se avisó. */
export const dueEvents = (reminders: Reminders, now = Date.now()): ReminderEvent[] => {
  if (!reminders.enabled || reminders.format !== 'events') return [];
  const d = new Date(now);
  const nowMin = d.getHours() * 60 + d.getMinutes();
  const today = todayKey(now);
  return reminders.events.filter(e => {
    if (!e.enabled || reminders.firedOn[e.id] === today) return false;
    const at = toMinutes(e.time);
    if (at === null) return false;
    const late = nowMin - at;
    return late >= 0 && late <= GRACE_MINUTES;
  });
};

/** Modo "cada tanto": toca avisar si pasó el intervalo desde el último registro o el último aviso. */
export const intervalDue = (profile: Profile, logs: BathroomLog[], now = Date.now()): boolean => {
  const r = profile.reminders;
  if (!r.enabled || r.format !== 'interval') return false;
  const lastLog = logs
    .filter(l => l.profileId === profile.id)
    .reduce((max, l) => Math.max(max, l.timestamp), 0);
  const lastEvent = Math.max(lastLog, profile.lastReminderSentAt, profile.createdAt);
  return now - lastEvent >= r.intervalMinutes * 60 * 1000;
};

export const sortEvents = (events: ReminderEvent[]): ReminderEvent[] =>
  [...events].sort((a, b) => a.time.localeCompare(b.time));
