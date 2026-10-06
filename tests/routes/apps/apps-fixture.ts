// Layer 4, test helper. A synthetic apps folder read the way the watcher reads it, and approved by
// the hash the reader shows, for the tests of the routes that answer for apps.
//
// Every folder is under the system temporary directory (tests/fixtures/scratch.ts), so a case
// never reads or writes the machine's own apps folder or `~/.oculus`.

import { join } from 'node:path';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { appsSettings } from '../../../src/lib/data/sources/config.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { approvedApps } from '../../../src/lib/server/machine/approvals/approvals.ts';
import { scanApps } from '../../../src/lib/server/machine/apps/scan.ts';
import type { AppsHeld } from '../../../src/lib/server/machine/apps/held.ts';
import { diskFs } from '../../../src/lib/server/machine/apps/open.ts';
import type { AppsRouteOptions } from '../../../src/lib/server/machine/apps/routes.ts';
import type { ServeInput } from '../../../src/lib/server/machine/apps/serve.ts';
import { plantScratch } from '../../fixtures/scratch.ts';

export const PORT = 8787;

export const { config } = loadConfig(engineDir());
export const settings = appsSettings(config);

export const MANIFEST = 'name: notes\ntitle: Reading notes\nbridge: 1\n';
export const PAGE = '<!doctype html><title>notes</title>\n';

/** The files of a folder `notes` holding the given manifest and an `index.html`. */
export function notesFiles(manifest: string = MANIFEST): Record<string, string> {
    return { 'notes/app.yml': manifest, 'notes/index.html': PAGE, 'notes/app.js': 'let a = 1;\n' };
}

/** What a case plants: the machine's folder and each root's files. */
export type Planted = {
    machine?: Record<string, string>;
    roots?: Record<string, Record<string, string>>;
};

export type Fixture = {
    base: string;
    machine: string;
    roots: { key: string; dir: string }[];
    /** Read every folder again, approving the given hashes. */
    scan: (approved: ReadonlySet<string>) => AppsHeld;
};

/** Plant the files and return a reader of them. */
export function plant(planted: Planted): Fixture {
    const files: Record<string, string> = {};
    for (const [path, body] of Object.entries(planted.machine ?? {})) {
        files[`machine/${path}`] = body;
    }
    for (const [key, held] of Object.entries(planted.roots ?? {})) {
        for (const [path, body] of Object.entries(held)) files[`roots/${key}/${path}`] = body;
    }
    const base = plantScratch('oculus-apps-', files, ['machine']);
    const machine = join(base, 'machine');
    const roots = Object.keys(planted.roots ?? {}).map((key) => ({
        key,
        dir: join(base, 'roots', key)
    }));
    return {
        base,
        machine,
        roots,
        scan: (approved) =>
            scanApps({
                machine,
                localFile: join(base, 'local.yml'),
                roots,
                config,
                settings,
                port: PORT,
                approved,
                kept: new Map(),
                secret: 'secret',
                appData: join(base, 'data')
            })
    };
}

/** The held apps of a fixture with every app it holds approved. */
export function approvedHeld(fixture: Fixture): AppsHeld {
    const hashes = fixture.scan(new Set()).apps.map((one) => one.row.hash);
    return fixture.scan(new Set(hashes));
}

/** The input the file route builds for a request, over a held state. */
export function serveInput(request: Request, held: AppsHeld): ServeInput {
    return {
        request,
        held,
        limits: () => ({ files: settings.maxFiles, bytes: settings.maxMb * 1024 * 1024 }),
        penpal: () => Buffer.from('export const penpal = 1;\n'),
        oculus: 'export const oculus = 1;\n'
    };
}

/** What the three /api/ routes of the apps are given, over a planted fixture. */
export type RouteSetup = {
    fixture: Fixture;
    options: AppsRouteOptions;
    /** The held state now. */
    held: () => AppsHeld;
    /** The approvals file of the case, which a case that approves writes. */
    approvals: string;
    /** The view ids `keep` was called for and `unkeep` has not removed. */
    kept: string[];
};

/**
 * The options of the routes over a planted fixture: the watcher's `reread` reads the folders with
 * the hashes the approvals file holds, `closed_paths` is `[secrets]`, and the file system is the
 * disk. Any option can be replaced.
 */
export function routeSetup(planted: Planted, over: Partial<AppsRouteOptions> = {}): RouteSetup {
    const fixture = plant(planted);
    const approvals = join(fixture.base, 'approvals.json');
    const kept: string[] = [];
    let held = fixture.scan(approvedApps(approvals));
    const options: AppsRouteOptions = {
        apps: {
            held: () => held,
            reread: () => {
                held = fixture.scan(approvedApps(approvals));
            },
            keep: (id) => kept.push(id),
            unkeep: (id) => kept.splice(0, kept.length, ...kept.filter((one) => one !== id))
        },
        approvalsFile: () => approvals,
        writes: fsWrites(),
        storeMaxKb: () => settings.storeMaxKb,
        roots: () => fixture.roots,
        configDir: join(fixture.base, 'engine'),
        closedPaths: () => ['secrets'],
        fs: diskFs,
        ...over
    };
    return { fixture, options, held: () => held, approvals, kept };
}
