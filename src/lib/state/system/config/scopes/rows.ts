// Layer 2, client state. The groups of the Settings view as the scope on screen draws them, and the
// file the scope reads and writes. A scope draws the rows whose key its file takes (scope.ts
// `takes`) under today's headings, a heading with none left out and a heading's file lines kept
// only for the files it still draws rows from; the settings the apps declare in the primary hub's
// file alone; and the Catalogs, Schemas and Texts groups, which show oculus's own files, in every
// scope. The Repository scope draws its folder's row of `editor.languages` in the place of the
// workspace's.
//
// The scope's file is named as the scope bar names it, with whether it is there, why nothing is
// written to it while it is being read, cannot be read, is cut or does not parse (each row of the
// scope then says so too and holds nothing), and the digest of the text the page read, which a
// save is checked against. A file that is not there has the digest of an absent file, and the
// first change makes it.

import { textDigest, type LocalFile } from '../../../../data/shapes/config-save.ts';
import { CATALOGS_GROUP, SCHEMAS_GROUP, TEXTS_GROUP, type Group, type Row } from '../groups.ts';
import { message, type Message } from '../messages.ts';
import { fileStatus, type ConfigRow, type HubFile } from '../rows.ts';
import { takes, type Scope, type ScopeGround } from './scope.ts';

/** The file of a scope as the view reads it. */
export type ScopeFile = {
    /** The name the scope bar and its sentences give the file. */
    name: string;
    present: boolean;
    /** Why nothing is written to the file now, or null when a save may write it. */
    blocked: Message | null;
    /** The digest of the text the page read, null while the file is blocked or has no name. */
    digest: string | null;
};

/** The groups every scope draws whole: those of oculus's own files. */
const FOLDER_GROUPS: readonly string[] = [CATALOGS_GROUP, SCHEMAS_GROUP, TEXTS_GROUP];

/** A file of a folder the scope reads through the file browser, named `name`. */
export function textFile(name: string, held: HubFile): ScopeFile {
    const read = fileStatus(name, held);
    const blocked = read.status === 'rows' ? null : read.said;
    return {
        name,
        present: held.present,
        blocked,
        digest: blocked !== null ? null : textDigest(held.present ? held.text.text : null)
    };
}

/** A hub's `local.yml` as the server answered it, undefined until it has. */
export function localFile(name: string, held: LocalFile | undefined): ScopeFile {
    if (held === undefined) {
        return { name, present: false, blocked: message('loading', name), digest: null };
    }
    const blocked = held.unparsed === null ? null : message('unparsedAt', name, held.unparsed);
    return {
        name,
        present: held.present,
        blocked,
        digest: blocked === null ? held.digest : null
    };
}

/**
 * The open workspace file, read through the hub folder that holds it (`root` null when no folder
 * of the workspace is that hub), or the unsaved workspace (`open` null), which has no file: its
 * first change asks for a name.
 */
export function workspaceFile(
    open: { root: string | null; path: string; held: HubFile } | null
): ScopeFile {
    if (open === null) return { name: '', present: false, blocked: null, digest: null };
    if (open.root === null) {
        return {
            name: open.path,
            present: true,
            blocked: message('notServed', open.path),
            digest: null
        };
    }
    return textFile(open.path, open.held);
}

/** Whether a scope draws a row. */
function drawn(row: Row, scope: Scope, ground: ScopeGround): boolean {
    if (row.kind === 'file') return true;
    if (row.kind === 'app') {
        return scope.kind === 'primary' || (scope.kind === 'hub' && scope.hub === ground.primary);
    }
    return takes(scope, ground, { file: row.file, key: row.key, layer: row.place.layer });
}

/** The defaults file a row draws a value of, which its heading's line is about. */
function fileOfRow(row: Row): string {
    if (row.kind === 'config') return row.file;
    if (row.kind === 'app') return 'behavior.yml';
    return '';
}

/**
 * The groups a scope draws, from the groups made for its file. `file` is the scope's file, whose
 * block every row of it says; `repo` is the row of the Repository scope's folder, which stands in
 * the place of the workspace's row of the same option.
 */
export function scopeGroups(
    groups: Group[],
    scope: Scope,
    ground: ScopeGround,
    file: ScopeFile,
    repo?: ConfigRow
): Group[] {
    return groups.flatMap((group): Group[] => {
        if (FOLDER_GROUPS.includes(group.id)) return [group];
        const sections = group.sections
            .map((section) => ({
                ...section,
                rows: section.rows
                    .map((row) =>
                        repo !== undefined && row.kind === 'config' && row.id === repo.id
                            ? repo
                            : row
                    )
                    .filter((row) => drawn(row, scope, ground))
                    .map((row) =>
                        file.blocked !== null && row.kind === 'config' && row.blocked === undefined
                            ? { ...row, blocked: file.blocked }
                            : row
                    )
            }))
            .filter((section) => section.rows.length > 0);
        if (sections.length === 0) return [];
        const files = new Set(sections.flatMap((section) => section.rows.map(fileOfRow)));
        const lines = group.lines.filter((line) => line.local || files.has(line.file));
        return [{ ...group, lines, sections }];
    });
}
