// Layer 2, server. One command entry as a source writes it, and the reader of the one source that
// is a file of the repository: `<repo>/.oculus/commands.yml`. The rules of a name, a folder and a
// field of the wrong type, and the reading of a YAML file down to its list, are exported so
// `<repo>/.oculus/launch.yml` (server/machine/debug/launch/read.ts) reads by the same code.
//
// An entry is `{ name, run, cwd?, depends_on?, default?, problemMatcher? }`. An entry of
// `.oculus/commands.yml` may instead carry a `type` that an app defines as a task definition: it
// has no `run`, no `depends_on`, and every other key it holds is a property of the definition,
// which the app resolves into a task (apps/tools/run/tasks.ts). checkEntry reads it through a zod
// schema and then applies the rules a schema cannot: the name's length and characters, a line that
// says something, and a `cwd` that is a folder inside the repository by its real path. Each field
// that fails is a finding naming the file and the field, and the entry is left out; the entries
// that read are listed. The text of a schema's error is never shown, so each finding is worded
// here.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { LineCounter, isMap as isYamlMap, isNode, isSeq, parseDocument } from 'yaml';
import { z } from 'zod';
import type {
    AppTaskRef,
    CommandDefault,
    CommandFinding,
    CommandSource,
    ProjectCommand
} from '../../../../data/model/index.ts';
import { inside, realPath } from '../../../core/paths.ts';
import { NAME_MAX } from '../../pty/sessions.ts';

/** `.oculus/commands.yml` of a repository, relative to it. */
const COMMANDS_FILE = join('.oculus', 'commands.yml');

/**
 * One entry as written. `null` is an empty value in YAML and reads as absent, so a key written
 * with nothing after it is the same as no key.
 */
export const entryShape = z.object({
    name: z.string(),
    run: z.string(),
    cwd: z.string().nullish(),
    depends_on: z.array(z.string()).nullish(),
    default: z.enum(['build', 'test']).nullish(),
    problemMatcher: z.union([z.string(), z.array(z.string())]).nullish()
});

export type Entry = z.infer<typeof entryShape>;

/** An entry of `commands.yml`: a command with a `run`, or a typed one that an app resolves. */
const fileEntryShape = z.looseObject({
    ...entryShape.shape,
    run: z.string().nullish(),
    type: z.string().nullish()
});

/** The keys of a typed entry that are not properties of its task definition. */
const ENTRY_KEYS = ['name', 'run', 'cwd', 'depends_on', 'default', 'problemMatcher', 'type'];

/**
 * The whole of `.oculus/commands.yml`: a `commands` list of entries. The file is read entry by
 * entry so that one entry that fails leaves out itself alone; this shape is the file as the
 * editor's JSON Schema describes it.
 */
export const commandsFileShape = z.strictObject({ commands: z.array(fileEntryShape).nullish() });

/** What a field must be, for the finding of a field of the wrong type. */
const WRONG_TYPE: Record<string, string> = {
    name: 'must be text',
    run: 'must be text',
    cwd: 'must be text',
    depends_on: 'must be a list of command names',
    default: 'must be build or test',
    problemMatcher: 'must be a problem matcher name or a list of them',
    type: 'must be text'
};

/** A field that does not read, with the sentence for it. */
export type Problem = { field: string; message: string };

/** The roles already given to a command of the repository, so the second claim is ignored. */
export type Taken = Set<CommandDefault>;

/** What one source gives: the commands that read and the findings for those that did not. */
export type Reading = { commands: ProjectCommand[]; findings: CommandFinding[] };

/**
 * The type problems of an entry, one per field. `wrong` holds the sentence of each field of the
 * entry; an issue on no field is the entry itself not being a map.
 */
export function typeProblems(error: z.ZodError, wrong: Record<string, string>): Problem[] {
    const found = new Map<string, Problem>();
    for (const issue of error.issues) {
        const field = typeof issue.path[0] === 'string' ? issue.path[0] : '';
        found.set(field, { field, message: wrong[field] ?? 'must be a map of the fields' });
    }
    return [...found.values()];
}

/** The reason a name is refused, or null. */
export function nameProblem(name: string): string | null {
    if (name.trim() === '') return 'must not be empty';
    if (name.length > NAME_MAX) return `must be at most ${NAME_MAX} characters`;
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f]/.test(name))
        return 'must not hold a tab, a line break or any control character';
    return null;
}

/**
 * The real folder a command runs in: the repository itself without a `cwd`, otherwise the folder
 * the relative `cwd` names. An absolute `cwd`, a `..` that leaves the repository, a link that leads
 * out of it and a path that is no folder are refused with the sentence for each.
 */
