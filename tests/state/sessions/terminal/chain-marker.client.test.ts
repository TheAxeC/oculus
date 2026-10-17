// Layer 2, client-state tests. The marker a project command's chain prints before each command,
// concealed (data/helpers/run/marker.ts `MARKER_FORMAT`), read by the commands store
// (state/sessions/terminal/commands.svelte.ts) from a task terminal's output as tmux draws it: the
// concealed marker still moves the store to the next command of the chain, so an error line after
// it is read in that command's folder; the line under it is in the folder of the command before.
//
// The store is real; the terminals, the entities and the workspaces are stubs. It does not cover
// the terminal drawing none of the marker's words, which the look does.

import { expect, it } from 'vitest';
import type { CommandDiagnostic } from '../../../../src/lib/data/model/index.ts';
import { createQueries } from '../../../../src/lib/state/client/queries/queries.svelte.ts';
import { stubbedCommands } from './commands-fixture.ts';

it('reads a concealed chain marker as the start of the next command, in its folder', () => {
    let listed: unknown[] = [];
    const { commands } = stubbedCommands(() => listed);
    createQueries();
    listed = [
        {
            id: 't1',
            task: true,
            exit: null,
            pid: 1,
            job: {
                repo: '/w/a',
                name: 'test',
                source: 'command',
                token: 'tok',
                chain: [
                    { name: 'build', cwd: '/w/a' },
                    { name: 'test', cwd: '/w/a/sub' }
                ]
            }
        }
    ];
    commands.note(
        't1',
        '\u001b[8mtok build\u001b[28m\r\nsrc/x.ts:1:2: error: first\r\n' +
            '\u001b[8mtok test\u001b[0m\r\nlib/y.ts:3:4: error: second\r\n',
        false
    );
    expect(
        commands.commandDiagnostics().map((one: CommandDiagnostic) => `${one.file}:${one.line}`)
    ).toEqual(['src/x.ts:1', 'sub/lib/y.ts:3']);
});
