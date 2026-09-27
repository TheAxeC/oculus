// Every place the app writes raw HTML into the page draws one of three things: the output of
// ui/html.ts's sanitise, sanitiseSvg or sanitiseGraph, one line of inline Markdown (inlineMarkdown
// sanitises what it renders), or a string from config/text/, which oculus wrote for itself. A site
// that draws anything else is listed below by file and expression with the reason it is safe, or
// this test fails. Adding a {@html} to a view is therefore a choice a reader of this file can see.

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { byKey } from '../../../src/lib/data/helpers/guards.ts';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const LIB = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', 'src', 'lib');

/**
 * The calls whose result is filtered already. A site is one of these, a catalog line, or named
 * below.
 */
const FILTERED = ['sanitise(', 'sanitiseSvg(', 'sanitiseGraph(', 'inlineMarkdown('];

/** The sites that draw neither, each with why its HTML cannot carry anything but its own markup. */
const ALLOWED: Record<string, string> = {
    'views/shared/prose/Intro.svelte:drawn(html)':
        'drawn() sanitises unless the caller marked the content trusted, and the trusted Intro sites are checked one by one below: each must hand over a catalog line with literal arguments, so a hub value never reaches this site unfiltered.',
    'views/shared/prose/Intro.svelte:drawn(line)':
        'drawn() sanitises unless the caller marked the content trusted, and the trusted Intro sites are checked one by one below: each must hand over a catalog line with literal arguments, so a hub value never reaches this site unfiltered.',
    'views/sources/source/Code.svelte:painted':
        'highlight.js escapes every & < > of the file text before it emits its own fixed span classes, so the code window holds no markup the file could put there.',
    'views/academic/present/parts/Words.svelte:html':
        "words() and body() render the slide field through ui/html.ts, which sanitises what it renders; only the KaTeX markup they put back is unfiltered, and that is KaTeX's own output over escaped source with trust off.",
    'views/academic/present/parts/Equation.svelte:tex(slide.equation, true)':
        "tex() is KaTeX's own markup over escaped source with trust off, so the slide's LaTeX reaches the page as text nodes and the elements around them are KaTeX's; the sanitiser would drop the style attributes that position them.",
    'views/academic/present/Panel.svelte:diagram':
        "the panel's diagram markup is put through sanitiseDiagram() where it is derived, one line above the site: the ordinary profile with `style` added, because a diagram is a grid of boxes whose columns and per-box colour are written on the elements themselves and the ordinary profile would keep the boxes and throw the diagram away. Every other rule of the profile stands, so no handler, script or frame survives; what the profile does not check is the style value itself, so a url() written there is fetched by the browser, which is a slide author's own doing.",
    'views/sources/source/Editor.svelte:painted':
        'highlight.js escapes every & < > of the file text before it emits its own fixed span classes, so the mirror holds no markup the file could put there.'
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
            if (byKey(ALLOWED, `${file}:${site}`) !== undefined) continue;
            loose.push(`${file}: ${site}`);
        }
    }
    return loose.sort();
}

/**
 * Every `<Intro ... >` element of one file, as the text between the tag's name and the `>` that
 * closes it, with the braces of its attribute expressions balanced so a `>` inside one is not the
 * end of the tag.
 */
export function introTags(source: string): string[] {
    const tags: string[] = [];
    for (const match of source.matchAll(/<Intro(?=[\s/>])/g)) {
        let at = match.index + match[0].length;
        const from = at;
        let depth = 0;
        let quote = '';
        while (at < source.length) {
            const character = source[at];
            if (quote !== '') {
                if (character === quote) quote = '';
            } else if (character === '"' || character === "'" || character === '`') {
                quote = character;
            } else if ('([{'.includes(character)) depth += 1;
            else if (')]}'.includes(character)) depth -= 1;
            else if (character === '>' && depth === 0) break;
            at += 1;
        }
        tags.push(source.slice(from, at));
    }
    return tags;
}

/**
 * Whether the tag carries the `trusted` prop in any form: the bare attribute, or set to any
 * expression at all, since a prop set to a variable is a site that may be trusted at run time and
 * is judged by its words like the rest.
 */
export function isTrusted(tag: string): boolean {
    return /(^|\s)trusted(\s|$|=)/.test(tag);
}

