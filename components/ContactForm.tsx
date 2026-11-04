import React, { useState } from 'react';
import { Check, Copy, Mail } from 'lucide-react';
import { APP_VERSION } from '../constants';
import {
  CONTACT_EMAIL,
  CONTACT_KINDS,
  CONTACT_MAX_CHARS,
  ContactKind,
  buildContactMailto,
  contactEnabled,
} from '../services/contact';

const ContactForm: React.FC = () => {
  const [kind, setKind] = useState<ContactKind>('idea');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [opened, setOpened] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!contactEnabled()) return null;

  const current = CONTACT_KINDS.find(k => k.value === kind)!;
  const ready = message.trim().length >= 10;

  const send = () => {
    const a = document.createElement('a');
    a.href = buildContactMailto({ kind, message, phone }, APP_VERSION);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setOpened(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Para: ${CONTACT_EMAIL}\n\n${message.trim()}${phone.trim() ? `\n\nTambién me pueden escribir a: ${phone.trim()}` : ''}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* sin portapapeles */
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <Mail size={18} className="text-blue-500" /> Contacto
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed">
        ¿Una idea, un problema, o querés una app propia o con funciones a elección? Escribime. Se abre tu correo con el mensaje ya armado; Nappy no envía nada por su cuenta y no adjunta datos de tus peques.
      </p>

      <div className="flex flex-wrap gap-2">
        {CONTACT_KINDS.map(k => (
          <button
            key={k.value}
            onClick={() => { setKind(k.value); setOpened(false); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left ${
              kind === k.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <label className="block space-y-1.5">
        <textarea
          value={message}
          onChange={e => { setMessage(e.target.value.slice(0, CONTACT_MAX_CHARS)); setOpened(false); }}
          rows={5}
          placeholder={current.hint}
          className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-400 outline-none rounded-2xl px-4 py-3 text-sm text-slate-700 transition-colors resize-none"
        />
        <span className="block text-right text-[10px] text-slate-300">{message.length}/{CONTACT_MAX_CHARS}</span>
      </label>

      <label className="block space-y-1.5">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp (opcional)</span>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={e => setPhone(e.target.value.slice(0, 40))}
          placeholder="Si preferís que te escriba por ahí"
          className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-400 outline-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition-colors"
        />
      </label>

      <button
        onClick={send}
        disabled={!ready}
        className="w-full bg-blue-600 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl text-sm shadow-md shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Mail size={18} /> Abrir en mi correo
      </button>

      {opened && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Se abrió tu correo con el mensaje. Tocá <b>Enviar</b> ahí para que me llegue. ¿No se abrió nada? Copialo y mandalo a <b>{CONTACT_EMAIL}</b>.
          </p>
          <button
            onClick={copy}
            className="text-[11px] font-bold text-blue-600 flex items-center gap-1.5"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar mensaje'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactForm;
