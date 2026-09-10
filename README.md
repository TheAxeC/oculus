# oculus

The private dashboard over the research portfolio. `DESIGN.md` is what it is measured against; this file is how to run it.

Install once, with Node 24 and npm 11 (`nvm install 24` gives both): `npm ci` from the committed lockfile, or `npm install` to regenerate it.

Develop with `npm run dev`, which serves on Vite's own port and hot-reloads. For the built server, `npm run build` then `node src/server.ts`, which serves on 127.0.0.1 at the port from `local.yml` (8790 by default). Port 8787 belongs to the cockpit and is never used.

Machine-local values live in `tools/oculus/local.yml`, which is gitignored and optional: `hub` is the absolute path of the research hub, defaulting to two directories above this one, and `port` is an integer, defaulting to 8790. No environment variable is read.

The four verification commands are `npm test` (vitest), `npm run check` (svelte-check), `npm run build` and `npm run format:check` (Prettier, four-space indentation; `npm run format` applies it).
