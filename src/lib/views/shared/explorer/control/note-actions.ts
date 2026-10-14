// Layer 3, shared view support. What a press on a note's link or tag does and what a picture pasted
// or a file dropped into a note's source tab writes, over the client's stores, for the views that
// draw notes: the rendered half of a source tab and the Markdown Preview (shared/prose/
// Markdown.svelte), the source tab's editor (sources/source/Editor.svelte), and the Notes
// section's Tags (sources/files/sections/Tags.svelte). What a press asks for is read by
// state/sources/explorer/notes/note-press.ts, and what is written for a file by note-attach.ts.
//
// A press on a link opens the note in a source tab at its heading; on a missing note it makes the
// note through `/api/ops`'s create (logged and undone) and opens it; a name the rule refuses is
// said and makes nothing. A press on a tag opens the Search view over the notes folder of every
// hub with the search note-index.ts's tagPattern writes, holding the tag so the run lists only the
// places the tag index holds, and runs it.

import type { ClientState } from '$lib/state/client/context';
import { tagPattern, TAGGED_UNDER } from '$lib/state/sources/explorer/notes/note-index';
import {
    attachFiles,
    sentenceOf,
    type Attached,
    type Attachment
} from '$lib/state/sources/explorer/notes/note-attach';
import { headingLine, notePressed } from '$lib/state/sources/explorer/notes/note-press';
import { ALL_ROOTS } from '$lib/state/sources/search/search';
import { readText } from '$lib/state/sources/fs-transport';
import { t } from '$lib/state/shared/words/text';
import { base64Of, encoded } from '$lib/ui/forms/file/file-data';
import { openSourceFile } from '$lib/views/shared/links/source-file';

/** Open the Search view over the notes folder of every hub, searching for a tag, and run it. */
export function openTagSearch(client: ClientState, tag: string): void {
    const { layout, search, fs } = client;
    const id = layout.openView('search');
    search.setSearchState(id, {
        root: ALL_ROOTS,
        under: TAGGED_UNDER,
        q: tagPattern(tag),
        regex: true,
        word: false,
        case: false,
        tag
    });
    void search.runSearch(
        id,
        fs.workspaces().folders.map((one) => one.key)
    );
}

/** Open a note of a root at a heading, the heading's line read from the note as it is on disk. */
async function openAt(client: ClientState, root: string, path: string, heading: string) {
    if (heading === '') {
        openSourceFile(client, { root, path });
        return;
    }
    const file = await readText(root, path);
    const line = file.error === '' ? headingLine(file.text, heading) : 0;
    openSourceFile(client, line > 0 ? { root, path, line, column: 1 } : { root, path });
}

/**
 * Answer a press on an address of a note drawn from a file of `root`: true when it was a link's or
 * a tag's, which the caller keeps from the browser, and false for any other address. `say` is told
 * the sentence of a press that made nothing.
 */
export function pressNote(
    client: ClientState,
    root: string,
    href: string,
    say: (sentence: string) => void
): boolean {
    const press = notePressed(client.fs.notes().hubs, root, href, t);
    if (press === null) return false;
    if (press.kind === 'tag') openTagSearch(client, press.tag);
    else if (press.kind === 'refused') say(press.sentence);
    else if (press.kind === 'open') void openAt(client, press.root, press.path, press.heading);
    else {
        void client.explorer
            .create({ root: press.root, path: press.into }, press.name, false)
            .then((outcome) => {
                if (outcome.ok) openSourceFile(client, { root: press.root, path: press.path });
                else say(sentenceOf(outcome, t));
            });
    }
    return true;
}

/**
 * Write files pasted or dropped into a note of `root` into its hub's attachments folder and answer
 * the links to insert at the caret and why any file was refused; nothing for a file of no hub.
 */
export async function attachToNote(
    client: ClientState,
    root: string,
    files: readonly Attached[]
): Promise<Attachment> {
    const hub = client.fs.notes().hubs.find((one) => one.root === root && one.state === 'ok');
    if (hub === undefined) return { inserted: '', said: '' };
    const upload = (into: { root: string; path: string }, name: string, data: string) =>
        client.explorer.upload(into, name, data, () => Promise.resolve(false));
    return attachFiles(hub, files, {
        create: client.explorer.create,
        upload,
        data: async (file) => {
            try {
                return base64Of(await encoded(file));
            } catch {
                return null;
            }
        },
        now: () => new Date(),
        t
    });
}
