// Layer 1, data. What a note is called and where it lives: a note is `<name>.md` in a hub's
// `.oculus/notes/` folder or a folder under it, its name is its title, and the name follows one
// rule, which the server checks when a file operation lands in a notes folder (server/files/fs/
// ops.ts) and the page checks while the name is typed (the Notes tree's name input), so the two
// cannot disagree.
//
// A name holds none of `/ \ : [ ] # ^ |`, since a link names a note by `[[folder/name#heading|shown
// text]]` and an embed by `![[name]]`, and each of those characters would end or split the link; it
// holds no control character, does not start with a dot (a dotfile is no note), is not empty once
// its leading and trailing spaces are trimmed, and is at most 200 characters. Two names are one
// name when they differ only by letter case or by Unicode normalisation, so a folder never holds
// both, and a name is written in NFC.
//
// The same rule names a note's folder and a file of `attachments/`, since a folder is part of the
// `[[folder/name]]` a link may need, and a file is named in an embed.

/** The folder of a hub that holds its notes, as a path under the hub. */
export const NOTES_FOLDER = '.oculus/notes';

/** The folder of a hub that holds its own files: its notes, settings, data and `local.yml`. */
const HUB_OWN_FOLDER = '.oculus';

/** The extension every note is written under. */
export const NOTE_SUFFIX = '.md';

/** The file at the top of a notes folder that keeps the order the notes are listed in. */
export const ORDER_FILE = 'order.json';

/** The folder at the top of a notes folder that pasted and dropped files are written into. */
export const ATTACHMENTS_FOLDER = 'attachments';

/** The most characters a name may have. */
const NAME_MAX = 200;

/** The characters a name may not hold, each of which would end or split a link to it. */
const NAME_BANNED = ['/', '\\', ':', '[', ']', '#', '^', '|'];

/** Whether a character is a control character: U+0000 to U+001F, or U+007F to U+009F. */
function isControl(char: string): boolean {
    const point = char.codePointAt(0) ?? 0;
    return point <= 0x1f || (point >= 0x7f && point <= 0x9f);
}

/** Why a name is refused. `char` names the character for the two refusals that have one. */
export type NameRefusal =
    | { why: 'empty' }
    | { why: 'dot' }
    | { why: 'long' }
    | { why: 'char'; char: string }
    | { why: 'control'; char: string }
    | { why: 'taken'; name: string };

/** A name as it is written: trimmed and in NFC, or the refusal that stops it. */
export type NamedOutcome = { ok: true; name: string } | { ok: false; refusal: NameRefusal };

/**
 * A typed name as a note, a notes folder or an attachment is written: its leading and trailing
 * spaces trimmed and in NFC, or why the rule refuses it.
 */
export function noteName(typed: string): NamedOutcome {
    const name = typed.trim().normalize('NFC');
    if (name === '') return { ok: false, refusal: { why: 'empty' } };
    // A name is read by its code points, so a character outside the basic plane counts once.
    const chars = Array.from(name);
    const control = chars.find(isControl);
    if (control !== undefined) return { ok: false, refusal: { why: 'control', char: control } };
    const banned = chars.find((char) => NAME_BANNED.includes(char));
    if (banned !== undefined) return { ok: false, refusal: { why: 'char', char: banned } };
    if (name.startsWith('.')) return { ok: false, refusal: { why: 'dot' } };
    if (chars.length > NAME_MAX) return { ok: false, refusal: { why: 'long' } };
    return { ok: true, name };
}

/** What two names are compared by: NFC and lower case, so `Kickoff` and `kickoff` are one. */
export function nameKey(name: string): string {
    return name.normalize('NFC').toLowerCase();
}

/**
 * Whether a folder's names already hold one: a name equal to it but for letter case or
 * normalisation. `own` is the name of the item being renamed, which never takes its own name, so a
 * rename that changes only the case of a name is allowed.
 */
export function nameTaken(names: readonly string[], name: string, own?: string): boolean {
    const key = nameKey(name);
    return names.some((one) => nameKey(one) === key && one !== own);
}

