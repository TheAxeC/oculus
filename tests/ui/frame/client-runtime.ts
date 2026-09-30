// Layer 4, test helper. A vitest environment with no DOM whose modules are transformed as the
// browser's, so a case reaches Svelte's client runtime: $effect runs, flushSync flushes and a
// teardown runs as it does in the page. The node environment of the rest of the suite loads
// Svelte's server build, where no effect runs, so what happens inside a teardown is unreachable
// there. vite.config.ts gives this environment to every file named *.client.test.ts.

import type { Environment } from 'vitest/environments';

const clientRuntime: Environment = {
    name: 'client-runtime',
    viteEnvironment: 'client',
    setup: () => ({ teardown: () => undefined })
};

export default clientRuntime;
