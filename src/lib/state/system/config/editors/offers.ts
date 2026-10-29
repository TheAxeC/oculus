// Layer 2, client state, pure. What a control of the Settings view offers for an option or a field
// of a family: the words a choice or multi may take (its pool), whether a held word is outside
// them, the hue a colour or hue field stands for, and the suggestions of a text, folder or file
// box. The rules of what a held value reads into and what stops a value before it is sent are
// fields.ts.

import { byKey } from '../../../../data/helpers/guards.ts';
import type { BlockList } from '../../../../data/shapes/boards/words.ts';
import {
    classOfHex,
    flagSources,
    hueOfClass,
    listedSources,
    pickedSources,
    type CatalogEntry,
    type Source
} from '../../../../data/sources/config/catalog/options.ts';
import { controlOf, type FieldValue } from './fields.ts';
import type { Lists } from './sources.ts';

// ---- the lists a choice draws from ----------------------------------------------------------

/**
 * The words a choice or multi may take, whether the lists they come from are there yet, and the
 * words and the group each item is drawn under where its source gives them.
 */
export type Pool = {
    items: string[];
    state: 'ready' | 'loading' | 'failed';
    error: string;
    labels: Map<string, string>;
    groups: Map<string, string>;
};

/**
 * Add one source's answer to a pool, with the words and groups the source gives its items: the
 * items the lists narrow it to for the record (`narrow`), else all of them.
 */
function addSource(
    pool: Pool,
    source: Source,
    record: Record<string, FieldValue>,
    lists: Lists
): void {
    const answer = lists.narrow?.(source, record) ?? lists.items(source);
    if (answer.state === 'ready') {
        pool.items.push(...answer.items);
        for (const [item, label] of lists.labels(source)) pool.labels.set(item, label);
        for (const [item, group] of lists.groups(source)) pool.groups.set(item, group);
    } else if (answer.state === 'failed') {
        pool.state = 'failed';
        pool.error = answer.error;
    } else if (pool.state === 'ready') pool.state = 'loading';
}

/**
 * The pool of a choice or multi: its fixed words, the items of every source it draws from, and the
 * items of the source another field of the record names. A word of that field the catalog maps to
 * no source gives no items. The first source still loading or failed decides the pool's state.
 */
export function poolOf(spec: CatalogEntry, record: Record<string, FieldValue>, lists: Lists): Pool {
    const pool: Pool = {
        items: [...(spec.options ?? [])],
        state: 'ready',
        error: '',
        labels: new Map(),
        groups: new Map()
    };
    for (const source of listedSources(spec)) addSource(pool, source, record, lists);
    const picked = pickedSources(spec);
    if (picked !== undefined) {
        const word = record[picked.field];
        const source = typeof word === 'string' ? byKey(picked.sources, word) : undefined;
        if (source !== undefined) addSource(pool, source, record, lists);
    }
    pool.items = [...new Set(pool.items)];
    return pool;
}

/**
 * The pool one list of a word block draws from: for `words` and `not_words` the list the spec's
 * `from` names, for `flags` and `not_flags` the flags of that list (FLAG_SOURCES); a list with no
 * flags gives none.
 */
export function blockPool(spec: CatalogEntry, list: BlockList, lists: Lists): Pool {
    if (list === 'words' || list === 'not_words') return poolOf(spec, {}, lists);
    return poolOf({ ...spec, options: [], from: flagSources(spec) }, {}, lists);
}

/** The hue a colour or hue field's held text stands for, or null when it stands for none. */
export function hueOf(spec: CatalogEntry, held: string, lists: Lists): string | null {
    if (controlOf(spec) === 'colour') {
        const name = classOfHex(lists.config, held);
        const hue = name === undefined ? undefined : hueOfClass(name);
        return hue !== undefined && lists.hues.includes(hue) ? hue : null;
    }
    return lists.hues.includes(held) ? held : null;
}

/**
 * Whether a held word is outside the list its control offers, which the view marks: null while the
 * list is not there yet, since nothing is known of it.
 */
export function isStray(
    spec: CatalogEntry,
    held: string,
    record: Record<string, FieldValue>,
    lists: Lists
): boolean | null {
    if (held === '') return false;
    switch (controlOf(spec)) {
        case 'glyph':
            return !lists.glyphs.includes(held);
        case 'hue':
        case 'colour':
            return hueOf(spec, held, lists) === null;
        case 'choice':
        case 'multi': {
            const pool = poolOf(spec, record, lists);
            if (pool.state !== 'ready') return null;
            return !pool.items.includes(held);
        }
        default:
            return false;
    }
}

// ---- suggestions for a folder, file or text box ----------------------------------------------

/** What a box offers: the suggestions, and a note while the list is not there. */
export type Offer = {
    items: string[];
    note: 'loading' | 'failed' | null;
    /** The reason, for a failed list. */
    error: string;
};

/** Whether a text box suggests from a source: its `from` names one and no value is held to it. */
export function suggests(spec: CatalogEntry): boolean {
    return controlOf(spec) === 'text' && listedSources(spec).length > 0;
}

/** The offer of a text box whose spec names a source. */
function sourceOffer(spec: CatalogEntry, lists: Lists): Offer {
    if (!suggests(spec)) return { items: [], note: null, error: '' };
    const [suggested] = listedSources(spec);
    const answer = lists.items(suggested);
    if (answer.state === 'ready') return { items: answer.items, note: null, error: '' };
    return {
        items: [],
        note: answer.state === 'failed' ? 'failed' : 'loading',
        error: answer.state === 'failed' ? answer.error : ''
    };
}

/**
 * What a text, folder or file box offers for the text typed: the items of its source, or for a
 * folder or file the entries of the hub folder typed so far (folders only for a folder), each as
 * the path that would be written.
 */
export function offerFor(spec: CatalogEntry, text: string, lists: Lists): Offer {
    const control = controlOf(spec);
    if (control !== 'folder' && control !== 'file') return sourceOffer(spec, lists);
    if (text.startsWith('/') || text.includes('\\')) return { items: [], note: null, error: '' };
    const cut = text.lastIndexOf('/');
    const parent = cut < 0 ? '' : text.slice(0, cut);
    const folder = lists.folder(parent);
    if (folder.state === 'loading') return { items: [], note: 'loading', error: '' };
    if (folder.state === 'failed') return { items: [], note: 'failed', error: folder.error };
    const base = cut < 0 ? '' : `${text.slice(0, cut)}/`;
    const items = folder.entries
        .filter((entry) => control === 'file' || entry.kind === 'dir')
        .map(
            (entry) =>
                `${base}${entry.name}${control === 'file' && entry.kind === 'dir' ? '/' : ''}`
        )
        .sort((left, right) => left.localeCompare(right));
    return { items, note: null, error: '' };
}
