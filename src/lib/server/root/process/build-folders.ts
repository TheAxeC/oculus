// Layer 2, server. The Vite mode of the app's build and the two folders it writes: SvelteKit's
// output folder and the adapter's. `npm run build` and the dev server write `.svelte-kit/` and
// `build/`; the app's build, which runs under the Vite mode `app`, writes `.svelte-kit-app/` and
// `build-app/`, so a start of the app never meets a build another command of the checkout is
// writing. vite.config.ts, the desktop host, the git watcher and the start test read the names from
// here. The search query (data/helpers/search/query.ts) is layer 1, which imports no server module,
// so it writes the four names again.

import { join } from 'node:path';

/** The Vite mode of the app's build. */
export const APP_MODE = 'app';

/** The folders the app's build writes, as paths from the checkout. */
export const APP_FOLDERS = { kit: '.svelte-kit-app', adapter: 'build-app' } as const;

/** The folders `npm run build` and the dev server write, as paths from the checkout. */
export const PLAIN_FOLDERS = { kit: '.svelte-kit', adapter: 'build' } as const;

/** The server handler the app's build leaves in a checkout. */
export function appHandler(checkout: string): string {
    return join(checkout, APP_FOLDERS.adapter, 'handler.js');
}
