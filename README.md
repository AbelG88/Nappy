# Nappy 🚽

App mobile-first para acompañar el proceso de dejar los pañales. Soporta varios perfiles (uno por peque), registro rápido con chips, historial, estadísticas y cuidadores. Todo se guarda en el dispositivo (`localStorage`), sin nube.

## Correr en local

Requiere Node.js.

```
npm install
npm run dev
```

## Publicación

Cada push a `main` despliega a GitHub Pages con el workflow `.github/workflows/deploy.yml`.
En el repo: **Settings → Pages → Source: GitHub Actions**.