export function folderOf(repo: string, cwd: string | null | undefined): string | Problem {
    if (cwd === undefined || cwd === null || cwd === '') return repo;
    const field = 'cwd';
    if (isAbsolute(cwd)) {
        return { field, message: 'must be a folder inside the repository, not an absolute path' };
    }
    const planned = resolve(repo, cwd);
    if (!inside(planned, repo)) {
        return { field, message: 'must be a folder inside the repository, not one above it' };
    }
    const real = realPath(planned);
    if (real === null || !statSync(real).isDirectory()) {
        return { field, message: 'must be a folder of the repository that exists' };
    }
    if (!inside(real, repo)) {
        return { field, message: 'is a link that leads out of the repository' };
    }
    return real;
}

/** What a typed entry of `commands.yml` is: the task type and the properties of its definition. */
type Typed = { type: string; definition: Record<string, unknown> };

/** A checked entry: its fields, its folder, and for a typed entry what the app resolves. */
export type Checked = { entry: Entry; cwd: string; typed?: Typed; matchers?: string[] };

/**
 * One raw entry as a command of the repository, or the problems that keep it out. `repo` is the
 * repository's real path. With `typed` the entry may carry a `type` in place of a `run`.
 */
export function checkEntry(
    repo: string,
    raw: unknown,
    typed = false
): Checked | { problems: Problem[] } {
    const read = (typed ? fileEntryShape : entryShape).safeParse(raw);
    if (!read.success) return { problems: typeProblems(read.error, WRONG_TYPE) };
    const data = read.data as Record<string, unknown> & z.infer<typeof fileEntryShape>;
    const type = typed && typeof data.type === 'string' ? data.type : undefined;
    const entry: Entry = {
        name: data.name,
        run: data.run ?? '',
        cwd: data.cwd,
        depends_on: data.depends_on,
        default: data.default,
        problemMatcher: data.problemMatcher
    };
    const problems: Problem[] = [];
    const named = nameProblem(entry.name);
    if (named !== null) problems.push({ field: 'name', message: named });
    if (type === undefined) {
        if (data.run === undefined || data.run === null) {
            problems.push({ field: 'run', message: WRONG_TYPE.run });
        } else if (entry.run.trim() === '') {
            problems.push({ field: 'run', message: 'must not be empty' });
        }
    } else {
        if (type.trim() === '') problems.push({ field: 'type', message: 'must not be empty' });
        if (data.run !== undefined && data.run !== null) {
            problems.push({
                field: 'run',
                message:
                    'must not be given with a type, since the app that defines the type runs it'
            });
        }
        if (entry.depends_on !== undefined && entry.depends_on !== null) {
            problems.push({
                field: 'depends_on',
                message:
                    'must not be given with a type, since a task of an app depends on no command'
            });
        }
    }
    const folder = folderOf(repo, entry.cwd);
    if (typeof folder !== 'string') problems.push(folder);
    if (problems.length > 0 || typeof folder !== 'string') return { problems };
    const matchers = matchersOf(entry.problemMatcher);
    return {
        entry,
        cwd: folder,
        ...(matchers === undefined ? {} : { matchers }),
        ...(type === undefined
            ? {}
            : {
                  typed: {
                      type,
                      definition: Object.fromEntries(
                          Object.entries(data).filter(([key]) => !ENTRY_KEYS.includes(key))
                      )
                  }
              })
    };
}

/** The matchers an entry names, as a list, or undefined when it names none. */
function matchersOf(value: Entry['problemMatcher']): string[] | undefined {
    if (value === undefined || value === null) return undefined;
    return typeof value === 'string' ? [value] : value;
}

/**
 * The commands of a list of raw entries, in order. `label` is the path the list has in its file,
 * the first part of a finding's field. A name repeated in the list keeps the first; a role (`build`
 * or `test`) already in `taken` is ignored on the entry that claims it again, which stays listed.
 */
