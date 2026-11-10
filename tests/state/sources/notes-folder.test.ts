// Layer 2, client-state tests. Where the page places a hub's notes: the folder its notes answer
// names (`folder`, the hub's `notes_dir`) and the notes folder the workspaces answer marks the
// hub's root with (`notes`). The paths of the Notes section, the note a file is, the create of a
// hub with no notes folder yet, the landing rule of a name and whether a tab's file is a note are
// each read from that folder, here `journal`, and never from the shipped `.oculus/notes`.
//
// Nothing here reads or writes a file: the answers are written out as the server sends them.

import { describe, expect } from 'vitest';
import type { HubNotes } from '../../../src/lib/data/model/index.ts';
import { isNoteFile } from '../../../src/lib/state/life/note-hooks.ts';
import { noteOf } from '../../../src/lib/state/sources/explorer/notes/note-index.ts';
import {
    landingRefusal,
    noteEntries,
    noteMaking,
    notePath,
    rootNotes
} from '../../../src/lib/state/sources/explorer/notes/note-tree.ts';
import type { FsRoot } from '../../../src/lib/state/sources/explorer/view/place.ts';
import { it } from '../../fixtures/scratch.ts';

/** The notes answer of a hub whose notes folder is `journal`, holding one note. */
function journal(state: HubNotes['state'] = 'ok'): HubNotes {
    return {
        root: 'hub',
        primary: true,
        folder: 'journal',
        state,
        error: '',
        entries: state === 'ok' ? [{ path: 'Kickoff.md', kind: 'file', modified: 1 }] : []
    };
}

/** The roots as the workspaces answer marks them: the hub with its notes folder, and another. */
const ROOTS: FsRoot[] = [
    { key: 'hub', dir: '/w/hub', hub: true, notes: 'journal' },
    { key: 'plain', dir: '/w/plain' }
];

/** The words of a refusal, its catalog key and the values that fill it. */
const words = (key: string, ...args: (string | number)[]): string => [key, ...args].join(' ');

describe("the page's place of a hub's notes, the folder its notes_dir names", () => {
    it('reads the paths, the entries and the note a file is from the folder (G13)', () => {
        const hub = journal();
        expect(notePath(hub, '')).toBe('journal');
        expect(notePath(hub, 'Kickoff.md')).toBe('journal/Kickoff.md');
        expect(noteEntries(hub, 'journal').map((one) => one.name)).toEqual(['Kickoff.md']);
        expect(noteEntries(hub, '.oculus/notes')).toEqual([]);
        expect(noteOf([hub], 'hub', 'journal/Kickoff.md')).toEqual({
            root: 'hub',
            path: 'Kickoff.md'
        });
        expect(noteOf([hub], 'hub', '.oculus/notes/Kickoff.md')).toBeNull();
    });

    it('makes a note of a hub with no notes folder yet from the top of the hub, the folder and every one above it made by the one create (G13)', () => {
        expect(noteMaking(journal(), 'A.md')).toEqual({ into: 'journal', name: 'A.md' });
        expect(noteMaking(journal('none'), 'A.md')).toEqual({ into: '', name: 'journal/A.md' });
    });

    it("reads the root's notes folder from the workspaces answer for the landing rule and the note a tab holds (G13)", () => {
        expect(rootNotes(ROOTS, 'hub')).toBe('journal');
        expect(rootNotes(ROOTS, 'plain')).toBe('');
        expect(landingRefusal(rootNotes(ROOTS, 'hub'), 'journal/a:b.md', words)).not.toBe('');
        expect(landingRefusal(rootNotes(ROOTS, 'hub'), '.oculus/notes/a:b.md', words)).toBe('');
        expect(landingRefusal(rootNotes(ROOTS, 'plain'), 'journal/a:b.md', words)).toBe('');
        expect(isNoteFile(ROOTS, 'hub/journal/Kickoff.md')).toBe(true);
        expect(isNoteFile(ROOTS, 'hub/.oculus/notes/Kickoff.md')).toBe(false);
        expect(isNoteFile(ROOTS, 'plain/journal/Kickoff.md')).toBe(false);
    });
});
