// Layer 2, server. The reader of `<repo>/.oculus/launch.yml`, the debug configurations of a
// repository: a map whose `configurations:` is a list of `{ name, type?, request?, program, cwd?,
// before? }`. An entry without a `type`, or with `type: rite`, runs oculus's own adapter on a
// `.rite` file. An entry with another `type` runs the debugger of that name that an app which acts
// declares; its keys beside `name`, `type`, `request`, `program`, `cwd` and `before` are the
// arguments the adapter is launched or attached with, and each must be one the debugger's
// `configurationAttributes` names for the request, with the type it gives it.
//
// The file is read down to its list, and each entry checked, by the code the commands file uses
// (runs/commands/files.ts): the same rule for a name, for a folder and for a field of the wrong
// type, and the same findings for a file that is not YAML or holds the wrong top. An entry that
// does not read is left out with one finding per fault, each naming the file and the field. A
// literal `program` is checked against the repository here; a `program` holding a placeholder is
// checked when a launch fills it, since its value is the file on screen.

import { statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { z } from 'zod';
import type {
    AppDebugger,
    CommandFinding,
    DebugConfiguration,
    DebugLaunches
} from '../../../../data/model/index.ts';
import { inside, realPath } from '../../../core/paths.ts';
import {
    folderOf,
    nameProblem,
    readListFile,
    typeProblems,
    type Problem
} from '../../runs/commands/files.ts';

/** `.oculus/launch.yml` of a repository, relative to it. */
const LAUNCH_FILE = join('.oculus', 'launch.yml');

/** The keys of one configuration that oculus reads. */
const KEYS = ['name', 'type', 'request', 'program', 'cwd', 'before'];

/** The debugger type of oculus's own adapter. */
export const RITE_TYPE = 'rite';

/** The program and folder of the default configuration, which runs the file on screen. */
export const DEFAULT_PROGRAM = '${file}';
export const DEFAULT_CWD = '.';

/** The placeholders of a command that a program may hold. */
const PROGRAM_PLACEHOLDERS =
    /\$\{(file|fileDirname|fileBasename|fileBasenameNoExtension|workspaceFolder)\}/;

/** The placeholders of a command that name no file or hold a selection, which a program may not. */
const LINE_PLACEHOLDERS = /\$\{(lineNumber|selectedText)\}/;

/** One entry as written; `null` is an empty value and reads as absent. */
const entryShape = z.looseObject({
    name: z.string(),
    type: z.string().nullish(),
    request: z.string().nullish(),
    program: z.string().nullish(),
    cwd: z.string().nullish(),
    before: z.string().nullish()
});

/**
 * The whole of `.oculus/launch.yml`: a `configurations` list of entries, each of which names only
 * the keys of KEYS. The file is read entry by entry; this shape is the file as the editor's JSON
 * Schema describes it.
 */
export const launchFileShape = z.strictObject({
    configurations: z.array(entryShape).nullish()
});

/** Every field of a configuration is text. */
const WRONG_TYPE: Record<string, string> = {
    name: 'must be text',
    type: 'must be text',
    request: 'must be text',
    program: 'must be text',
    cwd: 'must be text',
    before: 'must be text'
};

/** The finding for a configuration with no program. */
const PROGRAM_REQUIRED =
    'is required: name the .rite file to run, or ${file} for the file on screen';

/** The reason a literal program is refused, or null. `repo` is the repository's real path. */
function literalProblem(repo: string, program: string): string | null {
    if (isAbsolute(program)) return 'must be a path relative to the repository';
    if (!inside(resolve(repo, program), repo)) {
        return 'leads above the repository; name a .rite file inside it';
    }
    const real = realPath(resolve(repo, program));
    if (real === null || !statSync(real).isFile()) {
        return 'must name a file of the repository that exists';
    }
    if (!inside(real, repo)) return 'is a link that leads out of the repository';
    if (!program.endsWith('.rite')) return 'must name a .rite file';
    return null;
}

/** The problems of a program: a placeholder it may not hold, or a literal path that is no file. */
function programProblem(repo: string, program: string): string | null {
    if (LINE_PLACEHOLDERS.test(program)) {
        return 'may hold only the placeholders file, fileDirname, fileBasename, fileBasenameNoExtension and workspaceFolder';
    }
    return PROGRAM_PLACEHOLDERS.test(program) ? null : literalProblem(repo, program);
}

/** The keys of a raw entry beside the ones oculus reads, in the order written. */
function otherKeys(raw: unknown): string[] {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return [];
    return Object.keys(raw).filter((key) => !KEYS.includes(key));
}

/** The JSON type names a `configurationAttributes` property may give a key. */
function typeMatches(wanted: unknown, value: unknown): boolean {
    const names = Array.isArray(wanted) ? wanted : [wanted];
    if (names.every((one) => typeof one !== 'string')) return true;
    return names.some((one) => {
        if (one === 'string') return typeof value === 'string';
        if (one === 'boolean') return typeof value === 'boolean';
        if (one === 'number') return typeof value === 'number';
        if (one === 'integer') return Number.isInteger(value);
        if (one === 'array') return Array.isArray(value);
        if (one === 'object') return typeof value === 'object' && value !== null;
        if (one === 'null') return value === null;
        return true;
    });
}

/**
 * The problems of the keys an app's debugger does not read from the entry: a key the debugger's
 * attributes for the request do not name, a value of another type than the one given, and a
 * required key that is missing.
 */
function attributeProblems(
    attributes: Record<string, unknown>,
    request: string,
    raw: Record<string, unknown>,
    others: string[]
): Problem[] {
    const properties =
        typeof attributes.properties === 'object' && attributes.properties !== null
            ? (attributes.properties as Record<string, unknown>)
            : {};
    const problems: Problem[] = [];
    for (const key of others) {
        if (!Object.hasOwn(properties, key)) {
            problems.push({
                field: key,
                message: `is not a key of a ${request} configuration of this debugger`
            });
            continue;
        }
        const given = properties[key];
        const wanted =
            typeof given === 'object' && given !== null
                ? (given as { type?: unknown }).type
                : undefined;
        if (!typeMatches(wanted, raw[key])) {
            problems.push({ field: key, message: `must be of the type ${String(wanted)}` });
        }
    }
    const required = Array.isArray(attributes.required) ? attributes.required : [];
    for (const key of required) {
        if (typeof key !== 'string' || KEYS.includes(key)) continue;
        if (!Object.hasOwn(raw, key)) problems.push({ field: key, message: 'is required' });
    }
    return problems;
}

/** The configuration a raw entry is, or the problems that keep it out. */
function checkEntry(
    repo: string,
    raw: unknown,
    debuggers: AppDebugger[]
): { configuration: DebugConfiguration } | { problems: Problem[] } {
    const read = entryShape.safeParse(raw);
    if (!read.success) return { problems: typeProblems(read.error, WRONG_TYPE) };
    const entry = read.data;
    const type = entry.type ?? RITE_TYPE;
    const request = entry.request ?? 'launch';
    const others = otherKeys(raw);
    const problems: Problem[] = [];
    const named = nameProblem(entry.name);
    if (named !== null) problems.push({ field: 'name', message: named });
    if (request !== 'launch' && request !== 'attach') {
        problems.push({ field: 'request', message: 'must be launch or attach' });
    }
    const program = entry.program ?? '';
    const own = type === RITE_TYPE;
    const found = own ? undefined : debuggers.find((one) => one.type === type);
    if (own) {
        for (const key of others) {
            problems.push({
                field: key,
                message:
                    'is not a key of a launch configuration: name, type, request, program, cwd and before are'
            });
        }
        if (request === 'attach') {
            problems.push({
                field: 'request',
                message: 'must be launch: the oculus adapter does not attach'
            });
        }
        if (program.trim() === '') problems.push({ field: 'program', message: PROGRAM_REQUIRED });
        else {
            const wrong = programProblem(repo, program);
            if (wrong !== null) problems.push({ field: 'program', message: wrong });
        }
    } else if (found === undefined) {
        problems.push({
            field: 'type',
            message: `names ${type}, which no app that acts declares as a debugger, so the entry is left out`
        });
    } else if (request === 'launch' || request === 'attach') {
        const attributes = found.configurationAttributes[request];
        problems.push(
            ...attributeProblems(attributes, request, raw as Record<string, unknown>, others)
        );
    }
    const folder = folderOf(repo, entry.cwd);
    if (typeof folder !== 'string') problems.push(folder);
    if (entry.before !== undefined && entry.before !== null) {
        const before = nameProblem(entry.before);
        if (before !== null) problems.push({ field: 'before', message: before });
    }
    if (problems.length > 0) return { problems };
    const cwd = entry.cwd === undefined || entry.cwd === null || entry.cwd === '' ? '.' : entry.cwd;
    const source = raw as Record<string, unknown>;
    return {
        configuration: {
            name: entry.name,
            type,
            request: request === 'attach' ? 'attach' : 'launch',
            args: Object.fromEntries(others.map((key) => [key, source[key]])),
            program,
            cwd,
            ...(entry.before === undefined || entry.before === null ? {} : { before: entry.before })
        }
    };
}

/**
 * The configurations of `<repo>/.oculus/launch.yml` and the findings of what did not read, with
 * whether the file is there. `repo` is the repository's real path and `debuggers` the debuggers of
 * the apps that act. A name repeated in the list keeps the first.
 */
export function readLaunch(repo: string, debuggers: AppDebugger[] = []): DebugLaunches {
    const file = join(repo, LAUNCH_FILE);
    const read = readListFile(file, 'configurations', {
        top: 'must be a map with a configurations list',
        list: 'must be a list of configurations'
    });
    if ('findings' in read) {
        return { exists: statExists(file), configurations: [], findings: read.findings };
    }
    const configurations: DebugConfiguration[] = [];
    const findings: CommandFinding[] = [];
    const seen = new Set<string>();
    read.items.forEach((raw, at) => {
        const finding = (problem: Problem): void => {
            const field = `configurations[${at}]${problem.field === '' ? '' : `.${problem.field}`}`;
            findings.push({ file, field, message: problem.message });
        };
        const checked = checkEntry(repo, raw, debuggers);
        if ('problems' in checked) {
            for (const problem of checked.problems) finding(problem);
            return;
        }
        const { configuration } = checked;
        if (seen.has(configuration.name)) {
            finding({ field: 'name', message: 'repeats a name of this list, so it is left out' });
            return;
        }
        seen.add(configuration.name);
        const line = read.lineOf(at);
        configurations.push(line === undefined ? configuration : { ...configuration, line });
    });
    return { exists: true, configurations, findings };
}

/** Whether the file is there, links followed. */
function statExists(file: string): boolean {
    return realPath(file) !== null;
}
