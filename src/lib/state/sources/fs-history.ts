// Layer 2, client state, part of fs.svelte.ts. The history of one file: the copies the server
// kept before its saves, and the commits of a repository that touched it. Each is held in the
// client state's query client under a key that carries the file's version, so a write of the file
// asks again; a read that failed is held as the answer, with the sentence saying why.

import type { GitCommit } from '../../data/model/index.ts';
import type { Queries } from '../shared/stores/shapes.ts';
import { inBrowser } from '../shared/stores/in-browser.ts';
import { readAnswer } from './fs-transport.ts';
import { treeKey } from './fs.ts';
import {
    commitsOf,
    copiesOf,
    copyTextOf,
    historyUrl,
    logUrl
} from './explorer/sections/timeline-reads.ts';
import type { SavedCopy } from './explorer/sections/timeline.ts';

/** The local-history copies of one file, as far as they are read. */
export type FileCopies = { copies: SavedCopy[]; error: string; loading: boolean };

/** The commits that touched one file, as far as they are read. */
export type FileCommits = { commits: GitCommit[]; error: string; loading: boolean };

const NO_COPIES: FileCopies = { copies: [], error: '', loading: true };

const NO_COMMITS: FileCommits = { commits: [], error: '', loading: true };

/** The sentence a read that threw is held with. */
export function reasonOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** The history reads of one client, keyed by the file versions `fileVersion` gives. */
export function createFileHistory(
    queries: Queries,
    fileVersion: (root: string, path: string) => number
) {
    /** The copies of one file's local history, read again whenever the file is written. */
    function copies(root: string, path: string): FileCopies {
        if (root === '' || path === '') return { copies: [], error: '', loading: false };
        const key = ['fs', 'history', root, treeKey(root, path), String(fileVersion(root, path))];
        const { data } = queries.read(key, () => readCopies(root, path), { enabled: inBrowser() });
        return data ?? NO_COPIES;
    }

    async function readCopies(root: string, path: string): Promise<FileCopies> {
        try {
            const answer = await readAnswer(await fetch(historyUrl(root, path)));
            if (!answer.ok) return { copies: [], error: answer.error, loading: false };
            return { copies: copiesOf(answer.body), error: '', loading: false };
        } catch (error) {
            return { copies: [], error: reasonOf(error), loading: false };
        }
    }

    /**
     * The commits that touched one file. `repository` and `path` are the file as the repository
     * names it; `root` and `shown` are the file as the file browser names it, whose version is
     * part of the key so a save of the file asks again.
     */
    function commits(repository: string, path: string, root: string, shown: string): FileCommits {
        if (repository === '' || path === '') return { commits: [], error: '', loading: false };
        const key = ['fs', 'log', repository, path, String(fileVersion(root, shown))];
        const { data } = queries.read(key, () => readCommits(repository, path), {
            enabled: inBrowser()
        });
        return data ?? NO_COMMITS;
    }

    async function readCommits(repository: string, path: string): Promise<FileCommits> {
        try {
            const answer = await readAnswer(await fetch(logUrl(repository, path)));
            if (!answer.ok) return { commits: [], error: answer.error, loading: false };
            return { commits: commitsOf(answer.body), error: '', loading: false };
        } catch (error) {
            return { commits: [], error: reasonOf(error), loading: false };
        }
    }

    /** The text of one kept copy of a file, or null when it could not be read. */
    async function copyText(root: string, path: string, id: string): Promise<string | null> {
        try {
            const answer = await readAnswer(await fetch(historyUrl(root, path, id)));
            return answer.ok ? copyTextOf(answer.body) : null;
        } catch {
            return null;
        }
    }

    return { copies, commits, copyText };
}
