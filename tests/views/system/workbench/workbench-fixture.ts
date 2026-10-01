// Layer 4, test fixture. What the workbench view suites share: the real config with its catalog and
// glyphs installed, a client that has had that config delivered on its channel, which is where the
// Views catalogue and the Settings view read the groups, the documents and the rail list from, and
// a client whose file browser answers the config folder's texts from a map, recording every name
// the view asked for.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { setAppearance } from '../../../../src/lib/state/shared/words/appearance.ts';
import type { FileText } from '../../../../src/lib/state/sources/fs-transport.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';

export const config = loadConfig(engineDir()).config;

export const catalog = textCatalog(config);

setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setAppearance(config);

/** A fresh client holding the real config, as a page holds it once the first push has landed. */
export function configured(): ClientState {
    const client = createClientState();
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: catalog, findings: [] }
    });
    return client;
}

/** The catalog's words for a key, with its arguments put in; a key the catalog lacks throws. */
export function words(key: string, ...args: (string | number)[]): string {
    const held = catalog[key] as string | undefined;
    if (held === undefined) throw new Error(`the text catalog has no key ${key}`);
    return args.reduce<string>((text, arg, at) => text.replace(`{${at}}`, String(arg)), held);
}

/** A file text as the fs store answers it once it has been read. */
export function read(text: string): FileText {
    return { text, truncated: false, error: '', loading: false };
}

/** A file text still being read, which is what the store answers until the request lands. */
export const READING: FileText = { text: '', truncated: false, error: '', loading: true };

/** The text of each tracked config file as the repository ships it. */
export function shippedTexts(): Record<string, FileText> {
    const names = ['appearance.yml', 'behavior.yml', 'layout.yml', 'present.yml', 'sources.yml'];
    return Object.fromEntries(
        names.map((name) => [name, read(readFileSync(join(engineDir(), 'config', name), 'utf8'))])
    );
}

/** What the file browser double records. */
export type FileLog = { asked: string[]; refreshed: { root: string; version: number }[] };

/**
 * The client with its file browser answering `files` by name, as the Config view's suite does it:
 * a name the map lacks is still being read, and every name asked of `fileText` is recorded.
 */
export function withFiles(
    client: ClientState,
    files: Record<string, FileText>,
    log: FileLog
): ClientState {
    return {
        ...client,
        fs: {
            ...client.fs,
            fileText: (_root: string, name: string) => {
                log.asked.push(name);
                return files[name] ?? READING;
            },
            refresh: (root: string, version: number) => {
                log.refreshed.push({ root, version });
            }
        }
    };
}
