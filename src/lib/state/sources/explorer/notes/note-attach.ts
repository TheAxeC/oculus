// Layer 2, client state. A picture pasted into a note's source tab, or a file dropped on it from
// outside the page, written into `attachments/` at the top of the note's hub's notes folder and
// linked from the note: the source tab hands the files here and inserts the `![[<file name>]]`
// this answers at the caret.
//
// Each file goes through `/api/ops`'s upload, so it is logged and undone, and the upload's limit
// and refusals are the ones every upload has. The folder is made first when the hub has none,
// through the create every new folder of the Notes section goes through (note-tree.ts's
// noteMaking). A pasted picture is named `Pasted image <yyyymmddhhmmss>.<ext>` by the time it was
// pasted, and a dropped file keeps its own name (decision 10); a name the folder already holds
// gets ` 1`, ` 2` and on before its extension, and an upload answered `exists` (another page
// wrote that name first) tries the next free name. A file refused says why, and its link is not
// inserted.

import { MAX_UPLOAD_BYTES } from '../../../../data/file-ops.ts';
import type { HubNotes } from '../../../../data/model/index.ts';
import { ATTACHMENTS_FOLDER, nameKey } from '../../../../data/prose/markdown/note-names.ts';
import { refusalSentence } from '../../../shared/answers/answers.ts';
import type { Outcome, Place, Placed } from '../ops.svelte.ts';
import { noteMaking, notePath } from './note-tree.ts';

type Words = (key: string, ...args: (string | number)[]) => string;

/** The extension a pasted picture is written with, by the type the clipboard names. */
const PICTURE_EXTENSIONS: Partial<Record<string, string>> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/avif': 'avif'
};

/** How many numbered names are tried before a file is given up as taken. */
const MOST_TRIES = 1000;

/** One file handed in: the file, and whether it was pasted (a picture) rather than dropped. */
export type Attached = { file: File; pasted: boolean };

/** What attaching answered: the text to insert, '' for none, and why files were refused. */
export type Attachment = { inserted: string; said: string };

/** The two writes attaching makes, as the explorer store makes them. */
export type AttachDeps = {
    create: (into: Place, name: string, folder: boolean) => Promise<Outcome>;
    upload: (into: Place, name: string, data: string) => Promise<Outcome>;
    /** A file's bytes as base64, or null when it cannot be read. */
    data: (file: File) => Promise<string | null>;
    now: () => Date;
    t: Words;
};

/** Two digits of a number. */
function two(value: number): string {
    return String(value).padStart(2, '0');
}

/** The name a pasted picture is written under, by the time it was pasted, without a number. */
function pastedName(type: string, at: Date): string | null {
    const extension = PICTURE_EXTENSIONS[type.toLowerCase()];
    if (extension === undefined) return null;
    const stamp = [
        String(at.getFullYear()),
        two(at.getMonth() + 1),
        two(at.getDate()),
        two(at.getHours()),
        two(at.getMinutes()),
        two(at.getSeconds())
    ].join('');
    return `Pasted image ${stamp}.${extension}`;
}

/** A name with a number before its extension: `photo 1.jpg`, `notes 2`. */
function numberedName(name: string, number: number): string {
    if (number === 0) return name;
    const dot = name.lastIndexOf('.');
    return dot <= 0
        ? `${name} ${String(number)}`
        : `${name.slice(0, dot)} ${String(number)}${name.slice(dot)}`;
}

/** The first number from `from` on whose name the folder's names do not hold. */
function freeNumber(name: string, taken: readonly string[], from: number): number {
    const keys = new Set(taken.map(nameKey));
    let number = from;
    while (keys.has(nameKey(numberedName(name, number))) && number < MOST_TRIES) number += 1;
    return number;
}

/** The names of the files of a hub's attachments folder. */
function attachmentsOf(hub: HubNotes): string[] {
    const prefix = `${ATTACHMENTS_FOLDER}/`;
    return hub.entries
        .filter(
            (one) => one.path.startsWith(prefix) && !one.path.slice(prefix.length).includes('/')
        )
        .map((one) => one.path.slice(prefix.length));
}

/** Whether a hub's notes folder holds its attachments folder. */
function holdsFolder(hub: HubNotes): boolean {
    return hub.entries.some((one) => one.kind === 'dir' && one.path === ATTACHMENTS_FOLDER);
}

/**
 * Write the files into the hub's attachments folder, one after another, and answer the links to
 * insert, one line each, with the sentence of every file refused.
 */
export async function attachFiles(
    hub: HubNotes,
    files: readonly Attached[],
    deps: AttachDeps
): Promise<Attachment> {
    const { t } = deps;
    const said: string[] = [];
    const links: string[] = [];
    const into: Place = { root: hub.root, path: notePath(ATTACHMENTS_FOLDER) };
    if (files.length === 0) return { inserted: '', said: '' };
    if (!holdsFolder(hub)) {
        const making = noteMaking(hub, ATTACHMENTS_FOLDER);
        const made = await deps.create({ root: hub.root, path: making.into }, making.name, true);
        if (!made.ok && made.error !== 'exists') {
            return {
                inserted: '',
                said: t('notes.attach_refused', ATTACHMENTS_FOLDER, sentenceOf(made, t))
            };
        }
    }
    const taken = [...attachmentsOf(hub)];
    for (const { file, pasted } of files) {
        const name = pasted ? pastedName(file.type, deps.now()) : file.name;
        if (name === null) continue;
        if (file.size > MAX_UPLOAD_BYTES) {
            said.push(t('files.upload_refused', name, t('files.refused_too_large')));
            continue;
        }
        const data = await deps.data(file);
        if (data === null) {
            said.push(t('files.upload_refused', name, t('files.refused_not_base64')));
            continue;
        }
        let number = freeNumber(name, taken, 0);
        let outcome = await deps.upload(into, numberedName(name, number), data);
        while (!outcome.ok && outcome.error === 'exists' && number < MOST_TRIES) {
            taken.push(numberedName(name, number));
            number = freeNumber(name, taken, number + 1);
            outcome = await deps.upload(into, numberedName(name, number), data);
        }
        const written = numberedName(name, number);
        if (!outcome.ok) {
            said.push(t('files.upload_refused', written, sentenceOf(outcome, t)));
            continue;
        }
        taken.push(written);
        links.push(`![[${written}]]`);
    }
    return { inserted: links.join('\n'), said: said.join(' ') };
}

/** The sentence a refused write of the explorer store says. */
export function sentenceOf(outcome: Extract<Placed, { ok: false }>, t: Words): string {
    if (outcome.error === 'said') return outcome.said;
    return outcome.error === 'network'
        ? t('files.refused_network')
        : refusalSentence(outcome.error);
}