/** The catalog key each reason a name is refused for is worded by, in the `notes` group. */
const REFUSAL_KEYS = {
    empty: 'notes.name_empty',
    dot: 'notes.name_dot',
    long: 'notes.name_long',
    char: 'notes.name_char',
    control: 'notes.name_control',
    taken: 'notes.name_taken'
} as const satisfies Record<NameRefusal['why'], string>;

/** The sentence of a refusal: its catalog key and the values that fill it. */
export type NameRefusalMessage = { key: string; args: string[] };

/**
 * The sentence of a refusal for a reader to word through its catalog: a character is shown as
 * itself, or by its code point when it is a control character, which would draw as nothing.
 */
export function nameRefusalMessage(refusal: NameRefusal): NameRefusalMessage {
    const key = REFUSAL_KEYS[refusal.why];
    if (refusal.why === 'char') return { key, args: [refusal.char] };
    if (refusal.why === 'control') {
        const point = refusal.char.codePointAt(0) ?? 0;
        return { key, args: [`U+${point.toString(16).toUpperCase().padStart(4, '0')}`] };
    }
    if (refusal.why === 'taken') return { key, args: [refusal.name] };
    return { key, args: [] };
}

/** The segments of a path written with `/`, without empty ones. */
function segmentsOf(path: string): string[] {
    return path.split('/').filter((one) => one !== '');
}

/**
 * The path inside the notes folder of a path under a hub, or null for a path outside it: the
 * folder's own path is the empty path.
 */
export function inNotes(pathInHub: string): string | null {
    const parts = segmentsOf(pathInHub);
    const own = segmentsOf(NOTES_FOLDER);
    if (parts.length < own.length || own.some((part, at) => parts[at] !== part)) return null;
    return parts.slice(own.length).join('/');
}

/** Whether a path inside a notes folder is a note: a `.md` file and not the order file. */
export function isNote(pathInNotes: string): boolean {
    return pathInNotes.toLowerCase().endsWith(NOTE_SUFFIX) && pathInNotes !== ORDER_FILE;
}

/** A note's name: its file name without `.md`. */
export function noteTitle(path: string): string {
    const name = segmentsOf(path).at(-1) ?? '';
    return name.toLowerCase().endsWith(NOTE_SUFFIX) ? name.slice(0, -NOTE_SUFFIX.length) : name;
}

/**
 * Whether a path under a root lies in a folder whose name starts with a dot, or in
 * `node_modules`, the folders no language server's file event reaches, with one exception:
 * a hub's notes folder and every folder under it that is not a dot folder itself. `hub` says
 * whether the root is a hub; a folder that is not one holds no notes.
 */
export function inHiddenFolder(pathInRoot: string, hub: boolean): boolean {
    const folders = pathInRoot
        .split(/[/\\]/)
        .filter((one) => one !== '')
        .slice(0, -1);
    const own = segmentsOf(NOTES_FOLDER);
    const notes = hub && own.every((part, at) => folders[at] === part);
    return folders
        .slice(notes ? own.length : 0)
        .some((part) => part === 'node_modules' || part.startsWith('.') || part === '..');
}

/**
 * Whether a path under a root lies where no edit a language server asks for is made: a folder whose
 * name starts with a dot, or `node_modules`, with one exception: a hub's own `.oculus` folder and
 * every folder under it that is not a dot folder or `node_modules` itself, which hold the hub's
 * notes and the files a rename of a hub key reaches (its data files, its settings and the primary's
 * `local.yml`). `hub` says whether the root is a hub; a folder that is not one has no such folder.
 */
export function outsideEdits(pathInRoot: string, hub: boolean): boolean {
    const folders = pathInRoot
        .split(/[/\\]/)
        .filter((one) => one !== '')
        .slice(0, -1);
    const own = hub && folders[0] === HUB_OWN_FOLDER;
    return folders
        .slice(own ? 1 : 0)
        .some((part) => part === 'node_modules' || part.startsWith('.') || part === '..');
}
