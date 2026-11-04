import React, { useState } from 'react';
import { AlertTriangle, Check, Download, Mail, X } from 'lucide-react';
import { validateSecret } from '../services/crypto';
import { DeliveryResult } from '../services/storage';
import { backupMailto, isValidEmail } from '../services/backupReminder';
import SecretInput from './SecretInput';

interface BackupDialogProps {
  /** true = aviso obligatorio tras crear el perfil ("guardá tu backup"). */
  notice?: boolean;
  /** Genera y entrega el backup cifrado con la contraseña elegida. */
  onExport: (password: string) => Promise<DeliveryResult>;
  /** Correo propio guardado en Ajustes (para el botón "Abrir correo"). */
  email?: string;
  /** Cierra el diálogo (en modo aviso, solo se muestra la X si ya aceptó). */
  onClose: () => void;
  /** Modo aviso: se llama cuando la persona confirma que entendió. */
  onAcknowledge?: () => void;
  /** Comprueba el PIN de la app, para usarlo también como contraseña del backup. */
  verifySecret: (secret: string) => Promise<boolean>;
}

const BackupDialog: React.FC<BackupDialogProps> = ({ notice = false, onExport, onClose, onAcknowledge, verifySecret, email }) => {
  const [samePin, setSamePin] = useState(true);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<DeliveryResult>(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!samePin) {
      const problem = validateSecret(pw);
      if (problem) return setError(problem);
      if (pw !== pw2) return setError('Las contraseñas no coinciden.');
    }
    setBusy(true);
    try {
      // Con "mismo PIN" se pide el PIN una vez y se comprueba: la app no lo guarda, solo conserva la clave derivada.
      if (samePin && !(await verifySecret(pw))) {
        setError('Ese no es tu PIN actual.');
        return;
      }
      setDone(await onExport(pw));
    } catch (err) {
      console.error(err);
      setError('No se pudo crear el backup. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-[40px] p-7 max-w-sm w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        {!notice && (
          <button onClick={onClose} className="absolute top-5 right-5 p-2 text-slate-300 hover:text-slate-500" aria-label="Cerrar">
            <X size={22} />
          </button>
        )}

        <div className="text-center space-y-3">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-[24px] text-white shadow-lg ${notice ? 'bg-amber-500 shadow-amber-100' : 'bg-blue-600 shadow-blue-100'}`}>
            {notice ? <AlertTriangle size={32} /> : <Download size={32} />}
          </div>
          <h3 className="text-xl font-black text-slate-800">{notice ? 'Guardá tu backup' : 'Backup cifrado'}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {notice ? (
              <>
                Tus datos viven solo en este celular y están cifrados con tu PIN. Si olvidás el PIN, cambiás de celular o se borra la app,{' '}
                <b>sin un backup se pierden</b>. Hacelo ahora y guardalo en un lugar seguro (Drive, tu mail, otra persona de confianza).
              </>
            ) : (
              'Se genera un archivo .nappy cifrado con una contraseña. Guardalo donde quieras: sin esa contraseña nadie puede abrirlo.'
            )}
          </p>
        </div>

        {!done ? (
          <form onSubmit={submit} className="space-y-4">
            <label className="flex items-start gap-3 text-[12px] text-slate-600 leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                checked={samePin}
                onChange={e => { setSamePin(e.target.checked); setPw(''); setPw2(''); setError(''); }}
                className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0"
              />
              <span>Usar el mismo PIN / contraseña de la app</span>
            </label>
            {samePin ? (
              <>
                <SecretInput label="Tu PIN o contraseña actual" value={pw} onChange={setPw} passphrase autoComplete="current-password" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Lo pedimos una vez para confirmar que sos vos. Si algún día cambiás el PIN, este backup se sigue abriendo con el PIN de hoy.
                </p>
              </>
            ) : (
              <>
                <SecretInput label="Contraseña del backup" value={pw} onChange={setPw} passphrase autoComplete="new-password" />
                <SecretInput label="Repetí la contraseña" value={pw2} onChange={setPw2} passphrase autoComplete="new-password" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Anotala: si perdés el PIN y la contraseña del backup, no hay forma de recuperarlo.
                </p>
              </>
            )}
            {error && <p className="text-xs font-bold text-rose-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={busy || !pw || (!samePin && !pw2)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} />
              {busy ? 'Creando…' : 'Descargar backup cifrado'}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-emerald-700">
              <Check className="shrink-0" />
              <p className="text-xs leading-relaxed">
                <b>Listo.</b>{' '}
                {done === 'downloaded'
                  ? 'El archivo se descargó en este dispositivo. Guardalo en un lugar seguro (Drive, tu mail) y no pierdas la contraseña.'
                  : 'Guardá el archivo en un lugar seguro y no pierdas la contraseña.'}
              </p>
            </div>
            {email && isValidEmail(email) && (
              <a
                href={backupMailto(email)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-600 font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2"
              >
                <Mail size={16} /> Abrir correo a {email}
              </a>
            )}
          </div>
        )}

        {notice ? (
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 text-[12px] text-slate-600 leading-relaxed cursor-pointer">
              <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0" />
              <span>Entiendo que si olvido el PIN y no tengo un backup, pierdo todos los datos.</span>
            </label>
            <button
              type="button"
              disabled={!ack}
              onClick={onAcknowledge}
              className="w-full bg-slate-800 disabled:opacity-30 text-white font-black py-3.5 rounded-2xl active:scale-95 transition-all"
            >
              Entendido
            </button>
          </div>
        ) : (
          done && (
            <button type="button" onClick={onClose} className="w-full bg-slate-800 text-white font-black py-3.5 rounded-2xl active:scale-95 transition-all">
              Cerrar
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default BackupDialog;
