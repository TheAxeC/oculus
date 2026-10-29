// Layer 2, server. What a reader row's request carries besides its address: the terms of a search
// (the Literature form's, the journal browser's) as the parameters the row's `query` maps them to,
// the row's fixed parameters, the contact address, and the secrets its `auth` names, each read from
// the `downloads` row of that name.
//
// A term is sent only when it is set and the row maps it; its text fills the term's holes as
// written (`{words}`, `{doi}`, `{from}`, `{to}`, `{value}` and their `-1` and `+1`), and the
// parameters are percent-encoded by URLSearchParams when the address is built, so no value
// changes the address's shape. Terms that share a parameter are joined by the row's `join` for it.
// A secret is put only in the header or parameter its `auth` entry names, and the reader hands it
// to nothing else.

import type {
    Auth,
    Credential,
    ReaderRow,
    Term,
    TermName
} from '../../../data/sources/config/settings/rows/grammar.ts';
import { fillText } from '../../../data/sources/config/settings/rows/holes.ts';

/** One `downloads` row: the key an `auth` entry names it by, its user, and its secret. */
export type Account = { service: string; user?: string | undefined; secret: string };

/** The auth of a row applied: the headers and parameters it adds, and what it came from. */
export type Applied = {
    headers: Record<string, string>;
    params: [string, string][];
    /** Whether any entry's `downloads` row is held, for the gap a row keeps with a key. */
    keyed: boolean;
    /** The first required entry whose `downloads` row is missing. */
    missing?: Auth;
    /** The `downloads` row the first applied entry read, and how a download carries it. */
    service?: string;
    credential?: Credential;
};

/**
 * A row's auth entries applied with the `downloads` rows the machine holds. An entry that signs in
 * with a user (`basic: true`) takes no row that holds none, as if the row were missing.
 */
export function applyAuth(auth: Auth[] | undefined, downloads: readonly Account[]): Applied {
    const applied: Applied = { headers: {}, params: [], keyed: false };
    for (const entry of auth ?? []) {
        const held = downloads.find(
            (one) => one.service === entry.row && (entry.basic !== true || one.user !== undefined)
        );
        if (held === undefined) {
            if (entry.required === true && applied.missing === undefined) applied.missing = entry;
            continue;
        }
        applied.keyed = true;
        let credential: Credential | undefined;
        if (entry.basic === true) {
            const pair = Buffer.from(`${held.user}:${held.secret}`).toString('base64');
            applied.headers.authorization = `Basic ${pair}`;
            credential = { basic: true };
        } else if (entry.header !== undefined) {
            applied.headers[entry.header] = `${entry.prefix ?? ''}${held.secret}`;
            credential = {
                header: entry.header,
                ...(entry.prefix === undefined ? {} : { prefix: entry.prefix })
            };
        } else if (entry.param !== undefined) {
            applied.params.push([entry.param, held.secret]);
        }
        if (applied.service === undefined && credential !== undefined) {
            applied.service = entry.row;
            applied.credential = credential;
        }
    }
    return applied;
}

/** The address with the parameters added after its own, each value percent-encoded. */
export function withParams(address: string, params: readonly [string, string][]): string {
    if (params.length === 0) return address;
    const query = new URLSearchParams();
    for (const [name, value] of params) query.append(name, value);
    return `${address}${address.includes('?') ? '&' : '?'}${query.toString()}`;
}

/** The terms of one search, each absent when it is not set. */
export type Terms = {
    words?: string;
    doi?: string;
    years?: { from: number; to: number };
    /** A document type other than `any`, the key of the row's `types` it is asked by. */
    type?: string;
    open_access?: true;
    venue?: string;
    author?: string;
    min_cited?: number;
    issn?: string;
    id?: string;
};

/** The order the terms of a search are read in. */
const SEARCH_TERMS: readonly TermName[] = [
    'words',
    'doi',
    'years',
    'type',
    'open_access',
    'venue',
    'author',
    'min_cited',
    'issn'
];

/** Whether a search sets a term. */
function isSet(terms: Terms, name: TermName): boolean {
    switch (name) {
        case 'years':
            return terms.years !== undefined;
        case 'open_access':
            return terms.open_access === true;
        case 'min_cited':
            return terms.min_cited !== undefined && terms.min_cited > 0;
        default: {
            const value = terms[name];
            return typeof value === 'string' && value !== '';
        }
    }
}

