// Layer 4, test helper. Support for the route tests of the open endpoint. Every file and folder is
// made under the system temporary directory and asserted to be inside it; nothing here runs macOS
// `open`, and every case hands the endpoint an opener of its own.

import { mkdirSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { expect } from 'vitest';
import type { ProgramApps } from '../../../src/lib/data/helpers/files/opens-in-program.ts';
import { engineDir, loadConfig, openSettings } from '../../../src/lib/data/sources/config.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import { scratchDir } from '../../fixtures/scratch.ts';

export const TOKEN = mintToken();

const HOST = '127.0.0.1:8791';

/** `open.program_ext` of the checked-in config/defaults/behavior.yml. */
const APPS: ProgramApps = openSettings(loadConfig(engineDir()).config).programApps;

/** The map as the endpoint asks for it at every request: here, always the checked-in one. */
export function checkedIn(): ProgramApps {
    return APPS;
}

/** A directory of the case's own, which scratchDir makes inside the system temporary directory. */
export function scratch(prefix: string): string {
    return scratchDir(prefix);
}

/** A hub with one project folder in it. */
export function fixture(): { hub: string; folder: string; roots: Root[] } {
    const hub = scratch('oculus-open-');
    const folder = join(hub, 'projects', 'active', 'alpha');
    expect(resolve(folder).startsWith(resolve(hub) + sep)).toBe(true);
    mkdirSync(folder, { recursive: true });
    return { hub, folder, roots: [{ key: 'hub', dir: hub }] };
}

/** A same-origin POST to the endpoint carrying the body and the token. */
export function request(body: unknown, token = TOKEN): Request {
    return new Request(`http://${HOST}/api/open`, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': token
        },
        body: JSON.stringify(body)
    });
}
