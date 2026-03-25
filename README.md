# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Frontend Firebase Config

All client Firebase config now lives in the frontend:

1. Copy `.env.example` to `.env`
2. Fill in your `VITE_FIREBASE_*` values from Firebase Project Settings

The app reads Firebase client keys from `src/config/firebaseClientConfig.js`.

## Gemini AI Report Setup

The "Generate AI Report" feature uses a server endpoint at `/api/gemini-report`.

1. Set `GEMINI_API_KEY` in your deployment environment (for example, Vercel Project Environment Variables).
2. Optional for local-only fallback: set `VITE_GEMINI_API_KEY` in `.env`.

Server key is preferred so the Gemini key is not exposed in browser code.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
