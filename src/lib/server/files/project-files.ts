// Layer 2, server. The files of one project folder, for the finder on an expanded card.
//
// routes/api/(files)/project-files/+server.ts is the endpoint and holds nothing but its GET, since
// a route module may export only its verbs. The walk is here, and it is bounded the way
// config/behavior.yml bounds it: only the extensions of `file_index.ext`, at most
// `file_index.max_per_project` rows newest first, and the noise folders below skipped whole.
// DESIGN.md's wire model keeps this out of the snapshot for the same reason documents are out of
// it: a card asks for its own folder when it is opened, and a board of fifty projects reads
// nothing.
//
// The folder walked is the reader's, never the request's: the id names a manifest hubManifests
// already found under the scan directories of the hub the id names (`<root key>:<id>` for a hub
// other than the first) or in a repository the first hub's `roots:` reads as a project,
// and the folder is joined to that hub (or is the repository) and checked against it again before
// anything is read. A request naming anything else is a 404. The answer's `folder` is relative to
// the root that holds the project: its own hub, or empty for a repository.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`inside`).

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { splitHubId } from '../../data/helpers/hub-names.ts';
import { loadLocal } from '../../data/sources/config.ts';
import { manifestDir } from '../../data/sources/manifests.ts';
import type { PortfolioConfig } from '../../data/model/index.ts';
import { inside } from '../core/paths.ts';
import { firstHubConfig, hubManifests, hubTargets, type HubTarget } from './roots.ts';
import { anyNumberShape } from '../../data/shapes/shapes.ts';

/**
 * What a file listing needs: the hub, its scan rules, and the merged config `file_index` sits in.
 */
export type FilesTarget = {
    hub: string;
    config: PortfolioConfig;
    /** The hubs other than the first, whose projects are named `<root key>:<id>`. */
    hubs?: HubTarget[];
    /** The merged config of config/*.yml, read for `file_index` and nothing else. */
    settings: Record<string, unknown>;
};

/**
 * One file of a project folder: its folder-relative path, its size in bytes, and its last write.
 */
export type FileRow = { path: string; size: number; mtime: number };

/** What the walk found: the rows newest first, and whether the cap cut the list short. */
export type ProjectFiles = { rows: FileRow[]; truncated: boolean };

/** What the endpoint answers with: the rows, the cap, and the folder they are relative to. */
export type FilesAnswer = ProjectFiles & {
    /** The project's folder relative to the hub, which is what a row's link is built on. */
    folder: string;
};

/**
 * The folders the walk never descends into: a checkout, a cache and a virtual environment hold
 * nothing anybody looks for on a project card, and one of them alone can hold more files than the
 * hub does.
 */
export const SKIP_DIRS = [
    '.git',
    '__pycache__',
    'node_modules',
    '.venv',
    'venv',
    '.ipynb_checkpoints',
    '.mypy_cache',
    '.pytest_cache',
    '.DS_Store',
    'wandb',
    '__MACOSX'
];

/** The extensions listed when the config names none. */
const DEFAULT_EXT = [
    '.pdf',
    '.tex',
    '.bib',
    '.md',
    '.yml',
    '.yaml',
    '.py',
    '.sh',
    '.slurm',
    '.ipynb',
    '.csv',
    '.json',
    '.png',
    '.jpg',
    '.svg',
    '.txt'
];

/** The cap when the config names none. */
const DEFAULT_CAP = 400;

/** A listing is walked again whenever a card is opened, so nothing here is ever cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/**
 * The `file_index` block as the walk reads it. A switch that is not a boolean reads as on, a list
 * of extensions keeps its text items and reads as empty when it is no list, and a cap that is not
 * a number reads as the default; `typeof` is the whole test of a number, so one that is not finite
 * is a number here.
 */
const fileIndexShape = z.object({
    enabled: z.boolean().catch(true),
    ext: z
        .array(z.unknown())
        .transform((all) => all.filter((one): one is string => typeof one === 'string'))
        .catch(() => []),
    max_per_project: anyNumberShape.catch(DEFAULT_CAP)
});

/**
 * The `file_index` block of the merged config: what is listed, how much of it, and whether at all.
 */
