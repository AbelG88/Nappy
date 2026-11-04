import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import SecretInput from './SecretInput';

interface PasswordPromptProps {
  title: string;
  description: string;
  /** Devuelve un mensaje de error, o null si salió bien (el diálogo lo cierra quien lo usa). */
  onSubmit: (password: string) => Promise<string | null>;
  onCancel: () => void;
}

const PasswordPrompt: React.FC<PasswordPromptProps> = ({ title, description, onSubmit, onCancel }) => {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw) return;
    setBusy(true);
    setError('');
    const problem = await onSubmit(pw);
    if (problem) {
      setError(problem);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
      <form onSubmit={submit} className="bg-white rounded-[40px] p-7 max-w-sm w-full shadow-2xl space-y-5">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-[24px] shadow-lg shadow-blue-100">
            <Lock size={30} />
          </div>
          <h3 className="text-xl font-black text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        </div>
        <SecretInput label="Contraseña" value={pw} onChange={setPw} passphrase autoFocus />
        {error && <p className="text-xs font-bold text-rose-500 text-center">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 bg-white text-slate-400 font-bold py-3.5 rounded-2xl border border-slate-200 text-sm">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy || !pw}
            className="flex-1 bg-blue-600 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-sm active:scale-95 transition-all"
          >
            {busy ? 'Abriendo…' : 'Abrir'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordPrompt;
