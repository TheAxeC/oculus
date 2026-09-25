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
// The folder walked is the reader's, never the request's: the id names a manifest readManifests
// already found under the hub's own scan directories, and the folder is joined to the hub and
// checked against it again before anything is read. A request naming anything else is a 404.

import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { portfolioConfigFrom } from '../../data/index.ts';
import { loadConfig, loadLocalOrDefaults } from '../../data/sources/config.ts';
import { isMap } from '../../data/helpers/guards.ts';
import { readManifests } from '../../data/sources/manifests.ts';
import { sameOrigin } from '../core/auth.ts';
import type { PortfolioConfig } from '../../data/model/index.ts';

/**
 * What a file listing needs: the hub, its scan rules, and the merged config `file_index` sits in.
 */
export type FilesTarget = {
    hub: string;
    config: PortfolioConfig;
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
const CACHE = 'no-store';

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': CACHE }
    });
}

/** Whether a path is the folder itself or sits inside it. */
function inside(path: string, folder: string): boolean {
    const full = resolve(path);
    const root = resolve(folder);
    return full === root || full.startsWith(root + sep);
}

/**
 * The `file_index` block of the merged config: what is listed, how much of it, and whether at all.
 */
export function fileIndex(settings: Record<string, unknown>): {
    enabled: boolean;
    ext: string[];
    cap: number;
} {
    const block = isMap(settings.file_index) ? settings.file_index : {};
    const ext = Array.isArray(block.ext)
        ? block.ext.filter((one): one is string => typeof one === 'string')
        : [];
    const cap = typeof block.max_per_project === 'number' ? block.max_per_project : DEFAULT_CAP;
    return {
        enabled: block.enabled !== false,
        ext: (ext.length > 0 ? ext : DEFAULT_EXT).map((one) => one.toLowerCase()),
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
 * The files of the project the request names. Every refusal says what was wrong: a request with no
 * id at all is a 400, an id the reader does not know is a 404, and so is a folder that would leave
 * the hub.
 */
export function listFiles(into: FilesTarget, id: string): Response {
    if (id === '') return json(400, { error: 'no project id' });
    const { manifests } = readManifests(into.hub, into.config.scan, into.config.text);
    const manifest = manifests.find((one) => one.id === id);
    if (manifest === undefined) return json(404, { error: `no project with the id ${id}` });

    const folder = join(into.hub, manifest.folder);
    if (!inside(folder, into.hub)) return json(404, { error: 'the folder is not inside the hub' });

    const found = projectFiles(folder, into.settings);
    const answer: FilesAnswer = { ...found, folder: manifest.folder };
    return json(200, answer);
}

/**
 * What the route reads: the hub every write lands in, and the merged config beside it. The hub and
 * the scan rules come from the readers target() in lib/server/edit/writes.ts takes them from,
 * loadLocalOrDefaults and portfolioConfigFrom, rather than from a second reader of local.yml, and
 * the configuration is read once for both.
 */
export function filesTarget(engine: string): FilesTarget {
    const settings = loadConfig(engine).config;
    return {
        hub: loadLocalOrDefaults(engine).hub,
        config: portfolioConfigFrom(settings, engine),
        settings
    };
}

/** The whole endpoint: refuse a request from another origin, or list the project it names. */
export function handleProjectFiles(request: Request, into: FilesTarget): Response {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    const url = new URL(request.url);
    return listFiles(into, url.searchParams.get('id') ?? '');
}
