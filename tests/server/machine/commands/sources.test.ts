// Layer 4, server test. Where a repository's commands come from and how each source is read:
// `.oculus/commands.yml`, the saved `~/.oculus/commands.json`, and the order they are listed in.
// Every case runs over a scratch repository and a scratch home; nothing reads or writes the
// machine's own `~/.oculus`.
//
// What this does NOT cover: the commands oculus finds in CMake presets, `package.json` and a
// Makefile (found.test.ts), and running any of them (tests/server/machine/commands/run.test.ts).

import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { it } from '../../../fixtures/scratch.ts';
import { listCommands } from '../../../../src/lib/server/machine/commands/list.ts';
import { resolveChain } from '../../../../src/lib/server/machine/commands/resolve.ts';
import { NAME_MAX } from '../../../../src/lib/server/machine/pty/sessions.ts';
import { commandsYml, enterHome, leaveHome, plant, plantRepo } from './commands-fixture.ts';

let home = '';

beforeEach(() => {
    home = enterHome();
});

afterEach(() => {
    leaveHome();
});

const fields = (repo: string) => listCommands(repo).findings.map((one) => one.field);
const names = (repo: string) => listCommands(repo).commands.map((one) => one.name);

describe('.oculus/commands.yml', () => {
    it('lists both commands with an absolute cwd and the source file', () => {
        const repo = plantRepo({}, ['sub']);
        plant(
            repo,
            '.oculus/commands.yml',
            commandsYml(
                '  - { name: build, run: make }\n' +
                    '  - { name: test, run: make test, cwd: sub, depends_on: [build], default: test }\n'
            )
        );
        const listed = listCommands(repo);
        expect(listed.findings).toEqual([]);
        const file = join(repo, '.oculus', 'commands.yml');
        expect(listed.commands).toEqual([
            {
                name: 'build',
                run: 'make',
                cwd: repo,
                depends_on: [],
                source: 'file',
                entry: { file, line: 2 }
            },
            {
                name: 'test',
                run: 'make test',
                cwd: join(repo, 'sub'),
                depends_on: ['build'],
                default: 'test',
                source: 'file',
                entry: { file, line: 3 }
            }
        ]);
    });

    it('names the field of an entry of the wrong type and lists the good entries', () => {
        const repo = plantRepo();
        plant(
            repo,
            '.oculus/commands.yml',
            commandsYml(
                '  - { name: norun }\n' +
                    '  - { name: five, run: 5 }\n' +
                    '  - { name: fine, run: echo }\n' +
                    '  - { name: dep, run: x, depends_on: x }\n'
            )
        );
        const listed = listCommands(repo);
        expect(listed.commands.map((one) => one.name)).toEqual(['fine']);
        expect(listed.findings.map((one) => one.field)).toEqual([
            'commands[0].run',
            'commands[1].run',
            'commands[3].depends_on'
        ]);
        expect(listed.findings.every((one) => one.file.endsWith('commands.yml'))).toBe(true);
    });

    it('makes a finding of a commands key that is a map, and of text that is not YAML', () => {
        const repo = plantRepo();
        plant(repo, '.oculus/commands.yml', 'commands:\n  build: make\n');
        expect(fields(repo)).toEqual(['commands']);
        expect(names(repo)).toEqual([]);
        plant(repo, '.oculus/commands.yml', 'commands: [unclosed\n  - : :\n');
        const listed = listCommands(repo);
        expect(listed.commands).toEqual([]);
        expect(listed.findings).toHaveLength(1);
        expect(listed.findings[0].file.endsWith('commands.yml')).toBe(true);
    });

    it('lists nothing and finds nothing for a repository without the file', () => {
        expect(listCommands(plantRepo())).toEqual({ commands: [], findings: [] });
    });
});

describe('the folder of a command', () => {
    it('leaves out a cwd that climbs out, is absolute, or is a link leading out', () => {
        const repo = plantRepo({}, ['inside']);
        const outside = plantRepo();
        symlinkSync(outside, join(repo, 'link'));
        plant(
            repo,
            '.oculus/commands.yml',
            commandsYml(
                '  - { name: up, run: a, cwd: ../x }\n' +
                    '  - { name: abs, run: b, cwd: /etc }\n' +
                    '  - { name: link, run: c, cwd: link }\n' +
                    '  - { name: in, run: d, cwd: inside }\n'
            )
        );
        expect(names(repo)).toEqual(['in']);
        expect(fields(repo)).toEqual(['commands[0].cwd', 'commands[1].cwd', 'commands[2].cwd']);
        expect(listCommands(repo).findings.map((one) => one.message)).toEqual([
            'must be a folder inside the repository, not one above it',
            'must be a folder inside the repository, not an absolute path',
            'is a link that leads out of the repository'
        ]);
    });

    it('leaves out a cwd that is not a folder of the repository', () => {
        const repo = plantRepo();
        writeFileSync(join(repo, 'afile'), 'x');
        plant(
            repo,
            '.oculus/commands.yml',
            commandsYml(
                '  - { name: gone, run: a, cwd: nowhere }\n  - { name: file, run: b, cwd: afile }\n'
            )
        );
        expect(names(repo)).toEqual([]);
        expect(fields(repo)).toEqual(['commands[0].cwd', 'commands[1].cwd']);
    });
});

