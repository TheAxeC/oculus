// Layer 2, server. The records folded into the two-level tree the session views draw.
//
// A session is not naturally filed anywhere: a transcript records a working directory and a pile
// of touched paths, nothing more. This arranges those into workspace (the checkout the session
// sits in) and area (the project inside it that is actually being worked on), so twelve open
// sessions read as four places rather than one list.
//
// The area is inferred, not declared. Every file the session touched votes for the project folder
// holding it, the working directory votes twice, and the winner takes the session. That heuristic
// is wrong sometimes, which is why the overrides file can pin a session to an area by hand.
//
// The caller supplies the project folders; nothing here walks the hub, so it is cheap enough to
// run on every push and testable without a repository.

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, normalize, relative, sep } from 'node:path';
import type {
    Area,
    GroupedSession,
    SecondaryArea,
    SessionFile,
    SessionRecord,
    Workspace
} from '../../data/model.ts';
import { isMap } from './json.ts';
import { overrides as readOverrides, type Override } from './overrides.ts';

export const GENERAL = '(general)';
export const UNKNOWN_NAME = '(unknown)';

/** The working directory counts double: it beats a file the session read once. */
export const CWD_POINTS = 2;
/** How many segments below the workspace an unknown directory is clamped to. */
export const AREA_DEPTH = 2;
export const FILE_POINTS = 1;
export const SECONDARY_MIN_SCORE = 2;
export const MAX_SECONDARY = 3;

/** ~/workspace, ~/data and ~, resolved at the call rather than at import. */
export function defaultRoots(): string[] {
    const home = homedir();
    return [join(home, 'workspace'), join(home, 'data'), home];
}

/** A project folder the caller knows about: its absolute path and the project's title. */
export type ProjectFolder = string | [string, string];

type Score = { score: number; last: string };

/**
 * Arrange records into workspaces and areas, newest activity first at every level. Never throws:
 * a record that cannot be placed is left out and the rest come back. The input records are not
 * modified; every grouped session is a copy.
 */
export function group(
    records: SessionRecord[],
    projectFolders: ProjectFolder[] = [],
    roots: string[] | null = null,
    attachedIds: Iterable<string> = [],
    overridesPath?: string
): Workspace[] {
    try {
        return build(records, projectFolders, roots, attachedIds, overridesPath);
    } catch {
        return [];
    }
}

function build(
    records: SessionRecord[],
    projectFolders: ProjectFolder[],
    roots: string[] | null,
    attachedIds: Iterable<string>,
    overridesPath: string | undefined
): Workspace[] {
    const { folders, titles } = readFolders(projectFolders);
    const rootList = readRoots(roots);
    const pins = readOverrides(overridesPath);
    const attached = identifiers(attachedIds);
    const workspaces = new Map<string, { workspace: Workspace; areas: Map<string, Area> }>();
    const resolved = new Map<string, string>();
    for (const record of Array.isArray(records) ? records : []) {
        if (!isMap(record)) continue;
        try {
            place(record, workspaces, folders, titles, rootList, pins, attached, resolved);
        } catch {
            continue;
        }
    }
    return ordered(workspaces);
}

function place(
    record: SessionRecord,
    workspaces: Map<string, { workspace: Workspace; areas: Map<string, Area> }>,
    folders: string[],
    titles: Map<string, string>,
    roots: string[],
    pins: Record<string, Override>,
    attached: Set<string>,
    resolved: Map<string, string>
): void {
    const override = pins[record.id] ?? {};
    const cwd = clean(record.cwd);
    let workspace = workspaceOf(cwd, roots, resolved);
    const scores = score(record, cwd, workspace, folders);
    let primary = primaryArea(scores);

    const forced = clean(typeof override.area === 'string' ? override.area : '');
    if (forced) {
        workspace = forcedWorkspace(forced, workspace, roots, resolved);
        primary = forced;
    }
    if (!primary) primary = general(workspace);

    const session: GroupedSession = {
        ...record,
        workspace,
        area: primary,
        secondaryAreas: secondary(scores, primary, workspace),
        kind: attached.has(record.id) ? 'attached' : 'observed',
        pinned: Boolean(forced)
    };
    if (typeof override.title === 'string' && override.title) session.title = override.title;

    let bucket = workspaces.get(workspace);
    if (bucket === undefined) {
        bucket = {
            workspace: { key: workspace, name: nameOf(workspace), lastActivity: null, areas: [] },
            areas: new Map()
        };
        workspaces.set(workspace, bucket);
    }
    let area = bucket.areas.get(primary);
    if (area === undefined) {
        const short = shortLabel(primary, workspace);
        area = {
            key: primary,
            short,
            full: titles.get(primary) ?? short,
            known: titles.has(primary) || folders.includes(primary),
            lastActivity: null,
            sessions: []
        };
        bucket.areas.set(primary, area);
    }
    area.sessions.push(session);
}

