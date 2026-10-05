// Layer 3, view partial of Source.svelte. Where the tab's file is and what that allows: the
// absolute path on disk, the repository holding it, whether the tab shows the working file, and so
// whether the star, Open in Program, a preview and the blame apply. A tab over the file at HEAD or
// in the index names its repository's own folder as its root and shows no working file, and a tab
// that lost its address names no file. The values are derived from the tab's address and the
// workspace's served roots and repositories, so they follow both.

import type { HeadStage } from '$lib/state/sessions/source.svelte';
import { repoOfFile, wholePath, type RepoFile } from '$lib/state/sources/repositories/file-git';
import type { ClientState } from '$lib/state/client/context';

/** What the tab's file facts read of the tab. */
export type TabFileDeps = {
    workspaces: ClientState['fs']['workspaces'];
    gitRoots: ClientState['selectors']['gitRoots'];
    gitFor: ClientState['selectors']['gitFor'];
    root: () => string;
    path: () => string;
    /** The version the tab holds, when it is the file at HEAD or in the index. */
    head: () => HeadStage | undefined;
    /** Whether the tab names no file: an untitled text, or a state that lost its address. */
    blocked: () => boolean;
    /** Whether the tab holds the file's text: read, and not refused since. */
    read: () => boolean;
    /** Whether the file has a rendered half, which is what a Markdown file has. */
    markdown: () => boolean;
};

/** The facts about the tab's file, each read where the tab draws or hands up an action. */
export function createTabFile(deps: TabFileDeps) {
    /** The roots the file routes serve, which name a tab's file by a key and a path. */
    const served = $derived(deps.workspaces().workspaces.flatMap((workspace) => workspace.roots));
    /** The absolute path of the file on disk, empty for a tab that shows no file on disk. */
    const wholeFile = $derived(
        deps.blocked() || deps.head() !== undefined
            ? ''
            : (wholePath(served, { root: deps.root(), path: deps.path() }) ?? '')
    );
    /**
     * The repository holding the file and its path there, or null for a file in none. A version at
     * HEAD or in the index names its repository's own folder as its root.
     */
    const inRepo = $derived.by<RepoFile | null>(() => {
        if (deps.blocked()) return null;
        const file = { root: deps.root(), path: deps.path() };
        if (deps.head() !== undefined) return file;
        const repos = deps.gitRoots().filter((one) => {
            const held = deps.gitFor(one);
            return held !== null && held.repository && held.error === null;
        });
        return repoOfFile(served, file, repos);
    });
    /** Whether the tab shows the working file, read, which the star and Open in Program act on. */
    const onDisk = $derived(deps.head() === undefined && !deps.blocked() && deps.read());
    return {
        get wholeFile() {
            return wholeFile;
        },
        get inRepo() {
            return inRepo;
        },
        get onDisk() {
            return onDisk;
        },
        /** Whether the tab shows a Markdown file read from disk, which may be previewed. */
        get previewable() {
            return deps.markdown() && onDisk;
        },
        /** Whether the tab's file is in a repository and read, so its blame may be drawn. */
        get blameable() {
            return inRepo !== null && deps.read();
        },
        /** The repository's state, whose every move is a new read of the gutter. */
        get repoState() {
            return inRepo === null ? null : deps.gitFor(inRepo.root);
        }
    };
}