/** The holes a term's text is filled from. */
function holesFor(
    name: TermName,
    terms: Terms,
    value: string | undefined
): (hole: string) => unknown {
    return (hole) => {
        if (hole === 'from') return terms.years?.from;
        if (hole === 'to') return terms.years?.to;
        if (hole === 'words') return name === 'words' ? value : terms.words;
        if (hole === 'doi') return name === 'doi' ? value : terms.doi;
        if (hole === 'value') return value;
        return undefined;
    };
}

/** The default text of a term: its own hole. */
function textOf(name: TermName, term: Term): string {
    if (term.text !== undefined) return term.text;
    return name === 'words' || name === 'doi' ? `{${name}}` : '{value}';
}

/** The words and quoted phrases of a text, each with its quotes. */
function wordsOf(text: string): string[] {
    return [...text.matchAll(/"([^"]+)"|(\S+)/g)].map((found) =>
        found[1] ? `"${found[1]}"` : found[2]
    );
}

/** The value of a set term: the text it is asked by, or undefined when the row cannot ask it. */
function valueOf(row: ReaderRow, name: TermName, terms: Terms): string | undefined {
    switch (name) {
        case 'type':
            return terms.type === undefined ? undefined : row.types?.[terms.type];
        case 'min_cited':
            return terms.min_cited === undefined ? undefined : String(terms.min_cited);
        case 'years':
        case 'open_access':
            return '';
        default:
            return terms[name];
    }
}

/** The texts one term sends: one, one per word with `per_word`, or none when a hole is empty. */
function termTexts(row: ReaderRow, name: TermName, term: Term, terms: Terms): string[] {
    const value = valueOf(row, name, terms);
    if (value === undefined) return [];
    const values = term.per_word === true ? wordsOf(value) : [value];
    return values.flatMap((one) => {
        const text = fillText(textOf(name, term), holesFor(name, terms, one));
        return text === undefined ? [] : [text];
    });
}

/**
 * The parameters the named terms of a search send, those of one parameter joined, then the fixed
 * `params` of each term that is sent.
 */
function paramsOf(row: ReaderRow, names: TermName[], terms: Terms): [string, string][] {
    const grouped = new Map<string, string[]>();
    const fixed: [string, string][] = [];
    for (const name of Object.keys(row.query ?? {}) as TermName[]) {
        if (!names.includes(name) || !isSet(terms, name)) continue;
        const term = row.query?.[name];
        if (term?.param === undefined) continue;
        const texts = termTexts(row, name, term, terms);
        if (texts.length === 0) continue;
        grouped.set(term.param, [...(grouped.get(term.param) ?? []), ...texts]);
        fixed.push(...Object.entries(term.params ?? {}));
    }
    const sent = [...grouped].flatMap(([param, texts]): [string, string][] => {
        const by = row.join?.[param];
        return by === undefined ? texts.map((text) => [param, text]) : [[param, texts.join(by)]];
    });
    return [...sent, ...fixed];
}

/**
 * What a row sends for a search: `skipped` when it sits the search out (a term its `skip_when`
 * lists, a type it does not list under `types_only`, a DOI its `query.doi` cannot ask), a lookup
 * at the address of `query.doi` or `query.issn` with the value it asks by, or the parameters.
 */
export type Asked =
    | { skipped: true }
    | { lookup: 'doi' | 'issn'; term: Term; value: string }
    | { params: [string, string][] };

/** The DOI a row's `query.doi` asks by: the match's group when it names a pattern. */
function doiValue(term: Term, doi: string): string | undefined {
    if (term.match === undefined) return doi;
    const found = new RegExp(term.match).exec(doi);
    return found === null ? undefined : (found.at(1) ?? found[0]);
}

/** What a row sends for one search. */
export function askedOf(row: ReaderRow, terms: Terms): Asked {
    if ((row.skip_when ?? []).some((name) => isSet(terms, name))) return { skipped: true };
    if (
        terms.type !== undefined &&
        row.types_only === true &&
        row.types?.[terms.type] === undefined
    ) {
        return { skipped: true };
    }
    for (const name of ['doi', 'issn'] as const) {
        const asked = terms[name];
        if (asked === undefined) continue;
        const term = row.query?.[name];
        if (term === undefined) return { skipped: true };
        const value = name === 'doi' ? doiValue(term, asked) : asked;
        if (value === undefined) return { skipped: true };
        if (term.address !== undefined) return { lookup: name, term, value };
        return { params: paramsOf(row, [name], { ...terms, [name]: value }) };
    }
    return { params: paramsOf(row, [...SEARCH_TERMS], terms) };
}
