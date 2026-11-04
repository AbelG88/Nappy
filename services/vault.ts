import { AppData } from '../types';
import {
  EncryptedBlob,
  PBKDF2_ITERATIONS,
  WrongSecretError,
  blobSalt,
  decryptWithKey,
  deriveKey,
  encryptWithKey,
  isEncryptedBlob,
  randomBytes,
} from './crypto';
import { parseBackup, storageService } from './storage';

/**
 * Bóveda local: los datos viven cifrados en localStorage.
 * La clave derivada del PIN solo existe en memoria mientras la app está desbloqueada.
 */

const VAULT_KEY = 'nappy_vault_v1';
const PLAIN_KEYS = ['potty_tracker_v2', 'potty_tracker_v1'];

interface Session {
  key: CryptoKey;
  salt: Uint8Array;
  iter: number;
  /** PIN en memoria mientras la bóveda está abierta. */
  secret?: string;
}

let session: Session | null = null;
let writeChain: Promise<void> = Promise.resolve();

const readBlob = (): EncryptedBlob | null => {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isEncryptedBlob(parsed) && parsed.purpose === 'vault' ? parsed : null;
  } catch {
    return null;
  }
};

export const vaultExists = (): boolean => readBlob() !== null;

/** ¿Hay datos de versiones anteriores guardados en texto plano? */
export const hasPlainData = (): boolean => PLAIN_KEYS.some(k => localStorage.getItem(k) !== null);

export const isUnlocked = (): boolean => session !== null;

/** PIN de la sesión actual (solo en memoria; se descarta al bloquear). Sirve para usarlo como contraseña del backup sin pedirlo de nuevo. */
export const sessionSecret = (): string | null => session?.secret ?? null;

const writeBlob = async (data: AppData): Promise<void> => {
  if (!session) throw new Error('La bóveda está bloqueada.');
  const { key, salt, iter } = session;
  const blob = await encryptWithKey(key, JSON.stringify(data), 'vault', salt, iter);
  localStorage.setItem(VAULT_KEY, JSON.stringify(blob));
};

/** Crea la bóveda con un PIN nuevo (o la reemplaza). Verifica que se pueda leer antes de dar el OK. */
export const createVault = async (pin: string, data: AppData): Promise<void> => {
  const salt = randomBytes(16);
  const key = await deriveKey(pin, salt, PBKDF2_ITERATIONS);
  const previous = session;
  session = { key, salt, iter: PBKDF2_ITERATIONS, secret: pin };
  try {
    await writeBlob(data);
    const blob = readBlob();
    if (!blob) throw new Error('No se pudo guardar la bóveda.');
    const back = parseBackup(JSON.parse(await decryptWithKey(key, blob)));
    if (!back) throw new Error('La verificación de la bóveda falló.');
  } catch (e) {
    session = previous;
    throw e;
  }
};

/** Intenta desbloquear con el PIN. Lanza WrongSecretError si no coincide. */
export const unlockVault = async (pin: string): Promise<AppData> => {
  const blob = readBlob();
  if (!blob) throw new Error('No hay datos guardados.');
  const salt = blobSalt(blob);
  const key = await deriveKey(pin, salt, blob.iter);
  const text = await decryptWithKey(key, blob);
  const data = parseBackup(JSON.parse(text));
  if (!data) throw new Error('Los datos guardados no tienen un formato válido.');
  session = { key, salt, iter: blob.iter, secret: pin };
  return data;
};

/** Comprueba un PIN sin cambiar la sesión (para pedir el PIN actual antes de cambiarlo). */
export const verifyPin = async (pin: string): Promise<boolean> => {
  const blob = readBlob();
  if (!blob) return false;
  try {
    const key = await deriveKey(pin, blobSalt(blob), blob.iter);
    await decryptWithKey(key, blob);
    return true;
  } catch (e) {
    if (e instanceof WrongSecretError) return false;
    throw e;
  }
};

/** Guarda los datos cifrados. Las escrituras se encolan para que no se pisen entre sí. */
export const saveVault = (data: AppData): Promise<void> => {
  writeChain = writeChain.then(() => writeBlob(data)).catch(e => {
    console.error('No se pudo guardar de forma cifrada', e);
  });
  return writeChain;
};

export const lockVault = (): void => {
  session = null;
};

/** Cambia el PIN: re-cifra todo con una sal nueva. */
export const changePin = async (newPin: string, data: AppData): Promise<void> => {
  await writeChain;
  await createVault(newPin, data);
};

/** Borra los datos en texto plano de versiones viejas (después de haberlos cifrado). */
export const removePlainData = (): void => {
  PLAIN_KEYS.forEach(k => localStorage.removeItem(k));
};

/** Borra todo: bóveda y cualquier copia vieja. */
export const wipeAll = (): void => {
  lockVault();
  localStorage.removeItem(VAULT_KEY);
  removePlainData();
};

/** Lee lo que haya en texto plano (formato viejo) para migrarlo. */
export const loadPlainData = (): AppData => storageService.loadData();

/** Pide al navegador que no borre el almacenamiento de Nappy cuando falte espacio. */
export const requestPersistentStorage = async (): Promise<boolean> => {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    }
  } catch {
    /* no soportado */
  }
  return false;
};

/** Pista no sensible para elegir el teclado: 'pin' (numérico) o 'text' (contraseña). */
const KIND_KEY = 'nappy_secret_kind';
export const setSecretKind = (kind: 'pin' | 'text'): void => {
  try { localStorage.setItem(KIND_KEY, kind); } catch { /* sin almacenamiento */ }
};
export const secretIsNumeric = (): boolean => {
  try { return localStorage.getItem(KIND_KEY) === 'pin'; } catch { return false; }
};

/** Minutos en segundo plano antes de volver a pedir el PIN (0 = nunca). */
const AUTOLOCK_KEY = 'nappy_autolock_min';
export const AUTOLOCK_OPTIONS = [0, 1, 5, 15] as const;
export const getAutoLockMinutes = (): number => {
  try {
    const v = localStorage.getItem(AUTOLOCK_KEY);
    if (v === null) return 5;
    const n = parseInt(v, 10);
    return (AUTOLOCK_OPTIONS as readonly number[]).includes(n) ? n : 5;
  } catch {
    return 5;
  }
};
export const setAutoLockMinutes = (n: number): void => {
  try { localStorage.setItem(AUTOLOCK_KEY, String(n)); } catch { /* sin almacenamiento */ }
};
