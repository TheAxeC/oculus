// Layer 4, test helper. Support for the route tests of the open endpoint. Every file and folder is
// made under the system temporary directory and asserted to be inside it; nothing here runs macOS
// `open`, and every case hands the endpoint an opener of its own.

import { mkdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { expect } from 'vitest';
import { stringify } from 'yaml';
import type { ProgramApps } from '../../../src/lib/data/helpers/files/opens-in-program.ts';
import { engineDir, loadConfig, openSettings } from '../../../src/lib/data/sources/config.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import type { OpenTarget } from '../../../src/lib/server/files/open.ts';
import { scratchDir } from '../../fixtures/scratch.ts';

export const TOKEN = mintToken();

const HOST = '127.0.0.1:8791';

/** `open.program_ext` of the checked-in config/behavior.yml. */
export const APPS: ProgramApps = openSettings(loadConfig(engineDir()).config).programApps;

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

/**
 * The fixture with a file in the project folder, a second root the way a saved workspace adds one
 * holding a file of its own, and a file outside both, which the escapes point at.
 */
export function withFiles(): {
    hub: string;
    folder: string;
    report: string;
    work: string;
    sheet: string;
    outside: string;
    roots: Root[];
} {
    const { hub, folder } = fixture();
    const report = join(folder, 'report.docx');
    writeFileSync(report, 'PK a document', { mode: 0o644 });
    const work = scratch('oculus-open-work-');
    const sheet = join(work, 'deck.xlsx');
    writeFileSync(sheet, 'PK a sheet', { mode: 0o644 });
    const outside = join(scratch('oculus-open-outside-'), 'secret.docx');
    writeFileSync(outside, 'PK outside every root', { mode: 0o644 });
    const roots = [
        { key: 'hub', dir: hub },
        { key: 'work', dir: work }
    ];
    return { hub, folder, report, work, sheet, outside, roots };
}

/** Write an engine's config/behavior.yml holding one `open.program_ext` map, or any value given. */
export function writeOpenConfig(engine: string, map: unknown): void {
    const dir = join(engine, 'config');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'behavior.yml'), stringify({ open: { program_ext: map } }));
}

/**
 * What a request's ServerContext carries for the open route: no configured roots, an engine of its
 * own whose config/behavior.yml holds the checked-in `open.program_ext`, and a saved workspaces
 * file whose current workspace adds `work` as a root, as the Files view's add control writes it.
 */
export function servedOver(
    hub: string,
    work: string
): { config: Record<string, unknown>; engine: string; local: { hub: string; workspaces: string } } {
    const saved = join(scratch('oculus-open-home-'), 'workspaces.json');
    writeFileSync(
        saved,
        JSON.stringify({
            current: 'thesis',
            workspaces: [{ name: 'thesis', roots: [{ key: 'work', dir: work }] }]
        })
    );
    const engine = scratch('oculus-open-engine-');
    writeOpenConfig(engine, APPS);
    return { config: {}, engine, local: { hub, workspaces: saved } };
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

/**
 * What the opener is expected to be handed for a path: its folder, revealed, or its file with the
 * application the given map names for the real name's extension.
 */
export function opened(path: string, apps: ProgramApps = APPS): OpenTarget {
    const real = realpathSync(path);
    if (statSync(real).isDirectory()) return { kind: 'folder', path: real };
    return { kind: 'file', path: real, app: apps[extname(real).toLowerCase()] };
}
