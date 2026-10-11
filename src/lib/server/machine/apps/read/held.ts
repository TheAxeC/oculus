// Layer 2, server. What the apps watcher holds after a read, and the lookups every route makes in
// it.
//
// A held app is the row the page is sent and what only the server needs beside it: the real folder
// of the app's root (the store of a root app lies in it), the recorded files with the stat each had
// at the walk, and the hash of the manifest's bytes, which is what keeping a machine app approved
// compares. The `apps` channel carries rows, findings and folders; everything else here stays on
// the server.

import { appViewId } from '../../../../data/helpers/files/apps/apps.ts';
import type { AppRow, AppsPayload, Finding } from '../../../../data/model/index.ts';
import type { AppFile } from './record.ts';

export type HeldApp = {
    /** The app's view id, `app:<name>` or `app:<root key>/<name>`. */
    id: string;
    row: AppRow;
    /** The real folder of the app's root, and the empty string for a machine app. */
    rootDir: string;
    /** The recorded files in sorted path order, with the stat each had when it was walked. */
    files: AppFile[];
    /** The SHA-256 of the manifest's bytes as hex. */
    manifestHash: string;
};

/**
 * Every app the last read found, what was wrong with the folders read, the apps folders, and the
 * real paths of the app folders that are themselves links, which a watcher has to open one by one.
 */
export type AppsHeld = {
    apps: HeldApp[];
    findings: Finding[];
    folders: string[];
    links: string[];
};

/** The state before any read: no app, no finding, no folder. */
export function noApps(): AppsHeld {
    return { apps: [], findings: [], folders: [], links: [] };
}

/** What the `apps` channel carries for a held state. */
export function payloadOf(held: AppsHeld): AppsPayload {
    return {
        rows: held.apps.map((one) => one.row),
        findings: held.findings,
        folders: held.folders
    };
}

/** The held app with this view id, or undefined. */
export function appById(held: AppsHeld, id: string): HeldApp | undefined {
    return held.apps.find((one) => one.id === id);
}

/** The held app of this root key and name, the root key empty for a machine app. */
export function appOf(held: AppsHeld, root: string, name: string): HeldApp | undefined {
    return appById(held, appViewId(root, name));
}
