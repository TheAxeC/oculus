// Layer 2, server. One command entry as a source writes it, and the reader of the one source that
// is a file of the repository: `<repo>/.oculus/commands.yml`.
//
// An entry is `{ name, run, cwd?, depends_on?, default? }`. checkEntry reads it through a zod
// schema and then applies the rules a schema cannot: the name's length and characters, a line that
// says something, and a `cwd` that is a folder inside the repository by its real path. Each field
// that fails is a finding naming the file and the field, and the entry is left out; the entries
// that read are listed. The text of a schema's error is never shown, so each finding is worded
// here.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { LineCounter, isMap, isNode, isSeq, parseDocument } from 'yaml';
import { z } from 'zod';
import type {
    CommandDefault,
    CommandFinding,
    CommandSource,
    ProjectCommand
} from '../../../data/model/index.ts';
import { inside, realPath } from '../../core/paths.ts';
import { NAME_MAX } from '../pty/sessions.ts';

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
    default: z.enum(['build', 'test']).nullish()
});

export type Entry = z.infer<typeof entryShape>;

/** What a field must be, for the finding of a field of the wrong type. */
const WRONG_TYPE: Record<string, string> = {
    name: 'must be text',
    run: 'must be text',
    cwd: 'must be text',
    depends_on: 'must be a list of command names',
    default: 'must be build or test'
};

/** A field that does not read, with the sentence for it. */
export type Problem = { field: string; message: string };

/** The roles already given to a command of the repository, so the second claim is ignored. */
export type Taken = Set<CommandDefault>;

/** What one source gives: the commands that read and the findings for those that did not. */
export type Reading = { commands: ProjectCommand[]; findings: CommandFinding[] };

/** The type problems of an entry, one per field. */
function typeProblems(error: z.ZodError): Problem[] {
    const found = new Map<string, Problem>();
    for (const issue of error.issues) {
        const field = typeof issue.path[0] === 'string' ? issue.path[0] : '';
        found.set(field, { field, message: WRONG_TYPE[field] ?? 'must be a map of the fields' });
    }
    return [...found.values()];
}

/** The reason a name is refused, or null. */
function nameProblem(name: string): string | null {
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
function folderOf(repo: string, cwd: string | null | undefined): string | Problem {
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

/**
 * One raw entry as a command of the repository, or the problems that keep it out. `repo` is the
 * repository's real path.
 */
export function checkEntry(
    repo: string,
    raw: unknown
): { entry: Entry; cwd: string } | { problems: Problem[] } {
    const read = entryShape.safeParse(raw);
    if (!read.success) return { problems: typeProblems(read.error) };
    const entry = read.data;
    const problems: Problem[] = [];
    const named = nameProblem(entry.name);
    if (named !== null) problems.push({ field: 'name', message: named });
    if (entry.run.trim() === '') problems.push({ field: 'run', message: 'must not be empty' });
    const folder = folderOf(repo, entry.cwd);
    if (typeof folder !== 'string') problems.push(folder);
    if (problems.length > 0 || typeof folder !== 'string') return { problems };
    return { entry, cwd: folder };
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
        const checked = checkEntry(where.repo, raw);
        if ('problems' in checked) {
            for (const problem of checked.problems) finding(at, problem);
            return;
        }
        const { entry, cwd } = checked;
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
            ...(line === undefined ? {} : { entry: { file: where.file, line } })
        });
    });
    return { commands, findings };
}

/** The finding for a whole file. */
export function fileFinding(file: string, message: string): Reading {
    return { commands: [], findings: [{ file, field: '', message }] };
}

/**
 * The commands of `<repo>/.oculus/commands.yml`. No file is no commands and no finding. A file
 * that is not YAML, or whose top is not a map, or whose `commands` is not a list is one finding
 * and no commands.
 */
export function readCommandsFile(repo: string, taken: Taken): Reading {
    const file = join(repo, COMMANDS_FILE);
    if (!existsSync(file)) return { commands: [], findings: [] };
    let text: string;
    try {
        text = readFileSync(file, 'utf8');
    } catch {
        return fileFinding(file, 'cannot be read');
    }
    const lines = new LineCounter();
    const doc = parseDocument(text, { lineCounter: lines });
    if (doc.errors.length > 0) {
        const at = doc.errors[0].linePos?.[0].line;
        return fileFinding(file, at === undefined ? 'is not YAML' : `is not YAML, at line ${at}`);
    }
    if (doc.contents === null) return { commands: [], findings: [] };
    if (!isMap(doc.contents)) return fileFinding(file, 'must be a map with a commands list');
    const list = doc.contents.get('commands', true);
    if (list === undefined || (isNode(list) && list.toJS(doc) === null)) {
        return { commands: [], findings: [] };
    }
    if (!isSeq(list)) {
        return {
            commands: [],
            findings: [{ file, field: 'commands', message: 'must be a list of commands' }]
        };
    }
    const items = list.items.map((item) => (isNode(item) ? item.toJS(doc) : item) as unknown);
    return collect(
        items,
        {
            repo,
            file,
            label: 'commands',
            source: 'file',
            lineOf: (at) => {
                const item = list.items[at];
                const start = isNode(item) ? item.range?.[0] : undefined;
                return start === undefined ? undefined : lines.linePos(start).line;
            }
        },
        taken
    );
}
