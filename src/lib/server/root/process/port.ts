// Layer 2, server. The port a missing local.yml means. The desktop host expects the server on the
// port local.yml names, or on the host's default port when the file is missing, and passes that
// default to the server as `--default-port`, so the port it asks about when a listen is refused is
// the port the server tried. A server started without the flag takes the built-in default port
// while local.yml is missing.

import { existsSync } from 'node:fs';
import { localFile, readLocal } from '../../../data/sources/config.ts';

/**
 * The reader of local.yml for a server started with `defaultPort`: the file's values, and the
 * default port in place of the built-in one while the file is missing. With no default it is
 * `readLocal` itself.
 */
export function readLocalWithDefault(defaultPort: number | undefined): typeof readLocal {
    if (defaultPort === undefined) return readLocal;
    return (engine, warn) => {
        const read = readLocal(engine, warn);
        if (existsSync(localFile(engine))) return read;
        return { ...read, config: { ...read.config, port: defaultPort } };
    };
}
