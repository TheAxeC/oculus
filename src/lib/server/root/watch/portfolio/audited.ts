// Layer 2, server. Which watch events rebuild the audit. The audit reads a project's documents and
// folders off the disk, so a README edited or removed, a required file made inside a project's
// `code/` folder or a required folder made by hand reaches the open Audit view only through an
// event on that path; none of them is a `.yml` the portfolio watcher (portfolio.ts) would
// otherwise take.
//
// The paths are project-relative and come from the hubs' `audit:` settings
// (server/content/audit/setting.ts), read again at every rebuild: the documents the marker scan
// reads (`AUDIT_PATHS`), the file and the folder of every `required_files` row and the file of
// every `required_sections` row. A project's folder may lie at any depth under a scan folder, so a
// path is matched by the last segments of the event's path. The rows' hub folders are not read: an
// event on a required path of a project the row leaves alone costs one rebuild that finds nothing
// new. The website's files the audit compares with what the hub's files give (the four paths of
// `website.files` that can be used, server/content/audit/website/) and the files of a workspace
// repository's project lie outside the recursive watches and are watched one by one (`auditFiles`).

import { join } from 'node:path';
import { folderOf } from '../../../../data/helpers/hub-names.ts';
import type { RepositoryRoot } from '../../../../data/model/index.ts';
import { AUDIT_PATHS, type AuditSetting } from '../../../content/audit/scan.ts';

/**
 * Folders whose contents never change what the snapshot holds: a project's deposit and its
 * attic hold tens of thousands of files between them.
 */
const NEVER = ['code', 'attic'];

/** A path as its segments, without empty ones. */
function segmentsOf(path: string): string[] {
    return path.split(/[/\\]/).filter((part) => part !== '');
}

/**
 * The project-relative paths an event on which rebuilds the audit, as segments: the documents the
 * marker scan reads, and the files and folders the hubs' settings require.
 */
export function auditPaths(settings: readonly AuditSetting[]): string[][] {
    const paths = new Set<string>(AUDIT_PATHS);
    for (const setting of settings) {
        for (const row of setting.requiredFiles) {
            paths.add(folderOf(row.file));
            if (row.folder !== undefined) paths.add(row.folder);
        }
        for (const row of setting.requiredSections) paths.add(folderOf(row.file));
    }
    return [...paths].map(segmentsOf).filter((one) => one.length > 0);
}

/**
 * Whether the segments of a path end with one of the audit paths. A path holding a `code` or
 * `attic` segment is taken only when the audit path it ends with covers every such segment, so
 * `code/README.md` and a required `code/LICENSE` are taken and a file deeper in the deposit is not.
 */
export function audited(parts: readonly string[], paths: readonly string[][]): boolean {
    const never = parts.findIndex((part) => NEVER.includes(part));
    return paths.some((want) => {
        const start = parts.length - want.length;
        if (start < 0 || (never >= 0 && start > never)) return false;
        return want.every((one, at) => parts[start + at] === one);
    });
}

/**
 * The filter of a watch event under the paths of this rebuild: a YAML file, a Markdown file, or an
 * audit path, outside every `code/` and `attic/` folder but for an audit path that names one. A
 * Markdown file is here because the slide files of a deck are read into the snapshot's findings,
 * so a slide saved has to reach the audit the way a changed manifest does; the build's own filter
 * keeps only the ones of a deck.
 */
export function relevantTo(paths: readonly string[][]): (filename: string | null) => boolean {
    return (filename) => {
        if (filename === null || filename === '') return false;
        const parts = segmentsOf(filename);
        if (parts.length === 0) return false;
        if (audited(parts, paths)) return true;
        if (parts.some((part) => NEVER.includes(part))) return false;
        const name = parts[parts.length - 1];
        return name.endsWith('.yml') || name.endsWith('.md');
    };
}

/**
 * The files the audit reads that no recursive watch serves, each watched through its folder: the
 * website's files of the primary hub, as absolute paths, and for a project of a workspace
 * repository each audit path and each folder on the way to it, so a `code/` folder made and the
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
