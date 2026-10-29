// Layer 1, data. The `{name}` holes of a reader row's texts and addresses, and the values that fill
// them. The reader fills a request's address, parameters, headers and body through this module,
// and the page fills a `links` address through it too, so a hole means one thing on both sides.
//
// A hole is `{name}`, `{name|op}` with one of HOLE_OPS, or `{name-1}` and `{name+1}`, the number
// the value is with one taken off or added. A text fills each hole with the value as written; an
// address fills each hole encoded for the part it stands in: before the `?` one path segment (so a
// `/`, `?`, `#` or a space in the value never changes the address's shape, and an empty, `.` or
// `..` segment is refused), after it a query component. The operation `path` fills several path
// segments, each encoded, joined by `/`. A hole whose value is missing, or is no text, number or
// flag, leaves the whole text unfilled, and the caller reads that as the value being absent.

/** The operations a hole may name. */
export const HOLE_OPS = [
    'quote',
    'plain',
    'bare',
    'phrase',
    'spaced',
    'series',
    'path',
    'last'
] as const;

/** One hole of a text: the name it reads, the number added to it, and its operation. */
export type Hole = { name: string; add: number; op?: string };

/** What a hole's name reads: a value, or undefined when nothing is held under the name. */
export type Lookup = (name: string) => unknown;

/** A hole as written, with the name, the number and the operation captured. */
const HOLE = /\{([^{}|+-]+?)(?:([+-]\d+))?(?:\|([a-z_]+))?\}/g;

/** The holes of a text, in their order. */
export function holesOf(text: string): Hole[] {
    return [...text.matchAll(HOLE)].map((found) => {
        const add = found.at(2);
        const op = found.at(3);
        return {
            name: found[1].trim(),
            add: add === undefined ? 0 : Number(add),
            ...(op === undefined ? {} : { op })
        };
    });
}

/** Whether a text holds a hole. */
export function hasHoles(text: string): boolean {
    return holesOf(text).length > 0;
}

/**
 * A value as its text, the text a hole is filled with: a text, or a number or flag written as
 * one; undefined for anything else.
 */
export function valueText(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value === 'boolean') return String(value);
    return undefined;
}

/** A series folder: the accession with its last three digits written `nnn` (GSE12345 GSE12nnn). */
function series(text: string): string | undefined {
    const found = /^([A-Za-z]+)(\d+)$/.exec(text);
    if (found === null) return undefined;
    const head = found[2].length > 3 ? found[2].slice(0, -3) : '';
    return `${found[1]}${head}nnn`;
}

/** A text with its double quotes made spaces and its runs of white space made one space. */
function plain(text: string): string {
    return text.replace(/"/g, ' ').replace(/\s+/g, ' ').trim();
}

/** The text a hole's operation makes of a value, or undefined when the operation refuses it. */
function operated(text: string, op: string | undefined): string | undefined {
    switch (op) {
        case undefined:
        case 'path':
            return text;
        case 'quote':
            return text.replace(/"/g, '');
        case 'plain':
            return plain(text);
        case 'bare':
            return text.replace(/["[\]()]/g, '');
        case 'phrase': {
            const words = plain(text);
            return /\s/.test(words) ? `"${words}"` : words;
        }
        case 'spaced':
            return text.replace(/,/g, ' ');
        case 'series':
            return series(text);
        case 'last':
            return text.split('/').pop();
        default:
            return undefined;
    }
}

/** A hole's value as its text: the value read, the number added, the operation applied. */
function holeText(hole: Hole, values: Lookup): string | undefined {
    const text = valueText(values(hole.name));
    if (text === undefined) return undefined;
    if (hole.add === 0) return operated(text, hole.op);
    const number = Number(text);
    if (text.trim() === '' || !Number.isInteger(number)) return undefined;
    return operated(String(number + hole.add), hole.op);
}

/** One path segment encoded, or undefined for a segment that would change the path's shape. */
function segment(text: string): string | undefined {
    if (text === '' || text === '.' || text === '..') return undefined;
    return encodeURIComponent(text);
}

/** A hole's text encoded for the address part it stands in, or undefined when it is refused. */
function encoded(text: string, op: string | undefined, inQuery: boolean): string | undefined {
    if (inQuery) return encodeURIComponent(text);
    if (op !== 'path') return segment(text);
    const parts = text.split('/').map(segment);
    return parts.every((part) => part !== undefined) ? parts.join('/') : undefined;
}

/**
 * A text with every hole filled by `values`, each value as written; undefined when a hole's value
 * is missing or its operation refuses it.
 */
export function fillText(text: string, values: Lookup): string | undefined {
    let missing = 0;
    const filled = text.replace(HOLE, (...found: string[]) => {
        const hole = holesOf(found[0])[0];
        const value = holeText(hole, values);
        if (value === undefined) missing += 1;
        return value ?? '';
    });
    return missing > 0 ? undefined : filled;
}

/**
 * An address with every hole filled by `values`, each value encoded for its part: a path segment
 * before the `?`, a query component after it. Undefined when a hole's value is missing, its
 * operation refuses it, or it would fill a path segment that is empty, `.` or `..`.
 */
export function fillAddress(address: string, values: Lookup): string | undefined {
    const query = address.indexOf('?');
    let missing = 0;
    const filled = address.replace(HOLE, (...found: unknown[]) => {
        const at = found.at(-2) as number;
        const hole = holesOf(found[0] as string)[0];
        const value = holeText(hole, values);
        const part =
            value === undefined ? undefined : encoded(value, hole.op, query >= 0 && at > query);
        if (part === undefined) missing += 1;
        return part ?? '';
    });
    return missing > 0 ? undefined : filled;
}

/**
 * The origin an address is written with: the scheme and host before the first `/` after `//`.
 * Empty for an address with no `//`.
 */
export function originOf(address: string): string {
    const start = address.indexOf('//');
    if (start < 0) return '';
    const end = address.indexOf('/', start + 2);
    return end < 0 ? address : address.slice(0, end);
}
