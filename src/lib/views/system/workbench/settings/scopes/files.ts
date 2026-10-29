// Layer 3, view helper. The user's files the scopes of one Settings view read, through the folders
// of the workspace that hold them: a hub's settings file, `.oculus/config.yml`, the open workspace
// file, a repository's `.oculus/settings.yml`, each as the file browser holds it with the folders
// on its way listed (state/system/config/view/hub-file.ts), and a hub's `.oculus/local.yml` as the
// workspaces answer sends it, whose text is never read here. Each read goes through the page's
// stores, so a view that reads one in a derived value redraws when the file is read again.

import { HUB_FILE, type ListingShown } from '$lib/state/sources/fs';
import type { FileText, Listing, LocalFile } from '$lib/state/sources/fs-transport';
import { LOCAL_PATH } from '$lib/state/system/config/config-files';
import type { Folder } from '$lib/state/system/config/editors/sources';
import type { HubFile, UserFiles } from '$lib/state/system/config/rows';
import {
    localFile,
    textFile,
    workspaceFile,
    type ScopeFile
} from '$lib/state/system/config/scopes/rows';
import type { Scope } from '$lib/state/system/config/scopes/scope';
import { hubFileText } from '$lib/state/system/config/view/hub-file';
import { REPO_SETTINGS } from '$lib/state/workbench/navigation/editor-text';

/** What the files are read through. */
export type ScopeFilesDeps = {
    listing: (root: string, path: string, shown?: ListingShown) => Listing;
    fileText: (root: string, path: string) => FileText;
    /** The open workspace file's root and path, or null for the unsaved workspace. */
    workspace: () => { root: string | null; path: string } | null;
    /** The primary hub's name, or null while there is none. */
    primary: () => string | null;
    /** A hub's `local.yml` as the workspaces answer sends it, undefined until it has. */
    local: (hub: string) => LocalFile | undefined;
};

/** The user's files of one view. */
export type ScopeFiles = {
    /** The file of a scope as the scope bar and its Save read it. */
    read: (scope: Scope) => ScopeFile;
    /** One folder of a hub as the controls read it: its entries, or why there are none yet. */
    folderIn: (root: string | null, path: string) => Folder;
    /** The primary's settings file and the open workspace file, as the rows read them. */
    userFiles: () => UserFiles;
    /** The settings file of a hub. */
    settingsOf: (hub: string | null) => HubFile;
    /** The settings file of a repository. */
    repo: (root: string) => HubFile;
};

/** The text of a file that is not read. */
const UNREAD: FileText = { text: '', truncated: false, error: '', loading: false };

/** The listing of a folder no root holds: empty, read. */
const NO_LISTING: Listing = { entries: [], error: '', loading: false };

/** Open the files of a view. */
export function createScopeFiles(deps: ScopeFilesDeps): ScopeFiles {
    /** One folder of a root as the file browser lists it, hidden and ignored entries included. */
    function listingOf(root: string | null, path: string): Listing {
        if (root === null) return NO_LISTING;
        return deps.listing(root, path, { hidden: true, ignored: true });
    }

    /** A file of a root at `path`, read through the folders on its way. */
    function fileOf(root: string | null, path: string): HubFile {
        return hubFileText(
            (folder) => listingOf(root, folder),
            (file) => (root === null ? UNREAD : deps.fileText(root, file)),
            path
        );
    }

    function folderIn(root: string | null, path: string): Folder {
        const held = listingOf(root, path);
        if (held.error !== '') return { state: 'failed', error: held.error };
        if (held.loading) return { state: 'loading' };
        return { state: 'ready', entries: held.entries };
    }

    const settingsOf = (hub: string | null): HubFile => fileOf(hub, HUB_FILE);
    const repo = (root: string): HubFile => fileOf(root, REPO_SETTINGS);

    /** The open workspace file as the rows and the scope bar read it, or null when unsaved. */
    function openWorkspace(): { root: string | null; path: string; held: HubFile } | null {
        const open = deps.workspace();
        if (open === null) return null;
        return { ...open, held: fileOf(open.root, open.path) };
    }

    function read(scope: Scope): ScopeFile {
        if (scope.kind === 'workspace') return workspaceFile(openWorkspace());
        if (scope.kind === 'local') {
            return localFile(`${scope.hub}/${LOCAL_PATH}`, deps.local(scope.hub));
        }
        if (scope.kind === 'repo') {
            return textFile(`${scope.root}/${REPO_SETTINGS}`, repo(scope.root));
        }
        const hub = scope.kind === 'hub' ? scope.hub : deps.primary();
        return textFile(`${hub ?? ''}/${HUB_FILE}`, settingsOf(hub));
    }

    function userFiles(): UserFiles {
        const primary = deps.primary();
        const open = openWorkspace();
        return {
            ...(primary === null ? {} : { hubFile: settingsOf(primary) }),
            workspace:
                open === null
                    ? null
                    : {
                          root: open.root,
                          path: open.path,
                          text: open.root === null ? UNREAD : open.held.text
                      }
        };
    }

    return { read, folderIn, userFiles, settingsOf, repo };
}
