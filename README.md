# Nappy 🚽

App mobile-first para acompañar el proceso de dejar los pañales. Todo se guarda en el dispositivo, **cifrado con un PIN o contraseña**, sin nube ni cuentas.

App publicada: https://abelg88.github.io/Nappy/

## Qué hace

- **Varios perfiles** (uno por peque), con un wizard inicial: nombre, sexo (para el ícono), edad, objetivo (pis, caca o ambos), hábitos, recordatorios y cuidadores.
- **Registro rápido con chips**: tipo, resultado (logro, intento o accidente), cuidador, iniciativa y momento. La nota es opcional.
- **Historial y estadísticas** por peque.
- **Cuidadores** (papá, mamá, abuela, abuelo u otra persona) para elegirlos rápido al cargar un intento.
- **Recordatorios por peque**, con permiso de notificaciones. Se elige un solo formato:
  - *Por horarios*: levantarse, desayuno, almuerzo, siesta, merienda y cena, con hora editable y horarios propios. Suena a la hora pactada.
  - *Cada tanto tiempo*: cada 30 min, 1, 1,5, 2 o 3 h.
  - En Ajustes hay un botón de aviso de prueba.
- **Compartir el historial entre cuidadores**: Ajustes → Datos → Exportar genera un respaldo (`.json`). Quien lo recibe lo importa y sus registros se **suman** a los suyos, sin borrar nada ni duplicar (importar dos veces es seguro). Los perfiles y cuidadores se reconocen por nombre. Los perfiles importados llegan con los recordatorios apagados.
- **Informe en PDF para profesionales**: período a elegir, resumen, horarios, detalle por día y por cuidador, y detalle de registros.
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

Requiere Node.js.

```
npm install
npm run dev
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
