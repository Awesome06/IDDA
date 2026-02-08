# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


Key Features of this Designed Webpages:

    Logical Locking: The dictionary (Main Area) remains in an "Empty State" until a user selects a filter from the sidebar.

    Smart Categorization: The dictionary grid is built to group data by alphabet regardless of the technical filename (e.g., "Logistics" always goes under 'L').

    Accessibility: Each tool in the top bar has a hover title, making it easy for new hires to understand the "Auto Documentation" and "Linking" features.

    Responsive Sidebar: The client list expands only when the parent category (Investors, Buyers, etc.) is active, keeping the extreme left side clean.