// Layer 2, server. The reader of a repository's `.oculus/cpp.yml`, the one file that tells clangd
// about a repository: a list of configurations, each `{ name, compile_commands, fallback_flags }`
// with only `name` required.
//
// `compile_commands` is a folder of the repository holding a `compile_commands.json`;
// `fallback_flags` is a list of flags clangd uses for a file its database has no entry for. A
// configuration with no `compile_commands` runs clangd without a database, on its flags. clangd
// runs a fallback command in each file's own folder, so a relative path of an include flag would
// name a different folder for every file; each such path is resolved against the repository root
// before it is passed, and an absolute one stays as it is. The options that take a path are `-I`,
// `-isystem`, `-iquote`, `-idirafter` and `-include`, each joined to the flag (`-Ifoo`) or followed
// by it as its own argument (`-I foo`). Nothing else is read from the file: no compiler path and no
// flag added to a database's entries.
//
// The file is read as `.oculus/commands.yml` is (server/machine/runs/commands/files.ts): a value
// that does not read is a finding naming the file and the key, and the entry is skipped;
// the rest of the file is read. The findings are listed at the head of the Select Compile Database
// list and in the tooltip of the status item, which is where the reader picks from the file.

import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { isMap as isYamlMap, isNode, isSeq, parseDocument } from 'yaml';
import type { CommandFinding } from '../../../../data/model/index.ts';
import { inside, realPath } from '../../../core/paths.ts';

/** `.oculus/cpp.yml` of a repository, relative to it. */
const CPP_FILE = join('.oculus', 'cpp.yml');

/** One configuration that read. */
export type Configuration = {
    name: string;
    /** The folder holding the database, relative to the repository; null for no database. */
    compileCommands: string | null;
    /** The flags, with the include paths resolved against the repository root. */
    fallbackFlags: string[];
};

/** What the file gives: the configurations that read and a finding for each thing that did not. */
export type CppFile = { configurations: Configuration[]; findings: CommandFinding[] };

/** The keys of a configuration. */
const KEYS = ['name', 'compile_commands', 'fallback_flags'];

/** The options whose argument is a path, longest first so a joined flag matches its own option. */
const PATH_OPTIONS = ['-isystem', '-idirafter', '-include', '-iquote', '-I'];

/** The flags with every relative path of an include option resolved against the repository root. */
function resolveFlags(flags: readonly string[], repo: string): string[] {
    const absolute = (path: string): string => (isAbsolute(path) ? path : resolve(repo, path));
    const out: string[] = [];
    let next = false;
    for (const flag of flags) {
        if (next) {
            out.push(absolute(flag));
            next = false;
            continue;
        }
        const option = PATH_OPTIONS.find((one) => flag.startsWith(one));
        if (option === undefined) out.push(flag);
        else if (flag === option) {
            out.push(flag);
            next = true;
        } else out.push(`${option}${absolute(flag.slice(option.length))}`);
    }
    return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The reason a `compile_commands` folder is refused, or null when it is a folder of the repo. */
function databaseProblem(repo: string, folder: string): string | null {
    if (folder.trim() === '' || isAbsolute(folder)) {
        return 'must be a folder of the repository, written relative to it';
    }
    const planned = resolve(repo, folder);
    if (!inside(planned, repo)) return 'must be a folder inside the repository, not one above it';
    const real = realPath(planned);
    if (real === null) return 'must be a folder of the repository that exists';
    if (!inside(real, repo)) return 'is a link that leads out of the repository';
    if (!existsSync(join(real, 'compile_commands.json'))) {
        return 'must hold a compile_commands.json';
    }
    return null;
}

/**
 * The configurations of `<repo>/.oculus/cpp.yml`. `repo` is the repository's real path and `found`
 * the keys of the databases oculus found, so a configuration cannot take the name of one. No file
 * is no configurations and no finding.
 */
export function readCppFile(repo: string, found: readonly string[]): CppFile {
    const file = join(repo, CPP_FILE);
    if (!existsSync(file)) return { configurations: [], findings: [] };
    const findings: CommandFinding[] = [];
    const finding = (field: string, message: string): void => {
        findings.push({ file, field, message });
    };
    let text: string;
    try {
        text = readFileSync(file, 'utf8');
    } catch {
        finding('', 'cannot be read');
        return { configurations: [], findings };
    }
    const doc = parseDocument(text);
    if (doc.errors.length > 0) {
        const at = doc.errors[0].linePos?.[0].line;
        finding('', at === undefined ? 'is not YAML' : `is not YAML, at line ${at}`);
        return { configurations: [], findings };
    }
    if (doc.contents === null) return { configurations: [], findings: [] };
    if (!isYamlMap(doc.contents)) {
        finding('', 'must be a map with a configurations list');
        return { configurations: [], findings };
    }
    for (const pair of doc.contents.items) {
        const key = isNode(pair.key) ? String(pair.key.toJS(doc)) : String(pair.key);
        if (key !== 'configurations') finding(key, 'is not a key of this file');
    }
    const list = doc.contents.get('configurations', true);
    if (list === undefined || (isNode(list) && list.toJS(doc) === null)) {
        return { configurations: [], findings };
    }
    if (!isSeq(list)) {
        finding('configurations', 'must be a list of configurations');
        return { configurations: [], findings };
    }
    const configurations: Configuration[] = [];
    const names = new Set<string>();
    list.items.forEach((item, at) => {
        const raw = (isNode(item) ? item.toJS(doc) : item) as unknown;
        const where = (key: string): string =>
            `configurations[${at}]${key === '' ? '' : `.${key}`}`;
        if (!isRecord(raw)) {
            finding(where(''), 'must be a map of the fields');
            return;
        }
        const problems: [string, string][] = [];
        for (const key of Object.keys(raw)) {
            if (!KEYS.includes(key)) problems.push([key, 'is not a key of a configuration']);
        }
        const name = raw.name;
        if (typeof name !== 'string' || name.trim() === '') {
            problems.push(['name', 'must be text that is not empty']);
        } else if (names.has(name)) {
            problems.push(['name', 'repeats a name of this list']);
        } else if (found.includes(name)) {
            problems.push(['name', 'is the folder of a compile database oculus found']);
        }
        const folder = raw.compile_commands;
        if (folder !== undefined && folder !== null) {
            const problem =
                typeof folder === 'string' ? databaseProblem(repo, folder) : 'must be text';
            if (problem !== null) problems.push(['compile_commands', problem]);
        }
        const flags = raw.fallback_flags;
        if (
            flags !== undefined &&
            flags !== null &&
            !(Array.isArray(flags) && flags.every((one) => typeof one === 'string'))
        ) {
            problems.push(['fallback_flags', 'must be a list of text']);
        }
        if (problems.length > 0 || typeof name !== 'string') {
            for (const [key, message] of problems) finding(where(key), message);
            return;
        }
        names.add(name);
        configurations.push({
            name,
            compileCommands: typeof folder === 'string' ? folder : null,
            fallbackFlags: Array.isArray(flags) ? resolveFlags(flags as string[], repo) : []
        });
    });
    return { configurations, findings };
}
