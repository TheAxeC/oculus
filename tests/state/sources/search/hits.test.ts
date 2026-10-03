// Layer 4, test. The pure rules of the Search view's results rows: how a hit is named and acted on,
// the keys of the rows and what each asks for, the walk through the texts a box ran, and what a
// tab remembers of a run.
//
// Nothing here draws or reaches the endpoint; the view's own draw is
// tests/views/sources/search.test.ts and the tab's runs and replaces are
// tests/state/sources/search/search.test.ts.

import { describe, expect, it } from 'vitest';
import { emptyQuery } from '../../../../src/lib/data/helpers/search/query.ts';
import { matchOf, ranOf, remembered } from '../../../../src/lib/state/sources/search/search.ts';
import { searchKeymap, searchPlan } from '../../../../src/lib/state/sources/search/keys.ts';
import { createWalk } from '../../../../src/lib/state/sources/search/walk.ts';
import {
    fileKey,
    hitKey,
    replaceRequest,
    replacementShown,
    rowAfter
} from '../../../../src/lib/state/sources/search/hits.ts';
import { A, B, FILES, RAN } from './search-fixture.ts';

describe('the hits the results rows act on', () => {
    it('a hit is named by its place, so two matches of one long line cut to one column are two rows', () => {
        const cut = [
            { line: 1, column: 118, length: 3, text: 'x', at: 505 },
            { line: 1, column: 118, length: 3, text: 'x', at: 611 }
        ];
        const file = { root: 'hub', path: 'l.ts', hits: cut };
        expect(new Set(cut.map((one) => hitKey(file, one))).size).toBe(2);
    });

    it('each hit is sent with the text it covered, and the query the answer was found by', () => {
        expect(replaceRequest(RAN, { replace: 'bar', preserve: true }, [B])).toEqual({
            op: 'replace',
            query: RAN,
            replace: 'bar',
            preserveCase: true,
            items: [{ root: 'hub', path: 'b.ts', hits: [{ line: 2, at: 0, match: 'foo' }] }]
        });
    });

    it('a replacement is shown as the server writes it, a line break as \\n, and none before the groups are known', () => {
        const settings = { replace: 'a\\nb', preserve: false, ran: { ...RAN, regex: true } };
        const grouped = { ...A.hits[0], groups: { '0': 'foo', '1': 'o' } };
        expect(replacementShown(grouped, settings)).toBe('a\\nb');
        expect(replacementShown(A.hits[0], settings)).toBeNull();
        expect(replacementShown(A.hits[0], { ...settings, ran: RAN, replace: 'x$1' })).toBe('x$1');
    });

    it('the focus moves to the row after the rows taken, else the row before them', () => {
        expect(rowAfter(FILES, [{ ...A, hits: [A.hits[1]] }])).toBe(fileKey(B));
        expect(rowAfter(FILES, [B])).toBe(hitKey(A, A.hits[1]));
        expect(rowAfter(FILES, [A, B])).toBe('');
    });
});

describe('the keys of the results rows', () => {
    it('Cmd+Shift+1, Cmd+Shift+Enter and Cmd+Backspace are bound on macOS, with Delete on the other platforms', () => {
        const chord = (code: string, action: string, over: Record<string, boolean>) => ({
            code,
            action,
            meta: false,
            ctrl: false,
            alt: false,
            shift: false,
            ...over
        });
        expect(searchKeymap(true)).toEqual([
            chord('Digit1', 'replace', { meta: true, shift: true }),
            chord('Enter', 'replace-file', { meta: true, shift: true }),
            chord('Backspace', 'dismiss', { meta: true })
        ]);
        expect(searchKeymap(false)).toEqual([
            chord('Digit1', 'replace', { ctrl: true, shift: true }),
            chord('Enter', 'replace-file', { ctrl: true, shift: true }),
            chord('Delete', 'dismiss', {})
        ]);
    });

    it('a row replaces only while the replace row is shown, and dismisses on every row', () => {
        expect(searchPlan('replace', 'hit', true)).toBe('replace-hit');
        expect(searchPlan('replace', 'file', true)).toBe('replace-file');
        expect(searchPlan('replace-file', 'file', true)).toBe('replace-file');
        expect(searchPlan('replace-file', 'hit', true)).toBe('pass');
        for (const action of ['replace', 'replace-file'] as const) {
            expect(searchPlan(action, 'hit', false)).toBe('pass');
            expect(searchPlan(action, 'file', false)).toBe('pass');
        }
        expect(searchPlan('dismiss', 'hit', false)).toBe('dismiss-hit');
        expect(searchPlan('dismiss', 'file', false)).toBe('dismiss-file');
    });
});

describe('walking the texts a box ran', () => {
    const texts = ['third', 'second', 'first'];

    it('Up goes older, Down goes newer, and past the newest the text being typed comes back', () => {
        const walk = createWalk();
        expect(walk.older(texts, 'typing')).toBe('third');
        expect(walk.older(texts, 'third')).toBe('second');
        expect(walk.newer(texts)).toBe('third');
        expect(walk.newer(texts)).toBe('typing');
        expect(walk.newer(texts)).toBeNull();
    });

    it('the walk stops at the oldest text, has nothing to walk with no texts, and starts again after a reset', () => {
        const walk = createWalk();
        expect(walk.older([], 'typing')).toBeNull();
        for (const _ of texts) walk.older(texts, '');
        expect(walk.older(texts, 'first')).toBeNull();
        walk.reset();
        expect(walk.older(texts, 'new')).toBe('third');
    });
});

describe('what a tab remembers of a run', () => {
    it('the text goes first, an earlier copy is taken out, and no empty text is kept', () => {
        expect(remembered(['b', 'a'], 'a')).toEqual(['a', 'b']);
        expect(remembered(['b', 'a'], '')).toEqual(['b', 'a']);
        expect(remembered([], 'x')).toEqual(['x']);
    });

    it('the twenty newest texts are kept', () => {
        const texts = Array.from({ length: 80 }, (_, at) => `t${String(at)}`);
        const kept = remembered(texts, 'new');
        expect(kept).toHaveLength(20);
        expect(kept.slice(0, 2)).toEqual(['new', 't0']);
    });

    it('the query half a replace is made over is named without the root and the cap', () => {
        const query = { ...emptyQuery(500), q: 'foo', word: true, regex: true, under: 'src' };
        expect(ranOf(query)).toEqual({
            q: 'foo',
            word: true,
            case: false,
            regex: true,
            under: 'src'
        });
    });

    it('the text a hit matched is read from group 0 when the window cut it, else from the window', () => {
        const hit = { line: 1, column: 3, length: 3, text: 'a foo b', at: 2 };
        expect(matchOf(hit)).toBe('foo');
        expect(matchOf({ ...hit, groups: { '0': 'the whole match' } })).toBe('the whole match');
    });
});
