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
// the disk and its input: it holds nothing between reads, and the keeping of a machine app is the
// caller's map, edited here only to end a keeping whose manifest changed.

import { lstatSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { appViewId } from '../../../data/helpers/files/apps.ts';
import { HUB_ROOT, ROOT_FOLDER } from '../../../data/helpers/hub-names.ts';
import { findingText, type TextCatalog } from '../../../data/helpers/finding-text.ts';
import type { AppRow, Finding } from '../../../data/model/index.ts';
import { textCatalog, type AppsSettings } from '../../../data/sources/config.ts';
import { mapShape, readAs } from '../../../data/shapes/shapes.ts';
import { below, realPath } from '../../core/paths.ts';
import { ENGINE_ROOT, type Root } from '../../files/files.ts';
import { addressKey } from './address.ts';
import { noApps, type AppsHeld, type HeldApp } from './held.ts';
import { findingKey, readManifest } from './manifest.ts';
import { hashApp, walkApp } from './record.ts';
import { readStore, ROOT_DATA, storeFile } from './store.ts';

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
    /** The machine apps kept approved while edited: view id to the hash of the approved manifest.
     * */
    kept: Map<string, string>;
    /** The second secret the address keys are made with. */
    secret: string;
    /** The folder the machine apps' stores are written in. */
    appData: string;
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

    const note = (key: string, file: string, message: string): void => {
        held.findings.push({ file, key, message } satisfies Finding);
    };

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
        const read = readManifest({
            file: manifestFile,
            folder: name,
            root,
            files: new Set(walk.files.map((one) => one.path)),
            glyphs,
            port: input.port,
            catalog
        });
        held.findings.push(...read.findings);
        if (read.manifest === null || read.bytes === null) return;
        const manifest = read.manifest;
        const bytes = read.bytes;
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
        const kept = root === '' && keptHash === manifestHash;
        if (keptHash !== undefined && !kept) input.kept.delete(id);
        const approved = kept || input.approved.has(hash);
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
            files: walk.files.length,
            bytes: walk.bytes,
            hash,
            approved,
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
