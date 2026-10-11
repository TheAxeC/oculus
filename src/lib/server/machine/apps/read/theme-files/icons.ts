// Layer 2, server. The file icon theme file of an app, ready for the page. The file is read as VS
// Code writes it and answered as it is, with one change: every path to a picture (`iconPath` of a
// definition) and to a font file (`path` of a font's `src`) is a path relative to the theme file,
// and is answered as the address the app's file is served at, so the page needs no knowledge of
// where an app's files lie. A path that leaves the app folder, names a file the app does not
// hold, or is a hidden file is left out, and the definition or font source that held it draws
// nothing.

import { posix } from 'node:path';
import { isMap } from '../../../../../data/helpers/guards.ts';
import { includedPath, readJsonc } from './themes.ts';

/** What the read of an icon theme file came to: the theme, or why it cannot be read. */
export type IconRead = { ok: true; theme: Record<string, unknown> } | { ok: false; why: string };

/** The address an app file is served at, or null for a path the app does not serve. */
function addressOf(
    from: string,
    path: unknown,
    files: ReadonlySet<string>,
    address: string
): string | null {
    if (typeof path !== 'string') return null;
    const target = includedPath(from, path);
    if (target === null || !files.has(target)) return null;
    return address + target.split('/').map(encodeURIComponent).join('/');
}

/** The definitions with each `iconPath` turned into an address, and without one that has none. */
function definitionsOf(
    definitions: Record<string, unknown>,
    from: string,
    files: ReadonlySet<string>,
    address: string
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [id, one] of Object.entries(definitions)) {
        if (!isMap(one)) continue;
        const { iconPath, ...rest } = one;
        const served = iconPath === undefined ? null : addressOf(from, iconPath, files, address);
        if (iconPath !== undefined && served === null) continue;
        out[id] = served === null ? rest : { ...rest, iconPath: served };
    }
    return out;
}

/**
 * The fonts with each source's `path` turned into an address, and without a source that has none.
 */
function fontsOf(
    fonts: unknown,
    from: string,
    files: ReadonlySet<string>,
    address: string
): unknown[] {
    if (!Array.isArray(fonts)) return [];
    return fonts.flatMap((font): unknown[] => {
        if (!isMap(font)) return [];
        const sources = (Array.isArray(font.src) ? font.src : []).flatMap((one): unknown[] => {
            if (!isMap(one)) return [];
            const served = addressOf(from, one.path, files, address);
            return served === null ? [] : [{ ...one, path: served }];
        });
        return [{ ...font, src: sources }];
    });
}

/**
 * An icon theme file of an app with its paths turned into addresses. `address` is the address of
 * the app up to and including its key (data/helpers/files/apps/apps.ts `appAddress`), `path` the
 * theme file's path in the app.
 */
export function resolveIconTheme(
    folder: string,
    files: ReadonlySet<string>,
    path: string,
    address: string
): IconRead {
    if (!files.has(path)) return { ok: false, why: 'not a file of the app' };
    const read = readJsonc(folder, path);
    if ('why' in read) return { ok: false, why: read.why };
    if (!isMap(read.value) || !isMap(read.value.iconDefinitions)) {
        return { ok: false, why: 'it holds no iconDefinitions object' };
    }
    const from = posix.normalize(path);
    return {
        ok: true,
        theme: {
            ...read.value,
            iconDefinitions: definitionsOf(read.value.iconDefinitions, from, files, address),
            fonts: fontsOf(read.value.fonts, from, files, address)
        }
    };
}
