// Layer 2, server, pure. The keys of a deck's `present.yml` the Slides view sets beside its lists,
// as the `deck-slides` write names them (deck.ts): `deck.title`, `defaults.tag_tones`, and a
// group's `find`, `sort` and `discover`, each by its path from the top of the file. Which paths a
// write may name, the values each takes (`config/schemas/deck-schema.yml` gives their meaning, and
// data/sources/deck/spec.ts is the reader they must read back through), and the record a change of
// one leaves: keyed by the map that holds it (`deck`, `defaults` or `groups.<group>`) with the
// key's own name as its field, so a record of a key is told from a group's list (`slides`) and the
// order (`order`) by its field.

import { isMap } from '../../../../../../data/helpers/guards.ts';
import { words } from '../../../../../core/words.ts';

/** The fields a record of a key carries. */
export const KEY_FIELDS = ['title', 'tag_tones', 'find', 'sort', 'discover'] as const;

/** One key's field. */
type KeyField = (typeof KEY_FIELDS)[number];

/** The keys a group holds that a write may set. */
const GROUP_KEYS: readonly string[] = ['find', 'sort', 'discover'];

/** The lists a group's `find:` takes beside `folders`. */
const FIND_LISTS = ['tiers', 'stages', 'forms', 'status'];

/** The field of a path a write may set, or null for a path it may not. */
function keyField(path: readonly string[]): KeyField | null {
    const [top, second, third] = path;
    if (path.length === 2 && top === 'deck' && second === 'title') return 'title';
    if (path.length === 2 && top === 'defaults' && second === 'tag_tones') return 'tag_tones';
    if (path.length === 3 && top === 'groups' && GROUP_KEYS.includes(third)) {
        return third as KeyField;
    }
    return null;
}

/** The key a record of the path is filed under: the map that holds the key. */
export function recordKey(path: readonly string[]): string {
    return path[0] === 'groups' ? `groups.${path[1]}` : path[0];
}

/** The path a record of a key names, from its key and its field. */
export function recordPath(key: string, field: string): string[] {
    return key.startsWith('groups.')
        ? ['groups', key.slice('groups.'.length), field]
        : [key, field];
}

/** Whether a value is a list of texts. */
function texts(value: unknown): boolean {
    return Array.isArray(value) && value.every((one) => typeof one === 'string');
}

/** Whether a value is what a group's `find:` takes. */
function findValue(value: unknown): boolean {
    if (!isMap(value)) return false;
    const folders = value.folders;
    const named =
        (typeof folders === 'string' && folders !== '') ||
        (texts(folders) && (folders as string[]).length > 0);
    if (!named) return false;
    return Object.entries(value).every(
        ([key, held]) => key === 'folders' || (FIND_LISTS.includes(key) && texts(held))
    );
}

/** Whether a value is one the key takes; null takes the key out and is always taken. */
function takes(field: KeyField, value: unknown): boolean {
    if (value === null) return true;
    switch (field) {
        case 'title':
            return typeof value === 'string' && value.trim() !== '';
        case 'tag_tones':
            return (
                isMap(value) &&
                Object.values(value).every((one) => typeof one === 'string' && one !== '')
            );
        case 'sort':
            return value === 'folder' || value === 'title';
        case 'discover':
            return typeof value === 'boolean';
        case 'find':
            return findValue(value);
    }
}

/** The words of what a key takes. */
function takenWords(text: Record<string, string>, field: KeyField): string {
    switch (field) {
        case 'title':
            return words(text, 'server.deck_slides.value_title');
        case 'tag_tones':
            return words(text, 'server.deck_slides.value_tones');
        case 'sort':
            return words(text, 'server.deck_slides.value_sort');
        case 'discover':
            return words(text, 'server.deck_slides.value_discover');
        case 'find':
            return words(text, 'server.deck_slides.value_find');
    }
}

/**
 * Why one key of a write is refused, or null: a path the Slides view does not set, a value of
 * another shape than the key takes.
 */
export function keyRefusal(
    text: Record<string, string>,
    path: readonly string[],
    value: unknown
): string | null {
    const field = keyField(path);
    const named = path.join('.');
    if (field === null) return words(text, 'server.deck_slides.key_unknown', named);
    if (!takes(field, value)) {
        return words(text, 'server.deck_slides.key_value', named, takenWords(text, field));
    }
    return null;
}
