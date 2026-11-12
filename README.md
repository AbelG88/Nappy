# Nappy 🚽

App mobile-first para acompañar el proceso de dejar los pañales. Todo se guarda en el dispositivo, **cifrado con un PIN o contraseña**, sin nube ni cuentas.

App publicada: https://abelg88.github.io/Nappy/

## Qué hace

- **Varios perfiles** (uno por peque), con un wizard inicial: nombre, sexo (para el ícono), fecha de nacimiento (la edad se calcula sola, hasta 18 años), objetivo (pis, caca o ambos), hábitos, recordatorios y cuidadores.
- **Registro rápido con chips**: tipo, resultado (logro, intento o accidente), cuidador, iniciativa y momento. La nota es opcional.
- **Historial y estadísticas** por peque.
- **Cuidadores** (papá, mamá, abuela, abuelo u "Otro") para elegirlos rápido al cargar un intento.
- **Recordatorios por peque**, con permiso de notificaciones. Se elige un solo formato:
  - *Por horarios*: levantarse, desayuno, almuerzo, siesta, merienda y cena, con hora editable y horarios propios. Suena a la hora pactada.
  - *Cada tanto tiempo*: cada 30 min, 1, 1,5, 2 o 3 h.
  - En Ajustes hay un botón de aviso de prueba.
- **Compartir el historial entre cuidadores**: Ajustes → Datos → Exportar genera un respaldo (`.json`). Quien lo recibe lo importa y sus registros se **suman** a los suyos, sin borrar nada ni duplicar (importar dos veces es seguro). Los perfiles y cuidadores se reconocen por nombre. Los perfiles importados llegan con los recordatorios apagados.
- **Informe en PDF para profesionales**: período a elegir, resumen, horarios, detalle por día y por cuidador, y detalle de registros.
- **Seguridad y backups**: PIN o contraseña al abrir, backup cifrado (`.nappy`) con recordatorio periódico, y restauración desde el primer uso (se puede saltar el wizard). Si el backup se hace con el mismo PIN, no lo vuelve a pedir.
- **Legal y contacto**: aceptación inicial de términos, privacidad y aviso médico (ES/EN), pantalla en Ajustes y formulario de contacto por correo.
- **Apoyo (donación)**: links discretos (Mercado Pago, Cafecito, PayPal, Buy Me a Coffee), con frecuencia limitada y sin silenciar.
- **Instalable (PWA)**: manifest, íconos y service worker.

## Limitaciones

- Los recordatorios suenan con la app abierta o en segundo plano. Si se cierra del todo no llegan, porque no hay servidor de notificaciones push.
- Los datos viven en cada dispositivo: para unificarlos hay que exportar e importar.
- Sin el PIN no hay forma de recuperar los datos: por eso la app recuerda hacer backups cifrados (`.nappy`).
- En algunos celulares Chrome muestra "Ya se instaló esta app" y no deja instalarla. En ese caso se puede usar el acceso directo (menú → Agregar a la pantalla principal), que funciona igual.

## Datos y compatibilidad

- Los datos se guardan cifrados (AES-256-GCM, clave derivada del PIN con PBKDF2) en `nappy_vault_v1`. Los datos sin cifrar de versiones anteriores (`potty_tracker_v2` / `v1`) se migran al crear el PIN y recién después se borran.
- Los respaldos de versiones anteriores se pueden importar.
- Este sitio comparte origen (`abelg88.github.io`) con otras apps: **no borrar los datos del sitio** desde Chrome, porque se perderían los de todas.

## Correr en local

Requiere Node.js 22 (el mismo que usa el workflow).

```
npm install
npm run dev        # servidor en http://localhost:3000
```

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Vite, puerto 3000) |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build local |
| `npm run licenses` | Regenera `public/third-party-licenses.txt` |
| `npx tsc --noEmit` | Chequeo de tipos (todavía no es un script ni corre en CI) |

## Estructura

```
App.tsx            Estado global, navegación y flujo de arranque (legal → PIN → wizard)
types.ts           Modelos: perfiles, registros, cuidadores, recordatorios
constants.ts       Opciones de edad, objetivo, cuidadores y helpers de fecha
components/        Pantallas y piezas de UI (Tracker, History, Statistics, Settings, ProfileWizard…)
services/          Lógica sin UI: vault/crypto/storage (cifrado y persistencia), reminders,
                   notifications, report (PDF), legal, contact, donation, backupReminder
legal/             Términos, privacidad y aviso médico en .md (ES/EN)
public/            Manifest, íconos, service worker y licencias de terceros
scripts/           Generador de licencias de terceros
```

## Publicación

Cada push a `main` despliega a GitHub Pages con el workflow `.github/workflows/deploy.yml`.
En el repo: **Settings → Pages → Source: GitHub Actions**.

## Stack

React 19, Vite 6, TypeScript, Tailwind (CDN), lucide-react, recharts, jsPDF + jspdf-autotable.


## Legal

- Licencia del código: [MIT](LICENSE) © 2026 Abel García.
- Licencias de las librerías de terceros: `public/third-party-licenses.txt` (se regenera con `npm run licenses`).
- Textos legales (español e inglés) en [`legal/`](legal): términos y condiciones, política de privacidad y aviso médico. La app pide aceptarlos al empezar; si se cambia `LEGAL_VERSION` en `services/legal.ts`, se vuelven a pedir.
- Son borradores redactados sin asesoramiento de un abogado: conviene que los revise un profesional antes de publicar a gran escala.

## Próximos pasos

- Multilenguaje de toda la app (hoy solo los textos legales están en español e inglés).
- Código de apoyo (reconocimiento simbólico; no bloquea funciones).
- Calidad técnica: script de `typecheck` y tests de `services/` (crypto, importación sin duplicados, recordatorios, edad) corriendo en CI antes de desplegar.
- Tailwind compilado en el build en vez de por CDN (mejora privacidad, velocidad y permite uso offline).
- Service worker con caché de la app para que funcione sin conexión.
- Reducir el bundle principal (~770 kB, sobre todo recharts) con carga diferida de pantallas.
- Accesibilidad: el viewport actual bloquea el zoom (`user-scalable=no`).
