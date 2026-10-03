// Layer 2, server. The commands oculus finds in a repository without being told: the CMake presets
// of `CMakePresets.json` and `CMakeUserPresets.json`, the scripts of `package.json` and the targets
// of the top Makefile. They are read, never run: `make -pn` would run make, which the processes
// rule keeps until the reader approved the command's text.
//
// Each name from those files is one shell word in its line (`npm run 'a b'`), so a script called
// `x; rm -rf ~` is a script called that and nothing else. A found command runs in the repository
// and depends on nothing. Only the files at the top of the repository are read: a preset file
// pulled in with `include` and a Makefile `include`d by the top one are not.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import type { CommandFinding, ProjectCommand } from '../../../data/model/index.ts';
import { mapShape, rowsShape } from '../../../data/shapes/shapes.ts';
import { NAME_MAX } from '../pty/sessions.ts';
import { shellWord } from '../pty/shell-word.ts';
import type { Reading } from './files.ts';

/**
 * A line of a Makefile that defines targets: names made of word characters, dots, slashes and
 * dashes, a colon that does not begin `:=`, `::=` or `:::=`. A line starting with a tab is a recipe
 * and a name starting with a dot or a percent sign is a special or a pattern target; neither
 * matches.
 */
const TARGET_LINE =
    /^([A-Za-z0-9_][A-Za-z0-9_./-]*(?:\s+[A-Za-z0-9_][A-Za-z0-9_./-]*)*)\s*:(?![:=])/;

/** The Makefile spellings, in the order `make` itself looks for them. */
const MAKEFILES = ['GNUmakefile', 'makefile', 'Makefile'];

const presetShape = z.object({ name: z.string(), hidden: z.boolean().optional().catch(undefined) });

const presetsShape = z.object({
    configurePresets: rowsShape(presetShape).catch([]),
    buildPresets: rowsShape(presetShape).catch([]),
    testPresets: rowsShape(presetShape).catch([])
});

/** The text of a file, or null when it is not there or cannot be read. */
function textOf(file: string): string | null {
    if (!existsSync(file)) return null;
    try {
        return readFileSync(file, 'utf8');
    } catch {
        return null;
    }
}

/** The 1-based line of the first line at or after `from` holding the text, or undefined. */
function lineOf(text: string, needle: string, from = 0): number | undefined {
    const lines = text.split('\n');
    for (let at = from; at < lines.length; at += 1) if (lines[at].includes(needle)) return at + 1;
    return undefined;
}

/** What one found source gives while it is read: commands in order, one per name. */
function sink(repo: string) {
    const commands: ProjectCommand[] = [];
    const findings: CommandFinding[] = [];
    const seen = new Set<string>();
    return {
        commands,
        findings,
        add(name: string, run: string, file: string, line: number | undefined): void {
            // eslint-disable-next-line no-control-regex
            if (name.length > NAME_MAX || /[\u0000-\u001f\u007f]/.test(name)) {
                findings.push({
                    file,
                    field: name.slice(0, NAME_MAX),
                    message: `is not listed: the name must be at most ${NAME_MAX} characters with no control character`
                });
                return;
            }
            if (seen.has(name)) return;
            seen.add(name);
            commands.push({
                name,
                run,
                cwd: repo,
                depends_on: [],
                source: 'found',
                ...(line === undefined ? {} : { entry: { file, line } })
            });
        }
    };
}

type Sink = ReturnType<typeof sink>;

/** The presets of one CMake preset file. */
function readPresets(out: Sink, file: string): void {
    const text = textOf(file);
    if (text === null) return;
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        out.findings.push({ file, field: '', message: 'is not JSON' });
        return;
    }
    const read = presetsShape.safeParse(parsed);
    if (!read.success) {
        out.findings.push({ file, field: '', message: 'is not a map of presets' });
        return;
    }
    const kinds = [
        ['cmake', 'configurePresets', (name: string) => `cmake --preset ${shellWord(name)}`],
        [
            'cmake build',
            'buildPresets',
            (name: string) => `cmake --build --preset ${shellWord(name)}`
        ],
        ['ctest', 'testPresets', (name: string) => `ctest --preset ${shellWord(name)}`]
    ] as const;
    for (const [prefix, key, line] of kinds) {
        const at = lineOf(text, `"${key}"`) ?? 0;
        for (const preset of read.data[key]) {
            if (preset.hidden === true) continue;
            const named = lineOf(text, JSON.stringify(preset.name), Math.max(0, at - 1));
            out.add(`${prefix}: ${preset.name}`, line(preset.name), file, named);
        }
    }
}

/** The package manager the lockfile of the repository names. */
function managerOf(repo: string): string {
    if (existsSync(join(repo, 'pnpm-lock.yaml'))) return 'pnpm';
    if (existsSync(join(repo, 'yarn.lock'))) return 'yarn';
    return 'npm';
}

/** The scripts of `package.json`. */
function readScripts(out: Sink, repo: string): void {
    const file = join(repo, 'package.json');
    const text = textOf(file);
    if (text === null) return;
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        out.findings.push({ file, field: '', message: 'is not JSON' });
        return;
    }
    const top = mapShape.safeParse(parsed);
    if (!top.success) {
        out.findings.push({ file, field: '', message: 'is not a map' });
        return;
    }
    const scripts = mapShape.safeParse(top.data.scripts);
    if (!scripts.success) return;
    const manager = managerOf(repo);
    const from = (lineOf(text, '"scripts"') ?? 1) - 1;
    for (const script of Object.keys(scripts.data)) {
        out.add(
            `npm: ${script}`,
            `${manager} run ${shellWord(script)}`,
            file,
            lineOf(text, JSON.stringify(script), from)
        );
    }
}

/** The targets of the top Makefile. */
function readTargets(out: Sink, repo: string): void {
    const name = MAKEFILES.find((one) => existsSync(join(repo, one)));
    if (name === undefined) return;
    const file = join(repo, name);
    const text = textOf(file);
    if (text === null) return;
    text.split('\n').forEach((line, at) => {
        const found = TARGET_LINE.exec(line);
        if (found === null) return;
        for (const target of found[1].split(/\s+/)) {
            out.add(`make: ${target}`, `make ${shellWord(target)}`, file, at + 1);
        }
    });
}

/** The commands found in the repository, in the order presets, scripts, targets. */
export function findCommands(repo: string): Reading {
    const out = sink(repo);
    readPresets(out, join(repo, 'CMakePresets.json'));
    readPresets(out, join(repo, 'CMakeUserPresets.json'));
    readScripts(out, repo);
    readTargets(out, repo);
    return { commands: out.commands, findings: out.findings };
}
