// Layer 1, data tests. The canonical form of a search: the arguments each option combination runs
// as, the inputs that are refused before anything runs, the window one hit's line is cut to, and
// the parameters the page writes and the server reads.
//
// Nothing here starts a process: this is the rule both sides share, so it is read on its own.

import { describe, expect, it } from 'vitest';
import {
    ALL_ROOTS,
    emptyQuery,
    fileArgs,
    clampMax,
    queryFrom,
    refusalOf,
    rootsOf,
    searchCap,
    pathIn,
    searchQuery,
    searchUrl,
    trimAround,
    type SearchQuery
} from '../../../src/lib/data/helpers/search/query.ts';

const ROOTS = ['hub', 'engine', 'cathedra'];

/** The longest pattern a query may carry. */
const LONGEST_QUERY = 1000;

/** A query with everything at its default, and whatever a case wants instead. */
function query(changes: Partial<SearchQuery> = {}): SearchQuery {
    return { ...emptyQuery(500), q: 'needle', ...changes };
}

/** The parameters of the address a query is fetched at, as the server reads them. */
function sentParameters(held: SearchQuery): URLSearchParams {
    return new URL(searchUrl(held), 'http://localhost').searchParams;
}

/** The argument list a query runs as, which is what the plan of an accepted query holds. */
function argsOf(held: SearchQuery): string[] {
    const plan = searchQuery(held, ROOTS);
    if (!plan.ok) throw new Error(`refused: ${plan.refused}`);
    return plan.args;
}

describe('the argument list', () => {
    it('reads the pattern as text, ignoring case, when no option is on', () => {
        expect(argsOf(query())).toEqual([
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

    it.each([
        ['word', { word: true }, ['--word-regexp', '--fixed-strings', '--ignore-case'], []],
        ['case', { case: true }, ['--case-sensitive', '--fixed-strings'], ['--ignore-case']],
        ['regex', { regex: true }, ['--ignore-case'], ['--fixed-strings']],
        [
            'word and case without regex',
            { word: true, case: true },
            ['--word-regexp', '--case-sensitive', '--fixed-strings'],
            ['--ignore-case']
        ]
    ])('sets the flags of %s', (_row, changes, present, absent) => {
        const args = argsOf(query(changes));
        for (const flag of present) expect(args).toContain(flag);
        for (const flag of absent) expect(args).not.toContain(flag);
        expect(args.slice(-3)).toEqual(['--regexp', 'needle', '.']);
    });

    it('carries all three options together', () => {
        const args = argsOf(query({ word: true, case: true, regex: true, q: 'fo+' }));
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
            '--replace',
            '\ue0020\ue003${0}',
            '--regexp',
            'fo+',
            '.'
        ]);
    });

    it('hands a regular expression its group template and a literal search none', () => {
        const template = argsOf(query({ regex: true, q: '(a)(?<n>b)' }));
        expect(template[template.indexOf('--replace') + 1]).toBe(
            '\ue0020\ue003${0}\ue0021\ue003${1}\ue0022\ue003${2}\ue002n\ue003${n}'
        );
        expect(argsOf(query({ q: '(a)' }))).not.toContain('--replace');
    });

    it('names one file to ripgrep and asks for every match of it, with no cap or skipped folder', () => {
        expect(fileArgs(query({ q: 'a.b' }), 'src/a b.ts')).toEqual([
            '--json',
            '--fixed-strings',
            '--ignore-case',
            '--regexp',
            'a.b',
            './src/a b.ts'
        ]);
    });
});

describe('what is refused', () => {
    it.each([
        ['an empty query', { q: '' }, 'empty'],
        ['a query of only spaces', { q: '   ' }, 'empty'],
        ['a query longer than the bound', { q: 'x'.repeat(LONGEST_QUERY + 1) }, 'too_long'],
        ['a query exactly at the bound', { q: 'x'.repeat(LONGEST_QUERY) }, null],
        ['a root the list does not hold', { root: 'elsewhere' }, 'unknown_root'],
        ['a root the list holds', { root: 'hub' }, null],
        ['every root', { root: ALL_ROOTS }, null],
        ['a folder that climbs out', { under: '../x', root: 'hub' }, 'outside'],
        ['a folder that climbs from inside', { under: 'a/../../x', root: 'hub' }, 'outside'],
        ['a folder that is two dots', { under: '..', root: 'hub' }, 'outside'],
        ['an absolute folder', { under: '/etc', root: 'hub' }, 'outside'],
        ['a folder written with a backslash', { under: '\\etc', root: 'hub' }, 'outside'],
        ['a folder with every root', { under: 'src', root: ALL_ROOTS }, 'outside'],
        ['no folder with every root', { under: '', root: ALL_ROOTS }, null],
        ['a folder inside a root', { under: 'src/lib', root: 'hub' }, null]
    ])('answers %s with %s', (_row, changes, refusal) => {
        expect(refusalOf(query(changes), ROOTS)).toBe(refusal);
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
    it.each([
        ['the leading dot-slash ripgrep prints against the directory it was given', './src/a.ts'],
        ['a path with none', 'src/a.ts']
    ])('drops %s', (_row, path) => {
        expect(pathIn(path)).toBe('src/a.ts');
    });
});

describe('the parameters', () => {
    it('writes what queryFrom reads back, both ways round', () => {
        const held = query({ q: 'a b', root: 'hub', word: true, regex: true, max: 20 });
        expect(queryFrom(sentParameters(held), 500)).toEqual(held);
    });

    it('escapes the pattern into the address rather than into the path', () => {
        expect(searchUrl(query({ q: 'a&b=c' }))).toContain('q=a%26b%3Dc');
    });

    it.each([
        ['absent', {}, 500],
        ['zero', { max: '0' }, 500],
        ['beyond it', { max: '9000' }, 500],
        ['inside it', { max: '20' }, 20]
    ])('takes the cap for a max that is %s', (_row, given, max) => {
        expect(queryFrom(new URLSearchParams(given), 500).max).toBe(max);
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

    it.each([
        ['not a number', Number.NaN, 500],
        ['a fraction', 7.9, 7]
    ])('holds the cap between one and the configured number for %s', (_row, asked, held) => {
        expect(clampMax(asked, 500)).toBe(held);
    });
});

describe('the folder a search is scoped to', () => {
    const held = (changes: Partial<SearchQuery> = {}): SearchQuery => ({
        ...query(),
        under: '',
        ...changes
    });

    it('ends the arguments with the folder as ./<under>, and with . for the whole root', () => {
        const scoped = argsOf(held({ under: 'src/lib', root: 'hub' }));
        expect(scoped.slice(-3)).toEqual(['--regexp', 'needle', './src/lib']);
        const whole = argsOf(held());
        expect(whole.slice(-3)).toEqual(['--regexp', 'needle', '.']);
    });

    it('answers a plan with the refusal for a folder that climbs out', () => {
        expect(searchQuery(held({ under: '../x', root: 'hub' }), ROOTS)).toEqual({
            ok: false,
            refused: 'outside'
        });
    });

    it('writes under into the parameters and reads it back, and reads a request without it as the whole root', () => {
        const scoped = held({ q: 'a b', root: 'hub', under: 'src/lib', max: 20 });
        expect(queryFrom(sentParameters(scoped), 500)).toEqual(scoped);
        expect(queryFrom(new URLSearchParams({ q: 'x' }), 500).under).toBe('');
    });
});

describe('the configured cap', () => {
    it.each([
        [{ search: { max_hits: 120 } }, 120],
        [{}, 0],
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
