// Layer 2, server. The port a primary hub that names none means. The desktop host expects the
// server on the port the primary hub's `.oculus/local.yml` names, or on the host's default port
// when it names none (or the workspace has no primary hub), and passes that default to the server
// as `--default-port`, so the port it asks about when a listen is refused is the port the server
// tried. A server started without the flag takes the built-in default port.

import { readMachine } from '../../../../data/sources/config.ts';

/**
 * The reader of the machine's values for a server started with `defaultPort`: the values read, and
 * the default port in place of the built-in one while the primary hub's file sets none. With no
 * default it is `readMachine` itself.
 */
export function readMachineWithDefault(defaultPort: number | undefined): typeof readMachine {
    if (defaultPort === undefined) return readMachine;
    return (hubs, primary, warn) => {
        const read = readMachine(hubs, primary, warn);
        if (read.set.includes('port')) return read;
        return { ...read, config: { ...read.config, port: defaultPort } };
    };
}
