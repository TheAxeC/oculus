// Layer 2, server. The read of every apps folder: the machine's folder and the `.oculus/apps/`
// folder of each root the file browser shows, to the rows the page is sent and the findings that
// say what refused a folder.
//
// Every path compared here is a real path as the disk spells it (`realpathSync.native`), so one
// folder reached through two roots or a link is one folder. The folders are taken in one order, the
// machine's first and then each root's in the browser's order, and a folder whose real path an
// earlier one already holds is `repeated`. The hub's `.oculus/apps` is the machine's folder by
// default, so the hub root whose `.oculus/apps` is the machine's folder is that folder read once,
// and gets no finding; any other root whose `.oculus/apps` is the machine's folder is `repeated`. A
// root's `.oculus/apps` that resolves outside the root's real path is not read, and the root
// `engine` is oculus's own config folder, which holds no apps. A folder with no `app.yml` is not an
// app and gets no finding, since nothing in it claims to be one. This module is a pure function of
// the disk and its input: it holds nothing between reads, and the keeping of an app is the
// caller's map, edited here only to end a keeping whose manifest changed. Which apps are disabled
// is the state the caller read from `~/.oculus/apps.json` (read/state.ts).

import { lstatSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { appViewId } from '../../../../data/helpers/files/apps/apps.ts';
import { HUB_ROOT, ROOT_FOLDER } from '../../../../data/helpers/hub-names.ts';
import { findingText, type TextCatalog } from '../../../../data/helpers/finding-text.ts';
import type { AppRow, Finding } from '../../../../data/model/index.ts';
import { closedPaths, textCatalog, type AppsSettings } from '../../../../data/sources/config.ts';
import { mapShape, readAs } from '../../../../data/shapes/shapes.ts';
import { below, realPath } from '../../../core/paths.ts';
import { ENGINE_ROOT, type Root } from '../../../files/files.ts';
import { addressKey } from '../serve/address.ts';
import { noApps, type AppsHeld, type HeldApp } from './held.ts';
import { findingKey, readManifest } from './manifest.ts';
import { dropTakenIds } from './across/ids.ts';
import { noteUnboundKeys } from './across/key-notes.ts';
import { judgeStored } from './across/stored.ts';
import { checkThemes } from './theme-files/themes.ts';
import { hashApp, walkApp } from './record.ts';
import { standingOf, type AppsState } from './state.ts';
import { readStore, ROOT_DATA, storeFile } from '../store/store.ts';

/** What a read needs of the install around the folders. */
export type ScanInput = {
    /** The machine's apps folder, or null when there is none to read. */
    machine: string | null;
    /** The file `apps_dir` is written in, which the finding for a machine folder that is no folder
     * names. */
    localFile: string;
    /** The roots the file browser shows, in its order. */
    roots: Root[];
    /** The merged config: the glyph vocabulary and the words of a finding. */
    config: Record<string, unknown>;
    settings: AppsSettings;
    /** The port oculus listens on. */
    port: number;
    /** The content hashes the approvals file holds as approved apps. */
    approved: ReadonlySet<string>;
    /** The apps kept approved while edited: view id to the hash of the approved manifest. */
    kept: Map<string, string>;
    /** What `~/.oculus/apps.json` says of the disabled apps, and the file it was read from. */
    state: AppsState;
    stateFile: string;
    /** The key the current workspace has in that file. */
    workspace: string;
    /** The second secret the address keys are made with. */
    secret: string;
    /** The folder the machine apps' stores are written in. */
    appData: string;
    /** The real paths of the folders closed to every app (reach/private.ts). */
    privateFolders: readonly string[];
    /** The file the `app_settings:` values are stored in, which a finding about them names. */
    settingsFile: string;
};

/** The SHA-256 of some bytes as hex. */
function sha(bytes: Uint8Array): string {
    return createHash('sha256').update(bytes).digest('hex');
}

function isFolder(path: string): boolean {
    try {
        return statSync(path).isDirectory();
    } catch {
        return false;
    }
}

function isFile(path: string): boolean {
    try {
        return lstatSync(path).isFile();
    } catch {
        return false;
    }
}

/** The names of the subfolders of an apps folder that may hold an app, sorted. */
function appFolders(folder: string): string[] {
    let entries;
    try {
        entries = readdirSync(folder, { withFileTypes: true });
    } catch {
        return [];
    }
    return entries
        .filter((one) => !one.name.startsWith('.') && (one.isDirectory() || one.isSymbolicLink()))
        .map((one) => one.name)
        .sort();
}

/** Read every apps folder named by `input` to the apps found, the findings and the folders. */
export function scanApps(input: ScanInput): AppsHeld {
    const held = noApps();
    const catalog: TextCatalog = textCatalog(input.config);
    const glyphs = new Set(Object.keys(readAs(mapShape, input.config.glyphs) ?? {}));
    const seen = new Set<string>();
    const limits = {
        files: input.settings.maxFiles,
        bytes: input.settings.maxMb * 1024 * 1024
    };

    const folders = closedPaths(input.config).folders;

    const note = (key: string, file: string, message: string): void => {
        held.findings.push({ file, key, message } satisfies Finding);
    };
    if (input.state.problem !== null) {
        const message = findingText(catalog, 'findings.apps.state_unread', input.state.problem);
        note('apps_state', input.stateFile, message);
    }

    const readApp = (folder: string, name: string, root: string, rootReal: string): void => {
        const key = findingKey(root, name);
        const manifestFile = join(folder, 'app.yml');
        const walk = walkApp(folder, limits);
        if (walk.tooLarge) {
            const message = findingText(
                catalog,
                'findings.apps.too_large',
                input.settings.maxFiles,
                input.settings.maxMb
            );
            note(key, manifestFile, message);
            return;
        }
        const recorded = new Set(walk.files.map((one) => one.path));
        const read = readManifest({
            file: manifestFile,
            folder: name,
            root,
            files: recorded,
            roots: input.roots,
            privateFolders: input.privateFolders,
            closedPaths: folders,
            glyphs,
            port: input.port,
            catalog
        });
        held.findings.push(...read.findings);
        if (read.manifest === null || read.bytes === null) return;
        const manifest = read.manifest;
        const bytes = read.bytes;
        const checked = checkThemes({
            folder,
            files: recorded,
            contributes: manifest.contributes,
            catalog,
            key,
            file: manifestFile
        });
        held.findings.push(...checked.findings);
        let hash: string;
        let manifestHash: string;
        try {
            manifestHash = sha(bytes);
            hash = hashApp(folder, name, bytes, walk.files);
        } catch (error) {
            const why = error instanceof Error ? error.message.split('\n')[0] : String(error);
            note(key, manifestFile, findingText(catalog, 'findings.apps.file_unreadable', why));
            return;
        }
        const id = appViewId(root, name);
        const keptHash = input.kept.get(id);
        const kept = keptHash === manifestHash;
        if (keptHash !== undefined && !kept) input.kept.delete(id);
        const hashApproved = input.approved.has(hash);
        const approved = kept || hashApproved;
        const standing = standingOf(input.state, input.workspace, id);
        const dataFolder = root === '' ? input.appData : join(rootReal, ROOT_DATA);
        const file = storeFile(dataFolder, name);
        const store = readStore(file, input.settings.storeMaxKb, false);
        const row: AppRow = {
            name,
            root,
            title: manifest.title,
            description: manifest.description,
            glyph: manifest.glyph,
            folder,
            entry: manifest.entry,
            reads: manifest.reads,
            writes: manifest.writes,
            connects: manifest.connects,
            host: manifest.host,
            readFolders: manifest.readFolders,
            secrets: manifest.secrets,
            activation: manifest.activation,
            depends: manifest.depends,
            contributes: checked.contributes,
            disabled: standing.disabled,
            machineDisabled: standing.machine,
            workspaceState: standing.workspace,
            files: walk.files.length,
            bytes: walk.bytes,
            hash,
            approved,
            hashApproved,
            kept,
            key: approved ? addressKey(input.secret, id, hash) : '',
            storeBytes: store.bytes,
            storeVersion: store.version,
            storeFile: file
        };
        const app: HeldApp = {
            id,
            row,
            rootDir: root === '' ? '' : rootReal,
            files: walk.files,
            manifestHash
        };
        held.apps.push(app);
    };

    const readFolder = (folder: string, root: string, rootReal: string): void => {
        seen.add(folder);
        held.folders.push(folder);
        for (const name of appFolders(folder)) {
            const typed = join(folder, name);
            const real = realPath(typed, true);
            if (real === null || !isFolder(real) || !isFile(join(real, 'app.yml'))) continue;
            if (seen.has(real)) {
                const message = findingText(catalog, 'findings.apps.repeated', real);
                note(findingKey(root, name), join(real, 'app.yml'), message);
                continue;
            }
            seen.add(real);
            if (lstatSync(typed).isSymbolicLink()) held.links.push(real);
            readApp(real, name, root, rootReal);
        }
    };

    let machineReal: string | null = null;
    if (input.machine !== null && existsAny(input.machine)) {
        const real = realPath(input.machine, true);
        if (real !== null && isFolder(real)) {
            machineReal = real;
            readFolder(real, '', '');
        } else {
            const message = findingText(
                catalog,
                'findings.apps.apps_dir_not_folder',
                input.machine
            );
            note('apps_dir', input.localFile, message);
        }
    }

    for (const root of input.roots) {
        if (root.key === ENGINE_ROOT) continue;
        const rootReal = realPath(root.dir, true);
        const typed = join(root.dir, ROOT_FOLDER, 'apps');
        if (rootReal === null || !existsAny(typed)) continue;
        const real = realPath(typed, true);
        if (real === null || !isFolder(real)) continue;
        const whole = findingKey(root.key, '');
        if (real !== rootReal && !below(real, rootReal)) {
            note(whole, typed, findingText(catalog, 'findings.apps.folder_outside', real));
            continue;
        }
        if (root.key === HUB_ROOT && real === machineReal) continue;
        if (seen.has(real)) {
            note(whole, typed, findingText(catalog, 'findings.apps.repeated', real));
            continue;
        }
        readFolder(real, root.key, rootReal);
    }

    dropTakenIds(held, catalog);
    noteUnboundKeys(held, catalog, input.config);
    judgeStored(held, {
        config: input.config,
        catalog,
        settingsFile: input.settingsFile,
        appearanceFile: join(dirname(input.localFile), 'appearance.yml')
    });
    return held;
}

/** Whether something is at the path, a link that points at nothing included. */
function existsAny(path: string): boolean {
    try {
        lstatSync(path);
        return true;
    } catch {
        return false;
    }
}
