// Layer 2, server. The key a paper is filed under in the Literature collection: the first author's
// surname, the year and the first word of the title, each kept to lowercase ASCII letters and
// digits, with `b`, `c` and on appended while the file holds the key already. A paper saved from an
// address alone is keyed by the address's last path word instead. The writer in literature.ts makes
// every key through this module, where the file has just been read, so two saves never compute a
// key from two readings of the file.

import { queryDoi } from '../../../data/prose/literature.ts';

/** The particles a surname keeps in front of its last word, written lower case or capitalised. */
const PARTICLES = [
    'van',
    'von',
    'de',
    'der',
    'den',
    'da',
    'di',
    'du',
    'del',
    'dos',
    'das',
    'la',
    'le',
    'ter',
    'ten'
];

/**
 * A word of one to three capital letters, each with or without a full stop after it, which is how
 * several literature feeds write the given names after a surname: `MM`, `M.` or `M.M.`.
 */
const INITIALS = /^(?:[A-Z]\.?){1,3}$/;

/** A trailing "et al." of a name, in any case, with or without its full stops. */
const ET_AL = /(?:^|\s+)et(?:\.\s*|\s+)al\.?$/i;

/** The combining marks an accented letter leaves after it is decomposed. */
const MARKS = /[\u0300-\u036f]/g;

/** What a key part keeps of a text: its accents stripped, lower case, ASCII letters and digits. */
function keyPart(text: string): string {
    return text
        .normalize('NFKD')
        .replace(MARKS, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

/** Whether a word is a particle of a surname: lower case or capitalised. */
function isParticle(word: string): boolean {
    return PARTICLES.some((one) => word === one || word === one[0].toUpperCase() + one.slice(1));
}

/**
 * The surname of an author name, read after a trailing "et al." is dropped. A name with a comma is
 * "surname, given names"; a name that ends in initials ("Faes A", "Van Hulle MM", "Osei M.") has
 * its surname before them; any other name has its last word, with the particles in front of that
 * word joined to it ("Marc M. Van Hulle", "M. Osei et al."). A name that is only "et al." has none.
 */
function surnameOf(name: string): string {
    const text = name.trim().replace(ET_AL, '');
    const comma = text.indexOf(',');
    if (comma >= 0) return text.slice(0, comma);
    const words = text.split(/\s+/).filter((word) => word !== '');
    if (words.length > 1 && INITIALS.test(words[words.length - 1])) {
        return words.slice(0, -1).join(' ');
    }
    let at = words.length - 1;
    while (at > 0 && isParticle(words[at - 1])) at -= 1;
    return words.slice(at).join(' ');
}

/** The first word of a title that leaves a key part, the empty text for a title with none. */
function firstWord(title: string): string {
    for (const word of title.split(/\s+/)) {
        const part = keyPart(word);
        if (part !== '') return part;
    }
    return '';
}

/** Whether an author list element is a name and not only "et al.". */
function isName(author: string): boolean {
    return author.trim().replace(ET_AL, '') !== '';
}

/**
 * The key of a paper before a suffix: the first author's surname, an element that is only "et al."
 * passed over; `anon` for no author, `nd` for no year, and nothing for a title with no word.
 */
export function citationBase(authors: string[], year: string, title: string): string {
    const first = authors.find(isName);
    const surname = first === undefined ? '' : keyPart(surnameOf(first));
    const when = keyPart(year);
    return `${surname === '' ? 'anon' : surname}${when === '' ? 'nd' : when}${firstWord(title)}`;
}

/** A file extension: a dot and a word that opens with a letter, at the end of a path word. */
const EXTENSION = /\.[A-Za-z][A-Za-z0-9]{0,4}$/;

/** A path with its percent escapes decoded, or as written when an escape is broken. */
function decoded(path: string): string {
    try {
        return decodeURIComponent(path);
    } catch {
        return path;
    }
}

/**
 * The key of an entry saved from an address alone. A DOI gives the part after its last slash; an
 * address gives its last path word with a file extension dropped, else the first label of its
 * host. A text that reads as neither gives its last word after a slash.
 */
export function addressBase(address: string): string {
    const doi = queryDoi(address);
    if (doi !== undefined) return keyPart(doi.slice(doi.lastIndexOf('/') + 1));
    let url: URL | null;
    try {
        url = new URL(address.trim());
    } catch {
        url = null;
    }
    const path = url === null ? address.trim() : decoded(url.pathname);
    const words = path.split('/').filter((word) => word !== '');
    const last = keyPart((words.at(-1) ?? '').replace(EXTENSION, ''));
    if (last !== '' || url === null) return last;
    return keyPart(url.hostname.split('.')[0] ?? '');
}

/**
 * The letters appended to the nth key that is taken: `b` for the first, then `c` and on to `z`,
 * then `ba`, the number written in base 26 with `a` for nought.
 */
function suffixOf(taken: number): string {
    let rest = taken;
    let letters = '';
    while (rest > 0) {
        letters = String.fromCharCode(97 + (rest % 26)) + letters;
        rest = Math.floor(rest / 26);
    }
    return letters;
}

/** The base itself while the file does not hold it, else the base with the first free suffix. */
export function freeKey(base: string, held: ReadonlySet<string>): string {
    if (!held.has(base)) return base;
    for (let taken = 1; ; taken += 1) {
        const key = `${base}${suffixOf(taken)}`;
        if (!held.has(key)) return key;
    }
}