/** The expression one attribute of a tag is given, with its braces balanced, or null for none. */
export function attributeOf(tag: string, name: string): string | null {
    const opener = new RegExp(`(?:^|\\s)${name}=\\{`);
    const found = opener.exec(tag);
    if (found === null) return null;
    let at = found.index + found[0].length;
    const from = at;
    let depth = 1;
    while (at < tag.length && depth > 0) {
        if (tag[at] === '{') depth += 1;
        if (tag[at] === '}') depth -= 1;
        at += 1;
    }
    return tag.slice(from, at - 1).trim();
}

/**
 * Whether one expression handed to a trusted Intro is the catalog's own words and nothing else:
 * `t('key')` with literal arguments, or that call through inlineMarkdown. Anything interpolating a
 * value is not, whatever the value is, because nothing here can tell a count from a hub string.
 */
export function isTrustedArgument(argument: string): boolean {
    const held = argument.trim();
    if (isCall(held, 'inlineMarkdown(')) {
        const inner = argumentsOf(held, 'inlineMarkdown(');
        return inner.length === 1 && isCatalogLine(inner[0]);
    }
    return isCatalogLine(held);
}

/** Every trusted Intro site under one folder whose words are not a catalog line, by file. */
export function looseTrustedIntros(root: string): string[] {
    const loose: string[] = [];
    for (const file of svelteFiles(root)) {
        for (const tag of introTags(readFileSync(join(root, file), 'utf8'))) {
            if (!isTrusted(tag)) continue;
            const given = [attributeOf(tag, 'html'), attributeOf(tag, 'lines')].filter(
                (words): words is string => words !== null
            );
            if (given.length > 0 && given.every(isTrustedArgument)) continue;
            loose.push(`${file}: ${given.join(' | ') || tag.trim()}`);
        }
    }
    return loose.sort();
}

describe('every {@html} site', () => {
    it('draws the sanitiser, inline Markdown, the catalog, or a named exception', () => {
        // revert: tests/checks/source/html-sites.test.ts "const FILTERED = ['sanitise(', 'sanitiseSvg(', 'sanitiseGraph(', 'inlineMarkdown('];" => const FILTERED = ['sanitise(', 'sanitiseSvg(', 'inlineMarkdown('];
        expect(unfilteredSites(LIB)).toEqual([]);
    });

    it('is one of the sites this file knows about', () => {
        const counted = svelteFiles(LIB).flatMap((file) =>
            htmlSites(readFileSync(join(LIB, file), 'utf8'))
        );
        expect(counted.length).toBeGreaterThanOrEqual(34);
    });

    it('marks as catalog text only an Intro whose words are a catalog line', () => {
        expect(looseTrustedIntros(LIB)).toEqual([]);
    });

    it('finds the trusted Intro sites there are, so the check above is not vacuous', () => {
        const trusted = svelteFiles(LIB).flatMap((file) =>
            introTags(readFileSync(join(LIB, file), 'utf8')).filter(isTrusted)
        );
        expect(trusted.length).toBeGreaterThanOrEqual(3);
    });

    it('refuses an Intro marked trusted over words that interpolate a value', () => {
        expect(isTrustedArgument("t('venues.intro')")).toBe(true);
        expect(isTrustedArgument("inlineMarkdown(t('domains.intro'))")).toBe(true);
        expect(isTrustedArgument("t('leads.intro', 'one', 'two')")).toBe(true);
        expect(isTrustedArgument("t('leads.intro', live.length, '')")).toBe(false);
        expect(isTrustedArgument("`${t('radar.intro_head')} ${t('radar.intro_tail', run)}`")).toBe(
            false
        );
        expect(isTrustedArgument('data.intro')).toBe(false);
    });

    it('judges a trusted prop set to an expression by its words rather than skipping the site', () => {
        expect(isTrusted("trusted html={t('a')}")).toBe(true);
        expect(isTrusted("trusted={true} html={t('a')}")).toBe(true);
        expect(isTrusted("trusted={hidden} html={t('a')}")).toBe(true);
        expect(isTrusted("html={t('a')}")).toBe(false);
        expect(isTrusted("untrusted html={t('a')}")).toBe(false);
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
        const dir = scratchDir('oculus-html-sites-');
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
