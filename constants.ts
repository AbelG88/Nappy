import { Goal, Sex, TellsNeed } from './types';

/** Máxima edad aceptada al cargar una fecha de nacimiento. */
export const MAX_AGE_YEARS = 18;

const pad = (n: number) => String(n).padStart(2, '0');

/** Hoy como "YYYY-MM-DD" en hora local (para el máximo del selector de fecha). */
export const todayISO = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

/** Edad en meses cumplidos a partir de "YYYY-MM-DD", o null si la fecha no es válida o es futura. */
export const ageInMonths = (iso: string, now: Date = new Date()): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const check = new Date(y, mo - 1, d);
  if (check.getFullYear() !== y || check.getMonth() !== mo - 1 || check.getDate() !== d) return null;
  let months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - mo);
  if (now.getDate() < d) months -= 1;
  return months < 0 ? null : months;
};

export const isValidBirthDate = (iso: string, now: Date = new Date()): boolean => {
  const months = ageInMonths(iso, now);
  return months !== null && months <= MAX_AGE_YEARS * 12;
};

/** Edad actual del perfil: se calcula con la fecha de nacimiento; los perfiles viejos usan la edad que tenían guardada. */
export const profileAgeMonths = (p: { ageMonths: number; birthDate?: string }, now: Date = new Date()): number => {
  if (p.birthDate) {
    const m = ageInMonths(p.birthDate, now);
    if (m !== null) return m;
  }
  return p.ageMonths;
};

export const formatAge = (months: number): string => {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return months === 1 ? '1 mes' : `${months} meses`;
  const y = years === 1 ? '1 año' : `${years} años`;
  return rest === 0 ? y : `${y} y ${rest} ${rest === 1 ? 'mes' : 'meses'}`;
};

export const SEX_OPTIONS: { value: Exclude<Sex, 'unknown'>; label: string; emoji: string }[] = [
  { value: 'girl', label: 'Nena', emoji: '👧' },
  { value: 'boy', label: 'Nene', emoji: '👦' },
];

export const GOAL_OPTIONS: { value: Goal; label: string; emoji: string }[] = [
  { value: 'pee', label: 'Pis', emoji: '💧' },
  { value: 'poop', label: 'Caca', emoji: '💩' },
  { value: 'both', label: 'Ambos', emoji: '✨' },
];

export const TELLS_OPTIONS: { value: TellsNeed; label: string }[] = [
  { value: 'yes', label: 'Sí' },
  { value: 'sometimes', label: 'A veces' },
  { value: 'no', label: 'Todavía no' },
];

export const CAREGIVER_PRESETS: { role: string; emoji: string }[] = [
  { role: 'Papá', emoji: '👨' },
  { role: 'Mamá', emoji: '👩' },
  { role: 'Abuela', emoji: '👵' },
  { role: 'Abuelo', emoji: '👴' },
  { role: 'Otro', emoji: '🧑' },
];

export const avatarEmoji = (sex: Sex): string =>
  sex === 'girl' ? '👧' : sex === 'boy' ? '👦' : '👶';

export const avatarBg = (sex: Sex): string =>
  sex === 'girl' ? 'bg-pink-100' : sex === 'boy' ? 'bg-sky-100' : 'bg-amber-100';

/** Versión visible en Ajustes y en los mensajes de contacto. */
export const APP_VERSION = '1.2.0';
