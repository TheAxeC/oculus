// The canonical form of a search: the arguments each option combination runs as, the inputs that
// are refused before anything runs, the window one hit's line is cut to, and the parameters the
// page writes and the server reads.
//
// Nothing here starts a process: this is the rule both sides share, so it is read on its own.

import { describe, expect, it } from 'vitest';
import {
    ALL_ROOTS,
    emptyQuery,
    MAX_QUERY,
    clampMax,
    queryFrom,
    refusalOf,
    rootsOf,
    searchArgs,
    searchCap,
    searchParams,
    pathIn,
    perFileCount,
    searchQuery,
    searchUrl,
    trimAround,
    type SearchQuery
} from '../../../src/lib/data/helpers/search.ts';

const ROOTS = ['hub', 'engine', 'cathedra'];

/** A query with everything at its default, and whatever a case wants instead. */
function query(changes: Partial<SearchQuery> = {}): SearchQuery {
    return { ...emptyQuery(500), q: 'needle', ...changes };
}

describe('the argument list', () => {
    it('reads the pattern as text, ignoring case, when no option is on', () => {
        expect(searchArgs(query())).toEqual([
            '--json',
            '--max-count',
            '501',
            '--max-filesize',
            '2M',
            '--glob',
            '!node_modules',
            '--glob',
            '!.git',
            '--glob',
            '!.svelte-kit',
            '--fixed-strings',
            '--ignore-case',
            '--regexp',
            'needle',
            '.'
        ]);
    });

    it('adds the word boundary for word, and keeps the pattern one argument', () => {
        const args = searchArgs(query({ word: true }));
        expect(args).toContain('--word-regexp');
        expect(args.at(-3)).toBe('--regexp');
        expect(args.at(-2)).toBe('needle');
        expect(args.at(-1)).toBe('.');
    });

    it('matches the pattern case for case', () => {
        expect(searchArgs(query({ case: true }))).toContain('--case-sensitive');
        expect(searchArgs(query({ case: true }))).not.toContain('--ignore-case');
    });

    it('drops the fixed-strings flag for regex, and keeps it for every other combination', () => {
        expect(searchArgs(query({ regex: true }))).not.toContain('--fixed-strings');
        expect(searchArgs(query({ word: true, case: true }))).toContain('--fixed-strings');
    });

    it('carries all three options together', () => {
        const args = searchArgs(query({ word: true, case: true, regex: true, q: 'fo+' }));
        expect(args).toEqual([
            '--json',
            '--max-count',
            '501',
            '--max-filesize',
            '2M',
            '--glob',
            '!node_modules',
            '--glob',
            '!.git',
            '--glob',
            '!.svelte-kit',
            '--word-regexp',
            '--case-sensitive',
            '--regexp',
            'fo+',
            '.'
        ]);
    });

    it('passes a pattern that opens with a dash as the pattern it is', () => {
        expect(searchArgs(query({ q: '--help' })).at(-2)).toBe('--help');
    });
});

describe('the per-file count', () => {
    it('asks for one match past the cap, so a file cut short sends a record with no room', () => {
        expect(perFileCount(500)).toBe(501);
        expect(searchArgs(query({ max: 3 }))[2]).toBe('4');
    });
});

describe('what is refused', () => {
    it('refuses an empty query and one that is only spaces', () => {
        expect(refusalOf(query({ q: '' }), ROOTS)).toBe('empty');
        expect(refusalOf(query({ q: '   ' }), ROOTS)).toBe('empty');
    });

    it('refuses a query longer than the bound and allows one exactly at it', () => {
        expect(refusalOf(query({ q: 'x'.repeat(MAX_QUERY + 1) }), ROOTS)).toBe('too_long');
        expect(refusalOf(query({ q: 'x'.repeat(MAX_QUERY) }), ROOTS)).toBeNull();
    });

    it('refuses a root the list does not hold, and allows every root it does', () => {
        expect(refusalOf(query({ root: 'elsewhere' }), ROOTS)).toBe('unknown_root');
        expect(refusalOf(query({ root: 'hub' }), ROOTS)).toBeNull();
        expect(refusalOf(query({ root: ALL_ROOTS }), ROOTS)).toBeNull();
    });

    it('answers a plan rather than arguments for a refused query', () => {
        expect(searchQuery(query({ q: '' }), ROOTS)).toEqual({ ok: false, refused: 'empty' });
        const plan = searchQuery(query(), ROOTS);
        expect(plan.ok && plan.args.at(-2)).toBe('needle');
    });
});

describe('which roots a query runs over', () => {
    const list = ROOTS.map((key) => ({ key, dir: `/${key}` }));

    it('runs over every root for the all key and over one for a named root', () => {
        expect(rootsOf(query(), list)).toHaveLength(3);
        expect(rootsOf(query({ root: 'engine' }), list)).toEqual([
            { key: 'engine', dir: '/engine' }
        ]);
    });
});

