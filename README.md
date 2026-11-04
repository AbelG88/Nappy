# Nappy 🚽

App mobile-first para acompañar el proceso de dejar los pañales. Todo se guarda en el dispositivo (`localStorage`), sin nube ni cuentas.

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
- En algunos celulares Chrome muestra "Ya se instaló esta app" y no deja instalarla. En ese caso se puede usar el acceso directo (menú → Agregar a la pantalla principal), que funciona igual.

## Datos y compatibilidad

- Clave de almacenamiento: `potty_tracker_v2`. Los datos de la versión anterior (`potty_tracker_v1`) se migran sin borrarse.
- Los respaldos de la versión anterior se pueden importar.
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
