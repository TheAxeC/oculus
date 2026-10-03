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
 * The client with its file browser answering `files` by name, as the Settings suites do it:
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

/** The shipped text of one tracked file with one line replaced. */
export function shippedWith(name: string, from: string, to: string): Record<string, FileText> {
    const files = shippedTexts();
    const text = files[name].text;
    if (!text.includes(from)) throw new Error(`${name} has no ${from}`);
    return { ...files, [name]: read(text.replace(from, to)) };
}

/** The markup of one item, from its opening tag to the next item or group. */
export function itemOf(body: string, id: string): string {
    const open = new RegExp(
        `<[a-z0-9]+[^>]*data-setting="${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`
    );
    const from = body.search(open);
    if (from < 0) return '';
    const inside = from + (open.exec(body.slice(from))?.[0].length ?? 1);
    const rest = body.slice(inside);
    const ends = [rest.search(/data-setting="/), rest.search(/data-settings-group="/)].filter(
        (at) => at >= 0
    );
    return body.slice(from, ends.length === 0 ? body.length : inside + Math.min(...ends));
}

/** The markup of one group, from its opening to the next group. */
export function groupOf(body: string, id: string): string {
    const from = body.indexOf(`data-settings-group="${id}"`);
    if (from < 0) return '';
    const next = body.indexOf('data-settings-group="', from + 10);
    return body.slice(from, next < 0 ? body.length : next);
}

/** The opening tag of the button carrying these words as its accessible name or label. */
export function buttonNamed(body: string, label: string): string {
    return (
        [...body.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)]
            .map(([one]) => one)
            .find((one) => one.includes(`aria-label="${label}"`) || one.includes(`>${label}<`)) ??
        ''
    );
}

/** The client and the file log a Settings suite draws over, new for each case. */
export function freshSuite(): { client: ClientState; log: FileLog } {
    return { client: configured(), log: { asked: [], refreshed: [] } };
}
