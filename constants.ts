import { Goal, Sex, TellsNeed } from './types';

export const AGE_OPTIONS: { months: number; label: string }[] = [
  { months: 18, label: '1½ años' },
  { months: 24, label: '2 años' },
  { months: 30, label: '2½ años' },
  { months: 36, label: '3 años' },
  { months: 42, label: '3½ años' },
  { months: 48, label: '4 o más' },
];

export const formatAge = (months: number): string => {
  const exact = AGE_OPTIONS.find(o => o.months === months);
  if (exact) return exact.label;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${months} meses`;
  return rest === 0 ? `${years} años` : `${years} años y ${rest} m`;
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
  { role: 'Niñera', emoji: '🧑‍🍼' },
];

export const avatarEmoji = (sex: Sex): string =>
  sex === 'girl' ? '👧' : sex === 'boy' ? '👦' : '👶';

export const avatarBg = (sex: Sex): string =>
  sex === 'girl' ? 'bg-pink-100' : sex === 'boy' ? 'bg-sky-100' : 'bg-amber-100';