export function collect(
    items: unknown[],
    where: {
        repo: string;
        file: string;
        label: string;
        source: CommandSource;
        lineOf?: (at: number) => number | undefined;
        /** Whether an entry may carry a `type` in place of a `run`. */
        typed?: boolean;
    },
    taken: Taken
): Reading {
    const commands: ProjectCommand[] = [];
    const findings: CommandFinding[] = [];
    const seen = new Set<string>();
    const finding = (at: number, problem: Problem) =>
        findings.push({
            file: where.file,
            field: `${where.label}[${at}]${problem.field === '' ? '' : `.${problem.field}`}`,
            message: problem.message
        });
    items.forEach((raw, at) => {
        const checked = checkEntry(where.repo, raw, where.typed === true);
        if ('problems' in checked) {
            for (const problem of checked.problems) finding(at, problem);
            return;
        }
        const { entry, cwd, typed, matchers } = checked;
        if (seen.has(entry.name)) {
            finding(at, {
                field: 'name',
                message: 'repeats a name of this list, so it is left out'
            });
            return;
        }
        seen.add(entry.name);
        let role = entry.default ?? undefined;
        if (role !== undefined && taken.has(role)) {
            finding(at, {
                field: 'default',
                message: `is ignored: a ${role} default is already set`
            });
            role = undefined;
        }
        if (role !== undefined) taken.add(role);
        const line = where.lineOf?.(at);
        commands.push({
            name: entry.name,
            run: entry.run,
            cwd,
            depends_on: entry.depends_on ?? [],
            ...(role === undefined ? {} : { default: role }),
            source: where.source,
            ...(matchers === undefined ? {} : { matchers }),
            ...(typed === undefined ? {} : { task: pendingTask(typed) }),
            ...(line === undefined ? {} : { entry: { file: where.file, line } })
        });
    });
    return { commands, findings };
}

/** The task of a typed entry before the app that defines its type has resolved it. */
function pendingTask(typed: Typed): AppTaskRef {
    return {
        app: '',
        appTitle: '',
        type: typed.type,
        key: '',
        label: '',
        definition: typed.definition,
        background: false,
        group: null,
        isDefault: false,
        folder: ''
    };
}

/** The finding for a whole file. */
export function fileFinding(file: string, message: string): Reading {
    return { commands: [], findings: [{ file, field: '', message }] };
}

/** What a YAML file's list is called in the findings of a file that does not read down to it. */
export type ListWords = {
    /** The finding for a top that is not a map: "must be a map with a <key> list". */
    top: string;
    /** The finding for a list key that is not a list. */
    list: string;
};

/** The items of a file's list with the line each starts on, or the findings that say why none. */
export type ListFile =
    | { items: unknown[]; lineOf: (at: number) => number | undefined }
    | { findings: CommandFinding[] };

/**
 * A YAML file read down to the list under `key`. No file, an empty file and an absent or empty
 * list are no items and no finding; a file that cannot be read or is not YAML, a top that is not a
 * map and a `key` that is not a list are one finding each. The file is followed through links.
 */
export function readListFile(file: string, key: string, words: ListWords): ListFile {
    if (!existsSync(file)) return { findings: [] };
    let text: string;
    try {
        text = readFileSync(file, 'utf8');
    } catch {
        return { findings: fileFinding(file, 'cannot be read').findings };
    }
    const lines = new LineCounter();
    const doc = parseDocument(text, { lineCounter: lines });
    if (doc.errors.length > 0) {
        const at = doc.errors[0].linePos?.[0].line;
        const message = at === undefined ? 'is not YAML' : `is not YAML, at line ${at}`;
        return { findings: fileFinding(file, message).findings };
    }
    if (doc.contents === null) return { findings: [] };
    if (!isYamlMap(doc.contents)) return { findings: fileFinding(file, words.top).findings };
    const list = doc.contents.get(key, true);
    if (list === undefined || (isNode(list) && list.toJS(doc) === null)) return { findings: [] };
    if (!isSeq(list)) return { findings: [{ file, field: key, message: words.list }] };
    return {
        items: list.items.map((item) => (isNode(item) ? item.toJS(doc) : item) as unknown),
        lineOf: (at) => {
            const item = list.items[at];
            const start = isNode(item) ? item.range?.[0] : undefined;
            return start === undefined ? undefined : lines.linePos(start).line;
        }
    };
}

/**
 * The commands of `<repo>/.oculus/commands.yml`. No file is no commands and no finding. A file
 * that is not YAML, or whose top is not a map, or whose `commands` is not a list is one finding
 * and no commands.
 */
export function readCommandsFile(repo: string, taken: Taken): Reading {
    const file = join(repo, COMMANDS_FILE);
    const read = readListFile(file, 'commands', {
        top: 'must be a map with a commands list',
        list: 'must be a list of commands'
    });
    if ('findings' in read) return { commands: [], findings: read.findings };
    return collect(
        read.items,
        { repo, file, label: 'commands', source: 'file', lineOf: read.lineOf, typed: true },
        taken
    );
}
