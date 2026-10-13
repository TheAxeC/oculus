// Layer 4, test helper. The reader of the apps folders over synthetic folders: the shipped
// configuration, the sentence of an apps finding, a layout of the machine's apps folder and of the
// roots read as the watcher reads them, and the rows of the table the manifest tests compare.

import { join } from 'node:path';
import { findingText } from '../../../../../src/lib/data/helpers/finding-text.ts';
import { engineDir, loadConfig } from '../../../../../src/lib/data/sources/config.ts';
import { appsSettings, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { scanApps } from '../../../../../src/lib/server/machine/apps/read/scan.ts';
import {
    readAppsState,
    workspaceKey
} from '../../../../../src/lib/server/machine/apps/read/state.ts';
import { plantScratch } from '../../../../fixtures/scratch.ts';

export const { config } = loadConfig(engineDir());
export const catalog = textCatalog(config);
export const settings = appsSettings(config);

export const PORT = 8787;

/** The record of the disabled apps of a case: none of them, read from a file that is not there. */
const stateOf = (base: string) => ({
    state: readAppsState(join(base, 'apps.json')),
    stateFile: join(base, 'apps.json'),
    workspace: workspaceKey('')
});

/** The sentence of an apps finding. */
export const words = (key: string, ...args: (string | number)[]): string =>
    findingText(catalog, `findings.apps.${key}`, ...args);

export const MANIFEST = 'name: notes\ntitle: Reading notes\nbridge: 1\n';
export const PAGE = '<!doctype html><title>notes</title>\n';

/** A folder `notes` holding a manifest of the given text and an `index.html`. */
export const notes = (manifest: string): Record<string, string> => ({
    'notes/app.yml': manifest,
    'notes/index.html': PAGE
});

export type Layout = {
    /** The files of the machine's apps folder, by path under it. */
    machine?: Record<string, string>;
    /** The files of each root, by root key and path under the root. */
    roots?: Record<string, Record<string, string>>;
};

/** The apps `layout` holds read as the watcher reads them, the approved hashes given. */
export function read(
    layout: Layout,
    approved: ReadonlySet<string> = new Set(),
    kept = new Map<string, string>()
) {
    const files: Record<string, string> = {};
    for (const [path, body] of Object.entries(layout.machine ?? {})) {
        files[`machine/${path}`] = body;
    }
    for (const [key, held] of Object.entries(layout.roots ?? {})) {
        for (const [path, body] of Object.entries(held)) files[`roots/${key}/${path}`] = body;
    }
    const base = plantScratch('oculus-apps-manifest-', files, ['machine']);
    const scanned = scanApps({
        machine: { dir: join(base, 'machine'), localFile: join(base, 'local.yml') },
        appearanceFile: join(base, 'appearance.yml'),
        primary: null,
        roots: Object.keys(layout.roots ?? {}).map((key) => ({
            key,
            dir: join(base, 'roots', key)
        })),
        config,
        settings,
        port: PORT,
        approved,
        kept,
        privateFolders: [],
        settingsFile: join(base, 'behavior.yml'),
        ...stateOf(base),
        secret: 'secret',
        appData: join(base, 'data')
    });
    return { base, scanned };
}

/**
 * The same folders read again with the given roots, `apps_dir` and primary hub, for a case that
 * edits them.
 */
export function again(
    base: string,
    machine: string | null,
    roots: { key: string; dir: string }[],
    approved: ReadonlySet<string> = new Set(),
    primary: string | null = null
) {
    return scanApps({
        machine: machine === null ? null : { dir: machine, localFile: join(base, 'local.yml') },
        appearanceFile: join(base, 'appearance.yml'),
        primary,
        roots,
        config,
        settings,
        port: PORT,
        approved,
        kept: new Map(),
        privateFolders: [],
        settingsFile: join(base, 'behavior.yml'),
        ...stateOf(base),
        secret: 'secret',
        appData: join(base, 'data')
    });
}

/** The finding keys and sentences of a read, in order. */
export const found = (layout: Layout) =>
    read(layout).scanned.findings.map((one) => [one.key, one.message] as const);

/** The ids of the apps a read offers. */
export const offered = (layout: Layout) => read(layout).scanned.apps.map((one) => one.id);

/** A finding sentence as the table compares it: a parse failure names a file, so its start is. */
export const plain = (message: string): string =>
    message.startsWith('does not parse') ? 'does not parse' : message;

/** The ids of the apps a layout offers and the findings, as [key, sentence] pairs. */
export const outcome = (layout: Layout) => {
    const { scanned } = read(layout);
    return {
        ids: scanned.apps.map((one) => one.id),
        findings: scanned.findings.map((one) => [one.key, one.message])
    };
};

/** The outcome of an app `notes` that is refused with this finding sentence. */
export const refused = (message: string) => ({ ids: [], findings: [['apps[notes]', message]] });

/** The outcome of an app `notes` that is offered with these finding sentences. */
export const offeredWith = (...messages: string[]) => ({
    ids: ['app:notes'],
    findings: messages.map((message) => ['apps[notes]', message])
});

/** One row of the table: what is read, the outcome observed, and the outcome expected. */
export type Row = [string, () => unknown, unknown];
