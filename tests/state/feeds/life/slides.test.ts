// Layer 4, state test. The Slides view's own state: what the file says, one tick, one move, the
// state a pane holds, and the line the status region shows for each answer the endpoint gives.

import { describe, expect, it } from 'vitest';
import {
    catalogSignature,
    fileState,
    parseSlidesState,
    saveMessage,
    savedState,
    withMove,
    withTick,
    slidesInOrder
} from '../../../../src/lib/state/feeds/life/slides.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/words/text.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

const KEYS = ['title', 'framing:engine', 'alpha', 'delta', 'closing'];

/** Every key but the archived project's, which is what a deck with no selection shows. */
const OPEN = ['title', 'framing:engine', 'alpha', 'closing'];

describe('fileState', () => {
    it('ticks the slides a deck with no saved selection shows, and no others', () => {
        expect(fileState(KEYS, null, OPEN)).toEqual({ order: KEYS, picked: OPEN });
    });

    it('lists an archived slide the deck does not show, unticked', () => {
        expect(fileState(KEYS, null, OPEN).order).toContain('delta');
        expect(fileState(KEYS, null, OPEN).picked).not.toContain('delta');
    });

    it('ticks the saved selection alone, in the catalog order rather than the saved one', () => {
        expect(fileState(KEYS, ['alpha', 'title'], OPEN)).toEqual({
            order: KEYS,
            picked: ['title', 'alpha']
        });
    });

    it('ticks an archived slide the saved selection names', () => {
        expect(fileState(KEYS, ['title', 'delta'], OPEN).picked).toEqual(['title', 'delta']);
    });

    it('ignores a saved key for a slide the catalog no longer holds', () => {
        expect(fileState(KEYS, ['alpha', 'gone'], OPEN).picked).toEqual(['alpha']);
    });

    it('gives back lists of its own, so a caller cannot write the catalog it was handed', () => {
        const keys = [...KEYS];
        fileState(keys, null, OPEN).order.push('another');
        expect(keys).toEqual(KEYS);
    });
});

describe('catalogSignature', () => {
    it('tells two catalogs apart by their keys and their order', () => {
        expect(catalogSignature(KEYS)).toBe(catalogSignature([...KEYS]));
        expect(catalogSignature(KEYS)).not.toBe(catalogSignature(KEYS.slice(1)));
        expect(catalogSignature(KEYS)).not.toBe(catalogSignature([...KEYS].reverse()));
    });
});

describe('parseSlidesState', () => {
    it('reads a pane state, with the empty defaults for what is missing', () => {
        expect(
            parseSlidesState({ at: 'a\nb', order: ['a', 'b'], picked: ['a'], said: 'hi' })
        ).toEqual({ at: 'a\nb', order: ['a', 'b'], picked: ['a'], said: 'hi' });
        expect(parseSlidesState(undefined)).toEqual({ at: '', order: [], picked: [], said: '' });
        expect(parseSlidesState({ order: [1, 'a'], picked: 'x', at: 2 })).toEqual({
            at: '',
            order: ['a'],
            picked: [],
            said: ''
        });
    });
});

describe('withTick', () => {
    const held = fileState(KEYS, ['title'], OPEN);

    it('unticks a slide and leaves the order alone', () => {
        const next = withTick(fileState(KEYS, null, OPEN), 'alpha', false);
        expect(next.picked).toEqual(['title', 'framing:engine', 'closing']);
        expect(next.order).toEqual(KEYS);
    });

    it('ticks a slide back into its own place in the catalog', () => {
        expect(withTick(held, 'closing', true).picked).toEqual(['title', 'closing']);
        expect(withTick(withTick(held, 'closing', true), 'delta', true).picked).toEqual([
            'title',
            'delta',
            'closing'
        ]);
    });

    it('leaves the picks alone for a key the catalog does not hold', () => {
        expect(withTick(held, 'gone', true)).toBe(held);
    });
});

describe('withMove', () => {
    it('moves one slide and keeps the ticks', () => {
        const next = withMove(fileState(KEYS, ['title'], OPEN), 'alpha', 0);
        expect(next?.order).toEqual(['alpha', 'title', 'framing:engine', 'delta', 'closing']);
        expect(next?.picked).toEqual(['title']);
    });

    it('answers nothing for a move that goes nowhere or off either end', () => {
        const held = fileState(KEYS, null, OPEN);
        expect(withMove(held, 'title', 0)).toBeNull();
        expect(withMove(held, 'title', -1)).toBeNull();
        expect(withMove(held, 'title', KEYS.length)).toBeNull();
        expect(withMove(held, 'gone', 1)).toBeNull();
    });
});

describe('savedState', () => {
    const work = { order: [...KEYS].reverse(), picked: ['title'] };
    const onScreen = catalogSignature(KEYS);

    it('holds a landed save against the catalog its own write produces', () => {
        const held = savedState({ ok: true }, work, onScreen);
        expect(held.at).toBe(catalogSignature(work.order));
        expect(held.order).toEqual(work.order);
        expect(held.said).toBe(catalog['slides.saved']);
    });

    it('keeps a refused save against the catalog on screen, so the work stays and the refusal shows', () => {
        for (const answer of [
            { ok: false, error: 'invalid_order' },
            { ok: false, error: 'unwritable' },
            { ok: false, network: true }
        ]) {
            const held = savedState(answer, work, onScreen);
            expect(held.at).toBe(onScreen);
            expect(held.order).toEqual(work.order);
            expect(held.picked).toEqual(['title']);
            expect(held.said).toBe(saveMessage(answer));
            expect(held.said).not.toBe(catalog['slides.dropped']);
        }
    });
});

describe('saveMessage', () => {
    it('gives the reader a sentence for every answer, and never the wire word', () => {
        expect(saveMessage({ ok: true })).toBe(catalog['slides.saved']);
        expect(saveMessage({ ok: false, error: 'invalid' })).toBe(catalog['slides.failed_invalid']);
        expect(saveMessage({ ok: false, error: 'invalid_order' })).toBe(
            catalog['slides.failed_order']
        );
        expect(saveMessage({ ok: false, error: 'unwritable' })).toBe(catalog['slides.failed_file']);
        expect(saveMessage({ ok: false, error: 'boom', network: true })).toBe(
            catalog['slides.failed_network']
        );
    });

    it('gives the general sentence for a word it does not know', () => {
        for (const error of ['nonesuch', 'HTTP 500', undefined]) {
            const said = saveMessage({ ok: false, error });
            expect(said).toBe(catalog['slides.failed_other']);
            expect(said).not.toContain(String(error));
        }
    });
});

describe('the slides in the deck order', () => {
    // revert: src/lib/state/feeds/life/slides.ts:131 => return row === undefined ? [{ key } as T] : [row];
    it('are the catalog rows by key in the order given, a key the catalog lacks left out', () => {
        const rows = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];
        expect(slidesInOrder(rows, ['c', 'gone', 'a']).map((one) => one.key)).toEqual(['c', 'a']);
    });
});
