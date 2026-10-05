// Layer 3, view partial of Source.svelte. The gutter of a source tab in a repository: VS Code's
// quick diff marks against the index, and each line's blame, both read from GET /api/git for the
// repository holding the file. The blame is always read, since the status bar says the caret
// line's blame whether or not the tab's Blame toggle is on; the toggle decides only whether the
// gutter and the editor draw it. A tab over the file at HEAD or in the index (`stage`) reads the
// blame of that version and no marks, since a version of the file has no changes against the
// index. They are read again whenever the repository's state on the `git` channel moves and after
// every save (a hidden tab reads again once, when it is shown). The marks and the blame are
// handed to the editor as its decorations and to the code window as Gutter.svelte's rows. A press
// on a mark opens the file's diff at its change and a press on a blamed line opens its commit.

import { untrack } from 'svelte';
import { listOf } from '$lib/state/sources/repositories/answers';
import {
    blameRows,
    marksByLine,
    markWords,
    type HeadStage,
    type RepoFile
} from '$lib/state/sources/repositories/file-git';
import {
    blameUrl,
    marksUrl,
    type GitBlameLine,
    type GitLineMark
} from '$lib/state/sources/repositories/repositories';
import type { RepositoriesStore } from '$lib/state/sources/repositories/repositories.svelte';
import { lineCount } from '$lib/state/workbench/navigation/editor-text';
import type { ShownGate } from '$lib/state/client/use';
import type { EditorBlame, EditorMark } from '$lib/ui/controls/editor/gutter/gutter';
import { readJson } from '$lib/data/shapes/shapes';

/** What the gutter reads of its tab, each as a function so that a read is a tracked one. */
export type SourceGutterInput = {
    /** The repository holding the file, null for a file in none. */
    file: () => RepoFile | null;
    /** The version of the file the tab holds, undefined for the file on disk. */
    stage: () => HeadStage | undefined;
    /** The repository's state, whose every move is a new read. */
    repoState: () => unknown;
    /** The Repositories view's opens: a change's diff and a blamed line's commit. */
    repositories: Pick<RepositoriesStore, 'openDiff' | 'openCommit'>;
    loaded: () => boolean;
    text: () => string;
    saved: () => string;
    /** Whether the tab's Blame toggle is on, which is whether the blame is drawn. */
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
    /** Each line's blame, and null while it is not read yet or the file has none. */
    let blame = $state<GitBlameLine[] | null>(null);
    /** The moment the blame was read, which "how long ago" is counted from. */
    let readAt = $state(Date.now());
    /** Each read takes the next number, and only the newest may write what it read. */
    let reads = 0;
    const lines = $derived(lineCount(input.text()));

    $effect(() => {
        const [file, moved, stage] = [input.file(), input.repoState(), input.stage()];
        // The saved text is read only so that a save reads the gutter again.
        const saved = input.saved();
        if (file === null || moved === null || !input.loaded()) {
            reads += 1;
            marks = [];
            blame = null;
            gate.clear();
            return;
        }
        if (gate.due([file, moved, stage, saved])) untrack(() => void read(file, stage));
    });

    async function read(file: RepoFile, stage: HeadStage | undefined): Promise<void> {
        reads += 1;
        const mine = reads;
        const [marked, blamed] = await Promise.all([
            stage === undefined ? readOne(marksUrl(file.root, file.path)) : null,
            readOne(blameUrl(file.root, file.path, stage))
        ]);
        if (mine !== reads) return;
        marks = marked === null ? [] : listOf(marked.ok, marked.body, 'marks');
        blame = listOf(blamed.ok, blamed.body, 'lines');
        readAt = Date.now();
    }

    /** Open the file's diff at a change its gutter marks, as VS Code's gutter press peeks it. */
    function openMark(line: number): void {
        const file = input.file();
        if (file === null) return;
        input.repositories.openDiff(
            { root: file.root, path: file.path, staged: false, worktree: false, line },
            file.path
        );
    }

    /** Open a blamed line's commit in the Repositories view's graph. */
    function openBlamed(line: GitBlameLine | undefined): void {
        const file = input.file();
        if (file === null || line === undefined || line.uncommitted) return;
        input.repositories.openCommit(file.root, line.hash);
    }

    return {
        openMark,
        openBlamed,
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
        /** The blamed lines by line number, whether or not they are drawn. */
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
