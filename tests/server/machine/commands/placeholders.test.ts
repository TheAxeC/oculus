// Layer 4, server test. The placeholders of a chain's command lines: `${file}` and its relatives
// become `${OCULUS_ARG_<n>+"$OCULUS_ARG_<n>"}` and their values an environment, and a real
// `/bin/sh`, `bash` and `zsh` run the lines with that environment, so a selection that holds shell
// syntax runs nothing and arrives whole in every context the line writes the placeholder in.
//
// What this does NOT cover: a line that evaluates the value itself (`eval`, `sh -c`, `$((...))`
// arithmetic in bash), which runs it by design; tmux setting the environment of a task terminal
// (tests/server/machine/pty/task.test.ts); and the page building the context.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { describe, expect } from 'vitest';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import type { CommandContext } from '../../../../src/lib/data/model/index.ts';
import { fillPlaceholders } from '../../../../src/lib/server/machine/commands/placeholders.ts';

const REPO = '/r';
const CATALOG = {
    'server.commands.no_file': 'No value for {0}: open a file in a source tab first',
    'server.commands.no_selection': 'No value for {0}: select text in a source tab first',
    'server.commands.nul': 'The value of {0} holds a NUL character'
};
const CONTEXT = { file: '/r/a b.tex', line: 7, selectedText: "'; rm -rf /'" };

/** The text a variable stands as in a line. */
const ref = (n: number) => `\${OCULUS_ARG_${n}+"$OCULUS_ARG_${n}"}`;

/** The filled lines and environment, or a failure naming the refusal. */
function filled(
    runs: string[],
    context: CommandContext = CONTEXT
): { lines: string[]; env: Record<string, string> } {
    const answer = fillPlaceholders(runs, context, REPO, CATALOG);
    if ('error' in answer) throw new Error(answer.error);
    return answer;
}

describe('fillPlaceholders', () => {
    it('replaces each placeholder by its variable and sets the value in the environment', () => {
        expect(filled(['echo ${fileBasenameNoExtension} ${lineNumber}'])).toEqual({
            lines: [`echo ${ref(1)} ${ref(2)}`],
            env: { OCULUS_ARG_1: 'a b', OCULUS_ARG_2: '7' }
        });
    });

    it('gives every placeholder the page can give its value', () => {
        const answer = filled(
            [
                '${file}|${fileDirname}|${fileBasename}|${fileBasenameNoExtension}|${lineNumber}|${workspaceFolder}'
            ],
            { file: '/r/sub/main.tar.gz', line: 12, selectedText: '' }
        );
        expect(Object.values(answer.env)).toEqual([
            '/r/sub/main.tar.gz',
            '/r/sub',
            'main.tar.gz',
            'main.tar',
            '12',
            '/r'
        ]);
    });

    it('names one placeholder by one variable across the lines of a chain', () => {
        expect(filled(['cat ${file}', 'wc ${file} ${selectedText}'])).toEqual({
            lines: [`cat ${ref(1)}`, `wc ${ref(1)} ${ref(2)}`],
            env: { OCULUS_ARG_1: '/r/a b.tex', OCULUS_ARG_2: "'; rm -rf /'" }
        });
    });

    it('does not read a placeholder inside a value', () => {
        const answer = filled(['${selectedText} ${file}'], {
            file: '/r/x.c',
            line: 1,
            selectedText: '${file}'
        });
        expect(answer.env).toEqual({ OCULUS_ARG_1: '${file}', OCULUS_ARG_2: '/r/x.c' });
    });

    it('refuses a placeholder the page has no value for, naming it from the catalog', () => {
        const refused = (runs: string[], context: object) =>
            fillPlaceholders(runs, context, REPO, CATALOG);
        expect(refused(['cat ${file}'], {})).toEqual({
            error: 'No value for ${file}: open a file in a source tab first'
        });
        expect(refused(['go ${lineNumber}'], { file: '/r/x' })).toEqual({
            error: 'No value for ${lineNumber}: open a file in a source tab first'
        });
        expect(
            refused(['true', 'say ${selectedText}'], { file: '/r/x', selectedText: '' })
        ).toEqual({ error: 'No value for ${selectedText}: select text in a source tab first' });
        expect(refused(['say ${selectedText}'], { selectedText: 'a\u0000b' })).toEqual({
            error: 'The value of ${selectedText} holds a NUL character'
        });
    });

    it('needs no context for the repository', () => {
        expect(fillPlaceholders(['cd ${workspaceFolder}'], {}, REPO, CATALOG)).toEqual({
            lines: [`cd ${ref(1)}`],
            env: { OCULUS_ARG_1: '/r' }
        });
    });

    it('leaves any other ${...} and a line with no placeholder as written', () => {
        expect(filled(['echo ${env:HOME} ${HOME} ${files} $file', 'make -j4'])).toEqual({
            lines: ['echo ${env:HOME} ${HOME} ${files} $file', 'make -j4'],
            env: {}
        });
    });
});