export function fileIndex(settings: Record<string, unknown>): {
    enabled: boolean;
    ext: string[];
    cap: number;
} {
    const parsed = fileIndexShape.safeParse(settings.file_index);
    const block = parsed.success ? parsed.data : fileIndexShape.parse({});
    const cap = block.max_per_project;
    return {
        enabled: block.enabled,
        ext: (block.ext.length > 0 ? block.ext : DEFAULT_EXT).map((one) => one.toLowerCase()),
        cap: cap > 0 ? Math.trunc(cap) : DEFAULT_CAP
    };
}

/** Hub-relative path with forward slashes, whatever the platform's separator is. */
function relPath(root: string, full: string): string {
    return relative(root, full).split(sep).join('/');
}

/**
 * Every file of one project folder the config lists, newest first, capped. A folder that is not
 * there, and a config with `file_index.enabled: false`, both give no rows and no truncation rather
 * than an error: a card with nothing to show shows nothing. Nothing here throws: a folder that
 * cannot be read costs that folder and no more.
 */
export function projectFiles(folder: string, settings: Record<string, unknown>): ProjectFiles {
    const index = fileIndex(settings);
    if (!index.enabled) return { rows: [], truncated: false };
    const rows: FileRow[] = [];
    walk(folder, folder, index.ext, rows);
    rows.sort((left, right) => right.mtime - left.mtime || left.path.localeCompare(right.path));
    return { rows: rows.slice(0, index.cap), truncated: rows.length > index.cap };
}

function walk(root: string, dir: string, ext: string[], rows: FileRow[]): void {
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return;
    }
    for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (SKIP_DIRS.includes(entry.name)) continue;
            walk(root, full, ext, rows);
            continue;
        }
        if (!entry.isFile()) continue;
        if (!ext.some((one) => entry.name.toLowerCase().endsWith(one))) continue;
        try {
            const stat = statSync(full);
            rows.push({ path: relPath(root, full), size: stat.size, mtime: stat.mtimeMs });
        } catch {
            continue;
        }
    }
}

/**
 * The files under `folder`, which must lie inside `bound`, the folder of the root that holds the
 * project. The answer's `folder` is `path`, the project's folder against that root: the
 * hub-relative folder of a hub project, and empty for a project of a repository.
 */
function listIn(
    folder: string,
    bound: string,
    path: string,
    settings: Record<string, unknown>
): Response {
    if (!inside(folder, bound))
        return json(
            { error: 'the folder is not inside its root' },
            { status: 404, headers: NO_STORE }
        );
    const answer: FilesAnswer = { ...projectFiles(folder, settings), folder: path };
    return json(answer, { headers: NO_STORE });
}

/**
 * The files of the project the request names. Every refusal says what was wrong: a request with no
 * id at all is a 400, an id the reader does not know is a 404, and so is a folder that would leave
 * its root. A project of a repository is listed from the repository, against its own root.
 */
export function listFiles(into: FilesTarget, id: string): Response {
    if (id === '') return json({ error: 'no project id' }, { status: 400, headers: NO_STORE });
    const hubs = into.hubs ?? [];
    const named = splitHubId(
        id,
        hubs.map((one) => one.key)
    );
    const owner = hubs.find((one) => one.key === named.root) ?? {
        hub: into.hub,
        config: into.config
    };
    const manifest = hubManifests(owner.hub, owner.config).find((one) => one.id === named.id);
    if (manifest === undefined)
        return json({ error: `no project with the id ${id}` }, { status: 404, headers: NO_STORE });
    const { repository } = manifest;
    const folder = manifestDir(owner.hub, manifest);
    if (repository !== undefined) return listIn(folder, repository.dir, '', into.settings);
    return listIn(folder, owner.hub, manifest.folder, into.settings);
}

/**
 * What the route reads: the hub every write lands in, and the request's merged config beside it.
 * The hub and the scan rules come from the readers target() in lib/server/edit/writes.ts takes them
 * from, loadLocal and firstHubConfig, rather than from a second reader of local.yml.
 */
export function filesTarget(engine: string, settings: Record<string, unknown>): FilesTarget {
    const local = loadLocal(engine);
    return {
        hub: local.hub,
        config: firstHubConfig({ config: settings, engine, local }),
        hubs: hubTargets({ config: settings, engine, local }),
        settings
    };
}

/** The whole endpoint: the files of the project the request names. */
export function handleProjectFiles(request: Request, into: FilesTarget): Response {
    const url = new URL(request.url);
    return listFiles(into, url.searchParams.get('id') ?? '');
}
