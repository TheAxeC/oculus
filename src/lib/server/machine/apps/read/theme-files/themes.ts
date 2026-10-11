// Layer 2, server. The colour theme and icon theme files of an app: read as VS Code writes them
// (JSON with comments and trailing commas), a colour theme with its `include` chain applied.
//
// A colour theme file names the file it extends with `include`, a path relative to itself. The
// chain is followed inside the app's recorded files alone: a path that leaves the app folder, names
// a file the app does not hold or closes a cycle ends the chain with a flaw. The includer's keys
// win over the included file's, and the included file's `tokenColors` come first, as VS Code
// resolves them. `semanticTokenColors` is not read, since the editor colours semantic tokens from
// the TextMate rules. A theme whose file cannot be resolved, and an icon theme whose file is no
// object with `iconDefinitions`, are left out of the app's `contributes` with a finding by
// `checkThemes`; the scan runs it after the manifest was read, so a theme the page is offered is
// one that resolves.

import { readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { findingText, type TextCatalog } from '../../../../../data/helpers/finding-text.ts';
import { isMap } from '../../../../../data/helpers/guards.ts';
import type { AppContributes, Finding } from '../../../../../data/model/index.ts';

/** The most files an `include` chain may hold. */
const MAX_CHAIN = 8;

/** A colour theme with its `include` chain applied. */
type ResolvedTheme = { colors: Record<string, string>; tokenColors: unknown[] };

/** Why a theme file could not be read: the file at fault and what is wrong with it. */
type ThemeFlaw =
    | { kind: 'unreadable'; file: string; why: string }
    | { kind: 'include'; file: string; included: string };

/** What the read of a theme file came to. */
export type ThemeRead = { ok: true; theme: ResolvedTheme } | { ok: false; flaw: ThemeFlaw };

/** JSON text with the comments and trailing commas VS Code's files allow taken out. */
function plainJson(text: string): string {
    let out = '';
    let at = 0;
    while (at < text.length) {
        const char = text[at];
        const next = text[at + 1];
        if (char === '"') {
            let end = at + 1;
            while (end < text.length && text[end] !== '"') end += text[end] === '\\' ? 2 : 1;
            out += text.slice(at, end + 1);
            at = end + 1;
        } else if (char === '/' && next === '/') {
            while (at < text.length && text[at] !== '\n') at += 1;
        } else if (char === '/' && next === '*') {
            const end = text.indexOf('*/', at + 2);
            at = end < 0 ? text.length : end + 2;
        } else {
            out += char;
            at += 1;
        }
    }
    return out.replace(/,(\s*[}\]])/g, '$1');
}

/** The value a JSON-with-comments file holds, or the reason it does not parse. */
export function readJsonc(folder: string, path: string): { value: unknown } | { why: string } {
    try {
        return {
            value: JSON.parse(plainJson(readFileSync(join(folder, path), 'utf8'))) as unknown
        };
    } catch (error) {
        return { why: error instanceof Error ? error.message.split('\n')[0] : String(error) };
    }
}

/**
 * The path an `include` names, relative to the file that holds it, or null when it leaves the app.
 */
export function includedPath(from: string, include: string): string | null {
    const joined = posix.normalize(posix.join(posix.dirname(from), include));
    const segments = joined.split('/');
    if (joined.startsWith('/') || segments.some((one) => one === '..' || one.startsWith('.'))) {
        return null;
    }
    return joined;
}

/** A theme file of an app with its `include` chain applied. */
export function resolveTheme(
    folder: string,
    files: ReadonlySet<string>,
    path: string,
    chain: string[] = []
): ThemeRead {
    const flawed = (why: string): ThemeRead => ({
        ok: false,
        flaw: { kind: 'unreadable', file: path, why }
    });
    if (!files.has(path)) return flawed('not a file of the app');
    const read = readJsonc(folder, path);
    if ('why' in read) return flawed(read.why);
    if (!isMap(read.value)) return flawed('not an object');
    const data = read.value;
    const listed = data.tokenColors ?? [];
    if (!Array.isArray(listed)) return flawed('tokenColors is no list');
    const own: unknown[] = listed;
    const colors = data.colors ?? {};
    if (!isMap(colors)) return flawed('colors is no object');
    let included: ResolvedTheme = { colors: {}, tokenColors: [] };
    if (data.include !== undefined) {
        const target = typeof data.include === 'string' ? includedPath(path, data.include) : null;
        const named =
            typeof data.include === 'string' ? data.include : JSON.stringify(data.include);
        if (target === null || !files.has(target) || chain.includes(target)) {
            return { ok: false, flaw: { kind: 'include', file: path, included: named } };
        }
        if (chain.length + 1 >= MAX_CHAIN) {
            return { ok: false, flaw: { kind: 'include', file: path, included: named } };
        }
        const below = resolveTheme(folder, files, target, [...chain, path]);
        if (!below.ok) return below;
        included = below.theme;
    }
    return {
        ok: true,
        theme: {
            colors: { ...included.colors, ...(colors as Record<string, string>) },
            tokenColors: [...included.tokenColors, ...own]
        }
    };
}

/** What `checkThemes` is given. */
export type ThemeCheck = {
    folder: string;
    files: ReadonlySet<string>;
    contributes: AppContributes;
    catalog: TextCatalog;
    /** The key and file the findings are about. */
    key: string;
    file: string;
};

/**
 * The app's `contributes` with each colour theme that does not resolve and each icon theme that is
 * no object with `iconDefinitions` taken out, and a finding for each.
 */
export function checkThemes(check: ThemeCheck): {
    contributes: AppContributes;
    findings: Finding[];
} {
    const { folder, files, catalog, key, file } = check;
    const findings: Finding[] = [];
    const note = (message: string): void => {
        findings.push({ file, key, message });
    };
    const themes = check.contributes.themes.filter((theme) => {
        const read = resolveTheme(folder, files, theme.path);
        if (read.ok) return true;
        const { flaw } = read;
        note(
            flaw.kind === 'include'
                ? findingText(
                      catalog,
                      'findings.apps.theme_include',
                      theme.label,
                      flaw.file,
                      flaw.included
                  )
                : findingText(
                      catalog,
                      'findings.apps.theme_unreadable',
                      theme.label,
                      flaw.file,
                      flaw.why
                  )
        );
        return false;
    });
    const iconThemes = check.contributes.iconThemes.filter((icons) => {
        const read = files.has(icons.path)
            ? readJsonc(folder, icons.path)
            : { why: 'not a file of the app' };
        if ('value' in read && isMap(read.value) && isMap(read.value.iconDefinitions)) return true;
        const why = 'why' in read ? read.why : 'it holds no iconDefinitions object';
        note(
            findingText(
                catalog,
                'findings.apps.icon_theme_unreadable',
                icons.label,
                icons.path,
                why
            )
        );
        return false;
    });
    return { contributes: { ...check.contributes, themes, iconThemes }, findings };
}
