import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface SecretInputProps {
  value: string;
  onChange: (v: string) => void;
  label: string;
  /** true = contraseña con letras; false = PIN numérico (teclado de números). */
  passphrase?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  placeholder?: string;
}

const SecretInput: React.FC<SecretInputProps> = ({
  value,
  onChange,
  label,
  passphrase = false,
  autoFocus,
  autoComplete = 'off',
  placeholder,
}) => {
  const [show, setShow] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // En modo PIN solo se aceptan dígitos.
    onChange(passphrase ? v : v.replace(/\D/g, ''));
  };

  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          inputMode={passphrase ? 'text' : 'numeric'}
          pattern={passphrase ? undefined : '[0-9]*'}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          onChange={handle}
          className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-400 outline-none rounded-2xl px-4 py-3.5 pr-12 text-lg font-bold tracking-widest text-slate-700 transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-slate-500"
          aria-label={show ? 'Ocultar' : 'Mostrar'}
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </label>
  );
};

export default SecretInput;