/** A pinned area outside the session's own workspace moves the session with it. */
function forcedWorkspace(
    forced: string,
    workspace: string,
    roots: string[],
    resolved: Map<string, string>
): string {
    if (!isAbsolute(forced) || inside(forced, workspace)) return workspace;
    return workspaceOf(forced, roots, resolved);
}

// ------------------------------------------------------------------ workspace

function workspaceOf(cwd: string, roots: string[], resolved: Map<string, string>): string {
    if (!cwd) return '';
    const known = resolved.get(cwd);
    if (known !== undefined) return known;
    const found = gitRoot(cwd) || rootChild(cwd, roots) || cwd;
    resolved.set(cwd, found);
    return found;
}

/** The nearest ancestor holding a `.git` entry. A worktree's is a file, not a directory. */
function gitRoot(path: string): string {
    let current = path;
    for (;;) {
        try {
            if (existsSync(join(current, '.git'))) return current;
        } catch {
            return '';
        }
        const parent = dirname(current);
        if (parent === current) return '';
        current = parent;
    }
}

/** The first segment below the deepest configured root, so ~/workspace wins over ~. */
function rootChild(path: string, roots: string[]): string {
    for (const root of roots) {
        if (inside(path, root) && path !== root) {
            const rest = relative(root, path).split(sep);
            return join(root, rest[0]);
        }
    }
    return '';
}

function nameOf(workspace: string): string {
    if (!workspace) return UNKNOWN_NAME;
    return basename(workspace) || workspace;
}

// ------------------------------------------------------------------ scoring

/** Area to its accumulated score, and the newest stamp that contributed to it. */
function score(
    record: SessionRecord,
    cwd: string,
    workspace: string,
    folders: string[]
): Map<string, Score> {
    const scores = new Map<string, Score>();
    const files: unknown = record.files;
    for (const entry of Array.isArray(files) ? files : []) {
        if (!isMap(entry)) continue;
        const path = clean((entry as SessionFile).path);
        if (!path) continue;
        vote(
            scores,
            areaOf(path, folders, false, workspace),
            workspace,
            FILE_POINTS,
            (entry as SessionFile).last
        );
    }
    if (cwd) {
        vote(
            scores,
            areaOf(cwd, folders, true, workspace),
            workspace,
            CWD_POINTS,
            record.lastActivity
        );
    }
    return scores;
}

function vote(
    scores: Map<string, Score>,
    area: string,
    workspace: string,
    points: number,
    stamp: unknown
): void {
    if (!inside(area, workspace)) return;
    const entry = scores.get(area) ?? { score: 0, last: '' };
    entry.score += points;
    if (typeof stamp === 'string' && stamp > entry.last) entry.last = stamp;
    scores.set(area, entry);
}

/**
 * The deepest project folder holding the path, else the directory the path lives in, clamped to
 * AREA_DEPTH segments below the workspace. Without the clamp a session that reads four files out
 * of one subfolder is filed under that subfolder rather than the place it is working.
 */
function areaOf(path: string, folders: string[], isDir: boolean, workspace: string): string {
    for (const folder of folders) {
        if (inside(path, folder)) return folder;
    }
    return clamp(isDir ? path : dirname(path), workspace);
}

function clamp(folder: string, workspace: string): string {
    if (!workspace || !inside(folder, workspace)) return folder;
    const rest = relative(workspace, folder).split(sep);
    if (rest.length <= AREA_DEPTH || rest[0] === '..') return folder;
    return join(workspace, ...rest.slice(0, AREA_DEPTH));
}

/** Score first, then recency, then depth, so a project beats the parent directory holding it. */
function rank(scores: Map<string, Score>, area: string): [number, string, number] {
    const entry = scores.get(area) ?? { score: 0, last: '' };
    return [entry.score, entry.last, area.length];
}

function compareRank(scores: Map<string, Score>, a: string, b: string): number {
    const left = rank(scores, a);
    const right = rank(scores, b);
    if (left[0] !== right[0]) return left[0] - right[0];
    if (left[1] !== right[1]) return left[1] < right[1] ? -1 : 1;
    return left[2] - right[2];
}

