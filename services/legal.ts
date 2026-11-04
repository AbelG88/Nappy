import termsEs from '../legal/terms.es.md?raw';
import termsEn from '../legal/terms.en.md?raw';
import privacyEs from '../legal/privacy.es.md?raw';
import privacyEn from '../legal/privacy.en.md?raw';
import medicalEs from '../legal/medical.es.md?raw';
import medicalEn from '../legal/medical.en.md?raw';

/** Versión de los textos legales. Si cambia, se vuelve a pedir la aceptación. */
export const LEGAL_VERSION = '1.0';

export type LegalDocId = 'terms' | 'privacy' | 'medical';
export type LegalLang = 'es' | 'en';

export const LEGAL_DOCS: Record<LegalDocId, Record<LegalLang, string>> = {
  terms: { es: termsEs, en: termsEn },
  privacy: { es: privacyEs, en: privacyEn },
  medical: { es: medicalEs, en: medicalEn },
};

export const LEGAL_TITLES: Record<LegalDocId, Record<LegalLang, string>> = {
  terms: { es: 'Términos y Condiciones', en: 'Terms and Conditions' },
  privacy: { es: 'Política de Privacidad', en: 'Privacy Policy' },
  medical: { es: 'Aviso médico', en: 'Medical notice' },
};

export function defaultLegalLang(): LegalLang {
  const l = typeof navigator !== 'undefined' ? (navigator.language || '') : '';
  return l.toLowerCase().startsWith('en') ? 'en' : 'es';
}

/** ¿Hay que pedir (de nuevo) la aceptación? */
export function needsLegalAcceptance(accepted?: string): boolean {
  return accepted !== LEGAL_VERSION;
}

// --- Markdown mínimo (títulos, listas, negrita, cursiva, párrafos) ---

export type MdInline = { t: 'text' | 'b' | 'i'; v: string };
export type MdBlock =
  | { t: 'h1' | 'h2' | 'p'; inline: MdInline[] }
  | { t: 'ul'; items: MdInline[][] };

export function parseInline(s: string): MdInline[] {
  const out: MdInline[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: 'text', v: s.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: 'b', v: m[1] });
    else out.push({ t: 'i', v: m[2] });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: 'text', v: s.slice(last) });
  return out;
}

export function parseMarkdown(src: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  let list: MdInline[][] | null = null;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) blocks.push({ t: 'p', inline: parseInline(para.join(' ')) });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push({ t: 'ul', items: list });
    list = null;
  };
  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }
    if (line.startsWith('## ')) { flushPara(); flushList(); blocks.push({ t: 'h2', inline: parseInline(line.slice(3)) }); continue; }
    if (line.startsWith('# ')) { flushPara(); flushList(); blocks.push({ t: 'h1', inline: parseInline(line.slice(2)) }); continue; }
    if (line.startsWith('- ')) { flushPara(); (list ??= []).push(parseInline(line.slice(2))); continue; }
    flushList();
    para.push(line);
  }
  flushPara(); flushList();
  return blocks;
}
