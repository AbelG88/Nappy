export enum LogType {
  PEE = 'Pee',
  POOP = 'Poop',
  BOTH = 'Both'
}

export type Sex = 'girl' | 'boy' | 'unknown';
export type Goal = 'pee' | 'poop' | 'both';
export type TellsNeed = 'yes' | 'sometimes' | 'no';
export type Initiative = 'asked' | 'taken';

export type ReminderFormat = 'events' | 'interval';

export interface ReminderEvent {
  id: string;
  /** Ej: "Después del almuerzo". */
  label: string;
  /** Hora del aviso, "HH:MM" (24 h). */
  time: string;
  enabled: boolean;
  /** Horario agregado a mano (se puede borrar). */
  custom?: boolean;
}

export interface Reminders {
  enabled: boolean;
  /** Por horarios (después de cada evento del día) o cada cierto tiempo. */
  format: ReminderFormat;
  intervalMinutes: number;
  events: ReminderEvent[];
  /** Último día en que ya se avisó cada horario ("YYYY-MM-DD"), para no repetir. */
  firedOn: Record<string, string>;
}

export interface Profile {
  id: string;
  name: string;
  sex: Sex;
  /** Edad en meses (18 = 1 año y medio). */
  ageMonths: number;
  /** Qué se está entrenando: pis, caca o ambos. */
  goal: Goal;
  /** true si todavía usa pañal para dormir. */
  nightDiaper: boolean;
  /** Si avisa cuando tiene ganas. */
  tellsNeed: TellsNeed;
  createdAt: number;
  lastReminderSentAt: number;
  reminders: Reminders;
}

export interface BathroomLog {
  id: string;
  profileId: string;
  timestamp: number;
  type: LogType;
  success: boolean;
  /** Se hizo encima (cuenta como no logrado). */
  accident?: boolean;
  /** Avisó solo o lo llevamos nosotros. */
  initiative?: Initiative;
  notes: string;
  caregiverId: string;
}

export interface Caregiver {
  id: string;
  name: string;
  role: string;
}

export interface AppSettings {
  lastDonationPrompt: number;
  /** Último cuidador elegido al registrar, para preseleccionarlo. */
  lastCaregiverId?: string;
}

export interface AppData {
  version: 2;
  profiles: Profile[];
  activeProfileId: string | null;
  logs: BathroomLog[];
  caregivers: Caregiver[];
  settings: AppSettings;
}
