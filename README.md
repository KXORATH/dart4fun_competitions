# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## GitHub Pages deploy

Repo contains workflow `.github/workflows/deploy-pages.yml` that publishes app to GitHub Pages on each push to `main` (and `master` for repos still using legacy default branch naming).

One-time GitHub setup:
1. Go to **Settings → Pages** in the repository.
2. Set **Source** to **GitHub Actions**.

After that, each merge to `main`/`master` should automatically build and publish current version.