describe('the hit window', () => {
    it('leaves a short line as it is, without its newline', () => {
        expect(trimAround('a needle here\n', 3, 6)).toEqual({ text: 'a needle here', column: 3 });
    });

    it('keeps the match in view in a long line and moves the column with it', () => {
        const line = `${'a'.repeat(400)}needle${'b'.repeat(400)}`;
        const cut = trimAround(line, 401, 6, 240);
        expect(cut.text).toHaveLength(240);
        expect(cut.text.slice(cut.column - 1, cut.column - 1 + 6)).toBe('needle');
    });

    it('keeps the window inside the line when the match is at its end', () => {
        const line = `${'a'.repeat(400)}needle`;
        const cut = trimAround(line, 401, 6, 240);
        expect(cut.text).toHaveLength(240);
        expect(cut.text.slice(cut.column - 1)).toBe('needle');
    });
});

describe('the path a hit carries', () => {
    it('drops the leading dot-slash ripgrep prints against the directory it was given', () => {
        expect(pathIn('./src/a.ts')).toBe('src/a.ts');
        expect(pathIn('src/a.ts')).toBe('src/a.ts');
    });
});

describe('the parameters', () => {
    it('writes what queryFrom reads back, both ways round', () => {
        const held = query({ q: 'a b', root: 'hub', word: true, regex: true, max: 20 });
        expect(queryFrom(searchParams(held), 500)).toEqual(held);
    });

    it('escapes the pattern into the address rather than into the path', () => {
        expect(searchUrl(query({ q: 'a&b=c' }))).toContain('q=a%26b%3Dc');
    });

    it('takes the cap for a max that is absent, zero or beyond it', () => {
        expect(queryFrom(new URLSearchParams(), 500).max).toBe(500);
        expect(queryFrom(new URLSearchParams({ max: '0' }), 500).max).toBe(500);
        expect(queryFrom(new URLSearchParams({ max: '9000' }), 500).max).toBe(500);
        expect(queryFrom(new URLSearchParams({ max: '20' }), 500).max).toBe(20);
    });

    it('opens on every root and on no option when the request names none', () => {
        expect(queryFrom(new URLSearchParams({ q: 'x' }), 500)).toEqual({
            q: 'x',
            root: ALL_ROOTS,
            word: false,
            case: false,
            regex: false,
            max: 500,
            under: ''
        });
    });

    it('holds the cap between one and the configured number', () => {
        expect(clampMax(Number.NaN, 500)).toBe(500);
        expect(clampMax(7.9, 500)).toBe(7);
    });
});

describe('the configured cap', () => {
    it('reads max_hits and answers zero for a configuration that has not arrived', () => {
        expect(searchCap({ search: { max_hits: 120 } })).toBe(120);
        expect(searchCap({})).toBe(0);
        expect(searchCap({ search: { max_hits: 'many' } })).toBe(0);
    });
});

describe('the folder a search is scoped to', () => {
    const held = (changes: Partial<SearchQuery> = {}): SearchQuery => ({
        ...query(),
        under: '',
        ...changes
    });

    it('opens a fresh query on the whole root', () => {
        expect(emptyQuery(500).under).toBe('');
    });

    it('ends the arguments with the folder as ./<under>, and with . for the whole root', () => {
        const scoped = searchArgs(held({ under: 'src/lib' }));
        expect(scoped.slice(-3)).toEqual(['--regexp', 'needle', './src/lib']);
        const whole = searchArgs(held());
        expect(whole.slice(-3)).toEqual(['--regexp', 'needle', '.']);
    });

    it('refuses a folder that climbs out or is absolute, and any folder with every root', () => {
        for (const under of ['../x', 'a/../../x', '..', '/etc', '\\etc']) {
            expect({ under, why: refusalOf(held({ under, root: 'hub' }), ROOTS) }).toEqual({
                under,
                why: 'outside'
            });
        }
        expect(refusalOf(held({ under: 'src', root: ALL_ROOTS }), ROOTS)).toBe('outside');
        expect(refusalOf(held({ under: '', root: ALL_ROOTS }), ROOTS)).toBeNull();
        expect(refusalOf(held({ under: 'src/lib', root: 'hub' }), ROOTS)).toBeNull();
    });

    it('answers a plan with the refusal for a folder that climbs out', () => {
        expect(searchQuery(held({ under: '../x', root: 'hub' }), ROOTS)).toEqual({
            ok: false,
            refused: 'outside'
        });
    });

    it('writes under into the parameters and reads it back, and reads a request without it as the whole root', () => {
        const scoped = held({ q: 'a b', root: 'hub', under: 'src/lib', max: 20 });
        expect(queryFrom(searchParams(scoped), 500)).toEqual(scoped);
        expect(queryFrom(new URLSearchParams({ q: 'x' }), 500).under).toBe('');
    });
});

describe('the hit cap read from a configuration of the wrong shape', () => {
    it.each([
        [{ search: [] }, 0],
        [{ search: 'x' }, 0],
        [{ search: { max_hits: '5' } }, 0],
        [{ search: { max_hits: 2.7 } }, 2],
        [{ search: { max_hits: Number.POSITIVE_INFINITY } }, 0],
        [{ search: { max_hits: Number.NaN } }, 0],
        [{ search: { max_hits: 0 } }, 0],
        [{ search: { max_hits: -3 } }, 0]
    ])('reads %j as %j', (config, cap) => {
        expect(searchCap(config)).toBe(cap);
    });
});
