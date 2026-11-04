/**
 * Cifrado de Nappy: AES-256-GCM con clave derivada del PIN / contraseña (PBKDF2-SHA256).
 * Todo corre en el dispositivo con Web Crypto; nada sale del celular.
 */

export const PBKDF2_ITERATIONS = 600_000;

/** Etiquetas que se autentican junto con el contenido: un blob de un tipo no se puede pasar por otro. */
export type BlobPurpose = 'vault' | 'backup';
const AAD: Record<BlobPurpose, string> = {
  vault: 'nappy-vault-v1',
  backup: 'nappy-backup-v1',
};

export interface EncryptedBlob {
  v: 1;
  purpose: BlobPurpose;
  kdf: 'PBKDF2-SHA256';
  iter: number;
  /** Base64 */
  salt: string;
  iv: string;
  ct: string;
}

export class WrongSecretError extends Error {
  constructor() {
    super('PIN o contraseña incorrectos, o el archivo está dañado.');
    this.name = 'WrongSecretError';
  }
}

const enc = new TextEncoder();
const dec = new TextDecoder();

const toB64 = (bytes: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
};

const fromB64 = (b64: string): Uint8Array => {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
};

export const randomBytes = (n: number): Uint8Array => crypto.getRandomValues(new Uint8Array(n));

export const isEncryptedBlob = (x: any): x is EncryptedBlob =>
  !!x &&
  typeof x === 'object' &&
  x.v === 1 &&
  (x.purpose === 'vault' || x.purpose === 'backup') &&
  x.kdf === 'PBKDF2-SHA256' &&
  typeof x.iter === 'number' &&
  typeof x.salt === 'string' &&
  typeof x.iv === 'string' &&
  typeof x.ct === 'string';

/** Deriva una clave AES-GCM no exportable a partir del secreto del usuario. */
export const deriveKey = async (secret: string, salt: Uint8Array, iter: number = PBKDF2_ITERATIONS): Promise<CryptoKey> => {
  const material = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

/** Cifra con una clave ya derivada. Cada llamada usa un IV nuevo. */
export const encryptWithKey = async (
  key: CryptoKey,
  plaintext: string,
  purpose: BlobPurpose,
  salt: Uint8Array,
  iter: number
): Promise<EncryptedBlob> => {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: enc.encode(AAD[purpose]) },
    key,
    enc.encode(plaintext)
  );
  return {
    v: 1,
    purpose,
    kdf: 'PBKDF2-SHA256',
    iter,
    salt: toB64(salt),
    iv: toB64(iv),
    ct: toB64(new Uint8Array(ct)),
  };
};

export const decryptWithKey = async (key: CryptoKey, blob: EncryptedBlob): Promise<string> => {
  try {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(blob.iv), additionalData: enc.encode(AAD[blob.purpose]) },
      key,
      fromB64(blob.ct)
    );
    return dec.decode(pt);
  } catch {
    throw new WrongSecretError();
  }
};

/** Cifra con un secreto: genera sal nueva. Pensado para backups. */
export const encryptWithSecret = async (secret: string, plaintext: string, purpose: BlobPurpose): Promise<EncryptedBlob> => {
  const salt = randomBytes(16);
  const key = await deriveKey(secret, salt, PBKDF2_ITERATIONS);
  return encryptWithKey(key, plaintext, purpose, salt, PBKDF2_ITERATIONS);
};

export const decryptWithSecret = async (secret: string, blob: EncryptedBlob): Promise<string> => {
  const key = await deriveKey(secret, fromB64(blob.salt), blob.iter);
  return decryptWithKey(key, blob);
};

export const blobSalt = (blob: EncryptedBlob): Uint8Array => fromB64(blob.salt);

/** Reglas mínimas del PIN / contraseña. Devuelve el mensaje de error o null si está bien. */
export const validateSecret = (secret: string): string | null => {
  if (secret.length < 6) return 'Usá al menos 6 caracteres.';
  if (/^(.)\1+$/.test(secret)) return 'No uses el mismo carácter repetido.';
  if (['123456', '654321', '1234567', '12345678', '123123', '121212'].includes(secret)) {
    return 'Ese PIN es demasiado fácil de adivinar.';
  }
  return null;
};
