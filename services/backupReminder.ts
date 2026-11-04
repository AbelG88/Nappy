import { AppSettings, BackupFrequency, BackupReminder } from '../types';

export const DEFAULT_BACKUP_REMINDER: BackupReminder = { enabled: true, frequency: 'weekly' };

export const BACKUP_FREQUENCIES: { value: BackupFrequency; label: string; days: number }[] = [
  { value: 'weekly', label: 'Cada semana', days: 7 },
  { value: 'biweekly', label: 'Cada 2 semanas', days: 14 },
  { value: 'monthly', label: 'Cada mes', days: 30 },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export const backupReminderOf = (settings: AppSettings): BackupReminder => ({
  ...DEFAULT_BACKUP_REMINDER,
  ...(settings.backupReminder ?? {}),
});

/** Desde cuándo se cuenta el tiempo sin backup: el último backup, o si nunca hizo, cuando aceptó el aviso inicial. */
const baseTime = (s: AppSettings): number | undefined => s.lastBackupAt ?? s.backupNoticeAckAt;

/** ¿Toca avisar del backup? */
export const backupDue = (settings: AppSettings, now: number): boolean => {
  const r = backupReminderOf(settings);
  if (!r.enabled) return false;
  const base = baseTime(settings);
  if (base === undefined) return false; // todavía no pasó por el aviso inicial
  if (settings.backupSnoozedUntil && now < settings.backupSnoozedUntil) return false;
  const days = BACKUP_FREQUENCIES.find(f => f.value === r.frequency)?.days ?? 7;
  return now - base >= days * DAY_MS;
};

/** Días desde el último backup (o desde el aviso inicial); null si no hay punto de partida. */
export const daysSinceBackup = (settings: AppSettings, now: number): number | null => {
  const base = baseTime(settings);
  return base === undefined ? null : Math.floor((now - base) / DAY_MS);
};

export const snoozeUntilTomorrow = (now: number): number => now + DAY_MS;

export const isValidEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Abre el programa de correo con el asunto armado (el adjunto lo agrega la persona). */
export const backupMailto = (email: string): string => {
  const subject = encodeURIComponent('Backup de Nappy');
  const body = encodeURIComponent('Adjuntá acá el archivo .nappy que se acaba de generar.');
  return `mailto:${encodeURIComponent(email.trim())}?subject=${subject}&body=${body}`;
};
