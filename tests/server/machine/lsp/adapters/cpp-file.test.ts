// Layer 4, server test. The reader of a repository's `.oculus/cpp.yml`
// (server/machine/lsp/adapters/clangd/cpp-file.ts): what each value that does not read is told
// as, a finding that names the key, and that the entry is skipped and the rest of the file read.

import { mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import { readCppFile } from '../../../../../src/lib/server/machine/lsp/adapters/clangd/cpp-file.ts';

/** A repository holding the given `.oculus/cpp.yml` text, a database in `build`, and a link out. */
function repoWith(yml: string | null): string {
    const base = realpathSync(scratchDir('oculus-cpp-'));
    const repo = join(base, 'repo');
    mkdirSync(join(repo, 'build'), { recursive: true });
    mkdirSync(join(repo, 'empty'), { recursive: true });
    writeFileSync(join(repo, 'build', 'compile_commands.json'), '[]');
    mkdirSync(join(base, 'elsewhere'));
    writeFileSync(join(base, 'elsewhere', 'compile_commands.json'), '[]');
    symlinkSync(join(base, 'elsewhere'), join(repo, 'linked'));
    if (yml !== null) {
        mkdirSync(join(repo, '.oculus'));
        writeFileSync(join(repo, '.oculus', 'cpp.yml'), yml);
    }
    return repo;
}

const ONE = '- name: ok\n    fallback_flags: ["-std=c++20"]\n';

/** A message the finding must match: its text, or a pattern for a text with a line number. */
type Said = string | RegExp;

type Row = {
    name: string;
    /** The whole text of the repository's `.oculus/cpp.yml`. */
    yml: string;
    /** The names of the configurations that are read. */
    reads: string[];
    /** The finding of each value that did not read: its key and what is said of it. */
    findings: [string, Said][];
};

const rows: Row[] = [
    ...(
        [
            [
                'an empty name',
                '- name: ""',
                'configurations[0].name',
                'must be text that is not empty'
            ],
            [
                'a name that is not text',
                '- name: 3',
                'configurations[0].name',
                'must be text that is not empty'
            ],
            [
                'no name',
                '- fallback_flags: []',
                'configurations[0].name',
                'must be text that is not empty'
            ],
            [
                'a name of a database oculus found',
                '- name: build/debug',
                'configurations[0].name',
                'is the folder of a compile database oculus found'
            ],
            [
                'a compile_commands above the repository',
                '- name: a\n    compile_commands: ../elsewhere',
                'configurations[0].compile_commands',
                'must be a folder inside the repository, not one above it'
            ],
            [
                'an absolute compile_commands',
                '- name: a\n    compile_commands: /usr/lib',
                'configurations[0].compile_commands',
                'must be a folder of the repository, written relative to it'
            ],
            [
                'a compile_commands that is a link out',
                '- name: a\n    compile_commands: linked',
                'configurations[0].compile_commands',
                'is a link that leads out of the repository'
            ],
            [
                'a compile_commands folder holding no database',
                '- name: a\n    compile_commands: empty',
                'configurations[0].compile_commands',
                'must hold a compile_commands.json'
            ],
            [
                'a compile_commands folder that is not there',
                '- name: a\n    compile_commands: nowhere',
                'configurations[0].compile_commands',
                'must be a folder of the repository that exists'
            ],
            [
                'a compile_commands that is not text',
                '- name: a\n    compile_commands: 4',
                'configurations[0].compile_commands',
                'must be text'
            ],
            [
                'fallback_flags that is not a list',
                '- name: a\n    fallback_flags: "-O2"',
                'configurations[0].fallback_flags',
                'must be a list of text'
            ],
            [
                'fallback_flags holding a number',
                '- name: a\n    fallback_flags: ["-O2", 3]',
                'configurations[0].fallback_flags',
                'must be a list of text'
            ],
            [
                'an unknown key',
                '- name: a\n    compiler: gcc',
                'configurations[0].compiler',
                'is not a key of a configuration'
            ],
            [
                'an entry that is not a map',
                '- just text',
                'configurations[0]',
                'must be a map of the fields'
            ]
        ] as [string, string, string, Said][]
    ).map(([name, wrong, field, said]): Row => ({
        name: `skips an entry with ${name} and reads the entries after it`,
        yml: `configurations:\n  ${wrong}\n  ${ONE}`,
        reads: ['ok'],
        findings: [[field, said]]
    })),
    {
        name: 'skips the second of two configurations that share a name',
        yml: 'configurations:\n  - name: dup\n  - name: dup\n  - name: other\n',
        reads: ['dup', 'other'],
        findings: [['configurations[1].name', 'repeats a name of this list']]
    },
    {
        name: 'reports a file that is not YAML with its line and reads no configuration',
        yml: 'configurations:\n  - name: [unclosed\n',
        reads: [],
        findings: [['', /^is not YAML/]]
    },
    {
        name: 'reports a top-level key that is not configurations and reads the list',
        yml: `extra: 1\nconfigurations:\n  ${ONE}`,
        reads: ['ok'],
        findings: [['extra', 'is not a key of this file']]
    },
    {
        name: 'reports a configurations value that is not a list',
        yml: 'configurations: 3\n',
        reads: [],
        findings: [['configurations', 'must be a list of configurations']]
    }
];

describe('.oculus/cpp.yml', () => {
    it.each(rows)('$name', ({ yml, reads, findings }) => {
        const repo = repoWith(yml);
        const read = readCppFile(repo, ['build/debug']);
        expect(read.configurations.map((one) => one.name)).toEqual(reads);
        expect(read.findings).toEqual(
            findings.map(([field, said]) => ({
                file: join(repo, '.oculus', 'cpp.yml'),
                field,
                message: typeof said === 'string' ? said : (expect.stringMatching(said) as string)
            }))
        );
    });
});
