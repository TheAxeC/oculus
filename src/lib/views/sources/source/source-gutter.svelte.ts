// Layer 3, view partial of Source.svelte. The gutter of a source tab in a repository: VS Code's
// quick diff marks against the index, and each line's blame while the tab's Blame toggle is on,
// both read from GET /api/git for the repository holding the file. They are read again whenever
// the repository's state on the `git` channel moves and after every save (a hidden tab reads again
// once, when it is shown), and the blame is read again when it is turned on. The marks and the
// blame are handed to the editor as its decorations and to the code window as Gutter.svelte's
// rows.

import { untrack } from 'svelte';
import { listOf } from '$lib/state/sources/repositories/answers';
import {
    blameRows,
    marksByLine,
    markWords,
    type RepoFile
} from '$lib/state/sources/repositories/file-git';
import {
    blameUrl,
    marksUrl,
    type GitBlameLine,
    type GitLineMark
} from '$lib/state/sources/repositories/repositories';
import { lineCount } from '$lib/state/workbench/navigation/editor-text';
import type { ShownGate } from '$lib/state/client/use';
import type { EditorBlame, EditorMark } from '$lib/ui/controls/editor/gutter/gutter';
import { readJson } from '$lib/data/shapes/shapes';

/** What the gutter reads of its tab, each as a function so that a read is a tracked one. */
export type SourceGutterInput = {
    /** The repository holding the file, null for a file in none. */
    file: () => RepoFile | null;
    /** The repository's state, whose every move is a new read. */
    repoState: () => unknown;
    loaded: () => boolean;
    text: () => string;
    saved: () => string;
    /** Whether the tab's Blame toggle is on. */
    blameOn: () => boolean;
    gate: ShownGate;
};

/** Read one of the gutter's answers: its status and body, and a refusal when the read threw. */
async function readOne(url: string): Promise<{ ok: boolean; body: unknown }> {
    try {
        const response = await fetch(url);
        return { ok: response.ok, body: await readJson(response) };
    } catch {
        return { ok: false, body: undefined };
    }
}

/** The gutter of one tab: it reads in an effect of the component that makes it. */
export function createSourceGutter(input: SourceGutterInput) {
    const { gate } = input;
    /** The quick diff marks against the index, as the last read gave them. */
    let marks: GitLineMark[] = $state([]);
    /** Each line's blame while blame is on, and null while it is off or not read yet. */
    let blame = $state<GitBlameLine[] | null>(null);
    /** The moment the blame was read, which "how long ago" is counted from. */
    let readAt = $state(Date.now());
    /** Each read takes the next number, and only the newest may write what it read. */
    let reads = 0;
    const lines = $derived(lineCount(input.text()));

    $effect(() => {
        const [file, moved, on] = [input.file(), input.repoState(), input.blameOn()];
        // The saved text is read only so that a save reads the gutter again.
        const saved = input.saved();
        if (file === null || moved === null || !input.loaded()) {
            reads += 1;
            marks = [];
            blame = null;
            gate.clear();
            return;
        }
        if (gate.due([file, moved, on, saved])) untrack(() => void read(file, on));
    });

    async function read(file: RepoFile, on: boolean): Promise<void> {
        reads += 1;
        const mine = reads;
        const [marked, blamed] = await Promise.all([
            readOne(marksUrl(file.root, file.path)),
            on ? readOne(blameUrl(file.root, file.path)) : null
        ]);
        if (mine !== reads) return;
        marks = listOf(marked.ok, marked.body, 'marks');
        blame = blamed === null ? null : listOf(blamed.ok, blamed.body, 'lines');
        readAt = Date.now();
    }

    return {
        get lines() {
            return lines;
        },
        get readAt() {
            return readAt;
        },
        /** The blame rows, null while blame is off or not read yet. */
        get blame() {
            return input.blameOn() ? blame : null;
        },
        /** The marks by line, as the code window's gutter draws them. */
        get markMap() {
            return marksByLine(marks, lines);
        },
        /** The blamed lines by line number. */
        get blameMap() {
            return new Map((blame ?? []).map((one) => [one.line, one]));
        },
        /** The quick diff marks as the editor draws them, each with the words its hover says. */
        get editorMarks(): EditorMark[] {
            return marks.map((mark) => ({
                ...mark,
                words: markWords({ kind: mark.kind, start: mark.line })
            }));
        },
        /** The blame as the editor's line-number column draws it, none while blame is off. */
        get editorBlame(): EditorBlame[] {
            return input.blameOn() && blame !== null ? blameRows(blame, readAt) : [];
        }
    };
}
