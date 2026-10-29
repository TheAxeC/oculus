// Layer 2, server. Where a reading stands in its row's paging, what one page asks with, and where
// the next page is: by an `offset` or a `page` number in a parameter, by a `cursor` the answer
// names (sent in a parameter, or in the body with `in: body`), by the `next` address the answer
// names, or by the `Link` header's next address. A page of an offset or a page number that holds
// fewer records than were asked ends the paging, as does a count the answer states that the pages
// read reach; an address the answer names is followed only on the origin of the row's own address.
//
// A page a reader asks for again (the Literature search's next page) is written as a token: the
// offset for `offset`, the page's place from 0 for `page`, and `<offset>|<cursor or address>` for
// the other kinds.

import type { Paging, ReaderRow } from '../../../data/sources/config/settings/rows/grammar.ts';
import { originOf } from '../../../data/sources/config/settings/rows/holes.ts';
import { readPath, scalarText } from './path.ts';

/** Where a reading stands: the records read before this page, its place, what it is asked by. */
export type PageState = { offset: number; index: number; token?: string; next?: string };

/** The first page of any paging. */
export const FIRST: PageState = { offset: 0, index: 0 };

/** The page size a row asks with: the size asked, at most `max`; for a listing its first size. */
export function sizeOf(paging: Paging | undefined, asked?: number): number | undefined {
    if (paging === undefined) return undefined;
    const size = asked ?? paging.sizes?.[0];
    if (size === undefined) return undefined;
    return paging.max === undefined ? size : Math.min(size, paging.max);
}

/** The parameters a page is asked with, and the value its cursor puts in the body. */
export function pageParams(
    paging: Paging | undefined,
    state: PageState,
    size: number | undefined
): { params: [string, string][]; body?: [string, string] } {
    if (paging === undefined) return { params: [] };
    const params: [string, string][] = [];
    const sized = (): void => {
        if (paging.size !== undefined && size !== undefined)
            params.push([paging.size, String(size)]);
    };
    switch (paging.kind) {
        case 'offset':
            if (paging.param !== undefined) params.push([paging.param, String(state.offset)]);
            sized();
            return { params };
        case 'page':
            if (paging.param !== undefined) {
                params.push([paging.param, String(state.index + (paging.first ?? 0))]);
            }
            sized();
            return { params };
        case 'cursor': {
            const cursor = state.token ?? paging.start;
            sized();
            if (cursor === undefined || paging.param === undefined) return { params };
            if (paging.in === 'body') return { params, body: [paging.param, cursor] };
            return { params: [[paging.param, cursor], ...params] };
        }
        case 'next':
        case 'link':
            if (state.next === undefined) sized();
            return { params };
    }
}

/** The next address a `Link` header names. */
function linkNext(header: string | null): string | undefined {
    if (header === null) return undefined;
    for (const part of header.split(',')) {
        const found = /<([^>]+)>\s*;\s*rel="?next"?/.exec(part);
        if (found !== null) return found[1];
    }
    return undefined;
}

/** What a page's answer says of the next page: the answer, its headers, its records and count. */
export type PageAnswer = {
    tree: unknown;
    headers: Headers;
    /** How many records the page held. */
    got: number;
    /** The count of records the answer states, null when it states none. */
    total: number | null;
};

/**
 * The next page after `state`, null when the paging ends, or `answer` for an address the answer
 * names off the row's origin.
 */
export function nextPage(
    row: ReaderRow,
    paging: Paging | undefined,
    state: PageState,
    size: number | undefined,
    page: PageAnswer
): PageState | null | 'answer' {
    if (paging === undefined) return null;
    const offset = state.offset + page.got;
    const reached = page.total !== null && offset >= page.total;
    switch (paging.kind) {
        case 'offset':
        case 'page':
            if (page.got === 0 || size === undefined || page.got < size || reached) return null;
            return { offset, index: state.index + 1 };
        case 'cursor': {
            const token =
                paging.from === undefined
                    ? undefined
                    : scalarText(readPath(page.tree, paging.from));
            if (token === undefined || token === '' || token === state.token) return null;
            if (page.got === 0 || reached) return null;
            return { offset, index: state.index + 1, token };
        }
        case 'next':
        case 'link': {
            const next =
                paging.kind === 'link'
                    ? linkNext(page.headers.get('link'))
                    : paging.from === undefined
                      ? undefined
                      : scalarText(readPath(page.tree, paging.from));
            if (next === undefined || next === '') return null;
            if (originOf(next) !== originOf(row.address ?? '')) return 'answer';
            return { offset, index: state.index + 1, next };
        }
    }
}

/** A page's token, as the reader asks for it again. */
export function tokenOf(paging: Paging | undefined, state: PageState): string {
    switch (paging?.kind) {
        case 'page':
            return String(state.index);
        case 'cursor':
            return `${String(state.offset)}|${state.token ?? ''}`;
        case 'next':
        case 'link':
            return `${String(state.offset)}|${state.next ?? ''}`;
        default:
            return String(state.offset);
    }
}

/**
 * A page token read back, or null when it is not one of the row's paging; `size` is the page size
 * asked, which places a page number's first record.
 */
export function pageOfToken(row: ReaderRow, token: string | null, size: number): PageState | null {
    if (token === null) return FIRST;
    const paging = row.paging;
    switch (paging?.kind) {
        case undefined:
            return null;
        case 'offset':
            return /^\d{1,9}$/.test(token) ? { offset: Number(token), index: 0 } : null;
        case 'page':
            return /^\d{1,9}$/.test(token)
                ? { offset: Number(token) * size, index: Number(token) }
                : null;
        case 'cursor': {
            if (!/^[\x20-\x7e]{1,200}$/.test(token)) return null;
            const held = /^(\d{1,9})\|(.+)$/.exec(token);
            return held === null
                ? { offset: 0, index: 0, token }
                : { offset: Number(held[1]), index: 0, token: held[2] };
        }
        case 'next':
        case 'link': {
            const held = /^(\d{1,9})\|(https:\/\/\S+)$/.exec(token);
            if (held === null || originOf(held[2]) !== originOf(row.address ?? '')) return null;
            return { offset: Number(held[1]), index: 0, next: held[2] };
        }
    }
}
