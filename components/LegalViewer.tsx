import React, { useState } from 'react';
import { X } from 'lucide-react';
import { LEGAL_DOCS, LEGAL_TITLES, LegalDocId, LegalLang, MdInline, defaultLegalLang, parseMarkdown } from '../services/legal';

const Inline: React.FC<{ parts: MdInline[] }> = ({ parts }) => (
  <>
    {parts.map((p, i) =>
      p.t === 'b' ? <b key={i} className="text-slate-800">{p.v}</b> : p.t === 'i' ? <i key={i}>{p.v}</i> : <React.Fragment key={i}>{p.v}</React.Fragment>
    )}
  </>
);

export const LegalText: React.FC<{ doc: LegalDocId; lang: LegalLang }> = ({ doc, lang }) => (
  <div className="space-y-3">
    {parseMarkdown(LEGAL_DOCS[doc][lang]).map((b, i) => {
      if (b.t === 'h1') return <h1 key={i} className="text-xl font-black text-slate-800">{<Inline parts={b.inline} />}</h1>;
      if (b.t === 'h2') return <h2 key={i} className="text-sm font-black text-slate-800 pt-3">{<Inline parts={b.inline} />}</h2>;
      if (b.t === 'ul')
        return (
          <ul key={i} className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 leading-relaxed">
            {b.items.map((it, j) => <li key={j}><Inline parts={it} /></li>)}
          </ul>
        );
      return <p key={i} className="text-xs text-slate-600 leading-relaxed"><Inline parts={b.inline} /></p>;
    })}
  </div>
);

interface Props {
  doc: LegalDocId;
  onClose: () => void;
}

const LegalViewer: React.FC<Props> = ({ doc, onClose }) => {
  const [lang, setLang] = useState<LegalLang>(defaultLegalLang());
  return (
    <div className="fixed inset-0 z-[400] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={LEGAL_TITLES[doc][lang]}>
      <div className="bg-white w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-[32px] sm:rounded-[32px] shadow-2xl">
        <div className="flex items-center justify-between gap-2 p-4 border-b border-slate-100">
          <div className="flex gap-1">
            {(['es', 'en'] as LegalLang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase ${lang === l ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                {l === 'es' ? 'Español' : 'English'}
              </button>
            ))}
          </div>
          <button onClick={onClose} aria-label={lang === 'es' ? 'Cerrar' : 'Close'} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto p-5 pb-8">
          <LegalText doc={doc} lang={lang} />
        </div>
      </div>
    </div>
  );
};

export default LegalViewer;
