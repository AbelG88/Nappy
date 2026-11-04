import React, { useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Lock, ShieldCheck, Upload } from 'lucide-react';
import { AppData } from '../types';
import { EncryptedBlob, WrongSecretError, validateSecret } from '../services/crypto';
import { storageService } from '../services/storage';
import { createVault, loadPlainData, removePlainData, secretIsNumeric, setSecretKind, unlockVault, wipeAll } from '../services/vault';
import SecretInput from './SecretInput';

export type LockMode = 'setup' | 'migrate' | 'unlock';
/** 'unlock' = abrió con su PIN; 'restore' = datos traídos de un backup; 'fresh' = datos nuevos o migrados. */
export type UnlockSource = 'unlock' | 'restore' | 'fresh';

interface LockScreenProps {
  mode: LockMode;
  onUnlocked: (data: AppData, source: UnlockSource) => void;
}

type Step = 'main' | 'forgot' | 'restore-file' | 'restore-pass' | 'restore-newpin' | 'wipe';

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
    <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl space-y-6">{children}</div>
  </div>
);

const Header: React.FC<{ icon: React.ReactNode; title: string; text?: React.ReactNode }> = ({ icon, title, text }) => (
  <div className="text-center space-y-3">
    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 text-white rounded-[28px] shadow-xl shadow-blue-200">
      {icon}
    </div>
    <h1 className="text-2xl font-black text-slate-800">{title}</h1>
    {text && <p className="text-sm text-slate-500 leading-relaxed">{text}</p>}
  </div>
);

const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...rest }) => (
  <button
    {...rest}
    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all"
  >
    {children}
  </button>
);

const LinkButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...rest }) => (
  <button
    type="button"
    {...rest}
    className="w-full text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] py-2 hover:text-slate-600 transition-colors"
  >
    {children}
  </button>
);

const ErrorText: React.FC<{ text: string }> = ({ text }) =>
  text ? <p className="text-xs font-bold text-rose-500 text-center">{text}</p> : null;

