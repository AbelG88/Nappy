export enum LogType {
  PEE = 'Pee',
  POOP = 'Poop',
  BOTH = 'Both'
}

export type Sex = 'girl' | 'boy' | 'unknown';
export type Goal = 'pee' | 'poop' | 'both';
export type TellsNeed = 'yes' | 'sometimes' | 'no';
export type Initiative = 'asked' | 'taken';

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
  reminderIntervalMinutes: number;
  remindersEnabled: boolean;
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