/** The shells a task terminal's line may run under: tmux runs it with the reader's shell. */
const SHELLS = ['/bin/sh', '/bin/bash', '/bin/zsh'].filter((shell) => existsSync(shell));

/** Run a line through a shell in an empty folder with the filled environment; what it made. */
function runIn(
    line: string,
    env: Record<string, string>,
    shell = '/bin/sh'
): { stdout: string; made: string[] } {
    const folder = scratchDir('oculus-placeholders-');
    const ran = spawnSync(shell, ['-c', line], {
        cwd: folder,
        encoding: 'utf8',
        env: { PATH: process.env.PATH ?? '/usr/bin:/bin', ...env }
    });
    return { stdout: ran.stdout, made: readdirSync(folder) };
}

describe('a selection run through a real shell', () => {
    // Every line the review got a selection to run through, and its other cases. Arithmetic,
    // `$((${selectedText}))`, evaluates the value in bash by design and is not one of them.
    const LINES = [
        'echo ${selectedText}',
        'echo "${selectedText}"',
        "echo '${selectedText}'",
        'echo \\${selectedText}',
        'echo "\\${selectedText}"',
        "true # it's\necho '${selectedText}'",
        "true # don't\necho ${selectedText}",
        "echo $'${selectedText}'",
        'echo $"${selectedText}"',
        'echo "$(echo \'${selectedText}\')"',
        'echo "$(echo \\"${selectedText}\\")"',
        'echo "$(echo "${selectedText}")"',
        'echo `echo ${selectedText}`',
        "cat <<'EOF'\n${selectedText}\nEOF",
        'cat <<EOF\n${selectedText}\nEOF',
        'cat <<-EOF\n${selectedText}\nEOF',
        "cat <<EOF\nit's\nEOF\necho '${selectedText}'",
        "echo a\\ #'\n${selectedText}'",
        "echo a\\\n#'\n${selectedText}'",
        'echo $${selectedText}',
        'echo a#b ${selectedText}'
    ];
    const SELECTIONS = [
        '$(touch x)',
        '; touch y #',
        '`touch z`',
        '\\\'"; touch v #',
        'a[$(touch w)]',
        "'; touch u; '",
        'q\ntouch t'
    ];

    it('creates nothing, for each line, each selection and each shell', () => {
        const ran: string[] = [];
        for (const shell of SHELLS) {
            for (const line of LINES) {
                for (const selectedText of SELECTIONS) {
                    const answer = filled([line], { file: '/r/x', line: 1, selectedText });
                    const { made } = runIn(answer.lines[0], answer.env, shell);
                    if (made.length > 0)
                        ran.push(`${shell} ${JSON.stringify(line)}: ${made.join(', ')}`);
                }
            }
        }
        expect(SHELLS).toContain('/bin/sh');
        expect(ran).toEqual([]);
    });

    it('hands the selection over whole, bare, inside double quotes, in a here-doc and in $(...)', () => {
        const forms = [
            ["printf '%s' ${selectedText}", (text: string) => text],
            ['printf \'%s\' "<${selectedText}>"', (text: string) => `<${text}>`],
            ['cat <<EOF\n<${selectedText}>\nEOF', (text: string) => `<${text}>\n`],
            ["printf '%s' \"$(printf '%s' ${selectedText})\"", (text: string) => text]
        ] as const;
        for (const shell of SHELLS) {
            for (const selectedText of [...SELECTIONS, 'a  *  b']) {
                for (const [line, expected] of forms) {
                    const answer = filled([line], { file: '/r/x', selectedText });
                    const said = runIn(answer.lines[0], answer.env, shell).stdout;
                    // `$(...)` drops the line breaks that end its output, as it does for any text.
                    const wanted = line.includes('$(')
                        ? expected(selectedText).replace(/\n+$/, '')
                        : expected(selectedText);
                    expect(said, `${shell} ${line} ${selectedText}`).toBe(wanted);
                }
            }
        }
    });
});
