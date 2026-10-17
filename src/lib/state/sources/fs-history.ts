// Layer 2, client state, part of fs.svelte.ts. The history of one file: the copies the server kept
// before its saves, and the first page of the commits of a repository that touched it, with the
// read of each page after it. Each is held in the client state's query client. The copies are read
// again when a `files` message says something under their root was written, and the first page of
// the commits when the repository's HEAD moves, since the HEAD is part of its key. A read that
// failed is held as the answer, as a flag; the sentence saying so is the view's.

import type { GitFilePage } from '../../data/model/index.ts';
import type { EntitiesStore, Queries } from '../shared/stores/shapes.ts';
import { pathUnder } from '../../data/helpers/files/paths.ts';
import { inBrowser } from '../shared/stores/in-browser.ts';
import { readAnswer } from './fs-transport.ts';
import { treeKey, type FsRoot } from './fs.ts';
import {
    copiesOf,
    copyTextOf,
    historyUrl,
    logUrl,
    pageOf
} from './explorer/sections/timeline-reads.ts';
import type { SavedCopy } from './explorer/sections/timeline.ts';

/** The local-history copies of one file, as far as they are read. */
export type FileCopies = { copies: SavedCopy[]; failed: boolean; loading: boolean };

/** The first page of the commits that touched one file, as far as it is read. */
export type FileCommits = GitFilePage & { failed: boolean; loading: boolean };

/** One page after the first: its commits and whether older ones remain, or that it failed. */
export type CommitPage = ({ ok: true } & GitFilePage) | { ok: false };

/** What a copies read holds while it is out, built per call so no caller holds another's array. */
function noCopies(): FileCopies {
    return { copies: [], failed: false, loading: true };
}

/** What a commits read holds while it is out, built per call for the same reason. */
function noCommits(): FileCommits {
    return { commits: [], more: false, failed: false, loading: true };
}

/** What every copies key opens with, and the key of one root's copies. */
const COPIES = ['fs', 'history'];

/**
 * The history reads of one client. `roots` are the roots of the workspace in force, which say what
 * a `files` message that names a directory concerns.
 */
export function createFileHistory(
    queries: Queries,
    entities: EntitiesStore,
    roots: () => FsRoot[]
) {
    /** The version of the last `files` message heard, or null before the first. */
    let heard: number | null = null;

    // A write under a root moves the copies of its files: the copy of a save is made before the
    // write, so the row exists once the message arrives. A gap in the versions concerns every
    // root, and the bookmarks message, which names no root, concerns none.
    entities.afterReceive((message) => {
        if (message.channel !== 'files' || heard === message.version) return;
        const gap = heard === null || message.version !== heard + 1;
        heard = message.version;
        const named = entities.payloadOf(message, 'files')?.root ?? '';
        if (gap) {
            queries.mark(COPIES, 'replace');
            return;
        }
        if (named === '') return;
        for (const one of roots()) {
            if (pathUnder(one.dir, named) !== null || pathUnder(named, one.dir) !== null) {
                queries.mark([...COPIES, one.key], 'replace');
            }
        }
    });

    /**
     * The copies of one file's local history, read again when something under its root is written.
     */
    function copies(root: string, path: string): FileCopies {
        if (root === '' || path === '') return { copies: [], failed: false, loading: false };
        const key = [...COPIES, root, treeKey(root, path)];
        const { data } = queries.read(key, () => readCopies(root, path), { enabled: inBrowser() });
        return data ?? noCopies();
    }

    async function readCopies(root: string, path: string): Promise<FileCopies> {
        try {
            const answer = await readAnswer(await fetch(historyUrl(root, path)));
            if (!answer.ok) return { copies: [], failed: true, loading: false };
            return { copies: copiesOf(answer.body), failed: false, loading: false };
        } catch {
            return { copies: [], failed: true, loading: false };
        }
    }

    /**
     * The first page of the commits that touched one file. `repository` and `path` are the file as
     * the repository names it, and `head` names the commit and branch the repository is at, so a
     * commit, an amend, a checkout or a pull is a new key and reads the first page again.
     */
    function commits(repository: string, path: string, head: string): FileCommits {
        if (repository === '' || path === '') {
            return { commits: [], more: false, failed: false, loading: false };
        }
        const key = ['fs', 'log', repository, path, head];
        const { data } = queries.read(key, () => readFirst(repository, path), {
            enabled: inBrowser()
        });
        return data ?? noCommits();
    }

    async function readFirst(repository: string, path: string): Promise<FileCommits> {
        const read = await readPage(repository, path);
        return read.ok
            ? { commits: read.commits, more: read.more, failed: false, loading: false }
            : { commits: [], more: false, failed: true, loading: false };
    }

    /** One page of the commits, the first with no `before`, else the page after that commit. */
    async function readPage(
        repository: string,
        path: string,
        before?: string
    ): Promise<CommitPage> {
        try {
            const answer = await readAnswer(await fetch(logUrl(repository, path, before)));
            return answer.ok ? { ok: true, ...pageOf(answer.body) } : { ok: false };
        } catch {
            return { ok: false };
        }
    }

    /**
     * Read the copies and the first page of the commits of one file again: the file as the file
     * browser names it (`root` and `path`) and as its repository names it (`repository`, `shown`).
     */
    function refreshFile(root: string, path: string, repository: string, shown: string): void {
        if (root !== '' && path !== '') {
            queries.mark([...COPIES, root, treeKey(root, path)], 'replace');
        }
        if (repository !== '' && shown !== '')
            queries.mark(['fs', 'log', repository, shown], 'replace');
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

    return { copies, commits, commitPage: readPage, refreshFile, copyText };
}
