import { AppSettings } from '../types';

export interface DonationLink {
  id: 'mercadopago' | 'cafecito' | 'paypal' | 'buymeacoffee';
  label: string;
  url: string;
  /** Desde dónde conviene usarlo. */
  group: 'ar' | 'intl';
}

/** Única lista de links de apoyo: la usan la ventana emergente y Ajustes. */
export const DONATION_LINKS: DonationLink[] = [
  { id: 'mercadopago', label: 'Mercado Pago', url: 'https://link.mercadopago.com.ar/abelg88', group: 'ar' },
  { id: 'cafecito', label: 'Cafecito', url: 'https://cafecito.app/abelg88', group: 'ar' },
  { id: 'paypal', label: 'PayPal', url: 'https://paypal.me/AbelG88', group: 'intl' },
  { id: 'buymeacoffee', label: 'Buy Me a Coffee', url: 'https://buymeacoffee.com/abelg88', group: 'intl' },
];

/** Cada cuántos registros nuevos se puede mostrar el pedido de apoyo. */
export const DONATION_EVERY_LOGS = 10;
/** Cada cuántos ingresos a la app se puede mostrar. */
export const DONATION_EVERY_OPENS = 15;
/** Para el aviso por ingresos, la persona tiene que haber usado la app de verdad. */
export const DONATION_MIN_LOGS_FOR_OPENS = 5;
/** Nunca dos pedidos con menos de esta separación. */
export const DONATION_COOLDOWN_DAYS = 7;
/** Si dice "ya doné", se la deja tranquila este tiempo. */
export const DONATION_DONATED_QUIET_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

export type DonationReason = 'logs' | 'opens';

/** ¿Se pueden mostrar avisos de apoyo ahora (sin contar los contadores)? */
const allowed = (s: AppSettings, now: number): boolean => {
  if (s.donationQuietUntil && now < s.donationQuietUntil) return false;
  // lastDonationPrompt arranca con la fecha de instalación, así que también da un respiro inicial.
  return now - (s.lastDonationPrompt ?? 0) >= DONATION_COOLDOWN_DAYS * DAY_MS;
};

/**
 * Decide si toca mostrar el pedido de apoyo.
 * Por registros: pasaron DONATION_EVERY_LOGS registros desde el último pedido.
 * Por ingresos: pasaron DONATION_EVERY_OPENS ingresos y la persona ya cargó algunos registros.
 */
export const donationReason = (s: AppSettings, totalLogs: number, now: number): DonationReason | null => {
  if (!allowed(s, now)) return null;
  if (totalLogs - (s.donationLogsAtPrompt ?? 0) >= DONATION_EVERY_LOGS) return 'logs';
  if ((s.donationOpens ?? 0) >= DONATION_EVERY_OPENS && totalLogs >= DONATION_MIN_LOGS_FOR_OPENS) return 'opens';
  return null;
};

/** Cambios de ajustes al mostrar el pedido: reinicia los contadores. */
export const onDonationShown = (s: AppSettings, totalLogs: number, now: number): AppSettings => ({
  ...s,
  lastDonationPrompt: now,
  donationOpens: 0,
  donationLogsAtPrompt: totalLogs,
});

export const onDonated = (s: AppSettings, now: number): AppSettings => ({
  ...s,
  donationQuietUntil: now + DONATION_DONATED_QUIET_DAYS * DAY_MS,
});
