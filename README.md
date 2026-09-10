# oculus

The private dashboard over the research portfolio. `DESIGN.md` is what it is measured against; this file is how to run it.

Install once, with npm and Node 23: `npm install`, or `npm ci` from the committed lockfile. Regenerating that lockfile from nothing on npm 10.9.2 needs `npm install --legacy-peer-deps`, because npm 10 crashes on vitest's peer graph; npm 11 does not need the flag.

Develop with `npm run dev`, which serves on Vite's own port and hot-reloads. For the built server, `npm run build` then `node src/server.ts`, which serves on 127.0.0.1 at the port from `local.yml` (8790 by default). Port 8787 belongs to the cockpit and is never used.

Machine-local values live in `tools/oculus/local.yml`, which is gitignored and optional: `hub` is the absolute path of the research hub, defaulting to two directories above this one, and `port` is an integer, defaulting to 8790. No environment variable is read.

The three verification commands are `npm test` (vitest), `npm run check` (svelte-check) and `npm run build`.