function primaryArea(scores: Map<string, Score>): string {
    // Sorted by name first, so two areas that tie on every rank component order the same way twice.
    const areas = [...scores.keys()].sort();
    let best = '';
    for (const area of areas) {
        if (best === '' || compareRank(scores, area, best) > 0) best = area;
    }
    return best;
}

function secondary(
    scores: Map<string, Score>,
    primary: string,
    workspace: string
): SecondaryArea[] {
    const others = [...scores.keys()]
        .filter(
            (area) =>
                area !== primary &&
                (scores.get(area)?.score ?? 0) >= SECONDARY_MIN_SCORE &&
                inside(area, workspace)
        )
        .sort();
    others.sort((a, b) => compareRank(scores, b, a));
    return others
        .slice(0, MAX_SECONDARY)
        .map((area) => ({ key: area, short: shortLabel(area, workspace) }));
}

// ------------------------------------------------------------------ labels

function general(workspace: string): string {
    return join(workspace, GENERAL);
}

function shortLabel(area: string, workspace: string): string {
    if (area === general(workspace)) return GENERAL;
    if (area === workspace) return basename(workspace) || workspace;
    if (inside(area, workspace)) return relative(workspace, area);
    return area;
}

// ------------------------------------------------------------------ ordering

function ordered(
    workspaces: Map<string, { workspace: Workspace; areas: Map<string, Area> }>
): Workspace[] {
    const out: Workspace[] = [];
    for (const bucket of workspaces.values()) {
        const areas = [...bucket.areas.values()];
        for (const area of areas) {
            sortByActivity(area.sessions, (session) => session.id || '');
            area.lastActivity = newest(area.sessions);
        }
        sortByActivity(areas, (area) => area.key);
        bucket.workspace.areas = areas;
        bucket.workspace.lastActivity = newest(areas);
        out.push(bucket.workspace);
    }
    sortByActivity(out, (workspace) => workspace.key);
    return out;
}

/** Newest first, with a stable tiebreak so two silent items keep a fixed order. */
function sortByActivity<T extends { lastActivity?: string | null }>(
    items: T[],
    tiebreak: (item: T) => string
): void {
    items.sort((a, b) => {
        const left = tiebreak(a);
        const right = tiebreak(b);
        return left < right ? -1 : left > right ? 1 : 0;
    });
    items.sort((a, b) => {
        const left = stampOf(a);
        const right = stampOf(b);
        return left < right ? 1 : left > right ? -1 : 0;
    });
}

function stampOf(item: { lastActivity?: string | null }): string {
    return typeof item.lastActivity === 'string' ? item.lastActivity : '';
}

function newest(items: { lastActivity?: string | null }[]): string | null {
    let best = '';
    for (const item of items) {
        const stamp = stampOf(item);
        if (stamp > best) best = stamp;
    }
    return best || null;
}

// ------------------------------------------------------------------ inputs

/** Accepts paths or [path, title] pairs. Deepest first, so areaOf matches the deepest holder. */
function readFolders(projectFolders: ProjectFolder[]): {
    folders: string[];
    titles: Map<string, string>;
} {
    const paths = new Set<string>();
    const titles = new Map<string, string>();
    for (const item of Array.isArray(projectFolders) ? projectFolders : []) {
        let path = '';
        let title = '';
        if (Array.isArray(item)) {
            path = clean(item[0]);
            title = typeof item[1] === 'string' ? item[1] : '';
        } else {
            path = clean(item);
        }
        if (!path) continue;
        paths.add(path);
        if (title) titles.set(path, title);
    }
    return { folders: [...paths].sort(byDepth), titles };
}

function readRoots(roots: string[] | null): string[] {
    const cleaned = new Set<string>();
    for (const root of roots ?? defaultRoots()) {
        const path = clean(root);
        if (path) cleaned.add(path);
    }
    return [...cleaned].sort(byDepth);
}

/** Longest first, then reverse alphabetical, which is the cockpit's order and is deterministic. */
function byDepth(a: string, b: string): number {
    if (a.length !== b.length) return b.length - a.length;
    return a < b ? 1 : a > b ? -1 : 0;
}

function identifiers(attachedIds: Iterable<string>): Set<string> {
    try {
        return new Set(attachedIds);
    } catch {
        return new Set();
    }
}

function clean(path: unknown): string {
    if (typeof path !== 'string' || !path) return '';
    return normalize(path);
}

function inside(path: string, base: string): boolean {
    if (!path || !base) return false;
    if (path === base) return true;
    return path.startsWith(base.endsWith(sep) ? base : base + sep);
}
