// Layer 2, server. The compile databases of a repository, the one in force, and the folder clangd
// is given for it.
//
// The choices, in the picker's order: the configurations of the repository's `.oculus/cpp.yml` in
// file order, then the databases oculus finds, which are a `compile_commands.json` at the root and
// one in each `build/*/` folder, `build/debug` first and the others newest first by the database's
// modification time. The one in force is the reader's remembered choice while it names a
// database or a configuration that is listed, else the first, so a configuration of the file wins
// over a found database.
//
// clangd writes its index beside the database it is given (`.cache/clangd/` in that folder). So
// the database is never given in place: oculus links it as
// `<lsp folder>/<root folder>/<database folder>/compile_commands.json`, a symlink to the real file,
// and gives clangd the link folder, and the index lands under the lsp folder and never in a
// repository. The root folder is named by the first 16 hex digits of the SHA-256 of the
// repository's real path, as the local history names a file's folder, so a root key never becomes
// a path part and a key reassigned to another folder gets that folder's own index.

import { createHash } from 'node:crypto';
import {
    existsSync,
    lstatSync,
    mkdirSync,
    readdirSync,
    readlinkSync,
    statSync,
    symlinkSync,
    unlinkSync
} from 'node:fs';
import { join } from 'node:path';
import type { CommandFinding, LspDatabase } from '../../../../../data/model/index.ts';
import { readCppFile, type Configuration } from './cpp-file.ts';

/** The file a compile database is. */
const DATABASE = 'compile_commands.json';

/** The key of the database at the root of a repository. */
const ROOT_DATABASE = '.';

/** The folder of a repository inside the lsp folder. */
function rootFolder(repo: string): string {
    return createHash('sha256').update(repo, 'utf8').digest('hex').slice(0, 16);
}

/** The folder of one database inside the lsp folder, relative to the lsp folder. */
function linkFolder(repo: string, folder: string): string {
    return folder === '' ? rootFolder(repo) : join(rootFolder(repo), folder);
}

/** The modification time of a file in milliseconds, 0 when it cannot be read. */
function modified(path: string): number {
    try {
        return statSync(path).mtimeMs;
    } catch {
        return 0;
    }
}

/** The databases oculus finds in a repository, as folders relative to it. */
function foundFolders(repo: string): string[] {
    const found: string[] = [];
    if (existsSync(join(repo, DATABASE))) found.push('');
    let names: string[];
    try {
        names = readdirSync(join(repo, 'build'), { withFileTypes: true })
            .filter((one) => one.isDirectory() || one.isSymbolicLink())
            .map((one) => one.name);
    } catch {
        names = [];
    }
    const here = names
        .filter((name) => existsSync(join(repo, 'build', name, DATABASE)))
        .map((name) => ({ name, at: modified(join(repo, 'build', name, DATABASE)) }));
    here.sort((a, b) => {
        if (a.name === 'debug') return -1;
        if (b.name === 'debug') return 1;
        return b.at - a.at || a.name.localeCompare(b.name);
    });
    return [...found, ...here.map((one) => `build/${one.name}`)];
}

/** The key of a found database: its folder, `.` for the repository's own. */
function keyOf(folder: string): string {
    return folder === '' ? ROOT_DATABASE : folder;
}

/** What a repository offers clangd: the choices, the one in force and what it brings. */
export type DatabasePlan = {
    databases: LspDatabase[];
    /** The database in force, null when the repository offers none. */
    inForce: LspDatabase | null;
    /** The flags of the configuration in force, empty for a found database. */
    fallbackFlags: string[];
    findings: CommandFinding[];
};

/** The databases of a repository and the one in force, read now from the disk. */
export function databasePlan(repo: string, chosen?: string): DatabasePlan {
    const folders = foundFolders(repo);
    const cpp = readCppFile(repo, folders.map(keyOf));
    const configurations = new Map<string, Configuration>(
        cpp.configurations.map((one) => [one.name, one])
    );
    const databases: LspDatabase[] = [
        ...cpp.configurations.map((one) => ({
            key: one.name,
            name: one.name,
            configuration: true,
            folder: one.compileCommands ?? ''
        })),
        ...folders.map((folder) => ({
            key: keyOf(folder),
            name: keyOf(folder),
            configuration: false,
            folder
        }))
    ];
    const inForce = databases.find((one) => one.key === chosen) ?? databases.at(0) ?? null;
    const configuration = inForce === null ? undefined : configurations.get(inForce.key);
    return {
        databases,
        inForce,
        fallbackFlags: configuration?.fallbackFlags ?? [],
        findings: cpp.findings
    };
}

/** Whether a database in force has a file to link: a configuration may name none. */
export function hasDatabase(database: LspDatabase, repo: string): boolean {
    if (database.configuration && database.folder === '') return false;
    return existsSync(join(repo, database.folder, DATABASE));
}

/** What a link answers: the folder clangd is given, or why it could not be made. */
export type Linked = { ok: true; folder: string } | { ok: false; folder: string; error: string };

/**
 * Link a database into the lsp folder and answer the folder clangd is given. A link that stands is
 * kept when it already names the file, and replaced when it names another; anything that cannot be
 * made or written answers the folder and the reason, and nothing is written into the repository.
 */
export function linkDatabase(lspFolder: string, repo: string, database: LspDatabase): Linked {
    const folder = join(lspFolder, linkFolder(repo, database.folder));
    const target = join(repo, database.folder, DATABASE);
    const link = join(folder, DATABASE);
    try {
        mkdirSync(folder, { recursive: true });
        let current: string | null = null;
        try {
            if (lstatSync(link).isSymbolicLink()) current = readlinkSync(link);
            else unlinkSync(link);
        } catch {
            current = null;
        }
        if (current !== target) {
            if (current !== null) unlinkSync(link);
            symlinkSync(target, link);
        }
    } catch (error) {
        return { ok: false, folder, error: error instanceof Error ? error.message : String(error) };
    }
    return { ok: true, folder };
}
