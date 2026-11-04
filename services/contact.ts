/**
 * Contacto por correo: Nappy no envía nada por su cuenta. Arma el mensaje y lo abre en el programa
 * de correo de la persona, dirigido al desarrollador. Si CONTACT_EMAIL está vacío, la sección se oculta.
 */
export const CONTACT_EMAIL = 'abel.edgardo.garcia.88@gmail.com';

export type ContactKind = 'idea' | 'custom' | 'problem' | 'other';

export const CONTACT_KINDS: { value: ContactKind; label: string; subject: string; hint: string }[] = [
  { value: 'idea', label: 'Sugerencia o mejora', subject: 'Sugerencia', hint: 'Contame qué te gustaría que Nappy haga o haga mejor.' },
  { value: 'custom', label: 'App a medida o con funciones a elección', subject: 'App a medida', hint: 'Contame qué necesitás: para quién es, qué funciones querés y para cuándo.' },
  { value: 'problem', label: 'Algo no funciona', subject: 'Problema', hint: 'Qué estabas haciendo, qué pasó y qué esperabas que pasara.' },
  { value: 'other', label: 'Otro tema', subject: 'Consulta', hint: 'Escribí lo que quieras.' },
];

/** Los mails muy largos pueden cortarse al abrir el programa de correo. */
export const CONTACT_MAX_CHARS = 1500;

export const contactEnabled = (): boolean => CONTACT_EMAIL.trim().length > 0;

export interface ContactDraft {
  kind: ContactKind;
  message: string;
  /** WhatsApp u otro medio, opcional (el correo ya permite responder). */
  phone?: string;
}

export const buildContactMailto = (draft: ContactDraft, version: string, email: string = CONTACT_EMAIL): string => {
  const kind = CONTACT_KINDS.find(k => k.value === draft.kind) ?? CONTACT_KINDS[3];
  // Los saltos de línea del mensaje se pasan a \r\n, que es lo que esperan los programas de correo.
  const lines = [draft.message.trim().slice(0, CONTACT_MAX_CHARS).replace(/\r?\n/g, '\r\n')];
  const phone = draft.phone?.trim();
  if (phone) lines.push('', `También me pueden escribir a: ${phone}`);
  lines.push('', '—', `Nappy ${version}`);
  const subject = `Nappy - ${kind.subject}`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\r\n'))}`;
};
