// Layer 2, server. Which watch events rebuild the audit. The audit reads a project's documents and
// folders off the disk, so a README edited or removed, a required file made inside a project's
// code folder or a required folder made by hand reaches the open Findings view only through an
// event on that path; none of them is a `.yml` the portfolio watcher (portfolio.ts) would
// otherwise take.
//
// The paths are project-relative and come from each hub's merged settings, read again at every
// rebuild: the documents the marker scan reads (the Markdown files of `project_docs`), and from
// the hub's `audit:` setting (server/content/audit/setting.ts) the file and the folder of every
// `required_files` row and the file of every `required_sections` row. A project's folder may lie
// at any depth under a scan folder, so a path is matched by the last segments of the event's path.
// The rows' hub folders are not read: an event on a required path of a project the row leaves
// alone costs one rebuild that finds nothing new. The website's files the audit compares with what
// the hub's files give (the four paths of `website.files` that can be used,
// server/content/audit/website/) and the files of a workspace repository's project lie outside the
// recursive watches and are watched one by one (`auditFiles`).
//
// The folders whose contents never change what the snapshot holds are each hub's code folder
// (`code_dir`) and the folders of its `audit.skip_folders`: the filters here and the folder-glob
// drop rule (glob-drop.ts) leave them out. The paths and the folders of every hub are taken
// together, so a hub's folder is left out of the events of every hub.

import { join } from 'node:path';
import { folderOf } from '../../../../data/helpers/hub-names.ts';
import type { HubLayout, RepositoryRoot } from '../../../../data/model/index.ts';
import { projectDocList } from '../../../../data/sources/config/settings/hub-rows.ts';
import type { AuditSetting } from '../../../content/audit/scan.ts';

/** A path as its segments, without empty ones. */
function segmentsOf(path: string): string[] {
    return path.split(/[/\\]/).filter((part) => part !== '');
}

/**
 * What the watch filters of one rebuild read of the hubs' settings, as segments: the
 * project-relative paths an event on which rebuilds the audit, and the folders of a project an
 * event inside which changes nothing the snapshot holds.
 */
export type WatchScope = { paths: string[][]; never: string[][] };

/** The scope before any hub's settings are read: no audit path and no folder left out. */
export const NO_SCOPE: WatchScope = { paths: [], never: [] };

/** One hub as the scope reads it: its merged settings, its layout and its `audit:` setting. */
type ScopedHub = { merged: Record<string, unknown>; layout: HubLayout; setting: AuditSetting };

/**
 * The scope of the hubs of a rebuild: the Markdown documents of each hub's `project_docs`, the
 * files and folders each hub's `audit:` setting requires, and each hub's code folder and
 * `audit.skip_folders`.
 */
export function watchScope(hubs: readonly ScopedHub[]): WatchScope {
    const paths = new Set<string>();
    const never = new Set<string>();
    for (const { merged, layout, setting } of hubs) {
        for (const doc of projectDocList(merged)) {
            if (doc.name.endsWith('.md')) paths.add(doc.name);
        }
        for (const row of setting.requiredFiles) {
            paths.add(folderOf(row.file));
            if (row.folder !== undefined) paths.add(row.folder);
        }
        for (const row of setting.requiredSections) paths.add(folderOf(row.file));
        never.add(layout.codeDir);
        for (const one of layout.auditSkipFolders) never.add(one);
    }
    const asSegments = (all: Set<string>): string[][] =>
        [...all].map(segmentsOf).filter((one) => one.length > 0);
    return { paths: asSegments(paths), never: asSegments(never) };
}

/**
 * Where in the segments of a path the first of the folders `folders` begins, its segments in a
 * row, and -1 when the path lies in none.
 */
export function folderAt(parts: readonly string[], folders: readonly string[][]): number {
    for (let at = 0; at < parts.length; at += 1) {
        const hit = folders.some(
            (folder) =>
                at + folder.length <= parts.length &&
                folder.every((one, index) => parts[at + index] === one)
        );
        if (hit) return at;
    }
    return -1;
}

/**
 * Whether the segments of a path end with one of the audit paths. A path inside a folder of
 * `never` is taken only when the audit path it ends with starts at or above that folder, so with
 * the code folder `code`, `code/README.md` and a required `code/LICENSE` are taken and a file
 * deeper in the deposit is not.
 */
export function audited(parts: readonly string[], scope: WatchScope): boolean {
    const never = folderAt(parts, scope.never);
    return scope.paths.some((want) => {
        const start = parts.length - want.length;
        if (start < 0 || (never >= 0 && start > never)) return false;
        return want.every((one, at) => parts[start + at] === one);
    });
}

/**
 * The filter of a watch event under the scope of this rebuild: a YAML file, a Markdown file, or an
 * audit path, outside every folder of `never` but for an audit path that names one. A Markdown
 * file is here because the slide files of a deck are read into the snapshot's findings, so a slide
 * saved has to reach the audit the way a changed manifest does; the build's own filter keeps only
 * the ones of a deck.
 */
export function relevantTo(scope: WatchScope): (filename: string | null) => boolean {
    return (filename) => {
        if (filename === null || filename === '') return false;
        const parts = segmentsOf(filename);
        if (parts.length === 0) return false;
        if (audited(parts, scope)) return true;
        if (folderAt(parts, scope.never) >= 0) return false;
        const name = parts[parts.length - 1];
        return name.endsWith('.yml') || name.endsWith('.md');
    };
}

/**
 * The files the audit reads that no recursive watch serves, each watched through its folder: the
 * website's files of the primary hub, as absolute paths, and for a project of a workspace
 * repository each audit path and each folder on the way to it, so a code folder made and the
 * README then written in it are both heard. Absolute paths.
 */
export function auditFiles(
    website: readonly string[],
    roots: readonly RepositoryRoot[],
    paths: readonly string[][]
): string[] {
    const files = new Set<string>(website);
    for (const root of roots) {
        for (const path of paths) {
            for (let end = 1; end <= path.length; end += 1) {
                files.add(join(root.dir, ...path.slice(0, end)));
            }
        }
    }
    return [...files];
}