const LockScreen: React.FC<LockScreenProps> = ({ mode: initialMode, onUnlocked }) => {
  const [mode, setMode] = useState<LockMode>(initialMode);
  const [step, setStep] = useState<Step>('main');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [passphrase, setPassphrase] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [restored, setRestored] = useState<AppData | null>(null);
  const [backupBlob, setBackupBlob] = useState<EncryptedBlob | null>(null);
  const [backupPass, setBackupPass] = useState('');
  const [wipeText, setWipeText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const resetFields = () => {
    setPin('');
    setPin2('');
    setError('');
    setBackupPass('');
    setWipeText('');
  };

  const goTo = (s: Step) => {
    resetFields();
    setStep(s);
  };

  // --- Crear PIN (primer uso, migración o PIN nuevo tras restaurar) ---
  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const problem = validateSecret(pin);
    if (problem) return setError(problem);
    if (pin !== pin2) return setError('Los dos PIN no coinciden.');
    setBusy(true);
    try {
      const data = restored ?? loadPlainData();
      await createVault(pin, data);
      // Recién ahora, con la bóveda verificada, se borran las copias en texto plano.
      removePlainData();
      setSecretKind(passphrase ? 'text' : 'pin');
      onUnlocked(data, restored ? 'restore' : 'fresh');
    } catch (err) {
      console.error(err);
      setError('No se pudo crear la protección. Probá de nuevo.');
      setBusy(false);
    }
  };

  // --- Desbloquear ---
  const submitUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pin) return;
    setBusy(true);
    try {
      const data = await unlockVault(pin);
      onUnlocked(data, 'unlock');
    } catch (err) {
      setError(err instanceof WrongSecretError ? 'PIN incorrecto.' : 'No se pudieron abrir los datos.');
      setPin('');
      setBusy(false);
    }
  };

  // --- Restaurar desde backup ---
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    setError('');
    const res = await storageService.importData(file);
    if (!res) return setError('El archivo no es un backup válido de Nappy.');
    if (res.kind === 'plain') {
      setRestored(res.data);
      goTo('restore-newpin');
    } else {
      setBackupBlob(res.blob);
      goTo('restore-pass');
    }
  };

  const submitBackupPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupBlob) return;
    setError('');
    setBusy(true);
    try {
      const data = await storageService.openEncryptedBackup(backupBlob, backupPass);
      if (!data) throw new Error('formato');
      setRestored(data);
      setBusy(false);
      goTo('restore-newpin');
    } catch (err) {
      setError(err instanceof WrongSecretError ? 'Contraseña del backup incorrecta.' : 'El backup no se pudo leer.');
      setBusy(false);
    }
  };

  const confirmWipe = () => {
    wipeAll();
    setRestored(null);
    setMode('setup');
    goTo('main');
  };

  const showCreate = mode !== 'unlock' || step === 'restore-newpin';

  // ---------- Pantallas ----------

  if (step === 'forgot') {
    return (
      <Card>
        <Header
          icon={<AlertTriangle size={40} />}
          title="Olvidé mi PIN"
          text="Por seguridad, el PIN no se puede recuperar: los datos están cifrados con él. Tenés dos salidas."
        />
        <div className="space-y-3">
          <PrimaryButton type="button" onClick={() => goTo('restore-file')}>
            Restaurar desde un backup
          </PrimaryButton>
          <button
            type="button"
            onClick={() => goTo('wipe')}
            className="w-full bg-rose-50 text-rose-600 font-black py-4 rounded-2xl border border-rose-100 active:scale-95 transition-all"
          >
            Borrar todo y empezar de cero
          </button>
        </div>
        <LinkButton onClick={() => goTo('main')}>
          <ArrowLeft size={12} className="inline mr-1" /> Volver
        </LinkButton>
      </Card>
    );
  }

  if (step === 'restore-file') {
    return (
      <Card>
        <Header
          icon={<Upload size={40} />}
          title="Restaurar backup"
          text="Elegí el archivo de backup (.nappy). Si es un backup cifrado, te vamos a pedir su contraseña y después vas a crear un PIN nuevo."
        />
        <input ref={fileRef} type="file" accept=".nappy,.json" onChange={handleFile} className="hidden" />
        <PrimaryButton type="button" onClick={() => fileRef.current?.click()}>
          Elegir archivo
        </PrimaryButton>
        <ErrorText text={error} />
        <LinkButton onClick={() => goTo(mode === 'unlock' ? 'forgot' : 'main')}>
          <ArrowLeft size={12} className="inline mr-1" /> Volver
        </LinkButton>
      </Card>
    );
  }

  if (step === 'restore-pass') {
    return (
      <Card>
        <Header icon={<Lock size={40} />} title="Contraseña del backup" text="Es la que pusiste cuando creaste ese backup." />
        <form onSubmit={submitBackupPass} className="space-y-4">
          <SecretInput label="Contraseña del backup" value={backupPass} onChange={setBackupPass} passphrase autoFocus />
          <ErrorText text={error} />
          <PrimaryButton type="submit" disabled={busy || !backupPass}>
            {busy ? 'Abriendo…' : 'Abrir backup'}
          </PrimaryButton>
        </form>
        <LinkButton onClick={() => goTo('restore-file')}>
          <ArrowLeft size={12} className="inline mr-1" /> Elegir otro archivo
        </LinkButton>
      </Card>
    );
  }

  if (step === 'wipe') {
    return (
      <Card>
        <Header
          icon={<AlertTriangle size={40} />}
          title="¿Borrar todo?"
          text={
            <>
              Se van a borrar <b>todos los perfiles y registros</b> de este celular y no se pueden recuperar si no tenés un backup.
              Para confirmar, escribí <b>BORRAR</b>.
            </>
          }
        />
        <input
          value={wipeText}
          onChange={e => setWipeText(e.target.value)}
          className="w-full bg-slate-50 border-2 border-slate-100 focus:border-rose-300 outline-none rounded-2xl px-4 py-3.5 text-center text-lg font-black tracking-widest text-slate-700"
          placeholder="BORRAR"
          autoCapitalize="characters"
        />
        <button
          type="button"
          disabled={wipeText.trim().toUpperCase() !== 'BORRAR'}
          onClick={confirmWipe}
          className="w-full bg-rose-600 disabled:opacity-40 text-white font-black py-4 rounded-2xl active:scale-95 transition-all"
        >
          Borrar todo
        </button>
        <LinkButton onClick={() => goTo('forgot')}>
          <ArrowLeft size={12} className="inline mr-1" /> Cancelar
        </LinkButton>
      </Card>
    );
  }

  if (showCreate) {
    const isRestore = step === 'restore-newpin';
    return (
      <Card>
        <Header
          icon={<ShieldCheck size={40} />}
          title={isRestore ? 'Creá un PIN nuevo' : mode === 'migrate' ? 'Protegé tus datos' : 'Creá tu PIN'}
          text={
            isRestore
              ? 'Tus datos del backup se guardan cifrados con este PIN nuevo.'
              : mode === 'migrate'
              ? 'Ahora Nappy cifra los datos que ya tenés en este celular. Elegí un PIN para abrirlos.'
              : 'Tus datos se guardan solo en este celular y cifrados con tu PIN. Nadie más puede leerlos, ni nosotros.'
          }
        />
        <form onSubmit={submitCreate} className="space-y-4">
          <SecretInput
            label={passphrase ? 'Contraseña (mín. 6 caracteres)' : 'PIN (mín. 6 dígitos)'}
            value={pin}
            onChange={setPin}
            passphrase={passphrase}
            autoFocus
            autoComplete="new-password"
          />
          <SecretInput
            label={passphrase ? 'Repetí la contraseña' : 'Repetí el PIN'}
            value={pin2}
            onChange={setPin2}
            passphrase={passphrase}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => {
              setPassphrase(p => !p);
              setPin('');
              setPin2('');
              setError('');
            }}
            className="text-[11px] font-bold text-blue-600"
          >
            {passphrase ? 'Prefiero un PIN numérico' : 'Prefiero usar una contraseña más larga (más segura)'}
          </button>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-[11px] text-amber-700 leading-relaxed">
            <b>Importante:</b> si olvidás el PIN y no tenés un backup, los datos no se pueden recuperar.
          </div>
          <ErrorText text={error} />
          <PrimaryButton type="submit" disabled={busy || !pin || !pin2}>
            {busy ? 'Protegiendo…' : isRestore ? 'Restaurar' : 'Continuar'}
          </PrimaryButton>
        </form>
        {isRestore && (
          <LinkButton onClick={() => goTo('restore-file')}>
            <ArrowLeft size={12} className="inline mr-1" /> Volver
          </LinkButton>
        )}
        {mode === 'setup' && !isRestore && (
          <LinkButton onClick={() => goTo('restore-file')}>Ya tengo un backup: restaurarlo</LinkButton>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <Header icon={<Lock size={40} />} title="Nappy" text="Ingresá tu PIN para abrir los datos." />
      <form onSubmit={submitUnlock} className="space-y-4">
        <SecretInput label={secretIsNumeric() ? 'PIN' : 'Contraseña'} value={pin} onChange={setPin} passphrase={!secretIsNumeric()} autoFocus autoComplete="current-password" />
        <ErrorText text={error} />
        <PrimaryButton type="submit" disabled={busy || !pin}>
          {busy ? 'Abriendo…' : 'Abrir'}
        </PrimaryButton>
      </form>
      <LinkButton onClick={() => goTo('forgot')}>Olvidé mi PIN</LinkButton>
    </Card>
  );
};

export default LockScreen;
