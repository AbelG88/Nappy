
export enum LogType {
  PEE = 'Pee',
  POOP = 'Poop',
  BOTH = 'Both'
}

export interface BathroomLog {
  id: string;
  timestamp: number;
  type: LogType;
  success: boolean;
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
  childName: string;
  lastReminderSentAt: number;
  onboardingCompleted: boolean;
}

export interface AppData {
  logs: BathroomLog[];
  caregivers: Caregiver[];
  settings: AppSettings;
}