describe('names and defaults', () => {
    it('leaves out an empty, blank, over-long or tabbed name, and a blank run', () => {
        const repo = plantRepo();
        const long = 'n'.repeat(NAME_MAX + 1);
        plant(
            repo,
            '.oculus/commands.yml',
            commandsYml(
                "  - { name: '', run: a }\n" +
                    "  - { name: '   ', run: a }\n" +
                    `  - { name: ${long}, run: a }\n` +
                    '  - { name: "a\\tb", run: a }\n' +
                    '  - { name: blankrun, run: "  " }\n' +
                    `  - { name: ${'m'.repeat(NAME_MAX)}, run: a }\n`
            )
        );
        expect(names(repo)).toEqual(['m'.repeat(NAME_MAX)]);
        expect(fields(repo)).toEqual([
            'commands[0].name',
            'commands[1].name',
            'commands[2].name',
            'commands[3].name',
            'commands[4].run'
        ]);
    });

    it('keeps the first of a name repeated in one source', () => {
        const repo = plantRepo();
        plant(
            repo,
            '.oculus/commands.yml',
            commandsYml('  - { name: a, run: first }\n  - { name: a, run: second }\n')
        );
        const listed = listCommands(repo);
        expect(listed.commands.map((one) => one.run)).toEqual(['first']);
        expect(listed.findings.map((one) => one.field)).toEqual(['commands[1].name']);
    });

    it('ignores a second default build and a second default test', () => {
        const repo = plantRepo();
        plant(
            repo,
            '.oculus/commands.yml',
            commandsYml(
                '  - { name: a, run: x, default: build }\n' +
                    '  - { name: b, run: y, default: build }\n' +
                    '  - { name: c, run: z, default: test }\n' +
                    '  - { name: d, run: w, default: test }\n'
            )
        );
        const listed = listCommands(repo);
        expect(listed.commands.map((one) => [one.name, one.default])).toEqual([
            ['a', 'build'],
            ['b', undefined],
            ['c', 'test'],
            ['d', undefined]
        ]);
        expect(listed.findings.map((one) => one.field)).toEqual([
            'commands[1].default',
            'commands[3].default'
        ]);
    });

    it('refuses a default that is neither build nor test', () => {
        const repo = plantRepo();
        plant(
            repo,
            '.oculus/commands.yml',
            commandsYml('  - { name: a, run: x, default: deploy }\n')
        );
        expect(fields(repo)).toEqual(['commands[0].default']);
        expect(names(repo)).toEqual([]);
    });
});

describe('~/.oculus/commands.json', () => {
    it('lists to a repository only the commands written under its own path', () => {
        const one = plantRepo();
        const two = plantRepo();
        mkdirSync(join(home, '.oculus'));
        writeFileSync(
            join(home, '.oculus', 'commands.json'),
            JSON.stringify({
                [one]: [{ name: 'lint', run: 'npm run lint' }],
                [two]: [{ name: 'doc', run: 'make doc', default: 'build' }]
            })
        );
        expect(listCommands(one).commands).toEqual([
            { name: 'lint', run: 'npm run lint', cwd: one, depends_on: [], source: 'saved' }
        ]);
        expect(listCommands(two).commands).toEqual([
            {
                name: 'doc',
                run: 'make doc',
                cwd: two,
                depends_on: [],
                default: 'build',
                source: 'saved'
            }
        ]);
    });

    it('lists a name written in the file and in the form, the file first, and resolves to the file', () => {
        const repo = plantRepo();
        plant(
            repo,
            '.oculus/commands.yml',
            commandsYml(
                '  - { name: build, run: from-file }\n  - { name: after, run: x, depends_on: [build] }\n'
            )
        );
        mkdirSync(join(home, '.oculus'));
        writeFileSync(
            join(home, '.oculus', 'commands.json'),
            JSON.stringify({ [repo]: [{ name: 'build', run: 'from-form' }] })
        );
        const listed = listCommands(repo);
        expect(listed.commands.map((one) => [one.name, one.run, one.source])).toEqual([
            ['build', 'from-file', 'file'],
            ['after', 'x', 'file'],
            ['build', 'from-form', 'saved']
        ]);
        const chain = resolveChain(listed.commands, 'after', 'file');
        expect('chain' in chain && chain.chain.map((one) => one.run)).toEqual(['from-file', 'x']);
    });

    it('makes a finding of a file that is not a map of lists, and keeps the other sources', () => {
        const repo = plantRepo();
        plant(repo, '.oculus/commands.yml', commandsYml('  - { name: a, run: x }\n'));
        mkdirSync(join(home, '.oculus'));
        writeFileSync(join(home, '.oculus', 'commands.json'), '["not", "a map"]');
        const listed = listCommands(repo);
        expect(listed.commands.map((one) => one.name)).toEqual(['a']);
        expect(listed.findings).toHaveLength(1);
        expect(listed.findings[0].file.endsWith('commands.json')).toBe(true);
    });
});
