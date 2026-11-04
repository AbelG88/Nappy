import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import LegalViewer from './LegalViewer';
import { LegalDocId } from '../services/legal';

interface Props {
  onAccept: () => void;
}

/** Pantalla de aceptación de Términos, Privacidad y Aviso médico. Bilingüe. */
const LegalGate: React.FC<Props> = ({ onAccept }) => {
  const [viewing, setViewing] = useState<LegalDocId | null>(null);
  const [terms, setTerms] = useState(false);
  const [adult, setAdult] = useState(false);

  const link = (doc: LegalDocId, label: string) => (
    <button type="button" onClick={() => setViewing(doc)} className="text-blue-600 font-bold underline">{label}</button>
  );

  return (
    <div className="fixed inset-0 z-[350] overflow-y-auto bg-blue-50">
      <div className="min-h-full flex items-center justify-center p-5">
        <div className="bg-white w-full max-w-md rounded-[32px] shadow-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center"><ShieldCheck size={24} /></div>
            <div>
              <h1 className="text-lg font-black text-slate-800 leading-tight">Antes de empezar</h1>
              <p className="text-[11px] text-slate-400 font-bold leading-tight">Before you start</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Tus datos quedan en tu dispositivo, cifrados. Nappy no es un servicio médico. Leé los textos y aceptá para continuar.
            <span className="block text-slate-400 mt-1">Your data stays on your device, encrypted. Nappy is not a medical service. Read the texts and accept to continue.</span>
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {link('terms', 'Términos / Terms')}
            {link('privacy', 'Privacidad / Privacy')}
            {link('medical', 'Aviso médico / Medical notice')}
          </div>

          <label className="flex gap-3 items-start text-xs text-slate-600 leading-relaxed cursor-pointer">
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-0.5 w-5 h-5 shrink-0 accent-blue-600" />
            <span>
              Leí y acepto los Términos, la Política de Privacidad y el Aviso médico.
              <span className="block text-slate-400">I have read and accept the Terms, Privacy Policy and Medical notice.</span>
            </span>
          </label>
          <label className="flex gap-3 items-start text-xs text-slate-600 leading-relaxed cursor-pointer">
            <input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)} className="mt-0.5 w-5 h-5 shrink-0 accent-blue-600" />
            <span>
              Soy mayor de edad y tengo derecho a cargar los datos del niño o la niña.
              <span className="block text-slate-400">I am an adult and have the right to enter the child's data.</span>
            </span>
          </label>

          <button
            disabled={!terms || !adult}
            onClick={onAccept}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg disabled:opacity-40 disabled:shadow-none active:scale-95 transition-transform"
          >
            ACEPTAR Y CONTINUAR / ACCEPT
          </button>
        </div>
      </div>
      {viewing && <LegalViewer doc={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
};

export default LegalGate;
