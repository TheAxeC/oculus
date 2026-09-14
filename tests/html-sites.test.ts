// Every place the app writes raw HTML into the page draws one of three things: the output of
// ui/html.ts's sanitise, one line of inline Markdown (inlineMarkdown sanitises what it renders), or
// a string from config/text/, which oculus wrote for itself. A site that draws anything else is
// listed below by file and expression with the reason it is safe, or this test fails. Adding a
// {@html} to a view is therefore a choice a reader of this file can see.

import {
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    statSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const LIB = resolve(fileURLToPath(import.meta.url), '..', '..', 'src', 'lib');

/** The calls whose result is filtered already. A site is one of these, a catalog line, or named below. */
const FILTERED = ['sanitise(', 'inlineMarkdown('];

/** The sites that draw neither, each with why its HTML cannot carry anything but its own markup. */
const ALLOWED: Record<string, string> = {
    'views/source/Editor.svelte:painted':
        'state/highlight.ts escapes every & < > of the file text before it emits its own fixed span classes, so the mirror holds no markup the file could put there.'
};

function svelteFiles(at: string, prefix = ''): string[] {
    const found: string[] = [];
    for (const name of readdirSync(at)) {
        const path = join(at, name);
        const rel = prefix === '' ? name : `${prefix}/${name}`;
        if (statSync(path).isDirectory()) found.push(...svelteFiles(path, rel));
        else if (name.endsWith('.svelte')) found.push(rel);
    }
    return found;
}

/** The expression of every {@html ...} in one file, with the braces inside it balanced. */
export function htmlSites(source: string): string[] {
    const code = source
        .split('\n')
        .map((line) => (line.trimStart().startsWith('//') ? '' : line))
        .join('\n');
    const sites: string[] = [];
    const opener = /\{@html\s/g;
    for (const match of code.matchAll(opener)) {
        let depth = 1;
        let at = match.index + match[0].length;
        const from = at;
        while (at < code.length && depth > 0) {
            if (code[at] === '{') depth += 1;
            if (code[at] === '}') depth -= 1;
            at += 1;
        }
        sites.push(code.slice(from, at - 1).trim());
    }
    return sites;
}

/**
 * Whether the whole expression is that one call: it opens with the call's name and the bracket that
 * closes the call is the last character, so a call with something concatenated onto it is loose.
 */
function isCall(site: string, call: string): boolean {
    if (!site.startsWith(call)) return false;
    let depth = 0;
    for (let at = call.length - 1; at < site.length; at += 1) {
        if (site[at] === '(') depth += 1;
        if (site[at] === ')') depth -= 1;
        if (depth === 0) return at === site.length - 1;
    }
    return false;
}

/** The arguments of a call, split where a comma sits outside every bracket and every quote. */
function argumentsOf(site: string, call: string): string[] {
    const inside = site.slice(call.length, -1);
    const args: string[] = [];
    let depth = 0;
    let quote = '';
    let from = 0;
    for (let at = 0; at < inside.length; at += 1) {
        const character = inside[at];
        if (quote !== '') {
            if (character === quote) quote = '';
        } else if (character === '"' || character === "'" || character === '`') {
            quote = character;
        } else if ('([{'.includes(character)) depth += 1;
        else if (')]}'.includes(character)) depth -= 1;
        else if (character === ',' && depth === 0) {
            args.push(inside.slice(from, at).trim());
            from = at + 1;
        }
    }
    args.push(inside.slice(from).trim());
    return args;
}

/**
 * One quoted string and nothing else: it opens and closes with the same quote and nothing follows
 * the closing one, so a value concatenated onto a literal is a value. A backtick holds `${...}` and
 * is a value.
 */
function isLiteral(argument: string): boolean {
    return /^(['"])(?:\\.|(?!\1).)*\1$/.test(argument);
}

/**
 * A catalog string is oculus's own words, so `t(...)` is drawn as it is; a value handed to it is
 * not, so every argument after the key is a literal or has been through one of the two calls.
 */
function isCatalogLine(site: string): boolean {
    if (!isCall(site, 't(')) return false;
    const args = argumentsOf(site, 't(');
    if (!isLiteral(args[0])) return false;
    return args
        .slice(1)
        .every(
            (one) => isLiteral(one) || isCall(one, 'inlineMarkdown(') || isCall(one, 'sanitise(')
        );
}

/** Every site under one folder that is neither filtered nor named in the list above. */
export function unfilteredSites(root: string): string[] {
    const loose: string[] = [];
    for (const file of svelteFiles(root)) {
        for (const site of htmlSites(readFileSync(join(root, file), 'utf8'))) {
            if (isCatalogLine(site)) continue;
            if (FILTERED.some((call) => isCall(site, call))) continue;
            if (ALLOWED[`${file}:${site}`] !== undefined) continue;
            loose.push(`${file}: ${site}`);
        }
    }
    return loose.sort();
}

describe('every {@html} site', () => {
    it('draws the sanitiser, inline Markdown, the catalog, or a named exception', () => {
        expect(unfilteredSites(LIB)).toEqual([]);
    });

    it('is one of the sites this file knows about', () => {
        const counted = svelteFiles(LIB).flatMap((file) =>
            htmlSites(readFileSync(join(LIB, file), 'utf8'))
        );
        expect(counted.length).toBeGreaterThanOrEqual(36);
    });

    it('carries a reason with every exception', () => {
        for (const [site, reason] of Object.entries(ALLOWED)) {
            expect(site).toMatch(/^[\w./-]+\.svelte:.+$/);
            expect(reason.length).toBeGreaterThan(40);
        }
    });

    it('names no exception that has gone from the tree', () => {
        const live = svelteFiles(LIB).flatMap((file) =>
            htmlSites(readFileSync(join(LIB, file), 'utf8')).map((site) => `${file}:${site}`)
        );
        expect(Object.keys(ALLOWED).filter((named) => !live.includes(named))).toEqual([]);
    });

    it('catches a site that draws a value nothing filtered', () => {
        const dir = mkdtempSync(join(tmpdir(), 'oculus-html-sites-'));
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        const write = (rel: string, body: string) => {
            const full = join(dir, rel);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, body);
        };
        write('views/Good.svelte', '<p>{@html sanitise(one)}</p>\n<p>{@html t("a.b")}</p>\n');
        write('views/Inline.svelte', '<p>{@html inlineMarkdown(entry.note)}</p>\n');
        write('views/Bad.svelte', '<p>{@html feed.title}</p>\n');
        write('views/Joined.svelte', "<p>{@html t('a.b') + feed.title}</p>\n");
        write('views/Filled.svelte', "<p>{@html t('a.b', feed.title)}</p>\n");
        write('views/Woven.svelte', "<p>{@html t('a.b', `${feed.title}`)}</p>\n");
        write('views/Glued.svelte', "<p>{@html t('a.b', 'x' + feed.title)}</p>\n");
        write('views/Held.svelte', "<p>{@html t('a.b', inlineMarkdown(feed.title))}</p>\n");
        write('views/Sneaky.svelte', '<p>{@html `${head} ${tail}`}</p>\n');
        expect(unfilteredSites(dir)).toEqual([
            'views/Bad.svelte: feed.title',
            "views/Filled.svelte: t('a.b', feed.title)",
            "views/Glued.svelte: t('a.b', 'x' + feed.title)",
            "views/Joined.svelte: t('a.b') + feed.title",
            'views/Sneaky.svelte: `${head} ${tail}`',
            "views/Woven.svelte: t('a.b', `${feed.title}`)"
        ]);
    });
});
