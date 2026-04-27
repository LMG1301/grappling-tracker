# Grappling Tracker

## Setup

Apres `git clone` puis `npm install`, lancer une fois la commande suivante pour
telecharger les snapshots des positions depuis [GrappleMap](http://eel.is/GrappleMap/)
(domaine public). Les images sont sauvegardees dans `public/images/positions/`
et `public/images/categories/`.

```sh
npm run download-images
```

Le script utilise Puppeteer (Chromium headless) — la premiere installation peut
prendre quelques minutes. Si une page GrappleMap est manquante, le script log
un warning et continue ; l'app affichera un placeholder pour les images
manquantes.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
