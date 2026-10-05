// Layer 4, server test. The placeholders of a chain's command lines: `${file}` and its relatives
// become `${OCULUS_ARG_<n>+"$OCULUS_ARG_<n>"}` and their values an environment. The describe, which
// starts processes and is tagged slow, runs them in a real `/bin/sh`, `bash` and `zsh` with that
// environment, so a selection that holds shell syntax runs nothing and arrives whole in every
// context the line writes the placeholder in.
//
// What this does NOT cover: a line that evaluates the value itself (`eval`, `sh -c`, `$((...))`
// arithmetic in bash), which runs it by design; and the page building the context.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { describe, expect } from 'vitest';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import type { CommandContext } from '../../../../src/lib/data/model/index.ts';
import { fillPlaceholders } from '../../../../src/lib/server/machine/commands/placeholders.ts';

const REPO = '/r';
const CONTEXT = { file: '/r/a b.tex', line: 7, selectedText: "'; rm -rf /'" };

/** The filled lines and environment, or a failure naming the refusal. */
function filled(
    runs: string[],
    context: CommandContext = CONTEXT
): { lines: string[]; env: Record<string, string> } {
    const answer = fillPlaceholders(runs, context, REPO);
    if ('error' in answer) throw new Error(answer.error);
    return answer;
}

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

describe('a selection run through a real shell', { tags: ['slow'] }, () => {
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

    // One case per shell: the cases run apart, each inside the limit of a case, and a failure names
    // the shell it happened under.
    describe('creates nothing, for each line, each selection and each shell', () => {
        for (const shell of SHELLS) {
            it(`under ${shell}`, () => {
                const ran: string[] = [];
                for (const line of LINES) {
                    for (const selectedText of SELECTIONS) {
                        const answer = filled([line], { file: '/r/x', line: 1, selectedText });
                        const { made } = runIn(answer.lines[0], answer.env, shell);
                        if (made.length > 0)
                            ran.push(`${JSON.stringify(line)}: ${made.join(', ')}`);
                    }
                }
                expect(ran).toEqual([]);
            });
        }
    });
});
